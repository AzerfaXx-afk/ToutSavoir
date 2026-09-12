import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { sound } from '../utils/soundFX';
import { CCTV_FEEDS } from '../data/osirisStreams';
import './CCTVLiveMonitor.css';

export function CCTVLiveMonitor({ camera, onClose, onSelectCamera }) {
  const [timecode, setTimecode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live UTC timecode ticking
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimecode(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!camera) return null;

  const currentIndex = CCTV_FEEDS.findIndex((c) => c.id === camera.id);

  const handlePrev = () => {
    sound.tick();
    const prevIndex = (currentIndex - 1 + CCTV_FEEDS.length) % CCTV_FEEDS.length;
    if (onSelectCamera) onSelectCamera(CCTV_FEEDS[prevIndex]);
  };

  const handleNext = () => {
    sound.tick();
    const nextIndex = (currentIndex + 1) % CCTV_FEEDS.length;
    if (onSelectCamera) onSelectCamera(CCTV_FEEDS[nextIndex]);
  };

  const handleClose = () => {
    sound.tick();
    if (onClose) onClose();
  };

  return (
    <div
      className={`cctv-monitor-pip ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: '10vh',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '800px',
              maxWidth: '94vw',
              zIndex: 9999,
            }
          : {}
      }
    >
      {/* Top Monitor Bar */}
      <div className="cctv-monitor-header">
        <div className="cctv-live-tag">
          <span className="cctv-rec-dot" />
          <span>FLUX EN DIRECT // CAM {currentIndex + 1}/{CCTV_FEEDS.length}</span>
        </div>

        <div className="cctv-header-actions">
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
            title={isFullscreen ? 'Réduire' : 'Agrandir'}
          >
            <Maximize2 size={13} />
          </button>
          <button
            type="button"
            className="cctv-icon-btn"
            onClick={handleClose}
            title="Fermer la surveillance"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Video Viewport with Scanline FX */}
      <div
        className="cctv-video-viewport"
        style={{ height: isFullscreen ? '420px' : '210px' }}
      >
        {camera.embedUrl ? (
          <iframe
            className="cctv-iframe"
            src={camera.embedUrl}
            title={camera.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <img
            src={camera.thumbnail}
            alt={camera.name}
            className="cctv-fallback-media"
          />
        )}

        <div className="cctv-hud-overlay" />
        <div className="cctv-hud-corners" />
        <div className="cctv-timecode">{timecode}</div>
        <div className="cctv-coords-badge">
          {camera.lat.toFixed(4)}°, {camera.lng.toFixed(4)}°
        </div>
      </div>

      {/* Metadata Bottom Card */}
      <div className="cctv-info-bar">
        <div className="cctv-name-row">
          <span className="cctv-title">{camera.name}</span>
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
