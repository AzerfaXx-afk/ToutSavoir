import React, { useRef, useState, useEffect } from 'react';
import { Clock, History, Sparkles } from 'lucide-react';
import { TIMELINE_ERAS } from '../data/mockData';
import { sound } from '../utils/soundFX';

export function TimelineScrubber({ activeEra, onSelectEra }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeIndex = TIMELINE_ERAS.findIndex((e) => e.year === activeEra.year);

  const handlePointerDown = (index) => {
    sound.warp(400 + index * 40);
    onSelectEra(TIMELINE_ERAS[index]);
    setIsDragging(true);
  };

  useEffect(() => {
    const handlePointerUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  return (
    <aside className="timeline-scrubber-dock">
      {/* Top indicator tag */}
      <div className="timeline-legend">
        <Clock size={11} className="text-cyan" />
        <span>TEMPORALITÉ</span>
      </div>

      {/* Scrubber track with vertical fade */}
      <div className="timeline-track-wrapper" ref={containerRef}>
        <div className="timeline-vertical-line" />

        <div className="timeline-milestones-list">
          {TIMELINE_ERAS.map((era, index) => {
            const isSelected = era.year === activeEra.year;
            const isFuture = era.type === 'future';
            const isLive = era.type === 'live';

            return (
              <div
                key={era.year}
                className={`timeline-node ${isSelected ? 'selected' : ''} ${isFuture ? 'node-future' : ''} ${isLive ? 'node-live' : ''}`}
                onClick={() => handlePointerDown(index)}
                onMouseEnter={() => sound.tick()}
              >
                {/* Visual marker tick */}
                <div className="node-marker-group">
                  <div className="node-pip" />
                  <div className="node-tick-line" />
                </div>

                {/* Content info */}
                <div className="node-content">
                  <span className="node-year">{era.year}</span>
                  <span className="node-label">{era.label}</span>
                  {isLive && <span className="live-tag-pill">ACTUEL</span>}
                  {isFuture && <span className="future-tag-pill">IA PROJ</span>}
                </div>

                {/* Floating glow for current active */}
                {isSelected && <div className="node-active-glow" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrubber footer indicator */}
      <div className="timeline-status-footer">
        <span className="temporal-state-tag">
          {activeEra.type === 'live' ? (
            <span className="text-emerald">● FLUX EN DIRECT</span>
          ) : activeEra.type === 'future' ? (
            <span className="text-purple">◆ MODÈLE PRÉDICTIF</span>
          ) : (
            <span className="text-amber">▲ ARCHIVE OSINT</span>
          )}
        </span>
      </div>
    </aside>
  );
}
