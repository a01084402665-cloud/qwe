'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Phone,
  Tag,
  Navigation,
  Database,
  Clock,
  Star,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Map as MapIcon,
  MapPinOff,
  Hash,
} from 'lucide-react';
import { Restaurant } from '@/types/restaurant';
import { formatDistance } from '@/utils/distance';

interface Props {
  restaurant: Restaurant | null;
  onClose: () => void;
  onShowOnMap?: (restaurant: Restaurant) => void;
}

export default function RestaurantDetailModal({
  restaurant,
  onClose,
  onShowOnMap,
}: Props) {
  const [dbDetail, setDbDetail] = useState<Restaurant | null>(null);
  const [copied, setCopied] = useState(false);

  // 모달이 열리거나 대상 restaurant가 변경되었을 때 DB 상세 API 조회
  useEffect(() => {
    let ignore = false;

    if (restaurant && restaurant.id) {
      fetch(`/api/restaurants/${restaurant.id}`)
        .then((res) => res.json())
        .then((json) => {
          if (!ignore && json.success && json.data) {
            setDbDetail(json.data);
          }
        })
        .catch((err) => {
          console.warn('DB detail fetch error:', err);
        });
    }

    return () => {
      ignore = true;
    };
  }, [restaurant]);

  if (!restaurant) return null;
  // DB에서 가져온 최신 데이터가 현재 선택된 음식점과 일치하면 병합 표시, 아니면 기본 props 사용
  const current =
    dbDetail && dbDetail.id === restaurant.id
      ? { ...restaurant, ...dbDetail }
      : restaurant;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(current.roadAddress || current.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 좌표가 있을 때와 없을 때의 카카오맵 링크 처리
  const kakaoMapUrl = current.hasValidCoords && current.lat && current.lng
    ? `https://map.kakao.com/link/to/${encodeURIComponent(current.name)},${current.lat},${current.lng}`
    : `https://map.kakao.com/?q=${encodeURIComponent(current.name + ' ' + (current.roadAddress || ''))}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-3 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 바 */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
              {current.categoryName}
            </span>

            {/* 실제 데이터 vs 샘플 데이터 구분 */}
            {current.isSampleData ? (
              <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded border border-slate-200">
                샘플 데이터
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Database className="w-2.5 h-2.5" />
                Supabase DB
              </span>
            )}

            {/* 영업상태 (공공데이터에 제공될 때만 표시) */}
            {current.status && (
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
                {current.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 상호명 & 거리 */}
        <div className="mt-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {current.name}
            </h2>
            {current.hasValidCoords && current.distanceMeter !== undefined && (
              <span className="shrink-0 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full flex items-center gap-1 mt-0.5">
                <Navigation className="w-3 h-3" />
                직선거리 {formatDistance(current.distanceMeter)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{current.roadAddress}</span>
          </p>
        </div>

        {/* 데이터 출처 및 원본 ID 안내 카드 */}
        <div className={`mt-4 p-3.5 rounded-2xl text-xs leading-relaxed border ${
          current.isSampleData
            ? 'bg-amber-50/70 border-amber-200/70 text-amber-950'
            : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-950'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>데이터 출처</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 flex items-center gap-0.5">
              <Hash className="w-2.5 h-2.5" />
              ID: {current.id}
            </span>
          </div>
          <p className="text-[11px] text-gray-700">
            {current.source}
          </p>
          {current.updatedAt && (
            <p className="text-[10px] text-gray-400 mt-1">
              DB 갱신일시: {new Date(current.updatedAt).toLocaleString('ko-KR')}
            </p>
          )}
        </div>

        {/* 미제공 항목 안내 (평점, 리뷰, 사진, 영업시간 왜곡 방지) */}
        <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-2">
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Star className="w-3.5 h-3.5 text-gray-400" />
              <span>방문자 평점</span>
            </span>
            <span className="text-gray-400 font-medium">{current.ratingNotice}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5 text-gray-500">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <span>사용자 리뷰</span>
            </span>
            <span className="text-gray-400 font-medium">{current.reviewNotice}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>영업 시간</span>
            </span>
            <span className="text-gray-400 font-medium">{current.openingHoursNotice}</span>
          </div>
        </div>

        {/* 업종 태그 */}
        {current.tags && current.tags.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-orange-500" />
              <span>업종 분류</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {current.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-orange-50 text-orange-950 font-medium px-2.5 py-1 rounded-xl border border-orange-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 전화번호 & 주소 & 좌표 상세 정보 */}
        <div className="mt-4 space-y-2 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              전화번호
            </span>
            <span className="font-mono text-gray-700">{current.tel || '정보 없음'}</span>
          </div>

          {current.address && (
            <div className="flex items-start justify-between pt-1 border-t border-gray-200/50">
              <span className="text-gray-500 shrink-0 mr-2">지번 주소</span>
              <span className="text-right text-gray-700">{current.address}</span>
            </div>
          )}

          {/* 좌표 결측치 여부에 따른 좌표 표시 */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
            <span className="text-gray-500">위치 좌표</span>
            {current.hasValidCoords && current.lat && current.lng ? (
              <span className="font-mono text-[11px] text-gray-600">
                {current.lat.toFixed(5)}, {current.lng.toFixed(5)}
              </span>
            ) : (
              <span className="text-[11px] text-amber-700 flex items-center gap-1">
                <MapPinOff className="w-3 h-3 text-amber-500" />
                좌표 미등록
              </span>
            )}
          </div>
        </div>

        {/* 지도 이동 버튼 (좌표가 있는 경우에만 표시) */}
        {current.hasValidCoords && onShowOnMap && (
          <div className="mt-4">
            <button
              onClick={() => {
                onShowOnMap(current);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <MapIcon className="w-4 h-4" />
              <span>카카오 지도에서 이 위치 보기</span>
            </button>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyAddress}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-600" />
                <span>주소 복사</span>
              </>
            )}
          </button>

          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-bold rounded-xl transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{restaurant.hasValidCoords ? '카카오맵 길찾기' : '카카오맵 검색'}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
