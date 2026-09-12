import React from 'react';
import { sound } from '../utils/soundFX';
import './Switch3D.css';

export function Switch3D({ is3D, onToggle }) {
  const handleChange = (e) => {
    sound.click();
    sound.toggle();
    onToggle(e.target.checked);
  };

  return (
    <div
      className="switch-3d-wrapper"
      onMouseEnter={() => sound.hover()}
    >
      <label
        className="switch-3d"
        title="Basculer vue 2D / 3D"
        onMouseEnter={() => sound.hover()}
      >
        <input
          className="cb"
          type="checkbox"
          checked={is3D}
          onChange={handleChange}
        />
        <span className="toggle">
          <span className="left">2D</span>
          <span className="right">3D</span>
        </span>
      </label>
    </div>
  );
}
