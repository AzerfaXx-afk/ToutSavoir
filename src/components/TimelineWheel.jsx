import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { sound } from '../utils/soundFX';

// UN Official Historical & Projected Population Benchmark Datapoints (1950 - 2100)
export const UN_POPULATION_BENCHMARKS = [
  { year: 1950, pop: 2499322157, label: 'Début de l’ère moderne' },
  { year: 1960, pop: 3034949748, label: 'Première conquête spatiale' },
  { year: 1970, pop: 3700437046, label: 'Premier Jour de la Terre' },
  { year: 1980, pop: 4458003514, label: 'Révolution numérique' },
  { year: 1990, pop: 5327231061, label: 'Fin de la Guerre Froide' },
  { year: 2000, pop: 6143493823, label: 'Nouveau Millénaire' },
  { year: 2010, pop: 6956823603, label: 'Ère des smartphones & réseaux' },
  { year: 2020, pop: 7794798739, label: 'Décennie de transition' },
  { year: 2026, pop: 8185420000, label: 'PRÉSENT EN DIRECT' },
  { year: 2030, pop: 8512000000, label: 'Objectifs climat ONU' },
  { year: 2040, pop: 9180000000, label: 'Automatisation & IA' },
  { year: 2050, pop: 9709000000, label: 'Pic démographique partiel' },
  { year: 2075, pop: 10150000000, label: 'Stabilisation mondiale' },
  { year: 2100, pop: 10350000000, label: 'Horizon prospectif ONU' },
];

export function getEstimatedPopulationForYear(year) {
  if (year <= 1950) return UN_POPULATION_BENCHMARKS[0].pop;
  if (year >= 2100) return UN_POPULATION_BENCHMARKS[UN_POPULATION_BENCHMARKS.length - 1].pop;

  for (let i = 0; i < UN_POPULATION_BENCHMARKS.length - 1; i++) {
    const p1 = UN_POPULATION_BENCHMARKS[i];
    const p2 = UN_POPULATION_BENCHMARKS[i + 1];
    if (year >= p1.year && year <= p2.year) {
      const fraction = (year - p1.year) / (p2.year - p1.year);
      return Math.round(p1.pop + fraction * (p2.pop - p1.pop));
    }
  }
  return 8185420000;
}

// ARC OF CIRCLE GEOMETRY CONSTANTS
const VIEW_WIDTH = 220;
const VIEW_HEIGHT = 540;
const CENTER_Y = 270; // Precise vertical midpoint
const RADIUS = 480; // Radius of circular arc
const APEX_X = 60; // Apex of arc (rightmost point of circle)
const CENTER_X = APEX_X - RADIUS; // -420px: Center of circle off-screen to left
const DEG_PER_YEAR = 4.8; // Spacing per year in degrees (~40.2px arc length)
const PIXELS_PER_YEAR = (RADIUS * (DEG_PER_YEAR * Math.PI)) / 180; // ~40.2px

const MIN_YEAR = 1950;
const MAX_YEAR = 2100;

export function TimelineWheel({ currentYear = 2026, onYearChange }) {
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [isDragging, setIsDragging] = useState(false);

  // References for physics and smooth lerping
  const targetYearRef = useRef(currentYear);
  const displayYearRef = useRef(currentYear);
  const lastSoundYear = useRef(currentYear);
  const animFrameId = useRef(null);
  const dragStartY = useRef(0);
  const dragStartYear = useRef(currentYear);
  const lastPointerY = useRef(0);
  const lastPointerTime = useRef(0);
  const velocityY = useRef(0);
  const snapTimeout = useRef(null);
  const isInteracting = useRef(false);

  // Sync external prop changes
  useEffect(() => {
    targetYearRef.current = currentYear;
  }, [currentYear]);

  // High-performance RAF lerp loop (60fps/120fps ultra-fluid)
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      const diff = targetYearRef.current - displayYearRef.current;
      // Snappy response when dragging, silky liquid deceleration when gliding
      const factor = isInteracting.current ? 0.38 : 0.14;

      if (Math.abs(diff) > 0.0008) {
        displayYearRef.current += diff * factor;
        setDisplayYear(displayYearRef.current);

        const rounded = Math.round(displayYearRef.current);
        if (rounded !== lastSoundYear.current) {
          sound.notchTick(1100 + (rounded - 1950) * 4.5);
          lastSoundYear.current = rounded;
          if (onYearChange) {
            onYearChange(rounded);
          }
        }
      } else if (displayYearRef.current !== targetYearRef.current) {
        displayYearRef.current = targetYearRef.current;
        setDisplayYear(targetYearRef.current);
        const rounded = Math.round(targetYearRef.current);
        if (rounded !== lastSoundYear.current) {
          sound.notchTick(1100 + (rounded - 1950) * 4.5);
          lastSoundYear.current = rounded;
          if (onYearChange) {
            onYearChange(rounded);
          }
        }
      }

      animFrameId.current = requestAnimationFrame(tick);
    };

    animFrameId.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [onYearChange]);

  // Set target year safely clamped
  const setTargetYearClamped = useCallback((newYear) => {
    const clamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, newYear));
    targetYearRef.current = clamped;
  }, []);

  // Continuous wheel scrolling (mouse wheel & trackpad)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    isInteracting.current = true;

    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 28;
    else if (e.deltaMode === 2) delta *= 400;

    // Fluid continuous impulse (rolling down = future, rolling up = past)
    const impulse = delta * 0.0035;
    const nextTarget = Math.max(MIN_YEAR, Math.min(MAX_YEAR, targetYearRef.current + impulse));
    targetYearRef.current = nextTarget;

    // Debounced magnetic snap to nearest integer when wheeling stops
    if (snapTimeout.current) clearTimeout(snapTimeout.current);
    snapTimeout.current = setTimeout(() => {
      isInteracting.current = false;
      targetYearRef.current = Math.round(targetYearRef.current);
    }, 160);
  }, []);

  // Pointer drag interaction (direct 1:1 tactile follow)
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    isInteracting.current = true;
    if (snapTimeout.current) clearTimeout(snapTimeout.current);

    dragStartY.current = e.clientY;
    dragStartYear.current = displayYearRef.current;
    lastPointerY.current = e.clientY;
    lastPointerTime.current = performance.now();
    velocityY.current = 0;

    const handlePointerMove = (moveEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastPointerTime.current);
      const dy = moveEvent.clientY - lastPointerY.current;
      velocityY.current = dy / dt; // px/ms
      lastPointerY.current = moveEvent.clientY;
      lastPointerTime.current = now;

      // Natural direct-manipulation: Dragging DOWN pulls the tape DOWN (towards past years)
      const totalDy = moveEvent.clientY - dragStartY.current;
      const yearOffset = -totalDy / PIXELS_PER_YEAR;
      const nextTarget = Math.max(MIN_YEAR, Math.min(MAX_YEAR, dragStartYear.current + yearOffset));
      targetYearRef.current = nextTarget;
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      isInteracting.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Fling momentum physics on rapid release
      if (Math.abs(velocityY.current) > 0.18) {
        const flingYears = -Math.round(velocityY.current * 14);
        const finalYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(targetYearRef.current + flingYears)));
        setTargetYearClamped(finalYear);
      } else {
        // Snap cleanly to nearest integer year
        setTargetYearClamped(Math.round(targetYearRef.current));
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [setTargetYearClamped]);

  // Direct click on any year label
  const handleSelectYear = useCallback((yr, e) => {
    e.stopPropagation();
    sound.click(0.4);
    setTargetYearClamped(yr);
  }, [setTargetYearClamped]);

  // Compute SVG arc path geometry
  const arcPathD = useMemo(() => {
    const spanDeg = 32.2;
    const startRad = (-spanDeg * Math.PI) / 180;
    const endRad = (spanDeg * Math.PI) / 180;

    const x1 = Math.max(0, CENTER_X + RADIUS * Math.cos(startRad));
    const y1 = CENTER_Y + RADIUS * Math.sin(startRad);
    const x2 = Math.max(0, CENTER_X + RADIUS * Math.cos(endRad));
    const y2 = CENTER_Y + RADIUS * Math.sin(endRad);

    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${RADIUS} ${RADIUS} 0 0 1 ${APEX_X} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }, []);

  // Generate visible graduations and year numbers
  const centerInt = Math.round(displayYear);
  const items = [];
  const range = 6; // ±6 years

  for (let offset = -range; offset <= range; offset++) {
    const y = centerInt + offset;
    if (y < MIN_YEAR || y > MAX_YEAR) continue;

    const delta = y - displayYear;
    const deg = delta * DEG_PER_YEAR;
    const rad = (deg * Math.PI) / 180;

    // Coordinates on circular arc
    const arcX = CENTER_X + RADIUS * Math.cos(rad);
    const arcY = CENTER_Y + RADIUS * Math.sin(rad);

    // Normal vector pointing outwards to the right
    const normX = Math.cos(rad);
    const normY = Math.sin(rad);

    const isDecade = y % 10 === 0;
    const isFiveYear = y % 5 === 0 && !isDecade;

    // Graduation tick length
    let tickLen = 5;
    if (isDecade) tickLen = 13;
    else if (isFiveYear) tickLen = 8;

    const tickEndX = arcX + tickLen * normX;
    const tickEndY = arcY + tickLen * normY;

    // Label position along normal vector
    const textDist = 22;
    const textX = arcX + textDist * normX;
    const textY = arcY + textDist * normY;

    // Continuous proximity to center reticle
    const absDelta = Math.abs(delta);
    const proximity = Math.max(0, 1 - absDelta);
    const opacity = Math.max(0, 1 - Math.pow(absDelta / 4.8, 1.5));

    // Show text within ±4 years or decade milestones
    const showText = isDecade || absDelta <= 3.8;

    // Smooth continuous magnification scale (peaks at 1.40x at center)
    const scale = 0.82 + proximity * 0.58;
    const rotationDeg = deg * 0.45;

    items.push({
      year: y,
      delta,
      deg,
      rad,
      arcX,
      arcY,
      normX,
      normY,
      tickEndX,
      tickEndY,
      textX,
      textY,
      rotationDeg,
      opacity,
      proximity,
      scale,
      isDecade,
      isFiveYear,
      showText,
    });
  }

  const roundedActive = Math.round(displayYear);

  return (
    <div
      className={`timeline-arc-container ${isDragging ? 'is-dragging' : ''}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      role="slider"
      aria-valuemin={MIN_YEAR}
      aria-valuemax={MAX_YEAR}
      aria-valuenow={roundedActive}
      aria-label="Arc temporel Awwwards"
      title="Faire défiler ou glisser le long de l’arc"
    >
      <svg
        className="timeline-arc-svg"
        width={VIEW_WIDTH}
        height={VIEW_HEIGHT}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      >
        <defs>
          {/* Vertical gradient fading the arc line at the extremities */}
          <linearGradient id="arcGlowGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f2fe" stopOpacity="0" />
            <stop offset="20%" stopColor="#00f2fe" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#00f2fe" stopOpacity="0.75" />
            <stop offset="80%" stopColor="#00f2fe" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
          </linearGradient>

          {/* Reticle laser glow filter */}
          <filter id="reticleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Seamless Circular Arc Track */}
        <path
          d={arcPathD}
          fill="none"
          stroke="url(#arcGlowGradient)"
          strokeWidth="1.4"
          className="arc-track-line"
        />

        {/* 2. Precision Laser Arrow Indicator pointing directly at date along horizontal centerline (Y = 270) */}
        <g className="arc-apex-reticle" filter="url(#reticleGlow)">
          {/* Horizontal laser shaft */}
          <line
            x1={28}
            y1={CENTER_Y}
            x2={48}
            y2={CENTER_Y}
            stroke="#00f2fe"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Sleek arrowhead aligned with date */}
          <path
            d={`M 46 ${CENTER_Y - 4.5} L 54 ${CENTER_Y} L 46 ${CENTER_Y + 4.5} Z`}
            fill="#00f2fe"
          />
        </g>

        {/* 3. Graduations (Ticks along the circle) */}
        {items.map((item) => {
          if (item.opacity <= 0.01) return null;

          let stroke = 'rgba(255, 255, 255, 0.22)';
          let strokeWidth = 1;

          if (item.proximity > 0.6) {
            stroke = '#00f2fe';
            strokeWidth = 1.8;
          } else if (item.isDecade) {
            stroke = 'rgba(0, 242, 254, 0.65)';
            strokeWidth = 1.4;
          } else if (item.isFiveYear) {
            stroke = 'rgba(255, 255, 255, 0.45)';
            strokeWidth = 1.2;
          }

          return (
            <line
              key={`tick-${item.year}`}
              x1={item.arcX.toFixed(1)}
              y1={item.arcY.toFixed(1)}
              x2={item.tickEndX.toFixed(1)}
              y2={item.tickEndY.toFixed(1)}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={item.opacity}
            />
          );
        })}
      </svg>

      {/* 4. Dynamic Dates on Arc (100% Centered with line-height: 1) */}
      <div className="arc-dates-overlay">
        {items.map((item) => {
          if (!item.showText || item.opacity <= 0.02) return null;

          const isActive = item.proximity > 0.55;
          const isDecade = item.isDecade;

          return (
            <button
              key={`label-${item.year}`}
              type="button"
              className={`arc-year-item ${isActive ? 'is-active' : ''} ${isDecade ? 'is-decade' : ''}`}
              style={{
                transform: `translate3d(${item.textX.toFixed(1)}px, ${item.textY.toFixed(1)}px, 0) translateY(-50%) rotate(${item.rotationDeg.toFixed(1)}deg) scale(${item.scale.toFixed(3)})`,
                opacity: item.opacity,
              }}
              onClick={(e) => handleSelectYear(item.year, e)}
              title={`Année ${item.year}`}
            >
              {item.year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
