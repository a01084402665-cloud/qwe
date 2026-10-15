'use client';

import React from 'react';
import { Compass } from 'lucide-react';
import { DistanceFilterType } from '@/types/restaurant';

interface Props {
  selectedDistance: DistanceFilterType;
  onSelectDistance: (dist: DistanceFilterType) => void;
}

const DISTANCE_OPTIONS: { key: DistanceFilterType; label: string }[] = [
  { key: 'ALL', label: '전체 반경' },
  { key: '500m', label: '500m 이내' },
  { key: '1km', label: '1km 이내' },
  { key: '3km', label: '3km 이내' },
];

export default function DistanceFilter({ selectedDistance, onSelectDistance }: Props) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <div className="flex items-center gap-1 text-xs text-gray-400 mr-1 shrink-0">
        <Compass className="w-3.5 h-3.5 text-gray-500" />
        <span className="font-medium text-gray-600">반경:</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {DISTANCE_OPTIONS.map((opt) => {
          const isSelected = selectedDistance === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onSelectDistance(opt.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                isSelected
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
