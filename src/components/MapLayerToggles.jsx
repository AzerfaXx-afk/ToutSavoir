import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { LIVE_FLIGHTS } from '../data/liveTransits';
import { LIVE_VESSELS } from '../data/liveTransits';
import { CCTV_FEEDS, SATELLITES_DATA, SUBMARINE_CABLES, WEATHER_SYSTEMS } from '../data/osirisStreams';
import { GEOPOLITICAL_ZONES, CYBER_ATTACK_VECTORS, AVIATION_ROUTES } from '../data/tacticalStreams';
import { sound } from '../utils/soundFX';
import './MapLayerToggles.css';

export const LAYER_CONFIGS = [
  {
    id: 'aviation',
    label: 'Avions en vol',
    shortLabel: 'Aviation',
    icon: Plane,
    count: LIVE_FLIGHTS.length + AVIATION_ROUTES.length,
    accentColor: '#00f2fe',
    category: 'TRANSIT',
  },
  {
    id: 'maritime',
    label: 'Navires marchands',
    shortLabel: 'Maritime',
    icon: Anchor,
    count: LIVE_VESSELS.length,
    accentColor: '#f59e0b',
    category: 'TRANSIT',
  },
  {
    id: 'cctv',
    label: 'Caméras direct',
    shortLabel: 'CCTV (46)',
    icon: Video,
    count: CCTV_FEEDS.length,
    accentColor: '#38bdf8',
    category: 'SURVEILLANCE',
  },
  {
    id: 'satellites',
    label: 'Satellites LEO/GEO',
    shortLabel: 'Satellites',
    icon: Radio,
    count: SATELLITES_DATA.length,
    accentColor: '#10b981',
    category: 'ESPACE',
  },
  {
    id: 'cables',
    label: 'Câbles sous-marins',
    shortLabel: 'Fibre optique',
    icon: Network,
    count: SUBMARINE_CABLES.length,
    accentColor: '#a855f7',
    category: 'INFRA',
  },
  {
    id: 'conflicts',
    label: 'Zones de tensions',
    shortLabel: 'Conflits',
    icon: ShieldAlert,
    count: GEOPOLITICAL_ZONES.length,
    accentColor: '#ff2a4d',
    category: 'TACTIQUE',
  },
  {
    id: 'telluric',
    label: 'Séismes USGS',
    shortLabel: 'Séismes',
    icon: Activity,
    count: 'M4.5+',
    accentColor: '#f43f5e',
    category: 'NATURE',
  },
  {
    id: 'cyber',
    label: 'Cyberattaques',
    shortLabel: 'Cyber',
    icon: Shield,
    count: CYBER_ATTACK_VECTORS.length,
    accentColor: '#ec4899',
    category: 'TACTIQUE',
  },
  {
    id: 'weather',
    label: 'Météo & Climat',
    shortLabel: 'Cyclones',
    icon: CloudLightning,
    count: WEATHER_SYSTEMS.length,
    accentColor: '#06b6d4',
    category: 'NATURE',
  },
];

export function MapLayerToggles({
  activeLayers = new Set(),
  onToggleLayer,
  onToggleAll,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeCount = LAYER_CONFIGS.filter((l) => activeLayers.has(l.id)).length;
  const totalCount = LAYER_CONFIGS.length;
  const allActive = activeCount === totalCount;

  const handleToggleExpand = () => {
    sound.click(0.3);
    setIsExpanded((prev) => !prev);
  };

  const handleToggleAllClick = (e) => {
    e.stopPropagation();
    if (onToggleAll) {
      onToggleAll(!allActive);
    }
  };

  return (
    <div className={`map-layer-toggles-root ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
      {/* Floating Toggle Header / Pill */}
      <button
        type="button"
        className="layer-toggles-header"
        onClick={handleToggleExpand}
        title={isExpanded ? 'Réduire le panneau des calques' : 'Ouvrir les calques de la carte'}
        aria-label="Calques de la carte"
      >
        <div className="header-left">
          <div className="layer-header-icon-wrap">
            <Layers size={14} className="layer-header-icon" />
            <span className="layer-header-beacon" />
          </div>
          <div className="header-text-group">
            <span className="header-title">CALQUES CARTE</span>
            <span className="header-badge">
              {activeCount}/{totalCount} ACTIFS
            </span>
          </div>
        </div>

        <div className="header-right">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </button>

      {/* Expandable Layer Panel */}
      {isExpanded && (
        <div className="layer-toggles-dropdown">
          {/* Quick Actions Row */}
          <div className="layer-quick-actions">
            <span className="quick-actions-label">FILTRES // AFFICHAGE</span>
            <button
              type="button"
              className="quick-action-btn"
              onClick={handleToggleAllClick}
            >
              {allActive ? (
                <>
                  <EyeOff size={11} />
                  <span>Tout masquer</span>
                </>
              ) : (
                <>
                  <Eye size={11} />
                  <span>Tout afficher</span>
                </>
              )}
            </button>
          </div>

          {/* Layer Items List */}
          <div className="layer-items-list">
            {LAYER_CONFIGS.map((layer) => {
              const IconComp = layer.icon;
              const isActive = activeLayers.has(layer.id);

              return (
                <div
                  key={layer.id}
                  className={`layer-item-row ${isActive ? 'is-active' : 'is-inactive'}`}
                  onClick={() => onToggleLayer && onToggleLayer(layer.id)}
                >
                  <div className="layer-item-left">
                    <div
                      className="layer-item-icon-box"
                      style={{
                        color: isActive ? layer.accentColor : '#64748b',
                        borderColor: isActive ? `${layer.accentColor}55` : 'rgba(255,255,255,0.06)',
                        background: isActive ? `${layer.accentColor}15` : 'rgba(255,255,255,0.02)',
                        boxShadow: isActive ? `0 0 10px ${layer.accentColor}33` : 'none',
                      }}
                    >
                      <IconComp size={13} />
                    </div>

                    <div className="layer-item-info">
                      <span className="layer-item-name">{layer.label}</span>
                      <span className="layer-item-meta">
                        {layer.category} • <strong style={{ color: isActive ? '#e2e8f0' : '#64748b' }}>{layer.count}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Cybernetic Switch Pill */}
                  <div
                    className={`cyber-switch ${isActive ? 'on' : 'off'}`}
                    style={{
                      borderColor: isActive ? layer.accentColor : 'rgba(255,255,255,0.12)',
                      background: isActive ? `${layer.accentColor}25` : 'rgba(0,0,0,0.4)',
                    }}
                  >
                    <span
                      className="cyber-switch-thumb"
                      style={{
                        background: isActive ? layer.accentColor : '#475569',
                        boxShadow: isActive ? `0 0 8px ${layer.accentColor}` : 'none',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
