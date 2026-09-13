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
  CloudLightning,
  ShieldAlert,
  Activity,
  Wifi,
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
  const isWeather = target.type === 'weather' || target.windSpeedKmh !== undefined || target.pressureHpa !== undefined;
  const isCyber = target.type === 'cyber' || target.threatActor || target.cve || target.targetSector || target.fromCity;
  const isConflict = target.type === 'conflict' || target.alert || target.activeMissiles !== undefined;
  const isEarthquake = target.type === 'earthquake' || target.mag !== undefined;
  const isCable = target.type === 'cable' || target.capacityTbps !== undefined;

  const handleClose = () => {
    sound.tick();
    if (onClose) onClose();
  };

  const handleCenter = () => {
    sound.click();
    const lat = target.lat ?? target.to?.[0] ?? target.from?.[0] ?? target.origin?.coords?.[0];
    const lng = target.lng ?? target.to?.[1] ?? target.from?.[1] ?? target.origin?.coords?.[1];
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
          {isWeather && <CloudLightning size={13} className="tic-icon weather" style={{ color: '#06b6d4' }} />}
          {isCyber && <ShieldAlert size={13} className="tic-icon cyber" style={{ color: target.color || '#ec4899' }} />}
          {isConflict && <ShieldAlert size={13} className="tic-icon conflict" style={{ color: '#ff2a4d' }} />}
          {isEarthquake && <Activity size={13} className="tic-icon eq" style={{ color: '#ffb703' }} />}
          {isCable && <Wifi size={13} className="tic-icon cable" style={{ color: '#a855f7' }} />}
          <span className="tic-type-label">
            {isCCTV && (target.code || 'CAM // DIRECT OPTIQUE')}
            {isFlight && `VOL // ${target.callsign || target.flightNum}`}
            {isVessel && `NAVIRE // ${target.name}`}
            {isSatellite && `ORBITE 3D // ${target.code || target.name}`}
            {isNuclear && 'INFRA // NUCLÉAIRE STRATÉGIQUE'}
            {isWeather && `CLIMAT // ${target.type?.toUpperCase() || 'SYSTÈME MÉTÉO'}`}
            {isCyber && `CYBER // ${target.category ? `${target.category} • ` : ''}${target.threatActor || 'MENACE ACTIVE'}`}
            {isConflict && `CONFLIT // ${target.defcon || 'ZONE CHAUDE'}`}
            {isEarthquake && `SÉISME // MAGNITUDE ${target.mag || '3.0+'}`}
            {isCable && `CÂBLE // OPTIQUE ${target.capacityTbps || ''} TBPS`}
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
          {target.name || target.airline || target.aircraft || target.threatActor || 'Vecteur Identifié'}
        </h4>
        <p className="tic-sub-name">
          {isCCTV && `${target.city}, ${target.country} — ${target.category}`}
          {isFlight && `${target.airline} • ${target.aircraft}${target.corridorType || target.flightPhase ? ` (${target.corridorType || target.flightPhase})` : ''}`}
          {isVessel && `${target.flagEmoji || '⚓'} Pavillon : ${target.flag || 'Inconnu'} • ${target.type || 'Cargo / Fret'}`}
          {isSatellite && `${target.country} • NORAD ${target.noradId} • ${target.orbitType || 'LEO'}`}
          {isNuclear && `${target.region}, ${target.country} • ${target.securityLevel}`}
          {isWeather && `${target.category} • Bassin : ${target.basin || 'Océanique'}`}
          {isCyber && `${target.fromCity} ➔ ${target.toCity} • Cible : ${target.targetSector}`}
          {isConflict && `${target.status} • Alerte : ${target.alert || 'Active'}`}
          {isEarthquake && `${target.place} • Profondeur : ${target.depth || 10} km`}
          {isCable && `Capacité : ${target.capacityTbps} Tbps • Longueur : ${target.lengthKm?.toLocaleString('fr-FR')} km`}
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
              <span className="corridor-cat">{target.corridorType || target.flightPhase || 'Vol Commercial'}</span>
            </div>
            <div className="endpoint dest">
              <span className="iata">{target.destination.code}</span>
              <span className="city">{target.destination.city}</span>
            </div>
          </div>
        </div>
      )}

      {isVessel && (target.destination || target.destinationPort || target.originPort) && (
        <div className="tic-vessel-preview">
          <div className="tic-vessel-route">
            {target.originPort && (
              <>
                <span className="vessel-port from">{target.originPort}</span>
                <span className="vessel-arrow">➔</span>
              </>
            )}
            {!target.originPort && (target.destination || target.destinationPort) && (
              <>
                <span className="vessel-port from" style={{ color: '#94a3b8' }}>DESTINATION</span>
                <span className="vessel-arrow">➔</span>
              </>
            )}
            <span className="vessel-port to">{target.destination || target.destinationPort}</span>
          </div>
          {target.chokepoint && (
            <div className="vessel-chokepoint-tag">
              Zone Clé : {target.chokepoint}
            </div>
          )}
        </div>
      )}

      {isCyber && target.fromCity && target.toCity && (
        <div className="tic-vessel-preview" style={{ background: 'rgba(236, 72, 153, 0.08)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
          <div className="tic-vessel-route">
            <span className="vessel-port from" style={{ color: '#f43f5e' }}>{target.fromCity} ({target.fromCountry})</span>
            <span className="vessel-arrow" style={{ color: target.color || '#ec4899' }}>⚡➔</span>
            <span className="vessel-port to" style={{ color: '#38bdf8' }}>{target.toCity} ({target.toCountry})</span>
          </div>
          <div className="vessel-chokepoint-tag" style={{ color: target.color || '#ec4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
            Vecteur : {target.type} • {target.proto || 'TCP'} {target.port ? `:${target.port}` : ''}
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
              <span className="tic-label">VITESSE SOL & RÉGIME</span>
              <span className="tic-val">
                {target.speedKmh} km/h (Mach {target.mach || (target.speedKmh ? (target.speedKmh / 1062).toFixed(2) : '0.78')})
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">CAP & PHASE DE VOL</span>
              <span className="tic-val mono">
                {target.calculatedHeading || target.heading}° • {target.flightPhase || 'En Route'}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">TRANSPONDEUR & ICAO</span>
              <span className="tic-val mono">
                SQK {target.squawk || '7000'} • HEX {target.icao || target.hex || target.id?.slice(0, 6)?.toUpperCase() || 'ADSB'}
              </span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">SOURCE TÉLÉMÉTRIE & RADAR</span>
              <span className="tic-val mono" style={{ color: '#ffd700' }}>
                FLIGHTRADAR24 LIVE FEED // ADS-B TERRESTRE & SATELLITAIRE
              </span>
            </div>
          </>
        )}

        {isVessel && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">VITESSE SURFACE (SOG)</span>
              <span className="tic-val cyan">
                {target.speedKts} Nœuds ({target.speedKmh || Math.round((target.speedKts || 0) * 1.852)} km/h)
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">CAP & STATUT NAVIGATIONNEL</span>
              <span className="tic-val mono">
                {target.course !== undefined ? `${target.course}°` : '0°'} • {target.status || 'En route au moteur'}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">DIMENSIONS & TIRANT D'EAU</span>
              <span className="tic-val mono">
                {target.lengthM || '--'}m × {target.beamM || '--'}m • Draught {target.draughtM || '--'}m
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">IDENTIFIANTS IMO / MMSI / CALL</span>
              <span className="tic-val mono">
                IMO {target.imo || '--'} • MMSI {target.mmsi || '--'}{target.callsign ? ` • ${target.callsign}` : ''}
              </span>
            </div>
            {(target.destination || target.destinationPort) && (
              <div className="tic-metric-cell full-width">
                <span className="tic-label">DESTINATION AIS</span>
                <span className="tic-val cyan">
                  {target.destination || target.destinationPort}
                </span>
              </div>
            )}
            {target.cargo && (
              <div className="tic-metric-cell full-width">
                <span className="tic-label">CARGAISON & TONNAGE PORT EN LOURD</span>
                <span className="tic-val text-dim">
                  {target.cargo} {target.dwt ? `(${Number(target.dwt).toLocaleString('fr-FR')} DWT)` : ''}
                </span>
              </div>
            )}
            <div className="tic-metric-cell full-width">
              <span className="tic-label">SOURCE TÉLÉMÉTRIE AIS</span>
              <span className="tic-val mono" style={{ color: target.isLiveAis ? '#00f5a0' : '#06b6d4' }}>
                {target.isLiveAis ? 'DIGITRAFFIC AIS DIRECT LIVE // STATIONS CÔTIÈRES EUROPE' : 'AIS SNAPSHOT FLOTTE MONDIALE // RÉSEAU SATELLITAIRE VDL'}
              </span>
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
              <span className="tic-label">ALTITUDE & RÉGIME</span>
              <span className="tic-val cyan">
                {target.altitudeKm?.toLocaleString('fr-FR')} km ({target.orbitType || 'LEO'})
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">VITESSE ORBITALE</span>
              <span className="tic-val">
                {target.speedKmh?.toLocaleString('fr-FR')} km/h (Mach {(target.speedKmh / 1234.8).toFixed(1)})
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">PÉRIODE DE RÉVOLUTION</span>
              <span className="tic-val mono">{target.periodMin} min ({((target.periodMin || 90) / 60).toFixed(1)} h)</span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">INCLINAISON & RAAN</span>
              <span className="tic-val mono">{target.inclination}° • {target.raan !== undefined ? `${target.raan}°` : 'Équatorial'}</span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">STATUT OPÉRATIONNEL</span>
              <span className="tic-val green" style={{ color: '#10b981' }}>● {target.status || 'ACTIF'}</span>
            </div>
            {target.description && (
              <div className="tic-metric-cell full-width">
                <span className="tic-label">MISSION & CAPTEURS EMBARQUÉS</span>
                <span className="tic-val text-dim">{target.description}</span>
              </div>
            )}
          </>
        )}

        {isWeather && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">VENTS MAX SOUTENUS</span>
              <span className="tic-val cyan" style={{ color: '#06b6d4' }}>
                {target.windSpeedKmh} km/h ({Math.round(target.windSpeedKmh / 1.852)} kts)
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">PRESSION BAROMÉTRIQUE</span>
              <span className="tic-val" style={{ color: '#f43f5e' }}>{target.pressureHpa} hPa (Dépression)</span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">RAFALES ESTIMÉES</span>
              <span className="tic-val mono">
                {target.windGustsKmh || Math.round(target.windSpeedKmh * 1.25)} km/h
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">VECTEUR DE DÉPLACEMENT</span>
              <span className="tic-val mono">{target.heading}</span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">SOURCE MÉTÉOROLOGIQUE OFFICIELLE</span>
              <span className="tic-val mono" style={{ color: '#38bdf8' }}>{target.source || 'NOAA NHC / WMO / Météo-France'}</span>
            </div>
            {target.description && (
              <div className="tic-metric-cell full-width">
                <span className="tic-label">BULLETIN D'ALERTE CYCLONIQUE</span>
                <span className="tic-val text-dim">{target.description}</span>
              </div>
            )}
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

        {isCyber && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">ACTEUR / GROUPE DE MENACE</span>
              <span className="tic-val" style={{ color: target.color || '#8b5cf6' }}>
                {target.threatActor || 'Acteur non attribué'}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">CATÉGORIE KASPERSKY</span>
              <span className="tic-val mono cyan" style={{ color: target.color || '#ec4899' }}>
                {target.category || 'IDS'} • {target.type}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">INFRASTRUCTURE CIBLE</span>
              <span className="tic-val" style={{ color: '#f43f5e' }}>
                {target.targetSector || 'Cible institutionnelle'}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">PORT & PROTOCOLE</span>
              <span className="tic-val mono">
                {target.port ? `Port ${target.port}` : 'Multi-ports'} ({target.proto || 'TCP'})
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">FAILLE / CVE EXPLOITÉE</span>
              <span className="tic-val purple mono" style={{ color: '#a855f7' }}>
                {target.cve || 'Zero-Day Non Déclarée'}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">TACTIQUE MITRE ATT&CK</span>
              <span className="tic-val mono">
                {target.mitreId ? `${target.mitreId} — ` : ''}{target.mitreTactic || 'Accès Initial'}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">VOLUME / IMPACT DÉTECTÉ</span>
              <span className="tic-val cyan">
                {target.volume || 'Flux en temps réel'}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">SÉVÉRITÉ & NIVEAU D’ALERTE</span>
              <span className="tic-val" style={{ color: target.severity === 'CRITICAL' ? '#ef4444' : '#f97316' }}>
                ● {target.severity === 'CRITICAL' ? 'CRITIQUE [DEFCON 1]' : 'ÉLEVÉ [DEFCON 2]'}
              </span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">STATUT OPÉRATIONNEL & MITIGATION</span>
              <span className="tic-val mono" style={{ color: '#38bdf8' }}>
                {target.status || 'TRANSMISSION EN COURS'}
              </span>
            </div>
            {target.description && (
              <div className="tic-metric-cell full-width">
                <span className="tic-label">ANALYSE FORENSIC ET RENSEIGNEMENT</span>
                <span className="tic-val text-dim">{target.description}</span>
              </div>
            )}
          </>
        )}

        {isConflict && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">NIVEAU D'ALERTE DÉFENSE</span>
              <span className="tic-val" style={{ color: '#ff2a4d' }}>
                ● {target.defcon || 'DÉFENSE ACTIVE'}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">MISSILES BALISTIQUES ACTIFS</span>
              <span className="tic-val cyan mono" style={{ color: '#ff3366' }}>
                {target.activeMissiles ?? 'En alerte'}
              </span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">STATUT GÉOPOLITIQUE ET FORCES</span>
              <span className="tic-val text-dim">{target.status} — {target.alert || 'Surveillance renforcée'}</span>
            </div>
            {target.details && (
              <div className="tic-metric-cell full-width">
                <span className="tic-label">RENSEIGNEMENT MILITAIRE</span>
                <span className="tic-val text-dim">{target.details}</span>
              </div>
            )}
          </>
        )}

        {isEarthquake && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">MAGNITUDE RICHTER</span>
              <span className="tic-val" style={{ color: target.mag >= 5.0 ? '#ff2a4d' : '#ffb703' }}>
                M {target.mag}
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">PROFONDEUR DU FOYER</span>
              <span className="tic-val mono cyan">{target.depth || 10} km</span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">LOCALISATION & HORODATAGE</span>
              <span className="tic-val mono text-dim">{target.place} • {target.time || 'En direct'}</span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">SOURCE SISMOLOGIQUE OFFICIELLE</span>
              <span className="tic-val mono" style={{ color: '#00f5a0' }}>USGS Earthquake Hazards Program // Global Seismographic Network</span>
            </div>
          </>
        )}

        {isCable && (
          <>
            <div className="tic-metric-cell">
              <span className="tic-label">CAPACITÉ BANDE PASSANTE</span>
              <span className="tic-val cyan" style={{ color: '#a855f7' }}>
                {target.capacityTbps} Tbps
              </span>
            </div>
            <div className="tic-metric-cell">
              <span className="tic-label">LONGUEUR IMMERGÉE</span>
              <span className="tic-val mono">{target.lengthKm?.toLocaleString('fr-FR')} km</span>
            </div>
            <div className="tic-metric-cell full-width">
              <span className="tic-label">CONSORTIUM EXPLOITANT</span>
              <span className="tic-val text-dim">{target.owners}</span>
            </div>
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

        {isFlight && (target.flightNum || target.callsign) && (
          <a
            href={`https://www.flightradar24.com/${(target.flightNum || target.callsign || '').replace(/\s+/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tic-action-btn primary"
            style={{ textDecoration: 'none', background: 'rgba(255, 215, 0, 0.15)', borderColor: 'rgba(255, 215, 0, 0.4)', color: '#ffd700' }}
            onMouseEnter={() => sound.hover()}
          >
            <ExternalLink size={13} />
            <span>FLIGHTRADAR24 DIRECT</span>
          </a>
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
