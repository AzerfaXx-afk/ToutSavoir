import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Maximize2, Play, Volume2, ShieldCheck, Radio, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/soundFX';
import './InlineLiveCard.css';

export function InlineLiveCard({
  feed,
  isActiveMaster = false,
  isTv = false,
  onSelectMaster,
  onExpandModal,
  index = 0,
}) {
  const [isInView, setIsInView] = useState(index < 4); // First 4 load immediately
  const [snapshotTimestamp, setSnapshotTimestamp] = useState(Date.now());
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // IntersectionObserver for lazy-mounting live iframes & videos
  useEffect(() => {
    if (index < 4) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          } else {
            // Keep mounted once loaded to avoid re-buffering flickers, or unload if far
          }
        });
      },
      { rootMargin: '150px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [index]);

  // Live Snapshot auto-refresh
  useEffect(() => {
    if (!feed?.isLiveSnapshot || !isInView) return;
    const interval = setInterval(() => {
      setSnapshotTimestamp(Date.now());
    }, feed.refreshInterval || 3500);
    return () => clearInterval(interval);
  }, [feed?.isLiveSnapshot, isInView, feed?.refreshInterval]);

  const isHls = Boolean(
    feed?.type === 'hls' ||
    feed?.stream_type === 'hls' ||
    feed?.stream_url?.includes('.m3u8') ||
    feed?.feedUrl?.includes('.m3u8')
  );

  const streamVideoUrl = feed?.stream_url || feed?.feedUrl;

  // HLS setup for inline card
  useEffect(() => {
    if (!isHls || !isInView || !streamVideoUrl || !videoRef.current) return;
    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 15,
      });
      hlsRef.current = hls;
      hls.loadSource(streamVideoUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
      return () => {
        hls.destroy();
      };
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamVideoUrl;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [isHls, isInView, streamVideoUrl]);

  // Clean embed URL with muted autoplay
  const embedUrl = React.useMemo(() => {
    if (!feed) return '';
    const base = feed.embedUrl || feed.stream_url || '';
    if (!base) return '';

    try {
      const url = new URL(base);
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('mute', '1');
      url.searchParams.set('playsinline', '1');
      url.searchParams.set('controls', '0');
      url.searchParams.set('modestbranding', '1');
      url.searchParams.set('rel', '0');
      url.searchParams.set('iv_load_policy', '3');
      return url.toString();
    } catch {
      const glue = base.includes('?') ? '&' : '?';
      return `${base}${glue}autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0`;
    }
  }, [feed]);

  return (
    <div
      ref={cardRef}
      className={`inline-live-card ${isActiveMaster ? 'is-active-master' : ''} ${isTv ? 'is-tv-card' : ''}`}
      onClick={() => {
        sound.click(0.4);
        if (onSelectMaster) onSelectMaster(feed);
      }}
      title={`Cliquer pour afficher sur l'écran maître : ${feed.name}`}
    >
      {/* Video / Snapshot Frame Viewport */}
      <div className="inline-live-viewport">
        {isInView ? (
          isHls ? (
            <video
              ref={videoRef}
              className="inline-live-video"
              autoPlay
              playsInline
              muted
              loop
            />
          ) : feed.isLiveSnapshot && feed.feedUrl ? (
            <img
              src={`${feed.feedUrl}?_t=${snapshotTimestamp}`}
              alt=""
              className="inline-live-img"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                const fallback = (feed.fallbackImage && !feed.fallbackImage.includes('skylinewebcams.com') ? feed.fallbackImage : null) ||
                  (feed.thumbnail && !feed.thumbnail.includes('skylinewebcams.com') ? feed.thumbnail : null) ||
                  'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80';
                e.currentTarget.src = fallback;
              }}
            />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={feed.name}
              className="inline-live-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <img
              src={
                (feed.fallbackImage && !feed.fallbackImage.includes('skylinewebcams.com') ? feed.fallbackImage : null) ||
                (feed.thumbnail && !feed.thumbnail.includes('skylinewebcams.com') ? feed.thumbnail : null) ||
                'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80'
              }
              alt=""
              className="inline-live-img"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80';
              }}
            />
          )
        ) : (
          <img
            src={
              (feed.fallbackImage && !feed.fallbackImage.includes('skylinewebcams.com') ? feed.fallbackImage : null) ||
              (feed.thumbnail && !feed.thumbnail.includes('skylinewebcams.com') ? feed.thumbnail : null) ||
              'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80'
            }
            alt=""
            className="inline-live-img"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80';
            }}
          />
        )}

        {/* Scanlines Overlay */}
        <div className="inline-card-scanlines" />

        {/* Status Live Badge */}
        <div className={`inline-card-badge ${feed.isLiveSnapshot ? 'is-dot' : isTv ? 'is-tv' : 'is-cam'}`}>
          <span className="inline-card-dot" />
          <span>{feed.isLiveSnapshot ? 'DOT LIVE 5S' : isTv ? 'DIRECT 24/7' : 'DIRECT OPTIQUE'}</span>
        </div>

        {/* Resolution Pill */}
        <div className="inline-card-res">{feed.resolution || '1080p HD'}</div>

        {/* Master Indicator or Expand Button */}
        {isActiveMaster && (
          <div className="inline-card-master-tag">
            <CheckCircle2 size={11} />
            <span>FLUX MAÎTRE</span>
          </div>
        )}

        <button
          type="button"
          className="inline-card-expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            sound.click(0.5);
            if (onExpandModal) onExpandModal(feed);
          }}
          title="Agrandir dans le moniteur de surveillance détaché"
        >
          <Maximize2 size={11} />
        </button>
      </div>

      {/* Metadata Bottom Strip */}
      <div className="inline-card-info">
        <div className="inline-card-title-row">
          {feed.logo && <span className="inline-card-flag">{feed.logo}</span>}
          <div className="inline-card-title">{feed.name}</div>
        </div>
        <div className="inline-card-sub">
          {feed.network ? `${feed.network} • ` : ''}
          {feed.city ? `${feed.city}, ` : ''}
          {feed.country}
        </div>
        <div className="inline-card-meta">
          <span className="inline-card-fps">{feed.fps || 30} FPS</span>
          <span className="inline-card-cat">{feed.category}</span>
        </div>
      </div>
    </div>
  );
}
