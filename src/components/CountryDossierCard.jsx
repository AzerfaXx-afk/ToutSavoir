import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  ExternalLink,
  Shield,
  Coins,
  Radio,
  Layers,
  Clock,
  Compass,
} from 'lucide-react';
import { sound } from '../utils/soundFX';
import { getCapitalLocalTimeString } from '../data/countryGeopolitics';
import './CountryDossierCard.css';

export function CountryDossierCard({
  territory,
  onClose,
  onResetView,
  onOpenDrawer,
  onCompareSize,
  isDrawerOpen = false,
}) {
  const [flagError, setFlagError] = useState(false);
  const [localTime, setLocalTime] = useState('');

  const geo = territory?.geopolitics || {};
  const utcOffset = geo.utcOffset ?? 0;
  const timeZoneName = geo.timeZoneName || 'UTC';

  // Live ticking capital clock
  useEffect(() => {
    const updateTime = () => {
      setLocalTime(getCapitalLocalTimeString(utcOffset, timeZoneName));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [utcOffset, timeZoneName]);

  if (!territory) return null;

  const flagSrc = !flagError && geo.flagUrl ? geo.flagUrl : null;

  const handleClose = () => {
    sound.tick();
    if (onClose) onClose();
  };

  const handleReset = () => {
    sound.click();
    if (onResetView) onResetView();
  };

  const handleExplore = () => {
    sound.click();
    if (onOpenDrawer) onOpenDrawer(territory);
  };

  const handleCompare = () => {
    sound.click();
    if (onCompareSize) {
      onCompareSize(territory);
    }
  };

  return (
    <div
      className={`country-dossier-card ${isDrawerOpen ? 'drawer-is-open' : ''}`}
      role="region"
      aria-label="Dossier géopolitique stratégique"
    >
      {/* ── Top Header Bar ── */}
      <div className="dossier-top-bar">
        <div className="dossier-category-badge">
          <span className="dossier-pulse-dot" />
          <span>DOSSIER GÉOPOLITIQUE // STRATÉGIE</span>
        </div>

        <div className="dossier-top-right">
          <span className="dossier-clock-tag">
            <Clock size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            {localTime}
          </span>
          <button
            type="button"
            className="dossier-close-btn"
            onClick={handleClose}
            onMouseEnter={() => sound.hover()}
            title="Fermer le dossier"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Country Identity & Official Flag ── */}
      <div className="dossier-identity-section">
        <div className="dossier-flag-frame">
          {flagSrc ? (
            <img
              src={flagSrc}
              alt={`Drapeau ${territory.name}`}
              className="dossier-flag-img"
              onError={() => setFlagError(true)}
              loading="eager"
            />
          ) : (
            <span className="dossier-flag-fallback">[{geo.iso2 || 'TER'}]</span>
          )}
        </div>

        <div className="dossier-identity-text">
          <h3 className="dossier-country-name">{territory.name}</h3>
          <span className="dossier-country-sub">
            {territory.sovereign && territory.sovereign !== territory.name
              ? `Rattaché à : ${territory.sovereign}`
              : geo.officialName || 'État souverain'}
          </span>
          <div className="dossier-code-badges">
            <span className="dossier-tag-pill">{geo.iso2 || 'ISO'} / {geo.iso3 || '---'}</span>
            <span className="dossier-tag-capital">Capitale : <strong>{geo.capital || 'N/A'}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Strategic Metrics Grid ── */}
      <div className="dossier-metrics-grid">
        <div className="dossier-metric-cell">
          <span className="dossier-metric-label">POPULATION EST.</span>
          <span className="dossier-metric-value cyan">{territory.pop || 'N/A'}</span>
          <span className="dossier-metric-sub">habitants</span>
        </div>

        <div className="dossier-metric-cell">
          <span className="dossier-metric-label">SUPERFICIE TOTALE</span>
          <span className="dossier-metric-value cyan">{territory.area || 'N/A'}</span>
          <span className="dossier-metric-sub">territoire officiel</span>
        </div>

        <div className="dossier-metric-cell">
          <span className="dossier-metric-label">PIB NOMINAL</span>
          <span className="dossier-metric-value emerald">{geo.gdpNominalUsd || 'N/A'}</span>
          <span className="dossier-metric-sub">{geo.gdpRank || 'Économie'}</span>
        </div>

        <div className="dossier-metric-cell">
          <span className="dossier-metric-label">FORCES D'ACTIVE</span>
          <span className="dossier-metric-value">{geo.militaryPersonnel || 'Forces régulières'}</span>
          <span className="dossier-metric-sub">Défense : {geo.militaryBudget || 'Souverain'}</span>
        </div>

        <div className="dossier-metric-cell">
          <span className="dossier-metric-label">DEVISE & INDICATIF</span>
          <span className="dossier-metric-value">{geo.currency || 'Locale'}</span>
          <span className="dossier-metric-sub">Tel : {geo.callingCode || '--'}</span>
        </div>

        <div className="dossier-metric-cell">
          <span className="dossier-metric-label">STATUT NUCLÉAIRE</span>
          <span className="dossier-metric-value amber">{geo.nuclearStatus || 'Non doté (TNP)'}</span>
          <span className="dossier-metric-sub">{geo.regime || 'État souverain'}</span>
        </div>
      </div>

      {/* ── Alliances and Strategic Blocs ── */}
      {geo.alliances && geo.alliances.length > 0 && (
        <div className="dossier-alliances-row">
          <span className="dossier-alliances-title">ALLIANCES & BLOCS STRATÉGIQUES</span>
          <div className="dossier-alliances-list">
            {geo.alliances.map((alliance) => (
              <span key={alliance} className="dossier-alliance-chip">
                {alliance}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Buttons Footer ── */}
      <div className="dossier-footer-actions">
        <button
          type="button"
          className="dossier-btn-secondary"
          onClick={handleReset}
          onMouseEnter={() => sound.hover()}
          title="Réinitialiser la vue de la caméra"
        >
          <Maximize2 size={12} />
          <span>VUE GLOBALE</span>
        </button>

        <button
          type="button"
          className="dossier-btn-primary"
          onClick={handleExplore}
          onMouseEnter={() => sound.hover()}
          title="Explorer les flux et la télémétrie complète"
        >
          <ExternalLink size={12} />
          <span>TÉLÉMÉTRIE EN DIRECT</span>
        </button>
      </div>
    </div>
  );
}
