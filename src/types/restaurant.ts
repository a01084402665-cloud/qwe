export type RestaurantCategory =
  | 'ALL'
  | 'KOREAN' // 한식
  | 'CHINESE' // 중식
  | 'JAPANESE' // 일식
  | 'WESTERN' // 양식
  | 'CAFE' // 카페·디저트
  | 'SNACK'; // 분식

export interface Restaurant {
  // 공공데이터 원본 식별자 및 출처
  id: string; // 원본 bizesId (상가업소번호)
  source: string; // 공공데이터 출처 명시 (예: '소상공인시장진흥공단')

  // 기본 정보
  name: string; // 상호명 (지점명 포함)
  category: RestaurantCategory; // 매핑된 카테고리
  categoryName: string; // 원본 소분류/중분류 업종명 (예: 백반/한정식, 카페 등)
  address: string; // 지번 주소 (lnoAdr)
  roadAddress: string; // 도로명 주소 (rdnmAdr)
  tel?: string; // 전화번호

  // 위치 및 좌표 (좌표 결측치 대응)
  lat: number | null; // 위도 (없거나 비정상일 경우 null)
  lng: number | null; // 경도 (없거나 비정상일 경우 null)
  hasValidCoords: boolean; // 좌표 유효성 플래그
  distanceMeter?: number; // 현재 위치 기준 계산된 직선거리 (m)

  // 부가 태그
  tags: string[]; // 업종 소분류/중분류 키워드 태그

  // 데이터 종류 구분
  isSampleData: boolean; // 실제 공공데이터(false) vs 샘플(true)

  // 영업상태 (공공데이터에 제공되는 경우에만 저장, 미제공 시 null 또는 미등록)
  status?: string | null;

  // DB 갱신 일시
  updatedAt?: string;

  // 미제공 항목 안내 문구 (실제 제공되지 않는 평점, 리뷰, 사진, 영업시간 왜곡 방지)
  ratingNotice: string;
  reviewNotice: string;
  openingHoursNotice: string;
}

export type DistanceFilterType = 'ALL' | '500m' | '1km' | '3km';

export interface LocationCoords {
  lat: number;
  lng: number;
  name: string;
}

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';
