import { NextResponse } from 'next/server';
import { Restaurant, RestaurantCategory } from '@/types/restaurant';
import {
  getSupabaseServerClient,
  mapRestaurantToDb,
  mapDbToRestaurant,
  DbRestaurant,
} from '@/lib/supabaseServer';

// 대한민국 영역 내 유효한 위·경도 좌표인지 검증
function parseCoordinate(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value).trim());
  if (isNaN(num) || num <= 0) return null;
  if (num < min || num > max) return null;
  return num;
}

// 공공데이터 업종 분류 매핑 함수
function mapCategory(mclsNm: string = '', sclsNm: string = ''): { category: RestaurantCategory; categoryName: string } {
  const combined = `${mclsNm} ${sclsNm}`;

  if (combined.includes('중식') || combined.includes('중국집') || combined.includes('마라')) {
    return { category: 'CHINESE', categoryName: sclsNm || '중식' };
  }
  if (combined.includes('일식') || combined.includes('초밥') || combined.includes('돈가스') || combined.includes('라멘') || combined.includes('소바')) {
    return { category: 'JAPANESE', categoryName: sclsNm || '일식' };
  }
  if (combined.includes('서양식') || combined.includes('경양식') || combined.includes('피자') || combined.includes('파스타') || combined.includes('스테이크')) {
    return { category: 'WESTERN', categoryName: sclsNm || '양식' };
  }
  if (combined.includes('카페') || combined.includes('커피') || combined.includes('비알코올') || combined.includes('제과') || combined.includes('베이커리') || combined.includes('아이스크림') || combined.includes('디저트')) {
    return { category: 'CAFE', categoryName: sclsNm || '카페·디저트' };
  }
  if (combined.includes('분식') || combined.includes('떡볶이') || combined.includes('김밥') || combined.includes('순대') || combined.includes('튀김') || combined.includes('간이')) {
    return { category: 'SNACK', categoryName: sclsNm || '분식' };
  }
  return { category: 'KOREAN', categoryName: sclsNm || mclsNm || '한식' };
}

// 서버 직선거리 계산 헬퍼 (단위: 미터) - PostGIS 미적용 시 fallback용
function calculateHaversineDistanceMeter(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat') || '37.54458';
    const lngStr = searchParams.get('lng') || '127.05597';
    const radiusStr = searchParams.get('radius') || '1000';
    const pageStr = searchParams.get('page') || '1';
    const numOfRowsStr = searchParams.get('numOfRows') || '20';
    const category = searchParams.get('category') || 'ALL';
    const query = (searchParams.get('query') || '').trim();

    const page = parseInt(pageStr, 10);
    const numOfRows = parseInt(numOfRowsStr, 10);
    const radius = parseInt(radiusStr, 10);
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    const supabase = getSupabaseServerClient();
    const apiKey = process.env.DATA_GO_KR_API_KEY;

    // --------------------------------------------------------------------------
    // 1. PostGIS 기반 RPC (nearby_restaurants) 우선 조회 시도
    // --------------------------------------------------------------------------
    if (supabase) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('nearby_restaurants', {
          user_lat: lat,
          user_lng: lng,
          radius_meter: radius,
          filter_category: category,
          search_query: query,
          page_limit: numOfRows,
          page_offset: (page - 1) * numOfRows,
        });

        // PostGIS 쿼리 성공 및 결과가 존재하는 경우 즉시 반환
        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          const restaurants: Restaurant[] = rpcData.map((row) => mapDbToRestaurant(row as DbRestaurant));
          return NextResponse.json({
            success: true,
            source: 'supabase_postgis',
            distanceType: 'straight_line', // 직선거리 명시
            count: restaurants.length,
            page,
            numOfRows,
            radiusMeter: radius,
            data: restaurants,
          });
        }
      } catch (rpcErr) {
        console.warn('PostGIS RPC nearby_restaurants call failed:', rpcErr);
      }
    }

    // --------------------------------------------------------------------------
    // 2. DB에 데이터가 없거나 첫 수집인 경우: 공공데이터포털 API 호출 & Supabase Upsert
    // --------------------------------------------------------------------------
    let fetchedRestaurants: Restaurant[] = [];
    let isPublicApiSuccess = false;

    if (apiKey) {
      try {
        // 공공데이터 반경 조회 (indsLclsCd=I2: 음식점)
        const apiUrl = `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius?serviceKey=${encodeURIComponent(
          apiKey
        )}&pageNo=${page}&numOfRows=${numOfRows}&radius=${radius}&cx=${lng}&cy=${lat}&indsLclsCd=I2&type=json`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(apiUrl, {
          signal: controller.signal,
          next: { revalidate: 120 },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: any[] = data.body?.items || [];

          fetchedRestaurants = items.map((item) => {
            const { category: cat, categoryName } = mapCategory(item.indsMclsNm, item.indsSclsNm);
            const parsedLat = parseCoordinate(item.lat, 33, 39);
            const parsedLng = parseCoordinate(item.lon, 124, 132);
            const hasValidCoords = parsedLat !== null && parsedLng !== null;

            const fullName =
              item.brchNm && item.brchNm.trim() !== ''
                ? `${item.bizesNm} ${item.brchNm}`
                : item.bizesNm;

            const tags = [item.indsSclsNm, item.indsMclsNm].filter(Boolean);
            const rawStatus = item.bizesStatNm || item.statNm || item.status || null;

            // 직선거리 계산 (미터 단위)
            const distanceMeter = hasValidCoords && parsedLat && parsedLng
              ? calculateHaversineDistanceMeter(lat, lng, parsedLat, parsedLng)
              : undefined;

            return {
              id: String(item.bizesId || `store-${Math.random()}`),
              source: '소상공인시장진흥공단 공공데이터포털',
              name: fullName,
              category: cat,
              categoryName,
              address: item.lnoAdr || '지번 주소 정보 없음',
              roadAddress: item.rdnmAdr || item.lnoAdr || '주소 정보 없음',
              tel: item.telNo && item.telNo.trim() !== '' ? item.telNo : undefined,
              lat: parsedLat,
              lng: parsedLng,
              hasValidCoords,
              distanceMeter,
              status: rawStatus ? String(rawStatus) : null,
              tags,
              isSampleData: false,
              ratingNotice: '공공데이터 평점 미제공',
              reviewNotice: '방문자 리뷰 미제공',
              openingHoursNotice: rawStatus ? `영업상태: ${rawStatus}` : '영업시간은 매장 문의 권장',
            };
          });

          isPublicApiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('Public API call warning:', apiErr instanceof Error ? apiErr.message : apiErr);
      }
    }

    // --------------------------------------------------------------------------
    // 3. 수집된 공공데이터를 Supabase DB에 Upsert (PostGIS location 자동 트리거)
    // --------------------------------------------------------------------------
    if (supabase && fetchedRestaurants.length > 0) {
      try {
        const dbRows: DbRestaurant[] = fetchedRestaurants.map(mapRestaurantToDb);
        await supabase
          .from('restaurants')
          .upsert(dbRows, {
            onConflict: 'source,origin_id',
            ignoreDuplicates: false,
          });

        // Upsert 후 PostGIS RPC 재호출 시도 (DB 기준 정렬 및 반경 필터링)
        const { data: freshRpcData, error: freshRpcError } = await supabase.rpc('nearby_restaurants', {
          user_lat: lat,
          user_lng: lng,
          radius_meter: radius,
          filter_category: category,
          search_query: query,
          page_limit: numOfRows,
          page_offset: (page - 1) * numOfRows,
        });

        if (!freshRpcError && Array.isArray(freshRpcData) && freshRpcData.length > 0) {
          const restaurants: Restaurant[] = freshRpcData.map((row) => mapDbToRestaurant(row as DbRestaurant));
          return NextResponse.json({
            success: true,
            source: 'supabase_postgis',
            distanceType: 'straight_line',
            count: restaurants.length,
            page,
            numOfRows,
            radiusMeter: radius,
            data: restaurants,
          });
        }
      } catch (dbErr) {
        console.warn('Supabase DB upsert/rpc failed:', dbErr);
      }
    }

    // --------------------------------------------------------------------------
    // 4. PostGIS 미적용 시 서버단 필터링 및 직선거리 정렬 fallback
    // --------------------------------------------------------------------------
    if (isPublicApiSuccess && fetchedRestaurants.length > 0) {
      let filtered = fetchedRestaurants;

      // 반경 필터링 (반경 안과 밖 엄격 구분)
      filtered = filtered.filter((item) => {
        if (item.distanceMeter !== undefined) {
          return item.distanceMeter <= radius;
        }
        return true;
      });

      // 업종 필터링
      if (category !== 'ALL') {
        filtered = filtered.filter((item) => item.category === category);
      }

      // 검색어 필터링
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.roadAddress.toLowerCase().includes(q) ||
            item.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }

      // 직선거리 기준 오름차순 정렬
      filtered.sort((a, b) => {
        if (a.distanceMeter === undefined && b.distanceMeter === undefined) return 0;
        if (a.distanceMeter === undefined) return 1;
        if (b.distanceMeter === undefined) return -1;
        return a.distanceMeter - b.distanceMeter;
      });

      return NextResponse.json({
        success: true,
        source: 'server_fallback',
        distanceType: 'straight_line',
        count: filtered.length,
        page,
        numOfRows,
        radiusMeter: radius,
        data: filtered,
      });
    }

    // 5. 모든 수단 실패 시
    return NextResponse.json(
      {
        success: false,
        error: '주변 음식점 목록을 조회할 수 없습니다.',
        code: 'NO_DATA_AVAILABLE',
        count: 0,
        data: [],
      },
      { status: 500 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('bail out of prerendering')) {
      throw error;
    }
    const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    console.error('API /api/restaurants fatal error:', message);
    return NextResponse.json(
      { success: false, error: message, code: 'SERVER_INTERNAL_ERROR', data: [] },
      { status: 500 }
    );
  }
}
