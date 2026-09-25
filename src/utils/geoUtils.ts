/**
 * Geolocation & Haversine distance utilities for Kids Vatika Smart School
 * Coordinates: Latitude 30.6390703, Longitude 76.818226
 * Allowed Radius: 120 metres | Maximum GPS Accuracy: 150 metres
 */

export interface GeoLocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  label: string;
}

export const KIDS_VATIKA_GEOFENCE = {
  SCHOOL_NAME: 'Kids Vatika Smart School',
  LATITUDE: 30.6390703,
  LONGITUDE: 76.818226,
  ALLOWED_RADIUS_METRES: 120,
  MAX_ACCURACY_METRES: 150,
};

export const PRESET_LOCATIONS: GeoLocationState[] = [
  {
    label: 'Campus Admin Office (Optimal)',
    latitude: 30.6390703,
    longitude: 76.818226,
    accuracy: 8.5,
  },
  {
    label: 'Main School Gate Entrance (~28m)',
    latitude: 30.639200,
    longitude: 76.818450,
    accuracy: 12.0,
  },
  {
    label: 'Primary Wing & Playground (~95m)',
    latitude: 30.639720,
    longitude: 76.818850,
    accuracy: 18.0,
  },
  {
    label: 'Outer Campus Gate Boundary (~115m)',
    latitude: 30.639810,
    longitude: 76.819080,
    accuracy: 15.0,
  },
  {
    label: 'Outside Campus - Main Market Road (~460m) [REJECTION TEST]',
    latitude: 30.642100,
    longitude: 76.822000,
    accuracy: 22.0,
  },
  {
    label: 'Weak GPS Signal (Accuracy 185m > 150m) [ACCURACY REJECTION TEST]',
    latitude: 30.6390703,
    longitude: 76.818226,
    accuracy: 185.0,
  },
];

/**
 * Calculates Great-Circle distance in metres using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in metres
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function evaluateGeofence(
  lat: number,
  lng: number,
  accuracy: number
): {
  distanceMetres: number;
  isWithinRadius: boolean;
  isAccuracyAcceptable: boolean;
  statusText: string;
  canCheckIn: boolean;
} {
  const distance = calculateHaversineDistance(
    lat,
    lng,
    KIDS_VATIKA_GEOFENCE.LATITUDE,
    KIDS_VATIKA_GEOFENCE.LONGITUDE
  );

  const isAccuracyAcceptable = accuracy <= KIDS_VATIKA_GEOFENCE.MAX_ACCURACY_METRES;
  const isWithinRadius = distance <= KIDS_VATIKA_GEOFENCE.ALLOWED_RADIUS_METRES;

  let statusText = '';
  let canCheckIn = false;

  if (!isAccuracyAcceptable) {
    statusText = `Weak GPS accuracy (${accuracy.toFixed(0)}m). Max allowed is 150m. Step into an open area.`;
  } else if (!isWithinRadius) {
    statusText = `Outside school perimeter: ${(distance).toFixed(0)}m away (Allowed radius: 120m).`;
  } else {
    statusText = `Inside school campus: ${(distance).toFixed(0)}m from center (Accuracy: ${accuracy.toFixed(0)}m).`;
    canCheckIn = true;
  }

  return {
    distanceMetres: Math.round(distance),
    isWithinRadius,
    isAccuracyAcceptable,
    statusText,
    canCheckIn,
  };
}
