import React, { useState, useEffect, useRef, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Eye,
  Flame,
  Sun,
  Radio,
  ExternalLink,
  RefreshCw,
  Compass,
  Activity,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Tv,
  Video,
} from 'lucide-react';
import { sound } from '../utils/soundFX';
import './MasterLiveTheater.css';

export function MasterLiveTheater({
  feed,
  isTv = false,
  onPrevFeed,
  onNextFeed,
  onExpandModal,
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [visionMode, setVisionMode] = useState('optical'); // 'optical' | 'nvg' | 'flir'
  const [snapshotTimestamp, setSnapshotTimestamp] = useState(Date.now());
  const [zuluTime, setZuluTime] = useState('');
  const [fpsVal, setFpsVal] = useState(feed?.fps || 60);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Live Zulu Timecode clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getUTCMilliseconds() / 10)).padStart(2, '0');
      setZuluTime(`${hh}:${mm}:${ss}:${ms}Z`);
    };
    updateTime();
    const id = setInterval(updateTime, 100);
    return () => clearInterval(id);
  }, []);

  // Reset vision mode when feed changes
  useEffect(() => {
    setVisionMode('optical');
    setFpsVal(feed?.fps || (isTv ? 50 : 60));
  }, [feed?.id, isTv]);

  // DOT Auto-refresh
  useEffect(() => {
    if (!feed?.isLiveSnapshot) return;
    const interval = setInterval(() => {
      setSnapshotTimestamp(Date.now());
    }, feed.refreshInterval || 3000);
    return () => clearInterval(interval);
  }, [feed?.id, feed?.isLiveSnapshot, feed?.refreshInterval]);

  const isHls = Boolean(
    feed?.type === 'hls' ||
    feed?.stream_type === 'hls' ||
    feed?.stream_url?.includes('.m3u8') ||
    feed?.feedUrl?.includes('.m3u8')
  );

  const streamVideoUrl = feed?.stream_url || feed?.feedUrl;

  // HLS Player Setup
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
        if (videoRef.current) {
          videoRef.current.muted = isMuted;
          videoRef.current.play().catch(() => {});
        }
      });
      return () => {
        hls.destroy();
      };
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamVideoUrl;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
  }, [isHls, streamVideoUrl, feed?.id]);

  // Sync mute state on video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Extract YouTube ID or format embedUrl
  const iframeSrc = useMemo(() => {
    if (!feed) return '';
    const base = feed.embedUrl || feed.stream_url || '';
    if (!base) return '';

    // Append autoplay & mute param properly
    try {
      const url = new URL(base);
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('mute', isMuted ? '1' : '0');
      url.searchParams.set('playsinline', '1');
      url.searchParams.set('controls', '1');
      url.searchParams.set('modestbranding', '1');
      url.searchParams.set('rel', '0');
      url.searchParams.set('iv_load_policy', '3');
      url.searchParams.set('disablekb', '0');
      return url.toString();
    } catch {
      const glue = base.includes('?') ? '&' : '?';
      return `${base}${glue}autoplay=1&mute=${isMuted ? 1 : 0}&playsinline=1&controls=1&modestbranding=1&rel=0`;
    }
  }, [feed, isMuted]);

  if (!feed) return null;

  return (
    <div className={`master-theater-frame ${isTv ? 'is-tv-theater' : 'is-cam-theater'}`}>
      {/* Top Cockpit Command Bar */}
      <div className="master-theater-top-bar">
        <div className="theater-status-group">
          <div className="theater-live-pill">
            <span className="theater-live-dot" />
            <span className="theater-live-text">
              {feed.isLiveSnapshot ? 'DOT LIVE 5S' : isTv ? 'TÉLÉVISION DIRECTE' : 'DIRECT FLUX MAÎTRE'}
            </span>
          </div>
          <span className="theater-res-badge">{feed.resolution || '1080p HD'}</span>
          <span className="theater-fps-badge">{fpsVal} FPS</span>
        </div>

        {/* Shaders & Audio Controls */}
        <div className="theater-controls-group">
          {/* Audio Unmute/Mute Button */}
          <button
            type="button"
            className={`theater-ctrl-btn ${!isMuted ? 'is-audio-active' : ''}`}
            onClick={() => {
              sound.click(0.5);
              setIsMuted(!isMuted);
            }}
            title={isMuted ? "Activer le son du direct" : "Couper le son"}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>{isMuted ? 'SON DÉSACTIVÉ' : 'SON DIRECT'}</span>
          </button>

          {/* Tactical Vision Modes (Only for Cameras / Feeds) */}
          <div className="theater-vision-modes">
            <button
              type="button"
              className={`vision-btn ${visionMode === 'optical' ? 'is-active' : ''}`}
              onClick={() => {
                sound.click(0.3);
                setVisionMode('optical');
              }}
              title="Vision Directe Naturelle"
            >
              <Eye size={11} />
              <span>OPT</span>
            </button>
            <button
              type="button"
              className={`vision-btn nvg-btn ${visionMode === 'nvg' ? 'is-active' : ''}`}
              onClick={() => {
                sound.click(0.3);
                setVisionMode('nvg');
              }}
              title="Vision Nocturne Infrarouge Phosphore (NVG Gen-3)"
            >
              <Sun size={11} />
              <span>NVG</span>
            </button>
            <button
              type="button"
              className={`vision-btn flir-btn ${visionMode === 'flir' ? 'is-active' : ''}`}
              onClick={() => {
                sound.click(0.3);
                setVisionMode('flir');
              }}
              title="Vision Thermique FLIR Infrarouge"
            >
              <Flame size={11} />
              <span>FLIR</span>
            </button>
          </div>

          {/* Fullscreen / Modal expand */}
          <button
            type="button"
            className="theater-ctrl-btn theater-expand-btn"
            onClick={() => {
              sound.click(0.4);
              if (onExpandModal) onExpandModal(feed);
            }}
            title="Agrandir en plein écran / moniteur de surveillance détaché"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Video Screen Viewport */}
      <div className={`master-theater-viewport vision-${visionMode}`}>
        {isHls ? (
          <video
            ref={videoRef}
            className="master-theater-video-element"
            autoPlay
            playsInline
            muted={isMuted}
            loop
          />
        ) : feed.isLiveSnapshot && feed.feedUrl ? (
          <img
            src={`${feed.feedUrl}?_t=${snapshotTimestamp}`}
            alt={feed.name}
            className="master-theater-snapshot-element"
          />
        ) : iframeSrc ? (
          <iframe
            key={`${feed.id}-${isMuted}`}
            src={iframeSrc}
            title={feed.name}
            className="master-theater-iframe-element"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <img
            src={feed.thumbnail || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80'}
            alt={feed.name}
            className="master-theater-snapshot-element"
          />
        )}

        {/* Scanlines & Hologram HUD Overlay */}
        <div className="theater-screen-scanlines" />
        <div className="theater-reticle-corner top-left" />
        <div className="theater-reticle-corner top-right" />
        <div className="theater-reticle-corner bottom-left" />
        <div className="theater-reticle-corner bottom-right" />

        {/* Tactical HUD Overlay Elements */}
        <div className="theater-hud-overlay">
          <div className="theater-hud-top-left">
            <span className="hud-code-tag">{feed.code || feed.id?.toUpperCase()}</span>
            <span className="hud-signal-text">RÉCEPTION SATELLITE 100%</span>
          </div>

          <div className="theater-hud-bottom-row">
            <div className="hud-telemetry-left">
              <Compass size={11} className="hud-icon" />
              <span>
                {feed.lat?.toFixed(4)}°N, {feed.lng?.toFixed(4)}°E
              </span>
              {feed.telemetry?.alt && <span className="hud-alt-tag">ALT: {feed.telemetry.alt}</span>}
              {feed.telemetry?.speed && <span className="hud-speed-tag">VIT: {feed.telemetry.speed}</span>}
            </div>
            <div className="hud-timecode-right">
              <Activity size={11} className="hud-icon-live" />
              <span className="hud-zulu-clock">{zuluTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Quick Navigation Strip */}
      <div className="master-theater-info-bar">
        <div className="theater-info-text">
          <div className="theater-info-title-row">
            {feed.logo && <span className="theater-flag-icon">{feed.logo}</span>}
            <h3 className="theater-info-title">{feed.name}</h3>
          </div>
          <p className="theater-info-location">
            {feed.network ? `${feed.network} • ` : ''}
            {feed.city ? `${feed.city}, ` : ''}
            {feed.country}
            <span className="theater-category-pill">{feed.category}</span>
          </p>
        </div>

        {/* Quick Prev / Next Switchers */}
        <div className="theater-nav-buttons">
          {onPrevFeed && (
            <button
              type="button"
              className="theater-nav-btn"
              onClick={() => {
                sound.click(0.3);
                onPrevFeed();
              }}
              title="Canal précédent"
            >
              <ChevronLeft size={14} />
              <span>PRÉCÉDENT</span>
            </button>
          )}
          {onNextFeed && (
            <button
              type="button"
              className="theater-nav-btn"
              onClick={() => {
                sound.click(0.3);
                onNextFeed();
              }}
              title="Canal suivant"
            >
              <span>SUIVANT</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
