// Data model for CHRONOS-TERRA // AEGIS Global Intelligence

export const TIMELINE_ERAS = [
  { year: 1991, label: "Dissolution URSS", type: "history", risk: "Élevé", pop: 5360000000, milSpend: 980000000000 },
  { year: 1999, label: "Guerre du Kosovo", type: "history", risk: "Modéré", pop: 6040000000, milSpend: 1040000000000 },
  { year: 2003, label: "Invasion de l'Irak", type: "history", risk: "Critique", pop: 6380000000, milSpend: 1250000000000 },
  { year: 2011, label: "Printemps Arabe", type: "history", risk: "Élevé", pop: 7040000000, milSpend: 1740000000000 },
  { year: 2014, label: "Annexion Crimée", type: "history", risk: "Élevé", pop: 7290000000, milSpend: 1780000000000 },
  { year: 2020, label: "Pandémie Globale", type: "history", risk: "Majeur", pop: 7840000000, milSpend: 1980000000000 },
  { year: 2022, label: "Guerre en Ukraine", type: "history", risk: "Critique", pop: 7975000000, milSpend: 2240000000000 },
  { year: 2024, label: "Tensions Moyen-Orient", type: "history", risk: "Critique", pop: 8118000000, milSpend: 2440000000000 },
  { year: 2026, label: "AUJOURD'HUI (LIVE)", type: "live", risk: "DÉFCON 2", pop: 8185420000, milSpend: 2520000000000 },
  { year: 2030, label: "IA de Défense Autonome", type: "future", risk: "Simulation", pop: 8540000000, milSpend: 2850000000000 },
  { year: 2035, label: "Crise des Chokepoints", type: "future", risk: "Simulation", pop: 8890000000, milSpend: 3200000000000 },
  { year: 2045, label: "Tipping Point Climatique", type: "future", risk: "Extrême", pop: 9450000000, milSpend: 3950000000000 },
];

export const HOTSPOTS = [
  {
    id: "kyiv",
    name: "Front Ukrainien / Donbas",
    lat: 48.3794,
    lng: 37.5,
    type: "conflict",
    level: "CRITIQUE",
    status: "Frappes actives & défense sol-air",
    casualties: "420k+ cumulés",
    activeMissiles: 4,
    lastUpdate: "Il y a 3 min",
    details: "Alertes balistiques déclenchées dans les oblasts de Kharkiv, Donetsk et Zaporijjia."
  },
  {
    id: "taiwan",
    name: "Détroit de Taïwan",
    lat: 24.1,
    lng: 120.5,
    type: "tensions",
    level: "ÉLEVÉ",
    status: "Manœuvres aéronavales majeures",
    activeMissiles: 0,
    lastUpdate: "Il y a 12 min",
    details: "34 aéronefs et 9 navires détectés franchissant la ligne médiane."
  },
  {
    id: "redsea",
    name: "Mer Rouge / Bab el-Mandeb",
    lat: 13.2,
    lng: 43.1,
    type: "conflict",
    level: "CRITIQUE",
    status: "Drones antinavires & missiles balistiques",
    activeMissiles: 2,
    lastUpdate: "Il y a 18 min",
    details: "Tir balistique repéré depuis la région d'Al-Hodeïda intercepté par destroyer US."
  },
  {
    id: "korea",
    name: "Péninsule Coréenne",
    lat: 39.5,
    lng: 127.5,
    type: "missile",
    level: "SURVEILLANCE",
    status: "Tir balistique sous-marin d'essai",
    activeMissiles: 1,
    lastUpdate: "Il y a 44 min",
    details: "Trajectoire hypersonique détectée en mer du Japon, altitude max 620 km."
  },
  {
    id: "gaza",
    name: "Moyen-Orient / Levant",
    lat: 31.8,
    lng: 34.8,
    type: "conflict",
    level: "CRITIQUE",
    status: "Défense aérienne multicouche active",
    activeMissiles: 5,
    lastUpdate: "Il y a 8 min",
    details: "Dôme de fer et Arrow-3 en alerte maximale après tirs de roquettes."
  },
  {
    id: "sahel",
    name: "Zone des Trois Frontières (Sahel)",
    lat: 14.5,
    lng: 1.2,
    type: "conflict",
    level: "ÉLEVÉ",
    status: "Opérations de contre-insurrection",
    activeMissiles: 0,
    lastUpdate: "Il y a 2h",
    details: "Escarmouches armées signalées dans le secteur de Tillabéri."
  },
  {
    id: "hormuz",
    name: "Détroit d'Ormuz",
    lat: 26.56,
    lng: 56.25,
    type: "maritime",
    level: "TENSION",
    status: "Brouillage GPS et surveillance côtière",
    activeMissiles: 0,
    lastUpdate: "Il y a 31 min",
    details: "Anomalies AIS massives détectées sur les pétroliers en transit."
  }
];

export const TRAJECTORY_ARCS = [
  {
    id: "arc-ukraine",
    name: "Vecteur balistique sol-sol Iskander",
    startLat: 51.5,
    startLng: 38.0,
    endLat: 48.5,
    endLng: 35.0,
    type: "missile",
    color: "#ff3366",
    status: "Interception terminale par PAC-3"
  },
  {
    id: "arc-redsea",
    name: "Missile balistique anti-navire",
    startLat: 15.3,
    startLng: 44.2,
    endLat: 12.8,
    endLng: 43.3,
    type: "missile",
    color: "#ff9900",
    status: "Engagé par missile SM-2"
  },
  {
    id: "arc-korea",
    name: "Test balistique moyenne portée",
    startLat: 39.0,
    startLng: 125.7,
    endLat: 41.2,
    endLng: 135.0,
    type: "missile",
    color: "#ff3366",
    status: "Vol balistique sous surveillance NORAD"
  },
  {
    id: "arc-patrol-nato",
    name: "Pont de patrouille stratégique OTAN",
    startLat: 51.0,
    startLng: 2.5,
    endLat: 52.2,
    endLng: 21.0,
    type: "recon",
    color: "#00e5ff",
    status: "Surveillance aérienne permanente AWACS"
  }
];

export const COUNTRIES_TELEMETRY = {
  FR: {
    name: "France",
    capital: "Paris",
    defcon: "Vigipirate Urgence",
    riskIndex: "MODÉRÉ (3.2/10)",
    pop: "68,4 Millions",
    milBudget: "47,2 Md$ (+7.5%)",
    nukes: "290 têtes actives",
    activeAlerts: 1,
    status: "Forces projetées en alerte OTAN"
  },
  UA: {
    name: "Ukraine",
    capital: "Kyiv",
    defcon: "DÉFCON 1",
    riskIndex: "CRITIQUE (9.8/10)",
    pop: "37,8 Millions",
    milBudget: "44,0 Md$ (33% PIB)",
    nukes: "0 (Dénucléarisé)",
    activeAlerts: 14,
    status: "État de guerre total / Défense active"
  },
  US: {
    name: "États-Unis",
    capital: "Washington D.C.",
    defcon: "DÉFCON 3",
    riskIndex: "MODÉRÉ (4.1/10)",
    pop: "341,2 Millions",
    milBudget: "886,0 Md$",
    nukes: "5 244 têtes",
    activeAlerts: 4,
    status: "Surveillance mondiale / Commandement CENTCOM & INDOPACOM"
  },
  RU: {
    name: "Russie",
    capital: "Moscou",
    defcon: "ALERTE COMBAT",
    riskIndex: "CRITIQUE (9.4/10)",
    pop: "143,8 Millions",
    milBudget: "140,0 Md$ (6.0% PIB)",
    nukes: "5 580 têtes",
    activeAlerts: 11,
    status: "Forces nucléaires stratégiques en alerte"
  },
  CN: {
    name: "Chine",
    capital: "Pékin",
    defcon: "ALERTE HAUTE",
    riskIndex: "ÉLEVÉ (7.5/10)",
    pop: "1,409 Milliard",
    milBudget: "296,0 Md$",
    nukes: "500 têtes (+20%/an)",
    activeAlerts: 6,
    status: "Exercices d'encerclement en mer de Chine"
  },
  TW: {
    name: "Taïwan",
    capital: "Taipei",
    defcon: "ALERTE RENFORCÉE",
    riskIndex: "ÉLEVÉ (8.1/10)",
    pop: "23,9 Millions",
    milBudget: "19,0 Md$",
    nukes: "0",
    activeAlerts: 5,
    status: "Préparation défense asymétrique"
  },
  IL: {
    name: "Israël",
    capital: "Jérusalem",
    defcon: "DÉFCON 1",
    riskIndex: "CRITIQUE (9.6/10)",
    pop: "9,9 Millions",
    milBudget: "27,5 Md$",
    nukes: "90 têtes (non déclaré)",
    activeAlerts: 9,
    status: "Dôme de fer & Arrow-3 engagés"
  }
};

export const LIVE_BULLETINS = [
  {
    id: "b-1",
    time: "19:14:02 UTC",
    tag: "BALISTIQUE",
    level: "CRITIQUE",
    title: "Tir balistique intercepté",
    text: "Batterie Patriot PAC-3 engage un vecteur de classe Iskander au nord de Dnipro.",
    origin: "Kyiv Radar Air Command"
  },
  {
    id: "b-2",
    time: "19:11:45 UTC",
    tag: "MARITIME",
    level: "ALERTE",
    title: "Alerte de brouillage GNSS en Mer Noire",
    text: "Perturbation totale du signal GPS L1/L2 sur 180 km autour de Sébastopol.",
    origin: "EUNAVFOR Telemetry"
  },
  {
    id: "b-3",
    time: "19:08:20 UTC",
    tag: "SÉISME",
    level: "NATURE",
    title: "Séisme M 6.1 - Ceinture de Feu",
    text: "Épicentre situé à 42 km au large d'Honshu (Japon), profondeur 32 km. Aucune alerte tsunami.",
    origin: "USGS Global Hazards"
  },
  {
    id: "b-4",
    time: "19:04:10 UTC",
    tag: "THERMIQUE",
    level: "NASA",
    title: "Cluster de points chauds détecté",
    text: "Capteur satellite VIIRS repère 14 anomalies thermiques anormales dans l'est syrien.",
    origin: "NASA FIRMS Rapid Response"
  },
  {
    id: "b-5",
    time: "18:58:30 UTC",
    tag: "AÉRONAVAL",
    level: "SURVEILLANCE",
    title: "Vol de reconnaissance RC-135V",
    text: "Aéronef de renseignement électromagnétique en orbite d'écoute au-dessus du delta du Danube.",
    origin: "OpenSky ADS-B Feed"
  }
];
