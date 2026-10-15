'use client';

import React, { useState, useMemo } from 'react';
import { X, Check, MapPin, AlertTriangle, Search } from 'lucide-react';
import { LocationCoords } from '@/types/restaurant';
import { PRESET_LOCATIONS } from '@/data/presetLocations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationCoords;
  onSelectLocation: (location: LocationCoords) => void;
  noticeMessage?: string | null;
}

export default function LocationSelectorModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  noticeMessage,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return PRESET_LOCATIONS;
    const q = searchTerm.trim().toLowerCase();
    return PRESET_LOCATIONS.filter((l) => l.name.toLowerCase().includes(q));
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">지역 직접 선택</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              원하는 동네를 선택하시면 해당 지역 기준으로 음식점을 찾습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 사유 안내 (권한 거부, 시간 초과, PC IP 오차 등) */}
        {noticeMessage && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold block mb-0.5">안내:</strong>
              {noticeMessage}
            </div>
          </div>
        )}

        {/* 지역 검색창 */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="동네 검색 (예: 인천, 청라, 성수, 고양)"
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
        </div>

        <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto">
          {filteredLocations.map((loc) => {
            const isSelected =
              currentLocation.name === loc.name ||
              (currentLocation.lat === loc.lat && currentLocation.lng === loc.lng);

            return (
              <button
                key={loc.name}
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-medium'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{loc.name}</div>
                    <div className="text-xs text-gray-400">
                      위경도: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-orange-600 shrink-0" />}
              </button>
            );
          })}

          {filteredLocations.length === 0 && (
            <div className="text-center py-6 text-xs text-gray-400">
              일치하는 지역이 없습니다.
            </div>
          )}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-blue-50 text-[11px] text-blue-900 leading-relaxed border border-blue-100">
          💡 <strong>PC 브라우저 안내:</strong> 데스크톱 PC는 GPS 위성 칩이 없어 통신사 인터넷 IP(기지국) 기반으로 추정되므로 실제 계신 곳(인천 서구)과 다르게(고양시 등) 나올 수 있습니다. 이럴 때는 위 목록에서 <strong>[인천시 서구 청라동/루원시티/검암동]</strong>을 선택하시면 됩니다.
        </div>
      </div>
    </div>
  );
}
