'use client';

import React from 'react';
import { AlertCircle, Navigation } from 'lucide-react';
import { LocationPermissionState } from '@/types/restaurant';

interface Props {
  permissionState: LocationPermissionState;
  onOpenSelector: () => void;
  onRequestGps: () => void;
  selectedLocationName: string;
  errorMessage?: string | null;
}

export default function LocationPermissionBanner({
  permissionState,
  onOpenSelector,
  onRequestGps,
  selectedLocationName,
  errorMessage,
}: Props) {
  if (permissionState === 'granted') return null;

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs text-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-1.5 flex-1 pr-2 min-w-0">
        <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="truncate">
          {errorMessage
            ? errorMessage
            : permissionState === 'denied'
            ? `위치 권한 미허용: [${selectedLocationName}] 기준 표시`
            : `현재 [${selectedLocationName}] 기준`}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRequestGps}
          className="font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap text-[11px] flex items-center gap-0.5"
          title="위치 다시 시도"
        >
          <Navigation className="w-3 h-3" />
          <span>내 위치</span>
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={onOpenSelector}
          className="font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap text-[11px] underline"
        >
          지역 변경
        </button>
      </div>
    </div>
  );
}
