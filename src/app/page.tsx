'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import Header from '@/components/common/Header';
import SampleDataBanner from '@/components/common/SampleDataBanner';
import ViewToggle from '@/components/common/ViewToggle';
import SearchBar from '@/components/filter/SearchBar';
import CategoryFilter from '@/components/filter/CategoryFilter';
import DistanceFilter from '@/components/filter/DistanceFilter';
import RestaurantList from '@/components/restaurant/RestaurantList';
import RestaurantDetailModal from '@/components/restaurant/RestaurantDetailModal';
import LocationSelectorModal from '@/components/location/LocationSelectorModal';
import LocationPermissionBanner from '@/components/location/LocationPermissionBanner';
import KakaoMapWrapper from '@/components/map/KakaoMapWrapper';

import { SAMPLE_RESTAURANTS } from '@/data/sampleRestaurants';
import { DEFAULT_LOCATION } from '@/data/presetLocations';
import {
  Restaurant,
  RestaurantCategory,
  DistanceFilterType,
  LocationCoords,
  LocationPermissionState,
} from '@/types/restaurant';
import { calculateDistanceMeter } from '@/utils/distance';

export default function HomePage() {
  // 1. 위치 및 권한 상태 (사용자 위치는 브라우저 메모리 상태로만 관리되며 DB에 저장되지 않습니다)
  const [currentLocation, setCurrentLocation] = useState<LocationCoords>(DEFAULT_LOCATION);
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('prompt');
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // 2. 검색 & 필터 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<RestaurantCategory>('ALL');
  const [selectedDistance, setSelectedDistance] = useState<DistanceFilterType>('1km');

  // 검색어 디바운스 (사용자 입력 중 과도한 API 호출 방지: 280ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. 실제 공공데이터 로딩 및 페이징 상태 (기본 20건부터 조회)
  const [restaurantsData, setRestaurantsData] = useState<Restaurant[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSampleMode, setIsSampleMode] = useState<boolean>(false);

  // 4. 뷰 모드 & 상세 선택 상태
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [focusedRestaurantId, setFocusedRestaurantId] = useState<string | null>(null);

  // 거리 필터에 따른 API radius(m) 계산
  const getRadiusMeter = (dist: DistanceFilterType) => {
    switch (dist) {
      case '500m':
        return 500;
      case '1km':
        return 1000;
      case '3km':
        return 3000;
      default:
        return 1000;
    }
  };

  // 위치, 반경(500m/1km/3km), 업종, 검색어 변경 시 Supabase DB/PostGIS 기준 20건 검색
  useEffect(() => {
    let ignore = false;
    const radius = getRadiusMeter(selectedDistance);

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const queryParams = new URLSearchParams({
          lat: String(currentLocation.lat),
          lng: String(currentLocation.lng),
          radius: String(radius),
          category: selectedCategory,
          query: debouncedQuery,
          page: '1',
          numOfRows: '20',
        });

        const res = await fetch(`/api/restaurants?${queryParams.toString()}`);
        const json = await res.json();

        if (!ignore) {
          setCurrentPage(1);
          if (json.success && Array.isArray(json.data)) {
            setRestaurantsData(json.data);
            setTotalCount(json.totalCount || json.data.length);
            setIsSampleMode(false);
          } else {
            console.warn('API error, falling back to sample data:', json.error);
            setFetchError(json.error || '공공데이터를 조회할 수 없어 샘플 데이터가 표시됩니다.');
            setRestaurantsData(SAMPLE_RESTAURANTS);
            setTotalCount(SAMPLE_RESTAURANTS.length);
            setIsSampleMode(true);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to fetch real restaurants:', err);
          setFetchError('데이터베이스 서버와 통신할 수 없어 임시 데이터가 표시됩니다.');
          setRestaurantsData(SAMPLE_RESTAURANTS);
          setTotalCount(SAMPLE_RESTAURANTS.length);
          setIsSampleMode(true);
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [
    currentLocation.lat,
    currentLocation.lng,
    selectedDistance,
    selectedCategory,
    debouncedQuery,
  ]);

  // DB에서 추가 20건 더 불러오기 (동일한 검색/업종/반경 조건 유지)
  const handleLoadMore = async () => {
    if (isLoadingMore || isSampleMode) return;
    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const radius = getRadiusMeter(selectedDistance);
      const queryParams = new URLSearchParams({
        lat: String(currentLocation.lat),
        lng: String(currentLocation.lng),
        radius: String(radius),
        category: selectedCategory,
        query: debouncedQuery,
        page: String(nextPage),
        numOfRows: '20',
      });

      const res = await fetch(`/api/restaurants?${queryParams.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        // 기존 목록에 중복 없이 append
        setRestaurantsData((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newUniqueItems = json.data.filter((item: Restaurant) => !existingIds.has(item.id));
          return [...prev, ...newUniqueItems];
        });
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleManualRetry = () => {
    setIsLoading(true);
    setFetchError(null);
    setCurrentPage(1);
    const radius = getRadiusMeter(selectedDistance);

    fetch(`/api/restaurants?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=${radius}&page=1&numOfRows=20`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setRestaurantsData(json.data);
          setTotalCount(json.totalCount || json.data.length);
          setIsSampleMode(false);
        } else {
          setFetchError(json.error || '재시도에 실패했습니다.');
        }
      })
      .catch((err) => {
        setFetchError('네트워크 오류로 재시도하지 못했습니다.');
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  };

  // '내 주변 찾기' 버튼 클릭 시 브라우저 Geolocation 요청 핸들러
  // (개인정보 보호: 사용자 위치는 DB에 절대 저장되지 않음)
  const handleRequestGps = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = '사용하시는 브라우저에서는 위치 서비스를 지원하지 않습니다.';
      setLocationErrorMessage(msg);
      setPermissionState('unsupported');
      setIsLocationModalOpen(true);
      return;
    }

    setIsGpsLoading(true);
    setLocationErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGpsLoading(false);
        setIsUsingGps(true);
        setPermissionState('granted');
        setLocationErrorMessage(null);
        setCurrentLocation({
          name: '내 현재 위치',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        setIsGpsLoading(false);
        setIsUsingGps(false);
        setPermissionState('denied');

        let msg = '위치 정보를 가져올 수 없습니다.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = '브라우저 위치 권한이 차단되었습니다. 지역을 직접 선택해 주세요.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = '현재 위치(GPS) 신호를 수신할 수 없습니다. 지역을 직접 선택해 주세요.';
        } else if (error.code === error.TIMEOUT) {
          msg = '위치 확인 시간이 초과되었습니다 (8초). 지역을 직접 선택해 주세요.';
        }

        setLocationErrorMessage(msg);
        setIsLocationModalOpen(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleSelectLocation = (loc: LocationCoords) => {
    setCurrentLocation(loc);
    setIsUsingGps(false);
    setLocationErrorMessage(null);
  };

  // 지도와 목록에 표시할 최종 음식점 목록 (DB/PostGIS 우선, 샘플 모드 시 fallback 필터링)
  const displayedRestaurants = useMemo(() => {
    // 1. 실제 데이터 모드: 이미 DB/PostGIS 및 서버에서 거리계산·정렬·반경·업종·검색어 필터링이 완료됨
    if (!isSampleMode) {
      return restaurantsData.map((item) => {
        // DB에서 계산된 distanceMeter가 있으면 그대로 사용, 없을 경우만 계산
        if (item.distanceMeter === undefined && item.hasValidCoords && item.lat !== null && item.lng !== null) {
          return {
            ...item,
            distanceMeter: calculateDistanceMeter(
              currentLocation.lat,
              currentLocation.lng,
              item.lat,
              item.lng
            ),
          };
        }
        return item;
      });
    }

    // 2. 샘플 데이터 fallback 모드인 경우: 클라이언트 메모리에서 거리계산 및 필터링 수행
    return restaurantsData
      .map((item) => {
        if (item.hasValidCoords && item.lat !== null && item.lng !== null) {
          const distance = calculateDistanceMeter(
            currentLocation.lat,
            currentLocation.lng,
            item.lat,
            item.lng
          );
          return {
            ...item,
            distanceMeter: distance,
          };
        }
        return item;
      })
      .filter((item) => {
        // 반경 필터
        if (item.distanceMeter !== undefined) {
          if (selectedDistance === '500m' && item.distanceMeter > 500) return false;
          if (selectedDistance === '1km' && item.distanceMeter > 1000) return false;
          if (selectedDistance === '3km' && item.distanceMeter > 3000) return false;
        }
        // 검색어 필터
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          const matchesName = item.name.toLowerCase().includes(query);
          const matchesTags = item.tags?.some((tag) => tag.toLowerCase().includes(query));
          const matchesAddress = item.roadAddress.toLowerCase().includes(query);
          if (!matchesName && !matchesTags && !matchesAddress) return false;
        }
        // 업종 필터
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.distanceMeter === undefined && b.distanceMeter === undefined) return 0;
        if (a.distanceMeter === undefined) return 1;
        if (b.distanceMeter === undefined) return -1;
        return a.distanceMeter - b.distanceMeter;
      });
  }, [
    isSampleMode,
    restaurantsData,
    currentLocation.lat,
    currentLocation.lng,
    selectedDistance,
    selectedCategory,
    searchQuery,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedDistance('1km');
  };

  const handleShowOnMap = (restaurant: Restaurant) => {
    if (!restaurant.hasValidCoords) {
      alert('해당 음식점은 상세 위치 좌표가 공공데이터에 등록되어 있지 않습니다.');
      return;
    }
    setViewMode('map');
    setFocusedRestaurantId(restaurant.id);
  };

  // 20건 추가 조회 가능 여부
  const hasMore = !isSampleMode && restaurantsData.length < totalCount;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans antialiased">
      {/* 상단 공공데이터 실시간 연동 배너 (샘플 모드와 구분) */}
      <SampleDataBanner totalCount={totalCount} isSampleMode={isSampleMode} />

      {/* 헤더 (현재 위치 표시, 내 주변 찾기 GPS 버튼) */}
      <Header
        currentLocation={currentLocation}
        isUsingGps={isUsingGps}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onRequestGps={handleRequestGps}
        isGpsLoading={isGpsLoading}
      />

      {/* 위치 권한 거부 / 오류 시 안내 배너 */}
      <LocationPermissionBanner
        permissionState={permissionState}
        selectedLocationName={currentLocation.name}
        onOpenSelector={() => setIsLocationModalOpen(true)}
        onRequestGps={handleRequestGps}
        errorMessage={locationErrorMessage}
      />

      {/* 메인 콘텐츠 영역 (모바일 우선 반응형 컨테이너) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-3 pb-8">
        {/* 상단 검색 및 반경/업종 필터 컨트롤 바 */}
        <div className="space-y-2.5 mb-4 sticky top-14 z-20 bg-slate-50/95 backdrop-blur-xs py-1">
          {/* 검색창 */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={displayedRestaurants.length}
          />

          {/* 업종 카테고리 필터 */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* 반경 거리 필터 (500m / 1km / 3km) */}
          <div className="flex items-center justify-between">
            <DistanceFilter
              selectedDistance={selectedDistance}
              onSelectDistance={setSelectedDistance}
            />
            {isLoading && (
              <span className="text-[11px] text-orange-600 flex items-center gap-1 shrink-0">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>20건 수신중</span>
              </span>
            )}
          </div>

          {/* API 오류 안내 바 */}
          {fetchError && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span className="truncate pr-2">{fetchError}</span>
              <button
                onClick={handleManualRetry}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-950 underline shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                다시 시도
              </button>
            </div>
          )}
        </div>

        {/* 로딩 인디케이터 (초기 로딩 시) */}
        {isLoading && restaurantsData.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-700">공공데이터 음식점 20건을 불러오는 중...</p>
            <p className="text-xs text-gray-400 mt-1">소상공인시장진흥공단 공식 API 서버 연결</p>
          </div>
        ) : (
          /* 뷰 모드에 따른 목록 또는 지도 화면 */
          viewMode === 'list' ? (
            <RestaurantList
              restaurants={displayedRestaurants}
              onSelectRestaurant={(item) => setSelectedRestaurant(item)}
              onResetFilters={handleResetFilters}
              onShowOnMap={handleShowOnMap}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              isLoadingMore={isLoadingMore}
              onOpenLocationSelector={() => setIsLocationModalOpen(true)}
            />
          ) : (
            <div className="pb-24">
              <KakaoMapWrapper
                currentLocation={currentLocation}
                restaurants={displayedRestaurants}
                selectedDistance={selectedDistance}
                onSelectRestaurant={(item) => setSelectedRestaurant(item)}
                selectedRestaurantId={focusedRestaurantId}
              />
            </div>
          )
        )}
      </main>

      {/* 하단 고정 지도/목록 전환 토글 버튼 */}
      <ViewToggle viewMode={viewMode} onToggle={setViewMode} />

      {/* 음식점 상세 바텀시트 / 모달 */}
      <RestaurantDetailModal
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        onShowOnMap={handleShowOnMap}
      />

      {/* 지역 직접 선택 모달 (위치 권한 거부 시 / 수동 선택) */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        noticeMessage={locationErrorMessage}
      />
    </div>
  );
}
