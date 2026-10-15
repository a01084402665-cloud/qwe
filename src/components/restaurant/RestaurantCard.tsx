'use client';

import React from 'react';
import { MapPin, Navigation, Tag, Clock, Building2, MapPinOff } from 'lucide-react';
import { Restaurant } from '@/types/restaurant';
import { formatDistance } from '@/utils/distance';

interface Props {
  restaurant: Restaurant;
  onClick: (item: Restaurant) => void;
  onShowOnMap?: (item: Restaurant) => void;
}

export default function RestaurantCard({ restaurant, onClick, onShowOnMap }: Props) {
  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'KOREAN':
        return 'bg-amber-100 text-amber-800';
      case 'CHINESE':
        return 'bg-red-100 text-red-800';
      case 'JAPANESE':
        return 'bg-blue-100 text-blue-800';
      case 'WESTERN':
        return 'bg-emerald-100 text-emerald-800';
      case 'CAFE':
        return 'bg-orange-100 text-orange-800';
      case 'SNACK':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      onClick={() => onClick(restaurant)}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all cursor-pointer relative group flex flex-col justify-between"
    >
      <div>
        {/* 상단 뱃지 라인 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getCategoryBadgeColor(
                restaurant.category
              )}`}
            >
              {restaurant.categoryName}
            </span>

            {/* 거리 표시 (직선거리 명시) */}
            {restaurant.hasValidCoords && restaurant.distanceMeter !== undefined ? (
              <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Navigation className="w-2.5 h-2.5" />
                직선거리 {formatDistance(restaurant.distanceMeter)}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <MapPinOff className="w-2.5 h-2.5" />
                위치좌표 미등록
              </span>
            )}
          </div>

          {/* 실제 공공데이터 vs 샘플 데이터 명확한 구분 */}
          {restaurant.isSampleData ? (
            <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full border border-slate-200">
              샘플 데이터
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5" />
              공공데이터
            </span>
          )}
        </div>

        {/* 상호명 */}
        <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition flex items-center gap-1.5">
          {restaurant.name}
        </h3>

        {/* 도로명 주소 */}
        <p className="mt-1 text-xs text-gray-500 flex items-start gap-1">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{restaurant.roadAddress}</span>
        </p>

        {/* 업종 태그 */}
        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <Tag className="w-3 h-3 text-gray-400 shrink-0" />
            {restaurant.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[11px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 하단 정보 라인 */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <Clock className="w-3 h-3 text-gray-300 shrink-0" />
          <span>{restaurant.openingHoursNotice}</span>
        </div>

        {/* 좌표가 유효할 때만 지도 이동 버튼 활성화 */}
        {restaurant.hasValidCoords && onShowOnMap ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowOnMap(restaurant);
            }}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-orange-50 transition border border-transparent hover:border-orange-200"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>지도 위치 보기</span>
          </button>
        ) : (
          <span className="text-[11px] text-gray-300">지도 좌표 없음</span>
        )}
      </div>
    </div>
  );
}
