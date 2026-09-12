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
  // 1. POPULATION
  {
    id: 'world_pop',
    cat: 'population',
    label: 'Population mondiale actuelle',
    unit: 'habitants',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 2.36,
    baseVal: 8185420000,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'births_year',
    cat: 'population',
    label: 'Naissances cette année',
    unit: 'naissances',
    type: 'counter',
    scope: 'year',
    ratePerSec: 4.29,
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
    ratePerSec: 4.29,
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
    ratePerSec: 1.93,
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
    ratePerSec: 1.93,
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
    ratePerSec: 2.36,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },

  // 2. GOUVERNEMENT & ÉCONOMIE
  {
    id: 'military_spending_today',
    cat: 'economy',
    label: 'Dépenses militaires mondiales aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 76103,
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
    ratePerSec: 2.695,
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
    ratePerSec: 3.805,
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
    ratePerSec: 8.244,
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

  const results = {};

  for (const def of METRIC_DEFINITIONS) {
    let val = def.baseVal;
    if (def.scope === 'day') {
      val = Math.floor(def.baseVal + secondsToday * def.ratePerSec);
    } else if (def.scope === 'year') {
      val = Math.floor(def.baseVal + secondsYear * def.ratePerSec);
    } else if (def.scope === 'instant') {
      val = Math.floor((def.baseVal + secondsYear * def.ratePerSec) * yearMultiplier);
    } else if (def.scope === 'fixed_countdown') {
      // Countdown decreases each day
      const daysIntoYear = secondsYear / 86400;
      val = Math.max(0, Math.floor(def.baseVal - daysIntoYear));
    }
    results[def.id] = val;
  }

  return results;
}

