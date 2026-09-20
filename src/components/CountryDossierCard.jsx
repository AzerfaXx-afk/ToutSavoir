import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Minus,
  Layers,
  Clock,
  GripHorizontal,
  TrendingUp,
  Shield,
  Coins,
  Globe2,
  Compass,
  Radio,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/soundFX';
import { getCapitalLocalTimeString } from '../data/countryGeopolitics';
import { getEstimatedPopulationForYear } from './TimelineWheel';
import './CountryDossierCard.css';

export function CountryDossierCard({
  territory,
  selectedYear = 2026,
  onClose,
  onResetView,
  onOpenDrawer,
  onCompareSize,
  isDrawerOpen = false,
}) {
  const cardRef = useRef(null);
  const dragState = useRef(null);
  const resizeState = useRef(null);

  const [flagError, setFlagError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [localTime, setLocalTime] = useState('');

  // Window interaction states
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'prospects' | 'defense'
  const [position, setPosition] = useState(null); // { x, y } | null (docked by default)
  const [customSize, setCustomSize] = useState(null); // { width, height } | null
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const geo = territory?.geopolitics || {};
  const timeZone = geo.timeZone || 'UTC';
  const capitalName = geo.capital || geo.timeZoneName || '';

  // Reset flag and tab when territory changes
  useEffect(() => {
    setFlagError(false);
    setUseFallback(false);
  }, [territory?.name, geo.iso2, geo.flagUrl]);

  // Live ticking capital clock using real IANA timezone
  useEffect(() => {
    const updateTime = () => {
      setLocalTime(getCapitalLocalTimeString(timeZone, capitalName));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeZone, capitalName]);

  // Demographic, Economic & Defense Projections according to selectedYear
  const projections = useMemo(() => {
    if (!territory) return null;
    const year = Number(selectedYear) || 2026;
    const isLiveYear = year === 2026;
    const diffYears = year - 2026;

    // Base Population
    const rawPopNum = territory.pop
      ? parseInt(String(territory.pop).replace(/\s+/g, ''), 10)
      : (territory.properties?.POP_EST || 0);

    const un2026 = 8185420000;
    const unTarget = getEstimatedPopulationForYear(year);
    const globalRatio = unTarget / un2026;

    // Continent-specific demographic weighting
    const continent = (territory.continent || '').toLowerCase();
    let regionalGrowth = 0.007; // 0.7% default
    if (continent.includes('europe')) regionalGrowth = 0.0012; // stable/aging
    else if (continent.includes('africa')) regionalGrowth = 0.021; // dynamic
    else if (continent.includes('asia')) regionalGrowth = 0.0035;
    else if (continent.includes('america')) regionalGrowth = 0.0055;

    let projectedPop = rawPopNum;
    if (rawPopNum > 0 && !isLiveYear) {
      if (year > 2026) {
        const compound = Math.pow(1 + regionalGrowth, diffYears);
        const blended = 0.55 * compound + 0.45 * globalRatio;
        projectedPop = Math.round(rawPopNum * blended);
      } else {
        projectedPop = Math.round(rawPopNum * globalRatio);
      }
    }

    const popDeltaPct =
      rawPopNum > 0 && !isLiveYear
        ? (((projectedPop - rawPopNum) / rawPopNum) * 100).toFixed(1)
        : null;

    // Nominal GDP Projections (trajectoire FMI / Banque Mondiale)
    const baseGdpStr = geo.gdpNominalUsd || '';
    const gdpMatch = baseGdpStr.match(/([\d\s,]+)\s*(Mrds|Billion|Milliard)/i);
    let projectedGdp = baseGdpStr;
    let gdpDeltaPct = null;

    if (gdpMatch && !isLiveYear) {
      const baseNum = parseFloat(gdpMatch[1].replace(/\s+/g, '').replace(',', '.'));
      if (!isNaN(baseNum)) {
        const rate = continent.includes('europe') ? 0.021 : 0.034;
        const gdpFactor = Math.pow(1 + rate, diffYears);
        const nextVal = Math.round(baseNum * gdpFactor);
        projectedGdp = `${nextVal.toLocaleString('fr-FR')} Mrds $`;
        gdpDeltaPct = (((nextVal - baseNum) / baseNum) * 100).toFixed(1);
      }
    }

    // Defense Budget Projection (ex: LPM 2024-2030 pour la France)
    let projectedMilBudget = geo.militaryBudget || 'Souverain';
    if (!isLiveYear && geo.militaryBudget) {
      const milMatch = geo.militaryBudget.match(/([\d\s,]+)\s*(Mrds|Milliard)/i);
      if (milMatch) {
        const milNum = parseFloat(milMatch[1].replace(/\s+/g, '').replace(',', '.'));
        if (!isNaN(milNum)) {
          const milRate = year > 2026 ? 0.038 : 0.02;
          const milFactor = Math.pow(1 + milRate, diffYears);
          const nextMil = (milNum * milFactor).toFixed(1).replace('.', ',');
          projectedMilBudget = `${nextMil} Mrds $`;
        }
      }
    }

    return {
      isLiveYear,
      year,
      projectedPop:
        projectedPop > 0
          ? projectedPop.toLocaleString('fr-FR')
          : territory.pop || 'N/A',
      popDeltaPct,
      projectedGdp,
      gdpDeltaPct,
      projectedMilBudget,
    };
  }, [territory, selectedYear, geo.gdpNominalUsd, geo.militaryBudget]);

  /* ── Drag & Drop Pointer Logic (header grab) ──────────────────── */
  const handlePointerDownHeader = useCallback((e) => {
    // Avoid dragging when clicking buttons, tabs or controls
    if (
      e.target.closest('button') ||
      e.target.closest('.dossier-tab-btn') ||
      e.target.closest('.dossier-resize-handle')
    ) {
      return;
    }
    e.preventDefault();

    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      cardWidth: rect.width,
      cardHeight: rect.height,
    };

    setIsDragging(true);
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEvt) => {
      if (!dragState.current) return;
      const dx = moveEvt.clientX - dragState.current.startX;
      const dy = moveEvt.clientY - dragState.current.startY;

      let newX = dragState.current.startLeft + dx;
      let newY = dragState.current.startTop + dy;

      const pad = 10;
      const maxX = window.innerWidth - dragState.current.cardWidth - pad;
      const maxY = window.innerHeight - dragState.current.cardHeight - pad;

      newX = Math.max(pad, Math.min(maxX, newX));
      newY = Math.max(pad, Math.min(maxY, newY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragState.current = null;
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, []);

  /* ── Corner Resize Pointer Logic ──────────────────────────────── */
  const handleResizePointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: rect.left,
      startTop: rect.top,
    };

    setIsResizing(true);
    document.body.style.userSelect = 'none';

    const handleResizeMove = (moveEvt) => {
      if (!resizeState.current) return;
      const dw = moveEvt.clientX - resizeState.current.startX;
      const dh = moveEvt.clientY - resizeState.current.startY;

      const minW = isMaximized ? 480 : 320;
      const maxW = Math.min(window.innerWidth - 30, 880);
      const minH = 240;
      const maxH = Math.min(window.innerHeight - 80, 860);

      const nextW = Math.max(minW, Math.min(maxW, resizeState.current.startWidth + dw));
      const nextH = Math.max(minH, Math.min(maxH, resizeState.current.startHeight + dh));

      setCustomSize({ width: nextW, height: nextH });
    };

    const handleResizeUp = () => {
      setIsResizing(false);
      resizeState.current = null;
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointerup', handleResizeUp);
    };

    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeUp);
  }, [isMaximized]);

  const handleResetPosition = () => {
    sound.click();
    setPosition(null);
    setCustomSize(null);
  };

  const handleToggleMinimize = () => {
    sound.click();
    setIsMinimized((prev) => !prev);
  };

  const handleToggleMaximize = () => {
    sound.click();
    setIsMaximized((prev) => {
      const next = !prev;
      if (next && activeTab === 'overview') {
        setActiveTab('prospects');
      }
      return next;
    });
    setCustomSize(null);
  };

  const handleClose = () => {
    sound.tick();
    if (onClose) onClose();
  };

  const handleReset = () => {
    sound.click();
    if (onResetView) onResetView();
  };

  const handleCompare = () => {
    sound.click();
    if (onCompareSize) onCompareSize(territory);
  };

  const handleExplore = () => {
    sound.click();
    if (onOpenDrawer) onOpenDrawer(territory);
  };

  if (!territory) return null;

  const flagSrc = !flagError
    ? useFallback
      ? geo.flagFallback || geo.flagUrl
      : geo.flagUrl || geo.flagFallback
    : null;

  // Inline styles when user has dragged or resized
  const cardStyle = {};
  if (position) {
    cardStyle.left = `${position.x}px`;
    cardStyle.top = `${position.y}px`;
    cardStyle.right = 'auto';
    cardStyle.bottom = 'auto';
  }
  if (customSize && !isMinimized) {
    cardStyle.width = `${customSize.width}px`;
    cardStyle.height = `${customSize.height}px`;
    cardStyle.maxHeight = 'none';
  }

  /* ════════════════════════════════════════════════════════════════════
     1. MINIMIZED ULTRA-COMPACT FLOATING STATUS CAPSULE
     ════════════════════════════════════════════════════════════════════ */
  if (isMinimized) {
    return (
      <div
        ref={cardRef}
        className={`country-dossier-card is-minimized ${isDragging ? 'is-dragging' : ''}`}
        style={cardStyle}
        onPointerDown={handlePointerDownHeader}
        role="region"
        aria-label={`Dossier réduit ${territory.name}`}
      >
        <div className="minimized-pill-inner">
          <div className="minimized-grip" title="Glisser pour déplacer">
            <GripHorizontal size={14} />
          </div>

          <div className="minimized-flag-badge">
            {flagSrc ? (
              <img src={flagSrc} alt="" className="minimized-flag-img" />
            ) : (
              <span className="minimized-flag-code">{geo.iso2 || 'TER'}</span>
            )}
          </div>

          <div className="minimized-meta">
            <span className="minimized-country-name">{territory.name}</span>
            <span className="minimized-stat-tag">
              {projections?.projectedPop} hab. · {selectedYear}
            </span>
          </div>

          <div className="minimized-actions">
            <button
              type="button"
              className="minimized-btn restore"
              onClick={handleToggleMinimize}
              onMouseEnter={() => sound.hover()}
              title="Agrandir le dossier"
              aria-label="Agrandir le dossier"
            >
              <Maximize2 size={12} />
            </button>
            <button
              type="button"
              className="minimized-btn close"
              onClick={handleClose}
              onMouseEnter={() => sound.hover()}
              title="Fermer"
              aria-label="Fermer"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════
     2. FULL STRATEGIC / PROSPECTIVE WORKSTATION
     ════════════════════════════════════════════════════════════════════ */
  return (
    <div
      ref={cardRef}
      className={`country-dossier-card ${isDrawerOpen && !position ? 'drawer-is-open' : ''} ${
        isMaximized ? 'is-maximized' : ''
      } ${isDragging ? 'is-dragging' : ''} ${isResizing ? 'is-resizing' : ''}`}
      style={cardStyle}
      role="region"
      aria-label="Dossier géopolitique stratégique"
    >
      {/* ── Top Header Bar (Tactile Drag Handle) ── */}
      <div
        className="dossier-top-bar"
        onPointerDown={handlePointerDownHeader}
        onDoubleClick={handleResetPosition}
        title="Double-clic pour réancrer au coin par défaut · Glisser pour déplacer"
      >
        <div className="dossier-header-left">
          <div className="dossier-drag-handle" title="Glisser pour déplacer la fenêtre">
            <GripHorizontal size={13} />
          </div>

          <div className="dossier-category-badge">
            <span className="dossier-pulse-dot" />
            <span>
              {isMaximized
                ? `STATION STRATÉGIQUE // ${territory.name?.toUpperCase()}`
                : `DOSSIER GÉOPOLITIQUE // STRATÉGIE`}
            </span>
          </div>
        </div>

        <div className="dossier-top-right">
          <span className="dossier-clock-tag">
            <Clock size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            {localTime}
          </span>

          {position && (
            <button
              type="button"
              className="dossier-tool-btn"
              onClick={handleResetPosition}
              onMouseEnter={() => sound.hover()}
              title="Réancrer la fenêtre à sa position par défaut"
              aria-label="Réancrer"
            >
              <RotateCcw size={11} />
            </button>
          )}

          <button
            type="button"
            className="dossier-tool-btn"
            onClick={handleToggleMinimize}
            onMouseEnter={() => sound.hover()}
            title="Réduire en capsule compacte"
            aria-label="Réduire"
          >
            <Minus size={13} />
          </button>

          <button
            type="button"
            className="dossier-tool-btn"
            onClick={handleToggleMaximize}
            onMouseEnter={() => sound.hover()}
            title={isMaximized ? 'Réduire la vue détaillée' : 'Agrandir en vue détaillée'}
            aria-label={isMaximized ? 'Vue normale' : 'Agrandir'}
          >
            <Maximize2 size={12} />
          </button>

          <button
            type="button"
            className="dossier-close-btn"
            onClick={handleClose}
            onMouseEnter={() => sound.hover()}
            title="Fermer le dossier"
            aria-label="Fermer"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Temporal Horizon Indicator (Awwards Futuristic Prediction Banner) ── */}
      <div className={`dossier-temporal-banner ${projections?.isLiveYear ? 'is-live' : 'is-projection'}`}>
        <div className="dtb-left">
          <span className="dtb-pulse-light" />
          <span className="dtb-title">
            {projections?.isLiveYear ? (
              <>TÉLÉMÉTRIE EN DIRECT · 2026</>
            ) : selectedYear > 2026 ? (
              <>
                <Sparkles size={11} className="dtb-icon" />
                MODÈLE PRÉDICTIF OSINT // HORIZON {selectedYear}
              </>
            ) : (
              <>ARCHIVE GÉOPOLITIQUE // AN {selectedYear}</>
            )}
          </span>
        </div>
        {!projections?.isLiveYear && (
          <span className="dtb-tag">
            {selectedYear > 2026 ? `+${selectedYear - 2026} ans proj.` : `${selectedYear - 2026} ans`}
          </span>
        )}
      </div>

      {/* ── Maximized Tabs Navigation ── */}
      {isMaximized && (
        <div className="dossier-tabs-nav">
          <button
            type="button"
            className={`dossier-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => {
              sound.click(0.3);
              setActiveTab('overview');
            }}
          >
            <Globe2 size={12} />
            <span>SYNTHÈSE GÉOPOLITIQUE</span>
          </button>
          <button
            type="button"
            className={`dossier-tab-btn ${activeTab === 'prospects' ? 'is-active' : ''}`}
            onClick={() => {
              sound.click(0.3);
              setActiveTab('prospects');
            }}
          >
            <TrendingUp size={12} />
            <span>PROSPECTIVE {selectedYear}</span>
            {selectedYear !== 2026 && <span className="tab-pill-year">{selectedYear}</span>}
          </button>
          <button
            type="button"
            className={`dossier-tab-btn ${activeTab === 'defense' ? 'is-active' : ''}`}
            onClick={() => {
              sound.click(0.3);
              setActiveTab('defense');
            }}
          >
            <Shield size={12} />
            <span>DÉFENSE & ALLIANCES</span>
          </button>
        </div>
      )}

      {/* ── Scrollable Body Area ── */}
      <div className="dossier-scrollable-body">
        {/* Country Identity & Official Flag */}
        <div className="dossier-identity-section">
          <div className="dossier-flag-frame">
            {flagSrc ? (
              <img
                src={flagSrc}
                alt={`Drapeau ${territory.name}`}
                className="dossier-flag-img"
                onError={() => {
                  if (!useFallback && geo.flagFallback && geo.flagFallback !== flagSrc) {
                    setUseFallback(true);
                  } else {
                    setFlagError(true);
                  }
                }}
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

        {/* ════ TAB 1: OVERVIEW (Default standard or Maximized tab) ════ */}
        {(!isMaximized || activeTab === 'overview') && (
          <>
            {/* Strategic Metrics Grid with predictive delta chips */}
            <div className="dossier-metrics-grid">
              <div className="dossier-metric-cell">
                <span className="dossier-metric-label">
                  POPULATION {projections?.isLiveYear ? 'EST.' : `PROJ. (${selectedYear})`}
                </span>
                <div className="dossier-val-row">
                  <span className="dossier-metric-value cyan">{projections?.projectedPop}</span>
                  {projections?.popDeltaPct && (
                    <span className={`dossier-delta-badge ${Number(projections.popDeltaPct) >= 0 ? 'pos' : 'neg'}`}>
                      {Number(projections.popDeltaPct) >= 0 ? `+${projections.popDeltaPct}%` : `${projections.popDeltaPct}%`}
                    </span>
                  )}
                </div>
                <span className="dossier-metric-sub">
                  {projections?.isLiveYear ? 'habitants' : `projection ONU horizon ${selectedYear}`}
                </span>
              </div>

              <div className="dossier-metric-cell">
                <span className="dossier-metric-label">SUPERFICIE TOTALE</span>
                <span className="dossier-metric-value cyan">{territory.area || 'N/A'}</span>
                <span className="dossier-metric-sub">territoire officiel</span>
              </div>

              <div className="dossier-metric-cell">
                <span className="dossier-metric-label">
                  PIB NOMINAL {projections?.isLiveYear ? '' : `EST. ${selectedYear}`}
                </span>
                <div className="dossier-val-row">
                  <span className="dossier-metric-value emerald">{projections?.projectedGdp}</span>
                  {projections?.gdpDeltaPct && (
                    <span className="dossier-delta-badge pos">
                      +{projections.gdpDeltaPct}%
                    </span>
                  )}
                </div>
                <span className="dossier-metric-sub">
                  {projections?.isLiveYear ? (geo.gdpRank || 'Économie') : `Trajectoire FMI (${geo.gdpRank || 'Économie'})`}
                </span>
              </div>

              <div className="dossier-metric-cell">
                <span className="dossier-metric-label">FORCES D'ACTIVE</span>
                <span className="dossier-metric-value">{geo.militaryPersonnel || 'Forces régulières'}</span>
                <span className="dossier-metric-sub">
                  Budget : {projections?.projectedMilBudget} {projections?.isLiveYear ? '' : `(${selectedYear})`}
                </span>
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

            {/* Alliances and Strategic Blocs */}
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
          </>
        )}

        {/* ════ TAB 2: PROSPECTIVE & PREDICTION (Maximized tab) ════ */}
        {isMaximized && activeTab === 'prospects' && (
          <div className="dossier-prospects-view">
            <div className="dossier-insight-box">
              <div className="dib-header">
                <Sparkles size={13} className="text-cyan" />
                <span className="dib-title">TRAJECTOIRE STRATÉGIQUE HORIZON {selectedYear}</span>
              </div>
              <p className="dib-text">
                Simulation démographique et géoéconomique calibrée d'après les benchmarks prospectifs des Nations Unies, de l'OCDE et du FMI.
                {selectedYear > 2026 && (
                  <>
                    {' '}À l'horizon {selectedYear}, {territory.name} présente une évolution démographique projetée à{' '}
                    <strong>{projections?.projectedPop}</strong> ({projections?.popDeltaPct ? `+${projections.popDeltaPct}%` : 'stable'}),
                    avec une restructuration industrielle axée sur la décarbonation, l'IA et l'autonomie énergétique.
                  </>
                )}
              </p>
            </div>

            {/* Prospective Timeline Milestones */}
            <div className="prospect-benchmarks-grid">
              <div className={`prospect-card ${selectedYear === 2026 ? 'is-selected' : ''}`}>
                <span className="pc-year">2026 (Présent)</span>
                <span className="pc-val">{territory.pop || 'N/A'}</span>
                <span className="pc-sub">Population de référence</span>
              </div>
              <div className={`prospect-card ${selectedYear === 2030 ? 'is-selected' : ''}`}>
                <span className="pc-year">2030 (Objectifs ONU)</span>
                <span className="pc-val text-cyan">
                  {getEstimatedPopulationForYear(2030) ? projections?.projectedPop : 'Calcul...'}
                </span>
                <span className="pc-sub">Transition énergétique & LPM</span>
              </div>
              <div className={`prospect-card ${selectedYear === 2040 ? 'is-selected' : ''}`}>
                <span className="pc-year">2040 (Automatisation)</span>
                <span className="pc-val text-emerald">Capacité IA & Décarbonation</span>
                <span className="pc-sub">Avionique hydrogène & Fusion</span>
              </div>
              <div className={`prospect-card ${selectedYear === 2050 ? 'is-selected' : ''}`}>
                <span className="pc-year">2050 (Neutralité Net-Zéro)</span>
                <span className="pc-val text-amber">Stabilisation démographique</span>
                <span className="pc-sub">Horizon prospectif climat</span>
              </div>
            </div>

            {/* Energy & Geoeconomics forecast breakdown */}
            <div className="prospect-details-table">
              <div className="pdt-row">
                <span className="pdt-label">PIB Prévu ({selectedYear})</span>
                <span className="pdt-val text-emerald">{projections?.projectedGdp}</span>
              </div>
              <div className="pdt-row">
                <span className="pdt-label">Budget Défense Programmé</span>
                <span className="pdt-val text-cyan">{projections?.projectedMilBudget}</span>
              </div>
              <div className="pdt-row">
                <span className="pdt-label">Mix Énergétique Cible</span>
                <span className="pdt-val">80% Bas-carbone (Nucléaire + Renouvelable)</span>
              </div>
              <div className="pdt-row">
                <span className="pdt-label">Espace & Constellations</span>
                <span className="pdt-val">Partenaire constellation souveraine IRIS²</span>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 3: DEFENSE & ALLIANCES (Maximized tab) ════ */}
        {isMaximized && activeTab === 'defense' && (
          <div className="dossier-defense-view">
            <div className="defense-posture-box">
              <div className="dpb-header">
                <Shield size={14} className="text-amber" />
                <span className="dpb-title">DOCTRINE & FORCES STRATÉGIQUES</span>
              </div>
              <div className="dpb-grid">
                <div className="dpb-stat">
                  <span className="dpb-stat-lbl">FORCES RÉGULIÈRES</span>
                  <span className="dpb-stat-val text-cyan">{geo.militaryPersonnel || 'Forces armées'}</span>
                </div>
                <div className="dpb-stat">
                  <span className="dpb-stat-lbl">BUDGET DÉFENSE {selectedYear}</span>
                  <span className="dpb-stat-val text-emerald">{projections?.projectedMilBudget}</span>
                </div>
                <div className="dpb-stat">
                  <span className="dpb-stat-lbl">STATUT NUCLÉAIRE</span>
                  <span className="dpb-stat-val text-amber">{geo.nuclearStatus || 'Non doté'}</span>
                </div>
                <div className="dpb-stat">
                  <span className="dpb-stat-lbl">RÉGIME POLITIQUE</span>
                  <span className="dpb-stat-val">{geo.regime || 'État souverain'}</span>
                </div>
              </div>
            </div>

            {geo.alliances && geo.alliances.length > 0 && (
              <div className="dossier-alliances-section">
                <span className="das-title">TRAITÉS, PACTES ET ENGAGEMENTS INTERNATIONAUX</span>
                <div className="das-chips">
                  {geo.alliances.map((alliance) => (
                    <div key={alliance} className="das-chip">
                      <span className="das-dot" />
                      <span>{alliance}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Action Buttons Footer ── */}
      <div className="dossier-footer-actions">
        <button
          type="button"
          className="dossier-btn-secondary"
          onClick={handleReset}
          onMouseEnter={() => sound.hover()}
          title="Afficher la vue globale du monde (le pays reste sélectionné)"
        >
          <Compass size={12} />
          <span>VUE GLOBALE</span>
        </button>

        <button
          type="button"
          className="dossier-btn-secondary"
          onClick={handleExplore}
          onMouseEnter={() => sound.hover()}
          title="Ouvrir le flux de télémétrie ciblé sur ce pays"
        >
          <Radio size={12} />
          <span>TÉLÉMÉTRIE PAYS</span>
        </button>

        <button
          type="button"
          className="dossier-btn-primary dossier-btn-detach"
          onClick={handleCompare}
          onMouseEnter={() => sound.hover()}
          title="Détacher le pays et le glisser sur le globe pour comparer sa taille réelle"
        >
          <Layers size={13} />
          <span>DÉTACHER & COMPARER</span>
        </button>
      </div>

      {/* ── Corner Interactive Resize Grip Handle ── */}
      <div
        className="dossier-resize-handle"
        onPointerDown={handleResizePointerDown}
        title="Glisser pour redimensionner librement la fenêtre"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" className="resize-svg">
          <circle cx="13" cy="13" r="1.2" fill="currentColor" />
          <circle cx="9" cy="13" r="1.2" fill="currentColor" />
          <circle cx="13" cy="9" r="1.2" fill="currentColor" />
          <circle cx="5" cy="13" r="1.2" fill="currentColor" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" />
          <circle cx="13" cy="5" r="1.2" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
