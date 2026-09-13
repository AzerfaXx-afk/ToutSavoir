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
  CYBER_ATTACK_VECTORS,
  TOP_ATTACKED_COUNTRIES,
  KASPERSKY_CATEGORIES,
  LIVE_CYBER_BULLETINS,
} from '../data/cyberThreats';
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
  Plane,
} from 'lucide-react';
import { flightRadarService } from '../services/flightRadarService';
import { ChronoJournalTab } from './ChronoJournalTab';
import './LiveTelemetryDrawer.css';

/* ── Unified Category System (Worldometer 64-Metrics & Osiris Feeds) ── */
const UNIFIED_CATEGORIES = [
  { id: 'all', label: 'Tout', type: 'metrics' },
  { id: 'aviation', label: 'Vols Flightradar24', type: 'aviation' },
  { id: 'population', label: 'Démographie', type: 'metrics' },
  { id: 'economy', label: 'Économie & Gouv', type: 'metrics' },
  { id: 'media', label: 'Société & Médias', type: 'metrics' },
  { id: 'environment', label: 'Environnement', type: 'metrics' },
  { id: 'food', label: 'Alimentation', type: 'metrics' },
  { id: 'water', label: 'Eau Potable', type: 'metrics' },
  { id: 'energy', label: 'Énergie & Réserves', type: 'metrics' },
  { id: 'health', label: 'Santé Publique', type: 'metrics' },
  { id: 'defense_markets', label: 'Marchés & Défense', type: 'markets' },
  { id: 'cyber', label: 'Cyber Menaces', type: 'cyber' },
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
  onInspectTarget,
  selectedCountry = 'FR',
}) {
  /* ── State ─────────────────────────────────────────────────────── */
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;

  const [activeCategory, setActiveCategory] = useState('all');
  const [drawerMode, setDrawerMode] = useState('metrics'); // 'metrics' | 'journal'
  const [cctvFilter, setCctvFilter] = useState('all');
  const [cyberFilter, setCyberFilter] = useState('ALL');
  const [cyberDetectionsTick, setCyberDetectionsTick] = useState(148291530);
  const [liveFlights, setLiveFlights] = useState([]);
  const [totalGlobalFlights, setTotalGlobalFlights] = useState(15650);
  const [flightFilter, setFlightFilter] = useState('ALL');
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

  /* ── Flightradar24 Live Planes Stream (Active only when Drawer is open) ─── */
  useEffect(() => {
    if (!isOpen) return;

    // Immediately sync current fleet upon drawer opening
    if (flightRadarService.flights.length > 0) {
      setLiveFlights(flightRadarService.flights);
      if (flightRadarService.totalGlobalFlights) {
        setTotalGlobalFlights(flightRadarService.totalGlobalFlights);
      }
    }

    // Throttled subscription (1.8s) for smooth drawer scrolling and zero UI stutter
    let lastUpdate = Date.now();
    const unsub = flightRadarService.subscribe((flights, total) => {
      const now = Date.now();
      if (now - lastUpdate >= 1800) {
        lastUpdate = now;
        setLiveFlights(flights || []);
        if (total) setTotalGlobalFlights(total);
      }
    });
    return () => unsub();
  }, [isOpen]);

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

  /* ── Cyber Live Detections Ticker ─────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      setCyberDetectionsTick((prev) => prev + Math.floor(2200 + Math.random() * 500));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const filteredCyber = useMemo(() => {
    return CYBER_ATTACK_VECTORS.filter((att) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        att.threatActor.toLowerCase().includes(q) ||
        att.fromCity.toLowerCase().includes(q) ||
        att.toCity.toLowerCase().includes(q) ||
        att.fromCountry.toLowerCase().includes(q) ||
        att.toCountry.toLowerCase().includes(q) ||
        att.targetSector.toLowerCase().includes(q) ||
        (att.cve && att.cve.toLowerCase().includes(q)) ||
        (att.type && att.type.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (cyberFilter === 'ALL') return true;
      return att.kasperskyCat === cyberFilter || att.category === cyberFilter;
    });
  }, [searchQuery, cyberFilter]);

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

  const filteredFlights = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return liveFlights.filter((fl) => {
      const matchesSearch =
        !q ||
        (fl.callsign && fl.callsign.toLowerCase().includes(q)) ||
        (fl.flightNum && fl.flightNum.toLowerCase().includes(q)) ||
        (fl.airline && fl.airline.toLowerCase().includes(q)) ||
        (fl.aircraft && fl.aircraft.toLowerCase().includes(q)) ||
        (fl.origin?.city && fl.origin.city.toLowerCase().includes(q)) ||
        (fl.origin?.code && fl.origin.code.toLowerCase().includes(q)) ||
        (fl.destination?.city && fl.destination.city.toLowerCase().includes(q)) ||
        (fl.destination?.code && fl.destination.code.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (flightFilter === 'ALL') return true;
      return (fl.airline || '').toLowerCase().includes(flightFilter.toLowerCase());
    });
  }, [liveFlights, searchQuery, flightFilter]);

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
    if (activeType === 'aviation') return filteredFlights.length;
    if (activeType === 'markets') return DEFENSE_COMMODITIES_MARKETS.length;
    if (activeType === 'cyber') return filteredCyber.length;
    if (activeType === 'cctv') return filteredCCTV.length;
    if (activeType === 'satellites') return filteredSatellites.length;
    if (activeType === 'osint') return Object.keys(OSINT_DOSSIERS).length;
    return null;
  }, [activeType, filteredMetrics, filteredFlights, filteredCyber, filteredCCTV, filteredSatellites]);

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
              selectedDate={customDate || new Date()}
              metrics={metrics}
              onSelectLocation={onSelectLocation}
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
                      : cat.type === 'aviation'
                      ? liveFlights.length
                      : cat.type === 'markets'
                      ? DEFENSE_COMMODITIES_MARKETS.length
                      : cat.type === 'cyber'
                      ? CYBER_ATTACK_VECTORS.length
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

          {/* ── VOLS EN DIRECT FLIGHTRADAR24 (ADS-B STREAMING RÉEL) ── */}
          {activeType === 'aviation' && (
            <div className="fr24-aviation-feed-wrapper">
              {/* Flightradar24 Cockpit Status Header Card */}
              <div className="fr24-header-card">
                <div className="fr24-header-top">
                  <div className="fr24-radar-indicator">
                    <span className="fr24-pulse-ring" />
                    <span className="fr24-pulse-dot" />
                    <span className="fr24-source-title">FLIGHTRADAR24 // RADAR ADS-B EN DIRECT</span>
                  </div>
                  <span className="fr24-live-pill">● DIRECT 1X VITESSE RÉELLE</span>
                </div>

                <div className="fr24-stats-row">
                  <div className="fr24-stat-box">
                    <span className="fr24-stat-label">VOLS CAPTÉS EN TEMPS RÉEL</span>
                    <span className="fr24-stat-value gold">
                      {liveFlights.length > 0 ? liveFlights.length.toLocaleString('fr-FR') : 'Connexion...'}
                    </span>
                  </div>
                  <div className="fr24-stat-box align-right">
                    <span className="fr24-stat-label">TRAFIC MONDIAL ESTIMÉ</span>
                    <span className="fr24-stat-value">
                      ~{totalGlobalFlights.toLocaleString('fr-FR')} vols
                    </span>
                  </div>
                </div>

                {/* Quick Airlines Filters */}
                <div className="fr24-airline-filters">
                  {[
                    { id: 'ALL', label: `TOUS (${liveFlights.length})` },
                    { id: 'Air France', label: 'Air France' },
                    { id: 'British Airways', label: 'British Airways' },
                    { id: 'Lufthansa', label: 'Lufthansa' },
                    { id: 'Emirates', label: 'Emirates' },
                    { id: 'Ryanair', label: 'Ryanair' },
                    { id: 'easyJet', label: 'easyJet' },
                    { id: 'Delta', label: 'Delta' },
                    { id: 'United', label: 'United' },
                    { id: 'American', label: 'American' },
                    { id: 'Qatar', label: 'Qatar Airways' },
                    { id: 'Turkish', label: 'Turkish Airlines' },
                  ].map((air) => (
                    <button
                      key={air.id}
                      type="button"
                      className={`fr24-airline-chip ${flightFilter === air.id ? 'is-active' : ''}`}
                      onClick={() => {
                        sound.click(0.4);
                        setFlightFilter(air.id);
                      }}
                    >
                      {air.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flights Counter and Result Bar */}
              <div className="fr24-list-header">
                <div className="fr24-list-title">
                  <Plane size={13} style={{ color: '#ffd700' }} />
                  <span>FLOTTE COMMERCIALE EN VOL DIRECT</span>
                  <span className="fr24-list-count">
                    {filteredFlights.length} affichés
                  </span>
                </div>
                <span className="fr24-list-note">CLIQUEZ POUR TÉLÉMÉTRIE & TRAJECTOIRE</span>
              </div>

              {/* Flights Grid / Cards */}
              {filteredFlights.length === 0 ? (
                <div className="empty-state">
                  Aucun vol ne correspond aux critères de recherche actuels.
                </div>
              ) : (
                <div className="fr24-flights-grid">
                  {filteredFlights.slice(0, 120).map((fl, idx) => (
                    <div
                      key={fl.id || idx}
                      className="fr24-flight-card is-clickable"
                      style={{ animationDelay: `${Math.min(idx * 0.02, 0.6)}s` }}
                      onClick={() => {
                        sound.click();
                        if (onSelectLocation) onSelectLocation(fl.lat, fl.lng, 7);
                        if (onInspectTarget) onInspectTarget({ type: 'flight', ...fl });
                      }}
                    >
                      <div className="fr24-card-top">
                        <div className="fr24-card-callsign-group">
                          <div
                            className="fr24-mini-plane-icon"
                            style={{ transform: `rotate(${fl.track || 0}deg)` }}
                          >
                            <Plane size={14} color="#ffd700" />
                          </div>
                          <div>
                            <div className="fr24-callsign">{fl.callsign}</div>
                            <div className="fr24-flight-num">{fl.flightNum || fl.callsign}</div>
                          </div>
                        </div>

                        <div className="fr24-airline-badge">
                          <span>{fl.airlineFlag || '✈️'}</span>
                          <span className="fr24-airline-name">{fl.airline}</span>
                        </div>
                      </div>

                      {/* Route corridor badges */}
                      <div className="fr24-card-route">
                        <div className="fr24-route-endpoint">
                          <span className="fr24-airport-code">{fl.origin?.code || 'DEP'}</span>
                          <span className="fr24-airport-city">{fl.origin?.city || 'Origine'}</span>
                        </div>
                        <div className="fr24-route-arrow">
                          <span className="fr24-arrow-line" />
                          <Plane size={10} color="#ffd700" style={{ transform: `rotate(${fl.track || 90}deg)` }} />
                          <span className="fr24-arrow-line" />
                        </div>
                        <div className="fr24-route-endpoint align-right">
                          <span className="fr24-airport-code">{fl.destination?.code || 'ARR'}</span>
                          <span className="fr24-airport-city">{fl.destination?.city || 'Destination'}</span>
                        </div>
                      </div>

                      {/* Telemetry metrics strip */}
                      <div className="fr24-telemetry-strip">
                        <div className="fr24-tel-col">
                          <span className="fr24-tel-label">ALTITUDE</span>
                          <span className="fr24-tel-val cyan">
                            {fl.altitudeFt?.toLocaleString('fr-FR')} ft
                          </span>
                        </div>
                        <div className="fr24-tel-col">
                          <span className="fr24-tel-label">VITESSE</span>
                          <span className="fr24-tel-val gold">
                            {fl.speedKts} kts
                          </span>
                        </div>
                        <div className="fr24-tel-col">
                          <span className="fr24-tel-label">CAP</span>
                          <span className="fr24-tel-val">
                            {fl.track}°
                          </span>
                        </div>
                        <div className="fr24-tel-col align-right">
                          <span className="fr24-tel-label">APPAREIL</span>
                          <span className="fr24-tel-val model">
                            {fl.aircraftCode || fl.aircraft?.split(' ')[0] || 'Avion'}
                          </span>
                        </div>
                      </div>

                      <div className="fr24-card-footer">
                        <span className="fr24-squawk-tag">SQK {fl.squawk || '2000'}</span>
                        <span className="fr24-inspect-cta">CIBLER & INSPECTER →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

          {/* ── CYBER GUERRE & MENACES (KASPERSKY CYBERMAP PARITY) ── */}
          {activeType === 'cyber' && (
            <div className="cyber-intel-wrapper">
              {/* Kaspersky Global Threat Ticker Card */}
              <div className="cyber-global-ticker-card">
                <div className="cyber-ticker-top">
                  <div className="cyber-ticker-live-status">
                    <span className="cyber-pulse-dot" />
                    <span className="cyber-ticker-source">KASPERSKY LABS // REAL-TIME SENSORS</span>
                  </div>
                  <span className="cyber-threat-badge-defcon">DEFCON 2 // CYBER ALERTE</span>
                </div>

                <div className="cyber-counter-row">
                  <div className="cyber-stat-col">
                    <span className="cyber-stat-label">ATTAQUES DÉTECTÉES AUJOURD'HUI</span>
                    <span className="cyber-stat-big-val">
                      {cyberDetectionsTick.toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="cyber-stat-col align-right">
                    <span className="cyber-stat-label">DÉBIT INSTANTANÉ</span>
                    <span className="cyber-rate-val">~2 468 / sec</span>
                  </div>
                </div>

                {/* Kaspersky Threat Taxonomy Filters */}
                <div className="cyber-taxonomy-filters">
                  <button
                    type="button"
                    className={`cyber-cat-chip ${cyberFilter === 'ALL' ? 'is-active' : ''}`}
                    onClick={() => {
                      sound.click(0.4);
                      setCyberFilter('ALL');
                    }}
                  >
                    <span>TOUS ({CYBER_ATTACK_VECTORS.length})</span>
                  </button>
                  {KASPERSKY_CATEGORIES.map((kcat) => {
                    const cnt = CYBER_ATTACK_VECTORS.filter(
                      (v) => v.kasperskyCat === kcat.id || v.category === kcat.id
                    ).length;
                    return (
                      <button
                        key={kcat.id}
                        type="button"
                        className={`cyber-cat-chip ${cyberFilter === kcat.id ? 'is-active' : ''}`}
                        style={{ '--chip-color': kcat.color }}
                        onClick={() => {
                          sound.click(0.4);
                          setCyberFilter(kcat.id);
                        }}
                        title={kcat.name}
                      >
                        <span className="cyber-cat-code" style={{ color: kcat.color }}>{kcat.id}</span>
                        <span className="cyber-cat-name">{kcat.name}</span>
                        {cnt > 0 && <span className="cyber-cat-cnt">{cnt}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top 10 Most Targeted Nations (Kaspersky Radar) */}
              <div className="cyber-ranking-section">
                <div className="cyber-section-header">
                  <Globe size={13} style={{ color: '#00f2fe' }} />
                  <span>TOP PAYS LES PLUS CIBLÉS EN TEMPS RÉEL</span>
                  <span className="cyber-section-sub">KASPERSKY LIVE RANKING</span>
                </div>
                <div className="cyber-ranking-grid">
                  {TOP_ATTACKED_COUNTRIES.map((c) => (
                    <div
                      key={c.code}
                      className="cyber-rank-card is-clickable"
                      onClick={() => {
                        sound.click();
                        if (onSelectLocation) onSelectLocation(c.lat, c.lng, 5);
                      }}
                      title={`Cibler ${c.country} sur le globe`}
                    >
                      <div className="cyber-rank-left">
                        <span className="cyber-rank-num">#{c.rank}</span>
                        <span className="cyber-rank-flag">{c.flag}</span>
                        <div className="cyber-rank-names">
                          <span className="cyber-country-name">{c.country}</span>
                          <span className="cyber-country-attacks">{c.attacks}</span>
                        </div>
                      </div>
                      <div className="cyber-rank-right">
                        <span className="cyber-share-pct">{c.share}</span>
                        <span className={`cyber-sev-tag ${c.severity ? c.severity.toLowerCase() : 'info'}`}>
                          {c.severity || 'INFO'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Cyber Attack Vectors Feed */}
              <div className="cyber-vectors-section">
                <div className="cyber-section-header">
                  <ShieldAlert size={13} style={{ color: '#ec4899' }} />
                  <span>VECTEURS D'ATTAQUES & APT ACTIFS</span>
                  <span className="cyber-section-count">{filteredCyber.length} ACTIFS</span>
                </div>

                {filteredCyber.length === 0 ? (
                  <div className="empty-state">Aucun vecteur correspondant au filtre.</div>
                ) : (
                  <div className="cyber-attacks-list">
                    {filteredCyber.map((vec, i) => (
                      <div
                        key={vec.id}
                        className="cyber-attack-card"
                        style={{
                          animationDelay: `${i * 0.03}s`,
                          borderLeftColor: vec.color || '#ec4899',
                        }}
                      >
                        <div className="cyber-card-header">
                          <div className="cyber-threat-actor-group">
                            <span
                              className="cyber-cat-badge"
                              style={{
                                backgroundColor: `${vec.color || '#ec4899'}22`,
                                color: vec.color || '#ec4899',
                                borderColor: `${vec.color || '#ec4899'}55`,
                              }}
                            >
                              [{vec.kasperskyCat || vec.category || 'APT'}]
                            </span>
                            <span className="cyber-threat-actor-name">{vec.threatActor}</span>
                          </div>
                          <span
                            className={`cyber-card-severity ${
                              vec.severity === 'CRITICAL' ? 'is-critical' : 'is-high'
                            }`}
                          >
                            {vec.severity === 'CRITICAL' ? '● CRITIQUE' : '● ÉLEVÉ'}
                          </span>
                        </div>

                        {/* Trajectory corridor */}
                        <div className="cyber-route-corridor">
                          <span className="cyber-corridor-from">
                            {vec.fromCity} <span className="cyber-cc">({vec.fromCountry})</span>
                          </span>
                          <span className="cyber-corridor-arrow" style={{ color: vec.color || '#ec4899' }}>
                            ⚡➔
                          </span>
                          <span className="cyber-corridor-to">
                            {vec.toCity} <span className="cyber-cc">({vec.toCountry})</span>
                          </span>
                        </div>

                        {/* Specs grid */}
                        <div className="cyber-card-specs">
                          <div className="cyber-spec-item">
                            <span className="cyber-spec-lbl">Cible :</span>
                            <span className="cyber-spec-val" style={{ color: '#f43f5e' }}>{vec.targetSector}</span>
                          </div>
                          <div className="cyber-spec-item">
                            <span className="cyber-spec-lbl">Port :</span>
                            <span className="cyber-spec-val mono">{vec.port} ({vec.proto || 'TCP'})</span>
                          </div>
                          {vec.cve && (
                            <div className="cyber-spec-item">
                              <span className="cyber-spec-lbl">CVE :</span>
                              <span className="cyber-spec-val purple mono">{vec.cve}</span>
                            </div>
                          )}
                          <div className="cyber-spec-item">
                            <span className="cyber-spec-lbl">Débit :</span>
                            <span className="cyber-spec-val cyan mono">{vec.volume}</span>
                          </div>
                        </div>

                        {/* Forensic Notes */}
                        {vec.forensicNote && (
                          <div className="cyber-card-notes">
                            {vec.forensicNote}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="cyber-card-actions">
                          <button
                            type="button"
                            className="cyber-target-inspect-btn"
                            onClick={() => {
                              sound.click();
                              if (onInspectTarget) onInspectTarget({ type: 'cyber', ...vec });
                              if (onSelectLocation) onSelectLocation(vec.to[0], vec.to[1], 6);
                            }}
                            title="Inspecter le vecteur et localiser l'impact sur la carte"
                          >
                            <Crosshair size={12} />
                            <span>CIBLER & INSPECTER</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Official CERT-FR / CISA / ANSSI Bulletins */}
              <div className="cyber-bulletins-section">
                <div className="cyber-section-header">
                  <Terminal size={13} style={{ color: '#00f5a0' }} />
                  <span>BULLETINS OFFICIELS // CERT-FR & CISA KEV</span>
                  <span className="cyber-section-count">{LIVE_CYBER_BULLETINS.length} AVIS</span>
                </div>
                <div className="cyber-bulletins-list">
                  {LIVE_CYBER_BULLETINS.map((b) => (
                    <div key={b.id} className="cyber-bulletin-card">
                      <div className="cyber-bulletin-head">
                        <span className="cyber-bulletin-ref">{b.ref}</span>
                        <span className="cyber-bulletin-source">{b.source}</span>
                        <span className={`cyber-bulletin-urgency ${b.severity.toLowerCase()}`}>
                          {b.severity}
                        </span>
                      </div>
                      <div className="cyber-bulletin-title">{b.title}</div>
                      <div className="cyber-bulletin-cve">CVE : <b>{b.cve}</b> • CVSS : <b>{b.cvss}</b></div>
                      <div className="cyber-bulletin-impact">{b.impact}</div>
                      <div className="cyber-bulletin-mitigation">
                        <span className="cyber-mitigation-tag">MESURE REQUISE :</span> {b.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
