import React, { useEffect } from 'react';
import { X, Command, Eye, Volume2, Maximize, Compass, Activity, Radio } from 'lucide-react';
import { sound } from '../utils/soundFX';
import './TacticalShortcutsModal.css';

const SHORTCUTS = [
  {
    category: 'NAVIGATION & RECHERCHE',
    items: [
      { key: '⌘ + K / Ctrl + K', label: 'Recherche Universelle (Spotlight)', desc: '195 pays, satellites, CCTV, câbles, Worldometer' },
      { key: 'T', label: 'Tiroir Télémétrie & Intel', desc: 'Ouvre/ferme le centre de commandement latéral' },
      { key: '↑ / ↓ / Entrée', label: 'Navigation Spotlight', desc: 'Parcourir et sélectionner les résultats' },
      { key: 'Échap', label: 'Fermer / Retour', desc: 'Ferme les fenêtres modales, la vidéo CCTV ou le tiroir' },
    ],
  },
  {
    category: 'AFFICHAGE CARTOGRAPHIQUE',
    items: [
      { key: 'Espace', label: 'Pause / Lecture Rotation 3D', desc: 'Arrête ou reprend la rotation planétaire' },
      { key: 'F', label: 'Plein Écran Immersif', desc: 'Bascule en mode cinéma surveillance' },
      { key: 'Clic Droit + Glisser', label: 'Rotation Libre 3D', desc: 'Orienter la caméra orbitale' },
      { key: 'Molette de Souris', label: 'Zoom Optique', desc: 'Agrandir la zone de surveillance' },
    ],
  },
  {
    category: 'AUDIO & TACTIQUE',
    items: [
      { key: 'M', label: 'Activer / Couper le Son', desc: 'Bascule le paysage sonore spatial & effets sonores' },
      { key: '?', label: 'Aide Raccourcis', desc: 'Affiche cette grille de commandes tactiques' },
    ],
  },
];

export function TacticalShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="shortcuts-modal-backdrop" onClick={onClose}>
      <div
        className="shortcuts-modal-window"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Commandes et raccourcis tactiques"
      >
        {/* Modal Header */}
        <div className="shortcuts-modal-header">
          <div className="shortcuts-title-group">
            <div className="shortcuts-pulse-dot" />
            <span className="shortcuts-hud-code">AEGIS // PROTOCOLE RACCOURCIS</span>
          </div>
          <button
            type="button"
            className="shortcuts-close-btn"
            onClick={() => {
              sound.click();
              onClose();
            }}
            title="Fermer (Échap)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="shortcuts-content-body">
          {SHORTCUTS.map((sec) => (
            <div key={sec.category} className="shortcuts-section">
              <div className="shortcuts-section-title">{sec.category}</div>
              <div className="shortcuts-items-list">
                {sec.items.map((item, idx) => (
                  <div key={idx} className="shortcut-row">
                    <div className="shortcut-key-wrapper">
                      <kbd className="shortcut-kbd">{item.key}</kbd>
                    </div>
                    <div className="shortcut-info">
                      <span className="shortcut-label">{item.label}</span>
                      <span className="shortcut-desc">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shortcuts-modal-footer">
          <span>APPUYEZ SUR <kbd className="shortcut-kbd-inline">ÉCHAP</kbd> POUR QUITTER</span>
          <span className="shortcuts-status-pill">● OPÉRATIONNEL</span>
        </div>
      </div>
    </div>
  );
}
