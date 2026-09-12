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
} from 'lucide-react';
import { ChronoJournalTab } from './ChronoJournalTab';
import './LiveTelemetryDrawer.css';

/* ── Unified Category System (replaces old tabs) ─────────────────── */
const UNIFIED_CATEGORIES = [
  { id: 'journal', label: 'Journal du Jour', type: 'journal' },
  { id: 'all', label: 'Tout', type: 'metrics' },
  { id: 'population', label: 'Démographie', type: 'metrics' },
  { id: 'economy', label: 'Économie', type: 'metrics' },
  { id: 'environment', label: 'Environnement', type: 'metrics' },
  { id: 'health', label: 'Santé', type: 'metrics' },
  { id: 'media', label: 'Médias & Tech', type: 'metrics' },
  { id: 'energy', label: 'Énergie', type: 'metrics' },
  { id: 'food', label: 'Alimentation', type: 'metrics' },
  { id: 'water', label: 'Eau', type: 'metrics' },
  { id: 'video', label: 'Vidéo en Direct', type: 'cctv' },
  { id: 'satellites', label: 'Satellites', type: 'satellites' },
  { id: 'intel', label: 'Renseignement', type: 'intel' },
  { id: 'country', label: 'Fiche Pays', type: 'country' },
];

const CAT_LABELS_FR = {
  population: 'Démographie',
  economy: 'Économie',
  media: 'Médias',
  environment: 'Environnement',
  food: 'Alimentation',
  water: 'Eau',
  energy: 'Énergie',
  health: 'Santé',
};

const SCOPE_LABELS_FR = {
  day: "Aujourd'hui",
  year: 'Cette année',
  instant: 'En direct',
  fixed_countdown: 'Compte à rebours',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState(() => computeWorldometerMetrics(1));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [localDate, setLocalDate] = useState('');
  const categoryScrollRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

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
    if (!searchQuery) return CCTV_FEEDS;
    const q = searchQuery.toLowerCase();
    return CCTV_FEEDS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

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
    if (activeType === 'cctv') return filteredCCTV.length;
    if (activeType === 'satellites') return filteredSatellites.length;
    return null;
  }, [activeType, filteredMetrics, filteredCCTV, filteredSatellites]);

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <aside className={`live-telemetry-drawer ${isOpen ? 'is-open' : 'is-closed'}`}>
      {/* Toggle Tab on Left Edge */}
      <button
        type="button"
        className="drawer-toggle-tab"
        onClick={toggleOpen}
        onMouseEnter={() => sound.hover()}
        title={isOpen ? 'Réduire le panneau' : 'Ouvrir le centre de données'}
        aria-label={isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
      >
        {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        <span className="toggle-tab-text">
          {isOpen ? 'RÉDUIRE' : 'CHRONOS // INTEL'}
        </span>
        <span className="toggle-tab-dot" />
      </button>

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
                  : cat.type === 'cctv'
                  ? CCTV_FEEDS.length
                  : cat.type === 'satellites'
                  ? SATELLITES_DATA.length
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
          {/* ── CHRONO-JOURNAL / BRIEFING QUOTIDIEN ── */}
          {activeType === 'journal' && (
            <ChronoJournalTab
              selectedDate={customDateRef.current || new Date()}
              metrics={metrics}
            />
          )}

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

          {/* ── CCTV EN DIRECT ── */}
          {activeType === 'cctv' && (
            <>
              {filteredCCTV.length === 0 ? (
                <div className="empty-state">Aucun flux trouvé.</div>
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
      </div>
    </aside>
  );
}
