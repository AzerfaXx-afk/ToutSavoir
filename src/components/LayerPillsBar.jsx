import React from 'react';
import { LAYER_DEFINITIONS } from '../data/layerDefinitions';
import { sound } from '../utils/soundFX';
import './LayerPillsBar.css';

export function LayerPillsBar({ activeLayers = new Set(), onToggleLayer, onSetAllLayers }) {
  const handleToggle = (layerId) => {
    sound.click(0.4);
    if (onToggleLayer) onToggleLayer(layerId);
  };

  const handleSelectAll = () => {
    sound.hover();
    if (onSetAllLayers) {
      onSetAllLayers(new Set(LAYER_DEFINITIONS.map((l) => l.id)));
    }
  };

  const handleClearAll = () => {
    sound.tick();
    if (onSetAllLayers) {
      onSetAllLayers(new Set());
    }
  };

  return (
    <nav className="layer-pills-container" aria-label="Calques tactiques de renseignement planétaire">
      {LAYER_DEFINITIONS.map((layer) => {
        const isActive = activeLayers.has(layer.id);
        const Icon = layer.icon;

        return (
          <button
            key={layer.id}
            type="button"
            className={`layer-pill ${isActive ? 'is-active' : ''}`}
            style={{
              '--pill-color': layer.color,
              '--pill-shadow': layer.shadow,
              '--pill-glow-bg': layer.glowBg,
            }}
            onClick={() => handleToggle(layer.id)}
            title={`${layer.label} (${isActive ? 'Activé - Cliquer pour masquer' : 'Désactivé - Cliquer pour afficher'}) : ${layer.desc}`}
          >
            <span className="pill-icon-wrapper">
              <Icon size={12} strokeWidth={isActive ? 2.4 : 1.8} />
            </span>
            <span className="pill-label">{layer.label}</span>
            <span className="pill-badge">{layer.count}</span>
          </button>
        );
      })}

      <div className="layer-pills-actions">
        <button
          type="button"
          className="layer-action-btn"
          onClick={handleSelectAll}
          title="Activer tous les calques tactiques"
        >
          TOUT
        </button>
        <button
          type="button"
          className="layer-action-btn"
          onClick={handleClearAll}
          title="Désactiver tous les calques"
        >
          EFFACER
        </button>
      </div>
    </nav>
  );
}
