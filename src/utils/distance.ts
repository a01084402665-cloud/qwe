/**
 * 두 좌표 사이의 거리를 Haversine 공식을 사용해 계산합니다 (단위: 미터).
 */
export function calculateDistanceMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 지구 반경 (미터)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * 거리(미터)를 사람이 읽기 쉬운 문자열 형태로 변환합니다.
 */
export function formatDistance(distanceMeter?: number): string {
  if (distanceMeter === undefined || distanceMeter === null) return '';
  if (distanceMeter < 1000) {
    return `${distanceMeter}m`;
  }
  return `${(distanceMeter / 1000).toFixed(1)}km`;
}
