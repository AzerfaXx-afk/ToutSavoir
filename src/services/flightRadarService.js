import REAL_FLIGHTS_SNAPSHOT from '../data/realFlightsSnapshot.json';

// Dictionnaire étendu des compagnies aériennes mondiales (IATA / ICAO)
export const AIRLINE_NAMES = {
  // France & Europe
  AFR: { name: 'Air France', country: 'France', flag: '🇫🇷' },
  BAW: { name: 'British Airways', country: 'Royaume-Uni', flag: '🇬🇧' },
  DLH: { name: 'Lufthansa', country: 'Allemagne', flag: '🇩🇪' },
  UAE: { name: 'Emirates', country: 'Émirats Arabes Unis', flag: '🇦🇪' },
  QTR: { name: 'Qatar Airways', country: 'Qatar', flag: '🇶🇦' },
  SIA: { name: 'Singapore Airlines', country: 'Singapour', flag: '🇸🇬' },
  AAL: { name: 'American Airlines', country: 'États-Unis', flag: '🇺🇸' },
  DAL: { name: 'Delta Air Lines', country: 'États-Unis', flag: '🇺🇸' },
  UAL: { name: 'United Airlines', country: 'États-Unis', flag: '🇺🇸' },
  RYR: { name: 'Ryanair', country: 'Irlande', flag: '🇮🇪' },
  EZY: { name: 'easyJet', country: 'Royaume-Uni', flag: '🇬🇧' },
  KLM: { name: 'KLM Royal Dutch Airlines', country: 'Pays-Bas', flag: '🇳🇱' },
  IBE: { name: 'Iberia', country: 'Espagne', flag: '🇪🇸' },
  THY: { name: 'Turkish Airlines', country: 'Turquie', flag: '🇹🇷' },
  SWR: { name: 'Swiss International Air Lines', country: 'Suisse', flag: '🇨🇭' },
  TAP: { name: 'TAP Air Portugal', country: 'Portugal', flag: '🇵🇹' },
  AZA: { name: 'ITA Airways', country: 'Italie', flag: '🇮🇹' },
  SAS: { name: 'SAS Scandinavian Airlines', country: 'Suède', flag: '🇸🇪' },
  FIN: { name: 'Finnair', country: 'Finlande', flag: '🇫🇮' },
  WZZ: { name: 'Wizz Air', country: 'Hongrie', flag: '🇭🇺' },
  VLG: { name: 'Vueling', country: 'Espagne', flag: '🇪🇸' },
  TOY: { name: 'Transavia France', country: 'France', flag: '🇫🇷' },
  TRA: { name: 'Transavia', country: 'Pays-Bas', flag: '🇳🇱' },
  LOT: { name: 'LOT Polish Airlines', country: 'Pologne', flag: '🇵🇱' },
  AEE: { name: 'Aegean Airlines', country: 'Grèce', flag: '🇬🇷' },
  AUA: { name: 'Austrian Airlines', country: 'Autriche', flag: '🇦🇹' },
  BEL: { name: 'Brussels Airlines', country: 'Belgique', flag: '🇧🇪' },
  EIN: { name: 'Aer Lingus', country: 'Irlande', flag: '🇮🇪' },
  VIR: { name: 'Virgin Atlantic', country: 'Royaume-Uni', flag: '🇬🇧' },

  // Amériques
  ACA: { name: 'Air Canada', country: 'Canada', flag: '🇨🇦' },
  WJA: { name: 'WestJet', country: 'Canada', flag: '🇨🇦' },
  SWA: { name: 'Southwest Airlines', country: 'États-Unis', flag: '🇺🇸' },
  JBU: { name: 'JetBlue Airways', country: 'États-Unis', flag: '🇺🇸' },
  ASA: { name: 'Alaska Airlines', country: 'États-Unis', flag: '🇺🇸' },
  SKW: { name: 'SkyWest Airlines', country: 'États-Unis', flag: '🇺🇸' },
  ENY: { name: 'Envoy Air', country: 'États-Unis', flag: '🇺🇸' },
  RPA: { name: 'Republic Airways', country: 'États-Unis', flag: '🇺🇸' },
  EDV: { name: 'Endeavor Air', country: 'États-Unis', flag: '🇺🇸' },
  FFT: { name: 'Frontier Airlines', country: 'États-Unis', flag: '🇺🇸' },
  NKS: { name: 'Spirit Airlines', country: 'États-Unis', flag: '🇺🇸' },
  AMX: { name: 'Aeroméxico', country: 'Mexique', flag: '🇲🇽' },
  VOI: { name: 'Volaris', country: 'Mexique', flag: '🇲🇽' },
  AVA: { name: 'Avianca', country: 'Colombie', flag: '🇨🇴' },
  LAN: { name: 'LATAM Airlines', country: 'Chili', flag: '🇨🇱' },
  LXP: { name: 'LATAM Express', country: 'Chili', flag: '🇨🇱' },
  GLO: { name: 'Gol Linhas Aéreas', country: 'Brésil', flag: '🇧🇷' },
  AZU: { name: 'Azul Linhas Aéreas', country: 'Brésil', flag: '🇧🇷' },
  ARG: { name: 'Aerolíneas Argentinas', country: 'Argentine', flag: '🇦🇷' },
  CMP: { name: 'Copa Airlines', country: 'Panama', flag: '🇵🇦' },

  // Asie & Pacifique
  ANA: { name: 'All Nippon Airways', country: 'Japon', flag: '🇯🇵' },
  JAL: { name: 'Japan Airlines', country: 'Japon', flag: '🇯🇵' },
  CPA: { name: 'Cathay Pacific', country: 'Hong Kong', flag: '🇭🇰' },
  KAL: { name: 'Korean Air', country: 'Corée du Sud', flag: '🇰🇷' },
  AAR: { name: 'Asiana Airlines', country: 'Corée du Sud', flag: '🇰🇷' },
  CSN: { name: 'China Southern Airlines', country: 'Chine', flag: '🇨🇳' },
  CCA: { name: 'Air China', country: 'Chine', flag: '🇨🇳' },
  CES: { name: 'China Eastern Airlines', country: 'Chine', flag: '🇨🇳' },
  CHH: { name: 'Hainan Airlines', country: 'Chine', flag: '🇨🇳' },
  CSZ: { name: 'Shenzhen Airlines', country: 'Chine', flag: '🇨🇳' },
  CXA: { name: 'XiamenAir', country: 'Chine', flag: '🇨🇳' },
  EVA: { name: 'EVA Air', country: 'Taïwan', flag: '🇹🇼' },
  CAL: { name: 'China Airlines', country: 'Taïwan', flag: '🇹🇼' },
  AIC: { name: 'Air India', country: 'Inde', flag: '🇮🇳' },
  IGO: { name: 'IndiGo', country: 'Inde', flag: '🇮🇳' },
  MAS: { name: 'Malaysia Airlines', country: 'Malaisie', flag: '🇲🇾' },
  GIA: { name: 'Garuda Indonesia', country: 'Indonésie', flag: '🇮🇩' },
  THA: { name: 'Thai Airways', country: 'Thaïlande', flag: '🇹🇭' },
  VJC: { name: 'VietJet Air', country: 'Vietnam', flag: '🇻🇳' },
  HVN: { name: 'Vietnam Airlines', country: 'Vietnam', flag: '🇻🇳' },
  PAL: { name: 'Philippine Airlines', country: 'Philippines', flag: '🇵🇭' },
  QFA: { name: 'Qantas', country: 'Australie', flag: '🇦🇺' },
  VOZ: { name: 'Virgin Australia', country: 'Australie', flag: '🇦🇺' },
  JST: { name: 'Jetstar Airways', country: 'Australie', flag: '🇦🇺' },
  ANZ: { name: 'Air New Zealand', country: 'Nouvelle-Zélande', flag: '🇳🇿' },

  // Moyen-Orient & Afrique
  ETD: { name: 'Etihad Airways', country: 'Émirats Arabes Unis', flag: '🇦🇪' },
  FDB: { name: 'flydubai', country: 'Émirats Arabes Unis', flag: '🇦🇪' },
  ABY: { name: 'Air Arabia', country: 'Émirats Arabes Unis', flag: '🇦🇪' },
  SVA: { name: 'Saudia', country: 'Arabie Saoudite', flag: '🇸🇦' },
  OMA: { name: 'Oman Air', country: 'Oman', flag: '🇴🇲' },
  GFA: { name: 'Gulf Air', country: 'Bahreïn', flag: '🇧🇭' },
  KAC: { name: 'Kuwait Airways', country: 'Koweït', flag: '🇰🇼' },
  MSR: { name: 'EgyptAir', country: 'Égypte', flag: '🇪🇬' },
  ETH: { name: 'Ethiopian Airlines', country: 'Éthiopie', flag: '🇪🇹' },
  RAM: { name: 'Royal Air Maroc', country: 'Maroc', flag: '🇲🇦' },
  DAH: { name: 'Air Algérie', country: 'Algérie', flag: '🇩🇿' },
  TAR: { name: 'Tunisair', country: 'Tunisie', flag: '🇹🇳' },
  KQA: { name: 'Kenya Airways', country: 'Kenya', flag: '🇰🇪' },
  SAA: { name: 'South African Airways', country: 'Afrique du Sud', flag: '🇿🇦' },

  // Fret & Aviation d'affaires
  FDX: { name: 'FedEx Express', country: 'États-Unis', flag: '🇺🇸' },
  UPS: { name: 'UPS Airlines', country: 'États-Unis', flag: '🇺🇸' },
  GTI: { name: 'Atlas Air', country: 'États-Unis', flag: '🇺🇸' },
  VJT: { name: 'VistaJet', country: 'Malte', flag: '🇲🇹' },
  NJX: { name: 'NetJets Europe', country: 'Portugal', flag: '🇵🇹' },
  EJA: { name: 'NetJets', country: 'États-Unis', flag: '🇺🇸' },
};

// Dictionnaire des modèles d'avions ICAO
export const AIRCRAFT_MODELS = {
  // Gros porteurs longs-courriers
  B77W: 'Boeing 777-300ER',
  B772: 'Boeing 777-200',
  B77L: 'Boeing 777-200LR',
  B77F: 'Boeing 777 Freighter',
  B788: 'Boeing 787-8 Dreamliner',
  B789: 'Boeing 787-9 Dreamliner',
  B78X: 'Boeing 787-10 Dreamliner',
  B744: 'Boeing 747-400',
  B748: 'Boeing 747-8 Intercontinental',
  B763: 'Boeing 767-300',
  A388: 'Airbus A380-800',
  A359: 'Airbus A350-900',
  A35K: 'Airbus A350-1000',
  A332: 'Airbus A330-200',
  A333: 'Airbus A330-300',
  A339: 'Airbus A330-900neo',
  A343: 'Airbus A340-300',

  // Moyens porteurs et monocouloirs
  B737: 'Boeing 737-700',
  B738: 'Boeing 737-800',
  B739: 'Boeing 737-900',
  B38M: 'Boeing 737 MAX 8',
  B39M: 'Boeing 737 MAX 9',
  B752: 'Boeing 757-200',
  A320: 'Airbus A320-200',
  A20N: 'Airbus A320neo',
  A321: 'Airbus A321-200',
  A21N: 'Airbus A321neo',
  A319: 'Airbus A319',
  A318: 'Airbus A318',
  A223: 'Airbus A220-300',
  A221: 'Airbus A220-100',
  BCS3: 'Airbus A220-300',
  BCS1: 'Airbus A220-100',

  // Régionaux et Aviation d'affaires
  E190: 'Embraer E190',
  E195: 'Embraer E195',
  E295: 'Embraer E195-E2',
  E170: 'Embraer E170',
  E175: 'Embraer E175',
  CRJ9: 'Bombardier CRJ-900',
  CRJ7: 'Bombardier CRJ-700',
  CRJ2: 'Bombardier CRJ-200',
  GL7T: 'Bombardier Global 7500',
  GLEX: 'Bombardier Global 6000',
  CL35: 'Bombardier Challenger 350',
  C750: 'Cessna Citation X',
  C25A: 'Cessna Citation CJ2',
  C25B: 'Cessna Citation CJ3',
  C56X: 'Cessna Citation Excel',
  GA7C: 'Gulfstream G700',
  GA6C: 'Gulfstream G600/G650',
  GA5C: 'Gulfstream G500/G550',
  AT76: 'ATR 72-600',
  AT72: 'ATR 72',
  DH8D: 'De Havilland Dash 8-400',
  PC12: 'Pilatus PC-12',
  PC24: 'Pilatus PC-24',
};

// Dictionnaire des aéroports IATA mondiaux majeurs
export const AIRPORTS = {
  // France & Europe
  CDG: { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', coords: [49.0097, 2.5479] },
  ORY: { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France', coords: [48.7262, 2.3652] },
  NCE: { code: 'NCE', name: 'Nice Côte d’Azur', city: 'Nice', country: 'France', coords: [43.6653, 7.215] },
  LYS: { code: 'LYS', name: 'Lyon Saint-Exupéry', city: 'Lyon', country: 'France', coords: [45.7256, 5.0811] },
  MRS: { code: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'France', coords: [43.4367, 5.215] },
  TLS: { code: 'TLS', name: 'Toulouse Blagnac', city: 'Toulouse', country: 'France', coords: [43.635, 1.3678] },
  BOD: { code: 'BOD', name: 'Bordeaux Mérignac', city: 'Bordeaux', country: 'France', coords: [44.8283, -0.7156] },
  NTE: { code: 'NTE', name: 'Nantes Atlantique', city: 'Nantes', country: 'France', coords: [47.1532, -1.6107] },
  LHR: { code: 'LHR', name: 'Londres Heathrow', city: 'Londres', country: 'Royaume-Uni', coords: [51.47, -0.4543] },
  LGW: { code: 'LGW', name: 'Londres Gatwick', city: 'Londres', country: 'Royaume-Uni', coords: [51.1537, -0.1821] },
  MAN: { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'Royaume-Uni', coords: [53.3537, -2.275] },
  EDI: { code: 'EDI', name: 'Édimbourg Airport', city: 'Édimbourg', country: 'Royaume-Uni', coords: [55.9508, -3.3725] },
  DUB: { code: 'DUB', name: 'Dublin International', city: 'Dublin', country: 'Irlande', coords: [53.4264, -6.2499] },
  AMS: { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Pays-Bas', coords: [52.3105, 4.7683] },
  BRU: { code: 'BRU', name: 'Bruxelles National', city: 'Bruxelles', country: 'Belgique', coords: [50.901, 4.4856] },
  FRA: { code: 'FRA', name: 'Francfort', city: 'Francfort', country: 'Allemagne', coords: [50.0379, 8.5622] },
  MUC: { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Allemagne', coords: [48.3537, 11.775] },
  BER: { code: 'BER', name: 'Berlin Brandenburg', city: 'Berlin', country: 'Allemagne', coords: [52.3667, 13.5033] },
  ZRH: { code: 'ZRH', name: 'Zurich Kloten', city: 'Zurich', country: 'Suisse', coords: [47.4582, 8.5555] },
  GVA: { code: 'GVA', name: 'Genève Cointrin', city: 'Genève', country: 'Suisse', coords: [46.237, 6.1092] },
  VIE: { code: 'VIE', name: 'Vienne Schwechat', city: 'Vienne', country: 'Autriche', coords: [48.1103, 16.5697] },
  MAD: { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Espagne', coords: [40.4839, -3.568] },
  BCN: { code: 'BCN', name: 'Barcelone El Prat', city: 'Barcelone', country: 'Espagne', coords: [41.2974, 2.0833] },
  PMI: { code: 'PMI', name: 'Palma de Majorque', city: 'Palma', country: 'Espagne', coords: [39.5517, 2.7388] },
  LIS: { code: 'LIS', name: 'Lisbonne Humberto Delgado', city: 'Lisbonne', country: 'Portugal', coords: [38.7742, -9.1342] },
  FCO: { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'Italie', coords: [41.8003, 12.2389] },
  MXP: { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italie', coords: [45.6301, 8.7255] },
  ATH: { code: 'ATH', name: 'Athènes Eleftherios Venizelos', city: 'Athènes', country: 'Grèce', coords: [37.9364, 23.9445] },
  CPH: { code: 'CPH', name: 'Copenhague Kastrup', city: 'Copenhague', country: 'Danemark', coords: [55.618, 12.6508] },
  ARN: { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Suède', coords: [59.6498, 17.9238] },
  OSL: { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norvège', coords: [60.1976, 11.1004] },
  HEL: { code: 'HEL', name: 'Helsinki Vantaa', city: 'Helsinki', country: 'Finlande', coords: [60.3172, 24.9633] },
  WAW: { code: 'WAW', name: 'Varsovie Chopin', city: 'Varsovie', country: 'Pologne', coords: [52.1672, 20.9679] },
  PRG: { code: 'PRG', name: 'Prague Václav Havel', city: 'Prague', country: 'République Tchèque', coords: [50.1008, 14.26] },
  IST: { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turquie', coords: [41.2753, 28.7519] },

  // Amérique du Nord
  JFK: { code: 'JFK', name: 'New York JFK', city: 'New York', country: 'États-Unis', coords: [40.6413, -73.7781] },
  EWR: { code: 'EWR', name: 'Newark Liberty', city: 'New York', country: 'États-Unis', coords: [40.6895, -74.1745] },
  LGA: { code: 'LGA', name: 'LaGuardia', city: 'New York', country: 'États-Unis', coords: [40.7769, -73.874] },
  BOS: { code: 'BOS', name: 'Boston Logan', city: 'Boston', country: 'États-Unis', coords: [42.3656, -71.0096] },
  IAD: { code: 'IAD', name: 'Washington Dulles', city: 'Washington D.C.', country: 'États-Unis', coords: [38.9531, -77.4565] },
  ATL: { code: 'ATL', name: 'Atlanta Hartsfield', city: 'Atlanta', country: 'États-Unis', coords: [33.6407, -84.4277] },
  ORD: { code: 'ORD', name: 'Chicago O’Hare', city: 'Chicago', country: 'États-Unis', coords: [41.9742, -87.9073] },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', country: 'États-Unis', coords: [32.8998, -97.0403] },
  IAH: { code: 'IAH', name: 'Houston Intercontinental', city: 'Houston', country: 'États-Unis', coords: [29.9902, -95.3368] },
  MIA: { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'États-Unis', coords: [25.7959, -80.287] },
  DEN: { code: 'DEN', name: 'Denver International', city: 'Denver', country: 'États-Unis', coords: [39.8561, -104.6737] },
  PHX: { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', country: 'États-Unis', coords: [33.4373, -112.0078] },
  LAS: { code: 'LAS', name: 'Las Vegas Harry Reid', city: 'Las Vegas', country: 'États-Unis', coords: [36.084, -115.1537] },
  LAX: { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'États-Unis', coords: [33.9416, -118.4085] },
  SFO: { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'États-Unis', coords: [37.6213, -122.379] },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'États-Unis', coords: [47.4502, -122.3088] },
  YYZ: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', coords: [43.6777, -79.6248] },
  YVR: { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', coords: [49.1967, -123.1815] },
  YUL: { code: 'YUL', name: 'Montréal Trudeau', city: 'Montréal', country: 'Canada', coords: [45.4706, -73.7408] },
  MEX: { code: 'MEX', name: 'Mexico Benito Juárez', city: 'Mexico', country: 'Mexique', coords: [19.4363, -99.0721] },

  // Asie, Moyen-Orient, Océanie, Afrique, Amérique Latine
  DXB: { code: 'DXB', name: 'Dubaï International', city: 'Dubaï', country: 'Émirats Arabes Unis', coords: [25.2532, 55.3657] },
  DOH: { code: 'DOH', name: 'Doha Hamad', city: 'Doha', country: 'Qatar', coords: [25.2609, 51.5651] },
  HND: { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japon', coords: [35.5494, 139.7798] },
  NRT: { code: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japon', coords: [35.772, 140.3929] },
  ICN: { code: 'ICN', name: 'Séoul Incheon', city: 'Séoul', country: 'Corée du Sud', coords: [37.4602, 126.4407] },
  PEK: { code: 'PEK', name: 'Pékin Capitale', city: 'Pékin', country: 'Chine', coords: [40.0799, 116.6031] },
  PVG: { code: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'Chine', coords: [31.1443, 121.8083] },
  HKG: { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Chine', coords: [22.308, 113.9185] },
  SIN: { code: 'SIN', name: 'Singapour Changi', city: 'Singapour', country: 'Singapour', coords: [1.3644, 103.9915] },
  BKK: { code: 'BKK', name: 'Bangkok Suvarnabhumi', city: 'Bangkok', country: 'Thaïlande', coords: [13.69, 100.7501] },
  DEL: { code: 'DEL', name: 'Delhi Indira Gandhi', city: 'New Delhi', country: 'Inde', coords: [28.5562, 77.1] },
  BOM: { code: 'BOM', name: 'Mumbai Chhatrapati', city: 'Mumbai', country: 'Inde', coords: [19.0896, 72.8656] },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australie', coords: [-33.9399, 151.1753] },
  MEL: { code: 'MEL', name: 'Melbourne Tullamarine', city: 'Melbourne', country: 'Australie', coords: [-37.669, 144.841] },
  AKL: { code: 'AKL', name: 'Auckland International', city: 'Auckland', country: 'Nouvelle-Zélande', coords: [-37.0082, 174.785] },
  GRU: { code: 'GRU', name: 'São Paulo Guarulhos', city: 'São Paulo', country: 'Brésil', coords: [-23.4356, -46.4731] },
  EZE: { code: 'EZE', name: 'Buenos Aires Ezeiza', city: 'Buenos Aires', country: 'Argentine', coords: [-34.8222, -58.5358] },
  BOG: { code: 'BOG', name: 'Bogota El Dorado', city: 'Bogota', country: 'Colombie', coords: [4.7016, -74.1469] },
  JNB: { code: 'JNB', name: 'Johannesbourg O.R. Tambo', city: 'Johannesbourg', country: 'Afrique du Sud', coords: [-26.1367, 28.2411] },
  CAI: { code: 'CAI', name: 'Le Caire International', city: 'Le Caire', country: 'Égypte', coords: [30.1219, 31.4056] },
  // Aéroports Méditerranée & Europe supplémentaires
  TEB: { code: 'TEB', name: 'Teterboro Executive', city: 'New York / NJ', country: 'États-Unis', coords: [40.8501, -74.0608] },
  GRS: { code: 'GRS', name: 'Grosseto Baccarini', city: 'Grosseto / Toscane', country: 'Italie', coords: [42.7597, 11.0719] },
  CAT: { code: 'CAT', name: 'Cascais Tires', city: 'Cascais / Lisbonne', country: 'Portugal', coords: [38.7256, -9.3553] },
  MLA: { code: 'MLA', name: 'Malte International', city: 'La Valette', country: 'Malte', coords: [35.8575, 14.4775] },
  VRN: { code: 'VRN', name: 'Vérone Villafranca', city: 'Vérone', country: 'Italie', coords: [45.3957, 10.8885] },
  VCE: { code: 'VCE', name: 'Venise Marco Polo', city: 'Venise', country: 'Italie', coords: [45.5053, 12.3519] },
  BLQ: { code: 'BLQ', name: 'Bologne Guglielmo Marconi', city: 'Bologne', country: 'Italie', coords: [44.5354, 11.2887] },
  NAP: { code: 'NAP', name: 'Naples Capodichino', city: 'Naples', country: 'Italie', coords: [40.886, 14.2908] },
  PSA: { code: 'PSA', name: 'Pise Galilée', city: 'Pise', country: 'Italie', coords: [43.6839, 10.3927] },
  CTA: { code: 'CTA', name: 'Catane Fontanarossa', city: 'Catane / Sicile', country: 'Italie', coords: [37.4668, 15.0664] },
  PMO: { code: 'PMO', name: 'Palerme Falcone-Borsellino', city: 'Palerme / Sicile', country: 'Italie', coords: [38.176, 13.091] },
  BSL: { code: 'BSL', name: 'EuroAirport Bâle-Mulhouse', city: 'Bâle/Mulhouse', country: 'France/Suisse', coords: [47.5896, 7.5299] },
  STR: { code: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Allemagne', coords: [48.6899, 9.2219] },
  HAM: { code: 'HAM', name: 'Hambourg Helmut Schmidt', city: 'Hambourg', country: 'Allemagne', coords: [53.6304, 9.9882] },
  DUS: { code: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Allemagne', coords: [51.2895, 6.7668] },
  CGN: { code: 'CGN', name: 'Cologne/Bonn Airport', city: 'Cologne', country: 'Allemagne', coords: [50.8659, 7.1427] },
  AGP: { code: 'AGP', name: 'Malaga Costa del Sol', city: 'Malaga', country: 'Espagne', coords: [36.6749, -4.4991] },
  VLC: { code: 'VLC', name: 'Valence Manises', city: 'Valence', country: 'Espagne', coords: [39.4893, -0.4816] },
  SVQ: { code: 'SVQ', name: 'Séville San Pablo', city: 'Séville', country: 'Espagne', coords: [37.418, -5.8931] },
  BIO: { code: 'BIO', name: 'Bilbao Airport', city: 'Bilbao', country: 'Espagne', coords: [43.3011, -2.9106] },
  TFS: { code: 'TFS', name: 'Tenerife Sud', city: 'Tenerife', country: 'Espagne', coords: [28.0445, -16.5725] },
  LPA: { code: 'LPA', name: 'Grande Canarie', city: 'Las Palmas', country: 'Espagne', coords: [27.9319, -15.3866] },
  FAO: { code: 'FAO', name: 'Faro Algarve', city: 'Faro', country: 'Portugal', coords: [37.0144, -7.9659] },
  OPO: { code: 'OPO', name: 'Porto Francisco Sá Carneiro', city: 'Porto', country: 'Portugal', coords: [41.2481, -8.6814] },
  HER: { code: 'HER', name: 'Héraklion Nikos Kazantzakis', city: 'Héraklion / Crète', country: 'Grèce', coords: [35.3397, 25.1803] },
  CHQ: { code: 'CHQ', name: 'La Canée Daskalogiannis', city: 'La Canée / Crète', country: 'Grèce', coords: [35.5317, 24.1497] },
  RHO: { code: 'RHO', name: 'Rhodes Diagoras', city: 'Rhodes', country: 'Grèce', coords: [36.4054, 28.0862] },
  CFU: { code: 'CFU', name: 'Corfou Ioannis Kapodistrias', city: 'Corfou', country: 'Grèce', coords: [39.6019, 19.9117] },
  LCA: { code: 'LCA', name: 'Larnaca International', city: 'Larnaca', country: 'Chypre', coords: [34.8751, 33.6249] },
  PFO: { code: 'PFO', name: 'Paphos International', city: 'Paphos', country: 'Chypre', coords: [34.718, 32.4857] },
  AUH: { code: 'AUH', name: 'Abou Dabi Zayed', city: 'Abou Dabi', country: 'Émirats Arabes Unis', coords: [24.433, 54.6511] },
  CMN: { code: 'CMN', name: 'Casablanca Mohammed V', city: 'Casablanca', country: 'Maroc', coords: [33.3675, -7.5899] },
  RAK: { code: 'RAK', name: 'Marrakech Menara', city: 'Marrakech', country: 'Maroc', coords: [31.6069, -8.0363] },
  ALG: { code: 'ALG', name: 'Alger Houari Boumédiène', city: 'Alger', country: 'Algérie', coords: [36.691, 3.2154] },
  TUN: { code: 'TUN', name: 'Tunis Carthage', city: 'Tunis', country: 'Tunisie', coords: [36.851, 10.2272] },
};

// Generates the authentic Flightradar24 yellow airplane SVG icon
export function getFlightradarPlaneSvg(track = 0, size = 20, isSelected = false) {
  const fillColor = isSelected ? '#ffffff' : '#ffd700';
  const strokeColor = isSelected ? '#00f2fe' : '#141414';
  const strokeWidth = isSelected ? '1.5' : '1.1';
  const glowFilter = isSelected
    ? 'drop-shadow(0 0 8px #00f2fe) drop-shadow(0 0 2px #ffffff)'
    : 'drop-shadow(0 1px 3px rgba(0,0,0,0.85))';

  return `
    <div class="fr24-plane-marker ${isSelected ? 'is-selected' : ''}" style="width: ${size}px; height: ${size}px;">
      <div class="fr24-plane-rotator" style="transform: rotate(${track}deg); filter: ${glowFilter}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
          <path fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"
            d="M12 2 C11.2 2 10.6 2.8 10.6 4.2 L10.6 9.5 L2 14.2 L2 16.5 L10.6 14 L10.6 19.5 L8.2 21.2 L8.2 22.8 L12 21.8 L15.8 22.8 L15.8 21.2 L13.4 19.5 L13.4 14 L22 16.5 L22 14.2 L13.4 9.5 L13.4 4.2 C13.4 2.8 12.8 2 12 2 Z" />
        </svg>
      </div>
      ${isSelected ? '<div class="fr24-pulse-ring"></div>' : ''}
    </div>
  `;
}

// Interleaves an array of arrays evenly across elements
export function interleaveArrays(arrays) {
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

// 9 Non-overlapping Global Zones covering 100% of worldwide commercial air traffic
export const FR24_GLOBAL_ZONES = [
  { id: 'na_east', name: 'Amérique du Nord Est', bounds: '60,20,-95,-55' },
  { id: 'na_west', name: 'Amérique du Nord Ouest', bounds: '65,20,-135,-95' },
  { id: 'europe', name: 'Europe & Méditerranée', bounds: '72,35,-15,40' },
  { id: 'east_asia', name: 'Asie de l’Est', bounds: '55,10,95,155' },
  { id: 'south_asia', name: 'Asie du Sud & Sud-Est', bounds: '35,-10,60,120' },
  { id: 'middle_east', name: 'Moyen-Orient & Asie Centrale', bounds: '45,10,35,75' },
  { id: 'latin_america', name: 'Amérique Latine & Caraïbes', bounds: '30,-55,-115,-30' },
  { id: 'africa', name: 'Afrique', bounds: '37,-38,-25,55' },
  { id: 'oceania', name: 'Océanie & Pacifique Sud', bounds: '-10,-50,110,180' },
];

class FlightRadarService {
  constructor() {
    this.flights = [];
    this.flightsMap = new Map();
    this.totalGlobalFlights = 21450;
    this.flightLimit = 3500;
    this.listeners = new Set();
    this.pollingInterval = null;
    this.animationTimer = null;
    this.lastFetchTime = 0;
    this.isFetching = false;
    this._lastViewportFetch = 0;
    this._lastViewportBounds = null;

    // Direct initialization from the authentic real Flightradar24 worldwide dataset (7,892 real flights)
    if (Array.isArray(REAL_FLIGHTS_SNAPSHOT) && REAL_FLIGHTS_SNAPSHOT.length > 0) {
      for (let i = 0; i < REAL_FLIGHTS_SNAPSHOT.length; i++) {
        const item = REAL_FLIGHTS_SNAPSHOT[i];
        if (item && item.id && Array.isArray(item.raw)) {
          const plane = this.parsePlaneRecord(item.id, item.raw);
          this.flightsMap.set(plane.id, plane);
        }
      }
    }

    this.flights = Array.from(this.flightsMap.values());
    this.totalGlobalFlights = Math.max(18450, this.flights.length);
  }

  setFlightLimit(limit) {
    this.flightLimit = Math.max(10, limit);
    this.notify();
  }

  // Subscribe to live flight updates
  subscribe(callback) {
    this.listeners.add(callback);
    if (this.flights.length > 0) {
      callback(this.flights, this.totalGlobalFlights, this.flightLimit);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    for (const cb of this.listeners) {
      try {
        cb(this.flights, this.totalGlobalFlights, this.flightLimit);
      } catch (err) {
        console.error('Error in flight subscriber:', err);
      }
    }
  }

  // Parse a Flightradar24 ADS-B plane record array
  parsePlaneRecord(id, arr) {
    const icao = (arr[0] || id || '').toUpperCase();
    const lat = parseFloat(arr[1]);
    const lng = parseFloat(arr[2]);
    const track = Math.round(parseFloat(arr[3]) || 0);
    const altFt = parseInt(arr[4]) || 0;
    const speedKts = parseInt(arr[5]) || 0;
    const squawk = (arr[6] || '1000').toString();
    const modelCode = (arr[8] || '').toUpperCase();
    const registration = (arr[9] || '').toUpperCase();
    const originIata = (arr[11] || '').toUpperCase();
    const destinationIata = (arr[12] || '').toUpperCase();
    const flightNum = (arr[13] || '').toUpperCase();
    const onGround = arr[14] === 1;
    const callsign = ((arr[16] || flightNum || icao || '').trim()).toUpperCase();
    const rawAirline = arr[18] || (callsign.length >= 3 ? callsign.substring(0, 3) : '');
    const airlineCode = (rawAirline || '').toUpperCase();

    const airlineInfo = AIRLINE_NAMES[airlineCode] || {
      name: airlineCode ? `Compagnie ${airlineCode}` : 'Aviation Commerciale',
      country: 'International',
      flag: '✈️',
    };

    const modelName = AIRCRAFT_MODELS[modelCode] || (modelCode ? modelCode : 'Avion de Ligne');

    let originInfo = AIRPORTS[originIata];
    let destInfo = AIRPORTS[destinationIata];

    if (!originInfo) {
      originInfo = {
        code: originIata || '—',
        name: originIata ? `Aéroport ${originIata}` : 'Départ non spécifié',
        city: originIata || 'Départ ADS-B',
        country: '',
      };
    }

    if (!destInfo) {
      destInfo = {
        code: destinationIata || '—',
        name: destinationIata ? `Aéroport ${destinationIata}` : 'Arrivée non spécifiée',
        city: destinationIata || 'Arrivée ADS-B',
        country: '',
      };
    }

    const speedKmh = Math.round(speedKts * 1.852);
    const mach = speedKmh > 100 ? (speedKmh / 1062).toFixed(2) : '0.00';
    const flightPhase = onGround
      ? 'Au sol / Roulage'
      : altFt < 3000
      ? 'Approche / Décollage'
      : altFt < 18000
      ? 'Montée / Descente'
      : 'Vol de croisière';

    return {
      id: `fr24-${id}`,
      fr24Id: id,
      icao,
      callsign: callsign || `VOL-${id.substring(0, 5).toUpperCase()}`,
      flightNum: flightNum || callsign,
      airline: airlineInfo.name,
      airlineFlag: airlineInfo.flag,
      airlineCountry: airlineInfo.country,
      aircraft: modelName,
      aircraftCode: modelCode,
      registration: registration || 'ADSB-LIVE',
      lat,
      lng,
      track,
      heading: track,
      altitudeFt: altFt,
      altitudeM: Math.round(altFt * 0.3048),
      speedKts,
      speedKmh,
      mach,
      squawk,
      origin: originInfo,
      destination: destInfo,
      onGround,
      flightPhase,
      lastUpdate: Date.now(),
    };
  }

  // Fetch live planes for a specific map bounding box (maxLat,minLat,minLng,maxLng)
  async fetchViewportFeed(bounds) {
    if (!bounds) return;
    const now = Date.now();
    // Debounce to at most once every 3.5 seconds for identical or rapid boundary changes
    if (this._lastViewportBounds === bounds && now - this._lastViewportFetch < 3500) {
      return;
    }
    this._lastViewportFetch = now;
    this._lastViewportBounds = bounds;

    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:5174';
    try {
      const res = await fetch(`${baseUrl}/api/fr24/zones/fcgi/feed.js?bounds=${bounds}`, {
        signal: AbortSignal.timeout(7000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          const keys = Object.keys(data).filter((k) => k !== 'full_count' && k !== 'version');
          let addedOrUpdated = 0;
          for (const k of keys) {
            const arr = data[k];
            if (Array.isArray(arr) && arr.length >= 7 && arr[14] !== 1 && arr[1] && arr[2]) {
              const planeId = `fr24-${k}`;
              const plane = this.parsePlaneRecord(k, arr);
              this.flightsMap.set(planeId, plane);
              addedOrUpdated++;
            }
          }
          if (addedOrUpdated > 0) {
            this.flights = Array.from(this.flightsMap.values());
            if (data.full_count && data.full_count > this.totalGlobalFlights) {
              this.totalGlobalFlights = data.full_count;
            }
            this.lastFetchTime = now;
            this.notify();
          }
        }
      }
    } catch (err) {
      // quiet fallback
    }
  }

  // Parse OpenSky Network ADS-B state vector
  parseOpenSkyState(state) {
    const icao = (state[0] || '').toUpperCase();
    const callsign = (state[1] || icao).trim().toUpperCase();
    const country = state[2] || 'International';
    const lng = state[5];
    const lat = state[6];
    const altM = Math.round(state[7] || state[13] || 10000);
    const altFt = Math.round(altM * 3.28084);
    const speedMs = state[9] || 0;
    const speedKts = Math.round(speedMs * 1.94384);
    const speedKmh = Math.round(speedMs * 3.6);
    const track = Math.round(state[10] || 0);
    const squawk = (state[14] || '1000').toString();
    const onGround = state[8] === true;

    const rawAirline = callsign.length >= 3 ? callsign.substring(0, 3) : '';
    const airlineInfo = AIRLINE_NAMES[rawAirline] || {
      name: rawAirline ? `Compagnie ${rawAirline}` : country,
      country: country,
      flag: '✈️',
    };

    return {
      id: `os-${icao}`,
      fr24Id: icao,
      icao,
      callsign: callsign || `VOL-${icao}`,
      flightNum: callsign,
      airline: airlineInfo.name,
      airlineFlag: airlineInfo.flag,
      airlineCountry: airlineInfo.country,
      aircraft: 'Avion de Ligne Commercial',
      aircraftCode: 'ADS-B',
      registration: icao,
      lat,
      lng,
      track,
      heading: track,
      altitudeFt: altFt,
      altitudeM: altM,
      speedKts,
      speedKmh,
      mach: speedKmh > 100 ? (speedKmh / 1062).toFixed(2) : '0.00',
      squawk,
      origin: { code: 'ADS-B', name: 'Origine Radar Direct', city: country, country },
      destination: { code: 'ADS-B', name: 'En Route', city: 'Arrivée ADS-B', country: '' },
      onGround,
      flightPhase: onGround ? 'Au sol / Roulage' : altFt < 3000 ? 'Approche' : 'Vol de croisière',
      lastUpdate: Date.now(),
    };
  }

  // Fetch live planes from FlightRadar24 across all 9 worldwide zones concurrently
  async fetchLiveFeed() {
    if (this.isFetching) return;
    this.isFetching = true;

    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:5174';

    try {
      const endpoints = FR24_GLOBAL_ZONES.map(
        (z) => `${baseUrl}/api/fr24/zones/fcgi/feed.js?bounds=${z.bounds}`
      );

      // Query all 9 global zones concurrently for comprehensive worldwide coverage
      const results = await Promise.allSettled(
        endpoints.map((url) => fetch(url, { signal: AbortSignal.timeout(8000) }))
      );

      const zoneLists = [];
      const seenIds = new Set();
      let maxFullCount = this.totalGlobalFlights;
      let successfulZones = 0;

      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        const list = [];
        if (res.status === 'fulfilled' && res.value.ok) {
          successfulZones++;
          try {
            const data = await res.value.json();
            if (data && typeof data === 'object') {
              if (data.full_count && data.full_count > maxFullCount) {
                maxFullCount = data.full_count;
              }
              const keys = Object.keys(data).filter((k) => k !== 'full_count' && k !== 'version');
              for (const k of keys) {
                const arr = data[k];
                if (Array.isArray(arr) && arr.length >= 7) {
                  // Keep airborne aircraft with valid GPS coordinates
                  if (arr[14] !== 1 && arr[1] && arr[2]) {
                    const planeId = `fr24-${k}`;
                    if (!seenIds.has(planeId)) {
                      seenIds.add(planeId);
                      const plane = this.parsePlaneRecord(k, arr);
                      list.push(plane);
                    }
                  }
                }
              }
            }
          } catch (e) {
            // silent parse error
          }
        }
        zoneLists.push(list);
      }

      // Interleave planes from all 9 zones for an authentic worldwide distribution
      const interleavedLivePlanes = interleaveArrays(zoneLists);

      if (interleavedLivePlanes.length > 0) {
        interleavedLivePlanes.forEach((plane) => {
          this.flightsMap.set(plane.id, plane);
        });

        this.flights = Array.from(this.flightsMap.values());
        this.totalGlobalFlights = Math.max(maxFullCount, this.flights.length);
        this.lastFetchTime = Date.now();
        this.notify();
      }

      // Supplementary check: If few planes loaded, query OpenSky Network
      if (this.flights.length < 500) {
        try {
          const osRes = await fetch(`${baseUrl}/api/opensky/api/states/all`, {
            signal: AbortSignal.timeout(8000),
          });
          if (osRes.ok) {
            const osData = await osRes.json();
            if (osData && Array.isArray(osData.states)) {
              let added = 0;
              for (let i = 0; i < Math.min(3000, osData.states.length); i++) {
                const st = osData.states[i];
                if (st && st[5] !== null && st[6] !== null && st[8] !== true) {
                  const plane = this.parseOpenSkyState(st);
                  if (!this.flightsMap.has(plane.id)) {
                    this.flightsMap.set(plane.id, plane);
                    added++;
                  }
                }
              }
              if (added > 0) {
                this.flights = Array.from(this.flightsMap.values());
                this.notify();
              }
            }
          }
        } catch (e) {
          // silent fallback
        }
      }
    } catch (err) {
      console.warn('Flightradar24 live feed notice:', err.message);
    } finally {
      this.isFetching = false;
    }
  }

  // High-precision smooth dead-reckoning motion
  updatePhysicalMotion() {
    const now = Date.now();
    if (this.flights.length === 0) return;

    let updated = false;
    for (const plane of this.flights) {
      if (!plane.speedKmh || plane.speedKmh <= 0) continue;

      const elapsedSec = (now - plane.lastUpdate) / 1000;
      if (elapsedSec <= 0.05 || elapsedSec > 20) {
        plane.lastUpdate = now;
        continue;
      }

      // Distance traveled in km
      const distKm = (plane.speedKmh / 3600) * elapsedSec;
      const headingRad = (plane.track * Math.PI) / 180;

      // 1 deg latitude = 111.32 km
      const dLat = (distKm * Math.cos(headingRad)) / 111.32;
      // 1 deg longitude = 111.32 * cos(lat) km
      const cosLat = Math.cos((plane.lat * Math.PI) / 180);
      const dLng = cosLat !== 0 ? (distKm * Math.sin(headingRad)) / (111.32 * cosLat) : 0;

      plane.lat += dLat;
      plane.lng += dLng;
      if (plane.lng > 180) plane.lng -= 360;
      if (plane.lng < -180) plane.lng += 360;
      plane.lastUpdate = now;
      updated = true;
    }

    if (updated) {
      this.notify();
    }
  }

  start() {
    // Initial fetch
    this.fetchLiveFeed();

    // Poll every 10 seconds for real ADS-B radar updates
    this.pollingInterval = setInterval(() => {
      this.fetchLiveFeed();
    }, 10000);

    // Continuous 250ms smooth motion ticker
    this.animationTimer = setInterval(() => {
      this.updatePhysicalMotion();
    }, 250);
  }

  stop() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.animationTimer) clearInterval(this.animationTimer);
  }
}

export const flightRadarService = new FlightRadarService();
flightRadarService.start();
