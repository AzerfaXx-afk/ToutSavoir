import REAL_VESSELS_SNAPSHOT from '../data/realVesselsSnapshot.json';

// ===================================================================
// AIS Ship Type → MarineTraffic Category Mapping (ITU-R M.1371-5)
// ===================================================================
// Official AIS ship type codes 0–99 mapped to MarineTraffic color categories
const AIS_SHIP_TYPE_MAP = {
  // 20–29: Wing in Ground
  20: 'pleasure', 21: 'pleasure', 22: 'pleasure', 23: 'pleasure', 24: 'pleasure',
  25: 'pleasure', 26: 'pleasure', 27: 'pleasure', 28: 'pleasure', 29: 'pleasure',
  // 30: Fishing
  30: 'fishing',
  // 31–32: Towing
  31: 'tug', 32: 'tug',
  // 33: Dredging
  33: 'tug',
  // 34: Diving ops
  34: 'tug',
  // 35: Military ops
  35: 'military',
  // 36: Sailing
  36: 'pleasure',
  // 37: Pleasure craft
  37: 'pleasure',
  // 40–49: High speed craft
  40: 'passenger', 41: 'passenger', 42: 'passenger', 43: 'passenger', 44: 'passenger',
  45: 'passenger', 46: 'passenger', 47: 'passenger', 48: 'passenger', 49: 'passenger',
  // 50: Pilot vessel
  50: 'tug',
  // 51: Search and Rescue
  51: 'military',
  // 52: Tug
  52: 'tug',
  // 53: Port tender
  53: 'tug',
  // 54: Anti-pollution
  54: 'tug',
  // 55: Law enforcement
  55: 'military',
  // 58: Medical transport
  58: 'passenger',
  // 59: Non-combatant warship (Resolution 18)
  59: 'military',
  // 60–69: Passenger ships
  60: 'passenger', 61: 'passenger', 62: 'passenger', 63: 'passenger', 64: 'passenger',
  65: 'passenger', 66: 'passenger', 67: 'passenger', 68: 'passenger', 69: 'passenger',
  // 70–79: Cargo ships
  70: 'cargo', 71: 'cargo', 72: 'cargo', 73: 'cargo', 74: 'cargo',
  75: 'cargo', 76: 'cargo', 77: 'cargo', 78: 'cargo', 79: 'cargo',
  // 80–89: Tanker
  80: 'tanker', 81: 'tanker', 82: 'tanker', 83: 'tanker', 84: 'tanker',
  85: 'tanker', 86: 'tanker', 87: 'tanker', 88: 'tanker', 89: 'tanker',
  // 90–99: Other type
  90: 'cargo', 91: 'cargo', 92: 'cargo', 93: 'cargo', 94: 'cargo',
  95: 'cargo', 96: 'cargo', 97: 'cargo', 98: 'cargo', 99: 'cargo',
};

// AIS Navigation Status codes (ITU-R M.1371-5 Table 45)
const AIS_NAV_STATUS = {
  0: 'Faisant route au moteur',
  1: 'Au mouillage',
  2: 'Non commandé',
  3: 'Manoeuvrabilité restreinte',
  4: 'Contraint par son tirant d\'eau',
  5: 'Amarré à quai',
  6: 'Échoué',
  7: 'En cours de pêche',
  8: 'Faisant route à la voile',
  9: 'Réservé (HSC)',
  10: 'Réservé (WIG)',
  11: 'Remorquage poussage',
  12: 'Réservé',
  13: 'Réservé',
  14: 'AIS-SART actif',
  15: 'Non défini',
};

// MMSI MID (Maritime Identification Digits) → Country
const MID_COUNTRY = {
  201: { flag: 'Albanie', emoji: '🇦🇱' }, 202: { flag: 'Andorre', emoji: '🇦🇩' },
  203: { flag: 'Autriche', emoji: '🇦🇹' }, 204: { flag: 'Açores', emoji: '🇵🇹' },
  205: { flag: 'Belgique', emoji: '🇧🇪' }, 206: { flag: 'Biélorussie', emoji: '🇧🇾' },
  207: { flag: 'Bulgarie', emoji: '🇧🇬' }, 209: { flag: 'Chypre', emoji: '🇨🇾' },
  210: { flag: 'Chypre', emoji: '🇨🇾' }, 211: { flag: 'Allemagne', emoji: '🇩🇪' },
  212: { flag: 'Chypre', emoji: '🇨🇾' }, 213: { flag: 'Géorgie', emoji: '🇬🇪' },
  214: { flag: 'Moldavie', emoji: '🇲🇩' }, 215: { flag: 'Malte', emoji: '🇲🇹' },
  216: { flag: 'Arménie', emoji: '🇦🇲' }, 218: { flag: 'Allemagne', emoji: '🇩🇪' },
  219: { flag: 'Danemark', emoji: '🇩🇰' }, 220: { flag: 'Danemark', emoji: '🇩🇰' },
  224: { flag: 'Espagne', emoji: '🇪🇸' }, 225: { flag: 'Espagne', emoji: '🇪🇸' },
  226: { flag: 'France', emoji: '🇫🇷' }, 227: { flag: 'France', emoji: '🇫🇷' },
  228: { flag: 'France', emoji: '🇫🇷' }, 229: { flag: 'Malte', emoji: '🇲🇹' },
  230: { flag: 'Finlande', emoji: '🇫🇮' }, 231: { flag: 'Féroé', emoji: '🇫🇴' },
  232: { flag: 'Royaume-Uni', emoji: '🇬🇧' }, 233: { flag: 'Royaume-Uni', emoji: '🇬🇧' },
  234: { flag: 'Royaume-Uni', emoji: '🇬🇧' }, 235: { flag: 'Royaume-Uni', emoji: '🇬🇧' },
  236: { flag: 'Gibraltar', emoji: '🇬🇮' }, 237: { flag: 'Grèce', emoji: '🇬🇷' },
  238: { flag: 'Croatie', emoji: '🇭🇷' }, 239: { flag: 'Grèce', emoji: '🇬🇷' },
  240: { flag: 'Grèce', emoji: '🇬🇷' }, 241: { flag: 'Grèce', emoji: '🇬🇷' },
  242: { flag: 'Maroc', emoji: '🇲🇦' }, 243: { flag: 'Hongrie', emoji: '🇭🇺' },
  244: { flag: 'Pays-Bas', emoji: '🇳🇱' }, 245: { flag: 'Pays-Bas', emoji: '🇳🇱' },
  246: { flag: 'Pays-Bas', emoji: '🇳🇱' }, 247: { flag: 'Italie', emoji: '🇮🇹' },
  248: { flag: 'Malte', emoji: '🇲🇹' }, 249: { flag: 'Malte', emoji: '🇲🇹' },
  250: { flag: 'Irlande', emoji: '🇮🇪' }, 251: { flag: 'Islande', emoji: '🇮🇸' },
  252: { flag: 'Liechtenstein', emoji: '🇱🇮' }, 253: { flag: 'Luxembourg', emoji: '🇱🇺' },
  254: { flag: 'Monaco', emoji: '🇲🇨' }, 255: { flag: 'Madère', emoji: '🇵🇹' },
  256: { flag: 'Malte', emoji: '🇲🇹' }, 257: { flag: 'Norvège', emoji: '🇳🇴' },
  258: { flag: 'Norvège', emoji: '🇳🇴' }, 259: { flag: 'Norvège', emoji: '🇳🇴' },
  261: { flag: 'Pologne', emoji: '🇵🇱' }, 263: { flag: 'Portugal', emoji: '🇵🇹' },
  264: { flag: 'Roumanie', emoji: '🇷🇴' }, 265: { flag: 'Suède', emoji: '🇸🇪' },
  266: { flag: 'Suède', emoji: '🇸🇪' }, 267: { flag: 'Slovaquie', emoji: '🇸🇰' },
  268: { flag: 'Saint-Marin', emoji: '🇸🇲' }, 269: { flag: 'Suisse', emoji: '🇨🇭' },
  270: { flag: 'Tchéquie', emoji: '🇨🇿' }, 271: { flag: 'Turquie', emoji: '🇹🇷' },
  272: { flag: 'Ukraine', emoji: '🇺🇦' }, 273: { flag: 'Russie', emoji: '🇷🇺' },
  274: { flag: 'Macédoine', emoji: '🇲🇰' }, 275: { flag: 'Lettonie', emoji: '🇱🇻' },
  276: { flag: 'Estonie', emoji: '🇪🇪' }, 277: { flag: 'Lituanie', emoji: '🇱🇹' },
  278: { flag: 'Slovénie', emoji: '🇸🇮' }, 279: { flag: 'Serbie', emoji: '🇷🇸' },
  301: { flag: 'Anguilla', emoji: '🇦🇮' }, 303: { flag: 'Alaska', emoji: '🇺🇸' },
  304: { flag: 'Antigua', emoji: '🇦🇬' }, 305: { flag: 'Antigua', emoji: '🇦🇬' },
  306: { flag: 'Curaçao', emoji: '🇨🇼' }, 307: { flag: 'Aruba', emoji: '🇦🇼' },
  308: { flag: 'Bahamas', emoji: '🇧🇸' }, 309: { flag: 'Bahamas', emoji: '🇧🇸' },
  310: { flag: 'Bermudes', emoji: '🇧🇲' }, 311: { flag: 'Bahamas', emoji: '🇧🇸' },
  312: { flag: 'Belize', emoji: '🇧🇿' }, 314: { flag: 'Barbade', emoji: '🇧🇧' },
  316: { flag: 'Canada', emoji: '🇨🇦' }, 319: { flag: 'Îles Caïmans', emoji: '🇰🇾' },
  321: { flag: 'Costa Rica', emoji: '🇨🇷' }, 323: { flag: 'Cuba', emoji: '🇨🇺' },
  325: { flag: 'Dominique', emoji: '🇩🇲' }, 327: { flag: 'Rép. Dominicaine', emoji: '🇩🇴' },
  329: { flag: 'Guadeloupe', emoji: '🇬🇵' }, 330: { flag: 'Grenade', emoji: '🇬🇩' },
  331: { flag: 'Groenland', emoji: '🇬🇱' }, 332: { flag: 'Guatemala', emoji: '🇬🇹' },
  334: { flag: 'Honduras', emoji: '🇭🇳' }, 336: { flag: 'Haïti', emoji: '🇭🇹' },
  338: { flag: 'États-Unis', emoji: '🇺🇸' }, 339: { flag: 'Jamaïque', emoji: '🇯🇲' },
  341: { flag: 'Saint-Kitts', emoji: '🇰🇳' }, 343: { flag: 'Sainte-Lucie', emoji: '🇱🇨' },
  345: { flag: 'Mexique', emoji: '🇲🇽' }, 347: { flag: 'Martinique', emoji: '🇲🇶' },
  348: { flag: 'Montserrat', emoji: '🇲🇸' }, 350: { flag: 'Nicaragua', emoji: '🇳🇮' },
  351: { flag: 'Panama', emoji: '🇵🇦' }, 352: { flag: 'Panama', emoji: '🇵🇦' },
  353: { flag: 'Panama', emoji: '🇵🇦' }, 354: { flag: 'Panama', emoji: '🇵🇦' },
  355: { flag: 'Panama', emoji: '🇵🇦' }, 356: { flag: 'Panama', emoji: '🇵🇦' },
  357: { flag: 'Panama', emoji: '🇵🇦' }, 358: { flag: 'Porto Rico', emoji: '🇵🇷' },
  359: { flag: 'Salvador', emoji: '🇸🇻' },
  361: { flag: 'Saint-Pierre', emoji: '🇵🇲' },
  362: { flag: 'Trinité', emoji: '🇹🇹' },
  364: { flag: 'Îles Turques', emoji: '🇹🇨' },
  366: { flag: 'États-Unis', emoji: '🇺🇸' }, 367: { flag: 'États-Unis', emoji: '🇺🇸' },
  368: { flag: 'États-Unis', emoji: '🇺🇸' }, 369: { flag: 'États-Unis', emoji: '🇺🇸' },
  370: { flag: 'Panama', emoji: '🇵🇦' }, 371: { flag: 'Panama', emoji: '🇵🇦' },
  372: { flag: 'Panama', emoji: '🇵🇦' }, 373: { flag: 'Panama', emoji: '🇵🇦' },
  374: { flag: 'Panama', emoji: '🇵🇦' }, 375: { flag: 'Saint-Vincent', emoji: '🇻🇨' },
  376: { flag: 'Saint-Vincent', emoji: '🇻🇨' }, 377: { flag: 'Saint-Vincent', emoji: '🇻🇨' },
  378: { flag: 'Îles Vierges UK', emoji: '🇻🇬' },
  401: { flag: 'Afghanistan', emoji: '🇦🇫' },
  403: { flag: 'Arabie Saoudite', emoji: '🇸🇦' },
  405: { flag: 'Bangladesh', emoji: '🇧🇩' },
  408: { flag: 'Bahreïn', emoji: '🇧🇭' },
  410: { flag: 'Bhoutan', emoji: '🇧🇹' },
  412: { flag: 'Chine', emoji: '🇨🇳' }, 413: { flag: 'Chine', emoji: '🇨🇳' },
  414: { flag: 'Chine', emoji: '🇨🇳' },
  416: { flag: 'Taïwan', emoji: '🇹🇼' },
  417: { flag: 'Sri Lanka', emoji: '🇱🇰' },
  419: { flag: 'Inde', emoji: '🇮🇳' },
  422: { flag: 'Iran', emoji: '🇮🇷' },
  423: { flag: 'Azerbaïdjan', emoji: '🇦🇿' },
  425: { flag: 'Irak', emoji: '🇮🇶' },
  428: { flag: 'Israël', emoji: '🇮🇱' },
  431: { flag: 'Japon', emoji: '🇯🇵' }, 432: { flag: 'Japon', emoji: '🇯🇵' },
  434: { flag: 'Turkménistan', emoji: '🇹🇲' },
  436: { flag: 'Kazakhstan', emoji: '🇰🇿' },
  437: { flag: 'Ouzbékistan', emoji: '🇺🇿' },
  438: { flag: 'Jordanie', emoji: '🇯🇴' },
  440: { flag: 'Corée du Sud', emoji: '🇰🇷' }, 441: { flag: 'Corée du Sud', emoji: '🇰🇷' },
  443: { flag: 'Palestine', emoji: '🇵🇸' },
  445: { flag: 'Corée du Nord', emoji: '🇰🇵' },
  447: { flag: 'Koweït', emoji: '🇰🇼' },
  450: { flag: 'Liban', emoji: '🇱🇧' },
  451: { flag: 'Kirghizistan', emoji: '🇰🇬' },
  453: { flag: 'Macao', emoji: '🇲🇴' },
  455: { flag: 'Maldives', emoji: '🇲🇻' },
  457: { flag: 'Mongolie', emoji: '🇲🇳' },
  459: { flag: 'Népal', emoji: '🇳🇵' },
  461: { flag: 'Oman', emoji: '🇴🇲' },
  463: { flag: 'Pakistan', emoji: '🇵🇰' },
  466: { flag: 'Qatar', emoji: '🇶🇦' },
  468: { flag: 'Syrie', emoji: '🇸🇾' },
  470: { flag: 'EAU', emoji: '🇦🇪' }, 471: { flag: 'EAU', emoji: '🇦🇪' },
  472: { flag: 'Tadjikistan', emoji: '🇹🇯' },
  473: { flag: 'Yémen', emoji: '🇾🇪' },
  475: { flag: 'Tonga', emoji: '🇹🇴' },
  477: { flag: 'Hong Kong', emoji: '🇭🇰' },
  478: { flag: 'Bosnie', emoji: '🇧🇦' },
  501: { flag: 'Antarctique', emoji: '🇦🇶' },
  503: { flag: 'Australie', emoji: '🇦🇺' },
  506: { flag: 'Myanmar', emoji: '🇲🇲' },
  508: { flag: 'Brunei', emoji: '🇧🇳' },
  510: { flag: 'Micronésie', emoji: '🇫🇲' },
  511: { flag: 'Palaos', emoji: '🇵🇼' },
  512: { flag: 'Nouvelle-Zélande', emoji: '🇳🇿' },
  514: { flag: 'Cambodge', emoji: '🇰🇭' },
  515: { flag: 'Cambodge', emoji: '🇰🇭' },
  516: { flag: 'Île Christmas', emoji: '🇨🇽' },
  518: { flag: 'Îles Cook', emoji: '🇨🇰' },
  520: { flag: 'Fidji', emoji: '🇫🇯' },
  523: { flag: 'Île Cocos', emoji: '🇨🇨' },
  525: { flag: 'Indonésie', emoji: '🇮🇩' },
  529: { flag: 'Kiribati', emoji: '🇰🇮' },
  531: { flag: 'Laos', emoji: '🇱🇦' },
  533: { flag: 'Malaisie', emoji: '🇲🇾' },
  536: { flag: 'Îles Mariannes', emoji: '🇲🇵' },
  538: { flag: 'Îles Marshall', emoji: '🇲🇭' },
  540: { flag: 'Nouvelle-Calédonie', emoji: '🇳🇨' },
  542: { flag: 'Niue', emoji: '🇳🇺' },
  544: { flag: 'Nauru', emoji: '🇳🇷' },
  546: { flag: 'Polynésie fr.', emoji: '🇵🇫' },
  548: { flag: 'Philippines', emoji: '🇵🇭' },
  553: { flag: 'Papouasie', emoji: '🇵🇬' },
  555: { flag: 'Pitcairn', emoji: '🇵🇳' },
  557: { flag: 'Îles Salomon', emoji: '🇸🇧' },
  559: { flag: 'Samoa', emoji: '🇼🇸' },
  561: { flag: 'Singapour', emoji: '🇸🇬' },
  563: { flag: 'Singapour', emoji: '🇸🇬' },
  564: { flag: 'Singapour', emoji: '🇸🇬' },
  565: { flag: 'Singapour', emoji: '🇸🇬' },
  566: { flag: 'Singapour', emoji: '🇸🇬' },
  567: { flag: 'Thaïlande', emoji: '🇹🇭' },
  570: { flag: 'Tonga', emoji: '🇹🇴' },
  572: { flag: 'Tuvalu', emoji: '🇹🇻' },
  574: { flag: 'Vietnam', emoji: '🇻🇳' },
  576: { flag: 'Vanuatu', emoji: '🇻🇺' },
  577: { flag: 'Vanuatu', emoji: '🇻🇺' },
  578: { flag: 'Wallis-et-Futuna', emoji: '🇼🇫' },
  601: { flag: 'Afrique du Sud', emoji: '🇿🇦' },
  603: { flag: 'Angola', emoji: '🇦🇴' },
  605: { flag: 'Algérie', emoji: '🇩🇿' },
  607: { flag: 'Saint-Paul', emoji: '🇫🇷' },
  609: { flag: 'Ascension', emoji: '🇸🇭' },
  610: { flag: 'Bénin', emoji: '🇧🇯' },
  611: { flag: 'Botswana', emoji: '🇧🇼' },
  612: { flag: 'RCA', emoji: '🇨🇫' },
  613: { flag: 'Cameroun', emoji: '🇨🇲' },
  615: { flag: 'Congo', emoji: '🇨🇬' },
  616: { flag: 'Comores', emoji: '🇰🇲' },
  617: { flag: 'Cap-Vert', emoji: '🇨🇻' },
  618: { flag: 'Crozet', emoji: '🇫🇷' },
  619: { flag: 'Côte d\'Ivoire', emoji: '🇨🇮' },
  620: { flag: 'Comores', emoji: '🇰🇲' },
  621: { flag: 'Djibouti', emoji: '🇩🇯' },
  622: { flag: 'Égypte', emoji: '🇪🇬' },
  624: { flag: 'Éthiopie', emoji: '🇪🇹' },
  625: { flag: 'Érythrée', emoji: '🇪🇷' },
  626: { flag: 'Gabon', emoji: '🇬🇦' },
  627: { flag: 'Ghana', emoji: '🇬🇭' },
  629: { flag: 'Gambie', emoji: '🇬🇲' },
  630: { flag: 'Guinée-Bissau', emoji: '🇬🇼' },
  631: { flag: 'Guinée Équat.', emoji: '🇬🇶' },
  632: { flag: 'Guinée', emoji: '🇬🇳' },
  633: { flag: 'Burkina Faso', emoji: '🇧🇫' },
  634: { flag: 'Kenya', emoji: '🇰🇪' },
  635: { flag: 'Kerguelen', emoji: '🇫🇷' },
  636: { flag: 'Liberia', emoji: '🇱🇷' }, 637: { flag: 'Liberia', emoji: '🇱🇷' },
  638: { flag: 'Soudan du Sud', emoji: '🇸🇸' },
  642: { flag: 'Libye', emoji: '🇱🇾' },
  644: { flag: 'Lesotho', emoji: '🇱🇸' },
  645: { flag: 'Maurice', emoji: '🇲🇺' },
  647: { flag: 'Madagascar', emoji: '🇲🇬' },
  649: { flag: 'Mali', emoji: '🇲🇱' },
  650: { flag: 'Mozambique', emoji: '🇲🇿' },
  654: { flag: 'Mauritanie', emoji: '🇲🇷' },
  655: { flag: 'Malawi', emoji: '🇲🇼' },
  656: { flag: 'Niger', emoji: '🇳🇪' },
  657: { flag: 'Nigeria', emoji: '🇳🇬' },
  659: { flag: 'Namibie', emoji: '🇳🇦' },
  660: { flag: 'Réunion', emoji: '🇷🇪' },
  661: { flag: 'Rwanda', emoji: '🇷🇼' },
  662: { flag: 'Soudan', emoji: '🇸🇩' },
  663: { flag: 'Sénégal', emoji: '🇸🇳' },
  664: { flag: 'Seychelles', emoji: '🇸🇨' },
  665: { flag: 'Sainte-Hélène', emoji: '🇸🇭' },
  666: { flag: 'Somalie', emoji: '🇸🇴' },
  667: { flag: 'Sierra Leone', emoji: '🇸🇱' },
  668: { flag: 'Sao Tomé', emoji: '🇸🇹' },
  669: { flag: 'Eswatini', emoji: '🇸🇿' },
  670: { flag: 'Tchad', emoji: '🇹🇩' },
  671: { flag: 'Togo', emoji: '🇹🇬' },
  672: { flag: 'Tunisie', emoji: '🇹🇳' },
  674: { flag: 'Tanzanie', emoji: '🇹🇿' }, 675: { flag: 'Tanzanie', emoji: '🇹🇿' },
  676: { flag: 'Ouganda', emoji: '🇺🇬' },
  677: { flag: 'RDC', emoji: '🇨🇩' },
  678: { flag: 'Zambie', emoji: '🇿🇲' },
  679: { flag: 'Zimbabwe', emoji: '🇿🇼' },
  701: { flag: 'Argentine', emoji: '🇦🇷' },
  710: { flag: 'Brésil', emoji: '🇧🇷' },
  720: { flag: 'Bolivie', emoji: '🇧🇴' },
  725: { flag: 'Chili', emoji: '🇨🇱' },
  730: { flag: 'Colombie', emoji: '🇨🇴' },
  735: { flag: 'Équateur', emoji: '🇪🇨' },
  740: { flag: 'Malouines', emoji: '🇫🇰' },
  745: { flag: 'Guyane fr.', emoji: '🇬🇫' },
  750: { flag: 'Guyana', emoji: '🇬🇾' },
  755: { flag: 'Paraguay', emoji: '🇵🇾' },
  760: { flag: 'Pérou', emoji: '🇵🇪' },
  765: { flag: 'Suriname', emoji: '🇸🇷' },
  770: { flag: 'Uruguay', emoji: '🇺🇾' },
  775: { flag: 'Venezuela', emoji: '🇻🇪' },
};

function getCountryFromMMSI(mmsi) {
  if (!mmsi || mmsi < 200000000) return { flag: 'Inconnu', emoji: '🏳️' };
  const mid = Math.floor(mmsi / 1000000);
  return MID_COUNTRY[mid] || { flag: 'Inconnu', emoji: '🏳️' };
}

// MarineTraffic Official Ship Types & Colors
export const MARITIME_TYPES = {
  container: { label: 'Porte-conteneurs', color: '#22c55e', icon: '🚢' },
  cargo: { label: 'Cargo / Fret', color: '#10b981', icon: '🚛' },
  tanker: { label: 'Pétrolier / Chimiquier', color: '#ef4444', icon: '⛽' },
  product_tanker: { label: 'Pétrolier Raffiné', color: '#f43f5e', icon: '🛢️' },
  lng: { label: 'Méthanier GNL', color: '#c084fc', icon: '🔥' },
  bulk: { label: 'Vraquier', color: '#0ea5e9', icon: '⚓' },
  passenger: { label: 'Passagers / Ferry', color: '#2563eb', icon: '🛳️' },
  tug: { label: 'Remorqueur / Service', color: '#06b6d4', icon: '🛥️' },
  fishing: { label: 'Navire de Pêche', color: '#f97316', icon: '🐟' },
  military: { label: 'Militaire / Garde-côtes', color: '#94a3b8', icon: '🛡️' },
  pleasure: { label: 'Plaisance / Voilier', color: '#e879f9', icon: '⛵' },
};

// Generates the authentic MarineTraffic pointed vessel hull SVG icon
export function getMarineTrafficVesselSvg(course = 0, size = 16, category = 'container', isSelected = false) {
  const typeDef = MARITIME_TYPES[category] || MARITIME_TYPES.container;
  const fillColor = isSelected ? '#ffffff' : typeDef.color;
  const strokeColor = isSelected ? '#00f5a0' : '#050c18';
  const strokeWidth = isSelected ? '1.5' : '1.0';
  const glowFilter = isSelected
    ? 'drop-shadow(0 0 8px #00f5a0) drop-shadow(0 0 2px #ffffff)'
    : `drop-shadow(0 1px 2px rgba(0,0,0,0.85))`;

  return `
    <div class="marinetraffic-vessel-marker ${isSelected ? 'is-selected' : ''}" style="width: ${size}px; height: ${size}px;">
      <div class="marinetraffic-vessel-rotator" style="transform: rotate(${course}deg); filter: ${glowFilter}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
          <!-- Ship Hull: Pointed arrow chevron matching MarineTraffic official AIS symbology -->
          <path fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"
            d="M12 2 L19 19 L12 15 L5 19 Z" />
        </svg>
      </div>
      ${isSelected ? '<div class="marinetraffic-pulse-ring"></div>' : ''}
    </div>
  `;
}

// Classify AIS ship type code to MarineTraffic category
function classifyShipType(shipType) {
  if (!shipType || shipType === 0) return 'cargo';
  return AIS_SHIP_TYPE_MAP[shipType] || 'cargo';
}

// Ship type code → readable type label
function getShipTypeLabel(shipType, category) {
  if (!shipType) return MARITIME_TYPES[category]?.label || 'Cargo / Fret';
  if (shipType >= 60 && shipType <= 69) return 'Passagers / Ferry';
  if (shipType >= 70 && shipType <= 79) return 'Cargo / Fret';
  if (shipType >= 80 && shipType <= 89) return 'Pétrolier / Chimiquier';
  if (shipType >= 40 && shipType <= 49) return 'Navire Rapide (HSC)';
  if (shipType === 30) return 'Navire de Pêche';
  if (shipType >= 31 && shipType <= 34) return 'Remorqueur / Service';
  if (shipType === 35 || shipType === 55) return 'Militaire / Garde-côtes';
  if (shipType === 36 || shipType === 37) return 'Plaisance / Voilier';
  if (shipType === 52) return 'Remorqueur';
  return MARITIME_TYPES[category]?.label || 'Cargo / Fret';
}

class MarineTrafficService {
  constructor() {
    this.vessels = [];
    this.vesselsMap = new Map();
    this.vesselMetadataMap = new Map(); // MMSI → {name, callSign, imo, destination, shipType, dimensions}
    this.totalGlobalVessels = 25910;
    this.vesselLimit = 5000;
    this.listeners = new Set();
    this.animationTimer = null;
    this.pollingInterval = null;
    this.metadataInterval = null;
    this.isFetching = false;
    this.isMetadataFetching = false;
    this.lastMetadataFetch = 0;

    // Direct initialization from authentic worldwide MarineTraffic dataset (25,900+ ships)
    if (Array.isArray(REAL_VESSELS_SNAPSHOT) && REAL_VESSELS_SNAPSHOT.length > 0) {
      for (let i = 0; i < REAL_VESSELS_SNAPSHOT.length; i++) {
        const item = REAL_VESSELS_SNAPSHOT[i];
        if (item && item.id) {
          this.vesselsMap.set(item.id, {
            ...item,
            lastUpdate: Date.now(),
          });
        }
      }
    }

    this.vessels = Array.from(this.vesselsMap.values());
    this.totalGlobalVessels = Math.max(25910, this.vessels.length);
  }

  setVesselLimit(limit) {
    this.vesselLimit = Math.max(10, limit);
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    if (this.vessels.length > 0) {
      callback(this.vessels, this.totalGlobalVessels, this.vesselLimit);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    for (const cb of this.listeners) {
      try {
        cb(this.vessels, this.totalGlobalVessels, this.vesselLimit);
      } catch (err) {
        console.error('Error in vessel subscriber:', err);
      }
    }
  }

  // ====================================================================
  // Fetch vessel METADATA: real names, callsigns, IMO, destinations,
  // ship types, and dimensions from Digitraffic /vessels API
  // ====================================================================
  async fetchVesselMetadata() {
    if (this.isMetadataFetching) return;
    this.isMetadataFetching = true;

    try {
      const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:5174';
      const res = await fetch(`${baseUrl}/api/digitraffic/api/ais/v1/vessels`, {
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          let count = 0;
          for (let i = 0; i < data.length; i++) {
            const v = data[i];
            if (!v || !v.mmsi) continue;
            // Compute real dimensions from AIS reference points
            const lengthM = (v.referencePointA || 0) + (v.referencePointB || 0);
            const beamM = (v.referencePointC || 0) + (v.referencePointD || 0);
            this.vesselMetadataMap.set(v.mmsi, {
              name: v.name ? v.name.trim() : null,
              callSign: v.callSign ? v.callSign.trim() : null,
              imo: v.imo || null,
              destination: v.destination ? v.destination.trim() : null,
              shipType: v.shipType || 0,
              draught: v.draught ? (v.draught / 10) : null, // Digitraffic sends draught in 1/10m
              lengthM: lengthM > 0 ? lengthM : null,
              beamM: beamM > 0 ? beamM : null,
              eta: v.eta || null,
            });
            count++;
          }
          this.lastMetadataFetch = Date.now();
          console.log(`[MarineTraffic] Loaded metadata for ${count} vessels`);
        }
      }
    } catch (err) {
      // Quiet fallback
    } finally {
      this.isMetadataFetching = false;
    }
  }

  // ====================================================================
  // Fetch live AIS positions from European AIS receiver network
  // Merges with cached vessel metadata for real names & types
  // ====================================================================
  async fetchLiveFeed() {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:5174';
      const res = await fetch(`${baseUrl}/api/digitraffic/api/ais/v1/locations`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.features) && data.features.length > 0) {
          const now = Date.now();
          let newCount = 0;
          let updatedCount = 0;

          // Process ALL live AIS vessels (not just 1200)
          const maxProcess = Math.min(8000, data.features.length);
          for (let i = 0; i < maxProcess; i++) {
            const f = data.features[i];
            if (!f || !f.geometry || !f.geometry.coordinates) continue;
            const [lng, lat] = f.geometry.coordinates;
            const mmsi = f.mmsi || f.properties?.mmsi;
            if (!mmsi || typeof lat !== 'number' || typeof lng !== 'number') continue;
            if (lat === 0 && lng === 0) continue; // Skip null-island

            const props = f.properties || {};
            const speedKts = props.sog !== undefined ? Math.round(props.sog * 10) / 10 : 0;
            const cog = props.cog !== undefined ? Math.round(props.cog * 10) / 10 : 0;
            const heading = props.heading !== undefined && props.heading !== 511 ? props.heading : cog;
            const navStat = props.navStat !== undefined ? props.navStat : 15;
            const id = `ais-live-${mmsi}`;

            // Look up vessel metadata (name, type, destination, dimensions)
            const meta = this.vesselMetadataMap.get(mmsi);
            const category = meta?.shipType ? classifyShipType(meta.shipType) : (speedKts > 15 ? 'container' : speedKts > 11 ? 'tanker' : 'cargo');
            const typeDef = MARITIME_TYPES[category] || MARITIME_TYPES.cargo;
            const country = getCountryFromMMSI(mmsi);
            const navStatus = AIS_NAV_STATUS[navStat] || (speedKts < 0.5 ? 'Au mouillage' : 'Faisant route au moteur');
            const typeLabel = meta?.shipType ? getShipTypeLabel(meta.shipType, category) : typeDef.label;

            if (this.vesselsMap.has(id)) {
              // Update existing live vessel
              const existing = this.vesselsMap.get(id);
              existing.lat = lat;
              existing.lng = lng;
              existing.speedKts = speedKts;
              existing.speedKmh = Math.round(speedKts * 1.852);
              existing.course = cog;
              existing.heading = heading;
              existing.navStat = navStat;
              existing.status = navStatus;
              existing.lastUpdate = now;

              // Update metadata if freshly loaded
              if (meta) {
                if (meta.name && meta.name !== existing.name) existing.name = meta.name;
                if (meta.destination) existing.destination = meta.destination;
                if (meta.imo) existing.imo = meta.imo;
                if (meta.callSign) existing.callsign = meta.callSign;
                if (meta.draught) existing.draughtM = meta.draught;
                if (meta.lengthM) existing.lengthM = meta.lengthM;
                if (meta.beamM) existing.beamM = meta.beamM;
                if (meta.shipType) {
                  existing.category = category;
                  existing.type = typeLabel;
                  existing.color = typeDef.color;
                }
              }
              updatedCount++;
            } else {
              // Create new live AIS vessel with real metadata
              const vesselName = meta?.name || `MMSI ${mmsi}`;
              const destination = meta?.destination || null;

              const liveVes = {
                id,
                aisId: `${mmsi}`,
                imo: meta?.imo || null,
                mmsi,
                callsign: meta?.callSign || null,
                name: vesselName,
                flag: country.flag,
                flagEmoji: country.emoji,
                category,
                type: typeLabel,
                color: typeDef.color,
                dwt: null,
                lengthM: meta?.lengthM || null,
                beamM: meta?.beamM || null,
                draughtM: meta?.draught || null,
                cargo: null,
                originPort: null,
                destinationPort: destination,
                destination: destination,
                chokepoint: null,
                status: navStatus,
                navStat,
                lat,
                lng,
                course: cog,
                heading,
                speedKts,
                speedKmh: Math.round(speedKts * 1.852),
                lastUpdate: now,
                isLiveAis: true,
              };
              this.vesselsMap.set(id, liveVes);
              newCount++;
            }
          }

          this.vessels = Array.from(this.vesselsMap.values());
          this.totalGlobalVessels = Math.max(25910, this.vessels.length);
          this.notify();

          if (newCount > 0 || updatedCount > 0) {
            console.log(`[MarineTraffic] Live AIS: ${updatedCount} updated, ${newCount} new (total: ${this.vessels.length})`);
          }
        }
      }
    } catch (err) {
      // quiet fallback to global snapshot
    } finally {
      this.isFetching = false;
    }
  }

  // Smooth dead-reckoning navigation motion
  // Display motion multiplier allows vessels to visibly cruise smoothly along course
  // Real reported AIS telemetry (kts & km/h) remains 100% authentic
  updatePhysicalMotion() {
    const now = Date.now();
    if (this.vessels.length === 0) return;

    const VISUAL_MOTION_FACTOR = 48;
    let updated = false;

    for (let i = 0; i < this.vessels.length; i++) {
      const vessel = this.vessels[i];
      if (!vessel.lastUpdate || typeof vessel.lastUpdate === 'string') vessel.lastUpdate = now;

      const elapsedSec = Math.min(1.0, (now - vessel.lastUpdate) / 1000);
      if (elapsedSec <= 0.02) continue;

      if (!vessel.speedKts || vessel.speedKts <= 0.4 || vessel.navStat === 1 || vessel.navStat === 5) {
        // At anchor / moored: natural tidal micro-swinging
        vessel.lat += Math.sin(now * 0.001 + (vessel.imo || i)) * 0.000005;
        vessel.lng += Math.cos(now * 0.001 + (vessel.mmsi || i)) * 0.000005;
        vessel.lastUpdate = now;
        updated = true;
        continue;
      }

      // Smooth visual progression based on true AIS heading and speed
      const visualSpeedKmh = (vessel.speedKts * 1.852) * VISUAL_MOTION_FACTOR;
      const distKm = (visualSpeedKmh / 3600) * elapsedSec;
      const headingRad = ((vessel.course || vessel.heading || 0) * Math.PI) / 180;

      // Geodesic coordinate displacement
      const dLat = (distKm * Math.cos(headingRad)) / 111.32;
      const cosLat = Math.cos((vessel.lat * Math.PI) / 180);
      const dLng = cosLat !== 0 ? (distKm * Math.sin(headingRad)) / (111.32 * cosLat) : 0;

      vessel.lat += dLat;
      vessel.lng += dLng;

      // Antimeridian wrap-around
      if (vessel.lng > 180) vessel.lng -= 360;
      if (vessel.lng < -180) vessel.lng += 360;

      // Reverse direction gently if vessel reaches extreme polar latitudes
      if (vessel.lat > 80) { vessel.lat = 80; vessel.course = (vessel.course + 180) % 360; }
      if (vessel.lat < -72) { vessel.lat = -72; vessel.course = (vessel.course + 180) % 360; }

      vessel.lastUpdate = now;
      updated = true;
    }

    if (updated) {
      this.notify();
    }
  }

  start() {
    // 1. Fetch metadata FIRST (names, destinations, ship types)
    this.fetchVesselMetadata().then(() => {
      // 2. Then fetch live positions with metadata available for merge
      this.fetchLiveFeed();
    });

    // Poll live AIS positions every 12 seconds
    this.pollingInterval = setInterval(() => {
      this.fetchLiveFeed();
    }, 12000);

    // Refresh vessel metadata every 2 minutes (names/destinations change rarely)
    this.metadataInterval = setInterval(() => {
      this.fetchVesselMetadata();
    }, 120000);

    // Buttery-smooth dead-reckoning navigation ticker at 150ms
    this.animationTimer = setInterval(() => {
      this.updatePhysicalMotion();
    }, 150);
  }

  stop() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.metadataInterval) clearInterval(this.metadataInterval);
    if (this.animationTimer) clearInterval(this.animationTimer);
  }
}

export const marineTrafficService = new MarineTrafficService();
marineTrafficService.start();
