'use client';

import React from 'react';
import { UtensilsCrossed, RotateCcw, MapPin, Loader2, Plus } from 'lucide-react';
import { Restaurant } from '@/types/restaurant';
import RestaurantCard from './RestaurantCard';

interface Props {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onResetFilters: () => void;
  onShowOnMap: (restaurant: Restaurant) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  onOpenLocationSelector?: () => void;
}

export default function RestaurantList({
  restaurants,
  onSelectRestaurant,
  onResetFilters,
  onShowOnMap,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  onOpenLocationSelector,
}: Props) {
  if (restaurants.length === 0) {
    return (
      <div className="py-16 text-center px-4 bg-white rounded-2xl border border-gray-100 mt-2 shadow-2xs">
        <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-gray-800">조회된 공공데이터 음식점이 없습니다</h4>
        <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
          검색어 또는 업종 필터를 변경하시거나, 반경(1km / 3km)을 넓혀보세요.
          다른 동네의 음식점을 찾으실 수도 있습니다.
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>필터 초기화</span>
          </button>

          {onOpenLocationSelector && (
            <button
              onClick={onOpenLocationSelector}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>동네 변경하기</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {restaurants.map((item) => (
        <RestaurantCard
          key={item.id}
          restaurant={item}
          onClick={onSelectRestaurant}
          onShowOnMap={onShowOnMap}
        />
      ))}

      {/* 20건 추가 더보기 버튼 */}
      {hasMore && onLoadMore && (
        <div className="pt-2 pb-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full py-3 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span>공공데이터 20건 추가 조회 중...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-orange-500" />
                <span>공공데이터 20건 더 불러오기</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
