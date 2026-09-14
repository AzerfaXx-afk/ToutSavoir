// OSIRIS Space Intelligence: Keplerian Orbital Mechanics & Ground Track Propagation
// Provides high-accuracy sub-satellite ground footprints, S-curve ground tracks, and real-time coordinates

const R_EARTH_KM = 6371;
const SECONDS_PER_DAY = 86164.0905; // Sidereal day in seconds
const WE_DEG_PER_SEC = 360 / SECONDS_PER_DAY; // Earth rotation ~0.004178 deg/s

/**
 * Known station longitudes for Geostationary (GEO) assets
 */
const GEO_STATIONS = {
  'sat-meteosat12': 0.0,
  'sat-goes18': -137.0,
  'sat-goes16': -75.2,
  'sat-inmarsat6': 64.5,
};

/**
 * Computes instantaneous satellite state (sub-satellite ground coordinates, footprint, speed, heading)
 * @param {Object} sat - Satellite object from SATELLITES_DATA
 * @param {number} timestampMs - Epoch time in milliseconds
 * @returns {Object} Enriched real-time satellite telemetry
 */
export function computeSatelliteState(sat, timestampMs = Date.now()) {
  const tSec = timestampMs / 1000;
  const isGeo = sat.orbitType === 'GEO' || sat.altitudeKm > 30000;

  let lat = 0;
  let lng = 0;
  let heading = 90;
  let thetaRad = 0;

  if (isGeo) {
    // Geostationary satellite: stationary above equator at designated longitude
    const designatedLng = GEO_STATIONS[sat.id] ?? sat.stationLng ?? ((sat.noradId % 360) - 180);
    // Slight sub-degree diurnal figure-8 oscillation if minor inclination
    const incRad = ((sat.inclination || 0.05) * Math.PI) / 180;
    const geoPeriodSec = (sat.periodMin || 1436.1) * 60;
    const geoOmega = (2 * Math.PI) / geoPeriodSec;
    const geoPhase = (sat.noradId * 13) % (Math.PI * 2);
    thetaRad = geoPhase + geoOmega * tSec;

    lat = Math.asin(Math.sin(incRad) * Math.sin(thetaRad)) * (180 / Math.PI);
    lng = designatedLng + Math.sin(thetaRad * 2) * 0.12;
    heading = 90;
  } else {
    // LEO / MEO Keplerian ground track propagation
    const incRad = ((sat.inclination || 51.6) * Math.PI) / 180;
    const raanDeg = sat.raan !== undefined ? sat.raan : ((sat.noradId * 37) % 360);
    const periodSec = Math.max(80 * 60, (sat.periodMin || 93) * 60);
    const omegaSatRadSec = (2 * Math.PI) / periodSec;

    const initialPhaseRad = sat.initialPhase ?? (((sat.noradId * 17) % 360) * Math.PI) / 180;
    thetaRad = (initialPhaseRad + omegaSatRadSec * tSec) % (Math.PI * 2);

    // Sub-satellite latitude
    const sinLat = Math.sin(incRad) * Math.sin(thetaRad);
    const latRad = Math.asin(Math.max(-1, Math.min(1, sinLat)));
    lat = latRad * (180 / Math.PI);

    // Orbital plane right ascension
    const deltaLngRad = Math.atan2(Math.cos(incRad) * Math.sin(thetaRad), Math.cos(thetaRad));
    const deltaLngDeg = deltaLngRad * (180 / Math.PI);

    // Subtract Earth's sidereal rotation beneath the orbit
    const earthRotationDeg = (WE_DEG_PER_SEC * tSec) % 360;
    let rawLng = (raanDeg + deltaLngDeg - earthRotationDeg) % 360;
    if (rawLng > 180) rawLng -= 360;
    if (rawLng < -180) rawLng += 360;
    lng = rawLng;

    // Flight heading (azimuth of ground velocity vector)
    const cosLat = Math.cos(latRad);
    const cosInc = Math.cos(incRad);
    const headingRad = Math.atan2(cosInc, Math.max(0.001, cosLat));
    heading = (headingRad * (180 / Math.PI) + 360) % 360;
    if (Math.cos(thetaRad) < 0) {
      heading = (180 - heading + 360) % 360;
    }
  }

  // Horizon footprint visibility circle
  const altKm = sat.altitudeKm || 400;
  const angularRadiusRad = Math.acos(Math.max(0.01, Math.min(0.999, R_EARTH_KM / (R_EARTH_KM + altKm))));
  const footprintKm = Math.round(R_EARTH_KM * angularRadiusRad * 2);
  const footprintRadiusM = Math.round(R_EARTH_KM * angularRadiusRad * 1000);

  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    altitudeKm: altKm,
    speedKmh: sat.speedKmh || 27600,
    footprintKm,
    footprintRadiusM,
    heading: Math.round(heading),
    thetaRad,
  };
}

/**
 * Generates continuous multi-revolution ground tracks split cleanly at the antimeridian (+/-180 deg)
 * @param {Object} sat - Satellite object
 * @param {number} currentTimeMs - Current timestamp
 * @param {number} pastMin - Historical ground track minutes
 * @param {number} futureMin - Predicted orbital path minutes
 * @param {number} stepSec - Step resolution in seconds
 * @returns {Array<Array<[number, number]>>} Polyline segments ready for Leaflet
 */
export function getSatelliteGroundTrackSegments(
  sat,
  currentTimeMs = Date.now(),
  pastMin = 30,
  futureMin = 65,
  stepSec = 60
) {
  if (sat.orbitType === 'GEO' || sat.altitudeKm > 30000) {
    return []; // GEO satellites remain hovering over their fixed meridian
  }

  const startMs = currentTimeMs - pastMin * 60 * 1000;
  const endMs = currentTimeMs + futureMin * 60 * 1000;
  const stepMs = stepSec * 1000;

  const segments = [];
  let currentSegment = [];
  let prevLng = null;

  for (let t = startMs; t <= endMs; t += stepMs) {
    const pos = computeSatelliteState(sat, t);

    if (prevLng !== null) {
      // Split line when crossing the 180th meridian (antimeridian wrap)
      if (Math.abs(pos.lng - prevLng) > 180) {
        if (currentSegment.length > 1) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }
    }

    currentSegment.push([pos.lat, pos.lng]);
    prevLng = pos.lng;
  }

  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Categorizes satellites for quick tactical filtering
 */
export const SATELLITE_ORBIT_CATEGORIES = [
  { id: 'ALL', label: 'Toutes orbites' },
  { id: 'STATIONS', label: 'Stations Spatiales (LEO)' },
  { id: 'MILITARY', label: 'Défense & Renseignement' },
  { id: 'EARTH_OBS', label: 'Observation & Climat' },
  { id: 'GNSS', label: 'Navigation GNSS (MEO)' },
  { id: 'GEO', label: 'Géostationnaires (GEO)' },
  { id: 'STARLINK', label: 'Mégaconstellations' },
];

/**
 * Match a satellite to a category filter
 */
export function matchesSatelliteCategory(sat, categoryId) {
  if (!categoryId || categoryId === 'ALL') return true;
  const type = (sat.type || '').toLowerCase();
  const name = (sat.name || '').toLowerCase();
  const code = (sat.code || '').toLowerCase();
  const orbit = (sat.orbitType || '').toUpperCase();

  switch (categoryId) {
    case 'STATIONS':
      return sat.id === 'sat-iss' || sat.id === 'sat-css' || type.includes('habitation') || type.includes('laboratoire');
    case 'MILITARY':
      return (
        type.includes('espionnage') ||
        type.includes('défense') ||
        type.includes('reconnaissance') ||
        type.includes('surveillance spatiale') ||
        sat.country?.toLowerCase().includes('nro') ||
        sat.country?.toLowerCase().includes('vks') ||
        sat.country?.toLowerCase().includes('dga') ||
        sat.country?.toLowerCase().includes('mod')
      );
    case 'EARTH_OBS':
      return (
        type.includes('imagerie') ||
        type.includes('observation') ||
        type.includes('météorologie') ||
        type.includes('climat') ||
        name.includes('sentinel') ||
        name.includes('terra') ||
        name.includes('noaa')
      );
    case 'GNSS':
      return orbit === 'MEO' || type.includes('navigation') || type.includes('positionnement');
    case 'GEO':
      return orbit === 'GEO' || (sat.altitudeKm && sat.altitudeKm > 30000);
    case 'STARLINK':
      return code.includes('STARLINK') || name.includes('starlink') || type.includes('broadband');
    default:
      return true;
  }
}
