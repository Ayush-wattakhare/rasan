/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is within a radius of another point
 */
export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radiusKm;
}

/**
 * Calculate delivery fee based on distance
 */
export function calculateDeliveryFee(distanceKm: number): number {
  const BASE_FEE = 30; // Base delivery fee in INR
  const PER_KM_FEE = 10; // Fee per kilometer

  if (distanceKm <= 2) {
    return BASE_FEE;
  }

  return BASE_FEE + Math.ceil(distanceKm - 2) * PER_KM_FEE;
}

/**
 * Estimate delivery time based on distance
 * @param distanceKm - Distance in kilometers
 * @returns Estimated time in minutes
 */
export function estimateDeliveryTime(distanceKm: number): number {
  const AVERAGE_SPEED_KM_PER_HOUR = 20; // Average delivery speed
  const PREPARATION_TIME_MINUTES = 20; // Average meal preparation time

  const travelTimeMinutes = (distanceKm / AVERAGE_SPEED_KM_PER_HOUR) * 60;
  return Math.ceil(PREPARATION_TIME_MINUTES + travelTimeMinutes);
}
