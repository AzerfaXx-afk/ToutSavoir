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
  Volume2,
  Volume1,
  VolumeX,
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

  // Audio Control (Webcams & Live World TV Channels)
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.85);

  const videoRef = useRef(null);
  const iframeRef = useRef(null);
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

  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    setMediaError(false);
  }, [camera?.id, reloadKey]);

  const isSkyline = Boolean(
    camera?.type === 'skyline' ||
    camera?.skylineId ||
    camera?.provider?.toLowerCase().includes('skylinewebcams')
  );

  const currentMediaUrl = useMemo(() => {
    if (!camera) return '';
    if (isSkyline && camera.skylineId) {
      return `https://cdn.skylinewebcams.com/live${camera.skylineId}.jpg?_t=${snapshotTimestamp}`;
    }
    if (camera.isLiveSnapshot && camera.feedUrl) {
      return `${camera.feedUrl}?_t=${snapshotTimestamp}`;
    }
    return camera.thumbnail || camera.feedUrl || '';
  }, [camera, snapshotTimestamp, isSkyline]);

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
    !isSkyline &&
    !camera?.isLiveSnapshot &&
    (
      camera?.type === 'yt' ||
      camera?.type === 'iframe' ||
      camera?.stream_type === 'iframe' ||
      (camera?.embedUrl && !camera.embedUrl.includes('skylinewebcams.com')) ||
      (camera?.stream_url && (camera.stream_url.includes('youtube') || camera.stream_url.includes('embed') || camera.stream_url.includes('ipcamlive') || camera.stream_url.includes('skaping')))
    )
  );
  const streamVideoUrl = camera?.stream_url || camera?.feedUrl;

  const computedIframeSrc = useMemo(() => {
    const raw = camera?.embedUrl || camera?.stream_url;
    if (!raw) return '';
    if (raw.includes('youtube.com') || raw.includes('youtu.be')) {
      try {
        const url = new URL(raw);
        url.searchParams.set('enablejsapi', '1');
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('mute', isMuted ? '1' : '0');
        url.searchParams.set('controls', '1');
        url.searchParams.set('modestbranding', '1');
        url.searchParams.set('rel', '0');
        return url.toString();
      } catch (e) {
        return raw;
      }
    }
    return raw;
  }, [camera?.embedUrl, camera?.stream_url, isMuted]);

  // Sync HTML5 video element volume and mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);

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

  // Audio Control Handlers
  const toggleMute = () => {
    sound.click(0.3);
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (videoRef.current) {
      videoRef.current.muted = newMuted;
      videoRef.current.volume = volume;
    }

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: newMuted ? 'mute' : 'unMute',
          args: [],
        }),
        '*'
      );
      if (!newMuted) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [Math.round(volume * 100)],
          }),
          '*'
        );
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVol === 0 && !isMuted) {
      setIsMuted(true);
    }

    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [Math.round(newVol * 100)],
        }),
        '*'
      );
      if (newVol > 0 && isMuted) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
          '*'
        );
      }
    }
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
              : `FLUX EN DIRECT // CAM ${currentIndex >= 0 ? currentIndex + 1 : 1}/${allStreams.length}`}
          </span>
        </div>

        <div className="cctv-header-actions">
          {/* Audio Mute/Unmute & Volume Widget */}
          <div
            className="cctv-audio-group"
            title={isMuted ? "Activer le flux audio en direct (Unmute)" : "Couper le flux audio (Mute)"}
          >
            <button
              type="button"
              className={`cctv-icon-btn cctv-audio-btn ${isMuted ? 'is-muted' : 'is-unmuted'}`}
              onClick={toggleMute}
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX size={13} /> : volume > 0.5 ? <Volume2 size={13} /> : <Volume1 size={13} />}
              <span className="cctv-audio-status-text">{isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}</span>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="cctv-volume-slider"
              title={`Volume audio : ${Math.round(volume * 100)}%`}
            />
          </div>

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
          {mediaError ? (
            <div className="cctv-media-fallback-wrap">
              <img
                src={camera.thumbnail || currentMediaUrl}
                alt={camera.name}
                className="cctv-optical-media"
              />
              <div className="cctv-fallback-overlay">
                <div className="cctv-fallback-hud">
                  <span className="fallback-status-dot" />
                  <span className="fallback-title">SIGNAL FLUX SECONDORISE // CAPTEUR OPTIQUE DIRECT</span>
                </div>
                <div className="cctv-fallback-controls">
                  <button
                    type="button"
                    className="cctv-fallback-retry-btn"
                    onClick={handleReload}
                  >
                    <RefreshCw size={11} />
                    <span>RÉINITIALISER SIGNAL</span>
                  </button>
                  {camera.externalUrl && (
                    <a
                      href={camera.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cctv-fallback-ext-btn"
                    >
                      <ExternalLink size={11} />
                      <span>SOURCE HD DIRECTE</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : isSkyline ? (
            <div className="cctv-live-dot-wrap is-skyline-feed">
              <img
                key={`skyline-${camera.id}`}
                src={currentMediaUrl}
                alt={camera.name}
                className="cctv-optical-media"
                loading="eager"
                onError={(e) => {
                  if (camera.thumbnail && e.currentTarget.src !== camera.thumbnail) {
                    e.currentTarget.src = camera.thumbnail;
                  }
                }}
              />
              <div className="cctv-dot-live-indicator is-skyline-badge">
                <span className="dot-pulse" />
                <span>DIRECT SKYLINEWEBCAMS // CAPTEUR LIVE HD (2.5s)</span>
                {camera.externalUrl && (
                  <a
                    href={camera.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cctv-skyline-badge-link"
                    onClick={(e) => e.stopPropagation()}
                    title="Ouvrir sur le site officiel SkylineWebcams"
                  >
                    OUVRIR SUR SKYLINEWEBCAMS HD ↗
                  </a>
                )}
              </div>
            </div>
          ) : isHls ? (
            <div className="cctv-stream-container">
              <video
                ref={videoRef}
                key={`hls-${camera.id}-${reloadKey}`}
                className="cctv-video-element"
                autoPlay
                muted={isMuted}
                playsInline
                loop
                onError={() => setMediaError(true)}
              />
            </div>
          ) : isMp4 ? (
            <div className="cctv-stream-container">
              <video
                ref={videoRef}
                key={`mp4-${camera.id}-${reloadKey}`}
                src={streamVideoUrl}
                className="cctv-video-element"
                autoPlay
                muted={isMuted}
                playsInline
                loop
                onError={() => setMediaError(true)}
              />
            </div>
          ) : isIframe ? (
            <div className="cctv-stream-container">
              <iframe
                ref={iframeRef}
                key={`iframe-${camera.id}-${reloadKey}-${isMuted ? 'muted' : 'unmuted'}`}
                className="cctv-iframe"
                src={computedIframeSrc}
                title={camera.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="eager"
                onError={() => setMediaError(true)}
              />
            </div>
          ) : isMjpeg ? (
            <div className="cctv-stream-container">
              <img
                key={`mjpeg-${camera.id}-${reloadKey}`}
                src={streamVideoUrl}
                alt={camera.name}
                className="cctv-optical-media"
                onError={() => setMediaError(true)}
              />
            </div>
          ) : camera.isLiveSnapshot ? (
            <div className="cctv-live-dot-wrap">
              <img
                key={`dot-${camera.id}`}
                src={currentMediaUrl}
                alt={camera.name}
                className="cctv-optical-media"
                loading="eager"
                onError={() => {
                  if (camera.thumbnail && currentMediaUrl !== camera.thumbnail) {
                    setMediaError(true);
                  }
                }}
              />
              <div className="cctv-dot-live-indicator">
                <span className="dot-pulse" />
                <span>DIRECT CAPTEUR OPTIQUE // AUTO-ACTUALISÉ 2.5S</span>
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

        {/* Badge Audio HUD (Direct / Mute) */}
        <div className={`cctv-audio-hud-badge ${!isMuted ? 'is-live-audio' : 'is-muted-audio'}`}>
          {!isMuted ? (
            <>
              <div className="cctv-eq-bars">
                <span className="cctv-eq-bar" />
                <span className="cctv-eq-bar" />
                <span className="cctv-eq-bar" />
                <span className="cctv-eq-bar" />
              </div>
              <span>SON DIRECT // {Math.round(volume * 100)}%</span>
            </>
          ) : (
            <>
              <VolumeX size={10} />
              <span>AUDIO COUPÉ</span>
            </>
          )}
        </div>

        {/* Télémétrie Capteur Gauche / Droite */}
        {(() => {
          const isOrbitalFeed = Boolean(camera.isOrbital || camera.id === 'cctv-iss-hdev' || camera.city?.includes('Orbite'));
          return (
            <>
              <div className="cctv-coords-badge">
                {isOrbitalFeed
                  ? 'ORBITE LEO // 418 KM ALT'
                  : `${Math.abs(camera.lat || 0).toFixed(4)}° ${(camera.lat || 0) >= 0 ? 'N' : 'S'}, ${Math.abs(camera.lng || 0).toFixed(4)}° ${(camera.lng || 0) >= 0 ? 'E' : 'O'}`}
              </div>

              <div className="cctv-stream-stats-badge">
                <span>{camera.fps || 30}.0 FPS</span>
                <span className="stat-sep">•</span>
                <span>{camera.resolution || '1080p HD'}</span>
                <span className="stat-sep">•</span>
                <span className="stat-codec">{isOrbitalFeed ? 'NASA H.265' : (camera.codec || 'H.264 HD')}</span>
              </div>
            </>
          );
        })()}

        {/* Badge Source Fournisseur Vérifié */}
        {camera.provider && (
          <div className="cctv-provider-badge">
            <span className="cctv-provider-dot" />
            <span>{camera.provider.split('/')[0].trim().toUpperCase()}</span>
          </div>
        )}

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
          <div className="cctv-badges-wrap">
            {camera.provider && (
              <span className="cctv-provider-pill" title="Diffuseur certifié">
                {camera.provider.split('/')[0].trim()}
              </span>
            )}
            <span className="cctv-category-badge">{camera.category}</span>
          </div>
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
              <span>OUVRIR LE FLUX DIRECT ({camera.provider ? camera.provider.split('/')[0].trim().toUpperCase() : 'SOURCE VÉRIFIÉE'})</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
