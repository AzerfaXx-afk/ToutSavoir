// Worldometer Complete Real-time Indicators Engine
// Models the official indicators from worldometers.info/fr
// High-precision live ticking based on elapsed seconds (year & day)

export const WORLDOMETER_CATEGORIES = [
  { id: 'all', label: 'TOUS LES INDICATEURS', shortLabel: 'TOUS' },
  { id: 'population', label: 'POPULATION MONDIALE', shortLabel: 'POPULATION' },
  { id: 'economy', label: 'GOUVERNEMENT & ÉCONOMIE', shortLabel: 'ÉCONOMIE' },
  { id: 'media', label: 'SOCIÉTÉ & MÉDIAS', shortLabel: 'MÉDIAS' },
  { id: 'environment', label: 'ENVIRONNEMENT', shortLabel: 'ENVIRONNEMENT' },
  { id: 'food', label: 'ALIMENTATION & AGRICULTURE', shortLabel: 'ALIMENTATION' },
  { id: 'water', label: 'EAU POTABLE & RESSOURCES', shortLabel: 'EAU' },
  { id: 'energy', label: 'ÉNERGIE & RÉSERVES', shortLabel: 'ÉNERGIE' },
  { id: 'health', label: 'SANTÉ MONDIALE', shortLabel: 'SANTÉ' },
];

export const METRIC_DEFINITIONS = [
  // 1. POPULATION MONDIALE (Calibré exactement sur worldometers.info)
  {
    id: 'world_pop',
    cat: 'population',
    label: 'Population mondiale actuelle',
    unit: 'habitants',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 2.22,
    baseVal: 8264179671, // Base 01/01/2026 -> At Sept 2026: ~8 316 175 000 hab
    color: 'var(--cyan-bright)',
  },
  {
    id: 'births_year',
    cat: 'population',
    label: 'Naissances cette année',
    unit: 'naissances',
    type: 'counter',
    scope: 'year',
    ratePerSec: 4.195,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
  {
    id: 'births_today',
    cat: 'population',
    label: 'Naissances aujourd’hui',
    unit: 'naissances',
    type: 'counter',
    scope: 'day',
    ratePerSec: 4.195,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
  {
    id: 'deaths_year',
    cat: 'population',
    label: 'Décès cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 1.975,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'deaths_today',
    cat: 'population',
    label: 'Décès aujourd’hui',
    unit: 'décès',
    type: 'counter',
    scope: 'day',
    ratePerSec: 1.975,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'net_growth_year',
    cat: 'population',
    label: 'Croissance démographique cette année',
    unit: 'personnes',
    type: 'counter',
    scope: 'year',
    ratePerSec: 2.22,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'net_growth_today',
    cat: 'population',
    label: 'Croissance démographique nette aujourd’hui',
    unit: 'personnes',
    type: 'counter',
    scope: 'day',
    ratePerSec: 2.22,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },

  // 2. GOUVERNEMENT & ÉCONOMIE (Calibré sur worldometers.info)
  {
    id: 'health_spending_public_today',
    cat: 'economy',
    label: 'Dépenses publiques de santé aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 232535,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
  {
    id: 'education_spending_today',
    cat: 'economy',
    label: 'Dépenses d’éducation publique aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 152033,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'military_spending_today',
    cat: 'economy',
    label: 'Dépenses militaires publiques aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 60946,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'cars_produced_year',
    cat: 'economy',
    label: 'Voitures produites cette année',
    unit: 'véhicules',
    type: 'counter',
    scope: 'year',
    ratePerSec: 2.920,
    baseVal: 0,
    color: '#cbd5e1',
  },
  {
    id: 'bicycles_produced_year',
    cat: 'economy',
    label: 'Vélos produits cette année',
    unit: 'vélos',
    type: 'counter',
    scope: 'year',
    ratePerSec: 5.130,
    baseVal: 0,
    color: '#94a3b8',
  },
  {
    id: 'computers_sold_year',
    cat: 'economy',
    label: 'Ordinateurs vendus cette année',
    unit: 'unités',
    type: 'counter',
    scope: 'year',
    ratePerSec: 7.013,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },

  // 3. SOCIÉTÉ & MÉDIAS
  {
    id: 'google_searches_today',
    cat: 'media',
    label: 'Recherches Google effectuées aujourd’hui',
    unit: 'requêtes',
    type: 'counter',
    scope: 'day',
    ratePerSec: 98380,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'emails_today',
    cat: 'media',
    label: 'Emails envoyés aujourd’hui',
    unit: 'messages',
    type: 'counter',
    scope: 'day',
    ratePerSec: 4050925,
    baseVal: 0,
    color: '#38bdf8',
  },
  {
    id: 'smartphones_sold_today',
    cat: 'media',
    label: 'Smartphones vendus aujourd’hui',
    unit: 'appareils',
    type: 'counter',
    scope: 'day',
    ratePerSec: 43.98,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
  {
    id: 'blog_posts_today',
    cat: 'media',
    label: 'Billets de blog publiés aujourd’hui',
    unit: 'articles',
    type: 'counter',
    scope: 'day',
    ratePerSec: 86.8,
    baseVal: 0,
    color: '#a855f7',
  },
  {
    id: 'books_published_year',
    cat: 'media',
    label: 'Nouveaux titres de livres publiés cette année',
    unit: 'ouvrages',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.079,
    baseVal: 0,
    color: '#cbd5e1',
  },

  // 4. ENVIRONNEMENT
  {
    id: 'forest_loss_year',
    cat: 'environment',
    label: 'Forêts perdues cette année',
    unit: 'hectares',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.317,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'co2_emissions_year',
    cat: 'environment',
    label: 'Émissions de CO₂ cette année',
    unit: 'tonnes métriques',
    type: 'counter',
    scope: 'year',
    ratePerSec: 1166,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'desertification_year',
    cat: 'environment',
    label: 'Terres devenues désertiques cette année',
    unit: 'hectares',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.380,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'toxic_chemicals_year',
    cat: 'environment',
    label: 'Produits toxiques rejetés dans l’environnement',
    unit: 'tonnes',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.317,
    baseVal: 0,
    color: '#ec4899',
  },

  // 5. NOURRITURE & AGRICULTURE
  {
    id: 'undernourished',
    cat: 'food',
    label: 'Personnes sous-alimentées dans le monde',
    unit: 'personnes',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 0.289,
    baseVal: 735120000,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'overweight',
    cat: 'food',
    label: 'Personnes en surpoids dans le monde',
    unit: 'personnes',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 0.65,
    baseVal: 1720450000,
    color: 'var(--amber-warn)',
  },
  {
    id: 'hunger_deaths_today',
    cat: 'food',
    label: 'Décès dus à la faim aujourd’hui',
    unit: 'décès',
    type: 'counter',
    scope: 'day',
    ratePerSec: 0.289,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'obesity_cost_usa_today',
    cat: 'food',
    label: 'Dépenses maladies liées au surpoids aux USA',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 5787,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },

  // 6. EAU
  {
    id: 'water_consumed_year',
    cat: 'water',
    label: 'Consommation mondiale d’eau cette année',
    unit: 'millions de litres',
    type: 'counter',
    scope: 'year',
    ratePerSec: 136352,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'water_deaths_year',
    cat: 'water',
    label: 'Décès dus aux maladies d’origine hydrique',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.108,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'no_safe_water',
    cat: 'water',
    label: 'Personnes sans accès à l’eau potable saine',
    unit: 'personnes',
    type: 'static',
    scope: 'instant',
    ratePerSec: 0,
    baseVal: 771480000,
    color: 'var(--amber-warn)',
  },

  // 7. ÉNERGIE & RESSOURCES
  {
    id: 'energy_today_mwh',
    cat: 'energy',
    label: 'Énergie totale consommée aujourd’hui',
    unit: 'MWh',
    type: 'counter',
    scope: 'day',
    ratePerSec: 5324,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
  {
    id: 'oil_days_left',
    cat: 'energy',
    label: 'Jours avant épuisement du pétrole',
    unit: 'jours restants (~40 ans)',
    type: 'countdown',
    scope: 'fixed_countdown',
    baseVal: 14812,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'gas_days_left',
    cat: 'energy',
    label: 'Jours avant épuisement du gaz naturel',
    unit: 'jours restants (~154 ans)',
    type: 'countdown',
    scope: 'fixed_countdown',
    baseVal: 56194,
    color: 'var(--amber-warn)',
  },
  {
    id: 'coal_days_left',
    cat: 'energy',
    label: 'Jours avant épuisement du charbon',
    unit: 'jours restants (~407 ans)',
    type: 'countdown',
    scope: 'fixed_countdown',
    baseVal: 148420,
    color: 'var(--cyan-bright)',
  },

  // 8. SANTÉ MONDIALE
  {
    id: 'infectious_deaths_year',
    cat: 'health',
    label: 'Décès dus aux maladies transmissibles',
    unit: 'cette année',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.412,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'under5_deaths_year',
    cat: 'health',
    label: 'Décès d’enfants de moins de 5 ans',
    unit: 'cette année',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.158,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'abortions_year',
    cat: 'health',
    label: 'Avortements pratiqués cette année',
    unit: 'actes',
    type: 'counter',
    scope: 'year',
    ratePerSec: 2.314,
    baseVal: 0,
    color: '#cbd5e1',
  },
  {
    id: 'smoking_deaths_year',
    cat: 'health',
    label: 'Décès causés par le tabagisme cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.253,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'alcohol_deaths_year',
    cat: 'health',
    label: 'Décès causés par l’alcool cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.095,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'traffic_deaths_today',
    cat: 'health',
    label: 'Décès par accidents de la route aujourd’hui',
    unit: 'décès',
    type: 'counter',
    scope: 'day',
    ratePerSec: 0.0428,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'health_spending_today',
    cat: 'health',
    label: 'Dépenses mondiales de santé aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 289350,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
];

// Official UN World Population Prospects Benchmark Table (1900 - 2050)
export const HISTORICAL_UN_POPULATIONS = {
  1900: 1650000000,
  1910: 1750000000,
  1920: 1860000000,
  1930: 2070000000,
  1940: 2300000000,
  1950: 2536431000,
  1960: 3034949000,
  1970: 3700437000,
  1980: 4458003000,
  1990: 5327231000,
  2000: 6143493000,
  2005: 6541907000,
  2010: 6956823000,
  2015: 7379797000,
  2018: 7631091000,
  2020: 7794798000,
  2021: 7874965000,
  2022: 7954000000,
  2023: 8045311000,
  2024: 8118835000,
  2025: 8191988000,
  2026: 8264179671, // Base 01/01/2026
  2030: 8546141000,
  2035: 8887524000,
  2040: 9198847000,
  2050: 9709491000,
};

// Returns exact or interpolated benchmark population for any year
export function getBenchmarkPopulationForYear(year) {
  if (HISTORICAL_UN_POPULATIONS[year]) return HISTORICAL_UN_POPULATIONS[year];
  const keys = Object.keys(HISTORICAL_UN_POPULATIONS).map(Number).sort((a, b) => a - b);
  if (year <= keys[0]) return HISTORICAL_UN_POPULATIONS[keys[0]];
  if (year >= keys[keys.length - 1]) return HISTORICAL_UN_POPULATIONS[keys[keys.length - 1]];

  let prev = keys[0];
  let next = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (year >= keys[i] && year <= keys[i + 1]) {
      prev = keys[i];
      next = keys[i + 1];
      break;
    }
  }
  const ratio = (year - prev) / (next - prev);
  return Math.round(HISTORICAL_UN_POPULATIONS[prev] + ratio * (HISTORICAL_UN_POPULATIONS[next] - HISTORICAL_UN_POPULATIONS[prev]));
}

// Helper to calculate current live snapshot or historical date snapshot for all metrics
export function computeWorldometerMetrics(yearMultiplier = 1, referenceDate = null) {
  const dateObj = referenceDate ? new Date(referenceDate) : new Date();
  const year = dateObj.getUTCFullYear();

  // Start of UTC day for the specified date
  const startOfDay = new Date(Date.UTC(year, dateObj.getUTCMonth(), dateObj.getUTCDate(), 0, 0, 0));
  const secondsToday = Math.max(0, (dateObj.getTime() - startOfDay.getTime()) / 1000);

  // Start of UTC year for the specified date
  const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const secondsYear = Math.max(0, (dateObj.getTime() - startOfYear.getTime()) / 1000);

  // Demography benchmark scale for the active year relative to 2026
  const yearBasePop = getBenchmarkPopulationForYear(year);
  const nextYearBasePop = getBenchmarkPopulationForYear(year + 1);
  const annualGrowth = Math.max(1000000, nextYearBasePop - yearBasePop);
  const dynamicRatePerSec = annualGrowth / (365.25 * 86400);
  const eraScale = yearBasePop / 8264179671;

  const results = {};

  for (const def of METRIC_DEFINITIONS) {
    let val = def.baseVal;
    if (def.id === 'world_pop') {
      val = Math.floor(yearBasePop + secondsYear * dynamicRatePerSec);
    } else if (def.scope === 'day') {
      const scaledRate = def.ratePerSec * (def.cat === 'population' ? eraScale : Math.min(1.5, Math.max(0.1, eraScale)));
      val = Math.floor(secondsToday * scaledRate);
    } else if (def.scope === 'year') {
      const scaledRate = def.ratePerSec * (def.cat === 'population' ? eraScale : Math.min(1.5, Math.max(0.05, eraScale)));
      val = Math.floor(secondsYear * scaledRate);
    } else if (def.scope === 'instant') {
      val = Math.floor((def.baseVal + secondsYear * def.ratePerSec) * eraScale);
    } else if (def.scope === 'fixed_countdown') {
      const daysIntoYear = secondsYear / 86400;
      const yearsDiff = 2026 - year;
      val = Math.max(0, Math.floor(def.baseVal + yearsDiff * 365.25 - daysIntoYear));
    }
    results[def.id] = val;
  }

  return results;
}

