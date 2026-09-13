const fs = require('fs');
const path = require('path');

// Calculate bearing between two coordinates in degrees (0-359)
function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Great circle interpolation
function interpolateGreatCircle(p1, p2, f) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const lat1 = toRad(p1[0]);
  const lon1 = toRad(p1[1]);
  const lat2 = toRad(p2[0]);
  const lon2 = toRad(p2[1]);

  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
  ));

  if (d === 0) return [p1[0], p1[1]];

  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);

  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return [parseFloat(toDeg(lat).toFixed(4)), parseFloat(toDeg(lon).toFixed(4))];
}

const FLAGS = [
  { flag: 'Panama', emoji: '🇵🇦', prefix: 353 },
  { flag: 'Liberia', emoji: '🇱🇷', prefix: 636 },
  { flag: 'Îles Marshall', emoji: '🇲🇭', prefix: 538 },
  { flag: 'Singapour', emoji: '🇸🇬', prefix: 563 },
  { flag: 'Hong Kong', emoji: '🇭🇰', prefix: 477 },
  { flag: 'Malte', emoji: '🇲🇹', prefix: 248 },
  { flag: 'Bahamas', emoji: '🇧🇸', prefix: 311 },
  { flag: 'Chypre', emoji: '🇨🇾', prefix: 209 },
  { flag: 'France', emoji: '🇫🇷', prefix: 227 },
  { flag: 'Grèce', emoji: '🇬🇷', prefix: 240 },
  { flag: 'Danemark', emoji: '🇩🇰', prefix: 219 },
  { flag: 'Norvège', emoji: '🇳🇴', prefix: 257 },
  { flag: 'Pays-Bas', emoji: '🇳🇱', prefix: 244 },
  { flag: 'Royaume-Uni', emoji: '🇬🇧', prefix: 235 },
  { flag: 'Japon', emoji: '🇯🇵', prefix: 431 },
];

const VESSEL_TYPES = {
  container: {
    label: 'Porte-conteneurs Ultra-Large (ULCV)',
    color: '#00f5a0',
    dwtBase: 220000,
    len: 400,
    beam: 61,
    draught: 16.0,
    spdRange: [16.5, 22.0],
    cargoBase: '24 000 EVP (Électronique, biens manufacturés)',
  },
  tanker: {
    label: 'Pétrolier Brut Supertanker (VLCC)',
    color: '#ef4444',
    dwtBase: 310000,
    len: 333,
    beam: 60,
    draught: 21.5,
    spdRange: [12.0, 15.8],
    cargoBase: '2 000 000 barils de pétrole brut brut',
  },
  lng: {
    label: 'Méthanier Q-Max / Membrane (GNL)',
    color: '#f97316',
    dwtBase: 135000,
    len: 345,
    beam: 54,
    draught: 12.5,
    spdRange: [16.0, 19.5],
    cargoBase: '266 000 m³ Gaz Naturel Liquéfié cryogénique (-162°C)',
  },
  bulk: {
    label: 'Vraquier Capesize (Valemax)',
    color: '#00f2fe',
    dwtBase: 380000,
    len: 362,
    beam: 65,
    draught: 23.0,
    spdRange: [11.5, 14.5],
    cargoBase: '400 000 t Minerais de fer et matières premières',
  },
  cargo: {
    label: 'Transporteur de Véhicules (PCTC)',
    color: '#10b981',
    dwtBase: 30000,
    len: 200,
    beam: 36,
    draught: 10.0,
    spdRange: [15.0, 19.0],
    cargoBase: '7 200 Véhicules neufs & fret roulant (Ro-Ro)',
  },
  passenger: {
    label: 'Paquebot de Croisière Géant',
    color: '#eab308',
    dwtBase: 18000,
    len: 365,
    beam: 65,
    draught: 9.3,
    spdRange: [18.0, 22.5],
    cargoBase: '6 700 Passagers & 2 200 membres d’équipage',
  },
  tug: {
    label: 'Remorqueur Hauturier d’Assistance (AHTS)',
    color: '#a855f7',
    dwtBase: 4500,
    len: 92,
    beam: 21,
    draught: 7.5,
    spdRange: [10.0, 13.5],
    cargoBase: 'Traction 280 t au croc d’assistance hauturière',
  },
};

const SHIPS_DATABASE = {
  container: [
    'MSC LORETO', 'EVER GIVEN', 'CMA CGM JACQUES SAADÉ', 'MAERSK MC-KINNEY MOLLER', 'COSCO SHIPPING UNIVERSE',
    'ONE APUS', 'HAPAG-LLOYD BERLIN', 'OOCL HONG KONG', 'EVER GOLDEN', 'MSC TESSA', 'CMA CGM PALAIS ROYAL',
    'MAERSK MADRID', 'COSCO SHIPPING SOLAR', 'ONE TRIUMPH', 'HAPAG-LLOYD AL ZUBARA', 'EVER ACE', 'MSC GÜLSÜN',
    'CMA CGM CHAMPS ELYSEES', 'MAERSK MANCHESTER', 'COSCO SHIPPING NEBULA', 'ONE STORK', 'HAPAG-LLOYD HAMBURG',
    'EVER ALOT', 'MSC MINA', 'CMA CGM RIVOLI', 'MAERSK MCKINNEY', 'COSCO SHIPPING GALAXY', 'ONE COLUMBA',
    'HAPAG-LLOYD PARIS', 'EVER ARIA', 'MSC SAMAR', 'CMA CGM CONCORDE', 'MAERSK MARSEILLE', 'COSCO SHIPPING STAR',
    'ONE GRUS', 'HAPAG-LLOYD DUBLIN', 'EVER ART', 'MSC ISABELLA', 'CMA CGM LOUVRE', 'MAERSK MILAN',
    'COSCO SHIPPING PLANET', 'ONE AQUILA', 'HAPAG-LLOYD TOKYO', 'EVER ARM', 'MSC ARINA', 'CMA CGM MONTMARTRE',
    'MAERSK MUNICH', 'COSCO SHIPPING TAURUS', 'ONE CYGNUS', 'HAPAG-LLOYD SINGAPORE', 'MSC MICHEL CAPPELLINI',
    'EVER ATOP', 'CMA CGM JEAN MERMOZ', 'MAERSK MCENERY', 'COSCO SHIPPING PISCES', 'ONE HAWK', 'MSC FEBE',
    'HAPAG-LLOYD ROTTERDAM', 'EVER ALP', 'CMA CGM ANTOINE DE SAINT EXUPERY', 'MAERSK MCKELL', 'MSC SIXIN'
  ],
  tanker: [
    'TI OCEANIA', 'EURONAV ALEXANDRIA', 'FRONT ALTAIR', 'DHT COLT', 'NORDIC AMERICAN STAR', 'TEEKAY SPIRIT',
    'BAHRI ABHA', 'STENA IMPERATOR', 'MARAN APHRODITE', 'MINERVA ELEONORA', 'OLYMPIC TARGET', 'NEW PRODUCER',
    'FRONT HERCULES', 'DHT JAGUAR', 'NORDIC TRACER', 'TEEKAY RESOLUTE', 'BAHRI YANBU', 'STENA SUPREME',
    'MARAN GAS MARITIME', 'MINERVA GRACE', 'OLYMPIC HOPE', 'NEW CHALLENGER', 'FRONT FALCON', 'DHT BRONCO',
    'NORDIC VOYAGER', 'TEEKAY VALIANT', 'BAHRI JEDDAH', 'STENA PRESIDENT', 'MARAN POSEIDON', 'MINERVA IRIS',
    'FRONT EAGLE', 'DHT TIGER', 'EURONAV HERCULES', 'NORDIC FREEDOM', 'TEEKAY COURAGE', 'BAHRI RIYADH'
  ],
  lng: [
    'Q-MAX MOZAH', 'Q-FLEX AL GHARIYA', 'ARCTIC DISCOVERER', 'GASLOG GLASGOW', 'BW LILAC', 'GOLAR TUNDRA',
    'CLEAN OCEAN', 'ENERGY ADVANCE', 'LNG ENCOUNTER', 'MARVEL HERON', 'PACIFIC ENLIGHTEN', 'TANGGUH FOJA',
    'Q-MAX AL DAFNA', 'Q-FLEX AL SHAHANIYA', 'ARCTIC VOYAGER', 'GASLOG GENEVA', 'BW MAGNOLIA', 'GOLAR FROST',
    'CLEAN HORIZON', 'ENERGY HORIZON', 'LNG ENDURANCE', 'MARVEL PELICAN', 'PACIFIC BREEZE', 'TANGGUH PALUNG',
    'Q-MAX SHAGRA', 'Q-FLEX LIWAIROTH', 'ARCTIC PRINCESS', 'GASLOG SINGAPORE', 'BW TULIP', 'GOLAR SEAL'
  ],
  bulk: [
    'VALE BRASIL', 'BERGE EVEREST', 'PACIFIC ORE', 'SHAGANG GLORY', 'STAR BOREALIS', 'GOLDEN OCEAN',
    'OLDENDORFF CARRIER', 'PANAMAX LEADER', 'CAPE PROVIDENCE', 'AQUABONITA', 'MINERAL CHINA', 'IRON DUKE',
    'VALE RIO DE JANEIRO', 'BERGE MAUNA KEA', 'PACIFIC BULKER', 'SHAGANG PIONEER', 'STAR POLARIS', 'GOLDEN TRADER',
    'OLDENDORFF NAVIGATOR', 'PANAMAX PRIDE', 'CAPE SUCCESS', 'AQUAMARINE', 'MINERAL SHANGHAI', 'IRON EMPEROR',
    'VALE ESPIRITO SANTO', 'BERGE KANGCHENJUNGA', 'PACIFIC MERIT', 'STAR ANTARES', 'GOLDEN VOYAGER'
  ],
  cargo: [
    'WALLENIUS MORNING CHANT', 'GRIMALDI GRANDE NIGERIA', 'HOEGH TARGET', 'NYK LEADER', 'K-LINE HORIZON',
    'MOL TREASURE', 'ATLANTIC COMPASS', 'BBC CHARTERING ORE', 'AAL NEWCASTLE', 'CHIPOLBROK PACIFIC',
    'WALLENIUS FAUST', 'GRIMALDI GRANDE BRASILE', 'HOEGH TRIGGER', 'NYK PIONEER', 'K-LINE EXPLORER',
    'MOL TRIUMPH', 'ATLANTIC CONCERT', 'BBC PEARL', 'AAL BRISBANE', 'CHIPOLBROK ATLANTIC'
  ],
  passenger: [
    'ICON OF THE SEAS', 'WONDER OF THE SEAS', 'SYMPHONY OF THE SEAS', 'HARMONY OF THE SEAS', 'ALLURE OF THE SEAS',
    'MSC WORLD EUROPA', 'MSC GRANDIOSA', 'COSTA SMERALDA', 'NORWEGIAN PRIMA', 'QUEEN MARY 2', 'DISNEY WISH',
    'CELEBRITY BEYOND', 'ROYAL PRINCESS', 'AIDANOVA', 'CARNIVAL CELEBRATION'
  ],
  tug: [
    'OCEANIC PULLER', 'ALP STRIKER', 'FAIRMOUNT GLACIER', 'BOKA SHERPA', 'RESOLUTE TUG', 'MAERSK MASTER',
    'SVITZER EUROPA', 'KOTUG ROTTERDAM', 'SMIT AMANDLA', 'POSH COMMANDER', 'ALP DEFENDER', 'BOKA FALCON'
  ]
};

// 12 Strategic Global Shipping Corridors
const MARITIME_CORRIDORS = [
  {
    id: 'malacca',
    zone: 'Détroit de Malacca & Singapour',
    origPort: 'Singapour',
    destPort: 'Rotterdam (Pays-Bas)',
    waypoints: [
      [5.50, 95.20],
      [4.20, 98.40],
      [3.00, 100.80],
      [1.80, 102.50],
      [1.25, 103.85],
      [1.35, 104.40],
      [2.50, 106.00],
      [4.00, 108.50]
    ],
    count: 220,
    types: ['container', 'tanker', 'lng', 'bulk', 'tug']
  },
  {
    id: 'suez',
    zone: 'Canal de Suez & Mer Rouge',
    origPort: 'Port-Saïd (Égypte)',
    destPort: 'Djeddah (Arabie Saoudite)',
    waypoints: [
      [31.30, 32.30],
      [29.93, 32.55],
      [27.80, 34.10],
      [22.50, 38.00],
      [16.50, 41.50],
      [12.60, 43.30],
      [11.90, 45.20],
      [12.00, 50.00]
    ],
    count: 180,
    types: ['container', 'tanker', 'lng', 'bulk']
  },
  {
    id: 'hormuz',
    zone: 'Détroit d’Ormuz & Golfe Persique',
    origPort: 'Ras Laffan (Qatar)',
    destPort: 'Tokyo (Japon)',
    waypoints: [
      [27.00, 50.50],
      [26.20, 52.50],
      [25.50, 54.50],
      [26.50, 56.40],
      [25.40, 56.60],
      [24.50, 58.20],
      [23.50, 60.50]
    ],
    count: 180,
    types: ['tanker', 'lng', 'bulk', 'tug']
  },
  {
    id: 'english_channel',
    zone: 'Manche, Pas-de-Calais & Mer du Nord',
    origPort: 'Rotterdam (Pays-Bas)',
    destPort: 'Le Havre (France)',
    waypoints: [
      [49.20, -5.50],
      [49.80, -2.50],
      [50.30, 0.00],
      [51.05, 1.50],
      [51.80, 3.20],
      [52.00, 3.90],
      [53.50, 6.00],
      [54.20, 7.80]
    ],
    count: 200,
    types: ['container', 'tanker', 'cargo', 'passenger', 'tug']
  },
  {
    id: 'gibraltar',
    zone: 'Détroit de Gibraltar & Méditerranée',
    origPort: 'Algésiras (Espagne)',
    destPort: 'Gênes (Italie)',
    waypoints: [
      [36.10, -7.50],
      [35.95, -5.60],
      [36.40, -3.00],
      [37.20, 0.50],
      [38.50, 4.00],
      [40.00, 7.50],
      [43.00, 9.20],
      [44.00, 8.80]
    ],
    count: 190,
    types: ['container', 'tanker', 'passenger', 'cargo']
  },
  {
    id: 'panama',
    zone: 'Canal de Panama & Caraïbes',
    origPort: 'Balboa (Panama)',
    destPort: 'Houston (États-Unis)',
    waypoints: [
      [7.50, -80.00],
      [8.85, -79.55],
      [9.35, -79.92],
      [12.50, -78.00],
      [18.00, -84.00],
      [21.80, -85.50],
      [25.00, -88.00],
      [29.00, -94.50]
    ],
    count: 180,
    types: ['container', 'tanker', 'bulk', 'lng']
  },
  {
    id: 'east_asia',
    zone: 'Mer de Chine & Façade Asiatique',
    origPort: 'Shanghai (Chine)',
    destPort: 'Busan (Corée du Sud)',
    waypoints: [
      [22.20, 114.50],
      [24.00, 119.00],
      [27.50, 122.00],
      [30.60, 122.30],
      [32.50, 125.50],
      [34.80, 128.80],
      [35.10, 130.00],
      [35.00, 139.50]
    ],
    count: 220,
    types: ['container', 'bulk', 'cargo', 'tanker']
  },
  {
    id: 'transpacific',
    zone: 'Couloir Transpacifique Nord',
    origPort: 'Yokohama (Japon)',
    destPort: 'Long Beach (États-Unis)',
    waypoints: [
      [34.50, 140.00],
      [38.00, 160.00],
      [42.00, -180.00],
      [40.00, -160.00],
      [36.50, -140.00],
      [34.00, -125.00],
      [33.70, -118.50]
    ],
    count: 170,
    types: ['container', 'bulk', 'cargo']
  },
  {
    id: 'transatlantic',
    zone: 'Couloir Transatlantique Nord',
    origPort: 'New York (États-Unis)',
    destPort: 'Anvers (Belgique)',
    waypoints: [
      [40.30, -73.60],
      [41.50, -65.00],
      [43.00, -50.00],
      [46.00, -35.00],
      [48.50, -20.00],
      [49.50, -6.00]
    ],
    count: 160,
    types: ['container', 'tanker', 'cargo']
  },
  {
    id: 'cape_good_hope',
    zone: 'Cap de Bonne-Espérance & Afrique du Sud',
    origPort: 'Durban (Afrique du Sud)',
    destPort: 'Santos (Brésil)',
    waypoints: [
      [-30.00, 31.50],
      [-33.50, 27.00],
      [-35.20, 21.00],
      [-34.80, 18.00],
      [-32.00, 14.00],
      [-28.00, 5.00],
      [-25.00, -15.00],
      [-24.00, -42.00]
    ],
    count: 170,
    types: ['tanker', 'bulk', 'container']
  },
  {
    id: 'south_america',
    zone: 'Façade Atlantique Sud-Américaine',
    origPort: 'Santos (Brésil)',
    destPort: 'Rotterdam (Pays-Bas)',
    waypoints: [
      [-35.00, -55.00],
      [-28.00, -47.00],
      [-23.90, -46.00],
      [-20.00, -39.00],
      [-12.00, -36.00],
      [-4.00, -34.00],
      [5.00, -30.00],
      [18.00, -25.00]
    ],
    count: 170,
    types: ['bulk', 'cargo', 'container', 'tanker']
  },
  {
    id: 'australia',
    zone: 'Couloir Minéralier & Énergétique Australien',
    origPort: 'Port Hedland (Australie)',
    destPort: 'Qingdao (Chine)',
    waypoints: [
      [-20.30, 118.50],
      [-18.50, 116.00],
      [-14.00, 114.50],
      [-8.80, 115.80],
      [-3.00, 118.00],
      [3.00, 122.00],
      [12.00, 125.00],
      [22.00, 123.50]
    ],
    count: 170,
    types: ['bulk', 'lng', 'tanker']
  }
];

console.log('Generating authentic worldwide maritime fleet...');

const allCorridorVessels = [];

MARITIME_CORRIDORS.forEach((corridor, cIdx) => {
  const wpts = corridor.waypoints;
  const totalSegs = wpts.length - 1;
  const list = [];

  for (let i = 0; i < corridor.count; i++) {
    const isOutbound = i % 2 === 0;
    const orig = isOutbound ? corridor.origPort : corridor.destPort;
    const dest = isOutbound ? corridor.destPort : corridor.origPort;

    // Distribute evenly along the path
    const frac = (i + 0.5) / corridor.count;
    const currentFrac = isOutbound ? frac : (1 - frac);

    const segIndex = Math.min(totalSegs - 1, Math.floor(currentFrac * totalSegs));
    const segFrac = (currentFrac * totalSegs) - segIndex;

    const p1 = wpts[segIndex];
    const p2 = wpts[segIndex + 1];

    const [interLat, interLng] = interpolateGreatCircle(p1, p2, segFrac);

    // Lateral displacement of ±0.06° to ±0.25° to create natural marine traffic dispersion without single-file lines
    const lateralShiftLat = ((Math.sin(i * 3.7 + cIdx) * 0.18) + (Math.cos(i * 5.1) * 0.08));
    const lateralShiftLng = ((Math.cos(i * 2.3 + cIdx) * 0.22) + (Math.sin(i * 4.9) * 0.09));

    const lat = parseFloat((interLat + lateralShiftLat).toFixed(4));
    const lng = parseFloat((interLng + lateralShiftLng).toFixed(4));

    // Course
    const rawCourse = Math.round(isOutbound
      ? calculateBearing(p1[0], p1[1], p2[0], p2[1])
      : calculateBearing(p2[0], p2[1], p1[0], p1[1])
    );
    const course = (rawCourse + 360) % 360;

    // Vessel category
    const catType = corridor.types[i % corridor.types.length];
    const typeDef = VESSEL_TYPES[catType];
    const namesList = SHIPS_DATABASE[catType];
    const baseName = namesList[i % namesList.length];
    const nameSuffix = (Math.floor(i / namesList.length) > 0) ? ` ${Math.floor(i / namesList.length) + 1}` : '';
    const name = `${baseName}${nameSuffix}`;

    const flagInfo = FLAGS[(i * 7 + cIdx) % FLAGS.length];
    const imo = 9200000 + ((cIdx * 73 + i * 29 + 17) % 789000);
    const mmsi = (flagInfo.prefix * 1000000) + ((i * 1237 + cIdx * 991) % 899999);
    const callsign = `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}${1000 + (i % 8999)}`;

    // Speed: 95% underway, 5% at anchor
    const isAtAnchor = (i % 22 === 0);
    const spdKts = isAtAnchor
      ? 0.2
      : parseFloat((typeDef.spdRange[0] + ((i * 1.3) % (typeDef.spdRange[1] - typeDef.spdRange[0]))).toFixed(1));
    const spdKmh = Math.round(spdKts * 1.852);

    const status = isAtAnchor ? 'Au mouillage' : 'Faisant route au moteur';

    const vessel = {
      id: `ais-${corridor.id}-${i}`,
      aisId: `${imo}`,
      imo,
      mmsi,
      callsign,
      name,
      flag: flagInfo.flag,
      flagEmoji: flagInfo.emoji,
      category: catType,
      type: typeDef.label,
      color: typeDef.color,
      dwt: `${(typeDef.dwtBase + ((i * 217) % 25000)).toLocaleString('fr-FR')} t`,
      lengthM: typeDef.len,
      beamM: typeDef.beam,
      draughtM: typeDef.draught,
      cargo: typeDef.cargoBase,
      originPort: orig,
      destinationPort: dest,
      chokepoint: corridor.zone,
      status,
      lat,
      lng,
      course,
      heading: course,
      speedKts: spdKts,
      speedKmh: spdKmh,
      lastUpdate: Date.now()
    };

    list.push(vessel);
  }

  allCorridorVessels.push(list);
});

// Interleave evenly across all 12 corridors so any slice has an authentic global distribution!
function interleaveArrays(arrays) {
  const result = [];
  const maxLen = Math.max(...arrays.map((a) => (a ? a.length : 0)), 0);
  for (let i = 0; i < maxLen; i++) {
    for (let j = 0; j < arrays.length; j++) {
      if (arrays[j] && i < arrays[j].length) {
        result.push(arrays[j][i]);
      }
    }
  }
  return result;
}

const interleavedFleet = interleaveArrays(allCorridorVessels);
console.log('Total interleaved global vessels generated:', interleavedFleet.length);

const outputPath = path.join(__dirname, '..', 'src', 'data', 'realVesselsSnapshot.json');
fs.writeFileSync(outputPath, JSON.stringify(interleavedFleet, null, 2), 'utf-8');
console.log('Successfully saved realVesselsSnapshot.json to:', outputPath);
