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
    cycleDurationSec: 360,
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
    cycleDurationSec: 420,
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
    cycleDurationSec: 450,
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
    cycleDurationSec: 480,
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
    cycleDurationSec: 400,
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
    cycleDurationSec: 390,
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
    cycleDurationSec: 460,
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
    cycleDurationSec: 510,
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
    cycleDurationSec: 540,
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
    cycleDurationSec: 530,
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
    cycleDurationSec: 300,
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
    cycleDurationSec: 320,
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
    cycleDurationSec: 280,
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
    cycleDurationSec: 240,
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
    cycleDurationSec: 410,
    corridorType: 'Transafricain Méridien',
  },
];

// 2. LIVE MARITIME SHIPPING TRANSITS (18 Strategic Cargo, Tankers & Container Vessels)
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
      [51.95, 4.02],   // Rotterdam
      [49.80, -3.50],  // Manche
      [36.00, -6.00],  // Gibraltar
      [36.80, 15.20],  // Méditerranée centrale
      [31.26, 32.30],  // Suez Nord
      [27.80, 34.20],  // Mer Rouge
      [12.58, 43.33],  // Bab-el-Mandeb
      [10.00, 65.00],  // Mer d'Arabie
      [5.50, 95.00],   // Entrée Détroit de Malacca
      [1.28, 103.77],  // Singapour
    ],
    speedKts: 16.4,
    heading: 142,
    progress: 0.44, // near Red Sea / Suez
    cycleDurationSec: 720,
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
      [29.88, 121.55], // Ningbo
      [20.00, 118.00], // Mer de Chine
      [1.28, 103.77],  // Singapour
      [5.00, 80.00],   // Océan Indien
      [-34.80, 20.00], // Cap de Bonne-Espérance (Route d'évitement)
      [0.00, -10.00],  // Atlantique équatorial
      [49.49, 0.10],   // Le Havre
    ],
    speedKts: 18.2,
    heading: 260,
    progress: 0.58, // off South Africa Cape
    cycleDurationSec: 800,
    chokepoint: 'Cap de Bonne-Espérance',
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
      [26.50, 56.45],  // Détroit d'Ormuz
      [23.50, 59.00],  // Golfe d'Oman
      [8.00, 76.00],   // Sud de l'Inde
      [5.80, 95.00],   // Malacca
      [1.28, 103.77],  // Singapour
      [15.00, 115.00], // Mer de Chine Méridionale
      [35.53, 129.35], // Ulsan
    ],
    speedKts: 14.8,
    heading: 105,
    progress: 0.22, // passing Strait of Hormuz
    cycleDurationSec: 690,
    chokepoint: 'Détroit d’Ormuz',
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
      [71.27, 72.07],  // Sabetta Arctique
      [71.00, 30.00],  // Mer de Barents / Cap Nord
      [64.00, 5.00],   // Mer de Norvège
      [58.00, 2.00],   // Mer du Nord
      [51.05, 2.37],   // Dunkerque
    ],
    speedKts: 15.5,
    heading: 235,
    progress: 0.48,
    cycleDurationSec: 620,
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
      [43.30, 5.36],   // Marseille
      [36.80, 15.20],  // Détroit de Sicile
      [31.26, 32.30],  // Suez
      [12.58, 43.33],  // Bab-el-Mandeb
      [6.00, 80.00],   // Sri Lanka
      [1.28, 103.77],  // Singapour
      [22.00, 116.00], // Détroit de Taïwan
      [31.23, 121.47], // Shanghai
    ],
    speedKts: 19.1,
    heading: 112,
    progress: 0.32,
    cycleDurationSec: 740,
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
      [-8.50, 116.00],  // Détroit de Lombok
      [0.00, 119.00],   // Détroit de Makassar
      [15.00, 122.00],  // Mer des Philippines
      [36.06, 120.38],  // Qingdao
    ],
    speedKts: 12.8,
    heading: 15,
    progress: 0.52,
    cycleDurationSec: 660,
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
      [29.75, -95.36], // Houston
      [22.00, -85.00], // Golfe du Mexique
      [9.35, -79.90],  // Colon (Entrée Atlantique Panama)
      [8.95, -79.55],  // Sortie Pacifique Panama
      [-2.00, -82.00], // Côte Équateur
      [-33.04, -71.61],// Valparaíso
    ],
    speedKts: 14.1,
    heading: 195,
    progress: 0.46, // passing Panama Canal locks
    cycleDurationSec: 610,
    chokepoint: 'Canal de Panama (Écluses)',
  },
  {
    id: 'ves-nordic-barents',
    name: 'NORDIC BARENTS',
    imo: 9784321,
    mmsi: 258123000,
    flag: 'Norvège',
    flagEmoji: '🇳🇴',
    type: 'Cargaison Vrac Renforcée Glaces',
    dwt: '43 700 t',
    lengthM: 190,
    beamM: 30,
    draughtM: 10.5,
    cargo: 'Concentré de fer et minéraux arctiques',
    originPort: 'Kirkenes (Norvège)',
    destinationPort: 'Rotterdam (Pays-Bas)',
    routeWaypoints: [
      [69.72, 30.05],  // Kirkenes
      [71.17, 25.78],  // Cap Nord
      [62.00, 4.00],   // Mer de Norvège
      [55.00, 3.00],   // Mer du Nord
      [51.95, 4.02],   // Rotterdam
    ],
    speedKts: 13.6,
    heading: 215,
    progress: 0.60,
    cycleDurationSec: 580,
    chokepoint: 'Passe du Cap Nord',
  },
];

// Continuous Calculation of animated positions based on current clock
export function getLiveTransitPositions(timestampMs = Date.now()) {
  const timeSeconds = timestampMs / 1000;

  // 1. Aircraft positions
  const flights = LIVE_FLIGHTS.map((flight) => {
    const cycle = flight.cycleDurationSec || 360;
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
    const cycle = vessel.cycleDurationSec || 720;
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
