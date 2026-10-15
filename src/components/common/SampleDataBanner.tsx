'use client';

import React, { useState } from 'react';
import { X, Database, AlertCircle } from 'lucide-react';

interface Props {
  totalCount?: number;
  isSampleMode?: boolean;
}

export default function SampleDataBanner({ totalCount = 0, isSampleMode = false }: Props) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  if (isSampleMode) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-1 pr-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">
            <strong>샘플 데이터 모드:</strong> 공공데이터 API 서버 장애로 인해 임시 샘플 데이터가 표시되고 있습니다.
          </span>
        </div>
        <button
          onClick={() => setClosed(true)}
          className="p-1 text-amber-700 hover:text-amber-900 rounded focus:outline-none shrink-0"
          aria-label="안내 닫기"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-2 text-xs text-emerald-900 flex items-center justify-between">
      <div className="flex items-center gap-1.5 flex-1 pr-2">
        <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="truncate">
          <strong>공공데이터 실시간 연동:</strong> 소상공인시장진흥공단 공식 상가 데이터
          {totalCount > 0 ? ` (주변 약 ${totalCount.toLocaleString()}곳 등록)` : ''}
        </span>
      </div>
      <button
        onClick={() => setClosed(true)}
        className="p-1 text-emerald-700 hover:text-emerald-900 rounded focus:outline-none shrink-0"
        aria-label="안내 닫기"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
