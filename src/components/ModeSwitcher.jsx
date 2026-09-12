import React from 'react';
import { Map, Orbit } from 'lucide-react';
import { sound } from '../utils/soundFX';

export function ModeSwitcher({ currentMode, onChangeMode }) {
  const is2D = currentMode === '2d';

  const handleSelect = (mode) => {
    if (mode === currentMode) return;
    sound.warp(mode === '3d' ? 800 : 450);
    onChangeMode(mode);
  };

  return (
    <div className="mode-switcher-container">
      <div className="mode-switcher-capsule">
        {/* Sliding glow highlight */}
        <div className={`mode-slider-pill ${is2D ? 'pos-left' : 'pos-right'}`} />

        <button
          className={`mode-btn ${is2D ? 'active' : ''}`}
          onClick={() => handleSelect('2d')}
        >
          <Map size={13} className="mode-icon" />
          <span>2D TACTIQUE</span>
        </button>

        <button
          className={`mode-btn ${!is2D ? 'active' : ''}`}
          onClick={() => handleSelect('3d')}
        >
          <Orbit size={13} className="mode-icon" />
          <span>3D ORBITE</span>
        </button>
      </div>
    </div>
  );
}
