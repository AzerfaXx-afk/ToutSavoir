// Tactical Global Streams: Aviation Routes, Cyber Attacks, and Geopolitical Conflict Zones

// 1. Major Global Aviation Corridors (Hub-to-Hub)
export const AVIATION_ROUTES = [
  // Transatlantic
  { id: 'fl-1', origin: 'Paris (CDG)', dest: 'New York (JFK)', from: [49.0097, 2.5479], to: [40.6413, -73.7781], code: 'AF022', airline: 'Air France', alt: '10 600 m' },
  { id: 'fl-2', origin: 'Londres (LHR)', dest: 'Los Angeles (LAX)', from: [51.4700, -0.4543], to: [33.9416, -118.4085], code: 'BA281', airline: 'British Airways', alt: '11 200 m' },
  { id: 'fl-3', origin: 'Francfort (FRA)', dest: 'Singapour (SIN)', from: [50.0379, 8.5622], to: [1.3644, 103.9915], code: 'LH778', airline: 'Lufthansa', alt: '11 800 m' },
  // Transpacific
  { id: 'fl-4', origin: 'Tokyo (HND)', dest: 'San Francisco (SFO)', from: [35.5494, 139.7798], to: [37.6213, -122.3790], code: 'NH008', airline: 'ANA', alt: '10 900 m' },
  { id: 'fl-5', origin: 'Séoul (ICN)', dest: 'Seattle (SEA)', from: [37.4602, 126.4407], to: [47.4502, -122.3088], code: 'KE041', airline: 'Korean Air', alt: '11 500 m' },
  // Middle East Crossroads
  { id: 'fl-6', origin: 'Dubaï (DXB)', dest: 'Sydney (SYD)', from: [25.2532, 55.3657], to: [-33.9399, 151.1753], code: 'EK414', airline: 'Emirates', alt: '12 100 m' },
  { id: 'fl-7', origin: 'Doha (DOH)', dest: 'São Paulo (GRU)', from: [25.2609, 51.5651], to: [-23.4356, -46.4731], code: 'QR773', airline: 'Qatar Airways', alt: '11 000 m' },
  // Asia - Europe
  { id: 'fl-8', origin: 'Pékin (PEK)', dest: 'Amsterdam (AMS)', from: [40.0799, 116.6031], to: [52.3105, 4.7683], code: 'KL898', airline: 'KLM', alt: '10 800 m' },
  { id: 'fl-9', origin: 'Hong Kong (HKG)', dest: 'Londres (LHR)', from: [22.3080, 113.9185], to: [51.4700, -0.4543], code: 'CX251', airline: 'Cathay Pacific', alt: '11 400 m' },
  // Intra Europe & Americas
  { id: 'fl-10', origin: 'Rome (FCO)', dest: 'Madrid (MAD)', from: [41.8003, 12.2389], to: [40.4839, -3.5680], code: 'IB325', airline: 'Iberia', alt: '9 800 m' },
  { id: 'fl-11', origin: 'Chicago (ORD)', dest: 'Miami (MIA)', from: [41.9742, -87.9073], to: [25.7959, -80.2870], code: 'AA1140', airline: 'American Airlines', alt: '10 200 m' },
  { id: 'fl-12', origin: 'Johannesburg (JNB)', dest: 'Le Caire (CAI)', from: [-26.1367, 28.2411], to: [30.1219, 31.4056], code: 'MS840', airline: 'EgyptAir', alt: '11 300 m' },
];

// 2. Real-time Cyber Attack Simulation Nodes (Source -> Target Vectors)
export const CYBER_ATTACK_VECTORS = [
  { id: 'cy-1', fromCountry: 'Russie', fromCity: 'Moscou', from: [55.7558, 37.6173], toCountry: 'États-Unis', toCity: 'Washington DC', to: [38.9072, -77.0369], type: 'DDoS SYN Flood', port: 443, severity: 'HIGH' },
  { id: 'cy-2', fromCountry: 'Chine', fromCity: 'Shanghai', from: [31.2304, 121.4737], toCountry: 'Allemagne', toCity: 'Francfort', to: [50.1109, 8.6821], type: 'Zero-Day Exploit', port: 8080, severity: 'CRITICAL' },
  { id: 'cy-3', fromCountry: 'Corée du Nord', fromCity: 'Pyongyang', from: [39.0392, 125.7625], toCountry: 'Japon', toCity: 'Tokyo', to: [35.6762, 139.6503], type: 'Crypto Ransomware', port: 445, severity: 'CRITICAL' },
  { id: 'cy-4', fromCountry: 'Iran', fromCity: 'Téhéran', from: [35.6892, 51.3890], toCountry: 'Arabie Saoudite', toCity: 'Riyad', to: [24.7136, 46.6753], type: 'SCADA Manipulation', port: 502, severity: 'HIGH' },
  { id: 'cy-5', fromCountry: 'États-Unis', fromCity: 'San Jose', from: [37.3382, -121.8863], toCountry: 'Brésil', toCity: 'São Paulo', to: [-23.5505, -46.6333], type: 'BGP Hijacking Probe', port: 179, severity: 'MEDIUM' },
  { id: 'cy-6', fromCountry: 'Brésil', fromCity: 'Rio de Janeiro', from: [-22.9068, -43.1729], toCountry: 'France', toCity: 'Paris', to: [48.8566, 2.3522], type: 'Credential Stuffing', port: 80, severity: 'LOW' },
  { id: 'cy-7', fromCountry: 'Inde', fromCity: 'Bangalore', from: [12.9716, 77.5946], toCountry: 'Royaume-Uni', toCity: 'Londres', to: [51.5074, -0.1278], type: 'API Botnet Sweep', port: 8443, severity: 'MEDIUM' },
  { id: 'cy-8', fromCountry: 'Vietnam', fromCity: 'Hanoï', from: [21.0285, 105.8542], toCountry: 'Corée du Sud', toCity: 'Séoul', to: [37.5665, 126.9780], type: 'DNS Amplification', port: 53, severity: 'HIGH' },
];

// 3. Geopolitical Hotspots & Active Conflict Watch
export const GEOPOLITICAL_ZONES = [
  { id: 'geo-1', name: 'Front Oriental Européen', region: 'Ukraine', lat: 48.3794, lng: 31.1656, status: 'ZONE DE CONFLIT ACTIF', defcon: 'DÉFCON 2', alert: 'Surveillance frappes et artillerie' },
  { id: 'geo-2', name: 'Détroit de Taïwan', region: 'Mer de Chine', lat: 24.2877, lng: 119.5447, status: 'TENSION AÉRONAVALE ÉLEVÉE', defcon: 'DÉFCON 3', alert: 'Patrouilles aériennes et blocus d’exercice' },
  { id: 'geo-3', name: 'Moyen-Orient & Levant', region: 'Levant', lat: 32.4279, lng: 35.3449, status: 'ALERTE BALISTIQUE ACTIVE', defcon: 'DÉFCON 2', alert: 'Interceptions antimissiles Dôme de Fer' },
  { id: 'geo-4', name: 'Bāb al-Mandab & Mer Rouge', region: 'Yémen / Mer Rouge', lat: 12.5833, lng: 43.3333, status: 'MENACE MARITIME COMMERCIALE', defcon: 'DÉFCON 3', alert: 'Tirs de drones anti-navires et missiles côtiers' },
  { id: 'geo-5', name: 'Péninsule Coréenne (DMZ)', region: 'DMZ 38e parallèle', lat: 37.9555, lng: 126.6713, status: 'LIGNE DE DÉMARCATION EN ALERTE', defcon: 'DÉFCON 3', alert: 'Essais de vecteurs balistiques hypersoniques' },
  { id: 'geo-6', name: 'Bande Sahélienne', region: 'Sahel', lat: 14.4974, lng: -4.1999, status: 'OPÉRATIONS CONTRE-INSURRECTION', defcon: 'DÉFCON 4', alert: 'Mouvements asymétriques et mercenaires' },
];
