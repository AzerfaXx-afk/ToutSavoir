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
  LIVE_NEWS_CHANNELS,
  DEFENSE_COMMODITIES_MARKETS,
  SUBMARINE_CABLES,
  STRATEGIC_NUCLEAR_SITES,
} from '../data/osirisStreams';
import {
  computeSatelliteState,
  SATELLITE_ORBIT_CATEGORIES,
  matchesSatelliteCategory,
} from '../utils/satelliteOrbital';
import {
  TV_COUNTRIES,
  WORLD_TV_CHANNELS,
} from '../data/worldTvChannels';
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
  Search,
  X,
  Crosshair,
  Video,
  Tv,
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
  Play,
  Anchor,
  Radiation,
  Radio,
  Compass,
  Waves,
  AlertTriangle,
  ExternalLink,
  Layers,
  Wifi,
} from 'lucide-react';
import { flightRadarService } from '../services/flightRadarService';
import { marineTrafficService } from '../services/marineTrafficService';
import { ChronoJournalTab } from './ChronoJournalTab';
import { MasterLiveTheater } from './MasterLiveTheater';
import { InlineLiveCard } from './InlineLiveCard';
import './LiveTelemetryDrawer.css';

/* ── Unified Category System (Worldometer 64-Metrics & Osiris Feeds) ── */
const UNIFIED_CATEGORIES = [
  { id: 'all', label: 'Tout', type: 'metrics' },
  { id: 'aviation', label: 'Vols Flightradar24', type: 'aviation' },
  { id: 'maritime', label: 'Flotte Maritime AIS', type: 'maritime' },
  { id: 'telluric', label: 'Séismes USGS Direct', type: 'telluric' },
  { id: 'infrastructure', label: 'Câbles & Nucléaire', type: 'infrastructure' },
  { id: 'defense_markets', label: 'Marchés & Matières Premières', type: 'markets' },
  { id: 'tv_news', label: 'Télévision Monde 24/7', type: 'tv_news' },
  { id: 'cyber', label: 'Cyber Menaces', type: 'cyber' },
  { id: 'video', label: 'Webcams & DOT en Direct', type: 'cctv' },
  { id: 'population', label: 'Démographie', type: 'metrics' },
  { id: 'economy', label: 'Économie & Gouv', type: 'metrics' },
  { id: 'media', label: 'Société & Médias', type: 'metrics' },
  { id: 'environment', label: 'Environnement', type: 'metrics' },
  { id: 'food', label: 'Alimentation', type: 'metrics' },
  { id: 'water', label: 'Eau Potable', type: 'metrics' },
  { id: 'energy', label: 'Énergie & Réserves', type: 'metrics' },
  { id: 'health', label: 'Santé Publique', type: 'metrics' },
  { id: 'satellites', label: 'Satellites', type: 'satellites' },
  { id: 'osint', label: 'OSINT Recon', type: 'osint' },
  { id: 'intel', label: 'Renseignement', type: 'intel' },
  { id: 'country', label: 'Fiche Pays', type: 'country' },
];

const MARKET_CATEGORIES = [
  { id: 'ALL', label: 'TOUS LES ACTIFS' },
  { id: 'energy', label: 'ÉNERGIE & HYDROCARBURES' },
  { id: 'metals', label: 'MÉTAUX STRATÉGIQUES & CRITIQUES' },
  { id: 'defense', label: 'DÉFENSE & INDUSTRIE' },
  { id: 'agriculture', label: 'AGRO-ALIMENTAIRE' },
  { id: 'crypto', label: 'CRYPTO-ACTIFS' },
  { id: 'indices', label: 'INDICES MONDIAUX' },
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

/* ── Strategic Maritime Chokepoints (AIS Fleet corridors) ────────── */
const MARITIME_CHOKEPOINTS = [
  { id: 'hormuz', name: "Détroit d'Ormuz", desc: '30% du brut maritime mondial (Golfe Persique)', lat: 26.5667, lng: 56.25, zoom: 8, status: 'SURVEILLANCE RENFORCÉE' },
  { id: 'suez', name: 'Canal de Suez', desc: '12% du fret mondial / Passage Asie-Europe', lat: 30.705, lng: 32.344, zoom: 9, status: 'TRANSIT CONTINU' },
  { id: 'malacca', name: 'Détroit de Malacca', desc: 'Corridor Indo-Pacifique (94 000 navires/an)', lat: 2.2, lng: 102.1, zoom: 8, status: 'DENSITÉ CRITIQUE' },
  { id: 'panama', name: 'Canal de Panama', desc: 'Liaison Atlantique-Pacifique', lat: 9.08, lng: -79.68, zoom: 9, status: 'RÉGULATION HYDRAULIQUE' },
  { id: 'babelmandeb', name: 'Bab-el-Mandeb', desc: 'Verrou Sud Mer Rouge (Veille maritime)', lat: 12.58, lng: 43.33, zoom: 8, status: 'VEILLE DÉFENSE' },
  { id: 'bosphore', name: 'Détroit du Bosphore', desc: 'Transit Mer Noire & Méditerranée', lat: 41.12, lng: 29.07, zoom: 9, status: 'CORRIDOR RÉGULÉ' },
];

const MARITIME_FILTER_CATEGORIES = [
  { id: 'ALL', label: 'TOUS' },
  { id: 'cargo', label: 'CONTENEURS & VRAC' },
  { id: 'tanker', label: 'CITERNES & GNL' },
  { id: 'passenger', label: 'PASSAGERS' },
  { id: 'military', label: 'MILITAIRE' },
  { id: 'tug', label: 'REMORQUEURS' },
  { id: 'fishing', label: 'PÊCHE' },
];

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
  const [cctvSubMode, setCctvSubMode] = useState('cameras'); // 'cameras' | 'tv'
  const [activeMasterCamera, setActiveMasterCamera] = useState(() => {
    return CCTV_FEEDS.find((c) => c.id === 'cctv-fr-paris-eiffel') || CCTV_FEEDS[0];
  });
  const [activeMasterTV, setActiveMasterTV] = useState(() => WORLD_TV_CHANNELS[0]);
  const [cctvFilter, setCctvFilter] = useState('all');
  const [tvCountry, setTvCountry] = useState('all');
  const [cyberFilter, setCyberFilter] = useState('ALL');
  const [cyberDetectionsTick, setCyberDetectionsTick] = useState(148291530);
  const [liveFlights, setLiveFlights] = useState([]);
  const [totalGlobalFlights, setTotalGlobalFlights] = useState(15650);
  const [flightFilter, setFlightFilter] = useState('ALL');
  const [liveVessels, setLiveVessels] = useState(() => marineTrafficService.vessels || []);
  const [totalGlobalVessels, setTotalGlobalVessels] = useState(() => marineTrafficService.totalGlobalVessels || 25910);
  const [vesselFilter, setVesselFilter] = useState('ALL');
  const [liveEarthquakes, setLiveEarthquakes] = useState(() => realtimeStream.stats?.recentEarthquakes || []);
  const [earthquakeFilter, setEarthquakeFilter] = useState('ALL');
  const [infraSubMode, setInfraSubMode] = useState('cables'); // 'cables' | 'nuclear'
  const [satelliteCategory, setSatelliteCategory] = useState('ALL');
  const [satTick, setSatTick] = useState(0);
  const [marketFilter, setMarketFilter] = useState('ALL');
  const [osintTarget, setOsintTarget] = useState('8.8.8.8');
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState(() => computeWorldometerMetrics(1));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [localDate, setLocalDate] = useState('');

  // Continuous real-time orbital telemetry ticker (every 2.5s)
  useEffect(() => {
    const satTimer = setInterval(() => {
      setSatTick((t) => t + 1);
    }, 2500);
    return () => clearInterval(satTimer);
  }, []);
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

  /* ── Live Clock & Date Display Engine (100% Direct Temps Réel) ─── */
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLocalTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setLocalDate(
        now
          .toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          .toUpperCase()
      );
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Sync customDate back to live mode whenever parent resets year to 2026
  useEffect(() => {
    if (selectedYear === 2026 && customDateRef.current !== null) {
      customDateRef.current = null;
      setCustomDate(null);
    }
  }, [selectedYear]);

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

  /* ── USGS Live Earthquakes Stream (NEIC 24h Feed) ──────────────── */
  useEffect(() => {
    if (realtimeStream.stats?.recentEarthquakes?.length > 0) {
      setLiveEarthquakes(realtimeStream.stats.recentEarthquakes);
    } else {
      realtimeStream.fetchUsgsEarthquakes();
    }

    const unsub = realtimeStream.subscribe((data) => {
      if (data.type === 'snapshot' && data.stats?.recentEarthquakes) {
        setLiveEarthquakes(data.stats.recentEarthquakes);
      } else if (data.type === 'earthquakes_update' && data.earthquakes) {
        setLiveEarthquakes(data.earthquakes);
      }
    });
    return () => unsub();
  }, []);

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

  /* ── MarineTraffic AIS Live Fleet Stream (Active only when Drawer is open) ─── */
  useEffect(() => {
    if (!isOpen) return;

    // Immediately sync current vessels
    if (marineTrafficService.vessels.length > 0) {
      setLiveVessels(marineTrafficService.vessels);
      if (marineTrafficService.totalGlobalVessels) {
        setTotalGlobalVessels(marineTrafficService.totalGlobalVessels);
      }
    }

    let lastUpdate = Date.now();
    const unsub = marineTrafficService.subscribe((vessels, total) => {
      const now = Date.now();
      if (now - lastUpdate >= 1800) {
        lastUpdate = now;
        setLiveVessels(vessels || []);
        if (total) setTotalGlobalVessels(total);
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
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.source && c.source.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (cctvFilter === 'all') return true;
      const cat = (c.category || '').toLowerCase();
      if (cctvFilter === 'traffic') return cat.includes('trafic') || cat.includes('autoroute') || cat.includes('dot') || c.isLiveSnapshot;
      if (cctvFilter === 'megapoles') return cat.includes('mégapole') || cat.includes('capitale') || cat.includes('ville');
      if (cctvFilter === 'maritime') return cat.includes('maritime') || cat.includes('chokepoint') || cat.includes('canal') || cat.includes('détroit') || cat.includes('port');
      if (cctvFilter === 'aeroports') return cat.includes('aéroport') || cat.includes('piste');
      if (cctvFilter === 'nature') return cat.includes('nature') || cat.includes('volcan') || cat.includes('monument') || cat.includes('site');
      if (cctvFilter === 'espace') return cat.includes('espace') || cat.includes('orbite');
      return true;
    });
  }, [searchQuery, cctvFilter]);

  const filteredTV = useMemo(() => {
    return WORLD_TV_CHANNELS.filter((tv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        tv.name.toLowerCase().includes(q) ||
        (tv.network && tv.network.toLowerCase().includes(q)) ||
        (tv.city && tv.city.toLowerCase().includes(q)) ||
        (tv.country && tv.country.toLowerCase().includes(q)) ||
        (tv.category && tv.category.toLowerCase().includes(q)) ||
        (tv.countryCode && tv.countryCode.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (tvCountry === 'all') return true;
      return tv.countryCode === tvCountry;
    });
  }, [searchQuery, tvCountry]);

  const filteredSatellites = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return SATELLITES_DATA.filter((s) => {
      if (satelliteCategory !== 'ALL' && !matchesSatelliteCategory(s, satelliteCategory)) {
        return false;
      }
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        (s.type && s.type.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, satelliteCategory]);

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

  const filteredVessels = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return liveVessels.filter((v) => {
      const matchesSearch =
        !q ||
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.callsign && v.callsign.toLowerCase().includes(q)) ||
        (v.flag && v.flag.toLowerCase().includes(q)) ||
        (v.type && v.type.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q)) ||
        (v.originPort && v.originPort.toLowerCase().includes(q)) ||
        (v.destinationPort && v.destinationPort.toLowerCase().includes(q)) ||
        (v.chokepoint && v.chokepoint.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (vesselFilter === 'ALL') return true;
      const cat = (v.category || '').toLowerCase();
      return cat.includes(vesselFilter.toLowerCase());
    });
  }, [liveVessels, searchQuery, vesselFilter]);

  const filteredEarthquakes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return liveEarthquakes.filter((eq) => {
      const matchesSearch =
        !q ||
        (eq.place && eq.place.toLowerCase().includes(q)) ||
        (eq.rawPlace && eq.rawPlace.toLowerCase().includes(q)) ||
        (eq.mag && eq.mag.toString().includes(q));

      if (!matchesSearch) return false;
      if (earthquakeFilter === 'ALL') return true;
      if (earthquakeFilter === 'M5') return eq.numMag >= 5.0;
      if (earthquakeFilter === 'M4') return eq.numMag >= 4.0;
      if (earthquakeFilter === 'M3') return eq.numMag >= 3.0;
      if (earthquakeFilter === 'TSUNAMI') return eq.tsunami === true;
      return true;
    });
  }, [liveEarthquakes, searchQuery, earthquakeFilter]);

  const filteredCables = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return SUBMARINE_CABLES.filter((cable) => {
      return (
        !q ||
        cable.name.toLowerCase().includes(q) ||
        (cable.owners && cable.owners.toLowerCase().includes(q)) ||
        (cable.status && cable.status.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  const filteredNuclear = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return STRATEGIC_NUCLEAR_SITES.filter((site) => {
      return (
        !q ||
        site.name.toLowerCase().includes(q) ||
        site.country.toLowerCase().includes(q) ||
        site.region.toLowerCase().includes(q) ||
        site.operator.toLowerCase().includes(q) ||
        site.type.toLowerCase().includes(q) ||
        site.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const filteredMarkets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return DEFENSE_COMMODITIES_MARKETS.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.symbol.toLowerCase().includes(q) ||
        (m.exchange && m.exchange.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (marketFilter === 'ALL') return true;
      return m.category === marketFilter;
    });
  }, [searchQuery, marketFilter]);

  /* ── Country data ──────────────────────────────────────────────── */
  const countryData = useMemo(() => {
    const code = selectedCountry || 'FR';
    if (COUNTRIES_TELEMETRY[code]) {
      return COUNTRIES_TELEMETRY[code];
    }
    const name = TERRITORY_NAMES_FR[code] || code;
    return {
      name,
      capital: 'Donnée nationale souveraine',
      defcon: 'SURVEILLANCE',
      riskIndex: 'MODÉRÉ (3.0/10)',
      pop: 'Recensement en cours',
      milBudget: 'Indice SIPRI standard',
      nukes: 'Non signataire nucléaire militaire',
      activeAlerts: 0,
      status: 'Surveillance satellite et côtière active',
    };
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
    if (activeType === 'maritime') return filteredVessels.length;
    if (activeType === 'telluric') return filteredEarthquakes.length;
    if (activeType === 'infrastructure') return infraSubMode === 'cables' ? filteredCables.length : filteredNuclear.length;
    if (activeType === 'markets') return filteredMarkets.length;
    if (activeType === 'tv_news') return filteredTV.length;
    if (activeType === 'cyber') return filteredCyber.length;
    if (activeType === 'cctv') return cctvSubMode === 'cameras' ? filteredCCTV.length : filteredTV.length;
    if (activeType === 'satellites') return filteredSatellites.length;
    if (activeType === 'osint') return Object.keys(OSINT_DOSSIERS).length;
    return null;
  }, [
    activeType,
    filteredMetrics,
    filteredFlights,
    filteredVessels,
    filteredEarthquakes,
    filteredCables,
    filteredNuclear,
    infraSubMode,
    filteredMarkets,
    filteredCyber,
    filteredCCTV,
    filteredTV,
    cctvSubMode,
    filteredSatellites,
  ]);

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
            {/* Big Prominent Digital Monospace Clock */}
            <div className="drawer-time-display-clean">
              <span className="drawer-time-big">{localTime}</span>
            </div>

            {/* Current Day Subtitle */}
            <div className="drawer-date-subtitle-row">
              <Calendar size={11} className="chrono-calendar-icon" />
              <span className="drawer-date-text">{localDate}</span>
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
                      ? (liveFlights.length || totalGlobalFlights)
                      : cat.type === 'maritime'
                      ? (liveVessels.length || totalGlobalVessels)
                      : cat.type === 'telluric'
                      ? liveEarthquakes.length
                      : cat.type === 'infrastructure'
                      ? SUBMARINE_CABLES.length + STRATEGIC_NUCLEAR_SITES.length
                      : cat.type === 'markets'
                      ? DEFENSE_COMMODITIES_MARKETS.length
                      : cat.type === 'tv_news'
                      ? WORLD_TV_CHANNELS.length
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

          {/* ── FLOTTE MARITIME AIS (MARINETRAFFIC / VDL DIRECT) ── */}
          {activeType === 'maritime' && (
            <div className="maritime-fleet-wrapper">
              {/* Global Fleet Status Header Card */}
              <div className="fr24-global-radar-card maritime-radar-card">
                <div className="fr24-radar-top">
                  <div className="fr24-radar-live-indicator">
                    <span className="fr24-ping-dot green" />
                    <span className="fr24-radar-source">MARINETRAFFIC AIS // VDL SATELLITE</span>
                  </div>
                  <span className="fr24-tracked-badge green">
                    <Anchor size={11} style={{ marginRight: 4 }} />
                    DIRECT AIS MONDIAL
                  </span>
                </div>

                <div className="fr24-big-counter-row">
                  <div className="fr24-counter-stat">
                    <span className="fr24-stat-label">NAVIRES DÉTECTÉS EN TEMPS RÉEL</span>
                    <div className="fr24-num-group">
                      <span className="fr24-stat-big green">
                        {totalGlobalVessels.toLocaleString('fr-FR')}
                      </span>
                      <span className="fr24-stat-unit">navires mondiaux</span>
                    </div>
                  </div>
                  <div className="fr24-counter-stat align-right">
                    <span className="fr24-stat-label">CORRIDORS SOUS VEILLE</span>
                    <span className="fr24-sub-stat">6 DÉTROITS CRITIQUES</span>
                  </div>
                </div>

                {/* Chokepoints Strategic Strip */}
                <div className="maritime-chokepoints-grid">
                  {MARITIME_CHOKEPOINTS.map((cp) => (
                    <button
                      key={cp.id}
                      type="button"
                      className="maritime-chokepoint-pill"
                      onClick={() => {
                        sound.click();
                        if (onSelectLocation) onSelectLocation(cp.lat, cp.lng, cp.zoom);
                      }}
                      title={`${cp.name} : ${cp.desc}`}
                    >
                      <span className="cp-dot" />
                      <span className="cp-name">{cp.name}</span>
                      <span className="cp-status">{cp.status}</span>
                    </button>
                  ))}
                </div>

                {/* Taxonomy filter chips */}
                <div className="fr24-airline-chips">
                  {MARITIME_FILTER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`fr24-chip ${vesselFilter === cat.id ? 'is-active' : ''}`}
                      onClick={() => {
                        sound.click(0.4);
                        setVesselFilter(cat.id);
                      }}
                    >
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vessels Header */}
              <div className="fr24-list-header">
                <div className="fr24-list-title">
                  <Anchor size={13} style={{ color: '#22c55e' }} />
                  <span>FLOTTE AIS EN NAVIGATION ACTIVE</span>
                  <span className="fr24-list-count">
                    {filteredVessels.length} navires
                  </span>
                </div>
                <span className="fr24-list-note">CLIQUEZ POUR CIBLER & INSPECTER LE NAVIRE</span>
              </div>

              {/* Vessels List Grid */}
              {filteredVessels.length === 0 ? (
                <div className="empty-state">
                  Aucun navire ne correspond aux critères de recherche actuels.
                </div>
              ) : (
                <div className="fr24-flights-grid maritime-vessels-grid">
                  {filteredVessels.slice(0, 120).map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="fr24-flight-card maritime-vessel-card is-clickable"
                      style={{
                        animationDelay: `${Math.min(idx * 0.02, 0.6)}s`,
                        borderLeft: `3px solid ${v.color || '#22c55e'}`,
                      }}
                      onClick={() => {
                        sound.click();
                        if (onSelectLocation) onSelectLocation(v.lat, v.lng, 7);
                        if (onInspectTarget) onInspectTarget({ type: 'vessel', ...v });
                      }}
                    >
                      <div className="fr24-card-top">
                        <div className="fr24-card-callsign-group">
                          <div
                            className="fr24-mini-plane-icon"
                            style={{
                              transform: `rotate(${v.heading || v.course || 0}deg)`,
                              color: v.color || '#22c55e',
                            }}
                          >
                            <Anchor size={14} color={v.color || '#22c55e'} />
                          </div>
                          <div>
                            <div className="fr24-callsign">{v.name}</div>
                            <div className="fr24-flight-num">
                              IMO {v.imo || '—'} • MMSI {v.mmsi || '—'}
                            </div>
                          </div>
                        </div>

                        <div className="fr24-airline-badge">
                          <span>{v.flagEmoji || '⚓'}</span>
                          <span className="fr24-airline-name">{v.flag || v.type || 'Marine'}</span>
                        </div>
                      </div>

                      {/* Route corridor */}
                      <div className="fr24-card-route">
                        <div className="fr24-route-endpoint">
                          <span className="fr24-airport-code">ORIGINE</span>
                          <span className="fr24-airport-city">{v.originPort || 'Port de départ'}</span>
                        </div>
                        <div className="fr24-route-arrow">
                          <span className="fr24-arrow-line" />
                          <Compass size={10} color={v.color || '#22c55e'} />
                          <span className="fr24-arrow-line" />
                        </div>
                        <div className="fr24-route-endpoint align-right">
                          <span className="fr24-airport-code">DESTINATION</span>
                          <span className="fr24-airport-city">{v.destinationPort || 'Port d’arrivée'}</span>
                        </div>
                      </div>

                      {/* Telemetry strip */}
                      <div className="fr24-telemetry-strip">
                        <div className="fr24-tel-col">
                          <span className="fr24-tel-label">VITESSE</span>
                          <span className="fr24-tel-val green">
                            {v.speedKts || 0} kts
                          </span>
                        </div>
                        <div className="fr24-tel-col">
                          <span className="fr24-tel-label">CAP</span>
                          <span className="fr24-tel-val">
                            {v.course || v.heading || 0}°
                          </span>
                        </div>
                        <div className="fr24-tel-col">
                          <span className="fr24-tel-label">PORT EN LOURD</span>
                          <span className="fr24-tel-val cyan">
                            {v.dwt || 'Standard'}
                          </span>
                        </div>
                        <div className="fr24-tel-col align-right">
                          <span className="fr24-tel-label">LONGUEUR</span>
                          <span className="fr24-tel-val model">
                            {v.lengthM ? `${v.lengthM}m` : 'Cargo'}
                          </span>
                        </div>
                      </div>

                      <div className="fr24-card-footer">
                        <span className="fr24-squawk-tag maritime-status-tag">
                          {v.status || 'En route au moteur'}
                        </span>
                        <span className="fr24-inspect-cta">CIBLER SUR LA CARTE →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SÉISMES USGS DIRECT (NEIC 24H) ── */}
          {activeType === 'telluric' && (
            <div className="telluric-intel-wrapper">
              {/* USGS Live Monitor Banner Card */}
              <div className="fr24-global-radar-card telluric-radar-card">
                <div className="fr24-radar-top">
                  <div className="fr24-radar-live-indicator">
                    <span className="fr24-ping-dot orange" />
                    <span className="fr24-radar-source">USGS NEIC // SISMOLOGIE GLOBALE DIRECTE</span>
                  </div>
                  <span className="fr24-tracked-badge orange">
                    <Activity size={11} style={{ marginRight: 4 }} />
                    24 HEURES ACTIVES
                  </span>
                </div>

                <div className="fr24-big-counter-row">
                  <div className="fr24-counter-stat">
                    <span className="fr24-stat-label">SÉISMES ENREGISTRÉS (M2.5+)</span>
                    <div className="fr24-num-group">
                      <span className="fr24-stat-big orange">
                        {liveEarthquakes.length}
                      </span>
                      <span className="fr24-stat-unit">détections 24h</span>
                    </div>
                  </div>
                  <div className="fr24-counter-stat align-right">
                    <span className="fr24-stat-label">MAGNITUDE MAX. RÉCENTE</span>
                    <span className="fr24-sub-stat orange">
                      M {liveEarthquakes.length > 0 ? Math.max(...liveEarthquakes.map((e) => e.numMag || 0)).toFixed(1) : '3.2'}
                    </span>
                  </div>
                </div>

                {/* Magnitude Filters Bar */}
                <div className="fr24-airline-chips telluric-filters-bar">
                  {[
                    { id: 'ALL', label: `TOUS (${liveEarthquakes.length})` },
                    { id: 'M5', label: `MAGNITUDE ≥ 5.0 (${liveEarthquakes.filter((e) => e.numMag >= 5).length})` },
                    { id: 'M4', label: `MAGNITUDE ≥ 4.0 (${liveEarthquakes.filter((e) => e.numMag >= 4).length})` },
                    { id: 'M3', label: `MAGNITUDE ≥ 3.0 (${liveEarthquakes.filter((e) => e.numMag >= 3).length})` },
                    { id: 'TSUNAMI', label: `⚠️ TSUNAMI (${liveEarthquakes.filter((e) => e.tsunami).length})` },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      className={`fr24-chip ${earthquakeFilter === chip.id ? 'is-active' : ''}`}
                      onClick={() => {
                        sound.click(0.4);
                        setEarthquakeFilter(chip.id);
                      }}
                    >
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Earthquakes Results Header */}
              <div className="fr24-list-header">
                <div className="fr24-list-title">
                  <Waves size={13} style={{ color: '#f59e0b' }} />
                  <span>ÉPICENTRES IDENTIFIÉS PAR L'USGS</span>
                  <span className="fr24-list-count">
                    {filteredEarthquakes.length} secousses
                  </span>
                </div>
                <span className="fr24-list-note">CLIQUEZ POUR LOCALISER SUR LE GLOBE</span>
              </div>

              {/* Earthquakes List */}
              {filteredEarthquakes.length === 0 ? (
                <div className="empty-state">
                  Aucun séisme correspondant au filtre sélectionné.
                </div>
              ) : (
                <div className="telluric-events-list">
                  {filteredEarthquakes.map((eq, idx) => {
                    const isHigh = eq.numMag >= 5.5;
                    const isMed = eq.numMag >= 4.5 && eq.numMag < 5.5;
                    const magColor = isHigh ? '#ef4444' : isMed ? '#f97316' : '#f59e0b';

                    return (
                      <div
                        key={eq.id || idx}
                        className="telluric-card is-clickable"
                        style={{
                          animationDelay: `${Math.min(idx * 0.02, 0.5)}s`,
                          borderLeftColor: magColor,
                        }}
                        onClick={() => {
                          sound.click();
                          if (onSelectLocation) onSelectLocation(eq.lat, eq.lng, 6);
                          if (onInspectTarget) onInspectTarget({ type: 'earthquake', ...eq });
                        }}
                      >
                        <div className="telluric-card-top">
                          <div className="telluric-mag-badge" style={{ backgroundColor: `${magColor}22`, color: magColor, borderColor: `${magColor}55` }}>
                            <span className="mag-letter">M</span>
                            <span className="mag-val">{eq.mag}</span>
                          </div>
                          <div className="telluric-card-titles">
                            <div className="telluric-place">{eq.place}</div>
                            <div className="telluric-coords-sub">
                              {eq.lat.toFixed(2)}°N • {eq.lng.toFixed(2)}°E • Profondeur {eq.depth} km
                            </div>
                          </div>
                          <span className="telluric-time-pill">{eq.time}</span>
                        </div>

                        {eq.tsunami && (
                          <div className="telluric-tsunami-alert">
                            <AlertTriangle size={12} />
                            <span>ALERTE TSUNAMI ACTIVÉE PAR LE NOAA / PTWC</span>
                          </div>
                        )}

                        <div className="telluric-card-footer">
                          <span className="telluric-source-tag">
                            USGS NEIC • Signif: {eq.significance || 100}
                          </span>
                          <div className="telluric-action-btns">
                            <a
                              href={eq.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="telluric-ext-link"
                              onClick={(e) => e.stopPropagation()}
                              title="Voir la page officielle USGS"
                            >
                              <span>USGS.GOV</span>
                              <ExternalLink size={10} />
                            </a>
                            <span className="telluric-target-cta">LOCALISER L'ÉPICENTRE →</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CÂBLES SOUS-MARINS & CENTRALES NUCLÉAIRES ── */}
          {activeType === 'infrastructure' && (
            <div className="infra-intel-wrapper">
              {/* Infrastructure Submode Switcher Tabs */}
              <div className="infra-mode-switcher">
                <button
                  type="button"
                  className={`infra-mode-btn ${infraSubMode === 'cables' ? 'is-active' : ''}`}
                  onClick={() => {
                    sound.click(0.4);
                    setInfraSubMode('cables');
                  }}
                >
                  <Wifi size={13} />
                  <span>Câbles Sous-Marins ({filteredCables.length})</span>
                </button>
                <button
                  type="button"
                  className={`infra-mode-btn ${infraSubMode === 'nuclear' ? 'is-active' : ''}`}
                  onClick={() => {
                    sound.click(0.4);
                    setInfraSubMode('nuclear');
                  }}
                >
                  <Radiation size={13} />
                  <span>Centrales Nucléaires ({filteredNuclear.length})</span>
                </button>
              </div>

              {/* Submode 1: SUBMARINE CABLES */}
              {infraSubMode === 'cables' && (
                <div className="cables-section">
                  <div className="fr24-global-radar-card cables-radar-card">
                    <div className="fr24-radar-top">
                      <div className="fr24-radar-live-indicator">
                        <span className="fr24-ping-dot purple" />
                        <span className="fr24-radar-source">TELEGEOGRAPHY // ARTÈRES SOUS-MARINES FIBRE</span>
                      </div>
                      <span className="fr24-tracked-badge purple">
                        <Wifi size={11} style={{ marginRight: 4 }} />
                        DORSALES OPTIQUES
                      </span>
                    </div>

                    <div className="fr24-big-counter-row">
                      <div className="fr24-counter-stat">
                        <span className="fr24-stat-label">DORSALES TRANSOCÉANIQUES MAJEURES</span>
                        <div className="fr24-num-group">
                          <span className="fr24-stat-big purple">
                            {SUBMARINE_CABLES.length}
                          </span>
                          <span className="fr24-stat-unit">artères mondiales</span>
                        </div>
                      </div>
                      <div className="fr24-counter-stat align-right">
                        <span className="fr24-stat-label">CAPACITÉ CUMULÉE</span>
                        <span className="fr24-sub-stat purple">
                          ~956 Tbps
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="infra-cards-list">
                    {filteredCables.map((cable, idx) => {
                      const midPoint = cable.path?.[Math.floor(cable.path.length / 2)] || cable.path?.[0] || [0, 0];

                      return (
                        <div
                          key={cable.id || idx}
                          className="infra-card cable-card is-clickable"
                          style={{
                            animationDelay: `${idx * 0.04}s`,
                            borderLeftColor: cable.color || '#a855f7',
                          }}
                          onClick={() => {
                            sound.click();
                            if (onSelectLocation) onSelectLocation(midPoint[0], midPoint[1], 4);
                            if (onInspectTarget) onInspectTarget({ type: 'cable', ...cable });
                          }}
                        >
                          <div className="infra-card-header">
                            <div className="infra-title-block">
                              <span className="infra-type-chip purple">FIBRE SOUS-MARINE</span>
                              <div className="infra-main-name">{cable.name}</div>
                            </div>
                            <div className="infra-stat-pill">
                              <span className="isp-val">{cable.capacityTbps} Tbps</span>
                              <span className="isp-sub">Bande passante</span>
                            </div>
                          </div>

                          <div className="infra-details-row">
                            <div className="infra-col">
                              <span className="infra-col-lbl">LONGUEUR</span>
                              <span className="infra-col-val">{cable.lengthKm.toLocaleString('fr-FR')} km</span>
                            </div>
                            <div className="infra-col">
                              <span className="infra-col-lbl">OPÉRATEURS / PROPRIÉTAIRES</span>
                              <span className="infra-col-val">{cable.owners}</span>
                            </div>
                          </div>

                          <div className="infra-card-footer">
                            <span className="infra-status-tag">{cable.status}</span>
                            <span className="infra-cta-link">LOCALISER LE TRACÉ OPTIQUE →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submode 2: NUCLEAR SITES */}
              {infraSubMode === 'nuclear' && (
                <div className="nuclear-section">
                  <div className="fr24-global-radar-card nuclear-radar-card">
                    <div className="fr24-radar-top">
                      <div className="fr24-radar-live-indicator">
                        <span className="fr24-ping-dot yellow" />
                        <span className="fr24-radar-source">AIEA // SURVEILLANCE SITES NUCLÉAIRES</span>
                      </div>
                      <span className="fr24-tracked-badge yellow">
                        <Radiation size={11} style={{ marginRight: 4 }} />
                        RÉACTEURS MAJEURS
                      </span>
                    </div>

                    <div className="fr24-big-counter-row">
                      <div className="fr24-counter-stat">
                        <span className="fr24-stat-label">SITES STRATÉGIQUES SOUS VEILLE</span>
                        <div className="fr24-num-group">
                          <span className="fr24-stat-big yellow">
                            {STRATEGIC_NUCLEAR_SITES.length}
                          </span>
                          <span className="fr24-stat-unit">centrales clés</span>
                        </div>
                      </div>
                      <div className="fr24-counter-stat align-right">
                        <span className="fr24-stat-label">PUISSANCE COMBINÉE</span>
                        <span className="fr24-sub-stat yellow">
                          ~25 600 MWe
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="infra-cards-list">
                    {filteredNuclear.map((site, idx) => (
                      <div
                        key={site.id || idx}
                        className="infra-card nuclear-card is-clickable"
                        style={{
                          animationDelay: `${idx * 0.04}s`,
                          borderLeftColor: site.id === 'nuc-zaporizhzhia' ? '#ef4444' : '#eab308',
                        }}
                        onClick={() => {
                          sound.click();
                          if (onSelectLocation) onSelectLocation(site.lat, site.lng, 7);
                          if (onInspectTarget) onInspectTarget({ type: 'nuclear', ...site });
                        }}
                      >
                        <div className="infra-card-header">
                          <div className="infra-title-block">
                            <span className="infra-type-chip yellow">{site.type}</span>
                            <div className="infra-main-name">{site.name}</div>
                            <span className="infra-sub-geo">{site.region}, {site.country}</span>
                          </div>
                          <div className="infra-stat-pill">
                            <span className="isp-val yellow">{site.capacityMwe} MWe</span>
                            <span className="isp-sub">Puissance brute</span>
                          </div>
                        </div>

                        <div className="infra-details-row">
                          <div className="infra-col">
                            <span className="infra-col-lbl">OPÉRATEUR</span>
                            <span className="infra-col-val">{site.operator}</span>
                          </div>
                          <div className="infra-col">
                            <span className="infra-col-lbl">SÉCURITÉ</span>
                            <span className="infra-col-val alert-text">{site.securityLevel}</span>
                          </div>
                        </div>

                        <div className="infra-desc-text">
                          {site.description}
                        </div>

                        <div className="infra-card-footer">
                          <span className="infra-status-tag">{site.status}</span>
                          <span className="infra-cta-link">INSPECTER LE SITE NUCLÉAIRE →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MARCHÉS & MATIÈRES PREMIÈRES (OSIRIS PARITY) ── */}
          {activeType === 'markets' && (
            <div className="markets-module-wrapper">
              {/* Continuous Live Marquee Ticker Tape */}
              <div className="markets-ticker-tape">
                <div className="ticker-tape-badge">
                  <Activity size={12} className="ticker-pulse-icon" />
                  <span>FLUX SPOT EN DIRECT</span>
                </div>
                <div className="markets-ticker-track-wrapper">
                  <div className="markets-ticker-track">
                    {[...DEFENSE_COMMODITIES_MARKETS, ...DEFENSE_COMMODITIES_MARKETS].map((m, idx) => (
                      <div key={`${m.id}-ticker-${idx}`} className="ticker-tape-item">
                        <span className="ticker-symbol">{m.symbol}</span>
                        <span className="ticker-price">{m.price}</span>
                        <span className={`ticker-change ${m.positive ? 'positive' : 'negative'}`}>
                          {m.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {m.change}
                        </span>
                        <span className="ticker-sep">•</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Markets Filter Chips */}
              <div className="markets-subfilter-bar">
                {MARKET_CATEGORIES.map((cat) => {
                  const count = cat.id === 'ALL'
                    ? DEFENSE_COMMODITIES_MARKETS.length
                    : DEFENSE_COMMODITIES_MARKETS.filter((m) => m.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`markets-subfilter-btn ${marketFilter === cat.id ? 'is-active' : ''}`}
                      onClick={() => {
                        sound.click(0.4);
                        setMarketFilter(cat.id);
                      }}
                      onMouseEnter={() => sound.hover()}
                    >
                      <span>{cat.label}</span>
                      <span className="subfilter-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Markets Grid */}
              {filteredMarkets.length === 0 ? (
                <div className="empty-state">Aucun actif ou matière première trouvé.</div>
              ) : (
                <div className="markets-grid">
                  {filteredMarkets.map((m, i) => (
                    <div
                      key={m.id}
                      className="market-card"
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <div className="market-card-header">
                        <div className="market-symbol-block">
                          <span className="market-symbol-tag">{m.symbol}</span>
                          {m.exchange && <span className="market-exchange-tag">{m.exchange}</span>}
                        </div>
                        <span className={`market-change-badge ${m.positive ? 'positive' : 'negative'}`}>
                          {m.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {m.change}
                        </span>
                      </div>

                      <div className="market-price-row">
                        <span className="market-price-val">{m.price}</span>
                        <span className="market-price-unit">{m.unit}</span>
                      </div>

                      <div className="market-name-label">{m.name}</div>
                      {m.description && (
                        <div className="market-desc-label">{m.description}</div>
                      )}

                      {/* 24h High/Low Spread Bar */}
                      {(m.low24h || m.high24h) && (
                        <div className="market-range-strip">
                          <div className="market-range-label">
                            <span>24H BAS: <strong>{m.low24h || '--'}</strong></span>
                            <span>24H HAUT: <strong>{m.high24h || '--'}</strong></span>
                          </div>
                          <div className="market-range-track">
                            <div
                              className="market-range-fill"
                              style={{
                                width: m.positive ? '68%' : '35%',
                                background: m.positive ? 'linear-gradient(90deg, rgba(0,245,160,0.3), #00f5a0)' : 'linear-gradient(90deg, rgba(255,51,102,0.3), #ff3366)',
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="market-status-footer">
                        <span>VOL 24H: <strong style={{ color: '#cbd5e1' }}>{m.volume || 'Standard'}</strong></span>
                        <span className="market-live-pill">
                          <span className="market-live-pulse" />
                          COTATION DIRECT
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TÉLÉVISION MONDE 24/7 (DIRECT SANS CLIC & MULTI-PAYS) ── */}
          {activeType === 'tv_news' && (
            <div className="tv-news-module-wrapper">
              {/* Grand Écran Master Theater Direct 24/7 */}
              <MasterLiveTheater
                feed={activeMasterTV}
                isTv={true}
                onPrevFeed={() => {
                  if (filteredTV.length === 0) return;
                  const idx = filteredTV.findIndex((t) => t.id === activeMasterTV?.id);
                  const prev = filteredTV[(idx - 1 + filteredTV.length) % filteredTV.length];
                  if (prev) setActiveMasterTV(prev);
                }}
                onNextFeed={() => {
                  if (filteredTV.length === 0) return;
                  const idx = filteredTV.findIndex((t) => t.id === activeMasterTV?.id);
                  const next = filteredTV[(idx + 1) % filteredTV.length];
                  if (next) setActiveMasterTV(next);
                }}
                onExpandModal={(f) => {
                  if (onSelectCCTV) onSelectCCTV(f);
                }}
              />

              {/* Barre sélecteur pays pour les chaînes TV */}
              <div className="cctv-subfilter-bar tv-country-bar">
                {TV_COUNTRIES.map((cty) => (
                  <button
                    key={cty.id}
                    type="button"
                    className={`cctv-subfilter-btn tv-country-btn ${tvCountry === cty.id ? 'is-active' : ''}`}
                    onClick={() => {
                      sound.click(0.4);
                      setTvCountry(cty.id);
                    }}
                    onMouseEnter={() => sound.hover()}
                  >
                    <span className="tv-country-flag">{cty.flag}</span>
                    <span>{cty.label}</span>
                    <span className="subfilter-count">{cty.count}</span>
                  </button>
                ))}
              </div>

              {/* Grille des flux TV internationaux */}
              {filteredTV.length === 0 ? (
                <div className="empty-state">Aucune chaîne trouvée pour ce pays ou cette recherche.</div>
              ) : (
                <div className="cctv-live-grid">
                  {filteredTV.map((tv, i) => (
                    <InlineLiveCard
                      key={tv.id}
                      feed={tv}
                      index={i}
                      isActiveMaster={activeMasterTV?.id === tv.id}
                      isTv={true}
                      onSelectMaster={(f) => {
                        setActiveMasterTV(f);
                      }}
                      onExpandModal={(f) => {
                        if (onSelectCCTV) onSelectCCTV(f);
                      }}
                    />
                  ))}
                </div>
              )}
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

          {/* ── CCTV & TÉLÉVISION MONDIALE EN DIRECT ── */}
          {activeType === 'cctv' && (
            <>
              {/* Primary Dual Cyber Switch */}
              <div className="cctv-mode-selector">
                <button
                  type="button"
                  className={`cctv-mode-tab-btn ${cctvSubMode === 'cameras' ? 'is-active' : ''}`}
                  onClick={() => {
                    sound.click(0.4);
                    setCctvSubMode('cameras');
                  }}
                  onMouseEnter={() => sound.hover()}
                >
                  <Video size={13} />
                  <span>SURVEILLANCE DU MONDE & DOT</span>
                  <span className="cctv-mode-count">{CCTV_FEEDS.length}</span>
                </button>

                <button
                  type="button"
                  className={`cctv-mode-tab-btn ${cctvSubMode === 'tv' ? 'is-active' : ''}`}
                  onClick={() => {
                    sound.click(0.4);
                    setCctvSubMode('tv');
                  }}
                  onMouseEnter={() => sound.hover()}
                >
                  <Tv size={13} />
                  <span>TÉLÉVISION MONDIALE (PAR PAYS)</span>
                  <span className="cctv-mode-count tv-count">{WORLD_TV_CHANNELS.length}</span>
                </button>
              </div>

              {/* Grand Écran Cockpit Maître en Direct 24/7 (Autoplay Vidéo Direct Sans Clic) */}
              <MasterLiveTheater
                feed={cctvSubMode === 'tv' ? activeMasterTV : activeMasterCamera}
                isTv={cctvSubMode === 'tv'}
                onPrevFeed={() => {
                  if (cctvSubMode === 'cameras') {
                    if (filteredCCTV.length === 0) return;
                    const idx = filteredCCTV.findIndex((c) => c.id === activeMasterCamera?.id);
                    const prev = filteredCCTV[(idx - 1 + filteredCCTV.length) % filteredCCTV.length];
                    if (prev) setActiveMasterCamera(prev);
                  } else {
                    if (filteredTV.length === 0) return;
                    const idx = filteredTV.findIndex((t) => t.id === activeMasterTV?.id);
                    const prev = filteredTV[(idx - 1 + filteredTV.length) % filteredTV.length];
                    if (prev) setActiveMasterTV(prev);
                  }
                }}
                onNextFeed={() => {
                  if (cctvSubMode === 'cameras') {
                    if (filteredCCTV.length === 0) return;
                    const idx = filteredCCTV.findIndex((c) => c.id === activeMasterCamera?.id);
                    const next = filteredCCTV[(idx + 1) % filteredCCTV.length];
                    if (next) setActiveMasterCamera(next);
                  } else {
                    if (filteredTV.length === 0) return;
                    const idx = filteredTV.findIndex((t) => t.id === activeMasterTV?.id);
                    const next = filteredTV[(idx + 1) % filteredTV.length];
                    if (next) setActiveMasterTV(next);
                  }
                }}
                onExpandModal={(f) => {
                  if (onSelectCCTV) onSelectCCTV(f);
                }}
              />

              {/* Submode 1: CAMERAS & DOT */}
              {cctvSubMode === 'cameras' && (
                <>
                  <div className="cctv-subfilter-bar">
                    {[
                      { id: 'all', label: 'Toutes les Caméras', count: CCTV_FEEDS.length },
                      {
                        id: 'traffic',
                        label: '🚦 Trafic & DOT (Live 5s)',
                        count: CCTV_FEEDS.filter((c) => {
                          const k = (c.category || '').toLowerCase();
                          return k.includes('trafic') || k.includes('autoroute') || k.includes('dot') || c.isLiveSnapshot;
                        }).length,
                      },
                      {
                        id: 'megapoles',
                        label: '🏙️ Villes & Capitales',
                        count: CCTV_FEEDS.filter((c) => {
                          const k = (c.category || '').toLowerCase();
                          return k.includes('mégapole') || k.includes('capitale') || k.includes('ville');
                        }).length,
                      },
                      {
                        id: 'aeroports',
                        label: '✈️ Aéroports Internationaux',
                        count: CCTV_FEEDS.filter((c) => (c.category || '').toLowerCase().includes('aéroport')).length,
                      },
                      {
                        id: 'maritime',
                        label: '⚓ Maritime & Détroits',
                        count: CCTV_FEEDS.filter((c) => {
                          const k = (c.category || '').toLowerCase();
                          return k.includes('maritime') || k.includes('chokepoint') || k.includes('canal') || k.includes('détroit') || k.includes('port');
                        }).length,
                      },
                      {
                        id: 'espace',
                        label: '🚀 Espace & Orbite',
                        count: CCTV_FEEDS.filter((c) => (c.category || '').toLowerCase().includes('espace')).length,
                      },
                      {
                        id: 'nature',
                        label: '🌋 Nature & Volcans',
                        count: CCTV_FEEDS.filter((c) => {
                          const k = (c.category || '').toLowerCase();
                          return k.includes('nature') || k.includes('volcan');
                        }).length,
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
                    <div className="empty-state">Aucun flux trouvé dans cette catégorie ou recherche.</div>
                  ) : (
                    <div className="cctv-live-grid">
                      {filteredCCTV.map((cam, i) => (
                        <InlineLiveCard
                          key={cam.id}
                          feed={cam}
                          index={i}
                          isActiveMaster={activeMasterCamera?.id === cam.id}
                          isTv={false}
                          onSelectMaster={(f) => {
                            setActiveMasterCamera(f);
                          }}
                          onExpandModal={(f) => {
                            if (onSelectCCTV) onSelectCCTV(f);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Submode 2: WORLD TELEVISION BY COUNTRY */}
              {cctvSubMode === 'tv' && (
                <>
                  <div className="cctv-subfilter-bar tv-country-bar">
                    {TV_COUNTRIES.map((cty) => (
                      <button
                        key={cty.id}
                        type="button"
                        className={`cctv-subfilter-btn tv-country-btn ${tvCountry === cty.id ? 'is-active' : ''}`}
                        onClick={() => {
                          sound.click(0.4);
                          setTvCountry(cty.id);
                        }}
                        onMouseEnter={() => sound.hover()}
                      >
                        <span className="tv-country-flag">{cty.flag}</span>
                        <span>{cty.label}</span>
                        <span className="subfilter-count">{cty.count}</span>
                      </button>
                    ))}
                  </div>

                  {filteredTV.length === 0 ? (
                    <div className="empty-state">Aucune chaîne trouvée pour ce pays ou cette recherche.</div>
                  ) : (
                    <div className="cctv-live-grid">
                      {filteredTV.map((tv, i) => (
                        <InlineLiveCard
                          key={tv.id}
                          feed={tv}
                          index={i}
                          isActiveMaster={activeMasterTV?.id === tv.id}
                          isTv={true}
                          onSelectMaster={(f) => {
                            setActiveMasterTV(f);
                          }}
                          onExpandModal={(f) => {
                            if (onSelectCCTV) onSelectCCTV(f);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── SATELLITES ── */}
          {activeType === 'satellites' && (
            <>
              {/* Orbital Category Filter Pills */}
              <div className="sat-filter-pills-bar">
                {SATELLITE_ORBIT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`sat-filter-pill ${satelliteCategory === cat.id ? 'is-active' : ''}`}
                    onClick={() => {
                      sound.tick();
                      setSatelliteCategory(cat.id);
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {filteredSatellites.length === 0 ? (
                <div className="empty-state">Aucun satellite trouvé pour ce filtre.</div>
              ) : (
                <div className="sat-grid">
                  {filteredSatellites.map((sat, i) => {
                    const curPos = computeSatelliteState(sat, Date.now());
                    const latFmt = `${curPos.lat >= 0 ? curPos.lat.toFixed(1) + '°N' : Math.abs(curPos.lat).toFixed(1) + '°S'}`;
                    const lngFmt = `${curPos.lng >= 0 ? curPos.lng.toFixed(1) + '°E' : Math.abs(curPos.lng).toFixed(1) + '°O'}`;

                    return (
                      <div
                        key={sat.id}
                        className="sat-card"
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        <div className="sat-card-top">
                          <div className="sat-card-name">{sat.name}</div>
                          <span
                            className="sat-card-code"
                            style={{
                              color: sat.color || '#00f2fe',
                              borderColor: sat.color || '#00f2fe',
                            }}
                          >
                            {sat.code}
                          </span>
                        </div>
                        <div className="sat-card-type">
                          {sat.type} — {sat.country}
                        </div>
                        <div className="sat-telemetry-row col-4">
                          <div className="sat-stat">
                            <span className="sat-stat-label">Altitude</span>
                            <span className="sat-stat-value" style={{ color: '#00f2fe' }}>
                              {sat.altitudeKm.toLocaleString('fr-FR')} km
                            </span>
                          </div>
                          <div className="sat-stat">
                            <span className="sat-stat-label">Vitesse Sol</span>
                            <span className="sat-stat-value">
                              {sat.speedKmh.toLocaleString('fr-FR')} km/h
                            </span>
                          </div>
                          <div className="sat-stat">
                            <span className="sat-stat-label">Nadir Actuel</span>
                            <span className="sat-stat-value" style={{ color: '#00f5a0' }}>
                              {latFmt}, {lngFmt}
                            </span>
                          </div>
                          <div className="sat-stat">
                            <span className="sat-stat-label">Empreinte Sol</span>
                            <span className="sat-stat-value">
                              {curPos.footprintKm?.toLocaleString('fr-FR')} km
                            </span>
                          </div>
                        </div>
                        <div className="sat-card-bottom">
                          <span className="sat-norad">
                            NORAD {sat.noradId} • {sat.status}
                          </span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {sat.hasLiveVideo && (
                              <button
                                type="button"
                                className="sat-live-direct-btn"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  background: 'rgba(56, 189, 248, 0.2)',
                                  border: '1px solid #38bdf8',
                                  color: '#38bdf8',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  sound.click();
                                  const cctv = CCTV_FEEDS.find((c) => c.id === sat.liveStreamId) || {
                                    id: sat.liveStreamId || 'cctv-iss-hdev',
                                    name: 'Station Spatiale Internationale (ISS)',
                                    location: 'Orbite Basse Terrestre (LEO)',
                                    country: 'Espace International',
                                    category: 'Espace & Orbite',
                                    embedUrl: 'https://www.youtube-nocookie.com/embed/P9C25Un7xaM?autoplay=1&mute=1',
                                    resolution: '1080p HD',
                                    fps: 60,
                                  };
                                  if (onSelectCCTV) onSelectCCTV(cctv);
                                }}
                                title="Ouvrir le flux vidéo 4K en direct de l'ISS"
                              >
                                <Video size={10} />
                                <span>DIRECT ISS 4K</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="sat-target-btn"
                              onClick={() => {
                                sound.click();
                                const enrichedSat = {
                                  type: 'satellite',
                                  ...sat,
                                  lat: curPos.lat,
                                  lng: curPos.lng,
                                  footprintKm: curPos.footprintKm,
                                  heading: curPos.heading,
                                };
                                if (onInspectTarget) onInspectTarget(enrichedSat);
                                if (onSelectSatellite) onSelectSatellite(enrichedSat);
                              }}
                            >
                              <Crosshair size={10} />
                              <span>Inspecter</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
