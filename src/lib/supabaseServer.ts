import { createClient } from '@supabase/supabase-js';
import { Restaurant, RestaurantCategory } from '@/types/restaurant';

// Supabase 테이블 행(Row) 타입 정의
export interface DbRestaurant {
  id?: string; // UUID (자동생성)
  origin_id: string; // 공공데이터 원본 고유번호
  source: string; // 데이터 출처
  name: string; // 상호명
  category: string; // 카테고리 코드 (KOREAN 등)
  category_name: string; // 원본 소/중분류 업종명
  road_address: string | null;
  address: string | null;
  tel: string | null;
  lat: number | null;
  lng: number | null;
  has_valid_coords: boolean;
  status: string | null; // 영업 상태 (제공될 때만 저장)
  tags: string[];
  created_at?: string;
  updated_at?: string;
  distance_meter?: number; // PostGIS ST_Distance 계산 결과 (미터 단위)
}

// 서버 전용 Supabase 클라이언트 생성 함수
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // 서버 비밀 키(service_role)를 최우선으로 사용, 없을 경우 anon_key fallback
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// DB Row -> 클라이언트 Restaurant 모델 변환 유틸
export function mapDbToRestaurant(row: DbRestaurant): Restaurant {
  return {
    id: row.origin_id,
    source: row.source || '소상공인시장진흥공단 공공데이터포털',
    name: row.name,
    category: (row.category as RestaurantCategory) || 'KOREAN',
    categoryName: row.category_name,
    address: row.address || '지번 주소 없음',
    roadAddress: row.road_address || row.address || '도로명 주소 없음',
    tel: row.tel || undefined,
    lat: row.lat,
    lng: row.lng,
    hasValidCoords: Boolean(row.has_valid_coords),
    // PostGIS에서 계산된 미터 단위 직선거리
    distanceMeter: typeof row.distance_meter === 'number' ? Math.round(row.distance_meter) : undefined,
    status: row.status,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isSampleData: false,
    updatedAt: row.updated_at,
    ratingNotice: '공공데이터 평점 미제공',
    reviewNotice: '방문자 리뷰 미제공',
    openingHoursNotice: row.status ? `영업상태: ${row.status}` : '영업시간은 매장 문의 권장',
  };
}

// 공공데이터/클라이언트 Restaurant 모델 -> DB Row 변환 유틸
export function mapRestaurantToDb(item: Restaurant): DbRestaurant {
  return {
    origin_id: item.id,
    source: item.source || '소상공인시장진흥공단 공공데이터포털',
    name: item.name,
    category: item.category,
    category_name: item.categoryName,
    road_address: item.roadAddress || null,
    address: item.address || null,
    tel: item.tel || null,
    lat: item.lat,
    lng: item.lng,
    has_valid_coords: item.hasValidCoords,
    status: item.status || null,
    tags: item.tags || [],
  };
}
