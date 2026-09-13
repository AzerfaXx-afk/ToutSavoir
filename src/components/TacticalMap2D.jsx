import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { sound } from '../utils/soundFX';
import { X, Maximize2, MapPin } from 'lucide-react';
import { TERRITORY_NAMES_FR, getCountryAreaKm2, formatAreaKm2 } from '../utils/countryData';
import { realtimeStream } from '../utils/realtimeEvents';
import { AVIATION_ROUTES, CYBER_ATTACK_VECTORS, GEOPOLITICAL_ZONES } from '../data/tacticalStreams';
import {
  CCTV_FEEDS,
  SUBMARINE_CABLES,
  THERMAL_ANOMALIES,
  WEATHER_SYSTEMS,
  STRATEGIC_NUCLEAR_SITES,
} from '../data/osirisStreams';
import { LIVE_FLIGHTS, LIVE_VESSELS, getLiveTransitPositions, interpolateGreatCircle } from '../data/liveTransits';
import { flightRadarService, getFlightradarPlaneSvg } from '../services/flightRadarService';
import { TacticalInspectionCard } from './TacticalInspectionCard';

export function TacticalMap2D({
  activeLayer = 'satellite',
  activeLayers = new Set(['aviation', 'conflicts']),
  onSelectCCTV,
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

  const pulsesLayerRef = useRef(null);
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
  const [internalInspectedTarget, setInternalInspectedTarget] = useState(null);
  const inspectedTarget = propInspectedTarget !== undefined ? propInspectedTarget : internalInspectedTarget;
  const setInspectedTarget = useCallback((target) => {
    setInternalInspectedTarget(target);
    if (onInspectTarget) onInspectTarget(target);
  }, [onInspectTarget]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, lat: '48.85° N', lng: '2.35° E' });

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

    // Track cursor GPS coordinates (lightweight, zero DOM traversal)
    map.on('mousemove', (e) => {
      const clampedLat = Math.max(-85, Math.min(85, e.latlng.lat));
      const clampedLng = ((((e.latlng.lng + 180) % 360) + 360) % 360) - 180;

      const latStr = `${Math.abs(clampedLat).toFixed(2)}° ${clampedLat >= 0 ? 'N' : 'S'}`;
      const lngStr = `${Math.abs(clampedLng).toFixed(2)}° ${clampedLng >= 0 ? 'E' : 'W'}`;

      setMousePos({
        lat: latStr,
        lng: lngStr,
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
      });
    });

    // Close selected card & unhighlight when clicking empty ocean
    map.on('click', (e) => {
      if (e.originalEvent.target.classList.contains('leaflet-container')) {
        sound.click();
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.eachLayer((l) => {
            geoJsonLayerRef.current.resetStyle(l);
            if (l._path) {
              l._path.classList.remove('country-path-selected');
              l._path.classList.remove('country-path-elevated');
            }
          });
        }
        hoveredLayerRef.current = null;
        setHoveredCountry(null);
        selectedLayerRef.current = null;
        setSelectedTerritory(null);
      }
    });

    // 1. Live pulses layer for real-time births & deaths
    const pulsesLayer = L.layerGroup();
    pulsesLayerRef.current = pulsesLayer;
    pulsesLayer.addTo(map);

    // 2. Aviation Layer (Direct Flightradar24 ADS-B Live Commercial Fleet)
    const aviationLayer = L.layerGroup();
    aviationLayerRef.current = aviationLayer;
    if (activeLayers.has('aviation')) {
      aviationLayer.addTo(map);
    }

    // Track active flight markers with Flightradar24 yellow airplane icons
    const flightMarkersMap = new Map();

    const updateFlightradarPlanes = (flightsList) => {
      if (!flightsList || flightsList.length === 0) return;

      const activeIds = new Set();

      flightsList.forEach((fl) => {
        activeIds.add(fl.id);
        const isSelected = inspectedTarget?.id === fl.id;
        const iconHtml = getFlightradarPlaneSvg(fl.track || fl.heading || 0, 20, isSelected);
        const icon = L.divIcon({
          className: 'fr24-plane-marker-wrap',
          html: iconHtml,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        if (flightMarkersMap.has(fl.id)) {
          const m = flightMarkersMap.get(fl.id);
          m.setLatLng([fl.lat, fl.lng]);
          if (Math.abs((m._lastTrack || 0) - fl.track) > 1.5 || m._isSelected !== isSelected) {
            m.setIcon(icon);
            m._lastTrack = fl.track;
            m._isSelected = isSelected;
          }
        } else {
          const m = L.marker([fl.lat, fl.lng], { icon, pane: 'transitsPane' });
          m._lastTrack = fl.track;
          m._isSelected = isSelected;

          m.on('click', (e) => {
            if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
            sound.click();
            setInspectedTarget({ type: 'flight', ...fl });
          });

          m.addTo(aviationLayer);
          flightMarkersMap.set(fl.id, m);
        }
      });

      // Prune planes that landed or are no longer in radar range
      for (const [id, m] of flightMarkersMap.entries()) {
        if (!activeIds.has(id)) {
          aviationLayer.removeLayer(m);
          flightMarkersMap.delete(id);
        }
      }
    };

    // Subscribe to Flightradar24 live stream
    const unsubscribeFR24 = flightRadarService.subscribe((flights) => {
      updateFlightradarPlanes(flights);
    });

    // 2b. Maritime Shipping Lanes Layer
    const maritimeLayer = L.layerGroup();
    maritimeLayerRef.current = maritimeLayer;
    if (activeLayers.has('maritime')) {
      maritimeLayer.addTo(map);
    }
    const vesselMarkersMap = new Map();

    const updateTransits = () => {
      const { vessels } = getLiveTransitPositions();
      // Update vessels
      vessels.forEach((ves) => {
        const iconHtml = `<div class="vessel-div-marker" title="${ves.name} (${ves.flag})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><line x1="12" y1="1" x2="12" y2="5"/></svg></div>`;
        const icon = L.divIcon({
          className: 'vessel-div-icon-wrap',
          html: iconHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        if (vesselMarkersMap.has(ves.id)) {
          const m = vesselMarkersMap.get(ves.id);
          m.setLatLng([ves.lat, ves.lng]);
          m.setIcon(icon);
        } else {
          const m = L.marker([ves.lat, ves.lng], { icon, pane: 'transitsPane' });
          m.on('click', (e) => {
            if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
            sound.click();
            setInspectedTarget({ type: 'vessel', ...ves });
          });
          m.addTo(maritimeLayer);
          vesselMarkersMap.set(ves.id, m);
        }
      });
    };

    updateTransits();
    const transitInterval = setInterval(updateTransits, 1500);

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

    // 4. Geopolitical conflicts layer (Hotspot Zones)
    const conflictsLayer = L.layerGroup();
    conflictsLayerRef.current = conflictsLayer;
    GEOPOLITICAL_ZONES.forEach((zone) => {
      const circle = L.circle([zone.lat, zone.lng], {
        radius: 320000,
        color: '#ff2a4d',
        fillColor: '#ff2a4d',
        fillOpacity: 0.22,
        weight: 1.5,
      });
      circle.bindTooltip(`<b>${zone.name}</b><br/>${zone.status} — ${zone.defcon}<br/>${zone.alert}<br/><i style="color:#ff3366;">Cliquer pour dossier de crise</i>`);
      circle.on('click', (e) => {
        if (e && e.originalEvent) L.DomEvent.stopPropagation(e);
        sound.click();
        setInspectedTarget({ type: 'conflict', ...zone });
      });
      circle.addTo(conflictsLayer);
    });

    // 5. Telluric earthquakes layer
    const telluricLayer = L.layerGroup();
    telluricLayerRef.current = telluricLayer;
    const updateTelluricMarkers = (eqList) => {
      telluricLayer.clearLayers();
      (eqList || []).slice(0, 15).forEach((eq) => {
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

    // 6. CCTV live cameras layer (46 strategic global webcams)
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
    pulsesLayer.addTo(map);
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
      if (data.type === 'new_event' && data.event && mapInstanceRef.current) {
        const evt = data.event;
        const isDeath = evt.type === 'death';
        const icon = L.divIcon({
          className: 'pulse-div-icon',
          html: `<div class="tactical-pulse-dot ${isDeath ? 'is-death' : 'is-birth'}"><span class="pulse-ring"></span><span class="pulse-core"></span></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const marker = L.marker([evt.lat, evt.lng], { icon, interactive: false });
        marker.addTo(pulsesLayer);
        setTimeout(() => {
          if (mapInstanceRef.current && pulsesLayer.hasLayer(marker)) {
            pulsesLayer.removeLayer(marker);
          }
        }, 1600);
      }
      if (data.earthquakes) {
        updateTelluricMarkers(data.earthquakes);
      }
    });

    // Load High-Precision Subunits GeoJSON (Individual polygons for islands & territories like Réunion, Corse, etc.)
    fetch('/subunits_50m.json')
      .then((res) => res.json())
      .then((geoData) => {
        if (!mapInstanceRef.current) return;

        const geoLayer = L.geoJSON(geoData, {
          style: () => defaultStyle,
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

            layer.on({
              click: (e) => {
                // Only left click selects
                if (e.originalEvent && e.originalEvent.button !== 0) return;
                L.DomEvent.stopPropagation(e);
                sound.click();

                const target = e.target;

                // 1. Reset ALL other layers to ensure strictly ONE country is ever highlighted
                geoLayer.eachLayer((l) => {
                  if (l !== target) {
                    geoLayer.resetStyle(l);
                    if (l._path) {
                      l._path.classList.remove('country-path-selected');
                      l._path.classList.remove('country-path-elevated');
                    }
                  }
                });

                // 2. Apply persistent glowing selected style to target
                selectedLayerRef.current = target;
                target.setStyle(selectedStyle);
                target.bringToFront();
                if (target._path) {
                  target._path.classList.add('country-path-selected');
                  target._path.classList.remove('country-path-elevated');
                }

                const bounds = target.getBounds();
                const center = bounds.getCenter();

                // 3. Antarctica & Extreme Polar Latitudes Camera Protection
                // Antarctica spans -180 to 180 and down to -90, which crashes Mercator fitBounds and throws map off-screen.
                const isAntarctica =
                  rawName.toLowerCase().includes('antarct') ||
                  displayName.toLowerCase().includes('antarct') ||
                  bounds.getSouth() < -62;

                if (isAntarctica) {
                  // Beautiful, stable, safe camera view over Antarctica that never overflows the screen:
                  map.flyTo([-72, 0], 2.8, {
                    duration: 1.1,
                  });
                } else {
                  // Clamp bounds between safe Mercator latitudes [-74, 76] to avoid screen overflow
                  const south = Math.max(-74, bounds.getSouth());
                  const north = Math.min(76, bounds.getNorth());
                  const west = bounds.getWest();
                  const east = bounds.getEast();
                  const safeBounds = L.latLngBounds(L.latLng(south, west), L.latLng(north, east));

                  map.fitBounds(safeBounds, {
                    padding: [80, 80],
                    maxZoom: 6.2,
                    animate: true,
                    duration: 1.1,
                  });
                }

                setSelectedTerritory({
                  name: displayName,
                  sovereign,
                  continent,
                  subregion,
                  pop: popFormatted,
                  area: areaFormatted,
                  centerLat: `${Math.abs(center.lat).toFixed(2)}° ${center.lat >= 0 ? 'N' : 'S'}`,
                  centerLng: `${Math.abs(center.lng).toFixed(2)}° ${center.lng >= 0 ? 'E' : 'W'}`,
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
      unsubscribeStream();
      if (unsubscribeFR24) unsubscribeFR24();
      clearInterval(transitInterval);
      container.removeEventListener('contextmenu', onContextMenu);
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
      startMarker.bindTooltip(`<b>PORT DE DÉPART</b><br/>${inspectedTarget.originPort}`);
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
      endMarker.bindTooltip(`<b>DESTINATION</b><br/>${inspectedTarget.destinationPort}`);
      endMarker.addTo(routeGroup);

      routeGroup.addTo(map);
      inspectedRouteLayerRef.current = routeGroup;
    } else if (
      inspectedTarget.type === 'flight' &&
      inspectedTarget.origin?.coords &&
      inspectedTarget.destination?.coords
    ) {
      const pStart = inspectedTarget.origin.coords;
      const pEnd = inspectedTarget.destination.coords;
      const pts = [];
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        pts.push(interpolateGreatCircle(pStart, pEnd, i / steps));
      }

      // Outer glow
      L.polyline(pts, {
        color: '#00f2fe',
        weight: 6,
        opacity: 0.32,
        lineCap: 'round',
        interactive: false,
      }).addTo(routeGroup);

      // Crisp dash
      L.polyline(pts, {
        color: '#38bdf8',
        weight: 2.2,
        opacity: 0.95,
        dashArray: '6, 5',
        interactive: false,
      }).addTo(routeGroup);

      // Origin airport
      const origMarker = L.circleMarker(pStart, {
        radius: 5,
        color: '#ffffff',
        fillColor: '#00f5a0',
        fillOpacity: 1,
        weight: 2,
      });
      origMarker.addTo(routeGroup);

      // Destination airport
      const destMarker = L.circleMarker(pEnd, {
        radius: 5,
        color: '#ffffff',
        fillColor: '#00f2fe',
        fillOpacity: 1,
        weight: 2,
      });
      destMarker.addTo(routeGroup);

      routeGroup.addTo(map);
      inspectedRouteLayerRef.current = routeGroup;
    }
  }, [inspectedTarget]);

  const handleResetView = () => {
    sound.click();
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.eachLayer((l) => {
        geoJsonLayerRef.current.resetStyle(l);
        if (l._path) {
          l._path.classList.remove('country-path-selected');
          l._path.classList.remove('country-path-elevated');
        }
      });
    }
    selectedLayerRef.current = null;
    setSelectedTerritory(null);
    mapInstanceRef.current?.flyTo([20, 0], 2.6, { duration: 1.1 });
  };

  return (
    <div className="tactical-map-viewport">
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="leaflet-map-canvas" />

      {/* Google Maps Style Inspector Card (On Click) */}
      {selectedTerritory && (
        <div className="territory-inspector-card">
          <div className="inspector-header">
            <div className="inspector-title-group">
              <MapPin size={14} className="inspector-icon" />
              <div className="inspector-titles">
                <h3 className="inspector-main-name">{selectedTerritory.name}</h3>
                <span className="inspector-sub-name">
                  {selectedTerritory.sovereign !== selectedTerritory.name
                    ? `Territoire rattaché : ${selectedTerritory.sovereign}`
                    : 'État souverain'}
                </span>
              </div>
            </div>
            <button
              className="inspector-close-btn"
              onClick={handleResetView}
              onMouseEnter={() => sound.hover()}
              title="Désélectionner"
            >
              <X size={14} />
            </button>
          </div>

          <div className="inspector-body">
            <div className="inspector-metric-row">
              <span className="metric-tag">SOUVERAINETÉ</span>
              <span className="metric-val">{selectedTerritory.sovereign}</span>
            </div>

            <div className="inspector-metric-row">
              <span className="metric-tag">RÉGION</span>
              <span className="metric-val">{selectedTerritory.subregion || selectedTerritory.continent}</span>
            </div>

            <div className="inspector-metric-row">
              <span className="metric-tag">POPULATION EST.</span>
              <span className="metric-val text-cyan">{selectedTerritory.pop}</span>
            </div>

            {selectedTerritory.area && (
              <div className="inspector-metric-row">
                <span className="metric-tag">SUPERFICIE TOTALE</span>
                <span className="metric-val text-cyan">{selectedTerritory.area}</span>
              </div>
            )}

            <div className="inspector-metric-row">
              <span className="metric-tag">CENTROÏDE GPS</span>
              <span className="metric-val font-mono">
                {selectedTerritory.centerLat} • {selectedTerritory.centerLng}
              </span>
            </div>
          </div>

          <div className="inspector-footer">
            <button
              className="inspector-reset-zoom-btn"
              onClick={handleResetView}
              onMouseEnter={() => sound.hover()}
            >
              <Maximize2 size={12} />
              <span>VUE GLOBALE</span>
            </button>
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
          mapInstanceRef.current?.flyTo([lat, lng], 6, { duration: 1.2 });
        }}
        isDrawerOpen={isDrawerOpen}
      />

      {/* Floating Center-Bottom Coordinates - Directly on map, no capsule, no border */}
      <div className="floating-coords-pill">
        <div className="coord-item">
          <span className="coord-tag">LAT</span>
          <span className="coord-value">{mousePos.lat}</span>
        </div>
        <span className="coord-divider">/</span>
        <div className="coord-item">
          <span className="coord-tag">LNG</span>
          <span className="coord-value">{mousePos.lng}</span>
        </div>
      </div>
    </div>
  );
}
