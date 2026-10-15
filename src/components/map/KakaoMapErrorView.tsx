'use client';

import React from 'react';
import { AlertTriangle, Key, ExternalLink, RefreshCw, Map } from 'lucide-react';

interface Props {
  errorType: 'MISSING_KEY' | 'LOAD_FAILED';
  errorMessage?: string;
  onRetry?: () => void;
  onUseFallbackMap?: () => void;
}

export default function KakaoMapErrorView({
  errorType,
  errorMessage,
  onRetry,
  onUseFallbackMap,
}: Props) {
  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[460px] bg-slate-900 rounded-2xl overflow-hidden border border-gray-200 shadow-inner flex flex-col items-center justify-center p-6 text-center text-white">
      {/* 배경 장식 패턴 */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-sm flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
          {errorType === 'MISSING_KEY' ? (
            <Key className="w-7 h-7" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        <h3 className="text-base font-bold text-white mb-1.5">
          {errorType === 'MISSING_KEY'
            ? '카카오 지도 API 키가 필요합니다'
            : '카카오 지도 로딩에 실패했습니다'}
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {errorType === 'MISSING_KEY'
            ? '카카오 지도 JavaScript 키를 환경변수에 등록하면 실제 지도가 활성화됩니다.'
            : (errorMessage || '카카오 개발자 콘솔의 사이트 도메인 설정 또는 키를 확인해 주세요.')}
        </p>

        {/* 가이드 박스 */}
        <div className="w-full bg-slate-800/80 rounded-xl p-3 text-left border border-slate-700 mb-4 text-xs text-slate-300 space-y-1.5">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <span>설정 방법</span>
          </div>
          <p className="text-[11px] text-slate-400">
            1. 프로젝트 루트에 <code className="text-amber-200 bg-slate-900 px-1 py-0.5 rounded">.env.local</code> 파일 생성
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            NEXT_PUBLIC_KAKAO_MAP_KEY=발급받은_JS키
          </p>
          <p className="text-[11px] text-slate-400">
            2. 카카오 개발자 콘솔에 웹 플랫폼 도메인 등록:
            <br />
            <code className="text-amber-200 bg-slate-900 px-1 py-0.5 rounded">http://localhost:3000</code>, <code className="text-amber-200 bg-slate-900 px-1 py-0.5 rounded">http://localhost:3001</code>
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {onUseFallbackMap && (
            <button
              onClick={onUseFallbackMap}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow"
            >
              <Map className="w-4 h-4" />
              <span>모의 지도로 계속 보기</span>
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>다시 시도</span>
            </button>
          )}
        </div>

        <a
          href="https://developers.kakao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition underline"
        >
          <span>카카오 개발자 콘솔 바로가기</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
