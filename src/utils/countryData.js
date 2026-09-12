// Geographic utilities: French translations, official area reference, and geodesic polygon area calculation

export const TERRITORY_NAMES_FR = {
  'Reunion': 'La Réunion',
  'Corsica': 'Corse',
  'Guadeloupe': 'Guadeloupe',
  'Martinique': 'Martinique',
  'Mayotte': 'Mayotte',
  'French Guiana': 'Guyane française',
  'Fr. Polynesia': 'Polynésie française',
  'New Caledonia': 'Nouvelle-Calédonie',
  'Greenland': 'Groenland',
  'Puerto Rico': 'Porto Rico',
  'Canary Is.': 'Îles Canaries',
  'Azores': 'Açores',
  'Madeira': 'Madère',
  'Falkland Is.': 'Îles Malouines',
  'Cook Is.': 'Îles Cook',
  'Faroe Is.': 'Îles Féroé',
  'Cyprus': 'Chypre',
  'Malta': 'Malte',
  'Iceland': 'Islande',
  'Madagascar': 'Madagascar',
  'Mauritius': 'Île Maurice',
  'Seychelles': 'Seychelles',
  'Maldives': 'Maldives',
  'Fiji': 'Fidji',
  'Solomon Is.': 'Îles Salomon',
  'Vanuatu': 'Vanuatu',
  'Saint Helena': 'Sainte-Hélène',
  'Bermuda': 'Bermudes',
  'Cayman Is.': 'Îles Caïmans',
  'France': 'France',
  'United States': 'États-Unis',
  'United Kingdom': 'Royaume-Uni',
  'Germany': 'Allemagne',
  'Spain': 'Espagne',
  'Italy': 'Italie',
  'Russia': 'Russie',
  'China': 'Chine',
  'Japan': 'Japon',
  'South Korea': 'Corée du Sud',
  'North Korea': 'Corée du Nord',
  'Canada': 'Canada',
  'Brazil': 'Brésil',
  'India': 'Inde',
  'Australia': 'Australie',
  'Algeria': 'Algérie',
  'Morocco': 'Maroc',
  'Tunisia': 'Tunisie',
  'Egypt': 'Égypte',
  'South Africa': 'Afrique du Sud',
  'Turkey': 'Turquie',
  'Saudi Arabia': 'Arabie saoudite',
  'Iran': 'Iran',
  'Iraq': 'Irak',
  'Syria': 'Syrie',
  'Lebanon': 'Liban',
  'Israel': 'Israël',
  'Palestine': 'Palestine',
  'Switzerland': 'Suisse',
  'Belgium': 'Belgique',
  'Netherlands': 'Pays-Bas',
  'Sweden': 'Suède',
  'Norway': 'Norvège',
  'Finland': 'Finlande',
  'Denmark': 'Danemark',
  'Poland': 'Pologne',
  'Ukraine': 'Ukraine',
  'Greece': 'Grèce',
  'Portugal': 'Portugal',
  'Ireland': 'Irlande',
  'Austria': 'Autriche',
  'Czechia': 'Tchéquie',
  'New Zealand': 'Nouvelle-Zélande',
  'Mexico': 'Mexique',
  'Argentina': 'Argentine',
  'Chile': 'Chili',
  'Colombia': 'Colombie',
  'Peru': 'Pérou',
};

// Official land & territorial area reference (km²)
export const OFFICIAL_AREAS_KM2 = {
  'Russia': 17098242,
  'Canada': 9984670,
  'United States': 9833517,
  'China': 9596960,
  'Brazil': 8515767,
  'Australia': 7692024,
  'India': 3287263,
  'Argentina': 2780400,
  'Kazakhstan': 2724900,
  'Algeria': 2381741,
  'DR Congo': 2344858,
  'Greenland': 2166086,
  'Saudi Arabia': 2149690,
  'Mexico': 1964375,
  'Indonesia': 1904569,
  'Sudan': 1861484,
  'Libya': 1759540,
  'Iran': 1648195,
  'Mongolia': 1564110,
  'Peru': 1285216,
  'Chad': 1284000,
  'Niger': 1267000,
  'Angola': 1246700,
  'Mali': 1240192,
  'South Africa': 1221037,
  'Colombia': 1141748,
  'Ethiopia': 1104300,
  'Bolivia': 1098581,
  'Mauritania': 1030700,
  'Egypt': 1002450,
  'Tanzania': 945087,
  'Nigeria': 923768,
  'Venezuela': 912050,
  'Pakistan': 881913,
  'Namibia': 824292,
  'Mozambique': 801590,
  'Turkey': 783562,
  'Chile': 756102,
  'Zambia': 752618,
  'Myanmar': 676578,
  'Afghanistan': 652864,
  'South Sudan': 644329,
  'France': 551695, // Métropolitaine (643 801 avec outre-mer)
  'Somalia': 637657,
  'Central African Rep.': 622984,
  'Ukraine': 603500,
  'Madagascar': 587041,
  'Botswana': 581730,
  'Kenya': 580367,
  'Yemen': 527968,
  'Thailand': 513120,
  'Spain': 505990,
  'Turkmenistan': 488100,
  'Cameroon': 475442,
  'Papua New Guinea': 462840,
  'Sweden': 450295,
  'Uzbekistan': 447400,
  'Morocco': 446550,
  'Iraq': 438317,
  'Paraguay': 406752,
  'Zimbabwe': 390757,
  'Norway': 385207,
  'Japan': 377975,
  'Germany': 357022,
  'Congo': 342000,
  'Finland': 338145,
  'Vietnam': 331212,
  'Malaysia': 330803,
  'Poland': 312696,
  'Oman': 309500,
  'Italy': 301340,
  'Philippines': 300000,
  'Ecuador': 276841,
  'Burkina Faso': 274200,
  'New Zealand': 270467,
  'Gabon': 267668,
  'Guinea': 245857,
  'United Kingdom': 242900,
  'Uganda': 241550,
  'Ghana': 238533,
  'Romania': 238391,
  'Laos': 236800,
  'Guyana': 214969,
  'Belarus': 207600,
  'Kyrgyzstan': 199951,
  'Senegal': 196722,
  'Syria': 185180,
  'Cambodia': 181035,
  'Uruguay': 176215,
  'Tunisia': 163610,
  'Suriname': 163820,
  'Bangladesh': 148460,
  'Nepal': 147181,
  'Tajikistan': 143100,
  'Greece': 131957,
  'Nicaragua': 130370,
  'North Korea': 120538,
  'Malawi': 118484,
  'Eritrea': 117600,
  'Benin': 112622,
  'Honduras': 112492,
  'Liberia': 111369,
  'Bulgaria': 110879,
  'Cuba': 109884,
  'Guatemala': 108889,
  'Iceland': 103000,
  'South Korea': 100210,
  'Hungary': 93028,
  'Portugal': 92212,
  'Jordan': 89342,
  'French Guiana': 83534,
  'Azerbaijan': 86600,
  'Austria': 83871,
  'United Arab Emirates': 83600,
  'Czechia': 78867,
  'Serbia': 77474,
  'Panama': 75420,
  'Sierra Leone': 71740,
  'Ireland': 70273,
  'Georgia': 69700,
  'Sri Lanka': 65610,
  'Lithuania': 65300,
  'Latvia': 64589,
  'Togo': 56785,
  'Croatia': 56594,
  'Bosnia and Herz.': 51197,
  'Costa Rica': 51100,
  'Slovakia': 49035,
  'Dominican Rep.': 48670,
  'Estonia': 45228,
  'Denmark': 43094,
  'Netherlands': 41850,
  'Switzerland': 41285,
  'Bhutan': 38394,
  'Taiwan': 36193,
  'Guinea-Bissau': 36125,
  'Moldova': 33846,
  'Belgium': 30528,
  'Armenia': 29743,
  'Lesotho': 30355,
  'Albania': 28748,
  'Equatorial Guinea': 28051,
  'Burundi': 27834,
  'Haiti': 27750,
  'Rwanda': 26338,
  'North Macedonia': 25713,
  'Djibouti': 23200,
  'Belize': 22966,
  'El Salvador': 21041,
  'Israel': 20770,
  'Slovenia': 20273,
  'New Caledonia': 18575,
  'Fiji': 18274,
  'Kuwait': 17818,
  'Eswatini': 17364,
  'Timor-Leste': 14874,
  'Bahamas': 13943,
  'Montenegro': 13812,
  'Vanuatu': 12189,
  'Falkland Is.': 12173,
  'Qatar': 11586,
  'Gambia': 11295,
  'Jamaica': 10991,
  'Kosovo': 10887,
  'Lebanon': 10452,
  'Cyprus': 9251,
  'Puerto Rico': 9104,
  'Corsica': 8680,
  'Fr. Polynesia': 4167,
  'Luxembourg': 2586,
  'Reunion': 2511,
  'Mauritius': 2040,
  'Guadeloupe': 1628,
  'Faroe Is.': 1393,
  'Martinique': 1128,
  'Mayotte': 374,
  'Malta': 316,
  'Maldives': 300,
  'Seychelles': 459,
  'Singapore': 734,
  'Bermuda': 54,
};

// Geodesic spherical area calculation from coordinate rings (Earth R = 6371 km)
export function calculatePolygonAreaKm2(geometry) {
  if (!geometry) return 0;
  const R = 6371; // km
  let totalArea = 0;

  const polyList =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];

  for (const poly of polyList) {
    for (const ring of poly) {
      if (ring.length < 3) continue;
      let ringArea = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const latMid = (((lat1 + lat2) / 2) * Math.PI) / 180;
        ringArea += dLon * Math.sin(latMid);
      }
      totalArea += ringArea;
    }
  }

  return Math.abs(totalArea * R * R);
}

// Get the best area estimate for a country/territory
export function getCountryAreaKm2(feature) {
  if (!feature) return null;
  const props = feature.properties || {};
  const rawName = props.NAME || props.SUBUNIT || props.ADMIN || '';
  
  if (OFFICIAL_AREAS_KM2[rawName]) {
    return OFFICIAL_AREAS_KM2[rawName];
  }

  // Geodesic calculation fallback
  if (feature.geometry) {
    const calc = Math.round(calculatePolygonAreaKm2(feature.geometry));
    if (calc > 0) return calc;
  }

  return null;
}

// Format numbers with French locale
export function formatNumberFr(num) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return Number(num).toLocaleString('fr-FR');
}

// Format area string
export function formatAreaKm2(area) {
  if (!area || isNaN(area)) return 'N/A';
  return `${Number(area).toLocaleString('fr-FR')} km²`;
}
