import {
  getUNProjectionForYear,
  getHistoricalAndFutureEcologicalModel,
} from '../data/unWorldProjectionsData.js';

export const WORLDOMETER_CATEGORIES = [
  { id: 'all', label: 'TOUS LES INDICATEURS', shortLabel: 'TOUS' },
  { id: 'population', label: 'POPULATION MONDIALE', shortLabel: 'POPULATION' },
  { id: 'economy', label: 'GOUVERNEMENT & ÉCONOMIE', shortLabel: 'ÉCONOMIE' },
  { id: 'media', label: 'SOCIÉTÉ & MÉDIAS', shortLabel: 'MÉDIAS' },
  { id: 'environment', label: 'ENVIRONNEMENT', shortLabel: 'ENVIRONNEMENT' },
  { id: 'food', label: 'ALIMENTATION & SURPOIDS', shortLabel: 'ALIMENTATION' },
  { id: 'water', label: 'EAU POTABLE & RESSOURCES', shortLabel: 'EAU' },
  { id: 'energy', label: 'ÉNERGIE & RÉSERVES MONDIALES', shortLabel: 'ÉNERGIE' },
  { id: 'health', label: 'SANTÉ PUBLIQUE & MORTALITÉ', shortLabel: 'SANTÉ' },
];

export const METRIC_DEFINITIONS = [
  /* ══════════════════════════════════════════════════════════════════════════
     1. POPULATION MONDIALE (7 INDICATEURS OFFICIELS)
     ══════════════════════════════════════════════════════════════════════════ */
  {
    id: 'world_pop',
    cat: 'population',
    label: 'Population mondiale actuelle',
    unit: 'habitants',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 2.2202,
    baseVal: 8161972572,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'births_year',
    cat: 'population',
    label: 'Naissances cette année',
    unit: 'naissances',
    type: 'counter',
    scope: 'year',
    ratePerSec: 4.1986,
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
    ratePerSec: 4.1986,
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
    ratePerSec: 1.9784,
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
    ratePerSec: 1.9784,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'net_growth_year',
    cat: 'population',
    label: 'Croissance démographique nette cette année',
    unit: 'personnes',
    type: 'counter',
    scope: 'year',
    ratePerSec: 2.2202,
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
    ratePerSec: 2.2202,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },

  /* ══════════════════════════════════════════════════════════════════════════
     2. GOUVERNEMENT ET ÉCONOMIE (6 INDICATEURS OFFICIELS)
     ══════════════════════════════════════════════════════════════════════════ */
  {
    id: 'health_spending_public_today',
    cat: 'economy',
    label: 'Dépenses publiques de santé aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 211857.6,
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
    ratePerSec: 138513.5,
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
    ratePerSec: 55526.4,
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
    ratePerSec: 2.9308,
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
    ratePerSec: 5.1485,
    baseVal: 0,
    color: '#94a3b8',
  },
  {
    id: 'computers_produced_year',
    cat: 'economy',
    label: 'Ordinateurs produits cette année',
    unit: 'unités',
    type: 'counter',
    scope: 'year',
    ratePerSec: 7.0378,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },

  /* ══════════════════════════════════════════════════════════════════════════
     3. SOCIÉTÉ ET MÉDIAS (10 INDICATEURS OFFICIELS)
     ══════════════════════════════════════════════════════════════════════════ */
  {
    id: 'books_published_year',
    cat: 'media',
    label: 'Nouveaux titres de livres publiés cette année',
    unit: 'ouvrages',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.09181,
    baseVal: 0,
    color: '#cbd5e1',
  },
  {
    id: 'newspapers_today',
    cat: 'media',
    label: 'Journaux distribués aujourd’hui',
    unit: 'exemplaires',
    type: 'counter',
    scope: 'day',
    ratePerSec: 5216.0,
    baseVal: 0,
    color: '#94a3b8',
  },
  {
    id: 'tv_sold_today',
    cat: 'media',
    label: 'Téléviseurs vendus dans le monde aujourd’hui',
    unit: 'appareils',
    type: 'counter',
    scope: 'day',
    ratePerSec: 7.8855,
    baseVal: 0,
    color: '#38bdf8',
  },
  {
    id: 'smartphones_sold_today',
    cat: 'media',
    label: 'Téléphones portables vendus aujourd’hui',
    unit: 'appareils',
    type: 'counter',
    scope: 'day',
    ratePerSec: 97.168,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
  {
    id: 'videogames_money_today',
    cat: 'media',
    label: 'Argent dépensé pour les jeux vidéo aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 4045.1,
    baseVal: 0,
    color: '#a855f7',
  },
  {
    id: 'internet_users_world',
    cat: 'media',
    label: 'Utilisateurs d’Internet dans le monde',
    unit: 'utilisateurs',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 1.85,
    baseVal: 7358298038,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'emails_today',
    cat: 'media',
    label: 'E-mails envoyés aujourd’hui',
    unit: 'messages',
    type: 'counter',
    scope: 'day',
    ratePerSec: 3862371.9,
    baseVal: 0,
    color: '#38bdf8',
  },
  {
    id: 'blog_posts_today',
    cat: 'media',
    label: 'Billets de blog rédigés aujourd’hui',
    unit: 'articles',
    type: 'counter',
    scope: 'day',
    ratePerSec: 161.946,
    baseVal: 0,
    color: '#a855f7',
  },
  {
    id: 'tweets_today',
    cat: 'media',
    label: 'Tweets envoyés aujourd’hui',
    unit: 'tweets',
    type: 'counter',
    scope: 'day',
    ratePerSec: 12642.17,
    baseVal: 0,
    color: '#38bdf8',
  },
  {
    id: 'google_searches_today',
    cat: 'media',
    label: 'Recherches Google aujourd’hui',
    unit: 'requêtes',
    type: 'counter',
    scope: 'day',
    ratePerSec: 161015.2,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },

  /* ══════════════════════════════════════════════════════════════════════════
     4. ENVIRONNEMENT (5 INDICATEURS OFFICIELS)
     ══════════════════════════════════════════════════════════════════════════ */
  {
    id: 'deforestation_hectares_year',
    cat: 'environment',
    label: 'Déforestation cette année',
    unit: 'hectares',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.16423,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'soil_erosion_lost_year',
    cat: 'environment',
    label: 'Terres perdues par l’érosion des sols cette année',
    unit: 'hectares',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.22109,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'co2_emissions_year',
    cat: 'environment',
    label: 'Émissions de CO₂ cette année',
    unit: 'tonnes',
    type: 'counter',
    scope: 'year',
    ratePerSec: 1268.514,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'desertification_hectares_year',
    cat: 'environment',
    label: 'Désertification cette année',
    unit: 'hectares',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.37895,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'toxic_chemicals_year',
    cat: 'environment',
    label: 'Produits chimiques toxiques rejetés cette année',
    unit: 'tonnes',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.30923,
    baseVal: 0,
    color: '#ec4899',
  },

  /* ══════════════════════════════════════════════════════════════════════════
     5. ALIMENTATION ET SURPOIDS (6 INDICATEURS OFFICIELS)
     ══════════════════════════════════════════════════════════════════════════ */
  {
    id: 'undernourished_world',
    cat: 'food',
    label: 'Personnes sous-alimentées dans le monde',
    unit: 'personnes',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 0.32,
    baseVal: 900298707,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'overweight_world',
    cat: 'food',
    label: 'Personnes en surpoids dans le monde',
    unit: 'personnes',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 0.65,
    baseVal: 1800789028,
    color: 'var(--amber-warn)',
  },
  {
    id: 'obese_world',
    cat: 'food',
    label: 'Personnes obèses dans le monde',
    unit: 'personnes',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 0.42,
    baseVal: 922334934,
    color: 'var(--amber-warn)',
  },
  {
    id: 'hunger_deaths_today',
    cat: 'food',
    label: 'Personnes mortes de faim aujourd’hui',
    unit: 'décès',
    type: 'counter',
    scope: 'day',
    ratePerSec: 0.35368,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'obesity_costs_usa_today',
    cat: 'food',
    label: 'Dépenses maladies liées à l’obésité aux USA aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 8400.91,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'weightloss_spending_usa_today',
    cat: 'food',
    label: 'Dépenses pour les régimes/perte de poids aux USA aujourd’hui',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'day',
    ratePerSec: 2186.4,
    baseVal: 0,
    color: '#cbd5e1',
  },

  /* ══════════════════════════════════════════════════════════════════════════
     6. EAU POTABLE & RESSOURCES (3 INDICATEURS OFFICIELS)
     ══════════════════════════════════════════════════════════════════════════ */
  {
    id: 'water_consumed_year',
    cat: 'water',
    label: 'Eau utilisée cette année',
    unit: 'millions de L',
    type: 'counter',
    scope: 'year',
    ratePerSec: 151.9893,
    baseVal: 0,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'water_disease_deaths_year',
    cat: 'water',
    label: 'Décès dus aux maladies liées à l’eau cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.026591,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'no_safe_water_world',
    cat: 'water',
    label: 'Personnes sans accès à une source d’eau potable',
    unit: 'personnes',
    type: 'static',
    scope: 'instant',
    ratePerSec: 0,
    baseVal: 742922509,
    color: 'var(--amber-warn)',
  },

  /* ══════════════════════════════════════════════════════════════════════════
     7. ÉNERGIE & RÉSERVES MONDIALES (11 INDICATEURS OFFICIELS)
     ══════════════════════════════════════════════════════════════════════════ */
  {
    id: 'energy_used_today_mwh',
    cat: 'energy',
    label: 'Énergie consommée aujourd’hui (MWh)',
    unit: 'MWh',
    type: 'counter',
    scope: 'day',
    ratePerSec: 5141.04,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
  {
    id: 'energy_non_renewable_today',
    cat: 'energy',
    label: '- dont provenant de sources non renouvelables',
    unit: 'MWh',
    type: 'counter',
    scope: 'day',
    ratePerSec: 4538.32,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'energy_renewable_today',
    cat: 'energy',
    label: '- dont provenant de sources renouvelables',
    unit: 'MWh',
    type: 'counter',
    scope: 'day',
    ratePerSec: 602.72,
    baseVal: 0,
    color: 'var(--emerald-live)',
  },
  {
    id: 'solar_energy_earth_today',
    cat: 'energy',
    label: 'Énergie solaire frappant la Terre aujourd’hui',
    unit: 'MWh',
    type: 'counter',
    scope: 'day',
    ratePerSec: 33825308.8,
    baseVal: 0,
    color: '#facc15',
  },
  {
    id: 'oil_pumped_today',
    cat: 'energy',
    label: 'Pétrole brut pompé aujourd’hui',
    unit: 'barils',
    type: 'counter',
    scope: 'day',
    ratePerSec: 891.23,
    baseVal: 0,
    color: '#cbd5e1',
  },
  {
    id: 'oil_reserves_barrels',
    cat: 'energy',
    label: 'Pétrole brut restant dans les réserves mondiales',
    unit: 'barils restants',
    type: 'resource_countdown',
    scope: 'resource_countdown',
    ratePerSec: 891.23,
    baseVal: 1743564720612,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'oil_days_left',
    cat: 'energy',
    label: 'Jours avant la fin du pétrole (~57 ans)',
    unit: 'jours restants',
    type: 'countdown',
    scope: 'fixed_countdown',
    baseVal: 20669,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'gas_reserves_m3',
    cat: 'energy',
    label: 'Gaz naturel restant dans les réserves mondiales',
    unit: 'm³ restants',
    type: 'resource_countdown',
    scope: 'resource_countdown',
    ratePerSec: 133500,
    baseVal: 206463533963121,
    color: 'var(--amber-warn)',
  },
  {
    id: 'gas_days_left',
    cat: 'energy',
    label: 'Jours avant la fin du gaz naturel (~49 ans)',
    unit: 'jours restants',
    type: 'countdown',
    scope: 'fixed_countdown',
    baseVal: 17865,
    color: 'var(--amber-warn)',
  },
  {
    id: 'coal_reserves_tons',
    cat: 'energy',
    label: 'Charbon restant dans les réserves mondiales',
    unit: 'tonnes restantes',
    type: 'resource_countdown',
    scope: 'resource_countdown',
    ratePerSec: 275.5,
    baseVal: 1142372964221,
    color: 'var(--cyan-bright)',
  },
  {
    id: 'coal_days_left',
    cat: 'energy',
    label: 'Jours avant la fin du charbon (~131 ans)',
    unit: 'jours restants',
    type: 'countdown',
    scope: 'fixed_countdown',
    baseVal: 47935,
    color: 'var(--cyan-bright)',
  },

  /* ══════════════════════════════════════════════════════════════════════════
     8. SANTÉ PUBLIQUE ET MORTALITÉ (16 INDICATEURS OFFICIELS)
     ══════════════════════════════════════════════════════════════════════════ */
  {
    id: 'communicable_deaths_year',
    cat: 'health',
    label: 'Décès dus aux maladies transmissibles cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.40992,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'seasonal_flu_deaths_year',
    cat: 'health',
    label: 'Décès dus à la grippe saisonnière cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.016436,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'under5_deaths_year',
    cat: 'health',
    label: 'Décès d’enfants de moins de 5 ans cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.240017,
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
    ratePerSec: 1.440623,
    baseVal: 0,
    color: '#cbd5e1',
  },
  {
    id: 'maternal_deaths_year',
    cat: 'health',
    label: 'Décès de mères pendant l’accouchement cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.00976,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'hiv_infected_world',
    cat: 'health',
    label: 'Personnes vivant avec le VIH / sida',
    unit: 'personnes',
    type: 'counter',
    scope: 'instant',
    ratePerSec: 0.048,
    baseVal: 47622054,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'hiv_deaths_year',
    cat: 'health',
    label: 'Décès causés par le VIH / sida cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.05308,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'cancer_deaths_year',
    cat: 'health',
    label: 'Décès dus au cancer cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.25933,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'malaria_deaths_year',
    cat: 'health',
    label: 'Décès causés par le paludisme cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.01245,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'cigarettes_smoked_today',
    cat: 'health',
    label: 'Cigarettes fumées aujourd’hui',
    unit: 'cigarettes',
    type: 'counter',
    scope: 'day',
    ratePerSec: 175066.04,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'smoking_deaths_year',
    cat: 'health',
    label: 'Décès causés par le tabagisme cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.15785,
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
    ratePerSec: 0.078976,
    baseVal: 0,
    color: 'var(--amber-warn)',
  },
  {
    id: 'suicides_year',
    cat: 'health',
    label: 'Suicides cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.03386,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'illegal_drugs_spending_year',
    cat: 'health',
    label: 'Argent dépensé pour les drogues illégales cette année',
    unit: '$ US',
    prefix: '$',
    type: 'counter',
    scope: 'year',
    ratePerSec: 12632.25,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
  {
    id: 'traffic_deaths_year',
    cat: 'health',
    label: 'Décès par accidents de la route cette année',
    unit: 'décès',
    type: 'counter',
    scope: 'year',
    ratePerSec: 0.042625,
    baseVal: 0,
    color: 'var(--crimson-alert)',
  },
];

// Official UN World Population Prospects Benchmark Table (1900 - 2100)
export function getBenchmarkPopulationForYear(year) {
  const proj = getUNProjectionForYear(year);
  return proj ? proj.pop : 8300678395;
}

// Exact official mathematical engine matching Worldometer (worldometers.info/fr)
// Enhanced with UN DESA 2024 Revision & IPCC / IAE ecological models for past & future years
export function computeWorldometerMetrics(yearMultiplier = 1, referenceDate = null) {
  const dateObj = referenceDate ? new Date(referenceDate) : new Date();
  const year = dateObj.getFullYear();
  const isPresent = year === 2026;

  // 1. Client local midnight (start of today in local time, as per Worldometer)
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
  const secondsToday = Math.max(0, (dateObj.getTime() - startOfDay.getTime()) / 1000);

  // 2. Client local start of year (January 1st 00:00:00 local time)
  const startOfYear = new Date(dateObj.getFullYear(), 0, 1, 0, 0, 0, 0);
  const secondsYear = Math.max(0, (dateObj.getTime() - startOfYear.getTime()) / 1000);

  // Official UN Certified Projections & Ecological Data
  const proj = getUNProjectionForYear(year);
  const eco = getHistoricalAndFutureEcologicalModel(year);
  const yearBasePop = proj.pop;
  const eraScale = yearBasePop / 8300678395;
  const progressYear = secondsYear / (365.25 * 86400);

  // Exact Worldometer reference anchor points (Live 2026 baseline calibration)
  const seconds_since_jul24 = Math.round((dateObj.getTime() - 1719792000000) / 1000);
  const seconds_since_end13 = (dateObj.getTime() - 1388448000000) / 1000;
  const seconds_since_end16 = (dateObj.getTime() - 1483142400000) / 1000;

  const results = {};

  for (const def of METRIC_DEFINITIONS) {
    let val = 0;

    if (def.id === 'world_pop') {
      if (isPresent) {
        // Exact official Worldometer formula:
        val = Math.round(seconds_since_jul24 * 2.2202 + 8161972572 - secondsToday * 2.2202) + Math.round(secondsToday * 4.1986) - Math.round(secondsToday * 1.9784);
      } else {
        // Official UN annual baseline + seconds elapsed progress scaled to net variation
        val = Math.floor(yearBasePop + progressYear * proj.net);
      }
    } else if (def.id === 'births_year') {
      if (isPresent) {
        val = Math.round(secondsYear * 4.1986 - secondsToday * 4.1986) + Math.round(secondsToday * 4.1986);
      } else {
        const estBirthsAnnual = Math.max(80000000, Math.floor(yearBasePop * Math.max(0.010, 0.016 + (proj.rate / 200))));
        val = Math.floor(progressYear * estBirthsAnnual);
      }
    } else if (def.id === 'births_today') {
      if (isPresent) {
        val = Math.round(secondsToday * 4.1986);
      } else {
        const estBirthsAnnual = Math.max(80000000, Math.floor(yearBasePop * Math.max(0.010, 0.016 + (proj.rate / 200))));
        val = Math.floor((secondsToday / 86400) * (estBirthsAnnual / 365.25));
      }
    } else if (def.id === 'deaths_year') {
      if (isPresent) {
        val = Math.round(secondsYear * 1.9784 - secondsToday * 1.9784) + Math.round(secondsToday * 1.9784);
      } else {
        const estBirthsAnnual = Math.max(80000000, Math.floor(yearBasePop * Math.max(0.010, 0.016 + (proj.rate / 200))));
        const estDeathsAnnual = Math.max(40000000, estBirthsAnnual - proj.net);
        val = Math.floor(progressYear * estDeathsAnnual);
      }
    } else if (def.id === 'deaths_today') {
      if (isPresent) {
        val = Math.round(secondsToday * 1.9784);
      } else {
        const estBirthsAnnual = Math.max(80000000, Math.floor(yearBasePop * Math.max(0.010, 0.016 + (proj.rate / 200))));
        const estDeathsAnnual = Math.max(40000000, estBirthsAnnual - proj.net);
        val = Math.floor((secondsToday / 86400) * (estDeathsAnnual / 365.25));
      }
    } else if (def.id === 'net_growth_year') {
      if (isPresent) {
        val = (results['births_year'] || Math.round(secondsYear * 4.1986)) - (results['deaths_year'] || Math.round(secondsYear * 1.9784));
      } else {
        val = Math.floor(progressYear * proj.net);
      }
    } else if (def.id === 'net_growth_today') {
      if (isPresent) {
        val = (results['births_today'] || Math.round(secondsToday * 4.1986)) - (results['deaths_today'] || Math.round(secondsToday * 1.9784));
      } else {
        val = Math.floor((secondsToday / 86400) * (proj.net / 365.25));
      }
    } else if (def.id === 'co2_emissions_year') {
      if (isPresent) {
        val = Math.floor(secondsYear * def.ratePerSec);
      } else {
        val = Math.floor(eco.co2Gigatons * 1e9 * progressYear);
      }
    } else if (def.id === 'energy_renewable_today') {
      if (isPresent) {
        val = Math.floor(secondsToday * def.ratePerSec);
      } else {
        const totalEnergyToday = secondsToday * 4500 * eraScale;
        val = Math.floor(totalEnergyToday * (eco.renewableEnergyPct / 100));
      }
    } else if (def.id === 'energy_non_renewable_today') {
      if (isPresent) {
        val = Math.floor(secondsToday * def.ratePerSec);
      } else {
        const totalEnergyToday = secondsToday * 4500 * eraScale;
        val = Math.floor(totalEnergyToday * (1 - eco.renewableEnergyPct / 100));
      }
    } else if (def.id === 'oil_reserves_barrels') {
      val = Math.max(0, Math.floor(eco.oilReservesBillionBarrels * 1e9 - (secondsYear / 86400) * 98000000));
    } else if (def.id === 'oil_days_left') {
      const remainingBarrels = Math.max(0, Math.floor(eco.oilReservesBillionBarrels * 1e9 - (secondsYear / 86400) * 98000000));
      val = Math.max(0, Math.floor(remainingBarrels / 98000000));
    } else if (def.id === 'internet_users_world') {
      val = Math.floor(yearBasePop * (eco.internetUsersPct / 100));
    } else if (def.id === 'health_spending_public_today') {
      if (isPresent) {
        val = Math.round((4498086121149 * Math.pow(Math.pow(4641584035116 / 4498086121149, 1 / 31556900), seconds_since_end13)) / 31556900 * secondsToday);
      } else {
        val = Math.floor(secondsToday * def.ratePerSec * (eco.globalGdpTrillionUsd / 108.5));
      }
    } else if (def.id === 'education_spending_today') {
      if (isPresent) {
        val = Math.round((3465599783414 * Math.pow(Math.pow(3550465124803 / 3465599783414, 1 / 31556900), seconds_since_end16)) / 31556900 * secondsToday);
      } else {
        val = Math.floor(secondsToday * def.ratePerSec * (eco.globalGdpTrillionUsd / 108.5));
      }
    } else if (def.id === 'military_spending_today') {
      if (isPresent) {
        val = Math.round((1690000000000 * Math.pow(Math.pow(1696760000000 / 1690000000000, 1 / 31556900), seconds_since_end16)) / 31556900 * secondsToday);
      } else {
        val = Math.floor(secondsToday * def.ratePerSec * (eco.globalGdpTrillionUsd / 108.5));
      }
    } else if (def.scope === 'day') {
      const scaledRate = def.ratePerSec * (def.cat === 'population' ? eraScale : Math.min(2.5, Math.max(0.1, eraScale)));
      val = Math.floor(secondsToday * scaledRate);
    } else if (def.scope === 'year') {
      const scaledRate = def.ratePerSec * (def.cat === 'population' ? eraScale : Math.min(2.5, Math.max(0.05, eraScale)));
      val = Math.floor(secondsYear * scaledRate);
    } else if (def.scope === 'instant') {
      val = Math.floor((def.baseVal + (secondsYear - 22117080) * (def.ratePerSec || 0)) * eraScale);
    } else if (def.scope === 'resource_countdown') {
      val = Math.max(0, Math.floor(def.baseVal - (secondsToday - 85080) * def.ratePerSec));
    } else if (def.scope === 'fixed_countdown') {
      const daysIntoYear = secondsYear / 86400;
      const yearsDiff = 2026 - year;
      val = Math.max(0, Math.floor(def.baseVal + yearsDiff * 365.25 - daysIntoYear));
    }

    results[def.id] = val;
  }

  return results;
}
