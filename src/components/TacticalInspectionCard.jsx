import React, { useEffect, useState } from 'react';
import {
  X,
  Maximize2,
  Video,
  Plane,
  Anchor,
  Compass,
  Radio,
  ExternalLink,
  LocateFixed,
  Navigation,
  Radiation,
} from 'lucide-react';
import { sound } from '../utils/soundFX';
import './TacticalInspectionCard.css';

export function TacticalInspectionCard({
  target,
  onClose,
  onOpenLive,
  onCenter,
  isDrawerOpen = false,
}) {
  const [zuluTime, setZuluTime] = useState('');

  // Real-time ticking UTC Zulu clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      setZuluTime(`${h}:${m}:${s} ZULU`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!target) return null;

  const isCCTV = target.type === 'cctv' || target.category?.includes('Maritime') || target.embedUrl;
  const isFlight = target.type === 'flight' || target.aircraft || target.callsign;
  const isVessel = target.type === 'vessel' || target.imo || target.mmsi;
  const isSatellite = target.type === 'satellite' || target.noradId;
  const isNuclear = target.type === 'nuclear' || target.capacityMwe;

  const handleClose = () => {
    sound.tick();
    if (onClose) onClose();
  };

  const handleCenter = () => {
    sound.click();
    const lat = target.lat ?? target.origin?.coords?.[0];
    const lng = target.lng ?? target.origin?.coords?.[1];
    if (onCenter && lat !== undefined && lng !== undefined) {
      onCenter(lat, lng);
    }
  };

  const handleLiveAction = () => {
    sound.click();
    if (onOpenLive) onOpenLive(target);
  };

  return (
    <div
      className={`tactical-inspection-card ${isDrawerOpen ? 'drawer-is-open' : ''}`}
      role="region"
      aria-label="Fiche d'inspection tactique"
    >
      {/* Card Header */}
      <div className="tic-header">
        <div className="tic-target-badge">
          {isCCTV && <Video size={13} className="tic-icon cctv" />}
          {isFlight && <Plane size={13} className="tic-icon flight" />}
          {isVessel && <Anchor size={13} className="tic-icon vessel" />}
          {isSatellite && <Radio size={13} className="tic-icon sat" />}
          {isNuclear && <Radiation size={13} className="tic-icon nuclear" style={{ color: '#eab308' }} />}
          <span className="tic-type-label">
            {isCCTV && (target.code || 'CAM // DIRECT OPTIQUE')}
            {isFlight && `VOL // ${target.callsign || target.flightNum}`}
            {isVessel && `NAVIRE // ${target.name}`}
            {isSatellite && `ORBITE // ${target.code || target.name}`}
            {isNuclear && 'INFRA // NUCLÉAIRE STRATÉGIQUE'}
          </span>
        </div>

        <div className="tic-header-right">
          <span className="tic-zulu">{zuluTime}</span>
          <button
            type="button"
            className="tic-close-btn"
            onClick={handleClose}
            onMouseEnter={() => sound.hover()}
            title="Fermer la télémétrie"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="tic-title-section">
        <h4 className="tic-main-name">
          {target.name || target.airline || target.aircraft || 'Vecteur Identifié'}
        </h4>
        <p className="tic-sub-name">
          {isCCTV && `${target.city}, ${target.country} — ${target.category}`}
          {isFlight && `${target.airline} • ${target.aircraft} (${target.corridorType})`}
          {isVessel && `${target.flagEmoji || '⚓'} Pavillon : ${target.flag} • ${target.type}`}
          {isSatellite && `${target.country} • NORAD ${target.noradId}`}
          {isNuclear && `${target.region}, ${target.country} • ${target.securityLevel}`}
        </p>
      </div>

      {/* Media / Route Graphic Preview */}
      {isCCTV && (
        <div className="tic-media-preview" onClick={handleLiveAction} title="Cliquer pour lancer le direct">
          <img
            src={target.thumbnail || 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80'}
            alt={target.name}
            className="tic-img"
          />
          <div className="tic-scanlines" />
          <div className="tic-media-overlay">
            <span className="tic-live-pulse-badge">
              <span className="tic-dot" /> LIVE 30 FPS
            </span>
            <span className="tic-res-badge">{target.resolution || '1080p HD'}</span>
          </div>
          <div className="tic-hover-watch">
            <Maximize2 size={16} />
            <span>VISIONNER EN PLEIN ÉCRAN</span>
          </div>
        </div>
      )}

      {isFlight && target.origin && target.destination && (
        <div className="tic-corridor-preview">
          <div className="tic-corridor-endpoints">
            <div className="endpoint">
              <span className="iata">{target.origin.code}</span>
              <span className="city">{target.origin.city}</span>
            </div>
            <div className="corridor-mid">
              <div className="corridor-line">
                <Plane
                  size={12}
                  className="corridor-plane-icon"
                  style={{
                    left: `${Math.round((target.currentProgress || 0.5) * 100)}%`,
                    transform: `translate(-50%, -50%) rotate(${target.calculatedHeading || target.heading || 90}deg)`,
                  }}
                />
              </div>
              <span className="corridor-cat">{target.corridorType}</span>
            </div>
            <div className="endpoint dest">
              <span className="iata">{target.destination.code}</span>
              <span className="city">{target.destination.city}</span>
            </div>
          </div>
        </div>
      )}

      {isVessel && (
        <div className="tic-vessel-preview">
          <div className="tic-vessel-route">
            <span className="vessel-port from">{target.originPort}</span>
            <span className="vessel-arrow">➔</span>
            <span className="vessel-port to">{target.destinationPort}</span>
          </div>
          <div className="vessel-chokepoint-tag">
            Zone Clé : {target.chokepoint}
          </div>
        </div>
      )}

      {/* Telemetry Metric Grid */}
      <div className="tic-metric-grid">
        <div className="tic-metric-cell">
          <span className="tic-label">COORDONNÉES GPS</span>
          <span className="tic-val mono">
            {target.lat !== undefined ? target.lat.toFixed(4) : '--'}° N,{' '}
            {target.lng !== undefined ? target.lng.toFixed(4) : '--'}° E
          </span>
        </div>

        {isFlight && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">ALTITUDE BARO</span>
              <span className="tic-val cyan">
                {target.altitudeM ? target.altitudeM.toLocaleString('fr-FR') : '--'} m (FL
                {Math.round((target.altitudeFt || 0) / 100)})
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">VITESSE SOL</span>
              <span className="tic-val">
                {target.speedKmh} km/h ({target.speedKts} kts)
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">CAP & TRANSPONDEUR</span>
              <span className="tic-val mono">
                {target.calculatedHeading || target.heading}° • SQK {target.squawk}
              </span>
            </div>
          </>
        )}

        {isVessel && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">VITESSE SURFACE</span>
              <span className="tic-val cyan">{target.speedKts} Nœuds</span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">IDENTIFIANTS IMO / MMSI</span>
              <span className="tic-val mono">IMO {target.imo} • MMSI {target.mmsi}</span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">CARGAISON DÉCLARÉE</span>
              <span className="tic-val text-dim">{target.cargo}</span>
            </div>
          </>
        )}

        {isCCTV && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">RÉSOLUTION / FRÉQUENCE</span>
              <span className="tic-val cyan">{target.resolution} ({target.fps} FPS)</span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">STATUT DU CAPTEUR</span>
              <span className="tic-val green">● ACTIF & VÉRIFIÉ</span>
            </div>
            {target.description && (
              <div className="tic-metric-cell full-width">
                <span className="tic-label">MISSION DE SURVEILLANCE</span>
                <span className="tic-val text-dim">{target.description}</span>
              </div>
            )}
          </>
        )}

        {isSatellite && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">ALTITUDE ORBITALE</span>
              <span className="tic-val cyan">{target.altitudeKm} km</span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">VITESSE TÉLÉMÉTRIQUE</span>
              <span className="tic-val">{target.speedKmh?.toLocaleString('fr-FR')} km/h</span>
            </div>
          </>
        )}

        {isNuclear && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">CAPACITÉ INSTALLÉE</span>
              <span className="tic-val cyan" style={{ color: '#eab308' }}>
                {target.capacityMwe ? target.capacityMwe.toLocaleString('fr-FR') : '--'} MWe
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">TECHNOLOGIE RÉACTEUR</span>
              <span className="tic-val">{target.type}</span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">EXPLOITANT / OPÉRATEUR</span>
              <span className="tic-val text-dim">{target.operator}</span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">SURVEILLANCE & STATUT</span>
              <span className="tic-val" style={{ color: target.status?.includes('GUERRE') ? '#ff3366' : '#eab308' }}>
                {target.status}
              </span>
            </div>
            {target.description && (
              <div className="tic-metric-cell full-width">
                <span className="tic-label">NOTE STRATÉGIQUE</span>
                <span className="tic-val text-dim">{target.description}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="tic-footer-actions">
        {isCCTV && (
          <button
            type="button"
            className="tic-action-btn primary"
            onClick={handleLiveAction}
            onMouseEnter={() => sound.hover()}
          >
            <Video size={13} />
            <span>VISIONNER EN DIRECT</span>
          </button>
        )}

        <button
          type="button"
          className="tic-action-btn secondary"
          onClick={handleCenter}
          onMouseEnter={() => sound.hover()}
          title="Recentrer la vue sur ce point géographique"
        >
          <LocateFixed size={13} />
          <span>CENTRER CARTE</span>
        </button>
      </div>
    </div>
  );
}
