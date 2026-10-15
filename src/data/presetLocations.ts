import { LocationCoords } from '@/types/restaurant';

export const PRESET_LOCATIONS: LocationCoords[] = [
  {
    name: '인천시 서구 청라동 (커낼웨이)',
    lat: 37.5352,
    lng: 126.6534,
  },
  {
    name: '인천시 서구 루원시티 (가정동)',
    lat: 37.5258,
    lng: 126.6745,
  },
  {
    name: '인천시 서구 검암동 (검암역)',
    lat: 37.5658,
    lng: 126.6765,
  },
  {
    name: '인천시 서구 검단신도시 (원당동)',
    lat: 37.5955,
    lng: 126.7125,
  },
  {
    name: '서울시 성동구 성수동',
    lat: 37.54458,
    lng: 127.05597,
  },
  {
    name: '서울시 강남구 역삼동',
    lat: 37.50074,
    lng: 127.03689,
  },
  {
    name: '서울시 마포구 연남동',
    lat: 37.56214,
    lng: 126.92489,
  },
  {
    name: '경기도 고양시 일산동구 (정발산)',
    lat: 37.6582,
    lng: 126.7725,
  },
  {
    name: '서울시 영등포구 여의도동',
    lat: 37.52156,
    lng: 126.92419,
  },
];

export const DEFAULT_LOCATION = PRESET_LOCATIONS[0];
