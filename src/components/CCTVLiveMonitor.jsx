import React, { useState, useEffect, useRef, useMemo } from 'react';
import Hls from 'hls.js';
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
  ExternalLink,
} from 'lucide-react';
import { sound } from '../utils/soundFX';
import { CCTV_FEEDS, LIVE_NEWS_CHANNELS } from '../data/osirisStreams';
import { WORLD_TV_CHANNELS } from '../data/worldTvChannels';
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

  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Vision Mode: 'optical' (Direct Optique HD), 'thermal' (FLIR), 'night' (NVG), 'snapshot' (Photo HD)
  const [visionMode, setVisionMode] = useState('optical');

  // Automatically reset vision mode and PTZ when camera changes
  useEffect(() => {
    setVisionMode('optical');
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [camera?.id]);

  // Live Snapshot Auto-Refresh (every 2-3 seconds for traffic and city DOT cams)
  const [snapshotTimestamp, setSnapshotTimestamp] = useState(Date.now());
  useEffect(() => {
    if (!camera?.isLiveSnapshot) return;
    const interval = setInterval(() => {
      setSnapshotTimestamp(Date.now());
    }, camera.refreshInterval || 2500);
    return () => clearInterval(interval);
  }, [camera?.id, camera?.isLiveSnapshot, camera?.refreshInterval]);

  const currentMediaUrl = useMemo(() => {
    if (!camera) return '';
    if (camera.isLiveSnapshot && camera.feedUrl) {
      return `${camera.feedUrl}?_t=${snapshotTimestamp}`;
    }
    return camera.thumbnail || camera.feedUrl || '';
  }, [camera, snapshotTimestamp]);

  const isHls = Boolean(
    camera?.type === 'hls' ||
    camera?.stream_type === 'hls' ||
    camera?.stream_url?.includes('.m3u8') ||
    camera?.feedUrl?.includes('.m3u8')
  );
  const isMp4 = Boolean(
    camera?.type === 'mp4' ||
    camera?.stream_type === 'mp4' ||
    camera?.stream_url?.endsWith('.mp4') ||
    camera?.feedUrl?.endsWith('.mp4')
  );
  const isMjpeg = Boolean(
    camera?.type === 'mjpeg' ||
    camera?.stream_type === 'mjpeg'
  );
  const isIframe = Boolean(
    camera?.embedUrl ||
    camera?.type === 'yt' ||
    camera?.stream_type === 'iframe' ||
    (camera?.stream_url && (camera.stream_url.includes('youtube') || camera.stream_url.includes('embed') || camera.stream_url.includes('ipcamlive')))
  );
  const iframeSrc = camera?.embedUrl || camera?.stream_url;
  const streamVideoUrl = camera?.stream_url || camera?.feedUrl;

  // HLS Engine Integration (Osiris / Broadcast Standards)
  useEffect(() => {
    if (!isHls || !streamVideoUrl || !videoRef.current) return;
    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(streamVideoUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamVideoUrl;
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [camera?.id, streamVideoUrl, isHls, reloadKey]);

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

  const allStreams = useMemo(() => {
    if (camera?.countryCode) return WORLD_TV_CHANNELS;
    const isNews = camera?.category?.includes('Info');
    return isNews ? (LIVE_NEWS_CHANNELS || []) : CCTV_FEEDS;
  }, [camera?.category, camera?.countryCode]);

  if (!camera) return null;

  const currentIndex = allStreams.findIndex((c) => c.id === camera.id);

  const handlePrev = () => {
    sound.tick();
    const len = allStreams.length || 1;
    const prevIndex = (currentIndex - 1 + len) % len;
    if (onSelectCamera) onSelectCamera(allStreams[prevIndex]);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleNext = () => {
    sound.tick();
    const len = allStreams.length || 1;
    const nextIndex = (currentIndex + 1) % len;
    if (onSelectCamera) onSelectCamera(allStreams[nextIndex]);
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
          <span>
            {camera?.category?.includes('Info')
              ? `INFO 24/7 EN DIRECT // CANAL ${currentIndex + 1}/${allStreams.length}`
              : `FLUX EN DIRECT // CAM ${currentIndex >= 0 ? currentIndex + 1 : 1}/${CCTV_FEEDS.length}`}
          </span>
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
          title="Direct optique haute définition temps réel"
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
          title="Vision nocturne tactique (phosphore vert NVG Gen 3)"
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

        <button
          type="button"
          className={`cctv-vision-btn ${visionMode === 'snapshot' ? 'is-active is-snapshot' : ''}`}
          onClick={() => {
            sound.click(0.3);
            setVisionMode('snapshot');
          }}
          title="Capture photo haute résolution instantanée"
        >
          <Camera size={11} />
          <span>PHOTO HD</span>
        </button>
      </div>

      {/* ─── Écran Vidéo de Surveillance (Scanlines, Shaders & PTZ) ─── */}
      <div
        className={`cctv-video-viewport mode-${visionMode}`}
        style={{ height: isFullscreen ? '480px' : '230px' }}
      >
        {/* Flash de capture snapshot */}
        {snapshotAlert && (
          <div className="cctv-snapshot-flash">
            <span className="cctv-snapshot-text">CLICHÉ ENREGISTRÉ</span>
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
          {isHls ? (
            <div className="cctv-stream-container">
              <video
                ref={videoRef}
                key={`hls-${camera.id}-${reloadKey}`}
                className="cctv-video-element"
                autoPlay
                muted
                playsInline
                loop
              />
            </div>
          ) : isMp4 ? (
            <div className="cctv-stream-container">
              <video
                key={`mp4-${camera.id}-${reloadKey}`}
                src={streamVideoUrl}
                className="cctv-video-element"
                autoPlay
                muted
                playsInline
                loop
              />
            </div>
          ) : isIframe ? (
            <div className="cctv-stream-container">
              <iframe
                key={`iframe-${camera.id}-${reloadKey}`}
                className="cctv-iframe"
                src={iframeSrc}
                title={camera.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="eager"
              />
            </div>
          ) : isMjpeg ? (
            <div className="cctv-stream-container">
              <img
                key={`mjpeg-${camera.id}-${reloadKey}`}
                src={streamVideoUrl}
                alt={camera.name}
                className="cctv-optical-media"
              />
            </div>
          ) : camera.isLiveSnapshot ? (
            <div className="cctv-live-dot-wrap">
              <img
                key={`dot-${camera.id}-${snapshotTimestamp}`}
                src={currentMediaUrl}
                alt={camera.name}
                className="cctv-optical-media"
                loading="eager"
              />
              <div className="cctv-dot-live-indicator">
                <span className="dot-pulse" />
                <span>DIRECT CAPTEUR DOT // AUTO-RAFRAÎCHISSEMENT 2S</span>
              </div>
            </div>
          ) : (
            <div className="cctv-optical-stream-wrap">
              <img
                src={currentMediaUrl}
                alt={camera.name}
                className="cctv-optical-media"
                loading="eager"
              />
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
          {camera.category?.includes('Espace')
            ? 'ORBITE LEO // 418 KM ALT'
            : `${Math.abs(camera.lat).toFixed(4)}° ${camera.lat >= 0 ? 'N' : 'S'}, ${Math.abs(camera.lng).toFixed(4)}° ${camera.lng >= 0 ? 'E' : 'O'}`}
        </div>

        <div className="cctv-stream-stats-badge">
          <span>{camera.fps || 30}.0 FPS</span>
          <span className="stat-sep">•</span>
          <span>{camera.resolution || '1080p HD'}</span>
          <span className="stat-sep">•</span>
          <span className="stat-codec">{camera.category?.includes('Espace') ? 'NASA H.265' : 'H.265 HD'}</span>
        </div>

        {/* Boussole d'Azimut & Inclinaison */}
        <div className="cctv-telemetry-angles">
          <span>AZ: {Math.abs(Math.round((camera.lat || 0) * 5.3) % 360)}°</span>
          <span>EL: -07.4°</span>
          {zoomLevel > 1 && <span className="cctv-zoom-indicator">ZOOM {zoomLevel}X</span>}
        </div>

        {/* Live Snapshot Auto-Refresh Badge */}
        {camera.isLiveSnapshot && (
          <div className="cctv-live-refresh-pill">
            <span className="cctv-refresh-dot" />
            <span>AUTO-REFRESH 5S</span>
          </div>
        )}

        {/* Telemetry Spatiale si présente */}
        {camera.telemetry && (
          <div className="cctv-space-telemetry-badge">
            <span>ALT: {camera.telemetry.alt}</span>
            <span className="stat-sep">•</span>
            <span>VIT: {camera.telemetry.speed}</span>
          </div>
        )}

        {/* Overlay Thermique Température si mode FLIR */}
        {visionMode === 'thermal' && (
          <>
            <div className="cctv-flir-hud">
              <span className="flir-target-box" />
              <span className="flir-temp-tag">T_CIBLE: +36.8°C [SIGNATURE FLIR]</span>
            </div>
            <div className="cctv-thermal-scale-bar">
              <span className="thermal-scale-max">+42°C</span>
              <div className="thermal-scale-gradient" />
              <span className="thermal-scale-min">-04°C</span>
            </div>
          </>
        )}

        {/* Vignette tube intensificateur de lumière NVG Gen 3 */}
        {visionMode === 'night' && <div className="cctv-nvg-vignette" />}
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

        {camera.externalUrl && (
          <div className="cctv-external-link-row">
            <a
              href={camera.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cctv-external-source-link"
              onClick={() => sound.click(0.25)}
            >
              <ExternalLink size={10} />
              <span>SOURCE OFFICIELLE / RADAR TEMPS RÉEL</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
