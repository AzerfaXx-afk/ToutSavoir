import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plane,
  Anchor,
  Video,
  Radio,
  Network,
  ShieldAlert,
  Activity,
  Shield,
  CloudLightning,
  Radiation,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { LIVE_FLIGHTS, LIVE_VESSELS } from '../data/liveTransits';
import {
  CCTV_FEEDS,
  SATELLITES_DATA,
  SUBMARINE_CABLES,
  WEATHER_SYSTEMS,
  STRATEGIC_NUCLEAR_SITES,
} from '../data/osirisStreams';
import { GEOPOLITICAL_ZONES, CYBER_ATTACK_VECTORS, AVIATION_ROUTES } from '../data/tacticalStreams';
import { flightRadarService } from '../services/flightRadarService';
import { marineTrafficService } from '../services/marineTrafficService';
import { sound } from '../utils/soundFX';
import './MapLayerToggles.css';

export const LAYER_CONFIGS = [
  {
    id: 'aviation',
    label: 'Avions en vol',
    shortLabel: 'Aviation',
    icon: Plane,
    count: '7 890+ vols',
    source: 'Flightradar24 ADS-B Direct',
    accentColor: '#ffd700',
    category: 'TRANSIT',
  },
  {
    id: 'maritime',
    label: 'Navires marchands',
    shortLabel: 'Maritime',
    icon: Anchor,
    count: '25 910+ navires',
    source: 'AIS MarineTraffic Direct',
    accentColor: '#00f5a0',
    category: 'TRANSIT',
  },
  {
    id: 'cctv',
    label: 'Caméras direct',
    shortLabel: `CCTV (${CCTV_FEEDS.length})`,
    icon: Video,
    count: CCTV_FEEDS.length,
    source: 'Flux Live 1080p',
    accentColor: '#06b6d4',
    category: 'SURVEILLANCE',
  },
  {
    id: 'satellites',
    label: 'Satellites & Espace',
    shortLabel: 'Satellites & ISS',
    icon: Radio,
    count: `${SATELLITES_DATA.length} actifs + Starlink`,
    source: 'NORAD / CelesTrak Direct',
    accentColor: '#00f2fe',
    category: 'ESPACE',
  },
  {
    id: 'nuclear',
    label: 'Centrales nucléaires',
    shortLabel: 'Nucléaire',
    icon: Radiation,
    count: STRATEGIC_NUCLEAR_SITES.length,
    source: 'AIEA Réacteurs Mondiaux',
    accentColor: '#eab308',
    category: 'INFRA',
  },
  {
    id: 'weather',
    label: 'Systèmes météo extrêmes',
    shortLabel: 'Météo',
    icon: CloudLightning,
    count: WEATHER_SYSTEMS.length,
    source: 'NOAA GFS & Cyclones',
    accentColor: '#38bdf8',
    category: 'SURVEILLANCE',
  },
  {
    id: 'cyber',
    label: 'Guerre cybernétique',
    shortLabel: 'Cyber',
    icon: ShieldAlert,
    count: CYBER_ATTACK_VECTORS.length,
    source: 'Cyber Threat Intelligence',
    accentColor: '#ec4899',
    category: 'SÉCURITÉ',
  },
  {
    id: 'conflicts',
    label: 'Zones de conflit & Tensions',
    shortLabel: 'Conflits',
    icon: ShieldAlert,
    count: GEOPOLITICAL_ZONES.length,
    source: 'ACLED / Alertes DEFCON',
    accentColor: '#ff2a4d',
    category: 'TACTIQUE',
  },
  {
    id: 'telluric',
    label: 'Séismes USGS',
    shortLabel: 'Séismes',
    icon: Activity,
    count: 'M4.0+',
    source: 'USGS Real-Time Feed',
    accentColor: '#f43f5e',
    category: 'NATURE',
  },
  {
    id: 'cables',
    label: 'Câbles sous-marins',
    shortLabel: 'Câbles',
    icon: Network,
    count: `${SUBMARINE_CABLES.length} dorsales`,
    source: 'Global Submarine Fiber',
    accentColor: '#a855f7',
    category: 'INFRA',
  },
];

export function MapLayerToggles({
  activeLayers = new Set(),
  onToggleLayer,
  onToggleAll,
  is3D = false,
  onSwitchTo3D,
  flightLimit = 2500,
  onFlightLimitChange,
  vesselLimit = 5000,
  onVesselLimitChange,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [liveFlightCount, setLiveFlightCount] = useState(flightRadarService.flights.length || 2280);
  const [liveVesselCount, setLiveVesselCount] = useState(marineTrafficService.vessels.length || 25910);

  useEffect(() => {
    const unsub = flightRadarService.subscribe((flights, total) => {
      const nextCount = flights.length > 0 ? flights.length : total || 2280;
      setLiveFlightCount((prev) => (prev === nextCount ? prev : nextCount));
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    const unsub = marineTrafficService.subscribe((vessels, total) => {
      const nextCount = vessels.length > 0 ? vessels.length : total || 25910;
      setLiveVesselCount((prev) => (prev === nextCount ? prev : nextCount));
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const visibleConfigs = LAYER_CONFIGS.filter((l) => is3D || l.id !== 'satellites');
  const activeCount = visibleConfigs.filter((l) => activeLayers.has(l.id)).length;
  const totalCount = visibleConfigs.length;
  const allActive = activeCount === totalCount && totalCount > 0;

  const handleToggleExpand = () => {
    sound.click(0.3);
    setIsExpanded((prev) => !prev);
  };

  const handleToggleAllClick = (e) => {
    e.stopPropagation();
    sound.tick();
    if (onToggleAll) {
      onToggleAll(!allActive);
    }
  };

  const handleLayerClick = (layer) => {
    sound.click(0.25);
    if (layer.id === 'satellites' && !is3D) {
      if (onSwitchTo3D) onSwitchTo3D();
      return;
    }
    if (onToggleLayer) onToggleLayer(layer.id);
  };

  return (
    <aside
      className={`map-layer-toggles-hud ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
      aria-label="Contrôle des calques tactiques de la carte"
    >
      {/* ─── Ultra-Transparent Glass Header Bar ─── */}
      <div className="layer-hud-header" onClick={handleToggleExpand}>
        <div className="layer-hud-left">
          <div className="layer-hud-icon-box">
            <Layers size={13} className="layer-hud-icon" />
            <span className="layer-beacon-pulse" />
          </div>
          <div className="layer-hud-titles">
            <span className="layer-hud-title">CALQUES CARTE</span>
            <span className="layer-hud-status">
              <strong>{activeCount}/{totalCount}</strong> ACTIFS
            </span>
          </div>
        </div>

        <div className="layer-hud-actions">
          {isExpanded && (
            <button
              type="button"
              className="layer-quick-toggle-btn"
              onClick={handleToggleAllClick}
              title={allActive ? 'Masquer tous les calques' : 'Afficher tous les calques'}
            >
              {allActive ? <EyeOff size={11} /> : <Eye size={11} />}
              <span>{allActive ? 'Masquer' : 'Afficher'}</span>
            </button>
          )}

          <button
            type="button"
            className="layer-expand-chevron-btn"
            title={isExpanded ? 'Réduire le panneau' : 'Développer les calques'}
            aria-label={isExpanded ? 'Réduire' : 'Développer'}
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* ─── Transparent Scrollable Layer Items Panel ─── */}
      {isExpanded && (
        <div className="layer-hud-body">
          {/* Grouped by categories */}
          {(() => {
            const groups = {};
            visibleConfigs.forEach((layer) => {
              if (!groups[layer.category]) groups[layer.category] = [];
              groups[layer.category].push(layer);
            });

            return Object.entries(groups).map(([category, layers]) => (
              <div key={category} className="layer-category-section">
                <div className="layer-category-divider">
                  <span className="category-tag-name">{category}</span>
                  <span className="category-divider-line" />
                </div>

                <div className="layer-category-items">
                  {layers.map((layer) => {
                    const IconComp = layer.icon;
                    const isActive = activeLayers.has(layer.id);

                    return (
                      <React.Fragment key={layer.id}>
                        <div
                          className={`layer-row-glass ${isActive ? 'is-active' : 'is-inactive'}`}
                          onClick={() => handleLayerClick(layer)}
                        >
                        <div className="layer-row-left">
                          <div
                            className="layer-glass-icon"
                            style={{
                              color: isActive ? layer.accentColor : '#64748b',
                              borderColor: isActive ? `${layer.accentColor}55` : 'rgba(255,255,255,0.08)',
                              background: isActive ? `${layer.accentColor}18` : 'rgba(255,255,255,0.02)',
                              boxShadow: isActive ? `0 0 10px ${layer.accentColor}33` : 'none',
                            }}
                          >
                            <IconComp size={12} />
                          </div>

                          <div className="layer-row-info">
                            <span className="layer-row-name">
                              {layer.label}
                              {layer.id === 'satellites' && !is3D && (
                                <span style={{ fontSize: '9px', marginLeft: '6px', color: '#00f2fe', background: 'rgba(0,242,254,0.12)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                                  ORBITE 3D
                                </span>
                              )}
                            </span>
                            <div className="layer-row-source-line">
                              <span className="layer-row-source">{layer.source}</span>
                              <span className="layer-source-dot">•</span>
                              <span className="layer-row-count">
                                <strong>
                                  {layer.id === 'aviation'
                                    ? `${flightLimit.toLocaleString('fr-FR')} / ${liveFlightCount.toLocaleString('fr-FR')} vols`
                                    : layer.id === 'maritime'
                                    ? `${vesselLimit.toLocaleString('fr-FR')} / ${liveVesselCount.toLocaleString('fr-FR')} navires`
                                    : layer.count}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cybernetic Switch Pill */}
                        <div
                          className={`layer-cyber-switch ${isActive ? 'is-on' : 'is-off'}`}
                          style={{
                            borderColor: isActive ? `${layer.accentColor}88` : 'rgba(255,255,255,0.12)',
                            background: isActive ? `${layer.accentColor}25` : 'rgba(0,0,0,0.3)',
                          }}
                        >
                          <span
                            className="layer-switch-knob"
                            style={{
                              background: isActive ? layer.accentColor : '#475569',
                              boxShadow: isActive ? `0 0 8px ${layer.accentColor}` : 'none',
                            }}
                          />
                        </div>
                      </div>

                      {/* Aviation Density Controller Slider */}
                      {layer.id === 'aviation' && isActive && (
                        <div
                          className="layer-flight-density-panel"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flight-density-header">
                            <span className="flight-density-title">DENSITÉ DU FLUX AÉRIEN</span>
                            <span className="flight-density-badge">
                              <strong>{flightLimit.toLocaleString('fr-FR')}</strong> / {liveFlightCount.toLocaleString('fr-FR')}
                            </span>
                          </div>

                          <div className="flight-density-slider-wrap">
                            <input
                              type="range"
                              min="10"
                              max={Math.max(5000, liveFlightCount)}
                              step="10"
                              value={flightLimit}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (onFlightLimitChange) onFlightLimitChange(val);
                              }}
                              className="flight-density-slider"
                              aria-label="Régler le nombre de vols affichés"
                            />
                          </div>

                          <div className="flight-density-presets">
                            <button
                              type="button"
                              className={`density-preset-btn ${flightLimit === 250 ? 'is-active' : ''}`}
                              onClick={() => {
                                sound.tick();
                                if (onFlightLimitChange) onFlightLimitChange(250);
                              }}
                              title="Trafic régional équilibré (250 vols)"
                            >
                              250
                            </button>
                            <button
                              type="button"
                              className={`density-preset-btn ${flightLimit === 1000 ? 'is-active' : ''}`}
                              onClick={() => {
                                sound.tick();
                                if (onFlightLimitChange) onFlightLimitChange(1000);
                              }}
                              title="Flux continental dense (1 000 vols)"
                            >
                              1 000
                            </button>
                            <button
                              type="button"
                              className={`density-preset-btn ${flightLimit === 2500 ? 'is-active' : ''}`}
                              onClick={() => {
                                sound.tick();
                                if (onFlightLimitChange) onFlightLimitChange(2500);
                              }}
                              title="Haute densité Flightradar24 (2 500 vols)"
                            >
                              2 500
                            </button>
                            <button
                              type="button"
                              className={`density-preset-btn ${flightLimit >= 5000 ? 'is-active' : ''}`}
                              onClick={() => {
                                sound.tick();
                                if (onFlightLimitChange) onFlightLimitChange(Math.max(5000, liveFlightCount));
                              }}
                              title="Trafic mondial total (5 000+ vols)"
                            >
                              MAX ({Math.max(5000, liveFlightCount).toLocaleString('fr-FR')})
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Maritime Density Controller Slider */}
                      {layer.id === 'maritime' && isActive && (
                        <div
                          className="layer-flight-density-panel"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flight-density-header">
                            <span className="flight-density-title">DENSITÉ DU FLUX MARITIME</span>
                            <span className="flight-density-badge" style={{ color: '#00f5a0', borderColor: 'rgba(0, 245, 160, 0.4)' }}>
                              <strong>{vesselLimit.toLocaleString('fr-FR')}</strong> / {liveVesselCount.toLocaleString('fr-FR')}
                            </span>
                          </div>

                          <div className="flight-density-slider-wrap">
                            <input
                              type="range"
                              min="50"
                              max={Math.max(25910, liveVesselCount)}
                              step="50"
                              value={vesselLimit}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (onVesselLimitChange) onVesselLimitChange(val);
                              }}
                              className="flight-density-slider maritime-slider"
                              aria-label="Régler le nombre de navires affichés"
                            />
                          </div>

                          <div className="flight-density-presets">
                            <button
                              type="button"
                              className={`density-preset-btn ${vesselLimit === 500 ? 'is-active' : ''}`}
                              onClick={() => {
                                sound.tick();
                                if (onVesselLimitChange) onVesselLimitChange(500);
                              }}
                              title="Flotte stratégique (500 navires)"
                            >
                              500
                            </button>
                            <button
                              type="button"
                              className={`density-preset-btn ${vesselLimit === 2500 ? 'is-active' : ''}`}
                              onClick={() => {
                                sound.tick();
                                if (onVesselLimitChange) onVesselLimitChange(2500);
                              }}
                              title="Trafic maritime continental (2 500 navires)"
                            >
                              2 500
                            </button>
                            <button
                              type="button"
                              className={`density-preset-btn ${vesselLimit === 5000 ? 'is-active' : ''}`}
                              onClick={() => {
                                sound.tick();
                                if (onVesselLimitChange) onVesselLimitChange(5000);
                              }}
                              title="Haute densité MarineTraffic (5 000 navires)"
                            >
                              5 000
                            </button>
                            <button
                              type="button"
                              className={`density-preset-btn ${vesselLimit >= 15000 ? 'is-active' : ''}`}
                              onClick={() => {
                                sound.tick();
                                if (onVesselLimitChange) onVesselLimitChange(Math.max(25910, liveVesselCount));
                              }}
                              title="Flotte mondiale intégrale (25 000+ navires AIS)"
                            >
                              MAX ({Math.max(25000, liveVesselCount).toLocaleString('fr-FR')})
                            </button>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </aside>
  );
}
