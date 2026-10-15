# 우리동네 맛집 (My Neighborhood Food Finder)

우리 동네 음식점 정보를 찾는 모바일 우선 반응형 웹 서비스입니다.  
공공데이터포털(소상공인시장진흥공단) 상가정보와 Supabase PostGIS 공간 데이터베이스, 카카오 지도를 실시간으로 연동하여 내 주변 500m / 1km / 3km 반경 안의 음식점을 검색합니다.

---

## 📌 주요 특징 및 기능

1. **카카오 지도 SDK 연동**
   - 실시간 카카오 지도 렌더링, 현재 위치 중심 표시, 500m / 1km / 3km 반경 원 시각화
   - 음식점 핀 마커 및 마커 클릭 시 요약 오버레이(상호명 및 직선거리) 표시
2. **소상공인시장진흥공단 공공데이터 실시간 연동**
   - 소상공인시장진흥공단 상가(상권)정보 공식 API 연동
   - 원본 ID, 출처, 상호명, 도로명/지번 주소, 업종, 좌표, 영업상태 보존
3. **Supabase PostGIS 공간 데이터베이스 연동**
   - PostGIS `GEOGRAPHY(Point, 4326)` 및 GIST 공간 인덱스를 활용한 고속 반경 검색
   - 지표면 최단 직선거리(`distance_meter`) DB 레벨 계산 및 가까운 순서 오름차순 정렬
   - 공공데이터 수집 시 `(source, origin_id)` 복합 고유 키를 통한 중복 방지 및 자동 Upsert 갱신
4. **내 주변 위치 기반 검색 (Geolocation)**
   - 브라우저 위치 권한을 통한 실시간 GPS 좌표 수신
   - 위치 권한 거부/미지원 시 인천 서구 등 주요 동네 '지역 직접 선택' Fallback UI 제공
   - 개인정보 보호: 사용자 브라우저 현재 위치는 DB에 절대 저장되지 않음
5. **업종 & 검색어 필터**
   - 한식, 중식, 일식, 양식, 카페·디저트, 분식 카테고리 필터
   - 상호명, 메뉴, 도로명 주소 실시간 디바운스(280ms) 검색
6. **모바일 우선 반응형 UI & 바텀시트 상세 정보**
   - 모바일 최적화 레이아웃 및 데스크톱 반응형 지원
   - 목록 ↔ 지도 하단 플로팅 토글 뷰 전환
   - 주소 복사, 카카오맵 길찾기 링크 제공

---

## 🚀 로컬 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 🔑 환경변수 설정 (.env.local)

```env
# 카카오 지도 JavaScript 키
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_javascript_key_here

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# 공공데이터포털 서비스키
DATA_GO_KR_API_KEY=your_data_go_kr_service_key_here
```
