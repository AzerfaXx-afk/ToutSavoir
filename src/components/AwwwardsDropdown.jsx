import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { sound } from '../utils/soundFX';
import './AwwwardsDropdown.css';

export function AwwwardsDropdown({ label, options, selectedValue, onSelect, icon: HeaderIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue) || options[0];

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

  const handleItemClick = (val) => {
    sound.tick();
    onSelect(val);
    setIsOpen(false);
  };

  return (
    <div className="awwwards-dropdown" ref={dropdownRef}>
      <button
        className={`dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        type="button"
      >
        <div className="trigger-left">
          {HeaderIcon && <HeaderIcon size={13} className="trigger-icon" />}
          <span className="trigger-label">{label}</span>
          <span className="trigger-sep">/</span>
          <span className="trigger-current">{selectedOption.label}</span>
        </div>
        <ChevronDown size={12} className={`trigger-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-panel">
          <div className="dropdown-list">
            {options.map((opt, idx) => {
              const isSelected = opt.value === selectedValue;
              const ItemIcon = opt.icon;

              return (
                <button
                  key={opt.value}
                  className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleItemClick(opt.value)}
                  type="button"
                >
                  <div className="item-prefix">
                    {ItemIcon ? (
                      <ItemIcon size={12} className="item-icon-svg" />
                    ) : (
                      <span className="item-index">{String(idx + 1).padStart(2, '0')}</span>
                    )}
                  </div>
                  <span className="item-label">{opt.label}</span>
                  {isSelected && <span className="item-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
