import { NextResponse } from 'next/server';
import {
  getSupabaseServerClient,
  mapDbToRestaurant,
  DbRestaurant,
} from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '음식점 식별자(id)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: '데이터베이스 연결 설정이 되어 있지 않습니다.' },
        { status: 500 }
      );
    }

    // 1. origin_id(공공데이터 원본 고유번호) 또는 id(UUID)로 DB 단건 조회
    // UUID 형식 검증 정규식
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('restaurants').select('*');
    if (isUuid) {
      query = query.or(`id.eq.${id},origin_id.eq.${id}`);
    } else {
      query = query.eq('origin_id', id);
    }

    const { data: records, error } = await query.limit(1);

    if (error) {
      console.warn('Supabase get detail warning (table might not exist yet):', error.message);
      return NextResponse.json(
        { success: false, error: `데이터베이스에서 음식점을 찾을 수 없습니다: ${error.message}` },
        { status: 404 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { success: false, error: '해당 음식점 정보를 DB에서 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const restaurant = mapDbToRestaurant(records[0] as DbRestaurant);

    return NextResponse.json({
      success: true,
      data: restaurant,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    console.error('API /api/restaurants/[id] error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
