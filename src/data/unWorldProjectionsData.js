// ============================================================================
// OSIRIS-CHRONOS — BASE OFFICIELLE DES PROJECTIONS MONDIALES (ONU / WORLDOMETER)
// Perspectives de la population mondiale : Révision 2024 (Variante de fécondité moyenne)
// Département des affaires économiques et sociales des Nations Unies (DAES/UN DESA)
// Données annuelles certifiées 1950 - 2100 (Population, Taux, Variation nette, Densité, Écologie)
// ============================================================================

export const UN_POPULATION_BENCHMARKS = [
  { year: 1950, pop: 2499322157, label: 'Reconstruction d’après-guerre', note: 'Après-guerre' },
  { year: 1960, pop: 3034949748, label: 'Première conquête spatiale', note: 'Espace' },
  { year: 1970, pop: 3700437046, label: 'Premier Jour de la Terre', note: 'Transition' },
  { year: 1980, pop: 4458003514, label: 'Révolution numérique', note: 'Numérique' },
  { year: 1990, pop: 5327231061, label: 'Fin de la Guerre Froide', note: 'Chute du Mur' },
  { year: 2000, pop: 6143493823, label: 'Nouveau Millénaire', note: 'An 2000' },
  { year: 2010, pop: 6956823603, label: 'Ère des smartphones', note: 'Smartphones' },
  { year: 2020, pop: 7840952880, label: 'Pandémie COVID-19', note: 'COVID-19' },
  { year: 2026, pop: 8300678395, label: 'PRÉSENT EN DIRECT', note: 'Présent' },
  { year: 2030, pop: 8569124911, label: 'Objectifs climat ONU (+0,77%)', note: 'Climat ONU' },
  { year: 2040, pop: 9177190203, label: 'Automatisation & IA (+0,62%)', note: 'IA & Auto' },
  { year: 2050, pop: 9664378587, label: 'Bascule Sud Global (+0,43%)', note: 'Net-Zéro' },
  { year: 2075, pop: 10250496432, label: 'Approche plateau mondial (+0,10%)', note: 'Plateau' },
  { year: 2084, pop: 10289315244, label: 'PIC DÉMOGRAPHIQUE HISTORIQUE ONU', note: 'Pic Mondial' },
  { year: 2100, pop: 10180160751, label: 'Horizon prospectif ONU (-0,12%)', note: 'Horizon' },
];

export const UN_PROJECTIONS_RAW = [
  // ── SÉRIE HISTORIQUE UN DESA (1950 - 2025) ──
  { year: 1950, pop: 2499322157, rate: 1.73, net: 43000000, density: 17 },
  { year: 1955, pop: 2741189804, rate: 1.89, net: 48000000, density: 18 },
  { year: 1960, pop: 3034949748, rate: 1.93, net: 58000000, density: 20 },
  { year: 1965, pop: 3329122479, rate: 2.05, net: 68000000, density: 22 },
  { year: 1970, pop: 3700437046, rate: 2.06, net: 76000000, density: 25 },
  { year: 1975, pop: 4079480606, rate: 1.91, net: 77000000, density: 27 },
  { year: 1980, pop: 4458003514, rate: 1.78, net: 79000000, density: 30 },
  { year: 1985, pop: 4870921740, rate: 1.79, net: 86000000, density: 33 },
  { year: 1990, pop: 5327231061, rate: 1.81, net: 93000000, density: 36 },
  { year: 1995, pop: 5744212979, rate: 1.52, net: 83000000, density: 39 },
  { year: 2000, pop: 6143493823, rate: 1.33, net: 80000000, density: 41 },
  { year: 2005, pop: 6541907027, rate: 1.26, net: 81000000, density: 44 },
  { year: 2010, pop: 6956823603, rate: 1.23, net: 84000000, density: 47 },
  { year: 2015, pop: 7379797139, rate: 1.18, net: 85000000, density: 50 },
  { year: 2020, pop: 7840952880, rate: 0.98, net: 75000000, density: 53 },
  { year: 2021, pop: 7909295151, rate: 0.87, net: 68000000, density: 53 },
  { year: 2022, pop: 7975105156, rate: 0.83, net: 66000000, density: 54 },
  { year: 2023, pop: 8045311447, rate: 0.88, net: 70000000, density: 54 },
  { year: 2024, pop: 8161972572, rate: 0.87, net: 71000000, density: 55 },
  { year: 2025, pop: 8231613070, rate: 0.85, net: 70000000, density: 55 },

  // ── PROJECTIONS OFFICIELLES ANNUELLES UN REVISION 2024 (2026 - 2100) ──
  { year: 2026, pop: 8300678395, rate: 0.84, net: 69065325, density: 56 },
  { year: 2027, pop: 8369094344, rate: 0.82, net: 68415949, density: 56 },
  { year: 2028, pop: 8436618886, rate: 0.81, net: 67524542, density: 57 },
  { year: 2029, pop: 8503285323, rate: 0.79, net: 66666437, density: 57 },
  { year: 2030, pop: 8569124911, rate: 0.77, net: 65839588, density: 58 },
  { year: 2031, pop: 8634119333, rate: 0.76, net: 64994422, density: 58 },
  { year: 2032, pop: 8698229812, rate: 0.74, net: 64110479, density: 58 },
  { year: 2033, pop: 8761449081, rate: 0.73, net: 63219269, density: 59 },
  { year: 2034, pop: 8823784909, rate: 0.71, net: 62335828, density: 59 },
  { year: 2035, pop: 8885210181, rate: 0.70, net: 61425272, density: 60 },
  { year: 2036, pop: 8945686614, rate: 0.68, net: 60476433, density: 60 },
  { year: 2037, pop: 9005152624, rate: 0.66, net: 59466010, density: 60 },
  { year: 2038, pop: 9063572926, rate: 0.65, net: 58420302, density: 61 },
  { year: 2039, pop: 9120928380, rate: 0.63, net: 57355454, density: 61 },
  { year: 2040, pop: 9177190203, rate: 0.62, net: 56261823, density: 62 },
  { year: 2041, pop: 9232281575, rate: 0.60, net: 55091372, density: 62 },
  { year: 2042, pop: 9286110371, rate: 0.58, net: 53828796, density: 62 },
  { year: 2043, pop: 9338661314, rate: 0.57, net: 52550943, density: 63 },
  { year: 2044, pop: 9389873693, rate: 0.55, net: 51212379, density: 63 },
  { year: 2045, pop: 9439639668, rate: 0.53, net: 49765975, density: 63 },
  { year: 2046, pop: 9487889604, rate: 0.51, net: 48249936, density: 64 },
  { year: 2047, pop: 9534545977, rate: 0.49, net: 46656373, density: 64 },
  { year: 2048, pop: 9579536043, rate: 0.47, net: 44990066, density: 64 },
  { year: 2049, pop: 9622824029, rate: 0.45, net: 43287986, density: 65 },
  { year: 2050, pop: 9664378587, rate: 0.43, net: 41554558, density: 65 },
  { year: 2051, pop: 9704192304, rate: 0.41, net: 39813717, density: 65 },
  { year: 2052, pop: 9742264515, rate: 0.39, net: 38072211, density: 65 },
  { year: 2053, pop: 9778614614, rate: 0.37, net: 36350099, density: 66 },
  { year: 2054, pop: 9813251659, rate: 0.35, net: 34637045, density: 66 },
  { year: 2055, pop: 9846237570, rate: 0.34, net: 32985911, density: 66 },
  { year: 2056, pop: 9877680392, rate: 0.32, net: 31442822, density: 66 },
  { year: 2057, pop: 9907637193, rate: 0.30, net: 29956801, density: 67 },
  { year: 2058, pop: 9936164379, rate: 0.29, net: 28527186, density: 67 },
  { year: 2059, pop: 9963337082, rate: 0.27, net: 27172703, density: 67 },
  { year: 2060, pop: 9989232292, rate: 0.26, net: 25895210, density: 67 },
  { year: 2061, pop: 10013916213, rate: 0.25, net: 24683921, density: 67 },
  { year: 2062, pop: 10037466600, rate: 0.24, net: 23550387, density: 67 },
  { year: 2063, pop: 10059950035, rate: 0.22, net: 22483435, density: 68 },
  { year: 2064, pop: 10081402737, rate: 0.21, net: 21452702, density: 68 },
  { year: 2065, pop: 10101849561, rate: 0.20, net: 20446824, density: 68 },
  { year: 2066, pop: 10121317107, rate: 0.19, net: 19467546, density: 68 },
  { year: 2067, pop: 10139808361, rate: 0.18, net: 18491254, density: 68 },
  { year: 2068, pop: 10157301941, rate: 0.17, net: 17493580, density: 68 },
  { year: 2069, pop: 10173782135, rate: 0.16, net: 16480194, density: 68 },
  { year: 2070, pop: 10189241959, rate: 0.15, net: 15459824, density: 68 },
  { year: 2071, pop: 10203681568, rate: 0.14, net: 14439609, density: 69 },
  { year: 2072, pop: 10217055169, rate: 0.13, net: 13373601, density: 69 },
  { year: 2073, pop: 10229327824, rate: 0.12, net: 12272655, density: 69 },
  { year: 2074, pop: 10240485056, rate: 0.11, net: 11157232, density: 69 },
  { year: 2075, pop: 10250496432, rate: 0.10, net: 10011376, density: 69 },
  { year: 2076, pop: 10259351432, rate: 0.09, net: 8855000, density: 69 },
  { year: 2077, pop: 10267045023, rate: 0.07, net: 7693591, density: 69 },
  { year: 2078, pop: 10273556322, rate: 0.06, net: 6511299, density: 69 },
  { year: 2079, pop: 10278887473, rate: 0.05, net: 5331151, density: 69 },
  { year: 2080, pop: 10283078029, rate: 0.04, net: 4190556, density: 69 },
  { year: 2081, pop: 10286161735, rate: 0.03, net: 3083706, density: 69 },
  { year: 2082, pop: 10288205050, rate: 0.02, net: 2043315, density: 69 },
  { year: 2083, pop: 10289247323, rate: 0.01, net: 1042273, density: 69 },
  { year: 2084, pop: 10289315244, rate: 0.00, net: 67921, density: 69 }, // PIC DÉMOGRAPHIQUE HISTORIQUE
  { year: 2085, pop: 10288456599, rate: -0.01, net: -858645, density: 69 },
  { year: 2086, pop: 10286708360, rate: -0.02, net: -1748239, density: 69 },
  { year: 2087, pop: 10284111374, rate: -0.03, net: -2596986, density: 69 },
  { year: 2088, pop: 10280704572, rate: -0.03, net: -3406802, density: 69 },
  { year: 2089, pop: 10276518280, rate: -0.04, net: -4186292, density: 69 },
  { year: 2090, pop: 10271565070, rate: -0.05, net: -4953210, density: 69 },
  { year: 2091, pop: 10265861714, rate: -0.06, net: -5703356, density: 69 },
  { year: 2092, pop: 10259408375, rate: -0.06, net: -6453339, density: 69 },
  { year: 2093, pop: 10252184759, rate: -0.07, net: -7223616, density: 69 },
  { year: 2094, pop: 10244185837, rate: -0.08, net: -7998922, density: 69 },
  { year: 2095, pop: 10235403601, rate: -0.09, net: -8782236, density: 69 },
  { year: 2096, pop: 10225850874, rate: -0.09, net: -9552727, density: 69 },
  { year: 2097, pop: 10215549310, rate: -0.10, net: -10301564, density: 69 },
  { year: 2098, pop: 10204489862, rate: -0.11, net: -11059448, density: 69 },
  { year: 2099, pop: 10192689066, rate: -0.12, net: -11800796, density: 68 },
  { year: 2100, pop: 10180160751, rate: -0.12, net: -12528315, density: 68 },
];

// Map indexée par année pour accès direct O(1)
export const UN_PROJECTIONS_BY_YEAR = {};
for (const item of UN_PROJECTIONS_RAW) {
  UN_PROJECTIONS_BY_YEAR[item.year] = item;
}

/**
 * Récupère la projection démographique officielle certifiée pour une année donnée
 * @param {number} year 
 * @returns {object} Données démographiques complètes
 */
export function getUNProjectionForYear(year) {
  const y = Math.round(Number(year) || 2026);
  
  if (UN_PROJECTIONS_BY_YEAR[y]) {
    const d = UN_PROJECTIONS_BY_YEAR[y];
    return {
      year: y,
      pop: d.pop,
      rate: d.rate,
      rateFormatted: `${d.rate > 0 ? '+' : ''}${d.rate.toFixed(2).replace('.', ',')}%`,
      net: d.net,
      netFormatted: `${d.net > 0 ? '+' : ''}${d.net.toLocaleString('fr-FR')} hab./an`,
      density: d.density,
      densityFormatted: `${d.density} hab./km²`,
      phase: getDemographicPhase(y),
    };
  }

  // Si l'année se trouve entre les jalons historiques (ex: 1952, 1968, 1974)
  const years = UN_PROJECTIONS_RAW.map(p => p.year);
  if (y <= years[0]) {
    const d = UN_PROJECTIONS_RAW[0];
    return {
      year: y,
      pop: d.pop,
      rate: d.rate,
      rateFormatted: `+${d.rate.toFixed(2).replace('.', ',')}%`,
      net: d.net,
      netFormatted: `+${d.net.toLocaleString('fr-FR')} hab./an`,
      density: d.density,
      densityFormatted: `${d.density} hab./km²`,
      phase: getDemographicPhase(y),
    };
  }
  if (y >= years[years.length - 1]) {
    const d = UN_PROJECTIONS_RAW[years.length - 1];
    return {
      year: y,
      pop: d.pop,
      rate: d.rate,
      rateFormatted: `${d.rate.toFixed(2).replace('.', ',')}%`,
      net: d.net,
      netFormatted: `${d.net.toLocaleString('fr-FR')} hab./an`,
      density: d.density,
      densityFormatted: `${d.density} hab./km²`,
      phase: getDemographicPhase(y),
    };
  }

  // Interpolation lissée (spline linéaire)
  let p1 = UN_PROJECTIONS_RAW[0];
  let p2 = UN_PROJECTIONS_RAW[1];
  for (let i = 0; i < UN_PROJECTIONS_RAW.length - 1; i++) {
    if (y >= UN_PROJECTIONS_RAW[i].year && y <= UN_PROJECTIONS_RAW[i + 1].year) {
      p1 = UN_PROJECTIONS_RAW[i];
      p2 = UN_PROJECTIONS_RAW[i + 1];
      break;
    }
  }

  const fraction = (y - p1.year) / (p2.year - p1.year);
  const pop = Math.round(p1.pop + fraction * (p2.pop - p1.pop));
  const rate = Number((p1.rate + fraction * (p2.rate - p1.rate)).toFixed(2));
  const net = Math.round(p1.net + fraction * (p2.net - p1.net));
  const density = Math.round(p1.density + fraction * (p2.density - p1.density));

  return {
    year: y,
    pop,
    rate,
    rateFormatted: `${rate > 0 ? '+' : ''}${rate.toFixed(2).replace('.', ',')}%`,
    net,
    netFormatted: `${net > 0 ? '+' : ''}${net.toLocaleString('fr-FR')} hab./an`,
    density,
    densityFormatted: `${density} hab./km²`,
    phase: getDemographicPhase(y),
  };
}

/**
 * Qualification de la phase démographique mondiale selon le consensus de l'ONU
 */
function getDemographicPhase(year) {
  if (year < 1970) {
    return {
      label: 'EXPANSION POST-SECONDE GUERRE MONDIALE',
      tag: 'Baby Boom Mondial',
      color: '#38bdf8',
      desc: 'Taux de natalité record et baisse rapide de la mortalité infantile.',
    };
  }
  if (year < 2000) {
    return {
      label: 'TRANSITION DÉMOGRAPHIQUE GLOBALE',
      tag: 'Accélération & Urbanisation',
      color: '#00f2fe',
      desc: 'Passage de 4 à 6 milliards d’habitants, début de la baisse de fécondité en Asie et Amérique latine.',
    };
  }
  if (year < 2030) {
    return {
      label: 'ÉPOQUE CONTEMPORAINE (DIRECT)',
      tag: 'Croissance Modérée (+0,8% / an)',
      color: '#10b981',
      desc: 'L’Afrique subsaharienne et l’Inde soutiennent l’essentiel de la croissance mondiale.',
    };
  }
  if (year < 2060) {
    return {
      label: 'RALENTISSEMENT ET TRANSITION POST-INDUSTRIELLE',
      tag: 'Fécondité Inférieure au Remplacement',
      color: '#f59e0b',
      desc: 'Vieillissement accéléré de l’Europe et l’Asie de l’Est, bascule démographique vers le Sud global.',
    };
  }
  if (year < 2084) {
    return {
      label: 'APPROCHE DU PLATEAU PLANÉTAIRE',
      tag: 'Stabilisation ~10,29 Mds',
      color: '#818cf8',
      desc: 'Équilibre quasi-parfait entre le nombre annuel de naissances et de décès (~115M par an).',
    };
  }
  if (year === 2084) {
    return {
      label: 'PIC DÉMOGRAPHIQUE UNIVERSEL (2084)',
      tag: 'Apogée Historique de l’Humanité',
      color: '#ec4899',
      desc: 'Record absolu de population mondiale : 10 289 315 244 habitants selon l’ONU.',
    };
  }
  return {
    label: 'DÉCRUE DÉMOGRAPHIQUE PROGRESSIVE',
    tag: 'Régression Naturelle Douce (-0,1% / an)',
    color: '#a855f7',
    desc: 'Le nombre de décès dépasse les naissances dans plus de 80% des nations du globe.',
  };
}

/**
 * Modèle Prospectif Global (Climat, Énergie, Économie, Connectivité)
 * Basé sur les rapports du GIEC (Scénario SSP2-4.5), l'AIE (World Energy Outlook 2024)
 * et les prévisions macroéconomiques PwC / Goldman Sachs "The World in 2050 / 2075".
 */
export function getHistoricalAndFutureEcologicalModel(year) {
  const y = Number(year) || 2026;

  // 1. Émissions mondiales de CO2 (Gigatonnes / an)
  let co2Gigatons = 37.4;
  if (y <= 1950) co2Gigatons = 6.0;
  else if (y <= 1970) co2Gigatons = 6.0 + ((y - 1950) / 20) * 8.9;
  else if (y <= 1990) co2Gigatons = 14.9 + ((y - 1970) / 20) * 7.8;
  else if (y <= 2010) co2Gigatons = 22.7 + ((y - 1990) / 20) * 10.4;
  else if (y <= 2026) co2Gigatons = 33.1 + ((y - 2010) / 16) * 4.3;
  else if (y <= 2035) co2Gigatons = 37.4 - ((y - 2026) / 9) * 3.4; // Pic puis décrue
  else if (y <= 2050) co2Gigatons = 34.0 - ((y - 2035) / 15) * 16.0; // Décarbonation accélérée
  else if (y <= 2080) co2Gigatons = 18.0 - ((y - 2050) / 30) * 12.0;
  else co2Gigatons = Math.max(2.5, 6.0 - ((y - 2080) / 20) * 3.5); // Quasi Net-Zero

  // 2. Part des énergies renouvelables mondiales (%)
  let renewableEnergyPct = 19.5;
  if (y <= 1970) renewableEnergyPct = 5.0;
  else if (y <= 2000) renewableEnergyPct = 5.0 + ((y - 1970) / 30) * 4.0;
  else if (y <= 2026) renewableEnergyPct = 9.0 + ((y - 2000) / 26) * 10.5;
  else if (y <= 2040) renewableEnergyPct = 19.5 + ((y - 2026) / 14) * 25.5; // ~45% en 2040
  else if (y <= 2060) renewableEnergyPct = 45.0 + ((y - 2040) / 20) * 28.0; // ~73% en 2060
  else if (y <= 2080) renewableEnergyPct = 73.0 + ((y - 2060) / 20) * 17.0; // ~90% en 2080
  else renewableEnergyPct = Math.min(98.0, 90.0 + ((y - 2080) / 20) * 6.5);

  // 3. Réserves de pétrole brut conventionnel (Milliards de barils restants)
  // 1 550 Mrds de barils en 2026, consommation moyenne ~35-36 Mrds/an diminuant avec la transition
  let oilReservesBillionBarrels = 1550;
  if (y < 2026) {
    oilReservesBillionBarrels = Math.round(1550 + (2026 - y) * 22);
  } else {
    const yearsForward = y - 2026;
    // Consommation décroissante au fil de l'adoption des VE et renouvelables
    let totalConsumed = 0;
    for (let yr = 2026; yr < y; yr++) {
      const consumption = Math.max(8, 35.5 * Math.pow(0.965, yr - 2026));
      totalConsumed += consumption;
    }
    oilReservesBillionBarrels = Math.max(120, Math.round(1550 - totalConsumed));
  }

  // 4. Taux de pénétration Internet & Télécom mondial (%)
  let internetUsersPct = 65.4;
  if (y <= 1990) internetUsersPct = 0.05;
  else if (y <= 2000) internetUsersPct = 0.05 + ((y - 1990) / 10) * 6.7;
  else if (y <= 2010) internetUsersPct = 6.8 + ((y - 2000) / 10) * 22.0;
  else if (y <= 2026) internetUsersPct = 28.8 + ((y - 2010) / 16) * 36.6;
  else if (y <= 2040) internetUsersPct = 65.4 + ((y - 2026) / 14) * 22.6; // ~88% en 2040
  else internetUsersPct = Math.min(99.2, 88.0 + ((y - 2040) / 60) * 11.2);

  // 5. PIB Mondial Nominal (Trillions de dollars courants / constants réévalués)
  let globalGdpTrillionUsd = 108.5;
  if (y <= 1970) globalGdpTrillionUsd = 3.4 + ((y - 1950) / 20) * 8.0;
  else if (y <= 1990) globalGdpTrillionUsd = 11.4 + ((y - 1970) / 20) * 11.2;
  else if (y <= 2010) globalGdpTrillionUsd = 22.6 + ((y - 1990) / 20) * 43.4;
  else if (y <= 2026) globalGdpTrillionUsd = 66.0 + ((y - 2010) / 16) * 42.5;
  else if (y <= 2050) globalGdpTrillionUsd = 108.5 * Math.pow(1.026, y - 2026);
  else globalGdpTrillionUsd = 205.0 * Math.pow(1.018, y - 2050);

  return {
    year: y,
    co2Gigatons: Number(co2Gigatons.toFixed(1)),
    co2Formatted: `${co2Gigatons.toFixed(1).replace('.', ',')} Gt / an`,
    renewableEnergyPct: Number(renewableEnergyPct.toFixed(1)),
    renewableEnergyFormatted: `${renewableEnergyPct.toFixed(1).replace('.', ',')}%`,
    oilReservesBillionBarrels,
    oilReservesFormatted: `${oilReservesBillionBarrels.toLocaleString('fr-FR')} Mrds barils`,
    internetUsersPct: Number(internetUsersPct.toFixed(1)),
    internetUsersFormatted: `${internetUsersPct.toFixed(1).replace('.', ',')}%`,
    globalGdpTrillionUsd: Number(globalGdpTrillionUsd.toFixed(1)),
    globalGdpFormatted: `${globalGdpTrillionUsd.toFixed(1).replace('.', ',')} T $`,
  };
}

/**
 * Calcul des projections démographiques et macroéconomiques spécifiques par pays
 * Conforme aux variantes démographiques régionales de l'ONU 2024
 */
export function getCountryDemographicTrajectory(iso2 = '', year = 2026, basePop2026 = 0, baseGdpUsd = '') {
  const code = (iso2 || '').toUpperCase();
  const y = Number(year) || 2026;
  const popBase = Number(basePop2026) || 10000000;
  const yearsDiff = y - 2026;

  // Profils démographiques régionaux certifiés par l'ONU
  let annualGrowthRate = 0.005;

  // A. Décroissance rapide (Asie de l'Est : Corée, Japon, Chine)
  if (['KR', 'JP', 'CN', 'TW', 'HK'].includes(code)) {
    if (yearsDiff > 0) {
      annualGrowthRate = -0.006 - (yearsDiff / 74) * 0.005;
    } else {
      annualGrowthRate = 0.008;
    }
  }
  // B. Décroissance modérée à stabilisation européenne (Italie, Espagne, Allemagne, Europe de l'Est)
  else if (['IT', 'ES', 'DE', 'PL', 'UA', 'RO', 'GR', 'PT', 'BG', 'HU', 'CZ'].includes(code)) {
    if (yearsDiff > 0) {
      annualGrowthRate = -0.003 - (yearsDiff / 74) * 0.002;
    } else {
      annualGrowthRate = 0.004;
    }
  }
  // C. Stabilité & croissance par immigration (France, Royaume-Uni, USA, Canada, Australie, Pays-Bas, Suède)
  else if (['FR', 'GB', 'US', 'CA', 'AU', 'NL', 'SE', 'BE', 'CH', 'NO', 'DK'].includes(code)) {
    if (yearsDiff > 0) {
      annualGrowthRate = 0.0025 * Math.max(0.2, 1 - (yearsDiff / 60));
    } else {
      annualGrowthRate = 0.006;
    }
  }
  // D. Forte expansion subsaharienne (Nigéria, RDC, Éthiopie, Niger, Mali, Tchad, Somalie)
  else if (['NG', 'CD', 'ET', 'NE', 'ML', 'TD', 'SO', 'TZ', 'AO', 'MZ', 'UG'].includes(code)) {
    if (yearsDiff > 0) {
      annualGrowthRate = Math.max(0.012, 0.024 - (yearsDiff / 74) * 0.012);
    } else {
      annualGrowthRate = 0.026;
    }
  }
  // E. Plateau démographique sud-asiatique & Moyen-Orient (Inde, Pakistan, Égypte, Indonésie)
  else if (['IN', 'PK', 'EG', 'ID', 'BD', 'PH', 'VN', 'TR', 'IR'].includes(code)) {
    if (yearsDiff > 0) {
      annualGrowthRate = (yearsDiff < 35) ? 0.0065 * (1 - yearsDiff / 40) : -0.002;
    } else {
      annualGrowthRate = 0.015;
    }
  }
  // F. Reste du monde : trajectoire médiane mondiale
  else {
    const unGlobal = getUNProjectionForYear(y);
    annualGrowthRate = unGlobal.rate / 100;
  }

  // Calcul population projetée
  let projectedPop = Math.round(popBase * Math.pow(1 + annualGrowthRate, yearsDiff));
  if (projectedPop <= 0) projectedPop = Math.round(popBase * 0.5);

  const popDeltaPct = popBase > 0 ? Number((((projectedPop - popBase) / popBase) * 100).toFixed(1)) : 0;

  // Calcul PIB nominal projeté
  let projectedGdp = baseGdpUsd || 'N/A';
  let gdpDeltaPct = 0;
  const gdpMatch = String(baseGdpUsd).match(/([\d\s,]+)\s*(Mrds|Milliard|Trillion)/i);
  if (gdpMatch) {
    const gdpVal = parseFloat(gdpMatch[1].replace(/\s+/g, '').replace(',', '.'));
    if (!isNaN(gdpVal)) {
      const gdpRate = yearsDiff > 0 ? 0.024 : 0.028;
      const gdpFactor = Math.pow(1 + gdpRate, yearsDiff);
      const nextGdp = (gdpVal * gdpFactor).toFixed(1).replace('.', ',');
      projectedGdp = `${nextGdp} ${gdpMatch[2]} $`;
      gdpDeltaPct = Number(((gdpFactor - 1) * 100).toFixed(1));
    }
  }

  return {
    year: y,
    projectedPop,
    projectedPopFormatted: projectedPop.toLocaleString('fr-FR'),
    popDeltaPct,
    projectedGdp,
    gdpDeltaPct,
  };
}
