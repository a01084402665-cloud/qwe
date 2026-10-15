'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  resultCount: number;
}

export default function SearchBar({ value, onChange, resultCount }: Props) {
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="음식점 이름 또는 메뉴 검색 (예: 국밥, 카페)"
          className="w-full pl-10 pr-10 py-2.5 bg-gray-100 hover:bg-gray-100/80 focus:bg-white text-sm text-gray-900 rounded-xl border border-transparent focus:border-orange-500 focus:outline-none transition shadow-2xs placeholder:text-gray-400"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="검색어 지우기"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 px-1 text-xs text-gray-500">
        <span>
          검색 결과 <strong className="text-orange-600 font-semibold">{resultCount}</strong>곳
        </span>
        {value && (
          <span className="text-[11px] text-gray-400">
            &apos;{value}&apos; 검색 중
          </span>
        )}
      </div>
    </div>
  );
}
