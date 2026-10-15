'use client';

import React from 'react';
import { List, Map } from 'lucide-react';

interface Props {
  viewMode: 'list' | 'map';
  onToggle: (mode: 'list' | 'map') => void;
}

export default function ViewToggle({ viewMode, onToggle }: Props) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-gray-900/90 backdrop-blur-md text-white p-1 rounded-full shadow-xl border border-gray-700/50 flex items-center">
        <button
          onClick={() => onToggle('list')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
            viewMode === 'list'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>목록 보기</span>
        </button>

        <button
          onClick={() => onToggle('map')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
            viewMode === 'map'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>지도 보기</span>
        </button>
      </div>
    </div>
  );
}
