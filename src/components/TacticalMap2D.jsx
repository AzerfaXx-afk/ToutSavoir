import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { sound } from '../utils/soundFX';
import { X, Maximize2, MapPin } from 'lucide-react';
import { TERRITORY_NAMES_FR, getCountryAreaKm2, formatAreaKm2 } from '../utils/countryData';
import { realtimeStream } from '../utils/realtimeEvents';
import {
  AVIATION_ROUTES,
  CYBER_ATTACK_VECTORS,
  GEOPOLITICAL_ZONES,
  BALLISTIC_TRAJECTORIES,
  getGeopoliticalZonesForYear,
} from '../data/tacticalStreams';
import {
  CCTV_FEEDS,
  LIVE_NEWS_CHANNELS,
  SUBMARINE_CABLES,
  THERMAL_ANOMALIES,
  WEATHER_SYSTEMS,
  STRATEGIC_NUCLEAR_SITES,
} from '../data/osirisStreams';
import { WORLD_TV_CHANNELS } from '../data/worldTvChannels';
import { LIVE_FLIGHTS, LIVE_VESSELS, getLiveTransitPositions, interpolateGreatCircle } from '../data/liveTransits';
import { flightRadarService, getFlightradarPlaneSvg } from '../services/flightRadarService';
import { marineTrafficService, getMarineTrafficVesselSvg } from '../services/marineTrafficService';
import { TacticalInspectionCard } from './TacticalInspectionCard';
import { CountryDossierCard } from './CountryDossierCard';
import { resolveCountryGeopolitics } from '../data/countryGeopolitics';


const OVERSEAS_FRENCH_DEPS = new Set(['GUF', 'REU', 'GLP', 'MTQ', 'MYT']);

function getFeatureCountryKey(feature) {
  const props = feature?.properties || {};
  const su = props.SU_A3 || '';
  if (OVERSEAS_FRENCH_DEPS.has(su)) {
    return su;
  }
  if (props.ADM0_A3 === 'FRA') {
    return 'FRA';
  }
  if (props.ADM0_A3 === 'USA') {
    return 'USA';
  }
  if (props.ADM0_A3 === 'RUS') {
    return 'RUS';
  }
  if (props.ADM0_A3 === 'ATA' || (props.NAME && props.NAME.toLowerCase().includes('antarct'))) {
    return 'ATA';
  }
  return props.ADM0_A3 || props.ISO_A3 || props.NAME || 'TER';
}

export function TacticalMap2D({
  activeLayer = 'satellite',
  activeLayers = new Set(),
  selectedYear = 2026,
  flightLimit = 25,
  vesselLimit = 500,
  onSelectCCTV,
  onSelectSatellite,
  onSelectCountry,
  targetLocation,
  isDrawerOpen = false,
  inspectedTarget: propInspectedTarget,
  onInspectTarget,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const selectedLayerRef = useRef(null);

  const aviationLayerRef = useRef(null);
  const maritimeLayerRef = useRef(null);
  const cyberLayerRef = useRef(null);
  const conflictsLayerRef = useRef(null);
  const telluricLayerRef = useRef(null);
  const cctvLayerRef = useRef(null);
  const cablesLayerRef = useRef(null);
  const weatherLayerRef = useRef(null);
  const nuclearLayerRef = useRef(null);
  const inspectedRouteLayerRef = useRef(null);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [hoveredTerritory, setHoveredTerritory] = useState(null);
  const selectedLayersRef = useRef([]);
  const selectedGroupKeyRef = useRef(null);
  const countryGroupLayersMapRef = useRef(new Map());
  const hoveredGroupLayersRef = useRef([]);
  const hoveredGroupKeyRef = useRef(null);
  const hoveredLayerRef = useRef(null);
  const hoveredCountryIdRef = useRef(null);
  const [internalInspectedTarget, setInternalInspectedTarget] = useState(null);
  const inspectedTarget = propInspectedTarget !== undefined ? propInspectedTarget : internalInspectedTarget;
  const setInspectedTarget = useCallback((target) => {
    setInternalInspectedTarget(target);
    if (onInspectTarget) onInspectTarget(target);
  }, [onInspectTarget]);

  const flightLimitRef = useRef(flightLimit);
  const updateFlightradarPlanesRef = useRef(null);
  const vesselLimitRef = useRef(vesselLimit);
  const updateMarineTrafficVesselsRef = useRef(null);
  const inspectedTargetRef = useRef(inspectedTarget);

  useEffect(() => {
    inspectedTargetRef.current = inspectedTarget;
    if (inspectedTarget) {
      // Exclusivity: Close country selection & unhighlight any country when inspecting a target
      setSelectedTerritory(null);
      setHoveredTerritory(null);
      if (selectedLayersRef.current.length > 0 && geoJsonLayerRef.current) {
        selectedLayersRef.current.forEach((l) => {
          geoJsonLayerRef.current.resetStyle(l);
          if (l._path) {
            l._path.classList.remove('country-path-selected', 'country-path-elevated');
          }
        });
        selectedLayersRef.current = [];
      } else if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.eachLayer((l) => {
          geoJsonLayerRef.current.resetStyle(l);
          if (l._path) {
            l._path.classList.remove('country-path-selected');
            l._path.classList.remove('country-path-elevated');
          }
        });
      }
      selectedGroupKeyRef.current = null;
      selectedLayerRef.current = null;
      hoveredLayerRef.current = null;
      hoveredGroupLayersRef.current = [];
      hoveredGroupKeyRef.current = null;
    }
    if (updateMarineTrafficVesselsRef.current) {
      updateMarineTrafficVesselsRef.current();
    }
  }, [inspectedTarget]);

  const updateConflictsLayerRef = useRef(null);

  useEffect(() => {
    if (updateConflictsLayerRef.current) {
      updateConflictsLayerRef.current(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    flightLimitRef.current = flightLimit;
    if (updateFlightradarPlanesRef.current) {
      updateFlightradarPlanesRef.current();
    }
  }, [flightLimit]);

  useEffect(() => {
    vesselLimitRef.current = vesselLimit;
    if (updateMarineTrafficVesselsRef.current) {
      updateMarineTrafficVesselsRef.current();
    }
  }, [vesselLimit]);

  // Direct DOM refs for cursor coordinates (0 React re-renders on mousemove)
  const coordLatRef = useRef(null);
  const coordLngRef = useRef(null);

  // Styles definition
  const defaultStyle = {
    fillColor: 'transparent',
    weight: 1.2,
    opacity: 0.45,
    color: '#00f2fe',
    fillOpacity: 0.02,
    className: 'country-path-base',
  };

  const hoverStyle = {
    weight: 2.8,
    color: '#00ffff',
    opacity: 1,
    fillColor: '#00f2fe',
    fillOpacity: 0.35,
    className: 'country-path-elevated',
  };

  // High-impact selected style that pops out and stays persistent
  const selectedStyle = {
    weight: 3.5,
    color: '#ffffff',
    opacity: 1,
    fillColor: '#00f2fe',
    fillOpacity: 0.52,
    dashArray: '',
    className: 'country-path-selected',
  };

  // Antarctica specific crystal-polar styling: razor-sharp laser contouring & translucent ice fill
  const antarcticaDefaultStyle = {
    fillColor: '#0284c7',
    weight: 1.2,
    opacity: 0.6,
    color: 'rgba(165, 243, 252, 0.45)',
    fillOpacity: 0.06,
    dashArray: '3, 4',
    className: 'country-path-base country-path-polar',
  };

  const antarcticaHoverStyle = {
    weight: 2.2,
    color: '#bae6fd',
    opacity: 1,
    fillColor: '#0284c7',
    fillOpacity: 0.14,
    className: 'country-path-elevated country-path-polar',
  };

  const antarcticaSelectedStyle = {
    weight: 2.6,
    color: '#ffffff',
    opacity: 1,
    fillColor: '#0284c7',
    fillOpacity: 0.18,
    dashArray: '',
    className: 'country-path-selected country-path-polar',
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Hard Geographic Bounds: Locks the map between 82°N and 82°S (Prevents polar overflow)
    const southWest = L.latLng(-82, -180);
    const northEast = L.latLng(82, 180);
    const worldBounds = L.latLngBounds(southWest, northEast);

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2.6,
      minZoom: 2.2,
      maxZoom: 18,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
      bounceAtZoomLimits: true,
      worldCopyJump: false,
      dragging: false, // Left click dragging DISABLED (left click is dedicated for selection)
    });

    mapInstanceRef.current = map;

    // Dedicated high z-index pane for interactive markers to ensure instant clicks
    const transitsPane = map.createPane('transitsPane');
    transitsPane.style.zIndex = '650';

    // Right-Click Drag to Pan implementation (clic droit maintenu pour déplacer)
    let isRightDragging = false;
    let lastRightPos = { x: 0, y: 0 };
    const container = mapContainerRef.current;

    const onContextMenu = (e) => {
      e.preventDefault();
    };
    container.addEventListener('contextmenu', onContextMenu);

    const onPointerDown = (e) => {
      if (e.button === 2) { // Right mouse button
        isRightDragging = true;
        lastRightPos = { x: e.clientX, y: e.clientY };
        container.classList.add('is-grabbing');
        document.body.classList.add('is-grabbing');
      }
    };

    const onPointerMove = (e) => {
      if (isRightDragging || (e.buttons & 2)) {
        const dx = e.clientX - lastRightPos.x;
        const dy = e.clientY - lastRightPos.y;
        lastRightPos = { x: e.clientX, y: e.clientY };
        map.panBy([-dx, -dy], { animate: false });
        sound.woosh();
      }
    };

    const onPointerUp = (e) => {
      if (e.button === 2 || e.buttons === 0) {
        isRightDragging = false;
        container.classList.remove('is-grabbing');
        document.body.classList.remove('is-grabbing');
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 1. ESRI World Imagery (Satellite HD - Default)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, bounds: worldBounds }
    );

    // 2. ESRI Dark Gray Canvas (Deep Dark, Zero watermark)
    const esriDarkBase = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, bounds: worldBounds }
    );
    const esriDarkLabels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, bounds: worldBounds }
    );
    const darkLayerGroup = L.layerGroup([esriDarkBase, esriDarkLabels]);

    // 3. OpenStreetMap
    const osmLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, bounds: worldBounds }
    );

    // Default layer: Satellite HD
    satelliteLayer.addTo(map);

    map._layersDict = {
      satellite: satelliteLayer,
      dark: darkLayerGroup,
      osm: osmLayer,
    };

    // Track cursor GPS coordinates (direct DOM text update, 0 React re-renders)
    map.on('mousemove', (e) => {
      const clampedLat = Math.max(-85, Math.min(85, e.latlng.lat));
      const clampedLng = ((((e.latlng.lng + 180) % 360) + 360) % 360) - 180;

      const latStr = `${Math.abs(clampedLat).toFixed(2)}° ${clampedLat >= 0 ? 'N' : 'S'}`;
      const lngStr = `${Math.abs(clampedLng).toFixed(2)}° ${clampedLng >= 0 ? 'E' : 'W'}`;

      if (coordLatRef.current) coordLatRef.current.textContent = latStr;
      if (coordLngRef.current) coordLngRef.current.textContent = lngStr;
    });

    // Close selected card & unhighlight when clicking empty ocean or map background
    map.on('click', () => {
      sound.click();
      if (selectedLayersRef.current.length > 0 && geoJsonLayerRef.current) {
        selectedLayersRef.current.forEach((l) => {
          geoJsonLayerRef.current.resetStyle(l);
          if (l._path) {
            l._path.classList.remove('country-path-selected', 'country-path-elevated');
          }
        });
        selectedLayersRef.current = [];
      } else if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.eachLayer((l) => {
          geoJsonLayerRef.current.resetStyle(l);
          if (l._path) {
            l._path.classList.remove('country-path-selected');
            l._path.classList.remove('country-path-elevated');
          }
        });
      }
      selectedGroupKeyRef.current = null;
      selectedLayerRef.current = null;
      if (hoveredGroupLayersRef.current.length > 0 && geoJsonLayerRef.current) {
        hoveredGroupLayersRef.current.forEach((l) => {
          geoJsonLayerRef.current.resetStyle(l);
          if (l._path) {
            l._path.classList.remove('country-path-elevated');
          }
        });
        hoveredGroupLayersRef.current = [];
      }
      hoveredGroupKeyRef.current = null;
      hoveredLayerRef.current = null;
      hoveredCountryIdRef.current = null;
      setSelectedTerritory(null);
      setHoveredTerritory(null);
      setInspectedTarget(null);
    });

    // Reset hover highlight as soon as cursor leaves the map viewport
    const onMapMouseLeave = () => {
      if (hoveredGroupLayersRef.current.length > 0 && geoJsonLayerRef.current) {
        hoveredGroupLayersRef.current.forEach((l) => {
          if (!selectedLayersRef.current.includes(l)) {
            geoJsonLayerRef.current.resetStyle(l);
            if (l._path) {
              l._path.classList.remove('country-path-elevated');
            }
          }
        });
        hoveredGroupLayersRef.current = [];
      }
      hoveredGroupKeyRef.current = null;
      hoveredLayerRef.current = null;
      hoveredCountryIdRef.current = null;
      setHoveredTerritory(null);
    };
    container.addEventListener('mouseleave', onMapMouseLeave);



    // ===================================================================
    // 2. Authentic Flightradar24 Canvas Engine (60 FPS Hardware-Accelerated)
    // ===================================================================
    const aviationLayer = L.layerGroup();
    aviationLayerRef.current = aviationLayer;

    const aviationCanvas = document.createElement('canvas');
    aviationCanvas.className = 'leaflet-aviation-traffic-canvas';
    aviationCanvas.style.position = 'absolute';
    aviationCanvas.style.top = '0';
    aviationCanvas.style.left = '0';
    aviationCanvas.style.width = '100%';
    aviationCanvas.style.height = '100%';
    aviationCanvas.style.pointerEvents = 'none';
    aviationCanvas.style.zIndex = '455';
    container.appendChild(aviationCanvas);

    let isAviationActive = activeLayers.has('aviation');
    aviationCanvas.style.display = isAviationActive ? 'block' : 'none';

    let currentRawFlights = [];
    let hoveredFlight = null;
    let hoverFlightTooltip = null;
    let animFrameAviationId = null;

    const renderFlightradarTooltipHtml = (fl) => {
      const routeStr = (fl.origin?.code && fl.destination?.code && fl.origin.code !== '—' && fl.destination.code !== '—')
        ? `${fl.origin.code} ➔ ${fl.destination.code}`
        : (fl.origin?.city && fl.destination?.city && fl.origin.city !== 'Départ ADS-B' && fl.destination.city !== 'Arrivée ADS-B')
        ? `${fl.origin.city} ➔ ${fl.destination.city}`
        : 'VOL EN ROUTE';

      const altFtStr = fl.altitudeFt ? `${fl.altitudeFt.toLocaleString('fr-FR')} ft` : '--';
      const flStr = fl.altitudeFt ? `FL${Math.round(fl.altitudeFt / 100)}` : '';
      const spdStr = fl.speedKts ? `${fl.speedKts} kts` : '--';
      const spdKmhStr = fl.speedKmh ? `${fl.speedKmh} km/h` : '';

      return `
        <div class="fr24-popup-card">
          <div class="fr24-pc-head">
            <div class="fr24-pc-badge">
              <span class="fr24-pc-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></span>
              <span class="fr24-pc-callsign">${fl.callsign || fl.flightNum || fl.icao}</span>
            </div>
            <div class="fr24-pc-airline">
              <span class="fr24-pc-airline-name">${fl.airline || 'Aviation'}</span>
            </div>
          </div>
          <div class="fr24-pc-route">${routeStr}</div>
          <div class="fr24-pc-aircraft">${fl.aircraft || fl.aircraftCode || 'Avion de ligne'}${fl.registration ? ` • <span class="fr24-pc-reg">${fl.registration}</span>` : ''}</div>
          <div class="fr24-pc-stats">
            <div class="fr24-pc-stat">
              <span class="fr24-pc-label">ALTITUDE</span>
              <span class="fr24-pc-val">${altFtStr} <small>${flStr}</small></span>
            </div>
            <div class="fr24-pc-stat">
              <span class="fr24-pc-label">VITESSE SOL</span>
              <span class="fr24-pc-val">${spdStr} <small>${spdKmhStr}</small></span>
            </div>
            <div class="fr24-pc-stat">
              <span class="fr24-pc-label">CAP</span>
              <span class="fr24-pc-val">${fl.track || fl.heading || 0}°</span>
            </div>
            <div class="fr24-pc-stat">
              <span class="fr24-pc-label">TRANSPONDEUR</span>
              <span class="fr24-pc-val mono">SQK ${fl.squawk || '1000'}</span>
            </div>
          </div>
          <div class="fr24-pc-footer">
            <span class="fr24-pc-live-indicator"><span class="fr24-pc-blink">●</span> DIRECT FLIGHTRADAR24</span>
            <span class="fr24-pc-hint">Cliquer pour inspecter</span>
          </div>
        </div>
      `;
    };

    const resizeAviationCanvas = () => {
      if (!map || !aviationCanvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      if (width === 0 || height === 0) return;
      if (aviationCanvas.width !== width * dpr || aviationCanvas.height !== height * dpr) {
        aviationCanvas.width = width * dpr;
        aviationCanvas.height = height * dpr;
      }
    };

    const drawFlightradarCanvas = () => {
      if (!map || !aviationCanvas || !isAviationActive) {
        if (aviationCanvas) {
          const ctx = aviationCanvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, aviationCanvas.width, aviationCanvas.height);
        }
        return;
      }

      resizeAviationCanvas();
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const ctx = aviationCanvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const limit = flightLimitRef.current || 500;
      const selectedId = inspectedTargetRef.current?.id;
      const hoveredId = hoveredFlight?.id;
      const zoom = map.getZoom();

      const bounds = map.getBounds();
      const minLat = bounds.getSouth() - 2;
      const maxLat = bounds.getNorth() + 2;
      const minLng = bounds.getWest() - 3;
      const maxLng = bounds.getEast() + 3;
      const spansAntimeridian = minLng > maxLng;

      const basePlaneSize = zoom <= 3 ? 12 : zoom <= 5 ? 15 : zoom <= 8 ? 18 : 22;
      let selectedFlightToDrawLast = null;
      let hoveredFlightToDrawLast = null;
      let drawnCount = 0;

      for (let i = 0; i < currentRawFlights.length; i++) {
        const fl = currentRawFlights[i];
        if (typeof fl.lat !== 'number' || typeof fl.lng !== 'number') continue;

        // Instant numeric culling before expensive CRS projection:
        if (fl.lat < minLat || fl.lat > maxLat) continue;
        if (!spansAntimeridian && (fl.lng < minLng || fl.lng > maxLng)) continue;

        const pt = map.latLngToContainerPoint([fl.lat, fl.lng]);

        // Fast screen bounds culling with 45px padding
        if (pt.x < -45 || pt.x > width + 45 || pt.y < -45 || pt.y > height + 45) {
          fl._scX = undefined;
          fl._scY = undefined;
          continue;
        }

        fl._scX = pt.x;
        fl._scY = pt.y;

        if (fl.id === selectedId) {
          selectedFlightToDrawLast = fl;
          continue;
        }
        if (fl.id === hoveredId) {
          hoveredFlightToDrawLast = fl;
          continue;
        }

        if (drawnCount >= limit) continue;
        drawnCount++;

        const isWidebody = fl.aircraftCode?.startsWith('A38') || fl.aircraftCode?.startsWith('B77') || fl.aircraftCode?.startsWith('B74') || fl.aircraftCode?.startsWith('A35') || fl.aircraftCode?.startsWith('B78');
        const planeSize = isWidebody ? basePlaneSize * 1.22 : basePlaneSize;
        const track = fl.track || fl.heading || 0;

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate((track * Math.PI) / 180);

        // Soft aerial drop-shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1.5;

        // Accurate commercial jet airliner silhouette
        ctx.beginPath();
        ctx.moveTo(0, -planeSize * 0.52); // Nose tip
        ctx.lineTo(planeSize * 0.1, -planeSize * 0.12);
        ctx.lineTo(planeSize * 0.52, planeSize * 0.14); // Right wing tip
        ctx.lineTo(planeSize * 0.52, planeSize * 0.22);
        ctx.lineTo(planeSize * 0.1, planeSize * 0.12);
        ctx.lineTo(planeSize * 0.1, planeSize * 0.38); // Fuselage body
        ctx.lineTo(planeSize * 0.26, planeSize * 0.48); // Right horizontal stabilizer
        ctx.lineTo(planeSize * 0.26, planeSize * 0.54);
        ctx.lineTo(0, planeSize * 0.46); // Tail cone
        ctx.lineTo(-planeSize * 0.26, planeSize * 0.54);
        ctx.lineTo(-planeSize * 0.26, planeSize * 0.48);
        ctx.lineTo(-planeSize * 0.1, planeSize * 0.38);
        ctx.lineTo(-planeSize * 0.1, planeSize * 0.12);
        ctx.lineTo(-planeSize * 0.52, planeSize * 0.22);
        ctx.lineTo(-planeSize * 0.52, planeSize * 0.14); // Left wing tip
        ctx.lineTo(-planeSize * 0.1, -planeSize * 0.12);
        ctx.closePath();

        ctx.fillStyle = '#ffd700'; // Official Flightradar24 yellow
        ctx.fill();
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.9)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();

        // FR24 Flight label box when zoomed in (zoom >= 7)
        if (zoom >= 7) {
          const callsign = fl.callsign || fl.flightNum || fl.icao;
          const altText = fl.altitudeFt ? `FL${Math.round(fl.altitudeFt / 100)}` : '';
          const spdText = fl.speedKts ? `${fl.speedKts}k` : '';
          const subText = [altText, spdText].filter(Boolean).join(' • ');

          ctx.save();
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          const textW = Math.max(ctx.measureText(callsign).width, ctx.measureText(subText).width) + 8;
          const tagX = pt.x - textW / 2;
          const tagY = pt.y + planeSize * 0.55;

          ctx.fillStyle = 'rgba(10, 15, 25, 0.82)';
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.roundRect(tagX, tagY, textW, subText ? 22 : 13, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(callsign, pt.x, tagY + 9);

          if (subText) {
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.fillStyle = '#fef08a';
            ctx.fillText(subText, pt.x, tagY + 18);
          }
          ctx.restore();
        }
      }

      // Draw hovered flight highlighted
      if (hoveredFlightToDrawLast && hoveredFlightToDrawLast.id !== selectedId) {
        const fl = hoveredFlightToDrawLast;
        const px = fl._scX;
        const py = fl._scY;
        const pSize = basePlaneSize * 1.35;
        const track = fl.track || fl.heading || 0;

        ctx.save();
        // Golden aura ring
        ctx.beginPath();
        ctx.arc(px, py, pSize * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.22)';
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.translate(px, py);
        ctx.rotate((track * Math.PI) / 180);

        ctx.beginPath();
        ctx.moveTo(0, -pSize * 0.52);
        ctx.lineTo(pSize * 0.1, -pSize * 0.12);
        ctx.lineTo(pSize * 0.52, pSize * 0.14);
        ctx.lineTo(pSize * 0.52, pSize * 0.22);
        ctx.lineTo(pSize * 0.1, pSize * 0.12);
        ctx.lineTo(pSize * 0.1, pSize * 0.38);
        ctx.lineTo(pSize * 0.26, pSize * 0.48);
        ctx.lineTo(pSize * 0.26, pSize * 0.54);
        ctx.lineTo(0, pSize * 0.46);
        ctx.lineTo(-pSize * 0.26, pSize * 0.54);
        ctx.lineTo(-pSize * 0.26, pSize * 0.48);
        ctx.lineTo(-pSize * 0.1, pSize * 0.38);
        ctx.lineTo(-pSize * 0.1, pSize * 0.12);
        ctx.lineTo(-pSize * 0.52, pSize * 0.22);
        ctx.lineTo(-pSize * 0.52, pSize * 0.14);
        ctx.lineTo(-pSize * 0.1, -pSize * 0.12);
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      // Draw selected flight with pulsing cyan reticle ring
      if (selectedFlightToDrawLast) {
        const fl = selectedFlightToDrawLast;
        const px = fl._scX;
        const py = fl._scY;
        const pSize = basePlaneSize * 1.5;
        const track = fl.track || fl.heading || 0;

        ctx.save();
        // Pulsing radar reticle
        ctx.beginPath();
        ctx.arc(px, py, pSize * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        ctx.translate(px, py);
        ctx.rotate((track * Math.PI) / 180);

        ctx.beginPath();
        ctx.moveTo(0, -pSize * 0.52);
        ctx.lineTo(pSize * 0.1, -pSize * 0.12);
        ctx.lineTo(pSize * 0.52, pSize * 0.14);
        ctx.lineTo(pSize * 0.52, pSize * 0.22);
        ctx.lineTo(pSize * 0.1, pSize * 0.12);
        ctx.lineTo(pSize * 0.1, pSize * 0.38);
        ctx.lineTo(pSize * 0.26, pSize * 0.48);
        ctx.lineTo(pSize * 0.26, pSize * 0.54);
        ctx.lineTo(0, pSize * 0.46);
        ctx.lineTo(-pSize * 0.26, pSize * 0.54);
        ctx.lineTo(-pSize * 0.26, pSize * 0.48);
        ctx.lineTo(-pSize * 0.1, pSize * 0.38);
        ctx.lineTo(-pSize * 0.1, pSize * 0.12);
        ctx.lineTo(-pSize * 0.52, pSize * 0.22);
        ctx.lineTo(-pSize * 0.52, pSize * 0.14);
        ctx.lineTo(-pSize * 0.1, -pSize * 0.12);
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    const requestDrawAviation = () => {
      if (!isAviationActive) return;
      if (animFrameAviationId) return;
      animFrameAviationId = requestAnimationFrame(() => {
        animFrameAviationId = null;
        drawFlightradarCanvas();
      });
    };

    const updateFlightradarPlanes = (flightsList) => {
      if (flightsList) currentRawFlights = flightsList;
      if (!isAviationActive) return;
      requestDrawAviation();
    };

    updateFlightradarPlanesRef.current = updateFlightradarPlanes;

    // Layer lifecycle listeners for Aviation
    aviationLayer.on('add', () => {
      isAviationActive = true;
      aviationCanvas.style.display = 'block';
      requestDrawAviation();
    });
    aviationLayer.on('remove', () => {
      isAviationActive = false;
      aviationCanvas.style.display = 'none';
      if (hoverFlightTooltip && map.hasLayer(hoverFlightTooltip)) {
        map.removeLayer(hoverFlightTooltip);
      }
      const ctx = aviationCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, aviationCanvas.width, aviationCanvas.height);
    });

    if (isAviationActive) {
      aviationLayer.addTo(map);
    }

    // Subscribe to Flightradar24 live stream
    const unsubscribeFR24 = flightRadarService.subscribe((flights) => {
      updateFlightradarPlanes(flights);
    });

    // ===================================================================
    // 2b. Maritime Shipping Lanes Layer (Authentic MarineTraffic 60 FPS Canvas Engine)
    // ===================================================================
    const maritimeLayer = L.layerGroup();
    maritimeLayerRef.current = maritimeLayer;

    // Create high-performance HTML5 Canvas overlay inside the map container
    const maritimeCanvas = document.createElement('canvas');
    maritimeCanvas.className = 'leaflet-maritime-traffic-canvas';
    maritimeCanvas.style.position = 'absolute';
    maritimeCanvas.style.top = '0';
    maritimeCanvas.style.left = '0';
    maritimeCanvas.style.width = '100%';
    maritimeCanvas.style.height = '100%';
    maritimeCanvas.style.pointerEvents = 'none';
    maritimeCanvas.style.zIndex = '450';
    container.appendChild(maritimeCanvas);

    let isMaritimeActive = activeLayers.has('maritime');
    maritimeCanvas.style.display = isMaritimeActive ? 'block' : 'none';

    let currentRawVessels = [];
    let hoveredVessel = null;
    let hoverMaritimeTooltip = null;
    let animFrameMaritimeId = null;

    const MARITIME_PALETTE = {
      container: '#22c55e',      // Lime Green (ULCV / Containers)
      cargo: '#10b981',          // Emerald Green (General Cargo / Ro-Ro)
      tanker: '#ef4444',         // Bright Red (Crude VLCC)
      product_tanker: '#f43f5e', // Crimson Red (Chemical / Product Tankers)
      lng: '#c084fc',            // Vivid Purple (LNG Cryogenic Carriers)
      bulk: '#0ea5e9',           // Sky Blue (Capesize / Panamax Bulkers)
      passenger: '#2563eb',      // Royal Blue (Cruise / Ferries)
      tug: '#06b6d4',            // Aqua Cyan (Tugs & Port Assistance)
      fishing: '#f97316',        // Vibrant Orange (Ocean Fishing)
      military: '#94a3b8',       // Steel Grey (Naval & Coast Guard)
      pleasure: '#e879f9',       // Violet (Yachts & Sailing)
      default: '#22c55e',
    };

    const renderMarineTrafficTooltipHtml = (ves) => {
      const spdKtsStr = ves.speedKts !== undefined ? `${ves.speedKts} kts` : '--';
      const spdKmhStr = ves.speedKmh ? `${ves.speedKmh} km/h` : '';
      const courseStr = `${ves.course || ves.heading || 0}° COG`;
      const typeColor = MARITIME_PALETTE[ves.category] || ves.color || '#22c55e';
      const flagCode = ves.flagCode || ves.flag || (ves.country ? ves.country.slice(0, 3).toUpperCase() : 'AIS');
      const dims = ves.lengthM && ves.beamM ? `${ves.lengthM}m × ${ves.beamM}m` : '--';
      const draught = ves.draughtM ? `${ves.draughtM}m` : '--';
      const status = ves.status || 'Faisant route au moteur';
      const isRealAis = ves.isLiveAis === true;
      const destination = ves.destination || ves.destinationPort || null;
      const origin = ves.originPort || null;

      // Route display: show real destination from AIS when available
      const routeHtml = destination
        ? `<div class="mt-card-route">
            ${origin ? `<span class="mt-port">${origin}</span><span class="mt-route-arrow">➔</span>` : '<span class="mt-port" style="color:#94a3b8;">DESTINATION</span><span class="mt-route-arrow">➔</span>'}
            <span class="mt-port">${destination}</span>
          </div>`
        : (origin ? `<div class="mt-card-route">
            <span class="mt-port">${origin}</span>
            <span class="mt-route-arrow">➔</span>
            <span class="mt-port" style="color:#64748b;">--</span>
          </div>` : '');

      return `
        <div class="marinetraffic-popup-card">
          <div class="mt-card-header">
            <div class="mt-card-title-group">
              <span class="mt-vessel-flag" style="font-family: monospace; font-size: 9px; color: #00f5a0; background: rgba(0,245,160,0.12); padding: 1px 4px; border-radius: 2px;">[${flagCode}]</span>
              <span class="mt-vessel-name">${ves.name}</span>
            </div>
            <span class="mt-vessel-type" style="color: ${typeColor}; border-color: ${typeColor}66; background: ${typeColor}15;">
              ${ves.type || 'Cargo / Fret'}
            </span>
          </div>

          ${routeHtml}

          <div class="mt-card-grid">
            <div class="mt-cell">
              <span class="mt-cell-label">Vitesse surface (SOG)</span>
              <span class="mt-cell-value cyan">${spdKtsStr} <small style="font-size: 9px; color: #94a3b8;">${spdKmhStr}</small></span>
            </div>
            <div class="mt-cell">
              <span class="mt-cell-label">Cap / Route (COG)</span>
              <span class="mt-cell-value">${courseStr}</span>
            </div>
            <div class="mt-cell">
              <span class="mt-cell-label">Dimensions / Tirant d'eau</span>
              <span class="mt-cell-value dim">${dims}${draught !== '--' ? ` • TE ${draught}` : ''}</span>
            </div>
            <div class="mt-cell">
              <span class="mt-cell-label">Identifiant AIS</span>
              <span class="mt-cell-value dim">${ves.imo ? `IMO ${ves.imo} • ` : ''}MMSI ${ves.mmsi || '--'}${ves.callsign ? ` • ${ves.callsign}` : ''}</span>
            </div>
            <div class="mt-cell mt-cell-full">
              <span class="mt-cell-label">Statut navigation</span>
              <span class="mt-cell-value" style="font-size: 10px; color: #cbd5e1;">${status}</span>
            </div>
          </div>

          <div class="mt-card-footer">
            <span class="mt-badge-live">
              <span class="mt-pulse-dot">●</span> ${isRealAis ? 'AIS DIRECT LIVE' : 'AIS FLOTTE MONDIALE'}
            </span>
            <span class="mt-card-hint">CLIC POUR INSPECTION DOSSIER</span>
          </div>
        </div>
      `;
    };

    const resizeMaritimeCanvas = () => {
      if (!map || !maritimeCanvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      if (width === 0 || height === 0) return;
      if (maritimeCanvas.width !== width * dpr || maritimeCanvas.height !== height * dpr) {
        maritimeCanvas.width = width * dpr;
        maritimeCanvas.height = height * dpr;
      }
    };

    const drawMarineTrafficCanvas = () => {
      if (!map || !maritimeCanvas || !isMaritimeActive) {
        if (maritimeCanvas) {
          const ctx = maritimeCanvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, maritimeCanvas.width, maritimeCanvas.height);
        }
        return;
      }

      resizeMaritimeCanvas();
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const ctx = maritimeCanvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const limit = vesselLimitRef.current || 1000;
      const selectedId = inspectedTargetRef.current?.id;
      const hoveredId = hoveredVessel?.id;
      const zoom = map.getZoom();

      const bounds = map.getBounds();
      const minLat = bounds.getSouth() - 1.5;
      const maxLat = bounds.getNorth() + 1.5;
      const minLng = bounds.getWest() - 2.5;
      const maxLng = bounds.getEast() + 2.5;
      const spansAntimeridian = minLng > maxLng;

      // Dynamic sizing based on zoom level: crisp, luminous chevrons matching MarineTraffic
      const baseLen = zoom <= 3 ? 9.2 : zoom <= 5 ? 12.0 : zoom <= 8 ? 15.5 : 19.0;
      const baseWidth = zoom <= 3 ? 5.6 : zoom <= 5 ? 7.2 : zoom <= 8 ? 9.0 : 11.2;
      const circleRadius = zoom <= 3 ? 2.6 : zoom <= 5 ? 3.4 : 4.4;

      let selectedVesselToDrawLast = null;
      let hoveredVesselToDrawLast = null;
      let drawnCount = 0;

      for (let i = 0; i < currentRawVessels.length; i++) {
        const ves = currentRawVessels[i];
        if (typeof ves.lat !== 'number' || typeof ves.lng !== 'number') continue;

        // Instant numeric culling before expensive CRS projection:
        if (ves.lat < minLat || ves.lat > maxLat) continue;
        if (!spansAntimeridian && (ves.lng < minLng || ves.lng > maxLng)) continue;

        const pt = map.latLngToContainerPoint([ves.lat, ves.lng]);

        // Fast viewport culling with 35px margin
        if (pt.x < -35 || pt.x > width + 35 || pt.y < -35 || pt.y > height + 35) {
          ves._scX = undefined;
          ves._scY = undefined;
          continue;
        }

        ves._scX = pt.x;
        ves._scY = pt.y;

        if (ves.id === selectedId) {
          selectedVesselToDrawLast = ves;
          continue;
        }
        if (ves.id === hoveredId) {
          hoveredVesselToDrawLast = ves;
          continue;
        }

        if (drawnCount >= limit) continue;
        drawnCount++;

        const isUnderway = (ves.speedKts !== undefined ? ves.speedKts : 10) >= 0.6 &&
          ves.status !== 'Au mouillage' && ves.status !== 'Amarré à quai';
        const color = MARITIME_PALETTE[ves.category] || ves.color || '#22c55e';

        if (isUnderway) {
          const heading = ves.course || ves.heading || 0;
          const rad = (heading * Math.PI) / 180;

          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(rad);

          // Forward speed vector projecting ahead from the bow (MarineTraffic standard)
          if (zoom >= 4.0 && ves.speedKts && ves.speedKts >= 1.0) {
            const vectorLen = Math.min(26, Math.max(5, ves.speedKts * (zoom >= 7 ? 1.6 : 0.95)));
            ctx.beginPath();
            ctx.moveTo(0, -baseLen * 0.7);
            ctx.lineTo(0, -baseLen * 0.7 - vectorLen);
            ctx.strokeStyle = color;
            ctx.lineWidth = zoom >= 6 ? 1.4 : 0.9;
            ctx.stroke();
          }

          // Authentic MarineTraffic pointed vessel chevron
          ctx.beginPath();
          ctx.moveTo(0, -baseLen * 0.7);
          ctx.lineTo(baseWidth * 0.5, baseLen * 0.45);
          ctx.lineTo(0, baseLen * 0.2);
          ctx.lineTo(-baseWidth * 0.5, baseLen * 0.45);
          ctx.closePath();

          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(5, 12, 24, 0.45)';
          ctx.lineWidth = 0.5;
          ctx.stroke();

          ctx.restore();
        } else {
          // Stopped / Anchored ship: crisp diamond / dot
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, circleRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(5, 12, 24, 0.45)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Draw hovered vessel highlighted
      if (hoveredVesselToDrawLast && hoveredVesselToDrawLast.id !== selectedId) {
        const ves = hoveredVesselToDrawLast;
        const px = ves._scX;
        const py = ves._scY;
        const isUnderway = (ves.speedKts !== undefined ? ves.speedKts : 10) >= 0.6 &&
          ves.status !== 'Au mouillage' && ves.status !== 'Amarré à quai';

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();

        if (isUnderway) {
          const heading = ves.course || ves.heading || 0;
          const rad = (heading * Math.PI) / 180;
          ctx.translate(px, py);
          ctx.rotate(rad);

          ctx.beginPath();
          ctx.moveTo(0, -baseLen * 0.75);
          ctx.lineTo(baseWidth * 0.6, baseLen * 0.5);
          ctx.lineTo(0, baseLen * 0.3);
          ctx.lineTo(-baseWidth * 0.6, baseLen * 0.5);
          ctx.closePath();

          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#00f5a0';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, circleRadius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#00f5a0';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw selected vessel with high visibility cyan/gold halo
      if (selectedVesselToDrawLast) {
        const ves = selectedVesselToDrawLast;
        const px = ves._scX;
        const py = ves._scY;
        const isUnderway = (ves.speedKts !== undefined ? ves.speedKts : 10) >= 0.6 &&
          ves.status !== 'Au mouillage' && ves.status !== 'Amarré à quai';

        ctx.save();
        // Pulsing radar ring
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 245, 160, 0.22)';
        ctx.fill();
        ctx.strokeStyle = '#00f5a0';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        if (isUnderway) {
          const heading = ves.course || ves.heading || 0;
          const rad = (heading * Math.PI) / 180;
          const sLen = baseLen * 1.5;
          const sWidth = baseWidth * 1.5;

          ctx.translate(px, py);
          ctx.rotate(rad);

          ctx.beginPath();
          ctx.moveTo(0, -sLen * 0.65);
          ctx.lineTo(sWidth * 0.5, sLen * 0.45);
          ctx.lineTo(0, sLen * 0.25);
          ctx.lineTo(-sWidth * 0.5, sLen * 0.45);
          ctx.closePath();

          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#00f5a0';
          ctx.lineWidth = 2.0;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, circleRadius * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#00f5a0';
          ctx.lineWidth = 2.0;
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();
    };

    const requestDrawMaritime = () => {
      if (!isMaritimeActive) return;
      if (animFrameMaritimeId) return;
      animFrameMaritimeId = requestAnimationFrame(() => {
        animFrameMaritimeId = null;
        drawMarineTrafficCanvas();
      });
    };

    const updateMarineTrafficVessels = (vesselsList) => {
      if (vesselsList) currentRawVessels = vesselsList;
      if (!isMaritimeActive) return;
      requestDrawMaritime();
    };

    updateMarineTrafficVesselsRef.current = updateMarineTrafficVessels;

    // Layer lifecycle listeners for Maritime
    maritimeLayer.on('add', () => {
      isMaritimeActive = true;
      maritimeCanvas.style.display = 'block';
      requestDrawMaritime();
    });
    maritimeLayer.on('remove', () => {
      isMaritimeActive = false;
      maritimeCanvas.style.display = 'none';
      if (hoverMaritimeTooltip && map.hasLayer(hoverMaritimeTooltip)) {
        map.removeLayer(hoverMaritimeTooltip);
      }
      const ctx = maritimeCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, maritimeCanvas.width, maritimeCanvas.height);
    });

    if (isMaritimeActive) {
      maritimeLayer.addTo(map);
    }

    // Subscribe to MarineTraffic live stream
    const unsubscribeMarine = marineTrafficService.subscribe((vessels) => {
      updateMarineTrafficVessels(vessels);
    });

    // ===================================================================
    // High-Performance Unified Mouse Interactions (Aviation & Maritime)
    // ===================================================================
    const onMapMouseMove = (e) => {
      if (!map) return;
      const mx = e.containerPoint.x;
      const my = e.containerPoint.y;

      // 1. Check Aviation first (Planes fly in sky above ships)
      let closestFlight = null;
      if (isAviationActive) {
        let minDistSq = 225; // 15px radius
        for (let i = 0; i < currentRawFlights.length; i++) {
          const fl = currentRawFlights[i];
          if (fl._scX === undefined) continue;
          const dx = fl._scX - mx;
          const dy = fl._scY - my;
          if (Math.abs(dx) > 15 || Math.abs(dy) > 15) continue;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            closestFlight = fl;
          }
        }
      }

      if (closestFlight !== hoveredFlight) {
        hoveredFlight = closestFlight;
        if (hoveredFlight) {
          container.style.cursor = 'pointer';
          sound.hover(0.12);
          if (!hoverFlightTooltip) {
            hoverFlightTooltip = L.tooltip({
              className: 'fr24-tactical-leaflet-tooltip',
              direction: 'top',
              offset: [0, -12],
              opacity: 1,
              interactive: false,
            });
          }
          hoverFlightTooltip.setLatLng([hoveredFlight.lat, hoveredFlight.lng]);
          hoverFlightTooltip.setContent(renderFlightradarTooltipHtml(hoveredFlight));
          if (!map.hasLayer(hoverFlightTooltip)) {
            hoverFlightTooltip.addTo(map);
          }
          if (hoverMaritimeTooltip && map.hasLayer(hoverMaritimeTooltip)) {
            map.removeLayer(hoverMaritimeTooltip);
          }
          requestDrawAviation();
          return;
        } else {
          if (hoverFlightTooltip && map.hasLayer(hoverFlightTooltip)) {
            map.removeLayer(hoverFlightTooltip);
          }
          requestDrawAviation();
        }
      }

      if (hoveredFlight) return;

      // 2. Check Maritime Vessels
      let closestVessel = null;
      if (isMaritimeActive) {
        let minDistSq = 196; // 14px radius
        for (let i = 0; i < currentRawVessels.length; i++) {
          const ves = currentRawVessels[i];
          if (ves._scX === undefined) continue;
          const dx = ves._scX - mx;
          const dy = ves._scY - my;
          if (Math.abs(dx) > 14 || Math.abs(dy) > 14) continue;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            closestVessel = ves;
          }
        }
      }

      if (closestVessel !== hoveredVessel) {
        hoveredVessel = closestVessel;
        if (hoveredVessel) {
          container.style.cursor = 'pointer';
          sound.hover(0.12);
          if (!hoverMaritimeTooltip) {
            hoverMaritimeTooltip = L.tooltip({
              className: 'marinetraffic-tactical-leaflet-tooltip',
              direction: 'top',
              offset: [0, -10],
              opacity: 1,
              interactive: false,
            });
          }
          hoverMaritimeTooltip.setLatLng([hoveredVessel.lat, hoveredVessel.lng]);
          hoverMaritimeTooltip.setContent(renderMarineTrafficTooltipHtml(hoveredVessel));
          if (!map.hasLayer(hoverMaritimeTooltip)) {
            hoverMaritimeTooltip.addTo(map);
          }
        } else {
          container.style.cursor = '';
          if (hoverMaritimeTooltip && map.hasLayer(hoverMaritimeTooltip)) {
            map.removeLayer(hoverMaritimeTooltip);
          }
        }
        requestDrawMaritime();
      }

      // 3. If cursor is moving over open ocean / non-country elements, reset hovered country key
      const targetEl = e.originalEvent?.target;
      if (targetEl && !targetEl.closest?.('.leaflet-interactive')) {
        if (hoveredCountryIdRef.current !== null) {
          hoveredCountryIdRef.current = null;
          setHoveredTerritory(null);
        }
      }
    };

    const onMapClick = (e) => {
      if (!map) return;
      const mx = e.containerPoint.x;
      const my = e.containerPoint.y;

      // 1. Check Aviation click
      if (isAviationActive) {
        for (let i = 0; i < currentRawFlights.length; i++) {
          const fl = currentRawFlights[i];
          if (fl._scX === undefined) continue;
          const dx = fl._scX - mx;
          const dy = fl._scY - my;
          if (dx * dx + dy * dy <= 289) { // 17px radius
            sound.click();
            setInspectedTarget({ type: 'flight', ...fl });
            requestDrawAviation();
            return;
          }
        }
      }

      // 2. Check Maritime click
      if (isMaritimeActive) {
        for (let i = 0; i < currentRawVessels.length; i++) {
          const ves = currentRawVessels[i];
          if (ves._scX === undefined) continue;
          const dx = ves._scX - mx;
          const dy = ves._scY - my;
          if (dx * dx + dy * dy <= 225) { // 15px radius
            sound.click();
            setInspectedTarget({ type: 'vessel', ...ves });
            requestDrawMaritime();
            return;
          }
        }
      }
    };

    // Viewport change listener: redraws canvas & dynamically fetches live FR24 bounds
    const onMapMoveEnd = () => {
      requestDrawAviation();
      requestDrawMaritime();
      if (isAviationActive && map) {
        const b = map.getBounds();
        const boundsStr = `${b.getNorth().toFixed(2)},${b.getSouth().toFixed(2)},${b.getWest().toFixed(2)},${b.getEast().toFixed(2)}`;
        flightRadarService.fetchViewportFeed(boundsStr);
      }
    };

    map.on('mousemove', onMapMouseMove);
    map.on('click', onMapClick);
    map.on('move', () => { requestDrawAviation(); requestDrawMaritime(); });
    map.on('zoom', () => { requestDrawAviation(); requestDrawMaritime(); });
    map.on('viewreset', () => { requestDrawAviation(); requestDrawMaritime(); });
    map.on('resize', () => { requestDrawAviation(); requestDrawMaritime(); });
    map.on('moveend', onMapMoveEnd);

    // 3. Cyber warfare layer (Kaspersky Cybermap Style Curved Trajectories + Interactive Telemetry)
    const cyberLayer = L.layerGroup();
    cyberLayerRef.current = cyberLayer;
    CYBER_ATTACK_VECTORS.forEach((vec) => {
      const color = vec.color || (vec.severity === 'CRITICAL' ? '#ef4444' : '#8b5cf6');

      // Curved Geodesic Interpolation with slight lateral curvature
      const midLat = (vec.from[0] + vec.to[0]) / 2 + Math.sin((vec.from[1] - vec.to[1]) * 0.02) * 8;
      const midLng = (vec.from[1] + vec.to[1]) / 2;
      const arcPts = [vec.from, [midLat, midLng], vec.to];

      const line = L.polyline(arcPts, {
        color,
        weight: 2.2,
        opacity: 0.8,
        dashArray: '5, 8',
      });

      line.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'cyber', ...vec });
      });
      line.addTo(cyberLayer);

      // Source origin emitter marker
      const srcMarker = L.circleMarker(vec.from, {
        radius: 3.5,
        color,
        fillColor: '#ffffff',
        fillOpacity: 0.9,
        weight: 1.5,
      });
      srcMarker.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'cyber', ...vec });
      });
      srcMarker.addTo(cyberLayer);

      // Destination target impact shockwave marker
      const dstMarker = L.circleMarker(vec.to, {
        radius: 6,
        color,
        fillColor: color,
        fillOpacity: 0.45,
        weight: 2,
      });
      dstMarker.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'cyber', ...vec });
      });
      dstMarker.addTo(cyberLayer);
    });

    // 4. Geopolitical conflicts layer (Hotspot Zones & Ballistic Trajectories)
    const conflictsLayer = L.layerGroup();
    conflictsLayerRef.current = conflictsLayer;

    const updateConflicts = (year) => {
      conflictsLayer.clearLayers();
      const zones = getGeopoliticalZonesForYear(year);

      zones.forEach((zone) => {
        const strokeColor = zone.defcon === 'DÉFCON 1' ? '#ff0033' : zone.defcon === 'DÉFCON 2' ? '#ff2a4d' : '#ffb703';
        const circle = L.circle([zone.lat, zone.lng], {
          radius: (zone.radiusKm || 320) * 1000,
          color: strokeColor,
          fillColor: strokeColor,
          fillOpacity: 0.18,
          weight: 1.5,
          dashArray: '4, 6',
        });

        // Pulsing animated radar marker icon at the center
        const radarIcon = L.divIcon({
          className: 'conflict-radar-marker',
          html: `
            <div class="conflict-radar-core">
              <div class="conflict-pulse-ring" style="border-color:${strokeColor}"></div>
              <div class="conflict-center-dot" style="background:${strokeColor};box-shadow:0 0 8px ${strokeColor}"></div>
              <span class="conflict-defcon-tag">${zone.defcon || 'ALERTE'}</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([zone.lat, zone.lng], { icon: radarIcon });

        const tooltipHtml = `
          <div class="conflict-tooltip-box">
            <div class="ct-header" style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:4px;margin-bottom:4px;">
              <span style="font-family:monospace;font-size:9.5px;font-weight:800;color:${strokeColor};background:rgba(255,42,77,0.15);padding:1px 5px;border-radius:4px;margin-right:6px;">${zone.defcon || 'ALERTE'}</span>
              <strong style="color:#ffffff;font-size:11.5px;">${zone.name}</strong>
            </div>
            <div style="font-size:10.5px;color:#cbd5e1;line-height:1.4;">${zone.status}</div>
            <div style="font-size:10px;color:#ff3366;margin-top:2px;">${zone.alert}</div>
            ${zone.activeMissiles ? `<div style="font-size:9.5px;color:#ffb703;font-family:monospace;margin-top:2px;">🚀 MISSILES ACTIFS : ${zone.activeMissiles}</div>` : ''}
            <div style="font-size:9px;color:#00f2fe;margin-top:4px;font-family:monospace;">CLIQUER POUR DOSSIER DE CRISE →</div>
          </div>
        `;
        circle.bindTooltip(tooltipHtml);
        marker.bindTooltip(tooltipHtml);

        const handleClick = (e) => {
          if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
          sound.click();
          setInspectedTarget({ type: 'conflict', ...zone });
        };
        circle.on('click', handleClick);
        marker.on('click', handleClick);
        circle.addTo(conflictsLayer);
        marker.addTo(conflictsLayer);
      });

      // If contemporary era (>= 2020), also render ballistic trajectories
      if (year >= 2020) {
        BALLISTIC_TRAJECTORIES.forEach((traj) => {
          const start = [traj.startLat, traj.startLng];
          const end = [traj.endLat, traj.endLng];

          const arcLine = L.polyline([start, end], {
            color: traj.color || '#ff2a4d',
            weight: 2,
            opacity: 0.85,
            dashArray: '6, 8',
          });

          // Launch marker
          const launchIcon = L.divIcon({
            className: 'traj-launch-marker',
            html: `<div style="width:8px;height:8px;border-radius:50%;background:#ffffff;border:2px solid ${traj.color || '#ff2a4d'};box-shadow:0 0 8px ${traj.color}"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });
          const launchMarker = L.marker(start, { icon: launchIcon });

          // Target marker
          const targetIcon = L.divIcon({
            className: 'traj-target-marker',
            html: `<div style="width:10px;height:10px;border-radius:50%;background:${traj.color || '#ff2a4d'};border:2px solid #ffffff;box-shadow:0 0 10px ${traj.color}"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          });
          const targetMarker = L.marker(end, { icon: targetIcon });

          const trajTooltip = `
            <div class="traj-tooltip-box">
              <div style="font-family:monospace;font-size:9.5px;font-weight:800;color:${traj.color};margin-bottom:2px;">${traj.alert}</div>
              <strong style="color:#ffffff;font-size:11px;">${traj.name}</strong>
              <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${traj.weapon}</div>
              <div style="font-size:9.5px;color:#00f5a0;margin-top:2px;">${traj.status}</div>
              <div style="font-size:9px;color:#00f2fe;margin-top:4px;font-family:monospace;">CLIQUER POUR TÉLÉMÉTRIE BALISTIQUE →</div>
            </div>
          `;
          arcLine.bindTooltip(trajTooltip);
          targetMarker.bindTooltip(trajTooltip);

          const handleTrajClick = (e) => {
            if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
            sound.click();
            setInspectedTarget({
              type: 'conflict',
              name: traj.name,
              defcon: 'ALERTE BALISTIQUE',
              status: traj.status,
              alert: traj.alert,
              details: `${traj.weapon} — De ${traj.origin} vers ${traj.target}. ${traj.details}`,
              activeMissiles: 1,
              speedMach: traj.speedMach,
              apogeeKm: traj.apogeeKm,
            });
          };

          arcLine.on('click', handleTrajClick);
          targetMarker.on('click', handleTrajClick);

          arcLine.addTo(conflictsLayer);
          launchMarker.addTo(conflictsLayer);
          targetMarker.addTo(conflictsLayer);
        });
      }
    };

    updateConflictsLayerRef.current = updateConflicts;
    updateConflicts(selectedYear);

    // 5. Telluric earthquakes layer
    const telluricLayer = L.layerGroup();
    telluricLayerRef.current = telluricLayer;
    const updateTelluricMarkers = (eqList) => {
      telluricLayer.clearLayers();
      (eqList || []).slice(0, 50).forEach((eq) => {
        const mag = parseFloat(eq.mag) || 3.0;
        const color = mag >= 5.0 ? '#ff2a4d' : mag >= 4.0 ? '#ffb703' : '#00f2fe';
        const circle = L.circle([eq.lat, eq.lng], {
          radius: mag * 35000,
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 1.5,
        });
        circle.bindTooltip(`<b>SÉISME M ${eq.mag}</b><br/>${eq.place}<br/>Prof: ${eq.depth} km • ${eq.time}<br/><i style="color:#ffb703;">Cliquer pour fiche sismique</i>`);
        circle.on('click', (e) => {
          if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
          sound.click();
          setInspectedTarget({ type: 'earthquake', ...eq });
        });
        circle.addTo(telluricLayer);
      });
    };

    // 6. CCTV live cameras & Live News Channels layer (Global OSINT streams)
    const cctvLayer = L.layerGroup();
    cctvLayerRef.current = cctvLayer;
    CCTV_FEEDS.forEach((cam) => {
      const icon = L.divIcon({
        className: 'cctv-div-icon-wrapper',
        html: `<div class="cctv-div-marker" title="${cam.name}"><span class="cctv-marker-dot"></span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([cam.lat, cam.lng], { icon, pane: 'transitsPane' });
      marker.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'cctv', ...cam });
        if (onSelectCCTV) onSelectCCTV(cam);
      });
      marker.addTo(cctvLayer);
    });

    // 6.2. World TV Channels (National & Generalist Networks)
    (WORLD_TV_CHANNELS || []).forEach((tv) => {
      const icon = L.divIcon({
        className: 'news-div-icon-wrapper',
        html: `<div class="news-div-marker" title="${tv.name} (${tv.network})"><span class="news-marker-dot"></span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([tv.lat, tv.lng], { icon, pane: 'transitsPane' });
      marker.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'cctv', ...tv });
        if (onSelectCCTV) onSelectCCTV(tv);
      });
      marker.addTo(cctvLayer);
    });

    // 8. Submarine fiber-optic cables layer
    const cablesLayer = L.layerGroup();
    cablesLayerRef.current = cablesLayer;
    SUBMARINE_CABLES.forEach((cable) => {
      const line = L.polyline(cable.path, {
        color: cable.color || '#a855f7',
        weight: 2,
        opacity: 0.8,
        dashArray: '7, 5',
      });
      line.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'cable', ...cable });
      });
      line.addTo(cablesLayer);
      cable.path.forEach(([cLat, cLng]) => {
        const pt = L.circleMarker([cLat, cLng], {
          radius: 3,
          color: cable.color || '#a855f7',
          fillColor: '#ffffff',
          fillOpacity: 0.9,
        });
        pt.on('click', (e) => {
          if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
          sound.click();
          setInspectedTarget({ type: 'cable', ...cable });
        });
        pt.addTo(cablesLayer);
      });
    });

    // 9. Weather & Thermal Anomalies layer
    const weatherLayer = L.layerGroup();
    weatherLayerRef.current = weatherLayer;
    THERMAL_ANOMALIES.forEach((fire) => {
      const icon = L.divIcon({
        className: 'weather-div-icon-wrapper',
        html: `<div class="weather-div-marker" title="${fire.name}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([fire.lat, fire.lng], { icon });
      marker.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'weather', ...fire });
      });
      marker.addTo(weatherLayer);
    });

    WEATHER_SYSTEMS.forEach((w) => {
      const circle = L.circle([w.lat, w.lng], {
        radius: 380000,
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: '5, 5',
      });
      circle.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'weather', ...w });
      });
      circle.addTo(weatherLayer);
    });

    // 10. Strategic & Nuclear Infrastructure Layer
    const nuclearLayer = L.layerGroup();
    nuclearLayerRef.current = nuclearLayer;
    STRATEGIC_NUCLEAR_SITES.forEach((site) => {
      const icon = L.divIcon({
        className: 'nuclear-div-icon-wrapper',
        html: `<div class="nuclear-div-marker" title="${site.name}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.2"><circle cx="12" cy="12" r="2.5"/><path d="M12 2a10 10 0 0 0-8.66 5l3.46 2A6 6 0 0 1 12 6V2z"/><path d="M20.66 7a10 10 0 0 0-8.66-5v4a6 6 0 0 1 5.2 3l3.46-2z"/><path d="M3.34 17a10 10 0 0 0 8.66 5v-4a6 6 0 0 1-5.2-3l-3.46 2z"/><path d="M12 22a10 10 0 0 0 8.66-5l-3.46-2A6 6 0 0 1 12 18v4z"/></svg></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([site.lat, site.lng], { icon, pane: 'transitsPane' });
      marker.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'nuclear', ...site });
      });
      marker.addTo(nuclearLayer);
    });

    // Attach initial active layers
    if (activeLayers.has('aviation')) aviationLayer.addTo(map);
    if (activeLayers.has('maritime')) maritimeLayer.addTo(map);
    if (activeLayers.has('cyber')) cyberLayer.addTo(map);
    if (activeLayers.has('conflicts')) conflictsLayer.addTo(map);
    if (activeLayers.has('telluric')) telluricLayer.addTo(map);
    if (activeLayers.has('cctv')) cctvLayer.addTo(map);
    if (activeLayers.has('cables')) cablesLayer.addTo(map);
    if (activeLayers.has('weather')) weatherLayer.addTo(map);
    if (activeLayers.has('nuclear')) nuclearLayer.addTo(map);

    const unsubscribeStream = realtimeStream.subscribe((data) => {
      if (data.earthquakes) {
        updateTelluricMarkers(data.earthquakes);
      }
    });

    // Load High-Precision Subunits GeoJSON (Individual polygons for islands & territories like Réunion, Corse, etc.)
    fetch('/subunits_50m.json')
      .then((res) => res.json())
      .then((geoData) => {
        if (!mapInstanceRef.current) return;

        // Reset map of country group layers
        countryGroupLayersMapRef.current.clear();

        const geoLayer = L.geoJSON(geoData, {
          style: (feature) => {
            const p = feature?.properties || {};
            if (p.ADM0_A3 === 'ATA' || (p.NAME && p.NAME.toLowerCase().includes('antarct'))) {
              return antarcticaDefaultStyle;
            }
            return defaultStyle;
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties || {};
            const rawName = props.NAME || props.SUBUNIT || props.ADMIN || 'Territoire';
            const displayName = TERRITORY_NAMES_FR[rawName] || rawName;
            const sovereign = props.SOVEREIGNT || props.ADMIN || displayName;
            const continent = props.CONTINENT || 'Terre';
            const subregion = props.SUBREGION || props.REGION_UN || '';
            const popFormatted = props.POP_EST
              ? new Intl.NumberFormat('fr-FR').format(props.POP_EST)
              : 'N/A';
            const areaKm2 = getCountryAreaKm2(feature);
            const areaFormatted = formatAreaKm2(areaKm2);

            const groupKey = getFeatureCountryKey(feature);
            layer._groupKey = groupKey;
            layer._feature = feature;

            if (!countryGroupLayersMapRef.current.has(groupKey)) {
              countryGroupLayersMapRef.current.set(groupKey, []);
            }
            countryGroupLayersMapRef.current.get(groupKey).push(layer);

            const geopolitics = resolveCountryGeopolitics(rawName, props);

            layer.on({
              mouseover: (e) => {
                const target = e.target;
                const targetGroupKey = target._groupKey || groupKey;
                if (selectedGroupKeyRef.current === targetGroupKey) return;

                // Play hover sound strictly ONCE per country group entry
                if (hoveredCountryIdRef.current !== targetGroupKey) {
                  hoveredCountryIdRef.current = targetGroupKey;
                  sound.countryHover(targetGroupKey, 0.35);
                }

                // Reset previously hovered group layers if switching groups
                if (hoveredGroupKeyRef.current && hoveredGroupKeyRef.current !== targetGroupKey) {
                  const prevLayers = countryGroupLayersMapRef.current.get(hoveredGroupKeyRef.current) || [];
                  prevLayers.forEach((l) => {
                    if (selectedGroupKeyRef.current !== hoveredGroupKeyRef.current) {
                      geoLayer.resetStyle(l);
                      if (l._path) {
                        l._path.classList.remove('country-path-elevated');
                      }
                    }
                  });
                }

                hoveredGroupKeyRef.current = targetGroupKey;
                const groupLayers = countryGroupLayersMapRef.current.get(targetGroupKey) || [target];
                hoveredGroupLayersRef.current = groupLayers;

                const isAntarctic = targetGroupKey === 'ATA';
                const curHoverStyle = isAntarctic ? antarcticaHoverStyle : hoverStyle;

                groupLayers.forEach((l) => {
                  if (selectedGroupKeyRef.current !== targetGroupKey) {
                    l.setStyle(curHoverStyle);
                    l.bringToFront();
                    if (l._path) {
                      l._path.classList.add('country-path-elevated');
                    }
                  }
                });

                if (selectedLayersRef.current.length > 0) {
                  selectedLayersRef.current.forEach((sl) => sl.bringToFront());
                }

                let hoverName = displayName;
                if (targetGroupKey === 'USA') hoverName = 'États-Unis';
                else if (targetGroupKey === 'RUS') hoverName = 'Russie';
                else if (targetGroupKey === 'FRA') hoverName = 'France';
                else if (targetGroupKey === 'ATA') hoverName = 'Antarctique';

                const clientX = e.originalEvent?.clientX || 0;
                const clientY = e.originalEvent?.clientY || 0;
                setHoveredTerritory({
                  x: clientX,
                  y: clientY,
                  name: hoverName,
                  sovereign: sovereign !== hoverName ? sovereign : null,
                  continent,
                  pop: popFormatted,
                  area: areaFormatted,
                  iso2: geopolitics.iso2,
                  flagUrl: geopolitics.flagUrl,
                });
              },
              mousemove: (e) => {
                if (e.originalEvent) {
                  setHoveredTerritory((prev) =>
                    prev ? { ...prev, x: e.originalEvent.clientX, y: e.originalEvent.clientY } : null
                  );
                }
              },
              mouseout: (e) => {
                const target = e.target;
                const targetGroupKey = target._groupKey || groupKey;
                const related = e.originalEvent?.relatedTarget;
                const groupLayers = countryGroupLayersMapRef.current.get(targetGroupKey) || [target];
                const isStillInSameGroup = related && groupLayers.some((l) => l._path === related || (l._path && l._path.contains(related)));

                if (!isStillInSameGroup) {
                  if (targetGroupKey !== selectedGroupKeyRef.current) {
                    groupLayers.forEach((l) => {
                      geoLayer.resetStyle(l);
                      if (l._path) {
                        l._path.classList.remove('country-path-elevated');
                      }
                    });
                  }
                  if (hoveredGroupKeyRef.current === targetGroupKey) {
                    hoveredGroupKeyRef.current = null;
                    hoveredGroupLayersRef.current = [];
                  }
                }

                if (!related || !related.closest || !related.closest('.leaflet-interactive')) {
                  hoveredCountryIdRef.current = null;
                  setHoveredTerritory(null);
                }
              },
              click: (e) => {
                // Only left click selects
                if (e.originalEvent && e.originalEvent.button !== 0) return;
                L.DomEvent.stopPropagation(e);
                sound.click();
                setHoveredTerritory(null);
                hoveredGroupKeyRef.current = null;
                hoveredGroupLayersRef.current = [];

                setInspectedTarget(null);

                const target = e.target;
                const targetGroupKey = target._groupKey || groupKey;

                // 1. Reset ALL layers across the map to guarantee zero ghost hover styles
                geoLayer.eachLayer((l) => {
                  geoLayer.resetStyle(l);
                  if (l._path) {
                    l._path.classList.remove('country-path-selected');
                    l._path.classList.remove('country-path-elevated');
                  }
                });
                selectedLayersRef.current = [];

                // 2. Select all layers in this country group
                const groupLayers = countryGroupLayersMapRef.current.get(targetGroupKey) || [target];
                selectedLayersRef.current = groupLayers;
                selectedGroupKeyRef.current = targetGroupKey;
                selectedLayerRef.current = target;

                const isAntarctic = targetGroupKey === 'ATA';
                const curSelectedStyle = isAntarctic ? antarcticaSelectedStyle : selectedStyle;

                groupLayers.forEach((l) => {
                  l.setStyle(curSelectedStyle);
                  l.bringToFront();
                  if (l._path) {
                    l._path.classList.add('country-path-selected');
                    l._path.classList.remove('country-path-elevated');
                  }
                });

                // 3. Smooth Camera Trajectory & Framing
                if (targetGroupKey === 'USA') {
                  // Frames contiguous 48 states + Alaska + Hawaii perfectly without 180 meridian warp
                  map.flyTo([48.0, -100.0], 3.2, { duration: 1.1 });
                } else if (targetGroupKey === 'RUS') {
                  // Frames the entire Russian Federation from Baltic to Pacific
                  map.flyTo([62.0, 95.0], 2.8, { duration: 1.1 });
                } else if (targetGroupKey === 'ATA') {
                  // Frames Antarctica cleanly with room for the HUD
                  map.flyTo([-74.0, 0.0], 2.6, { duration: 1.1 });
                } else if (targetGroupKey === 'FRA') {
                  // Frames mainland France + Corsica
                  map.flyTo([46.6, 2.5], 5.4, { duration: 1.1 });
                } else {
                  let combinedBounds = null;
                  groupLayers.forEach((l) => {
                    const b = l.getBounds();
                    if (!combinedBounds) {
                      combinedBounds = L.latLngBounds(b.getSouthWest(), b.getNorthEast());
                    } else {
                      combinedBounds.extend(b);
                    }
                  });

                  if (combinedBounds && combinedBounds.isValid()) {
                    const south = Math.max(-74, combinedBounds.getSouth());
                    const north = Math.min(76, combinedBounds.getNorth());
                    const west = combinedBounds.getWest();
                    const east = combinedBounds.getEast();
                    const safeBounds = L.latLngBounds(L.latLng(south, west), L.latLng(north, east));

                    map.fitBounds(safeBounds, {
                      padding: [80, 80],
                      maxZoom: 6.2,
                      animate: true,
                      duration: 1.1,
                    });
                  }
                }

                // 4. Set Selected Territory with Unified Metrics
                let unifiedName = displayName;
                let unifiedSovereign = sovereign;
                let unifiedPop = popFormatted;
                let unifiedArea = areaFormatted;
                let unifiedAreaKm2 = areaKm2;

                if (targetGroupKey === 'USA') {
                  unifiedName = 'États-Unis';
                  unifiedSovereign = 'United States of America';
                  unifiedPop = '335 893 238';
                  unifiedArea = '9 833 517 km²';
                  unifiedAreaKm2 = 9833517;
                } else if (targetGroupKey === 'RUS') {
                  unifiedName = 'Russie';
                  unifiedSovereign = 'Russia';
                  unifiedPop = '144 200 000';
                  unifiedArea = '17 098 242 km²';
                  unifiedAreaKm2 = 17098242;
                } else if (targetGroupKey === 'FRA') {
                  unifiedName = 'France';
                  unifiedSovereign = 'France';
                  unifiedPop = '68 042 591';
                  unifiedArea = '643 801 km²';
                  unifiedAreaKm2 = 643801;
                } else if (targetGroupKey === 'ATA') {
                  unifiedName = 'Antarctique';
                  unifiedSovereign = 'Continent Antarctique';
                  unifiedPop = '~1 100 à 4 500';
                  unifiedArea = '14 200 000 km²';
                  unifiedAreaKm2 = 14200000;
                }

                const primaryCenter = target.getBounds().getCenter();

                setSelectedTerritory({
                  name: unifiedName,
                  rawName,
                  sovereign: unifiedSovereign,
                  continent,
                  subregion,
                  pop: unifiedPop,
                  area: unifiedArea,
                  areaKm2: unifiedAreaKm2,
                  centerLat: `${Math.abs(primaryCenter.lat).toFixed(2)}° ${primaryCenter.lat >= 0 ? 'N' : 'S'}`,
                  centerLng: `${Math.abs(primaryCenter.lng).toFixed(2)}° ${primaryCenter.lng >= 0 ? 'E' : 'W'}`,
                  geopolitics,
                  feature,
                });
              },
            });
          },
        });

        if (!mapInstanceRef.current || !mapInstanceRef.current._panes) return;
        geoLayer.addTo(map);
        geoJsonLayerRef.current = geoLayer;
      })
      .catch((err) => console.error('Error loading Subunits GeoJSON:', err));

    return () => {
      updateFlightradarPlanesRef.current = null;
      updateMarineTrafficVesselsRef.current = null;
      unsubscribeStream();
      if (unsubscribeFR24) unsubscribeFR24();
      if (unsubscribeMarine) unsubscribeMarine();
      if (aviationCanvas && aviationCanvas.parentNode) {
        aviationCanvas.parentNode.removeChild(aviationCanvas);
      }
      if (maritimeCanvas && maritimeCanvas.parentNode) {
        maritimeCanvas.parentNode.removeChild(maritimeCanvas);
      }
      if (hoverFlightTooltip && map.hasLayer(hoverFlightTooltip)) {
        map.removeLayer(hoverFlightTooltip);
      }
      if (hoverMaritimeTooltip && map.hasLayer(hoverMaritimeTooltip)) {
        map.removeLayer(hoverMaritimeTooltip);
      }
      if (animFrameAviationId) {
        cancelAnimationFrame(animFrameAviationId);
      }
      if (animFrameMaritimeId) {
        cancelAnimationFrame(animFrameMaritimeId);
      }
      map.off('mousemove', onMapMouseMove);
      map.off('click', onMapClick);
      map.off('moveend', onMapMoveEnd);
      container.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('mouseleave', onMapMouseLeave);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.body.classList.remove('is-grabbing');
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync layer changes from parent
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._layersDict) return;

    Object.values(map._layersDict).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    if (map._layersDict[activeLayer]) {
      map._layersDict[activeLayer].addTo(map);
    }

    if (geoJsonLayerRef.current && map.hasLayer(geoJsonLayerRef.current)) {
      geoJsonLayerRef.current.bringToFront();
    }
  }, [activeLayer]);

  // Sync multi-layer toggles dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layersMap = {
      aviation: aviationLayerRef.current,
      maritime: maritimeLayerRef.current,
      cyber: cyberLayerRef.current,
      conflicts: conflictsLayerRef.current,
      telluric: telluricLayerRef.current,
      cctv: cctvLayerRef.current,
      cables: cablesLayerRef.current,
      weather: weatherLayerRef.current,
      nuclear: nuclearLayerRef.current,
    };

    Object.entries(layersMap).forEach(([layerKey, layer]) => {
      if (!layer) return;
      const shouldBeActive = activeLayers.has(layerKey);

      if (shouldBeActive) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    });
  }, [activeLayers]);

  // Smooth cinematic flight when user selects a target location from Spotlight or dossier
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetLocation) return;
    if (
      typeof targetLocation.lat !== 'number' ||
      typeof targetLocation.lng !== 'number' ||
      isNaN(targetLocation.lat) ||
      isNaN(targetLocation.lng)
    ) {
      return;
    }
    map.flyTo([targetLocation.lat, targetLocation.lng], targetLocation.zoom || 5.5, {
      duration: 1.4,
      easeLinearity: 0.25,
    });
  }, [targetLocation]);

  // Dynamic Route Highlighting for Inspected Transits (Vessels & Flights)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (inspectedRouteLayerRef.current) {
      map.removeLayer(inspectedRouteLayerRef.current);
      inspectedRouteLayerRef.current = null;
    }

    if (!inspectedTarget) return;

    const routeGroup = L.layerGroup();

    // 1. Maritime Track & Ports
    if (inspectedTarget.type === 'vessel' && inspectedTarget.routeWaypoints?.length > 1) {
      const pts = inspectedTarget.routeWaypoints;

      // Outer ambient glow
      L.polyline(pts, {
        color: '#f59e0b',
        weight: 6,
        opacity: 0.3,
        lineCap: 'round',
        interactive: false,
      }).addTo(routeGroup);

      // Core crisp dashed maritime track
      L.polyline(pts, {
        color: '#fbbf24',
        weight: 2.5,
        opacity: 0.95,
        dashArray: '8, 6',
        interactive: false,
      }).addTo(routeGroup);

      // Departure Harbor
      const [startLat, startLng] = pts[0];
      const startMarker = L.circleMarker([startLat, startLng], {
        radius: 5,
        color: '#ffffff',
        fillColor: '#10b981',
        fillOpacity: 1,
        weight: 2,
      });
      startMarker.bindTooltip(`<b>PORT DE DÉPART</b><br/>${inspectedTarget.originPort || 'Origine'}`);
      startMarker.addTo(routeGroup);

      // Destination Harbor
      const [endLat, endLng] = pts[pts.length - 1];
      const endMarker = L.circleMarker([endLat, endLng], {
        radius: 5,
        color: '#ffffff',
        fillColor: '#f59e0b',
        fillOpacity: 1,
        weight: 2,
      });
      endMarker.bindTooltip(`<b>DESTINATION</b><br/>${inspectedTarget.destinationPort || 'Destination'}`);
      endMarker.addTo(routeGroup);

      routeGroup.addTo(map);
      inspectedRouteLayerRef.current = routeGroup;
    }

    // 2. Commercial & Tactical Flight Great Circle Arc & Airports
    if (inspectedTarget.type === 'flight') {
      const fl = inspectedTarget;
      const origCoords = fl.origin?.coords;
      const destCoords = fl.destination?.coords;

      if (origCoords && destCoords && origCoords.length === 2 && destCoords.length === 2) {
        const steps = 48;
        const pts = [];
        for (let i = 0; i <= steps; i++) {
          const pt = interpolateGreatCircle(origCoords, destCoords, i / steps);
          if (pt && !isNaN(pt[0]) && !isNaN(pt[1])) {
            pts.push(pt);
          }
        }

        if (pts.length > 1) {
          // Outer ambient cyan glow
          L.polyline(pts, {
            color: '#00f2fe',
            weight: 6,
            opacity: 0.35,
            lineCap: 'round',
            interactive: false,
          }).addTo(routeGroup);

          // Core crisp golden dashed flight line
          L.polyline(pts, {
            color: '#ffd700',
            weight: 2.5,
            opacity: 0.95,
            dashArray: '6, 6',
            interactive: false,
          }).addTo(routeGroup);

          // Departure Airport Marker
          const startMarker = L.circleMarker(origCoords, {
            radius: 5.5,
            color: '#ffffff',
            fillColor: '#10b981',
            fillOpacity: 1,
            weight: 2,
          });
          const origCity = fl.origin.city || fl.origin.name || fl.origin.code || 'Départ';
          startMarker.bindTooltip(`<b>AÉROPORT DE DÉPART</b><br/>${origCity} (${fl.origin.code || '—'})<br/>${fl.origin.name || ''}`);
          startMarker.addTo(routeGroup);

          // Destination Airport Marker
          const endMarker = L.circleMarker(destCoords, {
            radius: 5.5,
            color: '#ffffff',
            fillColor: '#f59e0b',
            fillOpacity: 1,
            weight: 2,
          });
          const destCity = fl.destination.city || fl.destination.name || fl.destination.code || 'Arrivée';
          endMarker.bindTooltip(`<b>AÉROPORT D'ARRIVÉE</b><br/>${destCity} (${fl.destination.code || '—'})<br/>${fl.destination.name || ''}`);
          endMarker.addTo(routeGroup);
        }
      }

      // Plane position beacon ring on 2D map
      if (typeof fl.lat === 'number' && typeof fl.lng === 'number' && !isNaN(fl.lat) && !isNaN(fl.lng)) {
        const planeBeacon = L.circleMarker([fl.lat, fl.lng], {
          radius: 14,
          color: '#00f2fe',
          fillColor: '#ffd700',
          fillOpacity: 0.25,
          weight: 1.8,
          dashArray: '4, 4',
          interactive: false,
        });
        planeBeacon.addTo(routeGroup);
      }

      routeGroup.addTo(map);
      inspectedRouteLayerRef.current = routeGroup;
    }
  }, [inspectedTarget]);

  const handleResetView = () => {
    sound.click();
    if (selectedLayersRef.current && selectedLayersRef.current.length > 0) {
      selectedLayersRef.current.forEach((l) => {
        geoJsonLayerRef.current?.resetStyle(l);
        if (l._path) {
          l._path.classList.remove('country-path-selected');
          l._path.classList.remove('country-path-elevated');
        }
      });
      selectedLayersRef.current = [];
    } else if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.eachLayer((l) => {
        geoJsonLayerRef.current.resetStyle(l);
        if (l._path) {
          l._path.classList.remove('country-path-selected');
          l._path.classList.remove('country-path-elevated');
        }
      });
    }
    selectedGroupKeyRef.current = null;
    selectedLayerRef.current = null;
    setSelectedTerritory(null);
    mapInstanceRef.current?.flyTo([20, 0], 2.6, { duration: 1.1 });
  };

  return (
    <div className="tactical-map-viewport">
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="leaflet-map-canvas" />

      {/* Strategic Country Dossier Card (Awwwards OSINT Inspection) */}
      {selectedTerritory && (
        <CountryDossierCard
          territory={selectedTerritory}
          onClose={handleResetView}
          onResetView={handleResetView}
          onOpenDrawer={(terr) => {
            if (onSelectCountry) {
              const code = terr.geopolitics?.iso2 || 'FR';
              onSelectCountry(code);
            }
          }}
          isDrawerOpen={isDrawerOpen}
        />
      )}

      {/* 2D Country Hover Tooltip (Matching 3D Orbit HUD style with SVG Flag & ISO Badge) */}
      {hoveredTerritory && !selectedTerritory && !inspectedTarget && (
        <div
          className="orbit-country-hover-tooltip"
          style={{
            position: 'fixed',
            left: `${hoveredTerritory.x + 16}px`,
            top: `${hoveredTerritory.y - 30}px`,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <div className="orbit-tooltip-inner">
            <div className="orbit-tooltip-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {hoveredTerritory.flagUrl && (
                <img
                  src={hoveredTerritory.flagUrl}
                  alt=""
                  style={{
                    width: '18px',
                    height: '12px',
                    objectFit: 'cover',
                    borderRadius: '2px',
                    border: '0.5px solid rgba(0, 242, 254, 0.4)',
                    boxShadow: '0 0 6px rgba(0, 242, 254, 0.2)',
                  }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <span>{hoveredTerritory.name}</span>
              {hoveredTerritory.iso2 && (
                <span style={{ fontSize: '9px', color: '#00f2fe', background: 'rgba(0,242,254,0.12)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                  {hoveredTerritory.iso2}
                </span>
              )}
            </div>
            {hoveredTerritory.sovereign && (
              <div className="orbit-tooltip-sub">Rattaché : {hoveredTerritory.sovereign}</div>
            )}
            <div className="orbit-tooltip-stats">
              <span>{hoveredTerritory.continent}</span>
              <span className="dot-sep">•</span>
              <span>{hoveredTerritory.pop} hab.</span>
              {hoveredTerritory.area && (
                <>
                  <span className="dot-sep">•</span>
                  <span>{hoveredTerritory.area}</span>
                </>
              )}
            </div>
            <div className="orbit-tooltip-hint">Cliquer pour dossier stratégique</div>
          </div>
        </div>
      )}

      {/* Tactical Bottom-Right Inspection Target Card (Osiris HUD style) */}
      <TacticalInspectionCard
        target={inspectedTarget}
        onClose={() => setInspectedTarget(null)}
        onOpenLive={(target) => {
          if (onSelectCCTV) onSelectCCTV(target);
        }}
        onCenter={(lat, lng) => {
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            mapInstanceRef.current?.flyTo([lat, lng], 6, { duration: 1.2 });
          }
        }}
        isDrawerOpen={isDrawerOpen}
      />

      {/* Floating Center-Bottom Coordinates - Directly on map, no capsule, no border */}
      <div className="floating-coords-pill">
        <div className="coord-item">
          <span className="coord-tag">LAT</span>
          <span className="coord-value" ref={coordLatRef}>48.85° N</span>
        </div>
        <span className="coord-divider">/</span>
        <div className="coord-item">
          <span className="coord-tag">LNG</span>
          <span className="coord-value" ref={coordLngRef}>2.35° E</span>
        </div>
      </div>
    </div>
  );
}
