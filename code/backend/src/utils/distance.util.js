// E:\SPL-II_working_directory\backend\src\utils\distance.util.js
import { getDistance } from "geolib";
import { IUT_GATE } from "../constants.js";

/**
 * Normalizes input coordinates into the strict format geolib needs { latitude, longitude }.
 */
function normalizeLatLng(point) {
  if (!point) return null;

  let lat = null;
  let lng = null;

  // 1. Handle MongoDB GeoJSON format array: [longitude, latitude]
  if (Array.isArray(point) && point.length === 2) {
    // Bangladesh Longitude is ~90, Latitude is ~23.
    // If index 0 is greater than index 1, it's GeoJSON format [lng, lat]
    if (Math.abs(point[0]) > Math.abs(point[1])) {
      lng = point[0];
      lat = point[1];
    } else {
      // Fallback if it arrives as Leaflet standard [lat, lng]
      lat = point[0];
      lng = point[1];
    }
  } 
  // 2. Handle a full GeoJSON subdocument object: { type: 'Point', coordinates: [lng, lat] }
  else if (point.type === "Point" && Array.isArray(point.coordinates)) {
    lng = point.coordinates[0];
    lat = point.coordinates[1];
  }
  // 3. Handle standard JavaScript coordinate objects
  else if (typeof point === "object") {
    lat = point.lat ?? point.latitude;
    lng = point.lng ?? point.longitude;
  }

  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  // geolib strictly expects properties named "latitude" and "longitude"
  return { latitude: Number(lat), longitude: Number(lng) };
}

/**
 * Distance in metres from a point to the IUT main gate using geolib.
 */
export function distanceFromIut(point) {
  const normPoint = normalizeLatLng(point);
  const normGate = normalizeLatLng(IUT_GATE);

  if (!normPoint || !normGate) {
    console.error("🔴 Distance calculation failed due to invalid coordinates.", { input: point, gate: IUT_GATE });
    return NaN;
  }

  // Returns the precise geodetic distance in meters
  return getDistance(normPoint, normGate);
}

/** Human-friendly distance label, e.g. "650 m" or "1.4 km". */
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return "Unknown";
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Rough walking time (avg 1.35 m/s) in minutes. */
export function walkingMinutes(meters) {
  if (meters == null || Number.isNaN(meters)) return 1;
  return Math.max(1, Math.round(meters / 1.35 / 60));
}

/** Rough rickshaw/ride time (avg ~20 km/h in campus-area traffic) in minutes. */
export function ridingMinutes(meters) {
  if (meters == null || Number.isNaN(meters)) return 1;
  const speedMetersPerSecond = (20 * 1000) / 3600; // ~5.56 m/s
  return Math.max(1, Math.round(meters / speedMetersPerSecond / 60));
}
