'use client';

import React from 'react';
import { RestaurantCategory } from '@/types/restaurant';

interface Props {
  selectedCategory: RestaurantCategory;
  onSelectCategory: (category: RestaurantCategory) => void;
}

interface CategoryOption {
  key: RestaurantCategory;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'ALL', label: '전체', icon: '🍽️' },
  { key: 'KOREAN', label: '한식', icon: '🍚' },
  { key: 'CHINESE', label: '중식', icon: '🥟' },
  { key: 'JAPANESE', label: '일식', icon: '🍣' },
  { key: 'WESTERN', label: '양식', icon: '🍝' },
  { key: 'CAFE', label: '카페·디저트', icon: '☕' },
  { key: 'SNACK', label: '분식', icon: '🍢' },
];

export default function CategoryFilter({ selectedCategory, onSelectCategory }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar -mx-4 px-4">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${
              isSelected
                ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
