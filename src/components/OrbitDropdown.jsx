import React, { useState, useRef, useEffect } from 'react';
import { Globe, RotateCw, MapPin, Compass, Check, Map } from 'lucide-react';
import { sound } from '../utils/soundFX';
import './OrbitDropdown.css';

export function OrbitDropdown({
  autoRotate,
  onToggleAutoRotate,
  showBorders,
  onToggleBorders,
  onSelectPreset,
  onResetView,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const presets = [
    { id: 'europe', name: 'Europe', sub: 'Paris / 48°N' },
    { id: 'americas', name: 'Amériques', sub: 'New York / 40°N' },
    { id: 'asia', name: 'Asie-Pacifique', sub: 'Tokyo / 35°N' },
    { id: 'africa', name: 'Afrique', sub: 'Sahara / 15°N' },
    { id: 'oceania', name: 'Océanie', sub: 'Sydney / 33°S' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    sound.tick();
    setIsOpen(!isOpen);
  };

  return (
    <div className="orbit-dropdown-wrapper" ref={dropdownRef}>
      {/* Compact Trigger Button matching Switch3D width (77px) */}
      <button
        type="button"
        className={`orbit-dropdown-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleDropdown}
        title="Options de l'orbite 3D"
      >
        <Globe size={11} className="orbit-dropdown-icon" />
        <span className="orbit-dropdown-label">VUE</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="orbit-menu-container">
          <div className="orbit-menu-header">
            <span className="orbit-menu-title">COMMANDES DE L'ORBITE</span>
          </div>

          {/* Earth Continuous Rotation Toggle */}
          <button
            type="button"
            className={`orbit-menu-item ${autoRotate ? 'selected' : ''}`}
            onClick={() => {
              sound.tick();
              onToggleAutoRotate();
            }}
          >
            <div className="orbit-item-icon-box">
              <RotateCw size={12} className={autoRotate ? 'animate-spin-slow' : ''} />
            </div>
            <div className="orbit-item-info">
              <span className="orbit-item-name">Rotation Terrestre</span>
              <span className="orbit-item-desc">
                {autoRotate ? 'En cours (Continue)' : 'En pause'}
              </span>
            </div>
            {autoRotate && <Check size={12} className="orbit-item-check" />}
          </button>

          {/* Geopolitical Borders Toggle */}
          <button
            type="button"
            className={`orbit-menu-item ${showBorders ? 'selected' : ''}`}
            onClick={() => {
              sound.tick();
              onToggleBorders();
            }}
          >
            <div className="orbit-item-icon-box">
              <Map size={12} />
            </div>
            <div className="orbit-item-info">
              <span className="orbit-item-name">Délimitations Pays</span>
              <span className="orbit-item-desc">
                {showBorders ? 'Visibles (50m HD)' : 'Masquées'}
              </span>
            </div>
            {showBorders && <Check size={12} className="orbit-item-check" />}
          </button>

          <div className="orbit-menu-divider" />

          {/* Continent Presets */}
          <div className="orbit-presets-group">
            <span className="orbit-group-label">CENTRER LE GLOBE</span>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="orbit-menu-item"
                onClick={() => {
                  sound.alert();
                  onSelectPreset(preset.id);
                  setIsOpen(false);
                }}
              >
                <div className="orbit-item-icon-box">
                  <MapPin size={12} />
                </div>
                <div className="orbit-item-info">
                  <span className="orbit-item-name">{preset.name}</span>
                  <span className="orbit-item-desc">{preset.sub}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="orbit-menu-divider" />

          {/* Reset Camera */}
          <button
            type="button"
            className="orbit-menu-item reset-action"
            onClick={() => {
              sound.tick();
              onResetView();
              setIsOpen(false);
            }}
          >
            <div className="orbit-item-icon-box">
              <Compass size={12} />
            </div>
            <div className="orbit-item-info">
              <span className="orbit-item-name">Réinitialiser l'Orbite</span>
              <span className="orbit-item-desc">Altitude & angle par défaut</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
