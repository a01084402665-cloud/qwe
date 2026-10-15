'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Navigation, ZoomIn, ZoomOut, Compass, X } from 'lucide-react';
import { Restaurant, LocationCoords, DistanceFilterType } from '@/types/restaurant';
import { formatDistance } from '@/utils/distance';

interface Props {
  currentLocation: LocationCoords;
  restaurants: Restaurant[];
  selectedDistance: DistanceFilterType;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  selectedRestaurantId?: string | null;
}

export default function KakaoMapReal({
  currentLocation,
  restaurants,
  selectedDistance,
  onSelectRestaurant,
  selectedRestaurantId,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myPosOverlayRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radiusCircleRef = useRef<any>(null);

  const [clickedId, setClickedId] = useState<string | null>(null);

  // 파생 상태로 활성 음식점 계산
  const currentActiveId = clickedId ?? selectedRestaurantId ?? null;
  const activeRestaurant = useMemo(() => {
    if (!currentActiveId) return null;
    return restaurants.find((r) => r.id === currentActiveId) || null;
  }, [currentActiveId, restaurants]);

  // 1. 카카오 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current || !window.kakao || !window.kakao.maps) return;
    if (mapInstanceRef.current) return;

    const kakaoMaps = window.kakao.maps;
    const container = mapContainerRef.current;
    const options = {
      center: new kakaoMaps.LatLng(currentLocation.lat, currentLocation.lng),
      level: selectedDistance === '500m' ? 3 : selectedDistance === '1km' ? 4 : 5,
    };

    const map = new kakaoMaps.Map(container, options);
    mapInstanceRef.current = map;
  }, [currentLocation.lat, currentLocation.lng, selectedDistance]);

  // 2. 내 위치 오버레이 및 반경 원(Circle) 표시 (위치 또는 반경 변경 시)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao || !window.kakao.maps) return;

    const kakaoMaps = window.kakao.maps;
    const centerLatLng = new kakaoMaps.LatLng(currentLocation.lat, currentLocation.lng);

    // 이전 내 위치 오버레이 제거
    if (myPosOverlayRef.current) {
      myPosOverlayRef.current.setMap(null);
    }
    // 이전 반경 원 제거
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
    }

    // 내 위치 커스텀 오버레이 생성 (펄스 링 + 마커)
    const myPosContent = document.createElement('div');
    myPosContent.innerHTML = `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%); pointer-events:none;">
        <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(37,99,235,0.25); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:relative; width:18px; height:18px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 0 10px rgba(37,99,235,0.7);"></div>
        <div style="margin-top:3px; padding:2px 7px; border-radius:12px; background:rgba(15,23,42,0.9); color:#ffffff; font-size:10px; font-weight:700; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
          내 위치
        </div>
      </div>
    `;

    const myPosOverlay = new kakaoMaps.CustomOverlay({
      map: map,
      position: centerLatLng,
      content: myPosContent,
      zIndex: 15,
    });
    myPosOverlayRef.current = myPosOverlay;

    // 반경 원(Circle) 그리기
    let radiusMeter = 1000;
    if (selectedDistance === '500m') radiusMeter = 500;
    if (selectedDistance === '1km') radiusMeter = 1000;
    if (selectedDistance === '3km') radiusMeter = 3000;

    const circle = new kakaoMaps.Circle({
      map: map,
      center: centerLatLng,
      radius: radiusMeter,
      strokeWeight: 1.5,
      strokeColor: '#f97316',
      strokeOpacity: 0.7,
      strokeStyle: 'solid',
      fillColor: '#f97316',
      fillOpacity: 0.08,
      zIndex: 1,
    });
    radiusCircleRef.current = circle;

    // 중심 부드럽게 이동
    map.panTo(centerLatLng);

    // 줌 레벨 조정
    const targetLevel = radiusMeter <= 500 ? 3 : radiusMeter <= 1000 ? 4 : 5;
    map.setLevel(targetLevel);
  }, [currentLocation.lat, currentLocation.lng, selectedDistance]);

  // 3. 오버레이 갱신 함수
  const showOverlayForRestaurant = useCallback((item: Restaurant) => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao || !window.kakao.maps) return;

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
    }

    if (!item.hasValidCoords || item.lat === null || item.lng === null) return;

    const kakaoMaps = window.kakao.maps;
    const overlayContent = document.createElement('div');
    const distanceText =
      item.distanceMeter !== undefined
        ? `<span style="font-size:10px; color:#ea580c; font-weight:normal; margin-left:4px;">직선거리 ${
            item.distanceMeter >= 1000
              ? (item.distanceMeter / 1000).toFixed(1) + 'km'
              : item.distanceMeter + 'm'
          }</span>`
        : '';

    overlayContent.innerHTML = `
      <div style="transform:translate(-50%, -135%); background:#ffffff; border-radius:12px; padding:6px 10px; box-shadow:0 4px 14px rgba(0,0,0,0.2); border:1px solid #f97316; font-size:12px; font-weight:bold; color:#1e293b; white-space:nowrap; cursor:pointer; display:flex; align-items:center;">
        <span>${item.name.replace('[샘플] ', '')}</span>
        ${distanceText}
        <div style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:6px solid #f97316;"></div>
      </div>
    `;

    overlayContent.onclick = () => {
      onSelectRestaurant(item);
    };

    const overlay = new kakaoMaps.CustomOverlay({
      map: map,
      position: new kakaoMaps.LatLng(item.lat, item.lng),
      content: overlayContent,
      yAnchor: 1,
      zIndex: 25,
    });

    overlayRef.current = overlay;
  }, [onSelectRestaurant]);

  // 4. 음식점 마커 표시 및 갱신 (검색/필터/반경 변경 시 동기화)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao || !window.kakao.maps) return;

    const kakaoMaps = window.kakao.maps;

    // 이전 마커 및 오버레이 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    // 새 마커 추가 (유효한 좌표를 가진 매장만 지도 마커 생성)
    restaurants.forEach((item) => {
      if (!item.hasValidCoords || item.lat === null || item.lng === null) return;

      const position = new kakaoMaps.LatLng(item.lat, item.lng);
      const marker = new kakaoMaps.Marker({
        position: position,
        title: item.name,
      });

      marker.setMap(map);
      markersRef.current.push(marker);

      // 마커 클릭 시 활성화
      kakaoMaps.event.addListener(marker, 'click', () => {
        setClickedId(item.id);
        showOverlayForRestaurant(item);
      });
    });
  }, [restaurants, showOverlayForRestaurant]);

  // 5. 외부 선택(목록에서 누르기 / 지도에서 보기) 시 해당 좌표로 panTo 및 오버레이 표시
  useEffect(() => {
    if (!selectedRestaurantId || !mapInstanceRef.current || !window.kakao || !window.kakao.maps) return;

    const found = restaurants.find((r) => r.id === selectedRestaurantId);
    if (!found || !found.hasValidCoords || found.lat === null || found.lng === null) return;

    const kakaoMaps = window.kakao.maps;
    const map = mapInstanceRef.current;
    const moveLatLng = new kakaoMaps.LatLng(found.lat, found.lng);

    // 부드럽게 지도 중심 이동
    map.panTo(moveLatLng);
    showOverlayForRestaurant(found);
  }, [selectedRestaurantId, restaurants, showOverlayForRestaurant]);

  // 지도 줌 컨트롤
  const handleZoom = (delta: number) => {
    if (!mapInstanceRef.current) return;
    const currentLevel = mapInstanceRef.current.getLevel();
    mapInstanceRef.current.setLevel(currentLevel + delta);
  };

  // 내 위치로 중심 복귀
  const handleResetCenter = () => {
    if (!mapInstanceRef.current || !window.kakao || !window.kakao.maps) return;
    const kakaoMaps = window.kakao.maps;
    mapInstanceRef.current.panTo(new kakaoMaps.LatLng(currentLocation.lat, currentLocation.lng));
  };

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[460px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm select-none">
      {/* 실제 카카오 지도 컨테이너 */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 우측 상단 지도 컨트롤 */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-gray-200 shadow-md">
        <button
          onClick={() => handleZoom(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-700 hover:text-black hover:bg-gray-100 transition"
          aria-label="지도 확대"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-700 hover:text-black hover:bg-gray-100 transition"
          aria-label="지도 축소"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCenter}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
          aria-label="내 위치로 이동"
          title="내 위치로 이동"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* 좌측 상단 마커 개수 및 반경 안내 */}
      <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 text-[11px] font-semibold text-gray-700 flex items-center gap-1.5 shadow-xs">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <span>반경 {selectedDistance} ({restaurants.length}곳)</span>
      </div>

      {/* 마커 클릭 시 하단 요약 카드 */}
      {activeRestaurant && (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {activeRestaurant.categoryName}
                </span>
                {activeRestaurant.distanceMeter !== undefined && (
                  <span className="text-[11px] font-medium text-orange-600 flex items-center gap-0.5">
                    <Navigation className="w-2.5 h-2.5" />
                    {formatDistance(activeRestaurant.distanceMeter)}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900 truncate">{activeRestaurant.name}</h4>
              <p className="text-xs text-gray-500 truncate mt-0.5">{activeRestaurant.roadAddress}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onSelectRestaurant(activeRestaurant)}
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                상세보기
              </button>
              <button
                onClick={() => {
                  setClickedId(null);
                  if (overlayRef.current) {
                    overlayRef.current.setMap(null);
                    overlayRef.current = null;
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
