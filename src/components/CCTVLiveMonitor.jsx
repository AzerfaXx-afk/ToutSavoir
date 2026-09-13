import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Camera,
  Compass,
  Eye,
  Flame,
  Moon,
  Tv,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import { sound } from '../utils/soundFX';
import { CCTV_FEEDS } from '../data/osirisStreams';
import './CCTVLiveMonitor.css';

export function CCTVLiveMonitor({
  camera,
  onClose,
  onSelectCamera,
  onSelectLocation,
}) {
  const [timecode, setTimecode] = useState('');
  const [msTime, setMsTime] = useState('000');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Vision Mode: 'optical' (Direct Optique HD), 'thermal' (FLIR), 'night' (NVG), 'stream' (YouTube/Web)
  const [visionMode, setVisionMode] = useState('optical');

  // PTZ Controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Snapshot flash state
  const [snapshotAlert, setSnapshotAlert] = useState(false);

  // Live UTC / Zulu timecode with milliseconds
  useEffect(() => {
    let animId;
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
      setTimecode(`${h}:${m}:${s}`);
      setMsTime(ms);
      animId = requestAnimationFrame(updateTime);
    };
    animId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!camera) return null;

  const currentIndex = CCTV_FEEDS.findIndex((c) => c.id === camera.id);

  const handlePrev = () => {
    sound.tick();
    const prevIndex = (currentIndex - 1 + CCTV_FEEDS.length) % CCTV_FEEDS.length;
    if (onSelectCamera) onSelectCamera(CCTV_FEEDS[prevIndex]);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleNext = () => {
    sound.tick();
    const nextIndex = (currentIndex + 1) % CCTV_FEEDS.length;
    if (onSelectCamera) onSelectCamera(CCTV_FEEDS[nextIndex]);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleClose = () => {
    sound.tick();
    if (onClose) onClose();
  };

  const handleReload = () => {
    sound.click(0.4);
    setIsRefreshing(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCenterOnMap = () => {
    sound.click(0.4);
    if (onSelectLocation && camera.lat !== undefined && camera.lng !== undefined) {
      onSelectLocation(camera.lat, camera.lng, 6.5);
    }
  };

  // Capture photo instantanée
  const handleSnapshot = () => {
    sound.click(0.6);
    setSnapshotAlert(true);
    setTimeout(() => setSnapshotAlert(false), 2200);
  };

  // PTZ Zoom
  const handleZoom = (delta) => {
    sound.click(0.2);
    setZoomLevel((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 4);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  // PTZ Pan
  const handlePan = (dx, dy) => {
    if (zoomLevel <= 1) return;
    sound.tick();
    setPanOffset((prev) => ({
      x: Math.min(Math.max(prev.x + dx * 20, -100), 100),
      y: Math.min(Math.max(prev.y + dy * 20, -100), 100),
    }));
  };

  const handleResetPTZ = () => {
    sound.tick();
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div
      className={`cctv-monitor-pip ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: '8vh',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '860px',
              maxWidth: '96vw',
              zIndex: 9999,
            }
          : {}
      }
    >
      {/* ─── Barre de Contrôle Supérieure ─── */}
      <div className="cctv-monitor-header">
        <div className="cctv-live-tag">
          <span className="cctv-rec-dot" />
          <span>FLUX EN DIRECT // CAM {currentIndex + 1}/{CCTV_FEEDS.length}</span>
        </div>

        <div className="cctv-header-actions">
          <button
            type="button"
            className="cctv-icon-btn is-locate"
            onClick={handleCenterOnMap}
            title="Centrer la carte sur cette caméra"
          >
            <Compass size={13} />
            <span className="cctv-btn-text">CARTE</span>
          </button>

          <button
            type="button"
            className={`cctv-icon-btn ${isRefreshing ? 'is-spinning' : ''}`}
            onClick={handleReload}
            title="Rafraîchir le capteur vidéo"
          >
            <RefreshCw size={12} />
          </button>

          <button
            type="button"
            className="cctv-icon-btn"
            onClick={handleSnapshot}
            title="Capturer un cliché de reconnaissance"
          >
            <Camera size={13} />
          </button>

          <button
            type="button"
            className="cctv-icon-btn"
            onClick={handlePrev}
            title="Caméra précédente"
          >
            <ChevronLeft size={14} />
          </button>

          <button
            type="button"
            className="cctv-icon-btn"
            onClick={handleNext}
            title="Caméra suivante"
          >
            <ChevronRight size={14} />
          </button>

          <button
            type="button"
            className="cctv-icon-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Réduire' : 'Agrandir plein écran'}
          >
            <Maximize2 size={13} />
          </button>

          <button
            type="button"
            className="cctv-icon-btn is-close"
            onClick={handleClose}
            title="Fermer la surveillance"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ─── Barre de Modes de Vision Tactique (Awwwards Style) ─── */}
      <div className="cctv-vision-bar">
        <button
          type="button"
          className={`cctv-vision-btn ${visionMode === 'optical' ? 'is-active is-optical' : ''}`}
          onClick={() => {
            sound.click(0.3);
            setVisionMode('optical');
          }}
          title="Direct optique haute définition 1080p garanti"
        >
          <Eye size={11} />
          <span>DIRECT OPTIQUE</span>
        </button>

        <button
          type="button"
          className={`cctv-vision-btn ${visionMode === 'night' ? 'is-active is-night' : ''}`}
          onClick={() => {
            sound.click(0.3);
            setVisionMode('night');
          }}
          title="Vision nocturne tactique (phosphore vert NVG)"
        >
          <Moon size={11} />
          <span>NOCTURNE NVG</span>
        </button>

        <button
          type="button"
          className={`cctv-vision-btn ${visionMode === 'thermal' ? 'is-active is-thermal' : ''}`}
          onClick={() => {
            sound.click(0.3);
            setVisionMode('thermal');
          }}
          title="Spectre thermique infrarouge (FLIR)"
        >
          <Flame size={11} />
          <span>THERMIQUE FLIR</span>
        </button>

        {camera.embedUrl && (
          <button
            type="button"
            className={`cctv-vision-btn ${visionMode === 'stream' ? 'is-active is-stream' : ''}`}
            onClick={() => {
              sound.click(0.3);
              setVisionMode('stream');
            }}
            title="Canal vidéo web externe (YouTube)"
          >
            <Tv size={11} />
            <span>CANAL WEB</span>
          </button>
        )}
      </div>

      {/* ─── Écran Vidéo de Surveillance (Scanlines, Shaders & PTZ) ─── */}
      <div
        className={`cctv-video-viewport mode-${visionMode}`}
        style={{ height: isFullscreen ? '430px' : '220px' }}
      >
        {/* Flash de capture snapshot */}
        {snapshotAlert && (
          <div className="cctv-snapshot-flash">
            <span className="cctv-snapshot-text">CLICHÉ SATELLITE ENREGISTRÉ</span>
          </div>
        )}

        {/* Media Container avec Zoom & Pan PTZ */}
        <div
          className="cctv-media-layer"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {visionMode === 'stream' && camera.embedUrl ? (
            <iframe
              key={`${camera.id}-${reloadKey}`}
              className="cctv-iframe"
              src={camera.embedUrl}
              title={camera.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="cctv-optical-stream-wrap">
              <img
                src={camera.thumbnail}
                alt={camera.name}
                className="cctv-optical-media"
                loading="eager"
              />
              {/* Shimmer atmosphérique simulé en direct */}
              <div className="cctv-ambient-shimmer" />
            </div>
          )}
        </div>

        {/* Grille Tactique & Réticule Central */}
        <div className="cctv-hud-overlay" />
        <div className="cctv-hud-corners" />
        <div className="cctv-crosshair-center" />

        {/* Horodatage Zulu Millisecondes */}
        <div className="cctv-timecode">
          <span className="time-main">{timecode}</span>
          <span className="time-ms">.{msTime}</span>
          <span className="time-zulu"> ZULU</span>
        </div>

        {/* Télémétrie Capteur Gauche / Droite */}
        <div className="cctv-coords-badge">
          {camera.lat.toFixed(4)}° N, {camera.lng.toFixed(4)}° E
        </div>

        <div className="cctv-stream-stats-badge">
          <span>{camera.fps || 30}.0 FPS</span>
          <span className="stat-sep">•</span>
          <span>5.2 Mbps</span>
          <span className="stat-sep">•</span>
          <span className="stat-codec">H.265</span>
        </div>

        {/* Boussole d'Azimut & Inclinaison */}
        <div className="cctv-telemetry-angles">
          <span>AZ: {Math.abs(Math.round(camera.lat * 5.3) % 360)}°</span>
          <span>EL: -07.4°</span>
          {zoomLevel > 1 && <span className="cctv-zoom-indicator">ZOOM {zoomLevel}X</span>}
        </div>

        {/* Overlay Thermique Température si mode FLIR */}
        {visionMode === 'thermal' && (
          <div className="cctv-flir-hud">
            <span className="flir-target-box" />
            <span className="flir-temp-tag">T_CIBLE: +36.8°C [HUMAIN / VÉHICULE]</span>
          </div>
        )}
      </div>

      {/* ─── Barre de Contrôle PTZ (Zoom & Panoramique) ─── */}
      <div className="cctv-ptz-bar">
        <div className="ptz-zoom-group">
          <span className="ptz-label">ZOOM :</span>
          {[1, 1.5, 2, 4].map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`ptz-btn ${zoomLevel === lvl ? 'is-active' : ''}`}
              onClick={() => {
                sound.click(0.25);
                setZoomLevel(lvl);
                if (lvl === 1) setPanOffset({ x: 0, y: 0 });
              }}
            >
              {lvl}X
            </button>
          ))}
        </div>

        {zoomLevel > 1 && (
          <div className="ptz-pan-group">
            <span className="ptz-label">PAN :</span>
            <button type="button" className="ptz-arrow-btn" onClick={() => handlePan(-1, 0)} title="Gauche">◄</button>
            <button type="button" className="ptz-arrow-btn" onClick={() => handlePan(0, -1)} title="Haut">▲</button>
            <button type="button" className="ptz-arrow-btn" onClick={() => handlePan(0, 1)} title="Bas">▼</button>
            <button type="button" className="ptz-arrow-btn" onClick={() => handlePan(1, 0)} title="Droite">►</button>
            <button type="button" className="ptz-arrow-btn is-rst" onClick={handleResetPTZ} title="Réinitialiser">RST</button>
          </div>
        )}

        <button
          type="button"
          className="ptz-locate-shortcut"
          onClick={handleCenterOnMap}
        >
          <Navigation size={10} />
          <span>Localiser sur la carte</span>
        </button>
      </div>

      {/* ─── Fiche Métadonnées & Télémétrie Basse ─── */}
      <div className="cctv-info-bar">
        <div className="cctv-name-row">
          <span className="cctv-title" title={camera.name}>
            {camera.name}
          </span>
          <span className="cctv-category-badge">{camera.category}</span>
        </div>

        <span className="cctv-location">
          {camera.city}, {camera.country} — {camera.resolution} ({camera.fps} FPS)
        </span>

        <div className="cctv-meta-row">
          <span>{camera.description}</span>
        </div>
      </div>
    </div>
  );
}
