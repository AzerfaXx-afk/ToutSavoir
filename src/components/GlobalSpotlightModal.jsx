import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Globe,
  Activity,
  Satellite,
  Video,
  Network,
  Crosshair,
  Flame,
  ArrowRight,
  Tv,
} from 'lucide-react';
import { TERRITORY_NAMES_FR } from '../utils/countryData';
import { METRIC_DEFINITIONS } from '../utils/worldometerMetrics';
import {
  SATELLITES_DATA,
  CCTV_FEEDS,
  LIVE_NEWS_CHANNELS,
  SUBMARINE_CABLES,
  THERMAL_ANOMALIES,
  WEATHER_SYSTEMS,
} from '../data/osirisStreams';
import { WORLD_TV_CHANNELS } from '../data/worldTvChannels';
import { GEOPOLITICAL_ZONES } from '../data/tacticalStreams';
import { HOTSPOTS } from '../data/mockData';
import { sound } from '../utils/soundFX';
import './GlobalSpotlightModal.css';

const SPOTLIGHT_CATEGORIES = [
  { id: 'all', label: 'TOUT' },
  { id: 'countries', label: 'PAYS (195)' },
  { id: 'worldometer', label: 'WORLDOMETER' },
  { id: 'satellites', label: 'SATELLITES' },
  { id: 'cctv', label: 'CAMÉRAS LIVE' },
  { id: 'cables', label: 'CÂBLES FIBRE' },
  { id: 'intel', label: 'CONFLITS & ALERTES' },
];

export function GlobalSpotlightModal({
  isOpen = false,
  onClose,
  onSelectCountry,
  onSelectMetric,
  onSelectSatellite,
  onSelectCCTV,
  onSelectLocation,
}) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      sound.hover();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Unified Search Index
  const searchIndex = useMemo(() => {
    const items = [];

    // 1. Countries
    Object.entries(TERRITORY_NAMES_FR).forEach(([code, name]) => {
      items.push({
        id: `country-${code}`,
        type: 'countries',
        typeLabel: 'PAYS',
        title: name,
        subtitle: `Code ISO: ${code} — Fiche souveraineté & télémétrie`,
        icon: Globe,
        color: '#00f2fe',
        badgeBg: 'rgba(0, 242, 254, 0.15)',
        badgeColor: '#00f2fe',
        action: () => onSelectCountry && onSelectCountry(code, name),
      });
    });

    // 2. Worldometer Metrics
    METRIC_DEFINITIONS.forEach((metric) => {
      items.push({
        id: `metric-${metric.id}`,
        type: 'worldometer',
        typeLabel: 'WORLDOMETER',
        title: metric.label,
        subtitle: `Unité: ${metric.unit} // Catégorie: ${metric.cat.toUpperCase()}`,
        icon: Activity,
        color: metric.color || '#00f5a0',
        badgeBg: 'rgba(0, 245, 160, 0.15)',
        badgeColor: '#00f5a0',
        action: () => onSelectMetric && onSelectMetric(metric.id),
      });
    });

    // 3. Satellites
    SATELLITES_DATA.forEach((sat) => {
      items.push({
        id: `sat-${sat.id}`,
        type: 'satellites',
        typeLabel: 'SATELLITE',
        title: `${sat.name} [${sat.code}]`,
        subtitle: `Altitude: ${sat.altitudeKm} km // Vitesse: ${sat.speedKmh.toLocaleString()} km/h // NORAD: ${sat.noradId}`,
        icon: Satellite,
        color: sat.color || '#00f2fe',
        badgeBg: 'rgba(0, 242, 254, 0.15)',
        badgeColor: '#00f2fe',
        action: () => onSelectSatellite && onSelectSatellite(sat),
      });
    });

    // 4. CCTV Live Feeds
    CCTV_FEEDS.forEach((cam) => {
      items.push({
        id: `cctv-${cam.id}`,
        type: 'cctv',
        typeLabel: 'CAMÉRA LIVE',
        title: `${cam.name} (${cam.city}, ${cam.country})`,
        subtitle: `Surveillance ${cam.category} — ${cam.resolution}`,
        icon: Video,
        color: '#38bdf8',
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        badgeColor: '#38bdf8',
        action: () => onSelectCCTV && onSelectCCTV(cam),
      });
    });

    // 4.5. Live News Channels 24/7
    (LIVE_NEWS_CHANNELS || []).forEach((news) => {
      items.push({
        id: `news-${news.id}`,
        type: 'cctv',
        typeLabel: 'INFO DIRECT 24/7',
        title: `${news.name} [${news.country}]`,
        subtitle: `Canal d'information mondial en direct — ${news.resolution} (${news.city})`,
        icon: Tv,
        color: '#f59e0b',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeColor: '#f59e0b',
        action: () => onSelectCCTV && onSelectCCTV(news),
      });
    });

    // 4.6. World TV Channels (National & Generalist Broadcasters)
    (WORLD_TV_CHANNELS || []).forEach((tv) => {
      items.push({
        id: `tv-${tv.id}`,
        type: 'cctv',
        typeLabel: tv.isDrmProtected ? 'TÉLÉVISION (PORTAIL)' : 'TÉLÉVISION DIRECT 24/7',
        title: `${tv.logo || '📺'} ${tv.name} [${tv.country}]`,
        subtitle: `${tv.network} — ${tv.category} (${tv.city})`,
        icon: Tv,
        color: tv.isDrmProtected ? '#fbbf24' : '#00f5a0',
        badgeBg: tv.isDrmProtected ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 245, 160, 0.15)',
        badgeColor: tv.isDrmProtected ? '#fbbf24' : '#00f5a0',
        action: () => onSelectCCTV && onSelectCCTV(tv),
      });
    });

    // 5. Submarine Cables
    SUBMARINE_CABLES.forEach((cable) => {
      items.push({
        id: `cable-${cable.id}`,
        type: 'cables',
        typeLabel: 'CÂBLE FIBRE',
        title: cable.name,
        subtitle: `Capacité: ${cable.capacityTbps} Tbps — Longueur: ${cable.lengthKm.toLocaleString()} km (${cable.owners})`,
        icon: Network,
        color: cable.color || '#a855f7',
        badgeBg: 'rgba(168, 85, 247, 0.15)',
        badgeColor: '#a855f7',
        action: () => onSelectLocation && onSelectLocation(cable.path[0][0], cable.path[0][1], 5),
      });
    });

    // 6. Conflicts & Hotspots
    [...GEOPOLITICAL_ZONES, ...HOTSPOTS].forEach((spot) => {
      items.push({
        id: `spot-${spot.id}`,
        type: 'intel',
        typeLabel: 'CONFLIT / ALERTE',
        title: spot.name,
        subtitle: `${spot.status || spot.region} — ${spot.defcon || spot.level || 'SURVEILLANCE'}`,
        icon: Crosshair,
        color: '#ff3366',
        badgeBg: 'rgba(255, 51, 102, 0.15)',
        badgeColor: '#ff3366',
        action: () => onSelectLocation && onSelectLocation(spot.lat, spot.lng, 6),
      });
    });

    // 7. Extreme Weather & Wildfires
    WEATHER_SYSTEMS.forEach((w) => {
      items.push({
        id: `w-${w.id}`,
        type: 'intel',
        typeLabel: 'MÉTÉO EXTRÊME',
        title: `${w.name} (${w.category})`,
        subtitle: `Vents: ${w.windSpeedKmh} km/h // Pression: ${w.pressureHpa} hPa`,
        icon: Flame,
        color: '#f43f5e',
        badgeBg: 'rgba(244, 63, 94, 0.15)',
        badgeColor: '#f43f5e',
        action: () => onSelectLocation && onSelectLocation(w.lat, w.lng, 5),
      });
    });

    THERMAL_ANOMALIES.forEach((fire) => {
      items.push({
        id: `fire-${fire.id}`,
        type: 'intel',
        typeLabel: 'NASA FIRMS',
        title: `${fire.name} (${fire.region})`,
        subtitle: `Détection thermique infrarouge: ${fire.tempKelvin} K (${fire.confidence})`,
        icon: Flame,
        color: '#fb923c',
        badgeBg: 'rgba(251, 146, 60, 0.15)',
        badgeColor: '#fb923c',
        action: () => onSelectLocation && onSelectLocation(fire.lat, fire.lng, 6),
      });
    });

    return items;
  }, [onSelectCountry, onSelectMetric, onSelectSatellite, onSelectCCTV, onSelectLocation]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchIndex.filter((item) => {
      const matchCat = activeCat === 'all' || item.type === activeCat;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.typeLabel.toLowerCase().includes(q)
      );
    }).slice(0, 30); // Cap at top 30 for crispness
  }, [searchIndex, query, activeCat]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        sound.tick();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        sound.hover();
        setSelectedIndex((prev) => (prev + 1) % (filteredResults.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sound.hover();
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % (filteredResults.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          sound.click();
          filteredResults[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="spotlight-backdrop" onClick={onClose}>
      <div className="spotlight-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="spotlight-input-row">
          <Search size={20} className="spotlight-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="spotlight-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Rechercher un pays, indicateur Worldometer, satellite, caméra live, câble..."
            spellCheck="false"
          />
          <button
            type="button"
            className="spotlight-esc-badge"
            onClick={onClose}
            title="Fermer la recherche"
          >
            ÉCHAP
          </button>
        </div>

        {/* Category Filters */}
        <div className="spotlight-categories-bar">
          {SPOTLIGHT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`spotlight-cat-pill ${activeCat === cat.id ? 'is-active' : ''}`}
              onClick={() => {
                sound.hover();
                setActiveCat(cat.id);
                setSelectedIndex(0);
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="spotlight-results-container" ref={listRef}>
          {filteredResults.length === 0 ? (
            <div className="spotlight-empty-state">
              <Search size={28} opacity={0.3} />
              <span>Aucun résultat trouvé pour « {query} »</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                Essayez avec un nom de pays (France, Japon), un satellite (ISS), ou un mot-clé (pétrole, volcan).
              </span>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isHighlighted = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className={`spotlight-item ${isHighlighted ? 'is-highlighted' : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    sound.click();
                    item.action();
                    onClose();
                  }}
                >
                  <div className="spotlight-item-main">
                    <div
                      className="spotlight-item-icon"
                      style={{ color: item.color }}
                    >
                      <Icon size={16} strokeWidth={2} />
                    </div>
                    <div className="spotlight-item-texts">
                      <span className="spotlight-item-title">{item.title}</span>
                      <span className="spotlight-item-subtitle">{item.subtitle}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="spotlight-item-badge"
                      style={{
                        background: item.badgeBg,
                        color: item.badgeColor,
                      }}
                    >
                      {item.typeLabel}
                    </span>
                    {isHighlighted && (
                      <ArrowRight size={14} color="var(--cyan-bright)" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Shortcuts Footer */}
        <div className="spotlight-footer">
          <div className="spotlight-shortcuts-guide">
            <span className="spotlight-key-combo">
              <span className="spotlight-key-badge">↑</span>
              <span className="spotlight-key-badge">↓</span> Naviguer
            </span>
            <span className="spotlight-key-combo">
              <span className="spotlight-key-badge">ENTRÉE</span> Sélectionner
            </span>
            <span className="spotlight-key-combo">
              <span className="spotlight-key-badge">ÉCHAP</span> Quitter
            </span>
          </div>
          <span>AEGIS // OMNI-SEARCH INDEX</span>
        </div>
      </div>
    </div>
  );
}
