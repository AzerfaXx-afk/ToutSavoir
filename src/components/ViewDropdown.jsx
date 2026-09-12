import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Satellite, Moon, Map as MapIcon } from 'lucide-react';
import { sound } from '../utils/soundFX';
import './ViewDropdown.css';

export function ViewDropdown({ activeLayer, onSelectLayer }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: 'satellite', label: 'Satellite HD', icon: Satellite },
    { value: 'dark', label: 'Tactique Sombre', icon: Moon },
    { value: 'osm', label: 'OpenStreetMap', icon: MapIcon },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    sound.tick();
    setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    sound.tick();
    onSelectLayer(val);
    setIsOpen(false);
  };

  return (
    <div className="view-dropdown-container" ref={dropdownRef}>
      {/* Compact "VUE" button - exact same width as the 2D/3D switch */}
      <button
        className={`view-btn-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        type="button"
        title="Changer de vue"
      >
        <Layers size={11} className="view-btn-icon" />
        <span className="view-btn-text">VUE</span>
        <ChevronDown size={10} className={`view-btn-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div className="view-dropdown-menu">
          {options.map((opt) => {
            const isSelected = opt.value === activeLayer;
            const Icon = opt.icon;

            return (
              <button
                key={opt.value}
                className={`view-menu-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
                type="button"
              >
                <Icon size={12} className="menu-item-icon" />
                <span className="menu-item-label">{opt.label}</span>
                {isSelected && <span className="menu-item-active-dot" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
