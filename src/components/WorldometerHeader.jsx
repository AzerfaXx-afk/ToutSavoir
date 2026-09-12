import React, { useState, useEffect } from 'react';
import { ShieldAlert, Volume2, VolumeX, Activity, Radio, Globe, Flame } from 'lucide-react';
import { sound } from '../utils/soundFX';

export function WorldometerHeader({ currentEra, isMuted, onToggleMute, activeFilter, onSelectFilter }) {
  // Live ticking sub-second counters
  const [livePopOffset, setLivePopOffset] = useState(0);
  const [liveSpendOffset, setLiveSpendOffset] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const update = (time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // World rates: ~2.6 net births/sec, ~$80,200 military spend/sec
      setLivePopOffset((prev) => prev + delta * 2.61);
      setLiveSpendOffset((prev) => prev + delta * 80210);
      setSecondsElapsed((prev) => prev + delta);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  const totalPop = Math.floor(currentEra.pop + (currentEra.type === 'live' ? livePopOffset : 0));
  const totalSpend = Math.floor(currentEra.milSpend + (currentEra.type === 'live' ? liveSpendOffset : 0));

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (num) => {
    if (num >= 1e12) {
      return `$${(num / 1e12).toFixed(3)} TRILLIONS`;
    }
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)} MILLIARDS`;
    }
    return `$${formatNumber(num)}`;
  };

  const filters = [
    { id: 'all', label: 'GLOBAL', icon: Globe },
    { id: 'conflict', label: 'CONFLITS', icon: ShieldAlert },
    { id: 'missile', label: 'BALISTIQUE', icon: Activity },
    { id: 'thermal', label: 'FEUX & SEISMES', icon: Flame },
  ];

  return (
    <header className="aegis-top-bar">
      {/* Brand & Live Indicator */}
      <div className="aegis-brand-group">
        <div className="brand-logo-glow">
          <div className="brand-pulse-dot" />
          <span className="brand-title">AEGIS // CHRONOS</span>
        </div>
        <div className="telemetry-badge">
          <Radio size={12} className="live-icon-spin" />
          <span>{currentEra.type === 'live' ? 'FLUX LIVE 24/7' : `ARCHIVE ${currentEra.year}`}</span>
        </div>
      </div>

      {/* Worldometer Live KPI Counters */}
      <div className="worldometer-kpis">
        <div className="kpi-card" onMouseEnter={() => sound.tick()}>
          <div className="kpi-label">POPULATION MONDIALE</div>
          <div className="kpi-value text-emerald">
            {formatNumber(totalPop)}
            <span className="kpi-velocity">+2.6/s</span>
          </div>
        </div>

        <div className="kpi-divider" />

        <div className="kpi-card" onMouseEnter={() => sound.tick()}>
          <div className="kpi-label">DÉPENSES MILITAIRES / AN</div>
          <div className="kpi-value text-amber">
            {formatCurrency(totalSpend)}
            <span className="kpi-velocity">+$80k/s</span>
          </div>
        </div>

        <div className="kpi-divider" />

        <div className="kpi-card" onMouseEnter={() => sound.tick()}>
          <div className="kpi-label">ALERTE GÉOPOLITIQUE</div>
          <div className="kpi-value text-crimson">
            <span className="alert-ping-ring" />
            {currentEra.risk}
            <span className="kpi-subtag">NIVEAU 1</span>
          </div>
        </div>
      </div>

      {/* Layer Filters & Audio Mute Button */}
      <div className="top-actions-group">
        <div className="layer-filter-pills">
          {filters.map((f) => {
            const Icon = f.icon;
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                className={`filter-pill-btn ${active ? 'active' : ''}`}
                onClick={() => {
                  sound.tick();
                  onSelectFilter(f.id);
                }}
              >
                <Icon size={12} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        <button
          className={`audio-toggle-btn ${isMuted ? 'muted' : ''}`}
          onClick={() => {
            sound.tick();
            onToggleMute();
          }}
          title={isMuted ? 'Activer le son télémétrique' : 'Couper le son'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>
    </header>
  );
}
