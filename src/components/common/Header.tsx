'use client';

import React from 'react';
import { MapPin, Navigation, ChevronDown, Crosshair } from 'lucide-react';
import { LocationCoords } from '@/types/restaurant';

interface HeaderProps {
  currentLocation: LocationCoords;
  isUsingGps: boolean;
  onOpenLocationModal: () => void;
  onRequestGps: () => void;
  isGpsLoading: boolean;
}

export default function Header({
  currentLocation,
  isUsingGps,
  onOpenLocationModal,
  onRequestGps,
  isGpsLoading,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* 위치 선택 트리거 */}
        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-2 text-left group hover:opacity-80 transition py-1"
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isUsingGps
                ? 'bg-blue-100 text-blue-600'
                : 'bg-orange-100 text-orange-600'
            }`}
          >
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition truncate max-w-[170px]">
                {currentLocation.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 shrink-0" />
            </div>
            <p className="text-[11px] text-gray-400 leading-none mt-0.5">
              {isUsingGps ? '📍 GPS 실시간 위치 기준' : '지역 직접 선택 기준'}
            </p>
          </div>
        </button>

        {/* 내 주변 찾기 (GPS) 버튼 */}
        <button
          onClick={onRequestGps}
          disabled={isGpsLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition shadow-2xs ${
            isUsingGps
              ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
              : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'
          }`}
          title="내 주변 찾기 (현재 위치 기준)"
        >
          {isGpsLoading ? (
            <Navigation className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Crosshair className="w-3.5 h-3.5" />
          )}
          <span>{isGpsLoading ? '위치 탐색중' : isUsingGps ? '내 위치 갱신' : '내 주변 찾기'}</span>
        </button>
      </div>
    </header>
  );
}
