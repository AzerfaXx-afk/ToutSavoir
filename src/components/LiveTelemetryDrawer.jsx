import React, { useState, useEffect, useMemo } from 'react';
import { realtimeStream } from '../utils/realtimeEvents';
import {
  WORLDOMETER_CATEGORIES,
  METRIC_DEFINITIONS,
  computeWorldometerMetrics,
} from '../utils/worldometerMetrics';
import { getEstimatedPopulationForYear } from './TimelineWheel';
import { sound } from '../utils/soundFX';
import {
  SATELLITES_DATA,
  CCTV_FEEDS,
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
  Activity,
  Radio,
  Globe,
  Video,
  Satellite,
  ShieldAlert,
  Search,
  Crosshair,
  X,
  Clock,
} from 'lucide-react';
import './LiveTelemetryDrawer.css';

const DRAWER_TABS = [
  { id: 'worldometer', label: 'WORLDOMETER', icon: Activity },
  { id: 'intel', label: 'OSIRIS INTEL', icon: ShieldAlert },
  { id: 'cctv', label: 'CCTV LIVE', icon: Video },
  { id: 'satellites', label: 'SATELLITES', icon: Satellite },
  { id: 'country', label: 'FICHE PAYS', icon: Globe },
];

export function LiveTelemetryDrawer({
  selectedYear = 2026,
  isOpen: propIsOpen,
  onToggleOpen,
  activeTab = 'worldometer',
  onTabChange,
  onSelectCCTV,
  onSelectSatellite,
  onSelectLocation,
  selectedCountry = 'FR',
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalTab, setInternalTab] = useState('worldometer');
  const currentTab = activeTab || internalTab;
  const [metrics, setMetrics] = useState(() => computeWorldometerMetrics(1));
  const [stats, setStats] = useState({
    worldPopulation: 8185420000,
    birthsToday: 0,
    deathsToday: 0,
    netGrowthToday: 0,
    recentEarthquakes: [],
  });
  const [localTime, setLocalTime] = useState('');
  const [localDate, setLocalDate] = useState('');
  const [timezoneName, setTimezoneName] = useState('');

  // Live Local Time Clock (exact local time of user location)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateStr = now.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();

      let tzStr = 'LOCAL';
      try {
        const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (resolved) {
          tzStr = resolved.split('/').pop().replace(/_/g, ' ');
        }
      } catch {
        tzStr = 'LOCAL';
      }

      setLocalTime(timeStr);
      setLocalDate(dateStr);
      setTimezoneName(tzStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute demographic scaling based on selectedYear
  const yearMultiplier = useMemo(() => {
    const popSelected = getEstimatedPopulationForYear(selectedYear);
    return popSelected / 8185420000;
  }, [selectedYear]);

  // High-frequency metrics ticker
  useEffect(() => {
    const tick = () => {
      setMetrics(computeWorldometerMetrics(yearMultiplier));
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [yearMultiplier]);

  // Realtime stream subscription
  useEffect(() => {
    const unsubscribe = realtimeStream.subscribe((data) => {
      if (data.stats) {
        setStats((prev) => ({
          ...prev,
          ...data.stats,
        }));
      }
      if (data.earthquakes) {
        setStats((prev) => ({
          ...prev,
          recentEarthquakes: data.earthquakes,
        }));
      }
    });

    return unsubscribe;
  }, []);

  const toggleOpen = () => {
    sound.tick();
    if (onToggleOpen) {
      onToggleOpen(!isOpen);
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleTabClick = (tabId) => {
    sound.click(0.45);
    setInternalTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  // Filter metrics
  const filteredMetrics = useMemo(() => {
    return METRIC_DEFINITIONS.filter((def) => {
      const matchesCat = activeCategory === 'all' || def.cat === activeCategory;
      const matchesSearch =
        !searchQuery ||
        def.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        def.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        def.cat.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Country Data resolution
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
        status: 'Données en cours d’acquisition satellite',
      }
    );
  }, [selectedCountry]);

  return (
    <aside className={`live-telemetry-drawer ${isOpen ? 'is-open' : 'is-closed'}`}>
      {/* Drawer Toggle Tab on Left Edge */}
      <button
        type="button"
        className="drawer-toggle-tab"
        onClick={toggleOpen}
        onMouseEnter={() => sound.hover()}
        title={isOpen ? 'Réduire le panneau' : 'Ouvrir le centre de renseignement & télémétrie'}
        aria-label={isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
      >
        {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        <span className="toggle-tab-text">{isOpen ? 'RÉDUIRE' : 'CHRONOS // INTEL'}</span>
        <span className="toggle-tab-dot" />
      </button>

      {/* Drawer Inner Content */}
      <div className="drawer-panel-inner">
        {/* Minimalist Awwwards Header: Exact Local Time & Live Status Only */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-live-pulse">
              <span className="live-pulse-dot" />
              <span className="live-pulse-label">TÉLÉMÉTRIE EN DIRECT</span>
            </div>
            <span className="drawer-timezone-tag">{timezoneName}</span>
          </div>
          <div className="drawer-header-right">
            <div className="drawer-time-lockup">
              <span className="drawer-local-time">{localTime}</span>
              <span className="drawer-local-date">{localDate}</span>
            </div>
          </div>
        </div>

        {/* 5 Primary Intelligence Tabs (Neumorphic) */}
        <div className="drawer-primary-tabs">
          {DRAWER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`drawer-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon size={12} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: WORLDOMETER LIVE */}
        {currentTab === 'worldometer' && (
          <div className="drawer-scroll-area">
            {/* Hero Demographic Card (Neumorphic) */}
            <div className="hero-counter-card">
              <div className="hero-counter-top">
                <div className="hero-tag-badge">
                  <Globe size={11} className="text-cyan" />
                  <span>
                    {selectedYear !== 2026
                      ? `ESTIMATION // ANNÉE ${selectedYear}`
                      : 'HORLOGE DÉMOGRAPHIQUE MONDIALE'}
                  </span>
                </div>
                <span className="hero-live-badge">TEMPS RÉEL</span>
              </div>
              <div className="hero-counter-val">
                {selectedYear !== 2026
                  ? getEstimatedPopulationForYear(selectedYear).toLocaleString('fr-FR')
                  : (metrics.world_pop || stats.worldPopulation).toLocaleString('fr-FR')}
              </div>
              <div className="hero-counter-bottom">
                <span className="hero-counter-sub">
                  HABITANTS SUR TERRE // SOURCE ONU & WORLDOMETER
                </span>
                <span className="hero-counter-growth">
                  +4.2 / sec
                </span>
              </div>
            </div>

            {/* Category Filter Chips (Neumorphic Horizontal Scroll) */}
            <div className="category-chips-scroll">
              {WORLDOMETER_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const count = cat.id === 'all'
                  ? METRIC_DEFINITIONS.length
                  : METRIC_DEFINITIONS.filter((m) => m.cat === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-chip-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      sound.click(0.4);
                      setActiveCategory(cat.id);
                    }}
                  >
                    <span>{cat.shortLabel}</span>
                    <span className="chip-count">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Metrics Search Filter (Neumorphic Inset) */}
            <div className="drawer-search-row">
              <div className="drawer-search-box">
                <Search size={13} className="search-icon" />
                <input
                  type="text"
                  className="drawer-search-input"
                  placeholder="Rechercher un indicateur (ex: naissances, CO2, PIB, pétrole)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Effacer la recherche"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              <span className="search-results-count">
                {filteredMetrics.length} / {METRIC_DEFINITIONS.length}
              </span>
            </div>

            {/* Worldometer Metrics Cards Grid (Neumorphic Tiles) */}
            <div className="metrics-grid">
              {filteredMetrics.map((def) => {
                const val = metrics[def.id] !== undefined ? metrics[def.id] : 0;
                const formattedVal = Number(val).toLocaleString('fr-FR');
                return (
                  <div key={def.id} className="metric-card">
                    <div className="metric-card-header">
                      <span className={`metric-category-tag cat-${def.cat}`}>
                        {def.cat.toUpperCase()}
                      </span>
                      <span className={`metric-scope-badge scope-${def.scope}`}>
                        {def.scope === 'day'
                          ? 'AUJOURD’HUI'
                          : def.scope === 'year'
                          ? 'ANNUEL'
                          : 'EN DIRECT'}
                      </span>
                    </div>
                    <div
                      className="metric-value-num"
                      style={{ color: def.color || 'var(--cyan-bright)' }}
                    >
                      {def.prefix || ''}{formattedVal}
                    </div>
                    <div className="metric-label-text">{def.label}</div>
                    <div className="metric-unit-text">{def.unit}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: OSIRIS INTEL FEED */}
        {currentTab === 'intel' && (
          <div className="drawer-scroll-area">
            <div className="osiris-bulletins-list">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan-bright)' }}>
                  BULLETINS DE DÉFENSE & SITUATION
                </span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                  {LIVE_BULLETINS.length} DÉPÊCHES
                </span>
              </div>

              {LIVE_BULLETINS.map((b) => (
                <div
                  key={b.id}
                  className={`bulletin-card ${b.level === 'CRITICAL' || b.level === 'CRITIQUE' ? 'is-critical' : 'is-warning'}`}
                >
                  <div className="bulletin-header">
                    <span className="bulletin-badge">{b.tag}</span>
                    <span className="bulletin-time">{b.time}</span>
                  </div>
                  <div className="bulletin-title">{b.title}</div>
                  <div className="bulletin-body">{b.text}</div>
                  <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    SOURCE // {b.origin}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: '16px', fontSize: '11px', fontWeight: 700, color: '#ff3366', padding: '0 4px' }}>
                POINTS CHAUDS GÉOPOLITIQUES CRITIQUES
              </div>

              {HOTSPOTS.map((spot) => (
                <div
                  key={spot.id}
                  className="bulletin-card is-critical"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    sound.click();
                    if (onSelectLocation) onSelectLocation(spot.lat, spot.lng, 6);
                  }}
                >
                  <div className="bulletin-header">
                    <span className="bulletin-badge">{spot.level}</span>
                    <span className="bulletin-time">{spot.lastUpdate}</span>
                  </div>
                  <div className="bulletin-title">{spot.name}</div>
                  <div className="bulletin-body">{spot.status} — {spot.details}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '8.5px', color: '#ff3366', fontWeight: 700 }}>
                      MISSILES ACTIFS: {spot.activeMissiles}
                    </span>
                    <span style={{ fontSize: '8.5px', color: 'var(--cyan-bright)', textDecoration: 'underline' }}>
                      Cibler sur la carte ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CCTV LIVE FEEDS */}
        {currentTab === 'cctv' && (
          <div className="drawer-scroll-area">
            <div className="cctv-cards-grid">
              {CCTV_FEEDS.map((cam) => (
                <div
                  key={cam.id}
                  className="cctv-preview-card"
                  onClick={() => {
                    sound.click();
                    if (onSelectCCTV) onSelectCCTV(cam);
                  }}
                >
                  <div className="cctv-card-media">
                    <img
                      src={cam.thumbnail}
                      alt={cam.name}
                      className="cctv-card-img"
                      loading="lazy"
                    />
                    <div className="cctv-card-badge">
                      <span className="cctv-rec-dot" />
                      <span>{cam.status}</span>
                    </div>
                    <div className="cctv-card-res">{cam.resolution}</div>
                  </div>

                  <div className="cctv-card-body">
                    <div className="cctv-card-title">{cam.name}</div>
                    <div className="cctv-card-sub">{cam.city}, {cam.country}</div>
                    <button
                      type="button"
                      className="cctv-card-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.click();
                        if (onSelectCCTV) onSelectCCTV(cam);
                      }}
                    >
                      <Video size={11} />
                      <span>OUVRIR LE DIRECT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SATELLITES TRACKER */}
        {currentTab === 'satellites' && (
          <div className="drawer-scroll-area">
            <div className="sat-cards-grid">
              {SATELLITES_DATA.map((sat) => (
                <div key={sat.id} className="sat-card">
                  <div className="sat-card-top">
                    <div className="sat-card-name">{sat.name}</div>
                    <span className="sat-card-tag">{sat.code}</span>
                  </div>

                  <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.5)' }}>
                    {sat.type} // {sat.country}
                  </span>

                  <div className="sat-telemetry-row">
                    <div className="sat-stat-box">
                      <span className="sat-stat-k">Altitude</span>
                      <span className="sat-stat-v">{sat.altitudeKm} km</span>
                    </div>
                    <div className="sat-stat-box">
                      <span className="sat-stat-k">Vitesse</span>
                      <span className="sat-stat-v">{sat.speedKmh.toLocaleString()} km/h</span>
                    </div>
                    <div className="sat-stat-box">
                      <span className="sat-stat-k">Inclinaison</span>
                      <span className="sat-stat-v">{sat.inclination}°</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--cyan-bright)' }}>
                      NORAD ID: {sat.noradId} • {sat.status}
                    </span>
                    <button
                      type="button"
                      className="cctv-card-btn"
                      style={{ padding: '4px 8px', marginTop: 0 }}
                      onClick={() => {
                        sound.click();
                        if (onSelectSatellite) onSelectSatellite(sat);
                      }}
                    >
                      <Crosshair size={10} />
                      <span>CIBLER</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: COUNTRY DOSSIER */}
        {currentTab === 'country' && (
          <div className="drawer-scroll-area">
            <div className="country-dossier-view">
              <div className="country-dossier-header">
                <span style={{ fontSize: '9.5px', color: 'var(--cyan-bright)', fontFamily: 'var(--font-mono)' }}>
                  FICHE DE SOUVERAINETÉ & GÉOPOLITIQUE
                </span>
                <div className="country-dossier-title">{countryData.name}</div>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                  Capitale : {countryData.capital}
                </span>
              </div>

              <div className="country-dossier-grid">
                <div className="dossier-stat-card">
                  <span className="dossier-stat-label">Niveau d'Alerte</span>
                  <span className="dossier-stat-val" style={{ color: '#ff3366' }}>
                    {countryData.defcon}
                  </span>
                </div>
                <div className="dossier-stat-card">
                  <span className="dossier-stat-label">Indice de Risque</span>
                  <span className="dossier-stat-val">{countryData.riskIndex}</span>
                </div>
                <div className="dossier-stat-card">
                  <span className="dossier-stat-label">Population</span>
                  <span className="dossier-stat-val">{countryData.pop}</span>
                </div>
                <div className="dossier-stat-card">
                  <span className="dossier-stat-label">Budget Défense</span>
                  <span className="dossier-stat-val" style={{ color: '#ffb703' }}>
                    {countryData.milBudget}
                  </span>
                </div>
                <div className="dossier-stat-card">
                  <span className="dossier-stat-label">Arsenal Nucléaire</span>
                  <span className="dossier-stat-val" style={{ color: '#ff0055' }}>
                    {countryData.nukes}
                  </span>
                </div>
                <div className="dossier-stat-card">
                  <span className="dossier-stat-label">Alertes Actives</span>
                  <span className="dossier-stat-val">{countryData.activeAlerts}</span>
                </div>
              </div>

              <div className="bulletin-card" style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                  STATUT OPÉRATIONNEL DES FORCES
                </span>
                <div style={{ fontSize: '11px', color: '#ffffff', marginTop: '4px' }}>
                  {countryData.status}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
