import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { realtimeStream } from '../utils/realtimeEvents';
import {
  METRIC_DEFINITIONS,
  computeWorldometerMetrics,
} from '../utils/worldometerMetrics';
import { getEstimatedPopulationForYear } from './TimelineWheel';
import { sound } from '../utils/soundFX';
import {
  SATELLITES_DATA,
  CCTV_FEEDS,
  DEFENSE_COMMODITIES_MARKETS,
} from '../data/osirisStreams';
import {
  LIVE_BULLETINS,
  COUNTRIES_TELEMETRY,
  HOTSPOTS,
} from '../data/mockData';
import { TERRITORY_NAMES_FR } from '../utils/countryData';
import {
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Search,
  X,
  Crosshair,
  Video,
  ShieldAlert,
  Calendar,
  Maximize2,
  BookOpen,
  Globe,
  TrendingUp,
  TrendingDown,
  Terminal,
  ShieldCheck,
  Activity,
  Database,
  Server,
  Zap,
} from 'lucide-react';
import { ChronoJournalTab } from './ChronoJournalTab';
import './LiveTelemetryDrawer.css';

/* ── Unified Category System (Worldometer 64-Metrics & Osiris Feeds) ── */
const UNIFIED_CATEGORIES = [
  { id: 'all', label: 'Tout', type: 'metrics' },
  { id: 'population', label: 'Démographie', type: 'metrics' },
  { id: 'economy', label: 'Économie & Gouv', type: 'metrics' },
  { id: 'media', label: 'Société & Médias', type: 'metrics' },
  { id: 'environment', label: 'Environnement', type: 'metrics' },
  { id: 'food', label: 'Alimentation', type: 'metrics' },
  { id: 'water', label: 'Eau Potable', type: 'metrics' },
  { id: 'energy', label: 'Énergie & Réserves', type: 'metrics' },
  { id: 'health', label: 'Santé Publique', type: 'metrics' },
  { id: 'defense_markets', label: 'Marchés & Défense', type: 'markets' },
  { id: 'video', label: 'Vidéo en Direct', type: 'cctv' },
  { id: 'satellites', label: 'Satellites', type: 'satellites' },
  { id: 'osint', label: 'OSINT Recon', type: 'osint' },
  { id: 'intel', label: 'Renseignement', type: 'intel' },
  { id: 'country', label: 'Fiche Pays', type: 'country' },
];

const CAT_LABELS_FR = {
  population: 'Démographie',
  economy: 'Économie & Gouv',
  media: 'Société & Médias',
  environment: 'Environnement',
  food: 'Alimentation',
  water: 'Eau Potable',
  energy: 'Énergie & Réserves',
  health: 'Santé Publique',
};

const SCOPE_LABELS_FR = {
  day: "Aujourd'hui",
  year: 'Cette année',
  instant: 'En direct',
  resource_countdown: 'Réserves mondiales',
  fixed_countdown: 'Épuisement estimé',
};

/* ── OSINT Recon Intelligence Records (Osiris Parity) ────────────── */
const OSINT_DOSSIERS = {
  '8.8.8.8': {
    target: '8.8.8.8 (Google Public DNS)',
    type: 'Anycast DNS Resolver',
    asn: 'AS15169 GOOGLE',
    org: 'Google LLC',
    country: 'États-Unis (Global Anycast)',
    reverseDns: 'dns.google',
    threatScore: '0 / 100 (Sûr)',
    threatLevel: 'safe',
    ports: '53/UDP (DNS), 853/TCP (DoT), 443/TCP (DoH)',
    status: 'Opérationnel // 100% SLA',
    description: 'Nœud DNS primaire mondial avec filtrage DNSSEC et protection DDoS BGP Anycast.',
  },
  '1.1.1.1': {
    target: '1.1.1.1 (Cloudflare DNS)',
    type: 'Privacy-First DNS Anycast',
    asn: 'AS13335 CLOUDFLARENET',
    org: 'Cloudflare Inc. / APNIC',
    country: 'Australie / Global Anycast',
    reverseDns: 'one.one.one.one',
    threatScore: '0 / 100 (Sûr)',
    threatLevel: 'safe',
    ports: '53/UDP, 853/TCP (DoT), 443/TCP (DoH/WARP)',
    status: 'Opérationnel // Latence < 12ms',
    description: 'Infrastructure résolveur ultra-rapide axée sur la confidentialité sans journalisation d’adresses IP.',
  },
  'CVE-2024-3094': {
    target: 'CVE-2024-3094 (XZ Utils Backdoor)',
    type: 'Supply Chain Compromise',
    asn: 'N/A (Cible OpenSSH / Liblzma)',
    org: 'Malicious Upstream Infiltration',
    country: 'Global Unix Ecosystem',
    reverseDns: 'N/A',
    threatScore: '100 / 100 (CRITIQUE ABSOLU)',
    threatLevel: 'danger',
    ports: '22/TCP (SSH Authentication Bypass)',
    status: 'CORRIGÉ // SURVEILLANCE ACTIVE',
    description: 'Backdoor insérée dans liblzma 5.6.0/5.6.1 permettant l’exécution de code arbitraire non authentifié via SSH.',
  },
  'CVE-2024-6387': {
    target: 'CVE-2024-6387 (regreSSHion)',
    type: 'Remote Code Execution (RCE)',
    asn: 'N/A (Serveurs Linux Glibc)',
    org: 'OpenSSH Project',
    country: 'Global Infrastructure',
    reverseDns: 'N/A',
    threatScore: '92 / 100 (SÉVÈRE)',
    threatLevel: 'danger',
    ports: '22/TCP (Signal Handler Race Condition)',
    status: 'PATCH RECOMMANDÉ IMMÉDIAT',
    description: 'Vulnérabilité critique de concurrence dans le gestionnaire de signaux SIGALRM d’OpenSSH permettant l’élévation root.',
  },
};

/* ── Component ───────────────────────────────────────────────────── */
export function LiveTelemetryDrawer({
  selectedYear = 2026,
  onYearChange,
  isOpen: propIsOpen,
  onToggleOpen,
  activeTab,
  onTabChange,
  onSelectCCTV,
  onSelectSatellite,
  onSelectLocation,
  selectedCountry = 'FR',
}) {
  /* ── State ─────────────────────────────────────────────────────── */
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;

  const [activeCategory, setActiveCategory] = useState('all');
  const [drawerMode, setDrawerMode] = useState('metrics'); // 'metrics' | 'journal'
  const [cctvFilter, setCctvFilter] = useState('all');
  const [osintTarget, setOsintTarget] = useState('8.8.8.8');
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState(() => computeWorldometerMetrics(1));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [localDate, setLocalDate] = useState('');
  const categoryScrollRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  const handleToggleMetrics = useCallback(() => {
    sound.click();
    if (!isOpen) {
      setDrawerMode('metrics');
      if (onToggleOpen) onToggleOpen(true);
      else setInternalIsOpen(true);
    } else if (drawerMode === 'metrics') {
      if (onToggleOpen) onToggleOpen(false);
      else setInternalIsOpen(false);
    } else {
      setDrawerMode('metrics');
    }
  }, [isOpen, drawerMode, onToggleOpen]);

  const handleToggleJournal = useCallback(() => {
    sound.click();
    if (!isOpen) {
      setDrawerMode('journal');
      if (onToggleOpen) onToggleOpen(true);
      else setInternalIsOpen(true);
    } else if (drawerMode === 'journal') {
      if (onToggleOpen) onToggleOpen(false);
      else setInternalIsOpen(false);
    } else {
      setDrawerMode('journal');
    }
  }, [isOpen, drawerMode, onToggleOpen]);

  /* ── Temporal State (Live vs Custom Time & Date) ────────────────── */
  const [customDate, setCustomDate] = useState(null); // null = Live Realtime Mode
  const customDateRef = useRef(customDate);
  const isLive = customDate === null;

  // Active year & year multiplier
  const activeYear = useMemo(() => {
    if (customDate) return customDate.getFullYear();
    return selectedYear || new Date().getFullYear();
  }, [customDate, selectedYear]);

  const yearMultiplier = useMemo(
    () => getEstimatedPopulationForYear(activeYear) / 8185420000,
    [activeYear]
  );

  const updateCustomDate = useCallback((newDate) => {
    customDateRef.current = newDate;
    setCustomDate(newDate);
    if (newDate) {
      setLocalTime(
        newDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setLocalDate(
        newDate
          .toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
          .toUpperCase()
      );
    }
  }, []);

  /* ── Live Clock & Date Display Engine ──────────────────────────── */
  useEffect(() => {
    const update = () => {
      const target = customDateRef.current || new Date();
      setLocalTime(
        target.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setLocalDate(
        target
          .toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
          .toUpperCase()
      );
    };

    update();
    const id = setInterval(() => {
      if (customDateRef.current) {
        customDateRef.current = new Date(customDateRef.current.getTime() + 1000);
      }
      update();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Metrics Ticker (ticking live or exact date snapshot) ──────── */
  useEffect(() => {
    const tick = () => {
      setMetrics(computeWorldometerMetrics(yearMultiplier, customDate));
    };
    tick();
    if (isLive) {
      const id = setInterval(tick, 500);
      return () => clearInterval(id);
    }
  }, [yearMultiplier, customDate, isLive]);

  /* ── Realtime stream (keep subscription alive) ─────────────────── */
  useEffect(() => realtimeStream.subscribe(() => {}), []);

  /* ── Active category type ──────────────────────────────────────── */
  const activeType = useMemo(() => {
    const cat = UNIFIED_CATEGORIES.find((c) => c.id === activeCategory);
    return cat ? cat.type : 'metrics';
  }, [activeCategory]);

  /* ── Filtered data ─────────────────────────────────────────────── */
  const filteredMetrics = useMemo(() => {
    return METRIC_DEFINITIONS.filter((def) => {
      const matchesCat = activeCategory === 'all' || def.cat === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        def.label.toLowerCase().includes(q) ||
        def.unit.toLowerCase().includes(q) ||
        (CAT_LABELS_FR[def.cat] || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const filteredCCTV = useMemo(() => {
    return CCTV_FEEDS.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (cctvFilter === 'all') return true;
      const cat = (c.category || '').toLowerCase();
      if (cctvFilter === 'megapoles') return cat.includes('mégapole') || cat.includes('capitale') || cat.includes('ville');
      if (cctvFilter === 'maritime') return cat.includes('maritime') || cat.includes('chokepoint') || cat.includes('canal') || cat.includes('détroit');
      if (cctvFilter === 'aeroports') return cat.includes('aéroport') || cat.includes('piste');
      if (cctvFilter === 'nature') return cat.includes('nature') || cat.includes('volcan') || cat.includes('monument') || cat.includes('site');
      if (cctvFilter === 'espace') return cat.includes('espace') || cat.includes('atmosphère');
      return true;
    });
  }, [searchQuery, cctvFilter]);

  const filteredSatellites = useMemo(() => {
    if (!searchQuery) return SATELLITES_DATA;
    const q = searchQuery.toLowerCase();
    return SATELLITES_DATA.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  /* ── Country data ──────────────────────────────────────────────── */
  const countryData = useMemo(() => {
    const code = selectedCountry || 'FR';
    return (
      COUNTRIES_TELEMETRY[code] || {
        name: TERRITORY_NAMES_FR[code] || code,
        capital: 'N/A',
        defcon: 'SURVEILLANCE',
        riskIndex: 'MODÉRÉ (3.0/10)',
        pop: 'N/A',
        milBudget: 'N/A',
        nukes: 'N/A',
        activeAlerts: 0,
        status: "Données en cours d'acquisition satellite",
      }
    );
  }, [selectedCountry]);

  /* ── Temporal Handlers ─────────────────────────────────────────── */
  const currentIsoDate = useMemo(() => {
    const d = customDate || new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [customDate]);

  const currentIsoTime = useMemo(() => {
    const d = customDate || new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }, [customDate, localTime]);

  const handlePrevHour = (e) => {
    if (e) e.stopPropagation();
    sound.click(0.4);
    const base = customDateRef.current ? new Date(customDateRef.current) : new Date();
    base.setHours(base.getHours() - 1);
    updateCustomDate(base);
    if (onYearChange && base.getFullYear() !== selectedYear) {
      onYearChange(base.getFullYear());
    }
  };

  const handleNextHour = (e) => {
    if (e) e.stopPropagation();
    sound.click(0.4);
    const base = customDateRef.current ? new Date(customDateRef.current) : new Date();
    base.setHours(base.getHours() + 1);
    updateCustomDate(base);
    if (onYearChange && base.getFullYear() !== selectedYear) {
      onYearChange(base.getFullYear());
    }
  };

  const handleSelectTimeInput = (e) => {
    const val = e.target.value;
    if (!val) return;
    const parts = val.split(':').map(Number);
    const base = customDateRef.current ? new Date(customDateRef.current) : new Date();
    if (parts.length >= 2) {
      base.setHours(parts[0], parts[1], parts[2] || 0);
      updateCustomDate(base);
      sound.click(0.5);
    }
  };

  const handleTimeWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleNextHour();
    } else {
      handlePrevHour();
    }
  };

  const triggerTimePicker = () => {
    sound.click(0.4);
    if (timeInputRef.current) {
      if (typeof timeInputRef.current.showPicker === 'function') {
        timeInputRef.current.showPicker();
      } else {
        timeInputRef.current.focus();
      }
    }
  };

  const handlePrevDay = () => {
    sound.click(0.4);
    const base = customDateRef.current ? new Date(customDateRef.current) : new Date();
    base.setDate(base.getDate() - 1);
    updateCustomDate(base);
    if (onYearChange && base.getFullYear() !== selectedYear) {
      onYearChange(base.getFullYear());
    }
  };

  const handleNextDay = () => {
    sound.click(0.4);
    const base = customDateRef.current ? new Date(customDateRef.current) : new Date();
    base.setDate(base.getDate() + 1);
    updateCustomDate(base);
    if (onYearChange && base.getFullYear() !== selectedYear) {
      onYearChange(base.getFullYear());
    }
  };

  const handleSelectDateInput = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    const base = customDateRef.current ? new Date(customDateRef.current) : new Date();
    base.setFullYear(y, m - 1, d);
    updateCustomDate(base);
    if (onYearChange && y !== selectedYear) {
      onYearChange(y);
    }
    sound.click(0.5);
  };

  const handleTopRightArrowClick = useCallback(() => {
    sound.tick();
    if (customDateRef.current !== null) {
      customDateRef.current = null;
      setCustomDate(null);
      const realYear = new Date().getFullYear();
      if (onYearChange && selectedYear !== realYear) {
        onYearChange(realYear);
      }
    }
    setIsRefreshing(true);
    setMetrics(computeWorldometerMetrics(1, null));
    setTimeout(() => setIsRefreshing(false), 600);
  }, [onYearChange, selectedYear]);

  const toggleOpen = () => {
    sound.tick();
    if (onToggleOpen) onToggleOpen(!isOpen);
    else setInternalIsOpen(!internalIsOpen);
  };

  const handleCategoryClick = (catId) => {
    sound.click(0.4);
    setActiveCategory(catId);
    if (onTabChange) onTabChange(catId);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setMetrics(computeWorldometerMetrics(yearMultiplier, customDate));
    sound.click(0.5);
    setTimeout(() => setIsRefreshing(false), 800);
  }, [yearMultiplier, customDate]);

  const scrollCategories = (dir) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: dir === 'right' ? 200 : -200,
        behavior: 'smooth',
      });
    }
  };

  const getPlayableUrl = (url) => {
    if (!url) return '';
    let res = url.replace('controls=0', 'controls=1');
    if (!res.includes('playsinline=1')) res += '&playsinline=1';
    if (!res.includes('rel=0')) res += '&rel=0';
    return res;
  };

  /* ── Content count for search indicator ────────────────────────── */
  const contentCount = useMemo(() => {
    if (activeType === 'metrics') return filteredMetrics.length;
    if (activeType === 'markets') return DEFENSE_COMMODITIES_MARKETS.length;
    if (activeType === 'cctv') return filteredCCTV.length;
    if (activeType === 'satellites') return filteredSatellites.length;
    if (activeType === 'osint') return Object.keys(OSINT_DOSSIERS).length;
    return null;
  }, [activeType, filteredMetrics, filteredCCTV, filteredSatellites]);

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <aside className={`live-telemetry-drawer ${isOpen ? 'is-open' : 'is-closed'}`}>
      {/* Edge Navigation Tabs (Stacked vertically at same edge level) */}
      <div className="drawer-edge-tabs-container">
        {/* Tab 1: Réduire / Stats Monde */}
        <button
          type="button"
          className={`drawer-edge-tab ${isOpen && drawerMode === 'metrics' ? 'is-active' : ''}`}
          onClick={handleToggleMetrics}
          onMouseEnter={() => sound.hover()}
          title={isOpen && drawerMode === 'metrics' ? 'Réduire le panneau' : 'Statistiques & Télémétrie Monde'}
          aria-label={isOpen && drawerMode === 'metrics' ? 'Fermer le panneau' : 'Ouvrir les statistiques'}
        >
          {isOpen && drawerMode === 'metrics' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          <span className="toggle-tab-text">
            {isOpen && drawerMode === 'metrics' ? 'RÉDUIRE' : 'CHRONOS // INTEL'}
          </span>
          <span className="toggle-tab-dot" />
        </button>

        {/* Tab 2: Journal du Jour (Same Level Edge Tab) */}
        <button
          type="button"
          className={`drawer-edge-tab drawer-journal-tab ${isOpen && drawerMode === 'journal' ? 'is-active' : ''}`}
          onClick={handleToggleJournal}
          onMouseEnter={() => sound.hover()}
          title="Consulter le Journal du Jour (Chronologie 24h & Faits marquants)"
          aria-label="Journal du Jour"
        >
          <BookOpen size={13} className="journal-edge-icon" />
          <span className="toggle-tab-text">JOURNAL DU JOUR</span>
          <span className="journal-tab-dot" />
        </button>
      </div>

      {/* Drawer Inner Panel */}
      <div className="drawer-panel-inner">
        {/* ─── Centered Cockpit Chronometer Header ─── */}
        <div className="drawer-header">
          <div className="drawer-chrono-frame">
            {/* Top Bar with Single Live / Refresh Arrow Button */}
            <div className="chrono-top-bar">
              <button
                type="button"
                className={`chrono-sync-arrow-btn ${!isLive ? 'is-shifted' : ''} ${isRefreshing ? 'is-spinning' : ''}`}
                onClick={handleTopRightArrowClick}
                title={!isLive ? "Remettre en direct (Temps réel)" : "Actualiser les indicateurs"}
                aria-label={!isLive ? "Remettre en direct" : "Actualiser"}
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Centered Digital Time Display with Stepper Arrows */}
            <div className="chrono-time-stepper-row">
              <button
                type="button"
                className="chrono-time-stepper-btn"
                onClick={handlePrevHour}
                title="Heure précédente (-1h)"
                aria-label="Heure précédente"
              >
                <ChevronLeft size={16} />
              </button>

              <div
                className="drawer-time-display"
                onClick={triggerTimePicker}
                onWheel={handleTimeWheel}
                title="Cliquer pour régler l'heure ou utiliser la molette / flèches"
              >
                <span className="drawer-time-big">{localTime}</span>
                <input
                  ref={timeInputRef}
                  type="time"
                  step="1"
                  className="chrono-hidden-time-input"
                  value={currentIsoTime}
                  onChange={handleSelectTimeInput}
                  aria-label="Modifier l'heure"
                />
              </div>

              <button
                type="button"
                className="chrono-time-stepper-btn"
                onClick={handleNextHour}
                title="Heure suivante (+1h)"
                aria-label="Heure suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Centered Date Stepper & Picker Bar */}
            <div className="chrono-date-stepper-bar">
              <button
                type="button"
                className="chrono-stepper-btn"
                onClick={handlePrevDay}
                title="Jour précédent (-1 jour)"
                aria-label="Jour précédent"
              >
                <ChevronLeft size={13} />
              </button>

              <div
                className="chrono-date-trigger"
                onClick={() => {
                  sound.click();
                  if (dateInputRef.current) {
                    if (typeof dateInputRef.current.showPicker === 'function') {
                      dateInputRef.current.showPicker();
                    } else {
                      dateInputRef.current.focus();
                    }
                  }
                }}
                title="Cliquer pour choisir une date spécifique dans le calendrier"
              >
                <Calendar size={12} className="chrono-calendar-icon" />
                <span className="drawer-date-text">{localDate}</span>
                <input
                  ref={dateInputRef}
                  type="date"
                  className="chrono-hidden-date-input"
                  value={currentIsoDate}
                  onChange={handleSelectDateInput}
                  aria-label="Sélectionner une date"
                />
              </div>

              <button
                type="button"
                className="chrono-stepper-btn"
                onClick={handleNextDay}
                title="Jour suivant (+1 jour)"
                aria-label="Jour suivant"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Mode Switcher Bar between Telemetry & Journal du Jour */}
        <div className="drawer-mode-switch-bar">
          <button
            type="button"
            className={`mode-switch-btn ${drawerMode === 'metrics' ? 'is-active' : ''}`}
            onClick={() => {
              sound.click(0.3);
              setDrawerMode('metrics');
            }}
          >
            <span>TÉLÉMÉTRIE MONDIALE</span>
          </button>
          <button
            type="button"
            className={`mode-switch-btn is-journal ${drawerMode === 'journal' ? 'is-active' : ''}`}
            onClick={() => {
              sound.click(0.3);
              setDrawerMode('journal');
            }}
          >
            <BookOpen size={12} />
            <span>JOURNAL DU JOUR (24H)</span>
          </button>
        </div>

        {/* ─── Dedicated Journal du Jour Page View ─── */}
        {drawerMode === 'journal' ? (
          <div className="drawer-scroll-area is-journal-dedicated">
            <ChronoJournalTab
              selectedDate={customDateRef.current || new Date()}
              metrics={metrics}
            />
          </div>
        ) : (
          <>
            {/* ─── Category Navigation with Arrows ─── */}
            <div className="drawer-categories-nav">
              <button
                type="button"
                className="cat-arrow-btn"
                onClick={() => scrollCategories('left')}
                aria-label="Défiler vers la gauche"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="cat-chips-container" ref={categoryScrollRef}>
                {UNIFIED_CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const count =
                    cat.type === 'metrics'
                      ? cat.id === 'all'
                        ? METRIC_DEFINITIONS.length
                        : METRIC_DEFINITIONS.filter((m) => m.cat === cat.id).length
                      : cat.type === 'markets'
                      ? DEFENSE_COMMODITIES_MARKETS.length
                      : cat.type === 'cctv'
                      ? CCTV_FEEDS.length
                      : cat.type === 'satellites'
                      ? SATELLITES_DATA.length
                      : cat.type === 'osint'
                      ? Object.keys(OSINT_DOSSIERS).length
                      : cat.type === 'intel'
                      ? LIVE_BULLETINS.length + HOTSPOTS.length
                      : null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-chip ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleCategoryClick(cat.id)}
                    >
                      <span className="cat-chip-label">{cat.label}</span>
                      {count !== null && (
                        <span className="cat-chip-count">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="cat-arrow-btn"
                onClick={() => scrollCategories('right')}
                aria-label="Défiler vers la droite"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* ─── Search Bar ─── */}
            <div className="drawer-search-row">
              <div className="drawer-search-box">
                <Search size={13} className="search-icon" />
                <input
                  type="text"
                  className="drawer-search-input"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Effacer"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              {contentCount !== null && (
                <span className="search-results-count">{contentCount}</span>
              )}
            </div>

            {/* ─── Content Scroll Area ─── */}
            <div className="drawer-scroll-area">
              {/* ── METRICS ── */}
              {activeType === 'metrics' && (
                <>
                  {filteredMetrics.length === 0 ? (
                    <div className="empty-state">Aucun résultat trouvé.</div>
                  ) : (
                    <div className="metrics-grid">
                  {filteredMetrics.map((def, i) => {
                    const val = metrics[def.id] !== undefined ? metrics[def.id] : 0;
                    return (
                      <div
                        key={def.id}
                        className="metric-card"
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        <div className="metric-card-header">
                          <span className={`metric-cat-tag cat-${def.cat}`}>
                            {CAT_LABELS_FR[def.cat] || def.cat}
                          </span>
                          <span className="metric-scope">
                            {SCOPE_LABELS_FR[def.scope] || ''}
                          </span>
                        </div>
                        <div
                          className="metric-value"
                          style={{ color: def.color || 'var(--cyan-bright)' }}
                        >
                          {def.prefix || ''}
                          {Number(val).toLocaleString('fr-FR')}
                        </div>
                        <div className="metric-label">{def.label}</div>
                        <div className="metric-unit">{def.unit}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── MARCHÉS & MATIÈRES PREMIÈRES (OSIRIS PARITY) ── */}
          {activeType === 'markets' && (
            <div className="markets-grid">
              {DEFENSE_COMMODITIES_MARKETS.filter((item) => {
                const q = searchQuery.toLowerCase();
                return !q || item.name.toLowerCase().includes(q) || item.symbol.toLowerCase().includes(q);
              }).map((m, i) => (
                <div
                  key={m.id}
                  className="market-card"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="market-card-header">
                    <span className="market-symbol-tag">{m.symbol}</span>
                    <span className={`market-change-badge ${m.positive ? 'positive' : 'negative'}`}>
                      {m.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {m.change}
                    </span>
                  </div>
                  <div>
                    <span className="market-price-val">{m.price}</span>
                    <span className="market-price-unit">{m.unit}</span>
                  </div>
                  <div className="market-name-label">{m.name}</div>
                  <div className="market-status-footer">
                    <span>COTATION SPOT</span>
                    <span style={{ color: '#00f5a0' }}>● DIRECT LIVE</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CCTV EN DIRECT ── */}
          {activeType === 'cctv' && (
            <>
              {/* Sub-category filter pills */}
              <div className="cctv-subfilter-bar">
                {[
                  { id: 'all', label: 'Tous', count: CCTV_FEEDS.length },
                  {
                    id: 'megapoles',
                    label: 'Villes & Capitales',
                    count: CCTV_FEEDS.filter((c) => {
                      const k = (c.category || '').toLowerCase();
                      return k.includes('mégapole') || k.includes('capitale') || k.includes('ville');
                    }).length,
                  },
                  {
                    id: 'maritime',
                    label: 'Maritime & Détroits',
                    count: CCTV_FEEDS.filter((c) => (c.category || '').toLowerCase().includes('maritime')).length,
                  },
                  {
                    id: 'aeroports',
                    label: 'Aéroports & Pistes',
                    count: CCTV_FEEDS.filter((c) => (c.category || '').toLowerCase().includes('aéroport')).length,
                  },
                  {
                    id: 'nature',
                    label: 'Nature & Monuments',
                    count: CCTV_FEEDS.filter((c) => {
                      const k = (c.category || '').toLowerCase();
                      return k.includes('nature') || k.includes('monument') || k.includes('site');
                    }).length,
                  },
                  {
                    id: 'espace',
                    label: 'Espace & Orbite',
                    count: CCTV_FEEDS.filter((c) => (c.category || '').toLowerCase().includes('espace')).length,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`cctv-subfilter-btn ${cctvFilter === item.id ? 'is-active' : ''}`}
                    onClick={() => {
                      sound.click(0.4);
                      setCctvFilter(item.id);
                    }}
                    onMouseEnter={() => sound.hover()}
                  >
                    <span>{item.label}</span>
                    <span className="subfilter-count">{item.count}</span>
                  </button>
                ))}
              </div>

              {filteredCCTV.length === 0 ? (
                <div className="empty-state">Aucun flux trouvé dans cette catégorie.</div>
              ) : (
                <div className="cctv-live-grid">
                  {filteredCCTV.map((cam, i) => (
                    <div
                      key={cam.id}
                      className="cctv-live-card"
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <div className="cctv-iframe-wrap">
                        <iframe
                          src={getPlayableUrl(cam.embedUrl)}
                          title={cam.name}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                        />
                        <div className="cctv-live-badge">
                          <span className="cctv-rec-dot" />
                          <span>EN DIRECT</span>
                        </div>
                        <button
                          type="button"
                          className="cctv-pip-expand-btn"
                          onClick={() => {
                            sound.click();
                            if (onSelectCCTV) onSelectCCTV(cam);
                          }}
                          title="Ouvrir dans le moniteur de surveillance PiP"
                        >
                          <Maximize2 size={11} />
                        </button>
                      </div>
                      <div className="cctv-live-info">
                        <div className="cctv-live-title">{cam.name}</div>
                        <div className="cctv-live-location">
                          {cam.city}, {cam.country}
                        </div>
                        <div className="cctv-live-meta">
                          <span>{cam.resolution}</span>
                          <span className="cctv-category-tag">{cam.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── SATELLITES ── */}
          {activeType === 'satellites' && (
            <>
              {filteredSatellites.length === 0 ? (
                <div className="empty-state">Aucun satellite trouvé.</div>
              ) : (
                <div className="sat-grid">
                  {filteredSatellites.map((sat, i) => (
                    <div
                      key={sat.id}
                      className="sat-card"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div className="sat-card-top">
                        <div className="sat-card-name">{sat.name}</div>
                        <span className="sat-card-code">{sat.code}</span>
                      </div>
                      <div className="sat-card-type">
                        {sat.type} — {sat.country}
                      </div>
                      <div className="sat-telemetry-row">
                        <div className="sat-stat">
                          <span className="sat-stat-label">Altitude</span>
                          <span className="sat-stat-value">
                            {sat.altitudeKm.toLocaleString('fr-FR')} km
                          </span>
                        </div>
                        <div className="sat-stat">
                          <span className="sat-stat-label">Vitesse</span>
                          <span className="sat-stat-value">
                            {sat.speedKmh.toLocaleString('fr-FR')} km/h
                          </span>
                        </div>
                        <div className="sat-stat">
                          <span className="sat-stat-label">Inclinaison</span>
                          <span className="sat-stat-value">{sat.inclination}°</span>
                        </div>
                      </div>
                      <div className="sat-card-bottom">
                        <span className="sat-norad">
                          NORAD {sat.noradId} • {sat.status}
                        </span>
                        <button
                          type="button"
                          className="sat-target-btn"
                          onClick={() => {
                            sound.click();
                            if (onSelectSatellite) onSelectSatellite(sat);
                          }}
                        >
                          <Crosshair size={10} />
                          <span>Cibler</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── OSINT RECON TOOLKIT (OSIRIS PARITY) ── */}
          {activeType === 'osint' && (
            <div className="osint-recon-wrapper">
              <div className="osint-preset-chips">
                {Object.keys(OSINT_DOSSIERS).map((targetKey) => (
                  <button
                    key={targetKey}
                    type="button"
                    className={`osint-preset-btn ${osintTarget === targetKey ? 'is-active' : ''}`}
                    onClick={() => {
                      sound.click(0.4);
                      setOsintTarget(targetKey);
                    }}
                  >
                    <Terminal size={10} style={{ display: 'inline', marginRight: 4 }} />
                    {targetKey}
                  </button>
                ))}
              </div>

              {(() => {
                const dossier = OSINT_DOSSIERS[osintTarget] || OSINT_DOSSIERS['8.8.8.8'];
                return (
                  <div className="osint-terminal-card">
                    <div className="osint-terminal-header">
                      <div className="osint-term-title">
                        <Terminal size={13} />
                        <span>DOSSIER // {dossier.target}</span>
                      </div>
                      <span className={`osint-score-pill ${dossier.threatLevel}`}>
                        {dossier.threatScore}
                      </span>
                    </div>

                    <div className="osint-row">
                      <span className="osint-key">Vecteur / Type</span>
                      <span className="osint-val cyan">{dossier.type}</span>
                    </div>
                    <div className="osint-row">
                      <span className="osint-key">ASN / Réseau</span>
                      <span className="osint-val">{dossier.asn}</span>
                    </div>
                    <div className="osint-row">
                      <span className="osint-key">Entité / Opérateur</span>
                      <span className="osint-val">{dossier.org}</span>
                    </div>
                    <div className="osint-row">
                      <span className="osint-key">Juridiction</span>
                      <span className="osint-val">{dossier.country}</span>
                    </div>
                    {dossier.reverseDns !== 'N/A' && (
                      <div className="osint-row">
                        <span className="osint-key">Reverse DNS</span>
                        <span className="osint-val cyan">{dossier.reverseDns}</span>
                      </div>
                    )}
                    <div className="osint-row">
                      <span className="osint-key">Ports & Protocoles</span>
                      <span className="osint-val">{dossier.ports}</span>
                    </div>
                    <div className="osint-row">
                      <span className="osint-key">Statut Global</span>
                      <span
                        className="osint-val"
                        style={{
                          color: dossier.threatLevel === 'danger' ? '#ff3366' : '#00f5a0',
                        }}
                      >
                        {dossier.status}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        fontSize: 10.5,
                        color: '#94a3b8',
                        lineHeight: 1.45,
                      }}
                    >
                      {dossier.description}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── RENSEIGNEMENT ── */}
          {activeType === 'intel' && (
            <div className="intel-feed">
              <div className="intel-section-title">
                <ShieldAlert size={13} />
                <span>Bulletins de situation</span>
                <span className="intel-count">{LIVE_BULLETINS.length}</span>
              </div>
              {LIVE_BULLETINS.map((b, i) => (
                <div
                  key={b.id}
                  className={`bulletin-card ${
                    b.level === 'CRITICAL' || b.level === 'CRITIQUE'
                      ? 'is-critical'
                      : 'is-info'
                  }`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="bulletin-header">
                    <span className="bulletin-tag">{b.tag}</span>
                    <span className="bulletin-time">{b.time}</span>
                  </div>
                  <div className="bulletin-title">{b.title}</div>
                  <div className="bulletin-body">{b.text}</div>
                  <span className="bulletin-source">Source : {b.origin}</span>
                </div>
              ))}

              <div className="intel-section-title intel-section-gap">
                <Globe size={13} />
                <span>Points chauds géopolitiques</span>
                <span className="intel-count">{HOTSPOTS.length}</span>
              </div>
              {HOTSPOTS.map((spot, i) => (
                <div
                  key={spot.id}
                  className="bulletin-card is-critical is-clickable"
                  style={{
                    animationDelay: `${(LIVE_BULLETINS.length + i) * 0.04}s`,
                  }}
                  onClick={() => {
                    sound.click();
                    if (onSelectLocation) onSelectLocation(spot.lat, spot.lng, 6);
                  }}
                >
                  <div className="bulletin-header">
                    <span className="bulletin-tag">{spot.level}</span>
                    <span className="bulletin-time">{spot.lastUpdate}</span>
                  </div>
                  <div className="bulletin-title">{spot.name}</div>
                  <div className="bulletin-body">
                    {spot.status} — {spot.details}
                  </div>
                  <div className="bulletin-actions">
                    <span className="bulletin-missiles">
                      Missiles actifs : {spot.activeMissiles}
                    </span>
                    <span className="bulletin-target-link">
                      Cibler sur la carte →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FICHE PAYS ── */}
          {activeType === 'country' && (
            <div className="country-dossier">
              <div className="country-header">
                <span className="country-subtitle">
                  Fiche de souveraineté & géopolitique
                </span>
                <div className="country-name">{countryData.name}</div>
                <span className="country-capital">
                  Capitale : {countryData.capital}
                </span>
              </div>
              <div className="country-grid">
                {[
                  {
                    label: "Niveau d'alerte",
                    value: countryData.defcon,
                    color: '#ef4444',
                  },
                  {
                    label: 'Indice de risque',
                    value: countryData.riskIndex,
                    color: null,
                  },
                  {
                    label: 'Population',
                    value: countryData.pop,
                    color: null,
                  },
                  {
                    label: 'Budget défense',
                    value: countryData.milBudget,
                    color: '#f59e0b',
                  },
                  {
                    label: 'Arsenal nucléaire',
                    value: countryData.nukes,
                    color: '#ef4444',
                  },
                  {
                    label: 'Alertes actives',
                    value: countryData.activeAlerts,
                    color: null,
                  },
                ].map((item) => (
                  <div key={item.label} className="country-stat">
                    <span className="country-stat-label">{item.label}</span>
                    <span
                      className="country-stat-value"
                      style={item.color ? { color: item.color } : undefined}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="country-status-card">
                <span className="country-status-label">
                  Statut opérationnel des forces
                </span>
                <div className="country-status-text">{countryData.status}</div>
              </div>
            </div>
          )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
