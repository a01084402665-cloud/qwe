'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';
import { Restaurant, LocationCoords, DistanceFilterType } from '@/types/restaurant';
import InteractiveMockMap from './InteractiveMockMap';
import KakaoMapReal from './KakaoMapReal';
import KakaoMapErrorView from './KakaoMapErrorView';

interface Props {
  currentLocation: LocationCoords;
  restaurants: Restaurant[];
  selectedDistance: DistanceFilterType;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  selectedRestaurantId?: string | null;
}

export default function KakaoMapWrapper({
  currentLocation,
  restaurants,
  selectedDistance,
  onSelectRestaurant,
  selectedRestaurantId,
}: Props) {
  const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const isKeyProvided = Boolean(
    kakaoApiKey &&
    kakaoApiKey.trim() !== '' &&
    !kakaoApiKey.includes('your_kakao_')
  );

  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [useFallbackMap, setUseFallbackMap] = useState(false);

  // 1. 사용자가 '모의 지도로 계속 보기'를 선택한 경우
  if (useFallbackMap) {
    return (
      <InteractiveMockMap
        currentLocation={currentLocation}
        restaurants={restaurants}
        selectedDistance={selectedDistance}
        onSelectRestaurant={onSelectRestaurant}
        selectedRestaurantId={selectedRestaurantId}
      />
    );
  }

  // 2. 키가 입력되지 않은 경우 -> 안내 에러 화면
  if (!isKeyProvided) {
    return (
      <KakaoMapErrorView
        errorType="MISSING_KEY"
        onUseFallbackMap={() => setUseFallbackMap(true)}
      />
    );
  }

  // 3. 스크립트 로드에 실패한 경우
  if (loadError) {
    return (
      <KakaoMapErrorView
        errorType="LOAD_FAILED"
        errorMessage="카카오 지도 스크립트를 불러오지 못했습니다. 카카오 개발자 콘솔의 사이트 도메인에 현재 접속 주소가 등록되어 있는지 확인해 주세요."
        onRetry={() => {
          setLoadError(false);
          setIsSdkLoaded(false);
        }}
        onUseFallbackMap={() => setUseFallbackMap(true)}
      />
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[460px]">
      {/* 카카오 지도 JavaScript SDK 로드 */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              setIsSdkLoaded(true);
            });
          } else {
            setLoadError(true);
          }
        }}
        onError={() => {
          setLoadError(true);
        }}
      />

      {isSdkLoaded ? (
        <KakaoMapReal
          currentLocation={currentLocation}
          restaurants={restaurants}
          selectedDistance={selectedDistance}
          onSelectRestaurant={onSelectRestaurant}
          selectedRestaurantId={selectedRestaurantId}
        />
      ) : (
        <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white border border-gray-200">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
          <p className="text-xs text-slate-300 font-medium">카카오 지도를 불러오는 중입니다...</p>
        </div>
      )}
    </div>
  );
}
