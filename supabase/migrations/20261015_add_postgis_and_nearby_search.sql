-- ==============================================================================
-- 1. PostGIS 확장 기능 활성화 및 location 칼럼/공간 인덱스 추가
-- ==============================================================================

-- PostGIS 공간 지리 데이터 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- restaurants 테이블이 없을 경우를 대비한 테이블 생성 (이미 존재하면 건너뜀)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_id TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT '소상공인시장진흥공단 공공데이터포털',
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_name TEXT NOT NULL,
    road_address TEXT,
    address TEXT,
    tel TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    has_valid_coords BOOLEAN DEFAULT true,
    status TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_restaurants_source_origin UNIQUE (source, origin_id)
);

-- PostGIS 공간 좌표(geography Point, SRID 4326) 칼럼 추가
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- ==============================================================================
-- 2. 위·경도(lat, lng) 기반 location 자동 계산 트리거
-- ==============================================================================

-- 중요: PostGIS의 좌표 순서는 ST_MakePoint(경도/X, 위도/Y) 즉 ST_MakePoint(lng, lat)입니다.
CREATE OR REPLACE FUNCTION public.handle_restaurants_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL AND NEW.has_valid_coords = true THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    ELSE
        NEW.location := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restaurants_location ON public.restaurants;
CREATE TRIGGER trigger_restaurants_location
    BEFORE INSERT OR UPDATE OF lat, lng, has_valid_coords ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_restaurants_location();

-- 기존 데이터가 존재할 경우 location 일괄 갱신
UPDATE public.restaurants
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL AND has_valid_coords = true AND location IS NULL;

-- ==============================================================================
-- 3. 공간 인덱스(GIST) 및 검색 성능 최적화 인덱스 생성
-- ==============================================================================

-- 공간 인덱스: ST_DWithin 및 ST_Distance 반경 검색 속도 극대화
CREATE INDEX IF NOT EXISTS idx_restaurants_location 
    ON public.restaurants 
    USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_restaurants_category ON public.restaurants(category);
CREATE INDEX IF NOT EXISTS idx_restaurants_origin_id ON public.restaurants(origin_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON public.restaurants(name);

-- ==============================================================================
-- 4. PostGIS 기반 주변 음식점 검색 함수 (nearby_restaurants)
--    - 거리 단위: 미터 (meter)
--    - 반경(radius_meter): 500, 1000, 3000 등 미터 단위 엄격 필터링
--    - 정렬: 직선거리(distance_meter) 오름차순 DB에서 직접 정렬
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.nearby_restaurants(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_meter INTEGER DEFAULT 1000,
    filter_category TEXT DEFAULT 'ALL',
    search_query TEXT DEFAULT '',
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    origin_id TEXT,
    source TEXT,
    name TEXT,
    category TEXT,
    category_name TEXT,
    road_address TEXT,
    address TEXT,
    tel TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    has_valid_coords BOOLEAN,
    status TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    distance_meter DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    -- 중요: ST_MakePoint(경도 user_lng, 위도 user_lat) 순서
    user_point GEOGRAPHY := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
    clean_query TEXT := TRIM(COALESCE(search_query, ''));
    clean_category TEXT := TRIM(COALESCE(filter_category, 'ALL'));
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.origin_id,
        r.source,
        r.name,
        r.category,
        r.category_name,
        r.road_address,
        r.address,
        r.tel,
        r.lat,
        r.lng,
        r.has_valid_coords,
        r.status,
        r.tags,
        r.created_at,
        r.updated_at,
        ROUND(ST_Distance(r.location, user_point)::numeric, 1)::double precision AS distance_meter
    FROM public.restaurants r
    WHERE
        r.location IS NOT NULL
        -- 1. 반경 필터 (ST_DWithin: 미터 단위 대원 직선거리)
        AND ST_DWithin(r.location, user_point, radius_meter)
        -- 2. 업종 카테고리 필터
        AND (clean_category = 'ALL' OR r.category = clean_category)
        -- 3. 상호명 / 주소 / 업종태그 통합 검색 필터
        AND (
            clean_query = ''
            OR r.name ILIKE '%' || clean_query || '%'
            OR r.road_address ILIKE '%' || clean_query || '%'
            OR r.address ILIKE '%' || clean_query || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(r.tags) AS tag WHERE tag ILIKE '%' || clean_query || '%'
            )
        )
    ORDER BY
        distance_meter ASC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.nearby_restaurants(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;
