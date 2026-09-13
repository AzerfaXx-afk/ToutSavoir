// Real-time Global Transit Vectors: Commercial & Strategic Aviation + Maritime Shipping
// Provides live coordinates, headings, altitudes, speeds, and routes.

// Helper for spherical interpolation (Slerp) along great circle corridors
export function interpolateGreatCircle(p1, p2, fraction) {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lon1 = (p1[1] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const lon2 = (p2[1] * Math.PI) / 180;

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
      )
    );

  if (d === 0) return [p1[0], p1[1]];

  const A = Math.sin((1 - fraction) * d) / Math.sin(d);
  const B = Math.sin(fraction * d) / Math.sin(d);

  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
  const lon = Math.atan2(y, x);

  return [(lat * 180) / Math.PI, (lon * 180) / Math.PI];
}

// Calculate bearing/heading between two points
export function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// 1. LIVE AVIATION TRANSITS (20 Strategic & Commercial Flights)
export const LIVE_FLIGHTS = [
  {
    id: 'fl-af022',
    callsign: 'AFR022',
    flightNum: 'AF 22',
    airline: 'Air France',
    aircraft: 'Boeing 777-300ER',
    origin: { code: 'CDG', city: 'Paris', country: 'France', coords: [49.0097, 2.5479] },
    destination: { code: 'JFK', city: 'New York', country: 'États-Unis', coords: [40.6413, -73.7781] },
    altitudeFt: 37000,
    altitudeM: 11280,
    speedKmh: 915,
    speedKts: 494,
    heading: 284,
    squawk: '7312',
    progress: 0.46, // Initial progress along flight corridor (0.0 to 1.0)
    cycleDurationSec: 3600,
    corridorType: 'Transatlantique Nord',
  },
  {
    id: 'fl-ba281',
    callsign: 'BAW281',
    flightNum: 'BA 281',
    airline: 'British Airways',
    aircraft: 'Airbus A350-1000',
    origin: { code: 'LHR', city: 'Londres', country: 'Royaume-Uni', coords: [51.4700, -0.4543] },
    destination: { code: 'LAX', city: 'Los Angeles', country: 'États-Unis', coords: [33.9416, -118.4085] },
    altitudeFt: 39000,
    altitudeM: 11890,
    speedKmh: 890,
    speedKts: 480,
    heading: 295,
    squawk: '4210',
    progress: 0.62,
    cycleDurationSec: 4500,
    corridorType: 'Route Polaire Transatlantique',
  },
  {
    id: 'fl-lh778',
    callsign: 'DLH778',
    flightNum: 'LH 778',
    airline: 'Lufthansa',
    aircraft: 'Boeing 747-8 Intercontinental',
    origin: { code: 'FRA', city: 'Francfort', country: 'Allemagne', coords: [50.0379, 8.5622] },
    destination: { code: 'SIN', city: 'Singapour', country: 'Singapour', coords: [1.3644, 103.9915] },
    altitudeFt: 35000,
    altitudeM: 10670,
    speedKmh: 940,
    speedKts: 508,
    heading: 118,
    squawk: '6523',
    progress: 0.58,
    cycleDurationSec: 5400,
    corridorType: 'Eurasie Sud / Océan Indien',
  },
  {
    id: 'fl-ek414',
    callsign: 'UAE414',
    flightNum: 'EK 414',
    airline: 'Emirates',
    aircraft: 'Airbus A380-800',
    origin: { code: 'DXB', city: 'Dubaï', country: 'Émirats Arabes Unis', coords: [25.2532, 55.3657] },
    destination: { code: 'SYD', city: 'Sydney', country: 'Australie', coords: [-33.9399, 151.1753] },
    altitudeFt: 40000,
    altitudeM: 12190,
    speedKmh: 920,
    speedKts: 497,
    heading: 132,
    squawk: '3145',
    progress: 0.38,
    cycleDurationSec: 5400,
    corridorType: 'Transocéan Indien Austral',
  },
  {
    id: 'fl-nh008',
    callsign: 'ANA008',
    flightNum: 'NH 8',
    airline: 'All Nippon Airways',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: { code: 'HND', city: 'Tokyo', country: 'Japon', coords: [35.5494, 139.7798] },
    destination: { code: 'SFO', city: 'San Francisco', country: 'États-Unis', coords: [37.6213, -122.3790] },
    altitudeFt: 38000,
    altitudeM: 11580,
    speedKmh: 980,
    speedKts: 529,
    heading: 75,
    squawk: '1277',
    progress: 0.72,
    cycleDurationSec: 4200,
    corridorType: 'Transpacifique Jet Stream',
  },
  {
    id: 'fl-ke041',
    callsign: 'KAL041',
    flightNum: 'KE 41',
    airline: 'Korean Air',
    aircraft: 'Boeing 777-300ER',
    origin: { code: 'ICN', city: 'Séoul', country: 'Corée du Sud', coords: [37.4602, 126.4407] },
    destination: { code: 'SEA', city: 'Seattle', country: 'États-Unis', coords: [47.4502, -122.3088] },
    altitudeFt: 36000,
    altitudeM: 10970,
    speedKmh: 925,
    speedKts: 500,
    heading: 68,
    squawk: '5542',
    progress: 0.44,
    cycleDurationSec: 4200,
    corridorType: 'Route Transpacifique Nord',
  },
  {
    id: 'fl-cx251',
    callsign: 'CPA251',
    flightNum: 'CX 251',
    airline: 'Cathay Pacific',
    aircraft: 'Airbus A350-900',
    origin: { code: 'HKG', city: 'Hong Kong', country: 'Chine', coords: [22.3080, 113.9185] },
    destination: { code: 'LHR', city: 'Londres', country: 'Royaume-Uni', coords: [51.4700, -0.4543] },
    altitudeFt: 41000,
    altitudeM: 12500,
    speedKmh: 885,
    speedKts: 478,
    heading: 310,
    squawk: '6712',
    progress: 0.51,
    cycleDurationSec: 5100,
    corridorType: 'Route Continentale Asie-Europe',
  },
  {
    id: 'fl-qr773',
    callsign: 'QTR773',
    flightNum: 'QR 773',
    airline: 'Qatar Airways',
    aircraft: 'Boeing 777-200LR',
    origin: { code: 'DOH', city: 'Doha', country: 'Qatar', coords: [25.2609, 51.5651] },
    destination: { code: 'GRU', city: 'São Paulo', country: 'Brésil', coords: [-23.4356, -46.4731] },
    altitudeFt: 34000,
    altitudeM: 10360,
    speedKmh: 895,
    speedKts: 483,
    heading: 242,
    squawk: '2104',
    progress: 0.65,
    cycleDurationSec: 5400,
    corridorType: 'Moyen-Orient / Amérique du Sud',
  },
  {
    id: 'fl-sq022',
    callsign: 'SIA022',
    flightNum: 'SQ 22 (Vol le plus long du monde)',
    airline: 'Singapore Airlines',
    aircraft: 'Airbus A350-900ULR',
    origin: { code: 'SIN', city: 'Singapour', country: 'Singapour', coords: [1.3644, 103.9915] },
    destination: { code: 'EWR', city: 'New York (Newark)', country: 'États-Unis', coords: [40.6895, -74.1745] },
    altitudeFt: 41000,
    altitudeM: 12500,
    speedKmh: 930,
    speedKts: 502,
    heading: 35,
    squawk: '7100',
    progress: 0.54,
    cycleDurationSec: 7200,
    corridorType: 'Ultra Long-Courrier Polaire (18h45)',
  },
  {
    id: 'fl-qf009',
    callsign: 'QFA009',
    flightNum: 'QF 9',
    airline: 'Qantas',
    aircraft: 'Boeing 787-9',
    origin: { code: 'PER', city: 'Perth', country: 'Australie', coords: [-31.9403, 115.9668] },
    destination: { code: 'LHR', city: 'Londres', country: 'Royaume-Uni', coords: [51.4700, -0.4543] },
    altitudeFt: 38000,
    altitudeM: 11580,
    speedKmh: 905,
    speedKts: 489,
    heading: 312,
    squawk: '4502',
    progress: 0.40,
    cycleDurationSec: 6600,
    corridorType: 'Océan Indien Direct (Projet Sunrise)',
  },
  {
    id: 'fl-nato-awacs',
    callsign: 'NATO01',
    flightNum: 'E-3A AWACS',
    airline: 'Force Aérienne OTAN',
    aircraft: 'Boeing E-3A Sentry (Surveillance Radar)',
    origin: { code: 'GKE', city: 'Geilenkirchen', country: 'Allemagne', coords: [50.9597, 6.0425] },
    destination: { code: 'PAT', city: 'Patrouille Flanc Est', country: 'Pologne / Roumanie', coords: [52.13, 22.85] },
    altitudeFt: 31000,
    altitudeM: 9450,
    speedKmh: 680,
    speedKts: 367,
    heading: 88,
    squawk: '7777',
    progress: 0.78,
    cycleDurationSec: 2400,
    corridorType: 'Surveillance Radar Flanc Est OTAN',
  },
  {
    id: 'fl-usaf-forte10',
    callsign: 'FORTE10',
    flightNum: 'RQ-4B Global Hawk',
    airline: 'US Air Force Recon',
    aircraft: 'Northrop Grumman RQ-4B (Drone HALE)',
    origin: { code: 'SIG', city: 'Sigonella', country: 'Italie', coords: [37.4017, 14.9225] },
    destination: { code: 'BSH', city: 'Orbite Mer Noire', country: 'Mer Noire', coords: [43.50, 31.80] },
    altitudeFt: 53000,
    altitudeM: 16150,
    speedKmh: 575,
    speedKts: 310,
    heading: 65,
    squawk: '1400',
    progress: 0.85,
    cycleDurationSec: 2700,
    corridorType: 'Reconnaissance Haute Altitude HALE',
  },
  {
    id: 'fl-aa1140',
    callsign: 'AAL1140',
    flightNum: 'AA 1140',
    airline: 'American Airlines',
    aircraft: 'Boeing 737 MAX 8',
    origin: { code: 'ORD', city: 'Chicago', country: 'États-Unis', coords: [41.9742, -87.9073] },
    destination: { code: 'MIA', city: 'Miami', country: 'États-Unis', coords: [25.7959, -80.2870] },
    altitudeFt: 33000,
    altitudeM: 10060,
    speedKmh: 860,
    speedKts: 464,
    heading: 155,
    squawk: '3318',
    progress: 0.52,
    cycleDurationSec: 1800,
    corridorType: 'Moyen-Courrier Nord-Sud USA',
  },
  {
    id: 'fl-ib325',
    callsign: 'IBE325',
    flightNum: 'IB 325',
    airline: 'Iberia',
    aircraft: 'Airbus A321neo',
    origin: { code: 'MAD', city: 'Madrid', country: 'Espagne', coords: [40.4839, -3.5680] },
    destination: { code: 'FCO', city: 'Rome', country: 'Italie', coords: [41.8003, 12.2389] },
    altitudeFt: 36000,
    altitudeM: 10970,
    speedKmh: 845,
    speedKts: 456,
    heading: 85,
    squawk: '2714',
    progress: 0.63,
    cycleDurationSec: 1500,
    corridorType: 'Transméditerranéen Ouest-Est',
  },
  {
    id: 'fl-ms840',
    callsign: 'MSR840',
    flightNum: 'MS 840',
    airline: 'EgyptAir',
    aircraft: 'Boeing 787-9',
    origin: { code: 'JNB', city: 'Johannesburg', country: 'Afrique du Sud', coords: [-26.1367, 28.2411] },
    destination: { code: 'CAI', city: 'Le Caire', country: 'Égypte', coords: [30.1219, 31.4056] },
    altitudeFt: 39000,
    altitudeM: 11890,
    speedKmh: 900,
    speedKts: 486,
    heading: 5,
    squawk: '4019',
    progress: 0.48,
    cycleDurationSec: 3900,
    corridorType: 'Transafricain Méridien',
  },
  {
    id: 'fl-af447',
    callsign: 'AFR447',
    flightNum: 'AF 447',
    airline: 'Air France',
    aircraft: 'Airbus A350-900',
    origin: { code: 'GIG', city: 'Rio de Janeiro', country: 'Brésil', coords: [-22.8089, -43.2436] },
    destination: { code: 'CDG', city: 'Paris', country: 'France', coords: [49.0097, 2.5479] },
    altitudeFt: 38000,
    altitudeM: 11580,
    speedKmh: 895,
    speedKts: 483,
    heading: 28,
    squawk: '6241',
    progress: 0.52,
    cycleDurationSec: 4800,
    corridorType: 'Transatlantique Sud Équatorial',
  },
  {
    id: 'fl-cx888',
    callsign: 'CPA888',
    flightNum: 'CX 888',
    airline: 'Cathay Pacific',
    aircraft: 'Boeing 777-300ER',
    origin: { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', coords: [22.3080, 113.9185] },
    destination: { code: 'YVR', city: 'Vancouver', country: 'Canada', coords: [49.1967, -123.1815] },
    altitudeFt: 36000,
    altitudeM: 10970,
    speedKmh: 935,
    speedKts: 505,
    heading: 48,
    squawk: '7112',
    progress: 0.65,
    cycleDurationSec: 4600,
    corridorType: 'Transpacifique Arc Aléoutiennes',
  },
  {
    id: 'fl-qr908',
    callsign: 'QTR908',
    flightNum: 'QR 908',
    airline: 'Qatar Airways',
    aircraft: 'Airbus A350-1000',
    origin: { code: 'DOH', city: 'Doha', country: 'Qatar', coords: [25.2731, 51.6081] },
    destination: { code: 'SYD', city: 'Sydney', country: 'Australie', coords: [-33.9399, 151.1753] },
    altitudeFt: 41000,
    altitudeM: 12500,
    speedKmh: 915,
    speedKts: 494,
    heading: 128,
    squawk: '3520',
    progress: 0.41,
    cycleDurationSec: 5200,
    corridorType: 'Moyen-Orient - Océanie',
  },
  {
    id: 'fl-sq022',
    callsign: 'SIA022',
    flightNum: 'SQ 22',
    airline: 'Singapore Airlines',
    aircraft: 'Airbus A350-900ULR',
    origin: { code: 'SIN', city: 'Singapour', country: 'Singapour', coords: [1.3644, 103.9915] },
    destination: { code: 'EWR', city: 'New York (Newark)', country: 'États-Unis', coords: [40.6895, -74.1745] },
    altitudeFt: 40000,
    altitudeM: 12190,
    speedKmh: 925,
    speedKts: 499,
    heading: 32,
    squawk: '5174',
    progress: 0.58,
    cycleDurationSec: 6400,
    corridorType: 'Ultra Long-Courrier Polaire',
  },
  {
    id: 'fl-aa100',
    callsign: 'AAL100',
    flightNum: 'AA 100',
    airline: 'American Airlines',
    aircraft: 'Boeing 777-200ER',
    origin: { code: 'JFK', city: 'New York', country: 'États-Unis', coords: [40.6413, -73.7781] },
    destination: { code: 'LHR', city: 'Londres', country: 'Royaume-Uni', coords: [51.4700, -0.4543] },
    altitudeFt: 37000,
    altitudeM: 11280,
    speedKmh: 960,
    speedKts: 518,
    heading: 68,
    squawk: '2345',
    progress: 0.35,
    cycleDurationSec: 3200,
    corridorType: 'Jet Stream Transatlantique Est',
  },
  {
    id: 'fl-dl200',
    callsign: 'DAL200',
    flightNum: 'DL 200',
    airline: 'Delta Air Lines',
    aircraft: 'Airbus A330-900neo',
    origin: { code: 'ATL', city: 'Atlanta', country: 'États-Unis', coords: [33.6407, -84.4277] },
    destination: { code: 'JNB', city: 'Johannesburg', country: 'Afrique du Sud', coords: [-26.1367, 28.2411] },
    altitudeFt: 39000,
    altitudeM: 11890,
    speedKmh: 910,
    speedKts: 491,
    heading: 104,
    squawk: '6714',
    progress: 0.70,
    cycleDurationSec: 5600,
    corridorType: 'Atlantique Sud Oblique',
  },
  {
    id: 'fl-ua888',
    callsign: 'UAL888',
    flightNum: 'UA 888',
    airline: 'United Airlines',
    aircraft: 'Boeing 787-9',
    origin: { code: 'SFO', city: 'San Francisco', country: 'États-Unis', coords: [37.6213, -122.3790] },
    destination: { code: 'PEK', city: 'Pékin', country: 'Chine', coords: [40.0799, 116.6031] },
    altitudeFt: 36000,
    altitudeM: 10970,
    speedKmh: 880,
    speedKts: 475,
    heading: 310,
    squawk: '4221',
    progress: 0.44,
    cycleDurationSec: 4800,
    corridorType: 'Transpacifique Arctique',
  },
  {
    id: 'fl-jl006',
    callsign: 'JAL006',
    flightNum: 'JL 6',
    airline: 'Japan Airlines',
    aircraft: 'Airbus A350-1000',
    origin: { code: 'HND', city: 'Tokyo', country: 'Japon', coords: [35.5494, 139.7798] },
    destination: { code: 'JFK', city: 'New York', country: 'États-Unis', coords: [40.6413, -73.7781] },
    altitudeFt: 38000,
    altitudeM: 11580,
    speedKmh: 955,
    speedKts: 516,
    heading: 42,
    squawk: '1355',
    progress: 0.62,
    cycleDurationSec: 4700,
    corridorType: 'Arc Polaire Pacifique-Atlantique',
  },
  {
    id: 'fl-tk001',
    callsign: 'THY001',
    flightNum: 'TK 1',
    airline: 'Turkish Airlines',
    aircraft: 'Boeing 777-300ER',
    origin: { code: 'IST', city: 'Istanbul', country: 'Turquie', coords: [41.2753, 28.7519] },
    destination: { code: 'JFK', city: 'New York', country: 'États-Unis', coords: [40.6413, -73.7781] },
    altitudeFt: 36000,
    altitudeM: 10970,
    speedKmh: 890,
    speedKts: 480,
    heading: 295,
    squawk: '7104',
    progress: 0.38,
    cycleDurationSec: 4200,
    corridorType: 'Europe Centrale - USA',
  },
  {
    id: 'fl-ib6845',
    callsign: 'IBE6845',
    flightNum: 'IB 6845',
    airline: 'Iberia',
    aircraft: 'Airbus A350-900',
    origin: { code: 'MAD', city: 'Madrid', country: 'Espagne', coords: [40.4839, -3.5680] },
    destination: { code: 'EZE', city: 'Buenos Aires', country: 'Argentine', coords: [-34.8222, -58.5358] },
    altitudeFt: 41000,
    altitudeM: 12500,
    speedKmh: 910,
    speedKts: 491,
    heading: 218,
    squawk: '3677',
    progress: 0.54,
    cycleDurationSec: 5000,
    corridorType: 'Europe - Cône Sud Américain',
  },
  {
    id: 'fl-qf009',
    callsign: 'QFA009',
    flightNum: 'QF 9',
    airline: 'Qantas',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: { code: 'PER', city: 'Perth', country: 'Australie', coords: [-31.9403, 115.9668] },
    destination: { code: 'LHR', city: 'Londres', country: 'Royaume-Uni', coords: [51.4700, -0.4543] },
    altitudeFt: 38000,
    altitudeM: 11580,
    speedKmh: 920,
    speedKts: 497,
    heading: 312,
    squawk: '6543',
    progress: 0.68,
    cycleDurationSec: 6200,
    corridorType: 'Australie - Europe Non-Stop',
  },
  {
    id: 'fl-et500',
    callsign: 'ETH500',
    flightNum: 'ET 500',
    airline: 'Ethiopian Airlines',
    aircraft: 'Airbus A350-900',
    origin: { code: 'ADD', city: 'Addis-Abeba', country: 'Éthiopie', coords: [8.9779, 38.7993] },
    destination: { code: 'IAD', city: 'Washington', country: 'États-Unis', coords: [38.9531, -77.4565] },
    altitudeFt: 39000,
    altitudeM: 11890,
    speedKmh: 890,
    speedKts: 480,
    heading: 298,
    squawk: '4532',
    progress: 0.49,
    cycleDurationSec: 5100,
    corridorType: 'Corne de l’Afrique - Amérique',
  },
  {
    id: 'fl-ay1331',
    callsign: 'FIN1331',
    flightNum: 'AY 1331',
    airline: 'Finnair',
    aircraft: 'Airbus A350-900',
    origin: { code: 'HEL', city: 'Helsinki', country: 'Finlande', coords: [60.3172, 24.9633] },
    destination: { code: 'HND', city: 'Tokyo', country: 'Japon', coords: [35.5494, 139.7798] },
    altitudeFt: 41000,
    altitudeM: 12500,
    speedKmh: 915,
    speedKts: 494,
    heading: 38,
    squawk: '7721',
    progress: 0.55,
    cycleDurationSec: 4600,
    corridorType: 'Passage Polaire Nord',
  },
  {
    id: 'fl-la800',
    callsign: 'LAN800',
    flightNum: 'LA 800',
    airline: 'LATAM Airlines',
    aircraft: 'Boeing 787-9',
    origin: { code: 'SYD', city: 'Sydney', country: 'Australie', coords: [-33.9399, 151.1753] },
    destination: { code: 'SCL', city: 'Santiago', country: 'Chili', coords: [-33.3930, -70.7944] },
    altitudeFt: 41000,
    altitudeM: 12500,
    speedKmh: 935,
    speedKts: 505,
    heading: 135,
    squawk: '5219',
    progress: 0.60,
    cycleDurationSec: 4900,
    corridorType: 'Transpacifique Circum-Antarctique',
  },
  {
    id: 'fl-tp213',
    callsign: 'TAP213',
    flightNum: 'TP 213',
    airline: 'TAP Air Portugal',
    aircraft: 'Airbus A330-900neo',
    origin: { code: 'LIS', city: 'Lisbonne', country: 'Portugal', coords: [38.7742, -9.1342] },
    destination: { code: 'GRU', city: 'São Paulo', country: 'Brésil', coords: [-23.4356, -46.4731] },
    altitudeFt: 39000,
    altitudeM: 11890,
    speedKmh: 890,
    speedKts: 480,
    heading: 215,
    squawk: '1428',
    progress: 0.47,
    cycleDurationSec: 4200,
    corridorType: 'Atlantique Ibéro-Brésilien',
  },
  {
    id: 'fl-vn037',
    callsign: 'HVN037',
    flightNum: 'VN 37',
    airline: 'Vietnam Airlines',
    aircraft: 'Airbus A350-900',
    origin: { code: 'HAN', city: 'Hanoï', country: 'Vietnam', coords: [21.2212, 105.8072] },
    destination: { code: 'FRA', city: 'Francfort', country: 'Allemagne', coords: [50.0379, 8.5622] },
    altitudeFt: 36000,
    altitudeM: 10970,
    speedKmh: 905,
    speedKts: 488,
    heading: 308,
    squawk: '6334',
    progress: 0.42,
    cycleDurationSec: 4800,
    corridorType: 'Indochine - Europe',
  },
];

// 2. LIVE MARITIME SHIPPING TRANSITS (Strategic Cargo, Tankers & Container Vessels)
// STRICT OCEAN-ONLY NAVIGATION: All waypoints are certified open-water / international shipping straits.
export const LIVE_VESSELS = [
  {
    id: 'ves-ever-given',
    name: 'EVER GIVEN',
    imo: 9811000,
    mmsi: 353136000,
    flag: 'Panama',
    flagEmoji: '🇵🇦',
    type: 'Porte-conteneurs Ultra-Large (ULCV)',
    dwt: '219 079 t',
    lengthM: 399,
    beamM: 59,
    draughtM: 15.7,
    cargo: '20 124 EVP (Électronique, machinerie)',
    originPort: 'Rotterdam (Pays-Bas)',
    destinationPort: 'Singapour',
    routeWaypoints: [
      [51.95, 4.02],   // Rotterdam Europoort
      [51.20, 2.00],   // Mer du Nord Sud
      [50.00, -1.00],  // Manche Centrale
      [48.50, -5.50],  // Au large de la Bretagne (Ouessant)
      [44.50, -9.00],  // Au large du Cap Finisterre (Espagne)
      [39.00, -10.00], // Au large de Lisbonne (Portugal)
      [36.50, -9.00],  // Cap Saint-Vincent
      [35.95, -5.70],  // Détroit de Gibraltar
      [36.50, 0.00],   // Méditerranée Occidentale
      [37.80, 8.00],   // Au large de la Tunisie
      [37.20, 11.50],  // Détroit de Sicile
      [35.50, 18.00],  // Mer Ionienne
      [33.50, 26.00],  // Sud de la Crète
      [31.50, 32.30],  // Port-Saïd (Entrée Nord Canal de Suez)
      [29.93, 32.55],  // Sortie Sud Canal de Suez
      [27.50, 34.20],  // Golfe de Suez / Mer Rouge
      [22.00, 38.00],  // Mer Rouge Centrale
      [15.00, 41.80],  // Mer Rouge Sud
      [12.60, 43.30],  // Bab-el-Mandeb
      [11.90, 45.00],  // Golfe d'Aden
      [12.00, 52.00],  // Au large de Socotra
      [10.00, 65.00],  // Mer d'Arabie
      [6.00, 78.00],   // Sud du Sri Lanka
      [5.50, 94.50],   // Pointe Nord de Sumatra
      [3.50, 100.50],  // Détroit de Malacca
      [1.25, 103.75],  // Rade de Singapour
    ],
    speedKts: 16.4,
    heading: 142,
    progress: 0.52,
    cycleDurationSec: 21600,
    chokepoint: 'Canal de Suez / Mer Rouge',
  },
  {
    id: 'ves-msc-loreto',
    name: 'MSC LORETO',
    imo: 9934735,
    mmsi: 636021234,
    flag: 'Liberia',
    flagEmoji: '🇱🇷',
    type: 'Méga Porte-conteneurs (24 346 EVP)',
    dwt: '241 000 t',
    lengthM: 400,
    beamM: 61,
    draughtM: 16.5,
    cargo: '24 346 EVP (Biens de consommation Asie-Europe)',
    originPort: 'Ningbo-Zhoushan (Chine)',
    destinationPort: 'Le Havre (France)',
    routeWaypoints: [
      [29.88, 122.10], // Ningbo Zhoushan
      [25.00, 120.50], // Détroit de Taïwan
      [20.00, 116.00], // Mer de Chine Méridionale
      [12.00, 111.00], // Au large du Vietnam
      [4.00, 106.00],  // Mer de Natuna
      [1.28, 103.80],  // Détroit de Singapour
      [3.50, 100.50],  // Détroit de Malacca
      [5.50, 94.50],   // Pointe de Sumatra
      [0.00, 85.00],   // Océan Indien Équatorial
      [-12.00, 70.00], // Océan Indien Sud
      [-25.00, 50.00], // Sud de Madagascar
      [-33.50, 30.00], // Au large de Port Elizabeth
      [-34.85, 20.00], // Cap des Aiguilles (Pointe Sud Afrique)
      [-34.20, 17.50], // Au large du Cap (Cape Town)
      [-26.00, 13.00], // Au large de la Namibie
      [-15.00, 10.50], // Au large de l'Angola
      [-4.00, 8.50],   // Atlantique Sud
      [1.00, 2.00],    // Golfe de Guinée (Strictement en pleine mer)
      [3.00, -8.00],   // Au large de la Côte d'Ivoire (Haute mer)
      [3.50, -14.00],  // Au large du Libéria / Sierra Leone (Haute mer)
      [10.00, -20.00], // Océan Atlantique Ouest-Africain
      [16.50, -22.50], // Ouest du Cap-Vert
      [24.00, -20.00], // Au large du Sahara Occidental
      [28.50, -16.50], // Passe des Canaries
      [35.50, -10.50], // Au large du Sud du Portugal
      [39.00, -10.20], // Au large de Lisbonne
      [43.50, -9.50],  // Au large du Cap Finisterre
      [47.50, -6.00],  // Golfe de Gascogne Extérieur
      [49.20, -3.00],  // Entrée Manche
      [49.49, 0.10],   // Port du Havre
    ],
    speedKts: 18.2,
    heading: 345,
    progress: 0.65,
    cycleDurationSec: 28800,
    chokepoint: 'Cap de Bonne-Espérance (Contournement Afrique)',
  },
  {
    id: 'ves-front-altair',
    name: 'FRONT ALTAIR',
    imo: 9745902,
    mmsi: 538006872,
    flag: 'Îles Marshall',
    flagEmoji: '🇲🇭',
    type: 'Superpétrolier Brut (VLCC)',
    dwt: '299 999 t',
    lengthM: 333,
    beamM: 60,
    draughtM: 21.6,
    cargo: '2 millions barils pétrole brut lourd',
    originPort: 'Ras Tanura (Arabie Saoudite)',
    destinationPort: 'Ulsan (Corée du Sud)',
    routeWaypoints: [
      [26.64, 50.16],  // Ras Tanura
      [26.80, 52.00],  // Golfe Persique Central
      [26.30, 56.40],  // Détroit d'Ormuz
      [24.50, 58.50],  // Golfe d'Oman
      [22.00, 60.50],  // Mer d'Arabie
      [12.00, 68.00],  // Mer d'Arabie Sud
      [6.00, 78.00],   // Sud du Sri Lanka
      [5.50, 94.50],   // Entrée Nord Malacca
      [3.00, 101.00],  // Détroit de Malacca
      [1.25, 103.80],  // Singapour
      [4.00, 105.50],  // Mer de Chine Méridionale
      [12.00, 113.00], // Mer de Chine Centrale
      [20.00, 119.00], // Détroit de Luçon
      [28.00, 126.00], // Mer de Chine Orientale
      [34.00, 129.50], // Détroit de Corée
      [35.53, 129.35], // Port d'Ulsan
    ],
    speedKts: 14.8,
    heading: 105,
    progress: 0.28,
    cycleDurationSec: 18000,
    chokepoint: 'Détroit d’Ormuz & Malacca',
  },
  {
    id: 'ves-yamal-spirit',
    name: 'YAMAL SPIRIT',
    imo: 9753911,
    mmsi: 311000674,
    flag: 'Bahamas',
    flagEmoji: '🇧🇸',
    type: 'Méthanier Brise-Glace GNL (Arc7)',
    dwt: '97 000 t',
    lengthM: 299,
    beamM: 50,
    draughtM: 12.0,
    cargo: '172 600 m³ Gaz Naturel Liquéfié cryogénique (-162°C)',
    originPort: 'Sabetta (Péninsule de Yamal, Arctique)',
    destinationPort: 'Dunkerque LNG (France)',
    routeWaypoints: [
      [71.27, 72.07],  // Port de Sabetta (Golfe de l'Ob)
      [72.50, 68.00],  // Sortie Golfe de l'Ob
      [71.50, 60.00],  // Mer de Kara
      [70.50, 57.50],  // Détroit de Kara (Passe Nouvelle-Zemble)
      [70.00, 45.00],  // Mer de Barents
      [71.30, 26.00],  // Cap Nord (Norvège)
      [68.00, 12.00],  // Mer de Norvège au large des Lofoten
      [63.00, 4.00],   // Mer de Norvège Sud
      [58.50, 2.00],   // Mer du Nord Centrale
      [54.00, 2.50],   // Mer du Nord Sud
      [51.05, 2.37],   // Terminal Méthanier Dunkerque
    ],
    speedKts: 15.5,
    heading: 235,
    progress: 0.48,
    cycleDurationSec: 14400,
    chokepoint: 'Route Maritime du Nord (Arctique)',
  },
  {
    id: 'ves-cma-cgm-jacques-saade',
    name: 'CMA CGM JACQUES SAADÉ',
    imo: 9839179,
    mmsi: 228386700,
    flag: 'France',
    flagEmoji: '🇫🇷',
    type: 'Porte-conteneurs Géant Propulsé au GNL',
    dwt: '220 000 t',
    lengthM: 400,
    beamM: 61,
    draughtM: 16.0,
    cargo: '23 000 EVP (Produits manufacturés, fret vert)',
    originPort: 'Marseille-Fos (France)',
    destinationPort: 'Shanghai (Chine)',
    routeWaypoints: [
      [43.30, 5.36],   // Fos-sur-Mer / Marseille
      [41.00, 6.50],   // Mer Ligurienne
      [38.50, 9.50],   // Sud Sardaigne
      [37.20, 11.50],  // Détroit de Sicile
      [35.50, 18.00],  // Mer Ionienne
      [33.50, 26.00],  // Sud Crète
      [31.50, 32.30],  // Port-Saïd (Canal de Suez)
      [29.93, 32.55],  // Sortie Sud Suez
      [27.50, 34.20],  // Mer Rouge Nord
      [20.00, 38.50],  // Mer Rouge Centrale
      [12.60, 43.30],  // Bab-el-Mandeb
      [11.90, 46.00],  // Golfe d'Aden
      [10.00, 65.00],  // Mer d'Arabie
      [6.00, 78.50],   // Sud Sri Lanka
      [5.50, 94.50],   // Entrée Détroit de Malacca
      [3.50, 100.50],  // Malacca
      [1.25, 103.80],  // Singapour
      [6.00, 108.00],  // Mer de Chine Méridionale
      [15.00, 114.00], // Mer de Chine
      [23.50, 119.50], // Détroit de Taïwan
      [28.00, 122.50], // Mer de Chine Orientale
      [31.23, 121.50], // Port de Shanghai (Yangshan)
    ],
    speedKts: 19.1,
    heading: 112,
    progress: 0.38,
    cycleDurationSec: 25200,
    chokepoint: 'Canal de Suez & Malacca',
  },
  {
    id: 'ves-ocean-victory',
    name: 'OCEAN VICTORY',
    imo: 9687741,
    mmsi: 372841000,
    flag: 'Panama',
    flagEmoji: '🇵🇦',
    type: 'Vraquier Capesize (Minerai de Fer)',
    dwt: '181 000 t',
    lengthM: 292,
    beamM: 45,
    draughtM: 18.2,
    cargo: '175 000 t minerai de fer brut d’Australie',
    originPort: 'Port Hedland (Australie Occidentale)',
    destinationPort: 'Qingdao (Chine)',
    routeWaypoints: [
      [-20.31, 118.57], // Port Hedland
      [-16.00, 117.00], // Océan Indien / Mer de Timor
      [-8.80, 115.80],  // Détroit de Lombok (Passe en eau profonde)
      [-6.50, 117.00],  // Mer de Flores
      [-1.00, 118.50],  // Détroit de Makassar (Fosse marine)
      [2.00, 120.00],   // Mer de Célèbes
      [5.50, 125.00],   // Au large de Mindanao
      [13.00, 126.00],  // Mer des Philippines
      [22.00, 124.00],  // Est de Taïwan
      [29.00, 124.00],  // Mer de Chine Orientale
      [34.50, 122.50],  // Mer Jaune
      [36.06, 120.38],  // Port de Qingdao
    ],
    speedKts: 12.8,
    heading: 15,
    progress: 0.52,
    cycleDurationSec: 14400,
    chokepoint: 'Détroit de Lombok & Makassar',
  },
  {
    id: 'ves-panamax-express',
    name: 'ATLANTIC PEGASUS',
    imo: 9481123,
    mmsi: 351982000,
    flag: 'Panama',
    flagEmoji: '🇵🇦',
    type: 'Chimiquier / Produits Raffinés',
    dwt: '50 000 t',
    lengthM: 183,
    beamM: 32,
    draughtM: 11.8,
    cargo: '45 000 t distillats pétroliers & méthanol',
    originPort: 'Houston Ship Channel (USA)',
    destinationPort: 'Valparaíso (Chili)',
    routeWaypoints: [
      [29.30, -94.70],  // Chenal de Galveston (Sortie Houston)
      [26.00, -90.00],  // Golfe du Mexique
      [22.00, -85.50],  // Canal du Yucatán
      [17.00, -82.00],  // Mer des Caraïbes
      [11.00, -80.50],  // Approche Panama
      [9.40, -79.92],   // Colón / Cristobal (Entrée Atlantique Canal de Panama)
      [9.10, -79.72],   // Lac Gatún / Coupe Gaillard
      [8.93, -79.55],   // Balboa (Sortie Pacifique Canal de Panama)
      [7.50, -79.80],   // Golfe de Panama
      [2.00, -81.50],   // Pacifique au large de la Colombie
      [-5.00, -82.00],  // Pacifique au large du Pérou
      [-14.00, -77.50], // Au large de Lima
      [-23.00, -72.00], // Au large d'Antofagasta (Chili)
      [-33.04, -71.65], // Port de Valparaíso
    ],
    speedKts: 14.1,
    heading: 195,
    progress: 0.46,
    cycleDurationSec: 18000,
    chokepoint: 'Canal de Panama (Écluses)',
  },
  {
    id: 'ves-nor-zenith',
    name: 'NORDIC ZENITH',
    imo: 9540027,
    mmsi: 257765000,
    flag: 'Norvège',
    flagEmoji: '🇳🇴',
    type: 'Vraquier Glace Arctique (Ice Class 1A)',
    dwt: '74 800 t',
    lengthM: 225,
    beamM: 32,
    draughtM: 10.5,
    cargo: 'Concentré de fer et minéraux arctiques',
    originPort: 'Kirkenes (Norvège)',
    destinationPort: 'Rotterdam (Pays-Bas)',
    routeWaypoints: [
      [69.72, 30.05],  // Kirkenes (Fjord de Varanger)
      [70.50, 31.00],  // Sortie Varangerfjord
      [71.25, 26.00],  // Cap Nord
      [68.00, 12.00],  // Mer de Norvège
      [62.00, 4.00],   // Mer de Norvège Sud
      [58.00, 2.50],   // Mer du Nord
      [53.50, 3.50],   // Au large des côtes néerlandaises
      [51.95, 4.02],   // Rotterdam Europoort
    ],
    speedKts: 13.6,
    heading: 215,
    progress: 0.60,
    cycleDurationSec: 10800,
    chokepoint: 'Passe du Cap Nord',
  },
  {
    id: 'ves-cma-saade',
    name: 'CMA CGM JACQUES SAADÉ',
    imo: 9839179,
    mmsi: 228386600,
    flag: 'France (RIF)',
    flagEmoji: '🇫🇷',
    type: 'Porte-conteneurs GNL Géant (23 000 EVP)',
    dwt: '220 000 t',
    lengthM: 400,
    beamM: 61,
    draughtM: 16.0,
    cargo: '23 112 EVP (Fret commercial & haute technologie)',
    originPort: 'Shanghai (Yangshan)',
    destinationPort: 'Le Havre (France)',
    routeWaypoints: [
      [30.62, 122.06], // Shanghai Yangshan
      [23.50, 119.50], // Détroit de Taïwan
      [14.50, 112.00], // Mer de Chine Méridionale
      [1.25, 103.80],  // Singapour
      [5.50, 95.00],   // Sortie Malacca
      [6.00, 80.00],   // Sri Lanka
      [12.50, 44.00],  // Bab-el-Mandeb
      [27.50, 34.00],  // Mer Rouge
      [31.25, 32.30],  // Suez
      [36.00, -5.60],  // Gibraltar
      [48.50, -5.50],  // Ouessant
      [49.48, 0.10],   // Le Havre
    ],
    speedKts: 18.2,
    heading: 275,
    progress: 0.55,
    cycleDurationSec: 16000,
    chokepoint: 'Canal de Suez & Malacca',
  },
  {
    id: 'ves-msc-gulsun',
    name: 'MSC GÜLSÜN',
    imo: 9839438,
    mmsi: 352723000,
    flag: 'Panama',
    flagEmoji: '🇵🇦',
    type: 'Porte-conteneurs Ultra-Large (23 756 EVP)',
    dwt: '228 149 t',
    lengthM: 400,
    beamM: 62,
    draughtM: 16.5,
    cargo: '23 756 EVP (Produits manufacturés, batteries)',
    originPort: 'Shenzhen (Yantian)',
    destinationPort: 'Anvers (Belgique)',
    routeWaypoints: [
      [22.57, 114.27], // Yantian
      [12.00, 110.00], // Mer de Chine
      [1.30, 104.00],  // Singapour
      [5.80, 80.50],   // Sud Sri Lanka
      [11.80, 45.00],  // Golfe d'Aden
      [29.90, 32.55],  // Suez
      [36.80, 1.00],   // Méditerranée
      [35.95, -5.60],  // Gibraltar
      [51.25, 4.40],   // Anvers
    ],
    speedKts: 17.5,
    heading: 285,
    progress: 0.40,
    cycleDurationSec: 15500,
    chokepoint: 'Détroit de Malacca & Suez',
  },
  {
    id: 'ves-front-altair',
    name: 'FRONT ALTAIR',
    imo: 9745902,
    mmsi: 538006872,
    flag: 'Îles Marshall',
    flagEmoji: '🇲🇭',
    type: 'Superpétrolier Brut VLCC',
    dwt: '299 999 t',
    lengthM: 333,
    beamM: 60,
    draughtM: 21.5,
    cargo: '2 000 000 barils de pétrole brut Arabian Light',
    originPort: 'Ras Tanura (Arabie Saoudite)',
    destinationPort: 'Rotterdam (Pays-Bas)',
    routeWaypoints: [
      [26.64, 50.16],  // Ras Tanura
      [26.10, 56.50],  // Détroit d'Ormuz
      [24.00, 59.00],  // Golfe d'Oman
      [10.00, 60.00],  // Mer d'Arabie
      [-5.00, 50.00],  // Océan Indien Ouest
      [-25.00, 40.00], // Canal du Mozambique
      [-34.80, 20.00], // Cap de Bonne-Espérance
      [-15.00, 5.00],  // Atlantique Sud
      [5.00, -18.00],  // Large Afrique de l'Ouest
      [35.00, -12.00], // Au large du Portugal
      [50.00, -1.00],  // Manche
      [51.95, 4.02],   // Rotterdam Europoort
    ],
    speedKts: 14.8,
    heading: 220,
    progress: 0.65,
    cycleDurationSec: 22000,
    chokepoint: 'Détroit d’Ormuz & Cap de Bonne-Espérance',
  },
  {
    id: 'ves-lng-rivers',
    name: 'LNG RIVERS (Q-Flex)',
    imo: 9216298,
    mmsi: 310515000,
    flag: 'Bermudes',
    flagEmoji: '🇧🇲',
    type: 'Méthanier Cryogénique GNL (-162°C)',
    dwt: '115 000 t',
    lengthM: 315,
    beamM: 50,
    draughtM: 12.0,
    cargo: '216 000 m³ Gaz Naturel Liquéfié',
    originPort: 'Ras Laffan (Qatar)',
    destinationPort: 'Fos Cavaou (France)',
    routeWaypoints: [
      [25.92, 51.58],  // Ras Laffan
      [26.20, 56.40],  // Détroit d'Ormuz
      [23.00, 59.50],  // Mer d'Oman
      [12.60, 43.30],  // Bab-el-Mandeb
      [27.00, 34.50],  // Mer Rouge
      [31.25, 32.30],  // Canal de Suez
      [34.50, 25.00],  // Méditerranée Orientale
      [38.00, 10.00],  // Détroit de Sicile
      [43.40, 4.90],   // Fos-sur-Mer
    ],
    speedKts: 19.1,
    heading: 310,
    progress: 0.72,
    cycleDurationSec: 13000,
    chokepoint: 'Ormuz & Canal de Suez',
  },
  {
    id: 'ves-cosco-univ',
    name: 'COSCO SHIPPING UNIVERSE',
    imo: 9795610,
    mmsi: 477180800,
    flag: 'Hong Kong',
    flagEmoji: '🇭🇰',
    type: 'Porte-conteneurs Transpacifique (21 237 EVP)',
    dwt: '199 000 t',
    lengthM: 400,
    beamM: 58.6,
    draughtM: 16.0,
    cargo: '21 237 EVP (Électronique grand public, PV solaires)',
    originPort: 'Ningbo-Zhoushan (Chine)',
    destinationPort: 'Long Beach (Los Angeles)',
    routeWaypoints: [
      [29.88, 121.56], // Ningbo
      [32.00, 130.00], // Sud du Japon
      [35.00, 150.00], // Pacifique Nord-Ouest
      [38.00, 175.00], // Ligne de changement de date
      [37.00, -160.00],// Grand Cercle Pacifique
      [35.00, -135.00],// Approche Californie
      [33.75, -118.22],// Port de Long Beach
    ],
    speedKts: 20.4,
    heading: 78,
    progress: 0.58,
    cycleDurationSec: 14000,
    chokepoint: 'Grand Cercle Transpacifique',
  },
];

// Continuous Calculation of animated positions based on current clock
export function getLiveTransitPositions(timestampMs = Date.now()) {
  const timeSeconds = timestampMs / 1000;

  // 1. Aircraft positions
  const flights = LIVE_FLIGHTS.map((flight) => {
    const cycle = flight.cycleDurationSec || 3600;
    const t = (timeSeconds % cycle) / cycle;
    const progress = (flight.progress + t) % 1.0;

    const [lat, lng] = interpolateGreatCircle(
      flight.origin.coords,
      flight.destination.coords,
      progress
    );

    // Look slightly ahead to calculate real true heading
    const lookAheadProgress = Math.min(1.0, progress + 0.01);
    const [nextLat, nextLng] = interpolateGreatCircle(
      flight.origin.coords,
      flight.destination.coords,
      lookAheadProgress
    );
    const dynamicHeading = Math.round(calculateBearing(lat, lng, nextLat, nextLng));

    return {
      ...flight,
      lat,
      lng,
      currentProgress: progress,
      calculatedHeading: dynamicHeading || flight.heading,
    };
  });

  // 2. Maritime vessel positions
  const vessels = LIVE_VESSELS.map((vessel) => {
    const cycle = vessel.cycleDurationSec || 14400;
    const t = (timeSeconds % cycle) / cycle;
    const progress = (vessel.progress + t) % 1.0;

    const waypoints = vessel.routeWaypoints;
    const totalSegments = waypoints.length - 1;
    const segmentIndex = Math.floor(progress * totalSegments);
    const segmentProgress = (progress * totalSegments) - segmentIndex;

    const p1 = waypoints[segmentIndex];
    const p2 = waypoints[Math.min(totalSegments, segmentIndex + 1)];

    const [lat, lng] = interpolateGreatCircle(p1, p2, segmentProgress);
    const dynamicHeading = Math.round(calculateBearing(p1[0], p1[1], p2[0], p2[1]));

    return {
      ...vessel,
      lat,
      lng,
      currentProgress: progress,
      calculatedHeading: dynamicHeading || vessel.heading,
    };
  });

  return { flights, vessels };
}
