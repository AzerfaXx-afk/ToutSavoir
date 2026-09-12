import React from 'react';
import { Users, Plane, ShieldAlert, Crosshair, Activity } from 'lucide-react';
import { sound } from '../utils/soundFX';

export const TACTICAL_MODES = [
  { id: 'demography', label: 'DÉMOGRAPHIE', shortLabel: 'DÉMO', icon: Users },
  { id: 'aviation', label: 'TRANSPORT & VOLS', shortLabel: 'AÉRO', icon: Plane },
  { id: 'cyber', label: 'ATTAQUES CYBER', shortLabel: 'CYBER', icon: ShieldAlert },
  { id: 'conflicts', label: 'CONFLITS & DÉFENSE', shortLabel: 'CONFLITS', icon: Crosshair },
  { id: 'telluric', label: 'SÉISMES USGS', shortLabel: 'TELLUR', icon: Activity },
];

export function TacticalModeBar({ activeMode = 'demography', onChangeMode }) {
  return (
    <div className="tactical-mode-bar" aria-label="Sélecteur de mode tactique cartographique">
      <div className="mode-bar-track">
        {TACTICAL_MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              className={`mode-bar-item ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                sound.click(0.45);
                if (onChangeMode) onChangeMode(mode.id);
              }}
              title={`Afficher le calque cartographique : ${mode.label}`}
            >
              <Icon size={12} strokeWidth={isActive ? 2.2 : 1.6} />
              <span className="mode-bar-label">{mode.label}</span>
              {isActive && <span className="mode-bar-active-indicator" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
