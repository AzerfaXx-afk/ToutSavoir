import React from 'react';
import { MousePointer2, Hand } from 'lucide-react';
import { sound } from '../utils/soundFX';
import './InteractionModeSwitch.css';

export function InteractionModeSwitch({ mode, onChangeMode }) {
  return (
    <div className="interaction-mode-pill">
      <button
        type="button"
        className={`mode-toggle-btn ${mode === 'select' ? 'active' : ''}`}
        onClick={() => {
          sound.tick();
          onChangeMode('select');
        }}
        title="Mode Sélection (Cliquer pour sélectionner un pays)"
        aria-label="Mode Sélection"
      >
        <MousePointer2 size={13} className="mode-icon" />
      </button>

      <div className="mode-divider" />

      <button
        type="button"
        className={`mode-toggle-btn ${mode === 'move' ? 'active' : ''}`}
        onClick={() => {
          sound.tick();
          onChangeMode('move');
        }}
        title="Mode Déplacer (Faire tourner et naviguer)"
        aria-label="Mode Déplacer"
      >
        <Hand size={13} className="mode-icon" />
      </button>
    </div>
  );
}
