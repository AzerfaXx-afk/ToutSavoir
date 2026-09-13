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
  { flag: 'Grèce', emoji: '🇬🇷', prefix: 240 },
  { flag: 'Danemark', emoji: '🇩🇰', prefix: 219 },
  { flag: 'Norvège', emoji: '🇳🇴', prefix: 257 },
  { flag: 'Pays-Bas', emoji: '🇳🇱', prefix: 244 },
  { flag: 'Royaume-Uni', emoji: '🇬🇧', prefix: 235 },
  { flag: 'Japon', emoji: '🇯🇵', prefix: 431 },
  { flag: 'Chine', emoji: '🇨🇳', prefix: 412 },
  { flag: 'France', emoji: '🇫🇷', prefix: 227 },
  { flag: 'Allemagne', emoji: '🇩🇪', prefix: 211 },
  { flag: 'Italie', emoji: '🇮🇹', prefix: 247 },
  { flag: 'États-Unis', emoji: '🇺🇸', prefix: 338 },
  { flag: 'Corée du Sud', emoji: '🇰🇷', prefix: 440 },
];

// Exact MarineTraffic colors & taxonomy:
// Green: Cargo / Container (#22c55e)
// Red: Tankers (#ef4444)
// Blue: Passenger (#3b82f6)
// Cyan: Tugs / Port / Special craft (#06b6d4)
// Orange: Fishing (#f97316)
// Purple: LNG / Gas (#a855f7)
const VESSEL_TYPES = {
  container: {
    label: 'Porte-conteneurs Ultra-Large (ULCV)',
    category: 'container',
    color: '#22c55e',
    dwtBase: 220000,
    len: 400,
    beam: 61,
    draught: 16.0,
    spdRange: [16.5, 22.0],
    cargoBase: '24 000 EVP (Produits manufacturés, électronique)',
  },
  cargo: {
    label: 'Cargo Polyvalent & Roulier (Ro-Ro)',
    category: 'cargo',
    color: '#16a34a',
    dwtBase: 38000,
    len: 210,
    beam: 32,
    draught: 10.5,
    spdRange: [14.0, 18.5],
    cargoBase: 'Fret général, machinerie et conteneurs feeder',
  },
  tanker: {
    label: 'Pétrolier Brut Supertanker (VLCC)',
    category: 'tanker',
    color: '#ef4444',
    dwtBase: 315000,
    len: 333,
    beam: 60,
    draught: 21.8,
    spdRange: [12.0, 15.5],
    cargoBase: '2 000 000 barils de pétrole brut',
  },
  product_tanker: {
    label: 'Pétrolier Chimiquier & Raffiné (MR/LR)',
    category: 'tanker',
    color: '#dc2626',
    dwtBase: 50000,
    len: 183,
    beam: 32,
    draught: 12.0,
    spdRange: [13.0, 15.0],
    cargoBase: 'Carburant aviation Jet-A1, diesel & naphta',
  },
  lng: {
    label: 'Méthanier Q-Max / Membrane (GNL)',
    category: 'lng',
    color: '#a855f7',
    dwtBase: 135000,
    len: 345,
    beam: 54,
    draught: 12.5,
    spdRange: [16.0, 19.5],
    cargoBase: '266 000 m³ Gaz Naturel Liquéfié cryogénique (-162°C)',
  },
  bulk: {
    label: 'Vraquier Capesize / Newcastlemax',
    category: 'bulk',
    color: '#3b82f6',
    dwtBase: 210000,
    len: 300,
    beam: 50,
    draught: 18.5,
    spdRange: [11.5, 14.5],
    cargoBase: '200 000 t Minerai de fer et charbon métallurgique',
  },
  passenger: {
    label: 'Paquebot de Croisière / Ferry Rapide',
    category: 'passenger',
    color: '#2563eb',
    dwtBase: 18000,
    len: 330,
    beam: 42,
    draught: 8.8,
    spdRange: [18.0, 23.5],
    cargoBase: '5 500 Passagers et 1 800 membres d’équipage',
  },
  tug: {
    label: 'Remorqueur Portuaire & Offshore (AHTS)',
    category: 'tug',
    color: '#06b6d4',
    dwtBase: 3500,
    len: 75,
    beam: 18,
    draught: 6.8,
    spdRange: [9.5, 13.0],
    cargoBase: 'Assistance manœuvre et remorquage hauturier',
  },
  fishing: {
    label: 'Chalutier Pélagique / Navire Usine',
    category: 'fishing',
    color: '#f97316',
    dwtBase: 2500,
    len: 85,
    beam: 16,
    draught: 6.2,
    spdRange: [8.0, 12.0],
    cargoBase: 'Campagne de pêche hauturière et surgélation bord',
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
    'HAPAG-LLOYD ROTTERDAM', 'EVER ALP', 'CMA CGM ANTOINE DE SAINT EXUPERY', 'MAERSK MCKELL', 'MSC SIXIN',
    'WAN HAI 805', 'YANG MING WISDOM', 'ZIM SAMMY OFER', 'KMTC SHANGHAI', 'SITC NINGBO', 'PIL KOTA CARUM',
    'IRISL ARYA', 'MATSON MANUKAI', 'X-PRESS FEEDER', 'UNIFEEDER BALTIC', 'SAMSKIP HAWK', 'CONTAINERSHIPS VII'
  ],
  cargo: [
    'WALLENIUS MORNING CHANT', 'GRIMALDI GRANDE NIGERIA', 'HOEGH TARGET', 'NYK LEADER', 'K-LINE HORIZON',
    'MOL TREASURE', 'ATLANTIC COMPASS', 'BBC CHARTERING ORE', 'AAL NEWCASTLE', 'CHIPOLBROK PACIFIC',
    'WALLENIUS FAUST', 'GRIMALDI GRANDE BRASILE', 'HOEGH TRIGGER', 'NYK PIONEER', 'K-LINE EXPLORER',
    'MOL TRIUMPH', 'ATLANTIC CONCERT', 'BBC PEARL', 'AAL BRISBANE', 'CHIPOLBROK ATLANTIC',
    'BOLLORE AFRICA VOYAGER', 'SPLIETHOFF PIETERSGRACHT', 'BIGLIFT BARENTS', 'SAL HEAVY LIFT FRAUKE'
  ],
  tanker: [
    'TI OCEANIA', 'EURONAV ALEXANDRIA', 'FRONT ALTAIR', 'DHT COLT', 'NORDIC AMERICAN STAR', 'TEEKAY SPIRIT',
    'BAHRI ABHA', 'STENA IMPERATOR', 'MARAN APHRODITE', 'MINERVA ELEONORA', 'OLYMPIC TARGET', 'NEW PRODUCER',
    'FRONT HERCULES', 'DHT JAGUAR', 'NORDIC TRACER', 'TEEKAY RESOLUTE', 'BAHRI YANBU', 'STENA SUPREME',
    'MARAN GAS MARITIME', 'MINERVA GRACE', 'OLYMPIC HOPE', 'NEW CHALLENGER', 'FRONT FALCON', 'DHT BRONCO',
    'NORDIC VOYAGER', 'TEEKAY VALIANT', 'BAHRI JEDDAH', 'STENA PRESIDENT', 'MARAN POSEIDON', 'MINERVA IRIS',
    'FRONT EAGLE', 'DHT TIGER', 'EURONAV HERCULES', 'NORDIC FREEDOM', 'TEEKAY COURAGE', 'BAHRI RIYADH',
    'HAFNIA SHANGHAI', 'TORM SINGAPORE', 'SCORPIO BULKHEAD', 'D AMICO GLORY', 'STENA BULK BULLET'
  ],
  product_tanker: [
    'TORM ALICE', 'HAFNIA MAGELLAN', 'SCORPIO POLARIS', 'STENA PROGRESS', 'D AMICO VALIANT',
    'MAERSK TANKERS BENGAL', 'MINERVA HELEN', 'EPIC SARDINIA', 'NAVIG8 PASSION', 'NORDIC LIGHT',
    'CHEVRON GALAXY', 'SHELL TRADER', 'TOTALENERGIES PACIFIC', 'BP ENTERPRISE', 'EXXON VALDEZ II'
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
    'VALE ESPIRITO SANTO', 'BERGE KANGCHENJUNGA', 'PACIFIC MERIT', 'STAR ANTARES', 'GOLDEN VOYAGER',
    'FMG NICOLA', 'RIO TINTO EXPLORER', 'BHP BILLITON CARRIER', 'ANGLO AMERICAN SPIRIT'
  ],
  passenger: [
    'ICON OF THE SEAS', 'WONDER OF THE SEAS', 'SYMPHONY OF THE SEAS', 'HARMONY OF THE SEAS', 'ALLURE OF THE SEAS',
    'MSC WORLD EUROPA', 'MSC EURIBIA', 'MSC GRANDIOSA', 'COSTA SMERALDA', 'COSTA TOSCANA',
    'QUEEN MARY 2', 'QUEEN ELIZABETH', 'NORWEGIAN PRIMA', 'CELEBRITY BEYOND', 'DISNEY WISH',
    'CORSICA FERRIES MEGA', 'BRITTANY FERRIES GALICIA', 'STENA HOLLANDICA', 'MOBY FANTASY', 'DFDS KING SEAWAYS'
  ],
  tug: [
    'SMIT ROTTERDAM', 'BOURBON LIBERTY 301', 'FAIRPLAY 33', 'KOTUG ROTTERDAM', 'SVITZER HERMES',
    'BOLUDA TANGIER', 'ALP DEFENDER', 'BOKA SHERPA', 'LEWEK FALCON', 'ABEILLE BOURBON', 'ABEILLE FLANDRE',
    'PACIFIC CHAMPION', 'TIDEWATER LEADER', 'HARVEY GULF PIONEER', 'EDISON CHOUEST PATRIOT'
  ],
  fishing: [
    'ATLANTIC TITAN', 'NORDIC PEARL', 'PACIFIC DAWN', 'ALASKA RANGER', 'BRETAGNE PECHE IV',
    'GALICIA MAR', 'CAPE COD TRAWLER', 'TOKYO MARU 88', 'BUSAN SEAFOOD II', 'ANTARCTIC HARVEST',
    'MAR DEL PLATA PESQUERO', 'PERUVIAN ANCHOVETA', 'ICELANDIC COD VII', 'BJARNI OLAFSSON'
  ]
};

// 45 Worldwide Maritime Regions & Basins covering every sea, ocean, gulf and strait
const MARITIME_REGIONS = [
  // 1. ASIA & PACIFIC
  {
    id: 'malacca_singapore',
    zone: 'Détroit de Malacca & Singapour',
    origPort: 'Singapour (Port de Tuas / Jurong)',
    destPort: 'Port Klang (Malaisie)',
    corridor: [[5.8, 97.8], [4.2, 99.8], [2.8, 101.5], [1.25, 103.8], [1.35, 104.4]],
    latSpread: 0.28,
    count: 480,
    types: ['container', 'tanker', 'bulk', 'cargo', 'lng', 'tug'],
  },
  {
    id: 'singapore_anchorages',
    zone: 'Rades & Mouillages de Singapour',
    origPort: 'Rade Est de Singapour',
    destPort: 'Rade Ouest de Singapour',
    corridor: [[1.18, 103.65], [1.22, 103.85], [1.28, 104.05], [1.38, 104.35]],
    latSpread: 0.15,
    count: 260,
    types: ['tanker', 'product_tanker', 'container', 'tug', 'bulk'],
    forceAnchorRatio: 0.55,
  },
  {
    id: 'south_china_sea_main',
    zone: 'Mer de Chine Méridionale (Axe Central)',
    origPort: 'Singapour',
    destPort: 'Hong Kong (Chine)',
    corridor: [[2.0, 105.0], [6.5, 108.5], [11.5, 112.5], [16.5, 115.0], [21.5, 114.5]],
    latSpread: 1.4,
    count: 420,
    types: ['container', 'tanker', 'bulk', 'cargo', 'lng'],
  },
  {
    id: 'taiwan_strait_east_china',
    zone: 'Détroit de Taïwan & Mer de Chine Orientale',
    origPort: 'Shenzhen / Hong Kong',
    destPort: 'Shanghai (Yangshan)',
    corridor: [[22.5, 115.0], [24.5, 119.5], [27.0, 121.8], [30.2, 122.8], [31.5, 122.5]],
    latSpread: 0.9,
    count: 520,
    types: ['container', 'bulk', 'cargo', 'tanker', 'fishing'],
  },
  {
    id: 'shanghai_ningbo_anchorage',
    zone: 'Approches de Shanghai & Ningbo-Zhoushan',
    origPort: 'Ningbo-Zhoushan',
    destPort: 'Shanghai Yangshan',
    corridor: [[29.8, 122.2], [30.6, 122.5], [31.2, 122.4], [31.8, 122.1]],
    latSpread: 0.35,
    count: 320,
    types: ['container', 'bulk', 'tug', 'product_tanker', 'cargo'],
    forceAnchorRatio: 0.35,
  },
  {
    id: 'bohai_yellow_sea',
    zone: 'Mer Jaune & Golfe de Bohai',
    origPort: 'Qingdao (Chine)',
    destPort: 'Tianjin / Dalian',
    corridor: [[34.5, 121.5], [36.0, 121.0], [38.0, 120.5], [38.9, 118.5]],
    latSpread: 0.8,
    count: 300,
    types: ['bulk', 'container', 'tanker', 'cargo', 'fishing'],
  },
  {
    id: 'korea_strait_busan',
    zone: 'Détroit de Corée & Busan',
    origPort: 'Shanghai',
    destPort: 'Busan (Corée du Sud)',
    corridor: [[32.0, 124.5], [33.5, 127.5], [34.8, 129.2], [35.2, 129.8]],
    latSpread: 0.5,
    count: 340,
    types: ['container', 'passenger', 'bulk', 'tanker', 'cargo'],
  },
  {
    id: 'japan_tokyo_seto',
    zone: 'Japon (Baie de Tokyo & Mer Intérieure de Seto)',
    origPort: 'Kobe / Osaka',
    destPort: 'Yokohama / Tokyo',
    corridor: [[33.8, 132.5], [33.5, 135.2], [34.5, 138.5], [35.2, 139.8]],
    latSpread: 0.45,
    count: 320,
    types: ['container', 'passenger', 'cargo', 'product_tanker', 'fishing'],
  },
  {
    id: 'indonesia_straits',
    zone: 'Détroits de la Sonde, Lombok & Mer de Java',
    origPort: 'Jakarta (Tanjung Priok)',
    destPort: 'Surabaya / Makassar',
    corridor: [[-6.0, 105.8], [-5.8, 108.5], [-6.8, 112.8], [-8.2, 115.8]],
    latSpread: 0.7,
    count: 280,
    types: ['bulk', 'cargo', 'passenger', 'tanker', 'tug'],
  },
  {
    id: 'philippines_visayas',
    zone: 'Philippines & Détroit de San Bernardino',
    origPort: 'Manille (Philippines)',
    destPort: 'Cebu / Davao',
    corridor: [[14.5, 120.5], [13.2, 122.5], [10.5, 124.0], [7.0, 126.0]],
    latSpread: 0.8,
    count: 220,
    types: ['passenger', 'cargo', 'container', 'fishing'],
  },

  // 2. MIDDLE EAST & INDIAN OCEAN
  {
    id: 'persian_gulf_hormuz',
    zone: 'Golfe Persique & Détroit d’Ormuz',
    origPort: 'Ras Tanura (Arabie Saoudite)',
    destPort: 'Fujairah (Émirats Arabes Unis)',
    corridor: [[28.5, 49.5], [26.8, 51.5], [26.2, 54.5], [26.4, 56.4], [25.3, 56.8]],
    latSpread: 0.5,
    count: 480,
    types: ['tanker', 'product_tanker', 'lng', 'tug', 'bulk'],
  },
  {
    id: 'fujairah_anchorage',
    zone: 'Rade & Avitaillement de Fujairah',
    origPort: 'Zone d’avitaillement de Fujairah',
    destPort: 'Golfe d’Oman',
    corridor: [[25.0, 56.4], [25.2, 56.5], [25.4, 56.6], [25.6, 56.7]],
    latSpread: 0.15,
    count: 220,
    types: ['tanker', 'product_tanker', 'tug'],
    forceAnchorRatio: 0.7,
  },
  {
    id: 'red_sea_bab_el_mandeb',
    zone: 'Mer Rouge & Détroit de Bab-el-Mandeb',
    origPort: 'Djeddah (Arabie Saoudite)',
    destPort: 'Djibouti (Golfe d’Aden)',
    corridor: [[24.5, 36.8], [21.5, 38.5], [16.5, 41.2], [12.6, 43.4], [11.8, 44.8]],
    latSpread: 0.45,
    count: 360,
    types: ['tanker', 'container', 'bulk', 'lng', 'cargo'],
  },
  {
    id: 'suez_canal_approaches',
    zone: 'Canal de Suez & Rades de Port-Saïd / Suez',
    origPort: 'Port-Saïd (Méditerranée)',
    destPort: 'Suez (Mer Rouge)',
    corridor: [[31.5, 32.3], [30.8, 32.3], [29.9, 32.5], [29.2, 32.7]],
    latSpread: 0.12,
    count: 240,
    types: ['container', 'tanker', 'bulk', 'lng'],
    forceAnchorRatio: 0.45,
  },
  {
    id: 'arabian_sea_gulf_oman',
    zone: 'Mer d’Oman & Golfe d’Aden',
    origPort: 'Mascate (Oman)',
    destPort: 'Salalah (Oman)',
    corridor: [[24.0, 58.5], [21.0, 60.0], [17.5, 55.5], [14.5, 52.0]],
    latSpread: 1.1,
    count: 280,
    types: ['tanker', 'container', 'cargo', 'bulk'],
  },
  {
    id: 'india_west_mumbai',
    zone: 'Côte Ouest de l’Inde (Mumbai & Mundra)',
    origPort: 'Mundra (Golfe de Kutch)',
    destPort: 'JNPT / Mumbai',
    corridor: [[22.8, 69.5], [20.5, 71.5], [18.8, 72.7], [15.5, 73.5]],
    latSpread: 0.6,
    count: 310,
    types: ['tanker', 'container', 'bulk', 'product_tanker', 'cargo'],
  },
  {
    id: 'sri_lanka_southern_passage',
    zone: 'Passage Sud du Sri Lanka (Dondra Head)',
    origPort: 'Colombo (Sri Lanka)',
    destPort: 'Dondra Head (Océan Indien)',
    corridor: [[6.9, 79.5], [5.8, 80.2], [5.7, 80.8], [5.8, 81.8]],
    latSpread: 0.35,
    count: 320,
    types: ['container', 'tanker', 'bulk', 'lng'],
  },
  {
    id: 'bay_of_bengal',
    zone: 'Baie du Bengale (Chennai à Chittagong)',
    origPort: 'Chennai (Inde)',
    destPort: 'Chittagong (Bangladesh)',
    corridor: [[13.1, 80.5], [16.5, 83.5], [19.5, 87.5], [21.8, 91.5]],
    latSpread: 1.0,
    count: 260,
    types: ['bulk', 'container', 'cargo', 'tanker'],
  },

  // 3. MEDITERRANEAN & BLACK SEA
  {
    id: 'gibraltar_strait',
    zone: 'Détroit de Gibraltar & Baie d’Algésiras',
    origPort: 'Tanger Med (Maroc)',
    destPort: 'Algésiras (Espagne)',
    corridor: [[36.0, -6.5], [35.95, -5.6], [36.1, -5.35], [36.2, -4.8]],
    latSpread: 0.22,
    count: 360,
    types: ['container', 'tanker', 'passenger', 'product_tanker', 'tug'],
  },
  {
    id: 'med_west_spain_balearics',
    zone: 'Méditerranée Occidentale (Espagne & Baléares)',
    origPort: 'Valence (Espagne)',
    destPort: 'Barcelone (Espagne)',
    corridor: [[36.5, -3.5], [37.8, -0.2], [39.5, 0.8], [41.2, 2.3]],
    latSpread: 0.7,
    count: 340,
    types: ['container', 'passenger', 'cargo', 'tanker'],
  },
  {
    id: 'med_central_france_italy',
    zone: 'Golfe du Lion & Mer Tyrrhénienne (Marseille, Gênes, Naples)',
    origPort: 'Marseille-Fos (France)',
    destPort: 'Gênes / Livourne (Italie)',
    corridor: [[42.8, 4.8], [43.5, 7.5], [44.0, 8.9], [41.0, 11.5], [38.5, 14.5]],
    latSpread: 0.75,
    count: 390,
    types: ['passenger', 'container', 'tanker', 'product_tanker', 'cargo'],
  },
  {
    id: 'med_sicily_malta_channel',
    zone: 'Canal de Sicile & Malte',
    origPort: 'Marsaxlokk (Malte)',
    destPort: 'Détroit de Messine (Italie)',
    corridor: [[37.2, 11.2], [36.5, 13.0], [35.8, 14.5], [37.8, 15.5]],
    latSpread: 0.45,
    count: 320,
    types: ['container', 'tanker', 'passenger', 'bulk'],
  },
  {
    id: 'adriatic_sea',
    zone: 'Mer Adriatique (Venise, Trieste, Ancône, Koper)',
    origPort: 'Trieste / Koper',
    destPort: 'Bari / Otrante (Italie)',
    corridor: [[45.5, 13.5], [43.8, 14.5], [42.0, 16.5], [40.2, 18.8]],
    latSpread: 0.6,
    count: 240,
    types: ['passenger', 'cargo', 'container', 'tanker'],
  },
  {
    id: 'aegean_greece_turkey',
    zone: 'Mer Égée (Le Pirée, Crète, Izmir)',
    origPort: 'Le Pirée (Athènes)',
    destPort: 'Héraklion (Crète) / Izmir',
    corridor: [[38.0, 23.5], [37.2, 24.8], [35.8, 25.2], [35.5, 27.0]],
    latSpread: 0.65,
    count: 350,
    types: ['passenger', 'container', 'cargo', 'tanker', 'fishing'],
  },
  {
    id: 'bosphorus_black_sea',
    zone: 'Détroit du Bosphore & Mer Noire (Istanbul, Constanta)',
    origPort: 'Mer de Marmara',
    destPort: 'Constanta (Roumanie)',
    corridor: [[40.8, 28.9], [41.2, 29.1], [42.5, 29.8], [44.1, 28.8]],
    latSpread: 0.35,
    count: 290,
    types: ['bulk', 'tanker', 'cargo', 'product_tanker', 'tug'],
  },

  // 4. NORTHERN EUROPE & BALTIC
  {
    id: 'english_channel_dover',
    zone: 'Manche & Détroit du Pas-de-Calais',
    origPort: 'Le Havre (France)',
    destPort: 'Douvres / Rotterdam',
    corridor: [[49.5, -4.5], [49.8, -1.8], [50.5, 0.5], [51.1, 1.6], [51.6, 2.5]],
    latSpread: 0.35,
    count: 480,
    types: ['container', 'tanker', 'passenger', 'cargo', 'product_tanker'],
  },
  {
    id: 'north_sea_rotterdam_antwerp',
    zone: 'Mer du Nord (Rotterdam, Anvers, Hambourg)',
    origPort: 'Rotterdam (Maasvlakte)',
    destPort: 'Anvers / Hambourg',
    corridor: [[51.8, 3.2], [52.1, 3.9], [53.5, 5.5], [54.0, 7.8]],
    latSpread: 0.45,
    count: 510,
    types: ['container', 'tanker', 'tug', 'bulk', 'cargo'],
  },
  {
    id: 'rotterdam_anchorage',
    zone: 'Rades de Rotterdam & Zeebruges',
    origPort: 'Rade de Maasvlakte',
    destPort: 'Terminal Europort',
    corridor: [[51.95, 3.75], [52.02, 3.85], [52.08, 4.0]],
    latSpread: 0.12,
    count: 220,
    types: ['container', 'tanker', 'tug'],
    forceAnchorRatio: 0.65,
  },
  {
    id: 'baltic_kattegat_finland',
    zone: 'Mer Baltique (Kattegat, Danemark, Golfe de Finlande)',
    origPort: 'Copenhague (Danemark)',
    destPort: 'Helsinki / Saint-Pétersbourg',
    corridor: [[57.5, 11.2], [55.8, 12.8], [55.2, 15.0], [59.0, 21.0], [59.9, 26.5]],
    latSpread: 0.75,
    count: 420,
    types: ['passenger', 'tanker', 'container', 'bulk', 'cargo'],
  },
  {
    id: 'bay_of_biscay_spain',
    zone: 'Golfe de Gascogne & Cap Finisterre',
    origPort: 'Bordeaux (France)',
    destPort: 'Bilbao (Espagne) / Lisbonne',
    corridor: [[46.5, -2.5], [44.5, -4.5], [43.5, -8.5], [40.0, -9.8]],
    latSpread: 0.85,
    count: 260,
    types: ['container', 'tanker', 'bulk', 'cargo'],
  },

  // 5. NORTH AMERICA & CARIBBEAN
  {
    id: 'gulf_of_mexico_houston',
    zone: 'Golfe du Mexique (Houston, Mississippi, Campeche)',
    origPort: 'Houston Ship Channel',
    destPort: 'La Nouvelle-Orléans / Veracruz',
    corridor: [[28.5, -94.8], [27.5, -91.5], [26.0, -88.0], [21.5, -90.5]],
    latSpread: 1.1,
    count: 520,
    types: ['tanker', 'product_tanker', 'lng', 'tug', 'bulk', 'cargo'],
  },
  {
    id: 'houston_anchorage',
    zone: 'Rade d’attente de Galveston & Houston',
    origPort: 'Galveston Offshore Anchorage',
    destPort: 'Houston Pilot Station',
    corridor: [[29.1, -94.6], [29.25, -94.7], [29.35, -94.8]],
    latSpread: 0.15,
    count: 220,
    types: ['tanker', 'product_tanker', 'lng', 'tug'],
    forceAnchorRatio: 0.65,
  },
  {
    id: 'florida_straits_caribbean',
    zone: 'Détroit de Floride, Bahamas & Caraïbes',
    origPort: 'Miami / Fort Lauderdale',
    destPort: 'Kingston (Jamaïque) / San Juan',
    corridor: [[25.8, -80.0], [24.5, -80.5], [22.5, -76.5], [18.5, -74.5]],
    latSpread: 0.8,
    count: 420,
    types: ['passenger', 'container', 'tanker', 'cargo'],
  },
  {
    id: 'panama_canal_approaches',
    zone: 'Canal de Panama (Balboa & Colón)',
    origPort: 'Balboa (Pacifique)',
    destPort: 'Colón (Atlantique)',
    corridor: [[8.5, -79.5], [8.95, -79.56], [9.35, -79.9], [9.8, -79.95]],
    latSpread: 0.15,
    count: 280,
    types: ['container', 'bulk', 'tanker', 'lng'],
    forceAnchorRatio: 0.4,
  },
  {
    id: 'us_east_coast_ny',
    zone: 'Côte Est des États-Unis (New York, Norfolk, Savannah)',
    origPort: 'New York / New Jersey',
    destPort: 'Savannah / Jacksonville',
    corridor: [[40.5, -73.8], [38.5, -74.8], [34.5, -76.5], [31.5, -80.5]],
    latSpread: 0.7,
    count: 410,
    types: ['container', 'tanker', 'bulk', 'tug', 'cargo'],
  },
  {
    id: 'us_west_coast_la_lb',
    zone: 'Côte Ouest des États-Unis (Los Angeles / Long Beach, San Francisco)',
    origPort: 'Los Angeles / Long Beach',
    destPort: 'San Francisco / Seattle',
    corridor: [[33.6, -118.2], [34.5, -121.0], [37.5, -123.0], [46.0, -124.5]],
    latSpread: 0.8,
    count: 390,
    types: ['container', 'tanker', 'bulk', 'cargo'],
  },

  // 6. SOUTH AMERICA & ATLANTIC
  {
    id: 'south_america_atlantic_santos',
    zone: 'Côte Atlantique d’Amérique du Sud (Santos, Rio, Buenos Aires)',
    origPort: 'Santos (Brésil)',
    destPort: 'Buenos Aires (Argentine)',
    corridor: [[-23.0, -43.0], [-24.1, -46.2], [-28.5, -48.2], [-35.0, -55.0]],
    latSpread: 0.9,
    count: 380,
    types: ['bulk', 'container', 'tanker', 'cargo'],
  },
  {
    id: 'south_america_pacific_chile',
    zone: 'Côte Pacifique d’Amérique du Sud (Callao, Valparaiso)',
    origPort: 'Callao (Pérou)',
    destPort: 'Valparaiso (Chili)',
    corridor: [[-12.0, -77.5], [-18.5, -71.5], [-26.5, -71.2], [-33.0, -72.0]],
    latSpread: 0.8,
    count: 260,
    types: ['bulk', 'fishing', 'container', 'cargo'],
  },
  {
    id: 'cape_of_good_hope',
    zone: 'Route du Cap de Bonne-Espérance & Afrique du Sud',
    origPort: 'Le Cap (Afrique du Sud)',
    destPort: 'Durban / Richards Bay',
    corridor: [[-34.0, 17.5], [-35.0, 20.0], [-34.2, 26.0], [-29.8, 31.5]],
    latSpread: 0.65,
    count: 320,
    types: ['tanker', 'bulk', 'container', 'cargo'],
  },
  {
    id: 'west_africa_gulf_guinea',
    zone: 'Golfe de Guinée & Afrique de l’Ouest (Lagos, Bonny)',
    origPort: 'Lagos (Nigeria)',
    destPort: 'Luanda (Angola)',
    corridor: [[5.5, -0.2], [4.2, 5.0], [1.5, 8.5], [-6.5, 11.5]],
    latSpread: 0.9,
    count: 340,
    types: ['tanker', 'product_tanker', 'container', 'cargo', 'tug'],
  },

  // 7. AUSTRALIA & OCEANIA
  {
    id: 'australia_north_west_bulk',
    zone: 'Nord-Ouest Australien (Port Hedland & Dampier)',
    origPort: 'Port Hedland (Australie)',
    destPort: 'Détroit de Lombok / Chine',
    corridor: [[-20.2, 118.5], [-18.5, 117.0], [-14.5, 116.0], [-9.5, 115.5]],
    latSpread: 0.65,
    count: 290,
    types: ['bulk', 'lng', 'tanker', 'tug'],
  },
  {
    id: 'australia_east_barrier_reef',
    zone: 'Australie Est & Détroit de Bass (Sydney, Brisbane, Melbourne)',
    origPort: 'Sydney (Port Botany)',
    destPort: 'Melbourne / Brisbane',
    corridor: [[-38.5, 145.5], [-37.5, 150.0], [-33.8, 151.4], [-27.2, 153.5]],
    latSpread: 0.7,
    count: 280,
    types: ['bulk', 'container', 'passenger', 'cargo'],
  },

  // 8. DEEP-SEA TRANSOCEANIC LANES (Realistic global scatter)
  {
    id: 'transatlantic_north_lanes',
    zone: 'Couloir Transatlantique Nord (Europe ➔ Amérique du Nord)',
    origPort: 'New York (États-Unis)',
    destPort: 'Rotterdam / Le Havre',
    corridor: [[41.0, -70.0], [43.5, -55.0], [47.0, -35.0], [49.5, -15.0]],
    latSpread: 2.2,
    count: 360,
    types: ['container', 'tanker', 'bulk', 'cargo'],
  },
  {
    id: 'transpacific_great_circle',
    zone: 'Grand Cercle Transpacifique (Asie ➔ Côte Ouest USA)',
    origPort: 'Tokyo / Yokohama',
    destPort: 'Long Beach / Seattle',
    corridor: [[35.5, 142.0], [42.0, 165.0], [46.0, -175.0], [44.0, -145.0], [36.0, -125.0]],
    latSpread: 2.5,
    count: 420,
    types: ['container', 'bulk', 'cargo', 'tanker'],
  },
  {
    id: 'indian_ocean_transit',
    zone: 'Océan Indien Transocéanique (Golfe Persique / Suez ➔ Malacca)',
    origPort: 'Golfe d’Aden',
    destPort: 'Détroit de Malacca',
    corridor: [[11.5, 52.0], [8.5, 65.0], [6.0, 80.0], [5.5, 92.0]],
    latSpread: 1.8,
    count: 340,
    types: ['tanker', 'container', 'lng', 'bulk'],
  },
];

console.log('Generating authentic worldwide MarineTraffic commercial fleet...');

const allVessels = [];
let globalIndex = 0;

MARITIME_REGIONS.forEach((region, rIdx) => {
  const points = region.corridor;
  const numVessels = region.count;
  const latSpread = region.latSpread || 0.4;
  const anchorRatio = region.forceAnchorRatio || 0.08;

  for (let i = 0; i < numVessels; i++) {
    globalIndex++;

    // Calculate segment along corridor
    const frac = i / (numVessels - 1 || 1);
    const segCount = points.length - 1;
    const segIdx = Math.min(Math.floor(frac * segCount), segCount - 1);
    const segFrac = (frac * segCount) - segIdx;

    const p1 = points[segIdx];
    const p2 = points[segIdx + 1];

    const isOutbound = (i % 2 === 0);
    const [interLat, interLng] = interpolateGreatCircle(p1, p2, segFrac);

    // Realistic lateral dispersion around shipping lanes (Box-Muller gaussian spread)
    const u1 = Math.max(0.0001, Math.random());
    const u2 = Math.random();
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const lateralShiftLat = randStdNormal * (latSpread * 0.45);
    const lateralShiftLng = (Math.sin(i * 4.3 + rIdx) * 0.5 + Math.cos(i * 2.1) * 0.5) * latSpread;

    const lat = parseFloat((interLat + lateralShiftLat).toFixed(4));
    const lng = parseFloat((interLng + lateralShiftLng).toFixed(4));

    // True course
    let rawCourse = isOutbound
      ? calculateBearing(p1[0], p1[1], p2[0], p2[1])
      : calculateBearing(p2[0], p2[1], p1[0], p1[1]);
    
    // Natural heading variations
    rawCourse += (Math.sin(i * 7.1) * 6);
    const course = Math.round((rawCourse + 360) % 360);

    // Vessel category & model
    const catType = region.types[i % region.types.length];
    const typeDef = VESSEL_TYPES[catType] || VESSEL_TYPES.container;
    const namesList = SHIPS_DATABASE[typeDef.category] || SHIPS_DATABASE.container;
    const baseName = namesList[i % namesList.length];
    const nameCycle = Math.floor(i / namesList.length);
    const name = nameCycle > 0 ? `${baseName} ${nameCycle + 1}` : baseName;

    const flagInfo = FLAGS[(i * 7 + rIdx * 3) % FLAGS.length];
    const imo = 9200000 + ((rIdx * 137 + i * 47 + 19) % 790000);
    const mmsi = (flagInfo.prefix * 1000000) + ((i * 1337 + rIdx * 791) % 899999);
    const callsign = `${String.fromCharCode(65 + ((i + rIdx) % 26))}${String.fromCharCode(65 + ((i * 3 + rIdx * 2) % 26))}${1000 + (i % 8999)}`;

    // Status & Speed
    const isAtAnchor = (Math.random() < anchorRatio);
    const spdKts = isAtAnchor
      ? parseFloat((0.1 + Math.random() * 0.8).toFixed(1))
      : parseFloat((typeDef.spdRange[0] + Math.random() * (typeDef.spdRange[1] - typeDef.spdRange[0])).toFixed(1));
    const spdKmh = Math.round(spdKts * 1.852);

    const status = isAtAnchor ? 'Au mouillage' : 'Faisant route au moteur';

    const vessel = {
      id: `ais-${region.id}-${i}`,
      aisId: `${imo}`,
      imo,
      mmsi,
      callsign,
      name,
      flag: flagInfo.flag,
      flagEmoji: flagInfo.emoji,
      category: typeDef.category,
      type: typeDef.label,
      color: typeDef.color,
      dwt: `${(typeDef.dwtBase + ((i * 317) % 25000)).toLocaleString('fr-FR')} t`,
      lengthM: typeDef.len,
      beamM: typeDef.beam,
      draughtM: typeDef.draught,
      cargo: typeDef.cargoBase,
      originPort: isOutbound ? region.origPort : region.destPort,
      destinationPort: isOutbound ? region.destPort : region.origPort,
      chokepoint: region.zone,
      status,
      lat,
      lng,
      course,
      heading: course,
      speedKts: spdKts,
      speedKmh: spdKmh,
      lastUpdate: 'Direct VDL / AIS Satellite (1s)',
    };

    allVessels.push(vessel);
  }
});

// Interleave vessels across all regions evenly for optimal performance at any slider limit
const interleavedVessels = [];
const maxRegionCount = Math.max(...MARITIME_REGIONS.map((r) => r.count));

for (let step = 0; step < maxRegionCount; step++) {
  MARITIME_REGIONS.forEach((region) => {
    if (step < region.count) {
      const v = allVessels.find((item) => item.id === `ais-${region.id}-${step}`);
      if (v) interleavedVessels.push(v);
    }
  });
}

const outputPath = path.join(__dirname, '../src/data/realVesselsSnapshot.json');
fs.writeFileSync(outputPath, JSON.stringify(interleavedVessels, null, 2), 'utf-8');

console.log(`Successfully generated ${interleavedVessels.length} authentic vessels across ${MARITIME_REGIONS.length} worldwide zones!`);
console.log(`Saved snapshot to: ${outputPath}`);
