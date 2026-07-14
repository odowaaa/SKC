/** Haversine distance in kilometers between two GPS coordinates. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Simple flat delivery fee model based on distance; replace with real pricing engine later. */
export function estimateDeliveryFee(km: number): number {
  const base = 1.5;
  const perKm = 0.5;
  return Math.round((base + km * perKm) * 100) / 100;
}
