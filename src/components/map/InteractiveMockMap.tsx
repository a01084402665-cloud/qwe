'use client';

import React, { useState, useMemo } from 'react';
import { Navigation, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Restaurant, LocationCoords, DistanceFilterType } from '@/types/restaurant';
import { formatDistance } from '@/utils/distance';

interface Props {
  currentLocation: LocationCoords;
  restaurants: Restaurant[];
  selectedDistance: DistanceFilterType;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  selectedRestaurantId?: string | null;
}

export default function InteractiveMockMap({
  currentLocation,
  restaurants,
  onSelectRestaurant,
  selectedRestaurantId,
}: Props) {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 0.8 ~ 1.5
  const [clickedPinId, setClickedPinId] = useState<string | null>(null);

  // 외부 선택 id와 내부 클릭 id를 합성하여 파생 상태로 계산 (useEffect 불필요)
  const activePinId = clickedPinId ?? selectedRestaurantId ?? null;
  const activePin = useMemo(() => {
    if (!activePinId) return null;
    return restaurants.find((r) => r.id === activePinId) || null;
  }, [restaurants, activePinId]);

  // 중심 위치 기준 화면 정규화 좌표 계산
  const mappedPins = useMemo(() => {
    const scale = 6500 * zoomLevel; // 줌 배율
    return restaurants
      .filter((item) => item.hasValidCoords && item.lat !== null && item.lng !== null)
      .map((item) => {
        const deltaX = (item.lng! - currentLocation.lng) * scale;
        const deltaY = -(item.lat! - currentLocation.lat) * (scale * 1.25); // 위도는 북쪽이 +

      // 화면 중앙 (50%, 50%) 기준 오프셋 퍼센트
      const left = 50 + deltaX;
      const top = 50 + deltaY;

      return {
        ...item,
        screenX: left,
        screenY: top,
      };
    });
  }, [restaurants, currentLocation, zoomLevel]);

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[460px] bg-slate-900 rounded-2xl overflow-hidden border border-gray-200 shadow-inner select-none">
      {/* 지도 배경 그리드 및 레이더 원 */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />

      {/* 반경 표시 원 (500m / 1km / 3km) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* 500m 원 */}
        <div
          className="rounded-full border border-orange-500/30 bg-orange-500/5 transition-all duration-300 flex items-center justify-center"
          style={{
            width: `${140 * zoomLevel}px`,
            height: `${140 * zoomLevel}px`,
          }}
        >
          <span className="text-[10px] text-orange-400 font-mono -mt-6">500m</span>
        </div>

        {/* 1km 원 */}
        <div
          className="absolute rounded-full border border-sky-500/25 bg-sky-500/5 transition-all duration-300 flex items-center justify-center"
          style={{
            width: `${280 * zoomLevel}px`,
            height: `${280 * zoomLevel}px`,
          }}
        >
          <span className="text-[10px] text-sky-400 font-mono -mt-10">1km</span>
        </div>

        {/* 3km 원 */}
        <div
          className="absolute rounded-full border border-emerald-500/15 bg-emerald-500/5 transition-all duration-300 flex items-center justify-center"
          style={{
            width: `${560 * zoomLevel}px`,
            height: `${560 * zoomLevel}px`,
          }}
        >
          <span className="text-[10px] text-emerald-400 font-mono -mt-16">3km</span>
        </div>

        {/* 중심 내 위치 마커 */}
        <div className="absolute z-10 flex flex-col items-center pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-blue-500/30 animate-ping absolute" />
          <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[10px] font-semibold border border-slate-700 whitespace-nowrap shadow">
            내 위치 ({currentLocation.name.split(' ').slice(-1)[0]})
          </span>
        </div>
      </div>

      {/* 식당 핀 마커들 */}
      {mappedPins.map((item) => {
        const isSelected = activePin?.id === item.id;
        // 화면 바깥 핀 숨김
        if (item.screenX < -10 || item.screenX > 110 || item.screenY < -10 || item.screenY > 110) {
          return null;
        }

        return (
          <div
            key={item.id}
            style={{
              left: `${item.screenX}%`,
              top: `${item.screenY}%`,
              transform: 'translate(-50%, -100%)',
            }}
            className="absolute z-20 transition-all duration-200 cursor-pointer"
            onClick={() => setClickedPinId(item.id)}
          >
            <div
              className={`flex flex-col items-center group transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold shadow-md whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-400 shadow-orange-500/50'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-orange-300'
                }`}
              >
                {item.name.replace('[샘플] ', '')}
              </div>
              <div
                className={`w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent ${
                  isSelected ? 'border-t-orange-500' : 'border-t-white'
                }`}
              />
            </div>
          </div>
        );
      })}

      {/* 우측 상단 컨트롤 (줌 인/아웃, 리셋) */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-800/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg">
        <button
          onClick={() => setZoomLevel((prev) => Math.min(prev + 0.2, 1.8))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-700 transition"
          aria-label="확대"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel((prev) => Math.max(prev - 0.2, 0.6))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-700 transition"
          aria-label="축소"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-700 transition"
          aria-label="기본 배율"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 좌측 상단 상태 태그 */}
      <div className="absolute top-4 left-4 z-30 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>지도 시뮬레이터 (마커 {restaurants.length}개)</span>
      </div>

      {/* 하단 식당 미니 프리뷰 카드 (핀 선택 시 노출) */}
      {activePin && (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {activePin.categoryName}
                </span>
                {activePin.distanceMeter !== undefined && (
                  <span className="text-[11px] font-medium text-orange-600 flex items-center gap-0.5">
                    <Navigation className="w-2.5 h-2.5" />
                    {formatDistance(activePin.distanceMeter)}
                  </span>
                )}
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded">
                  샘플
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 truncate">{activePin.name}</h4>
              <p className="text-xs text-gray-500 truncate mt-0.5">{activePin.roadAddress}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onSelectRestaurant(activePin)}
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                상세보기
              </button>
              <button
                onClick={() => setClickedPinId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카카오 지도 정식 연동 안내 배너 */}
      <div className="absolute bottom-2 left-4 text-[10px] text-slate-400/80 pointer-events-none hidden sm:block">
        * 카카오 지도 JS API 키 등록 시 실제 정식 지도로 연동됩니다.
      </div>
    </div>
  );
}
