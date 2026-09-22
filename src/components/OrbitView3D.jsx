import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { X, Maximize2 } from 'lucide-react';
import { sound } from '../utils/soundFX';
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
  SATELLITES_DATA,
  STARLINK_SWARM_NODES,
  CCTV_FEEDS,
  LIVE_NEWS_CHANNELS,
  SUBMARINE_CABLES,
  THERMAL_ANOMALIES,
  WEATHER_SYSTEMS,
  STRATEGIC_NUCLEAR_SITES,
} from '../data/osirisStreams';
import { WORLD_TV_CHANNELS } from '../data/worldTvChannels';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { flightRadarService } from '../services/flightRadarService';
import { marineTrafficService } from '../services/marineTrafficService';
import { TacticalInspectionCard } from './TacticalInspectionCard';
import { CountryDossierCard } from './CountryDossierCard';
import { resolveCountryGeopolitics } from '../data/countryGeopolitics';

// Fast point-in-polygon ray-casting algorithm
function pointInPolygon(point, poly) {
  let inside = false;
  const x = point[0];
  const y = point[1];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function OrbitView3D({
  autoRotate = true,
  onAutoRotateChange,
  activeLayers = new Set(),
  selectedYear = 2026,
  flightLimit = 2500,
  vesselLimit = 5000,
  onSelectCCTV,
  onSelectSatellite,
  onSelectCountry,
  targetLocation,
  isDrawerOpen = false,
  inspectedTarget: propInspectedTarget,
  onInspectTarget,
}) {
  const mountRef = useRef(null);
  // Direct DOM refs for 3D coordinates (0 React re-renders in WebGL loop)
  const coordLatRef = useRef(null);
  const coordLngRef = useRef(null);
  const coordAltRef = useRef(null);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [hoveredTerritory, setHoveredTerritory] = useState(null);
  const [internalInspectedTarget, setInternalInspectedTarget] = useState(null);
  const inspectedTarget = propInspectedTarget !== undefined ? propInspectedTarget : internalInspectedTarget;
  const setInspectedTarget = useCallback((target) => {
    setInternalInspectedTarget(target);
    if (onInspectTarget) onInspectTarget(target);
  }, [onInspectTarget]);

  useEffect(() => {
    if (inspectedTarget) {
      setSelectedTerritory(null);
      setHoveredTerritory(null);
      if (selectedMeshRef.current && earthGroupRef.current) {
        earthGroupRef.current.remove(selectedMeshRef.current);
        selectedMeshRef.current.geometry.dispose();
        selectedMeshRef.current.material.dispose();
        selectedMeshRef.current = null;
      }
    }
  }, [inspectedTarget]);

  // References
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const earthGroupRef = useRef(null);
  const earthMeshRef = useRef(null);
  const earthShaderRef = useRef(null);
  const cloudsShaderRef = useRef(null);
  const starFieldRef = useRef(null);
  const geoFeaturesRef = useRef([]);
  const selectedMeshRef = useRef(null);
  const selectedFillMatRef = useRef(null);
  const hoverMeshRef = useRef(null);
  const hoveredFeatureRef = useRef(null);
  const hoveredCountryIdRef = useRef(null);
  const updateSelectedFlightPathRef = useRef(null);
  const updateSelectedVesselMarkerRef = useRef(null);
  const updateSelectedSatelliteRef = useRef(null);
  const update3DPlanesRef = useRef(null);
  const update3DVesselsRef = useRef(null);
  const updateConflicts3DRef = useRef(null);

  useEffect(() => {
    if (updateConflicts3DRef.current) {
      updateConflicts3DRef.current(selectedYear);
    }
  }, [selectedYear]);

  const autoRotateRef = useRef(autoRotate);
  const activeLayersRef = useRef(activeLayers);
  const flightLimitRef = useRef(flightLimit);
  const vesselLimitRef = useRef(vesselLimit);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    activeLayersRef.current = activeLayers;
  }, [activeLayers]);

  useEffect(() => {
    flightLimitRef.current = flightLimit;
    if (update3DPlanesRef.current && flightRadarService.flights.length > 0) {
      update3DPlanesRef.current(flightRadarService.flights);
    }
  }, [flightLimit]);

  useEffect(() => {
    vesselLimitRef.current = vesselLimit;
    if (update3DVesselsRef.current && marineTrafficService.vessels.length > 0) {
      update3DVesselsRef.current(marineTrafficService.vessels);
    }
  }, [vesselLimit]);

  // Sync selected flight path with inspectedTarget prop
  useEffect(() => {
    if (updateSelectedFlightPathRef.current) {
      updateSelectedFlightPathRef.current(inspectedTarget?.type === 'flight' ? inspectedTarget : null);
    }
  }, [inspectedTarget]);

  // Sync selected vessel marker with inspectedTarget prop
  useEffect(() => {
    if (updateSelectedVesselMarkerRef.current) {
      updateSelectedVesselMarkerRef.current(inspectedTarget?.type === 'vessel' ? inspectedTarget : null);
    }
  }, [inspectedTarget]);

  // Sync selected satellite nadir beam & footprint with inspectedTarget prop
  useEffect(() => {
    if (updateSelectedSatelliteRef.current) {
      updateSelectedSatelliteRef.current(inspectedTarget?.type === 'satellite' ? inspectedTarget : null);
    }
  }, [inspectedTarget]);

  // Radius constants
  const R_EARTH = 2.0;
  const R_BORDERS = 2.003;
  const R_HOVER_BASE = 2.002;
  const R_SELECT = 2.038; // Selection lifts higher

  const coordsToVector = (lng, lat, radius = R_BORDERS) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
  };

  const removeSelectedMesh = () => {
    if (selectedMeshRef.current && earthGroupRef.current) {
      earthGroupRef.current.remove(selectedMeshRef.current);
      selectedMeshRef.current.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      selectedMeshRef.current = null;
      selectedFillMatRef.current = null;
    }
  };

  const removeHoverMesh = () => {
    if (hoverMeshRef.current && earthGroupRef.current) {
      earthGroupRef.current.remove(hoverMeshRef.current);
      hoverMeshRef.current.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      hoverMeshRef.current = null;
      hoveredFeatureRef.current = null;
    }
  };

  const handleResetSelection = () => {
    sound.click();
    setSelectedTerritory(null);
    removeSelectedMesh();
    removeHoverMesh();
    setHoveredTerritory(null);
    // Resume rotation when unselecting
    if (onAutoRotateChange) {
      onAutoRotateChange(true);
    }
  };

  // Helper to subdivide flat triangles onto the 3D sphere shell
  const subdivideTriangle = (p1, p2, p3, radius, maxEdgeDist, maxDepth, depth, outPositions) => {
    const d12 = p1.distanceTo(p2);
    const d23 = p2.distanceTo(p3);
    const d31 = p3.distanceTo(p1);

    if (depth < maxDepth && (d12 > maxEdgeDist || d23 > maxEdgeDist || d31 > maxEdgeDist)) {
      const m12 = p1.clone().add(p2).normalize().multiplyScalar(radius);
      const m23 = p2.clone().add(p3).normalize().multiplyScalar(radius);
      const m31 = p3.clone().add(p1).normalize().multiplyScalar(radius);

      subdivideTriangle(p1, m12, m31, radius, maxEdgeDist, maxDepth, depth + 1, outPositions);
      subdivideTriangle(p2, m23, m12, radius, maxEdgeDist, maxDepth, depth + 1, outPositions);
      subdivideTriangle(p3, m31, m23, radius, maxEdgeDist, maxDepth, depth + 1, outPositions);
      subdivideTriangle(m12, m23, m31, radius, maxEdgeDist, maxDepth, depth + 1, outPositions);
    } else {
      outPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
    }
  };

  // Helper to subdivide border line segments along the curved sphere
  const addBorderSegment = (a, b, radius, maxDist, depth, maxDepth, positions) => {
    const d = a.distanceTo(b);
    if (depth < maxDepth && d > maxDist) {
      const mid = a.clone().add(b).normalize().multiplyScalar(radius);
      addBorderSegment(a, mid, radius, maxDist, depth + 1, maxDepth, positions);
      addBorderSegment(mid, b, radius, maxDist, depth + 1, maxDepth, positions);
    } else {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  };

  // Build a true 3D elevated territory mesh with extruded vertical side walls
  const createTerritoryMesh = (feature, {
    surfaceRadius = R_SELECT,
    borderRadius = R_SELECT + 0.003,
    baseRadius = R_HOVER_BASE,
    fillColor = 0x00f2fe,
    fillOpacity = 0.42,
    borderColor = 0x55ffff,
    borderOpacity = 1.0,
    hasWalls = true,
    wallColor = 0x00d8f6,
    wallOpacity = 0.32,
  } = {}) => {
    const group = new THREE.Group();
    const geom = feature.geometry;
    if (!geom) return group;

    const polyList =
      geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
        ? geom.coordinates
        : [];

    const fillPositions = [];
    const borderPositions = [];
    const wallPositions = [];

    polyList.forEach((poly) => {
      // 1. Elevated Borders & 3D Extrusion Side Walls
      poly.forEach((ring) => {
        for (let i = 0; i < ring.length - 1; i++) {
          const [lng1, lat1] = ring[i];
          const [lng2, lat2] = ring[i + 1];
          if (Math.abs(lng1 - lng2) > 180) continue;

          const p1 = new THREE.Vector3(...coordsToVector(lng1, lat1, borderRadius));
          const p2 = new THREE.Vector3(...coordsToVector(lng2, lat2, borderRadius));
          addBorderSegment(p1, p2, borderRadius, 0.08, 0, 4, borderPositions);

          if (hasWalls) {
            const b1 = coordsToVector(lng1, lat1, baseRadius);
            const b2 = coordsToVector(lng2, lat2, baseRadius);
            const t1 = coordsToVector(lng1, lat1, surfaceRadius);
            const t2 = coordsToVector(lng2, lat2, surfaceRadius);

            // Quad formed by 2 triangles
            wallPositions.push(
              b1[0], b1[1], b1[2],
              b2[0], b2[1], b2[2],
              t2[0], t2[1], t2[2]
            );
            wallPositions.push(
              b1[0], b1[1], b1[2],
              t2[0], t2[1], t2[2],
              t1[0], t1[1], t1[2]
            );
          }
        }
      });

      // 2. Triangulated Elevated Surface Fill
      const ring = poly[0];
      if (!ring || ring.length < 3) return;

      const cleanRing =
        ring.length > 2 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
          ? ring.slice(0, -1)
          : ring;

      if (cleanRing.length < 3) return;
      const vectorPoints = cleanRing.map(([lng, lat]) => new THREE.Vector2(lng, lat));

      try {
        const triangles = THREE.ShapeUtils.triangulateShape(vectorPoints, []);
        triangles.forEach((tri) => {
          const [lngA, latA] = cleanRing[tri[0]];
          const [lngB, latB] = cleanRing[tri[1]];
          const [lngC, latC] = cleanRing[tri[2]];

          if (
            Math.abs(lngA - lngB) > 180 ||
            Math.abs(lngB - lngC) > 180 ||
            Math.abs(lngC - lngA) > 180
          ) {
            return;
          }

          const p1 = new THREE.Vector3(...coordsToVector(lngA, latA, surfaceRadius));
          const p2 = new THREE.Vector3(...coordsToVector(lngB, latB, surfaceRadius));
          const p3 = new THREE.Vector3(...coordsToVector(lngC, latC, surfaceRadius));

          subdivideTriangle(p1, p2, p3, surfaceRadius, 0.08, 4, 0, fillPositions);
        });
      } catch (err) {
        console.warn('Triangulation fallback for polygon:', err);
      }
    });

    let fillMat = null;

    // Filled surface
    if (fillPositions.length > 0) {
      const fillGeo = new THREE.BufferGeometry();
      fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(fillPositions, 3));
      fillGeo.computeVertexNormals();

      fillMat = new THREE.MeshBasicMaterial({
        color: fillColor,
        transparent: true,
        opacity: fillOpacity,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });

      const fillMesh = new THREE.Mesh(fillGeo, fillMat);
      group.add(fillMesh);
    }

    // Extrusion walls (Side pedestal)
    if (wallPositions.length > 0) {
      const wallGeo = new THREE.BufferGeometry();
      wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
      wallGeo.computeVertexNormals();

      const wallMat = new THREE.MeshBasicMaterial({
        color: wallColor,
        transparent: true,
        opacity: wallOpacity,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });

      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      group.add(wallMesh);
    }

    // Glowing neon border lines
    if (borderPositions.length > 0) {
      const borderGeo = new THREE.BufferGeometry();
      borderGeo.setAttribute('position', new THREE.Float32BufferAttribute(borderPositions, 3));

      const borderMat = new THREE.LineBasicMaterial({
        color: borderColor,
        transparent: true,
        opacity: borderOpacity,
        depthTest: true,
        depthWrite: false,
      });

      const borderMesh = new THREE.LineSegments(borderGeo, borderMat);
      group.add(borderMesh);
    }

    group.userData = { fillMat };
    return group;
  };

  // Find country feature for a given coordinate
  const findCountryFeature = useCallback((lat, lng) => {
    if (!geoFeaturesRef.current || geoFeaturesRef.current.length === 0) return null;
    for (const f of geoFeaturesRef.current) {
      const [minLng, minLat, maxLng, maxLat] = f.bbox || [-180, -90, 180, 90];
      if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;

      const geom = f.geometry;
      if (!geom) continue;
      const polyList =
        geom.type === 'Polygon'
          ? [geom.coordinates]
          : geom.type === 'MultiPolygon'
          ? geom.coordinates
          : [];

      for (const poly of polyList) {
        if (poly && poly[0] && pointInPolygon([lng, lat], poly[0])) {
          return f;
        }
      }
    }
    return null;
  }, []);

  // Find country feature by ISO code or name
  const findFeatureByKeyOrName = useCallback((countryKey, name) => {
    if (!geoFeaturesRef.current || geoFeaturesRef.current.length === 0) return null;
    const cleanKey = (countryKey || '').toUpperCase().trim();
    const cleanName = (name || '').toLowerCase().trim();

    return geoFeaturesRef.current.find((f) => {
      const p = f.properties || {};
      const a3 = (p.ADM0_A3 || p.ISO_A3 || '').toUpperCase();
      const a2 = (p.ISO_A2 || '').toUpperCase();
      const sov = (p.SOVEREIGNT || p.SOV_A3 || '').toUpperCase();
      const n = (p.NAME || '').toLowerCase();
      const nFr = (p.NAME_FR || '').toLowerCase();
      const adm = (p.ADMIN || '').toLowerCase();

      if (cleanKey && (a3 === cleanKey || a2 === cleanKey || sov === cleanKey)) return true;
      if (cleanName && (n === cleanName || nFr === cleanName || adm === cleanName)) return true;
      return false;
    });
  }, []);

  // Smoothly fly camera to face 3D lat/lng on Earth
  const flyTo3DCoordinates = useCallback((lat, lng, zoom = 5) => {
    if (!cameraRef.current || !earthGroupRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const earthGroup = earthGroupRef.current;
    const controls = controlsRef.current;

    // Local 3D point on Earth
    const localVec = new THREE.Vector3(...coordsToVector(lng, lat, 1.0));
    // World space direction taking current Earth rotation into account
    const worldDir = localVec.clone().applyEuler(earthGroup.rotation).normalize();

    // Target distance based on zoom level: zoom 4-8 maps to dist 4.0 - 2.6
    const targetDist = Math.max(2.45, Math.min(4.5, 4.8 - (zoom || 5) * 0.32));
    const targetPos = worldDir.multiplyScalar(targetDist);

    const startPos = camera.position.clone();
    const startTime = performance.now();
    const duration = 1100; // ms

    const animateFly = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      // Smooth ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const startDir = startPos.clone().normalize();
      const endDir = targetPos.clone().normalize();
      const curDir = new THREE.Vector3().copy(startDir).lerp(endDir, ease).normalize();
      const curDist = THREE.MathUtils.lerp(startPos.length(), targetDist, ease);

      camera.position.copy(curDir.multiplyScalar(curDist));
      controls.target.set(0, 0, 0);
      controls.update();

      if (progress < 1.0) {
        requestAnimationFrame(animateFly);
      }
    };
    requestAnimationFrame(animateFly);
  }, []);

  // Apply full territory selection (both 3D mesh highlight and CountryDossierCard synchronization)
  const applyTerritorySelection = useCallback((foundFeature, lat, lng) => {
    if (!foundFeature) return;

    sound.click();

    // 1. Clear previous hover & select
    removeHoverMesh();
    setHoveredTerritory(null);
    removeSelectedMesh();
    setInspectedTarget(null);

    // 2. Create elevated glowing selected mesh
    const selectedMesh = createTerritoryMesh(foundFeature, {
      surfaceRadius: R_SELECT,
      borderRadius: R_SELECT + 0.003,
      baseRadius: R_HOVER_BASE,
      fillColor: 0x00f2fe,
      fillOpacity: 0.52,
      borderColor: 0xffffff,
      borderOpacity: 1.0,
      hasWalls: true,
      wallColor: 0x00f2fe,
      wallOpacity: 0.42,
    });

    if (earthGroupRef.current) {
      earthGroupRef.current.add(selectedMesh);
      selectedMeshRef.current = selectedMesh;
      selectedFillMatRef.current = selectedMesh.userData?.fillMat;
    }

    // 3. Extract properties & resolve geopolitics
    const props = foundFeature.properties || {};
    const rawName = props.NAME || props.SUBUNIT || props.ADMIN || 'Territoire';
    const displayName = TERRITORY_NAMES_FR[rawName] || props.NAME_FR || rawName;
    const sovereign = props.SOVEREIGNT || props.SOV_A3 || displayName;
    const continent = props.CONTINENT || 'International';
    const subregion = props.SUBREGION || '';
    const pop = props.POP_EST || props.POP2005;
    const popFormatted = pop ? Number(pop).toLocaleString('fr-FR') : 'N/A';
    const areaKm2 = getCountryAreaKm2(foundFeature);
    const areaFormatted = formatAreaKm2(areaKm2);

    const geopolitics = resolveCountryGeopolitics(rawName, props);

    // Fallback coordinates if lat/lng not provided
    const targetLat = typeof lat === 'number' ? lat : (foundFeature.bbox ? (foundFeature.bbox[1] + foundFeature.bbox[3]) / 2 : 0);
    const targetLng = typeof lng === 'number' ? lng : (foundFeature.bbox ? (foundFeature.bbox[0] + foundFeature.bbox[2]) / 2 : 0);

    const territoryObj = {
      name: displayName,
      rawName,
      sovereign,
      continent,
      subregion,
      pop: popFormatted,
      area: areaFormatted,
      areaKm2,
      centerLat: `${Math.abs(targetLat).toFixed(2)}° ${targetLat >= 0 ? 'N' : 'S'}`,
      centerLng: `${Math.abs(targetLng).toFixed(2)}° ${targetLng >= 0 ? 'E' : 'W'}`,
      centerCoords: [targetLat, targetLng],
      geopolitics,
      feature: foundFeature,
      primaryFeature: foundFeature,
      primaryName: displayName,
      flagUrl: geopolitics?.flagUrl,
      type: 'country',
    };

    setSelectedTerritory(territoryObj);

    if (onSelectCountry) {
      const code = geopolitics?.iso2 || props.ISO_A2 || displayName;
      onSelectCountry(code, displayName);
    }
  }, [onSelectCountry, setInspectedTarget]);

  // Keep ref to targetLocation for when GeoJSON finishes async loading
  const targetLocationRef = useRef(targetLocation);
  useEffect(() => {
    targetLocationRef.current = targetLocation;
  }, [targetLocation]);

  // Handle targetLocation changes (from search bar, drawer, or map jump)
  useEffect(() => {
    if (!targetLocation) return;
    const { lat, lng, zoom, countryKey, name } = targetLocation;
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

    flyTo3DCoordinates(lat, lng, zoom || 5);

    if (countryKey || name) {
      let feature = findFeatureByKeyOrName(countryKey, name);
      if (!feature) {
        feature = findCountryFeature(lat, lng);
      }
      if (feature) {
        applyTerritorySelection(feature, lat, lng);
      }
    }
  }, [targetLocation, flyTo3DCoordinates, findFeatureByKeyOrName, findCountryFeature, applyTerritorySelection]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 4.8);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 2.14;
    controls.maxDistance = 14.0;
    controls.enablePan = false;
    controls.autoRotate = false;
    controls.mouseButtons = {
      LEFT: null,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    controlsRef.current = controls;

    // 5. Deep Space Starfield
    const starCount = 3800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 70 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const tint = Math.random();
      if (tint < 0.65) {
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.98;
        starColors[i * 3 + 2] = 1.0;
      } else if (tint < 0.85) {
        starColors[i * 3] = 0.5;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 0.75;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: false,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);
    starFieldRef.current = starField;

    // 6. Earth Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // 7. Photorealistic Texture Loading with Max Anisotropy & Mipmapping
    const textureLoader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 8;

    const dayMap = textureLoader.load('/textures/earth_day.jpg');
    dayMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.anisotropy = maxAniso;
    dayMap.generateMipmaps = true;
    dayMap.minFilter = THREE.LinearMipmapLinearFilter;
    dayMap.magFilter = THREE.LinearFilter;

    const bumpMap = textureLoader.load('/textures/earth_bump.png');
    bumpMap.anisotropy = maxAniso;
    bumpMap.generateMipmaps = true;
    bumpMap.minFilter = THREE.LinearMipmapLinearFilter;

    const specMap = textureLoader.load('/textures/earth_specular.jpg');
    specMap.anisotropy = maxAniso;
    specMap.generateMipmaps = true;
    specMap.minFilter = THREE.LinearMipmapLinearFilter;

    const nightMap = textureLoader.load('/textures/earth_night.jpg');
    nightMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.anisotropy = maxAniso;
    nightMap.generateMipmaps = true;

    const cloudsMap = textureLoader.load('/textures/earth_clouds.png');
    cloudsMap.anisotropy = maxAniso;
    cloudsMap.generateMipmaps = true;

    // 8. Uniform Balanced Photorealistic Earth Shader (Google Earth / Awwwards 3D Standard)
    const earthGeo = new THREE.SphereGeometry(R_EARTH, 96, 96);
    const earthShader = {
      uniforms: {
        uDayMap: { value: dayMap },
        uNightMap: { value: nightMap },
        uBumpMap: { value: bumpMap },
        uSpecMap: { value: specMap },
        uCloudsMap: { value: cloudsMap },
        uCamDist: { value: 4.8 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uDayMap;
        uniform sampler2D uNightMap;
        uniform sampler2D uBumpMap;
        uniform sampler2D uSpecMap;
        uniform sampler2D uCloudsMap;
        uniform float uCamDist;
        uniform float uTime;

        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 normal = normalize(vWorldNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          // Topographic bump perturbation along UV tangent space for mountain relief
          float bumpScale = 0.016;
          vec2 dUvX = vec2(0.0008, 0.0);
          vec2 dUvY = vec2(0.0, 0.0008);
          float bCenter = texture2D(uBumpMap, vUv).r;
          float bX = texture2D(uBumpMap, vUv + dUvX).r - bCenter;
          float bY = texture2D(uBumpMap, vUv + dUvY).r - bCenter;
          vec3 perturbedNormal = normalize(normal - vec3(bX, bY, 0.0) * bumpScale);

          // Full-resolution texture samples
          vec4 dayColor = texture2D(uDayMap, vUv);
          vec4 nightColor = texture2D(uNightMap, vUv);
          float specVal = texture2D(uSpecMap, vUv).r; // 1.0 on water, 0.0 on land

          // Cloud shadows on ground (subtle organic drift)
          vec2 cloudUv = vec2(vUv.x + uTime * 0.00003, vUv.y);
          float cloudCover = texture2D(uCloudsMap, cloudUv).a;

          // Uniform, balanced global illumination (Google Earth / Awwwards)
          // The whole Earth is 100% visible and beautifully lit all around 360°
          vec3 lightDir = normalize(vec3(0.5, 0.7, 1.0));
          float NdotL = max(dot(perturbedNormal, lightDir), 0.0);
          float diffuse = 0.90 + 0.10 * NdotL; // High baseline: 90% to 100% illumination everywhere

          // Base surface color from high-res NASA Blue Marble
          vec3 baseSurface = dayColor.rgb;
          float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);

          // Deep, rich ocean water enhancement (No harsh white bleached blob!)
          if (specVal > 0.45) {
            // Enhance deep royal marine blue on oceans & seas
            baseSurface = mix(baseSurface, vec3(0.012, 0.08, 0.20), 0.16);
            // Delicate glancing water sheen (satin gloss at horizon angles)
            baseSurface += vec3(0.04, 0.14, 0.28) * pow(fresnel, 3.5) * 0.32;
          }

          // Subtle realistic cloud shadow on ground
          float shadowMultiplier = 1.0 - cloudCover * 0.20;
          vec3 surface = baseSurface * diffuse * shadowMultiplier;

          // Subtle city electrical luminescence overlay on continents
          vec3 cityLights = nightColor.rgb * vec3(1.15, 0.95, 0.65) * 0.38;
          surface += cityLights * (1.0 - specVal);

          // Elegant Rayleigh limb scattering (delicate electric blue atmosphere rim wrapping 360°)
          float limbHaze = pow(fresnel, 3.8) * 0.44;
          vec3 atmosHaze = vec3(0.12, 0.60, 1.0) * limbHaze;

          gl_FragColor = vec4(surface + atmosHaze, 1.0);
        }
      `,
    };

    const earthMat = new THREE.ShaderMaterial(earthShader);
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;
    earthShaderRef.current = earthShader;

    // 9. Vector Country Boundaries from subunits_50m.json
    fetch('/subunits_50m.json')
      .then((res) => res.json())
      .then((geoData) => {
        geoFeaturesRef.current = geoData.features || [];

        // Precompute bounding boxes
        geoData.features.forEach((f) => {
          let minLng = 180;
          let maxLng = -180;
          let minLat = 90;
          let maxLat = -90;

          const geom = f.geometry;
          if (!geom) return;
          const polyList =
            geom.type === 'Polygon'
              ? [geom.coordinates]
              : geom.type === 'MultiPolygon'
              ? geom.coordinates
              : [];

          polyList.forEach((poly) => {
            poly.forEach((ring) => {
              ring.forEach(([lng, lat]) => {
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
              });
            });
          });

          f.bbox = [minLng, minLat, maxLng, maxLat];
        });

        // If targetLocation was already requested before GeoJSON completed loading
        if (targetLocationRef.current) {
          const { lat, lng, countryKey, name } = targetLocationRef.current;
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            let feature = findFeatureByKeyOrName(countryKey, name);
            if (!feature) feature = findCountryFeature(lat, lng);
            if (feature) applyTerritorySelection(feature, lat, lng);
          }
        }

        const positions = [];
        geoData.features.forEach((f) => {
          const geom = f.geometry;
          if (!geom) return;
          const polyList =
            geom.type === 'Polygon'
              ? [geom.coordinates]
              : geom.type === 'MultiPolygon'
              ? geom.coordinates
              : [];

          polyList.forEach((poly) => {
            poly.forEach((ring) => {
              for (let i = 0; i < ring.length - 1; i++) {
                const [lng1, lat1] = ring[i];
                const [lng2, lat2] = ring[i + 1];

                if (Math.abs(lng1 - lng2) > 180) continue;

                const [x1, y1, z1] = coordsToVector(lng1, lat1, R_BORDERS);
                const [x2, y2, z2] = coordsToVector(lng2, lat2, R_BORDERS);
                positions.push(x1, y1, z1, x2, y2, z2);
              }
            });
          });
        });

        const bordersGeo = new THREE.BufferGeometry();
        bordersGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const bordersMat = new THREE.LineBasicMaterial({
          color: 0x00f2fe,
          transparent: true,
          opacity: 0.38,
          depthTest: true,
          depthWrite: false,
        });
        const bordersLines = new THREE.LineSegments(bordersGeo, bordersMat);
        earthGroup.add(bordersLines);
      })
      .catch((err) => console.error('Failed to load 3D GeoJSON borders:', err));

    // 10. Atmospheric Volumetric Clouds Layer (Ethereal, Soft White, Drifting)
    const cloudsGeo = new THREE.SphereGeometry(R_EARTH + 0.009, 80, 80);
    const cloudsMat = new THREE.ShaderMaterial({
      uniforms: {
        uCloudsMap: { value: cloudsMap },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uCloudsMap;
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          // Continuous slow drift
          vec2 uv = vec2(vUv.x + uTime * 0.000030, vUv.y);
          vec4 cloudTex = texture2D(uCloudsMap, uv);
          float density = cloudTex.a;

          vec3 view = normalize(vViewDir);
          vec3 norm = normalize(vNormal);
          float rim = 1.0 - max(dot(norm, view), 0.0);

          // Soft volumetric cloud density with feathering
          float alpha = density * 0.32 + pow(rim, 3.2) * density * 0.15;

          // Pure soft white cloud with subtle atmospheric tint
          gl_FragColor = vec4(vec3(0.97, 0.98, 1.0), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthGroup.add(cloudsMesh);
    cloudsShaderRef.current = cloudsMat;

    // 11. Cyan / Blue Atmospheric Outer Halo (Limb edge only 360°, 0.0 center)
    const atmosGeo = new THREE.SphereGeometry(R_EARTH + 0.055, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vEye;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vEye = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vEye;
        void main() {
          vec3 eye = normalize(vEye);
          float d = dot(-vNormal, eye);
          float edgeGlow = smoothstep(0.40, 0.0, d);
          float intensity = pow(edgeGlow, 2.2);
          vec3 atmosColor = vec3(0.14, 0.65, 1.0);
          gl_FragColor = vec4(atmosColor, intensity * 0.55);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // 11b. Realtime Telluric Events (Live Earthquakes)
    const unsubscribeStream = realtimeStream.subscribe((data) => {
      if (data.earthquakes) {
        updateEarthquakeMeshes(data.earthquakes);
      }
    });

    // 11c. Aviation Layer (Flightradar24 Live Commercial Fleet in 3D)
    const aviationGroup = new THREE.Group();
    earthGroup.add(aviationGroup);

    // Build authentic Flightradar24 yellow airplane silhouette in 3D (aerodynamic, zoom-adaptive scale)
    const planeShape = new THREE.Shape();
    const s = 0.0022; // Crisp, balanced Flightradar24 yellow silhouette visible from orbit
    planeShape.moveTo(0, 10 * s);
    planeShape.bezierCurveTo(-0.7 * s, 10 * s, -1.4 * s, 9.2 * s, -1.4 * s, 7.8 * s);
    planeShape.lineTo(-1.4 * s, 2.5 * s);
    planeShape.lineTo(-10.0 * s, -2.2 * s);
    planeShape.lineTo(-10.0 * s, -4.5 * s);
    planeShape.lineTo(-1.4 * s, -2.0 * s);
    planeShape.lineTo(-1.4 * s, -7.5 * s);
    planeShape.lineTo(-3.8 * s, -9.2 * s);
    planeShape.lineTo(-3.8 * s, -10.8 * s);
    planeShape.lineTo(0, -9.8 * s);
    planeShape.lineTo(3.8 * s, -10.8 * s);
    planeShape.lineTo(3.8 * s, -9.2 * s);
    planeShape.lineTo(1.4 * s, -7.5 * s);
    planeShape.lineTo(1.4 * s, -2.0 * s);
    planeShape.lineTo(10.0 * s, -4.5 * s);
    planeShape.lineTo(10.0 * s, -2.2 * s);
    planeShape.lineTo(1.4 * s, 2.5 * s);
    planeShape.bezierCurveTo(1.4 * s, 9.2 * s, 0.7 * s, 10 * s, 0, 10 * s);

    const airplaneGeom = new THREE.ExtrudeGeometry(planeShape, { depth: 0.0036, bevelEnabled: false });
    airplaneGeom.center();

    // Flightradar24 signature gold yellow with double-sided rendering
    const airplaneMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide });
    const planesInstancedMesh = new THREE.InstancedMesh(airplaneGeom, airplaneMat, 10000);
    planesInstancedMesh.count = 0;
    planesInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    aviationGroup.add(planesInstancedMesh);

    let currentLiveFlights = [];
    const dummyPlaneMatrix = new THREE.Matrix4();
    const upWorldVector = new THREE.Vector3(0, 1, 0);

    // Pre-allocated scratch objects for zero-allocation 60 FPS performance
    const scratchPos = new THREE.Vector3();
    const scratchNormal = new THREE.Vector3();
    const scratchNorth = new THREE.Vector3();
    const scratchEast = new THREE.Vector3();
    const scratchHeading = new THREE.Vector3();
    const scratchRight = new THREE.Vector3();
    const scratchRotMatrix = new THREE.Matrix4();
    const scratchQuat = new THREE.Quaternion();
    const scratchScale = new THREE.Vector3();
    const scratchSatTangent = new THREE.Vector3();
    const upZAxis = new THREE.Vector3(0, 0, 1);
    const scratchDirVector = new THREE.Vector3();

    const update3DPlanes = (flightsList) => {
      if (!planesInstancedMesh || !flightsList || flightsList.length === 0) return;
      try {
        currentLiveFlights = flightsList;
        const count = Math.min(flightLimitRef.current || 3500, flightsList.length, 10000);
        let validCount = 0;

        // Dynamic scale factor: smoothly scales aircraft down as user zooms into surface
        const camDist = camera.position.length();
        const zoomScaleFactor = THREE.MathUtils.clamp((camDist - 1.95) / 3.4, 0.22, 1.0);

        for (let i = 0; i < count; i++) {
          const fl = flightsList[i];
          if (!fl || typeof fl.lat !== 'number' || typeof fl.lng !== 'number' || isNaN(fl.lat) || isNaN(fl.lng)) continue;

          // Elevate cleanly above cloud sphere (2.008) and borders into the stratosphere for crystal-clear visibility
          const planeAlt = R_EARTH + 0.022 + ((fl.altitudeFt || 30000) / 60000) * 0.016;
          const [x, y, z] = coordsToVector(fl.lng, fl.lat, planeAlt);
          scratchPos.set(x, y, z);
          scratchNormal.copy(scratchPos).normalize();

          const normalDotUp = scratchNormal.dot(upWorldVector);
          scratchNorth.copy(upWorldVector).addScaledVector(scratchNormal, -normalDotUp);
          if (scratchNorth.lengthSq() < 0.0001) {
            scratchNorth.set(0, 0, 1);
          } else {
            scratchNorth.normalize();
          }
          scratchEast.crossVectors(scratchNormal, scratchNorth).normalize();

          const rad = ((fl.track || fl.heading || 0) * Math.PI) / 180;
          scratchHeading.copy(scratchNorth).multiplyScalar(Math.cos(rad)).addScaledVector(scratchEast, Math.sin(rad)).normalize();
          scratchRight.crossVectors(scratchHeading, scratchNormal).normalize();

          // Map shape: X -> right, Y -> heading (nose), Z -> normal (surface altitude)
          scratchRotMatrix.makeBasis(scratchRight, scratchHeading, scratchNormal);
          scratchQuat.setFromRotationMatrix(scratchRotMatrix);

          const isWidebody = fl.aircraftCode?.startsWith('A38') || fl.aircraftCode?.startsWith('B77') || fl.aircraftCode?.startsWith('B74') || fl.aircraftCode?.startsWith('A35');
          const sVal = (isWidebody ? 1.25 : 1.0) * zoomScaleFactor;
          scratchScale.set(sVal, sVal, sVal);

          dummyPlaneMatrix.compose(scratchPos, scratchQuat, scratchScale);
          planesInstancedMesh.setMatrixAt(validCount, dummyPlaneMatrix);
          validCount++;
        }

        planesInstancedMesh.count = validCount;
        planesInstancedMesh.instanceMatrix.needsUpdate = true;
      } catch (err) {
        console.warn('update3DPlanes error:', err);
      }
    };

    update3DPlanesRef.current = update3DPlanes;

    // Immediate initial population so airplanes appear on the very first frame
    if (flightRadarService.flights.length > 0) {
      update3DPlanes(flightRadarService.flights);
    }

    // Selected flight corridor line & airport pins
    let selectedFlightGroup = null;
    const updateSelectedFlightPath = (fl) => {
      try {
        if (selectedFlightGroup) {
          aviationGroup.remove(selectedFlightGroup);
          selectedFlightGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          selectedFlightGroup = null;
        }
        if (!fl) return;

        selectedFlightGroup = new THREE.Group();

        // 1. Targeting Reticle on the selected aircraft itself (pulsing cyan ring)
        const lat = fl.lat ?? fl.origin?.coords?.[0];
        const lng = fl.lng ?? fl.origin?.coords?.[1];
        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          const planeRadius = R_EARTH + 0.024 + ((fl.altitudeFt || 30000) / 60000) * 0.016;
          const vPlane = new THREE.Vector3(...coordsToVector(lng, lat, planeRadius));
          if (!isNaN(vPlane.x) && !isNaN(vPlane.y) && !isNaN(vPlane.z)) {
            const targetRingGeom = new THREE.RingGeometry(0.018, 0.026, 32);
            const targetRingMat = new THREE.MeshBasicMaterial({
              color: 0x00ffff,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.95,
            });
            const targetRing = new THREE.Mesh(targetRingGeom, targetRingMat);
            targetRing.position.copy(vPlane);
            targetRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vPlane.clone().normalize());
            selectedFlightGroup.add(targetRing);
          }
        }

        // 2. 3D Great Circle Trajectory Arc connecting Departure -> Cruise -> Destination
        const origCoords = fl.origin?.coords;
        const destCoords = fl.destination?.coords;
        if (origCoords && destCoords && origCoords.length === 2 && destCoords.length === 2) {
          const steps = 50;
          const arcPoints = [];
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const [ptLat, ptLng] = interpolateGreatCircle(origCoords, destCoords, t);
            if (!isNaN(ptLat) && !isNaN(ptLng)) {
              // Altitude curve: rises from ground at airports to cruise altitude above the globe
              const altApex = 0.038;
              const altOffset = Math.sin(t * Math.PI) * altApex;
              const r = R_EARTH + 0.006 + altOffset;
              const [x, y, z] = coordsToVector(ptLng, ptLat, r);
              arcPoints.push(new THREE.Vector3(x, y, z));
            }
          }

          if (arcPoints.length > 1) {
            const curveGeom = new THREE.BufferGeometry().setFromPoints(arcPoints);
            const curveMat = new THREE.LineBasicMaterial({
              color: 0x00f2fe,
              transparent: true,
              opacity: 0.85,
            });
            const flightArc = new THREE.Line(curveGeom, curveMat);
            selectedFlightGroup.add(flightArc);

            // Departure Airport Pin (Emerald)
            const [oLat, oLng] = origCoords;
            const [ox, oy, oz] = coordsToVector(oLng, oLat, R_EARTH + 0.005);
            const origPinGeom = new THREE.SphereGeometry(0.008, 16, 16);
            const origPinMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
            const origPinMesh = new THREE.Mesh(origPinGeom, origPinMat);
            origPinMesh.position.set(ox, oy, oz);
            selectedFlightGroup.add(origPinMesh);

            // Destination Airport Pin (Amber)
            const [dLat, dLng] = destCoords;
            const [dx, dy, dz] = coordsToVector(dLng, dLat, R_EARTH + 0.005);
            const destPinGeom = new THREE.SphereGeometry(0.008, 16, 16);
            const destPinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
            const destPinMesh = new THREE.Mesh(destPinGeom, destPinMat);
            destPinMesh.position.set(dx, dy, dz);
            selectedFlightGroup.add(destPinMesh);
          }
        }

        aviationGroup.add(selectedFlightGroup);
      } catch (err) {
        console.warn('updateSelectedFlightPath error:', err);
      }
    };

    updateSelectedFlightPathRef.current = updateSelectedFlightPath;
    if (inspectedTarget?.type === 'flight') {
      updateSelectedFlightPath(inspectedTarget);
    }

    const unsubscribeFR24_3D = flightRadarService.subscribe((flights) => {
      update3DPlanes(flights);
    });

    // 11c-2. Maritime Shipping Fleet Layer (MarineTraffic Worldwide AIS Fleet in 3D)
    const maritimeGroup = new THREE.Group();
    earthGroup.add(maritimeGroup);

    // Build authentic hydrodynamic ship hull silhouette in 3D (pointed bow, slender midship, transom stern)
    const shipShape = new THREE.Shape();
    const vs = 0.0017; // Visible, sleek scale for commercial vessels on orbit
    shipShape.moveTo(0, 7.5 * vs); // Bow tip
    shipShape.bezierCurveTo(-1.8 * vs, 4.0 * vs, -2.0 * vs, 0, -2.0 * vs, -5.5 * vs);
    shipShape.lineTo(-1.4 * vs, -7.5 * vs); // Port stern
    shipShape.lineTo(1.4 * vs, -7.5 * vs); // Starboard stern
    shipShape.bezierCurveTo(2.0 * vs, -5.5 * vs, 2.0 * vs, 0, 1.8 * vs, 4.0 * vs);
    shipShape.closePath();

    const shipGeom = new THREE.ExtrudeGeometry(shipShape, { depth: 0.0035, bevelEnabled: false });
    shipGeom.center();

    // High performance instanced mesh with double-sided rendering and dynamic vertex colors
    const shipMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const vesselsInstancedMesh = new THREE.InstancedMesh(shipGeom, shipMat, 27000);
    vesselsInstancedMesh.count = 0;
    vesselsInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    maritimeGroup.add(vesselsInstancedMesh);

    let currentLiveVessels = [];
    const dummyVesselMatrix = new THREE.Matrix4();
    const tempVesselColor = new THREE.Color();

    const update3DVessels = (vesselsList) => {
      if (!vesselsInstancedMesh || !vesselsList || vesselsList.length === 0) return;
      try {
        currentLiveVessels = vesselsList;
        const count = Math.min(vesselLimitRef.current || 5000, vesselsList.length, 27000);
        let validCount = 0;

        // Dynamic scale factor: smoothly scales vessels down as user zooms into surface
        const camDist = camera.position.length();
        const zoomScaleFactor = THREE.MathUtils.clamp((camDist - 1.95) / 3.4, 0.22, 1.0);

        for (let i = 0; i < count; i++) {
          const ves = vesselsList[i];
          if (!ves || typeof ves.lat !== 'number' || typeof ves.lng !== 'number' || isNaN(ves.lat) || isNaN(ves.lng)) continue;

          // Place ship smoothly on ocean surface
          const [x, y, z] = coordsToVector(ves.lng, ves.lat, R_EARTH + 0.0042);
          scratchPos.set(x, y, z);
          scratchNormal.copy(scratchPos).normalize();

          const normalDotUp = scratchNormal.dot(upWorldVector);
          scratchNorth.copy(upWorldVector).addScaledVector(scratchNormal, -normalDotUp);
          if (scratchNorth.lengthSq() < 0.0001) {
            scratchNorth.set(0, 0, 1);
          } else {
            scratchNorth.normalize();
          }
          scratchEast.crossVectors(scratchNormal, scratchNorth).normalize();

          // True heading/course from AIS
          const rad = ((ves.course || 0) * Math.PI) / 180;
          scratchHeading.copy(scratchNorth).multiplyScalar(Math.cos(rad)).addScaledVector(scratchEast, Math.sin(rad)).normalize();
          scratchRight.crossVectors(scratchHeading, scratchNormal).normalize();

          // Orientation: X -> starboard (right), Y -> bow heading (nose), Z -> normal (up from sea)
          scratchRotMatrix.makeBasis(scratchRight, scratchHeading, scratchNormal);
          scratchQuat.setFromRotationMatrix(scratchRotMatrix);

          // Scaled according to vessel length and zoom factor
          const lengthFactor = (ves.lengthM ? Math.max(0.75, Math.min(1.45, ves.lengthM / 280)) : 1.0) * zoomScaleFactor;
          scratchScale.set(lengthFactor, lengthFactor, lengthFactor);

          dummyVesselMatrix.compose(scratchPos, scratchQuat, scratchScale);
          vesselsInstancedMesh.setMatrixAt(validCount, dummyVesselMatrix);

          // MarineTraffic category colors: Tanker (red), Cargo (cyan), LNG (emerald), Bulk (blue), Passenger (purple), Tug (amber)
          tempVesselColor.set(ves.color || '#06b6d4');
          vesselsInstancedMesh.setColorAt(validCount, tempVesselColor);

          validCount++;
        }

        vesselsInstancedMesh.count = validCount;
        vesselsInstancedMesh.instanceMatrix.needsUpdate = true;
        if (vesselsInstancedMesh.instanceColor) {
          vesselsInstancedMesh.instanceColor.needsUpdate = true;
        }
      } catch (err) {
        console.warn('update3DVessels error:', err);
      }
    };

    update3DVesselsRef.current = update3DVessels;

    const unsubscribeMTS_3D = marineTrafficService.subscribe((vessels) => {
      update3DVessels(vessels);
    });

    // Selected vessel tactical marker on ocean surface (concentric pulse ring + vertical laser locator)
    let selectedVesselGroup = null;
    const updateSelectedVesselMarker = (ves) => {
      try {
        if (selectedVesselGroup) {
          maritimeGroup.remove(selectedVesselGroup);
          selectedVesselGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          selectedVesselGroup = null;
        }
        if (!ves || typeof ves.lat !== 'number' || typeof ves.lng !== 'number') return;

        selectedVesselGroup = new THREE.Group();
        const [vx, vy, vz] = coordsToVector(ves.lng, ves.lat, R_EARTH + 0.005);
        const vShip = new THREE.Vector3(vx, vy, vz);
        const shipNormal = vShip.clone().normalize();

        // 1. Concentric target reticle on ocean surface
        const ringGeom = new THREE.RingGeometry(0.016, 0.024, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f5a0,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92,
          depthTest: true,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.copy(vShip);
        ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), shipNormal);
        selectedVesselGroup.add(ringMesh);

        // 2. Subtle vertical laser beacon line pointing up into orbit
        const beaconGeom = new THREE.CylinderGeometry(0.0015, 0.0035, 0.08, 16);
        beaconGeom.translate(0, 0.04, 0);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0x00f5a0,
          transparent: true,
          opacity: 0.7,
        });
        const beacon = new THREE.Mesh(beaconGeom, beaconMat);
        beacon.position.copy(vShip);
        beacon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), shipNormal);
        selectedVesselGroup.add(beacon);

        // 3. 3D Maritime Route Waypoints & Port Pins (Full Parity with 2D)
        if (ves.routeWaypoints && ves.routeWaypoints.length > 1) {
          const pts3D = ves.routeWaypoints.map(([wLat, wLng]) => {
            const [wx, wy, wz] = coordsToVector(wLng, wLat, R_EARTH + 0.0042);
            return new THREE.Vector3(wx, wy, wz);
          });
          const routeGeom = new THREE.BufferGeometry().setFromPoints(pts3D);
          const routeMat = new THREE.LineBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.85,
          });
          const routeLine = new THREE.Line(routeGeom, routeMat);
          selectedVesselGroup.add(routeLine);

          // Departure Port Pin
          const [startLat, startLng] = ves.routeWaypoints[0];
          const [sx, sy, sz] = coordsToVector(startLng, startLat, R_EARTH + 0.005);
          const startPinGeom = new THREE.SphereGeometry(0.007, 16, 16);
          const startPinMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
          const startPin = new THREE.Mesh(startPinGeom, startPinMat);
          startPin.position.set(sx, sy, sz);
          selectedVesselGroup.add(startPin);

          // Destination Port Pin
          const [endLat, endLng] = ves.routeWaypoints[ves.routeWaypoints.length - 1];
          const [ex, ey, ez] = coordsToVector(endLng, endLat, R_EARTH + 0.005);
          const endPinGeom = new THREE.SphereGeometry(0.007, 16, 16);
          const endPinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
          const endPin = new THREE.Mesh(endPinGeom, endPinMat);
          endPin.position.set(ex, ey, ez);
          selectedVesselGroup.add(endPin);
        }

        maritimeGroup.add(selectedVesselGroup);
      } catch (err) {
        console.warn('updateSelectedVesselMarker error:', err);
      }
    };
    updateSelectedVesselMarkerRef.current = updateSelectedVesselMarker;
    if (inspectedTarget?.type === 'vessel') {
      updateSelectedVesselMarker(inspectedTarget);
    }

    // 11d. Cyber Warfare Layer (Kaspersky Cybermap Parabolic Laser Arcs + Multi-Spark Photons + Concentric Impact Waves)
    const cyberGroup = new THREE.Group();
    earthGroup.add(cyberGroup);
    const activeAttacks = [];
    const cyberClickMeshes = [];

    CYBER_ATTACK_VECTORS.forEach((vec, idx) => {
      const [fromLat, fromLng] = vec.from;
      const [toLat, toLng] = vec.to;
      const vFrom = new THREE.Vector3(...coordsToVector(fromLng, fromLat, R_EARTH + 0.006));
      const vTo = new THREE.Vector3(...coordsToVector(toLng, toLat, R_EARTH + 0.006));
      const dist = vFrom.distanceTo(vTo);
      const apex = R_EARTH + Math.min(0.52, 0.12 + dist * 0.22);
      const vMid = vFrom.clone().add(vTo).multiplyScalar(0.5).normalize().multiplyScalar(apex);

      const curve = new THREE.QuadraticBezierCurve3(vFrom, vMid, vTo);
      const points = curve.getPoints(55);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const arcColor = new THREE.Color(vec.color || (vec.severity === 'CRITICAL' ? '#ef4444' : '#8b5cf6'));
      const lineMat = new THREE.LineBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: 0.55,
      });
      const arcLine = new THREE.Line(lineGeom, lineMat);
      arcLine.userData = { isCyber: true, cyber: vec };
      cyberGroup.add(arcLine);

      // 1. Origin Emitter Pulse Ring
      const originGeom = new THREE.RingGeometry(0.005, 0.016, 16);
      const originMat = new THREE.MeshBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const originMesh = new THREE.Mesh(originGeom, originMat);
      originMesh.position.copy(vFrom);
      originMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vFrom.clone().normalize());
      cyberGroup.add(originMesh);

      // 2. Traveling Laser Packet: Leading Photon Head + Trailing Spark
      const headGeom = new THREE.SphereGeometry(0.016, 10, 10);
      const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const headMesh = new THREE.Mesh(headGeom, headMat);
      cyberGroup.add(headMesh);

      const trailGeom = new THREE.SphereGeometry(0.011, 8, 8);
      const trailMat = new THREE.MeshBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: 0.8,
      });
      const trailMesh = new THREE.Mesh(trailGeom, trailMat);
      cyberGroup.add(trailMesh);

      // 3. Concentric Impact Shockwave Ripple Ring (Expanding on ground arrival)
      const impactGeom = new THREE.RingGeometry(0.010, 0.032, 24);
      const impactMat = new THREE.MeshBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const impactMesh = new THREE.Mesh(impactGeom, impactMat);
      impactMesh.position.copy(vTo);
      impactMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vTo.clone().normalize());
      cyberGroup.add(impactMesh);

      // 4. Click Hitbox Proxies for effortless 3D selection
      const targetHitGeom = new THREE.SphereGeometry(0.052, 8, 8);
      const targetHitMat = new THREE.MeshBasicMaterial({ visible: false });
      const targetHitMesh = new THREE.Mesh(targetHitGeom, targetHitMat);
      targetHitMesh.position.copy(vTo);
      targetHitMesh.userData = { isCyber: true, cyber: vec };
      cyberGroup.add(targetHitMesh);
      cyberClickMeshes.push(targetHitMesh);

      const sourceHitGeom = new THREE.SphereGeometry(0.045, 8, 8);
      const sourceHitMat = new THREE.MeshBasicMaterial({ visible: false });
      const sourceHitMesh = new THREE.Mesh(sourceHitGeom, sourceHitMat);
      sourceHitMesh.position.copy(vFrom);
      sourceHitMesh.userData = { isCyber: true, cyber: vec };
      cyberGroup.add(sourceHitMesh);
      cyberClickMeshes.push(sourceHitMesh);

      // Realistic pulse speed: laser beam takes ~1.8 to 2.8 seconds across globe
      activeAttacks.push({
        curve,
        headMesh,
        trailMesh,
        impactMesh,
        impactMat,
        originMesh,
        arcLine,
        speed: 0.0055 + (idx % 4) * 0.0018,
        offset: (idx * 0.19) % 1,
      });
    });

    // 11e. Geopolitical Conflicts Layer (Radar circles & Ballistic Trajectories)
    const conflictsGroup = new THREE.Group();
    earthGroup.add(conflictsGroup);
    let activeHotspots = [];
    let activeTrajectories = [];
    const conflictClickMeshes = [];

    const updateConflicts3D = (year) => {
      while (conflictsGroup.children.length > 0) {
        const obj = conflictsGroup.children[0];
        conflictsGroup.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      }
      activeHotspots = [];
      activeTrajectories = [];
      conflictClickMeshes.length = 0;

      const zones = getGeopoliticalZonesForYear(year);
      zones.forEach((zone) => {
        const [x, y, z] = coordsToVector(zone.lng, zone.lat, R_EARTH + 0.007);
        const pos = new THREE.Vector3(x, y, z);
        const hexColor = zone.defcon === 'DÉFCON 1' ? 0xff0033 : zone.defcon === 'DÉFCON 2' ? 0xff2a4d : 0xffb703;

        // Outer radar pulse ring
        const radarGeom = new THREE.RingGeometry(0.018, 0.055, 24);
        const radarMat = new THREE.MeshBasicMaterial({
          color: hexColor,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        });
        const radarMesh = new THREE.Mesh(radarGeom, radarMat);
        radarMesh.position.copy(pos);
        radarMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
        conflictsGroup.add(radarMesh);

        // Core dot
        const dotGeom = new THREE.SphereGeometry(0.014, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: hexColor });
        const dotMesh = new THREE.Mesh(dotGeom, dotMat);
        dotMesh.position.copy(pos);
        conflictsGroup.add(dotMesh);

        // Click proxy for conflict zone
        const conflictHitGeom = new THREE.SphereGeometry(0.07, 8, 8);
        const conflictHitMat = new THREE.MeshBasicMaterial({ visible: false });
        const conflictHitMesh = new THREE.Mesh(conflictHitGeom, conflictHitMat);
        conflictHitMesh.position.copy(pos);
        conflictHitMesh.userData = { isConflict: true, conflict: zone };
        conflictsGroup.add(conflictHitMesh);
        conflictClickMeshes.push(conflictHitMesh);

        activeHotspots.push({
          radarMesh,
          radarMat,
        });
      });

      // Contemporary era (>= 2020) ballistic trajectories
      if (year >= 2020) {
        BALLISTIC_TRAJECTORIES.forEach((traj) => {
          const vFrom = new THREE.Vector3(...coordsToVector(traj.startLng, traj.startLat, R_EARTH + 0.006));
          const vTo = new THREE.Vector3(...coordsToVector(traj.endLng, traj.endLat, R_EARTH + 0.006));
          const dist = vFrom.distanceTo(vTo);
          const apex = R_EARTH + Math.min(0.35, 0.05 + dist * 0.28);
          const vMid = vFrom.clone().add(vTo).multiplyScalar(0.5).normalize().multiplyScalar(apex);

          const curve = new THREE.QuadraticBezierCurve3(vFrom, vMid, vTo);
          const points = curve.getPoints(45);
          const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
          const arcColor = new THREE.Color(traj.color || '#ff2a4d');
          const lineMat = new THREE.LineBasicMaterial({
            color: arcColor,
            transparent: true,
            opacity: 0.65,
          });
          const arcLine = new THREE.Line(lineGeom, lineMat);
          conflictsGroup.add(arcLine);

          // Moving missile pulse
          const missileGeom = new THREE.SphereGeometry(0.013, 8, 8);
          const missileMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const missileMesh = new THREE.Mesh(missileGeom, missileMat);
          missileMesh.position.copy(vFrom);
          conflictsGroup.add(missileMesh);

          // Clickable hit proxy for missile trajectory
          const trajHitGeom = new THREE.SphereGeometry(0.06, 8, 8);
          const trajHitMat = new THREE.MeshBasicMaterial({ visible: false });
          const trajHitMesh = new THREE.Mesh(trajHitGeom, trajHitMat);
          trajHitMesh.position.copy(vMid);
          trajHitMesh.userData = {
            isConflict: true,
            conflict: {
              type: 'conflict',
              name: traj.name,
              defcon: 'ALERTE BALISTIQUE',
              status: traj.status,
              alert: traj.alert,
              details: `${traj.weapon} — De ${traj.origin} vers ${traj.target}. ${traj.details}`,
              activeMissiles: 1,
              speedMach: traj.speedMach,
              apogeeKm: traj.apogeeKm,
            },
          };
          conflictsGroup.add(trajHitMesh);
          conflictClickMeshes.push(trajHitMesh);

          activeTrajectories.push({
            missileMesh,
            curve,
            speed: 0.007 + (traj.speedMach || 5) * 0.001,
          });
        });
      }
    };

    updateConflicts3DRef.current = updateConflicts3D;
    updateConflicts3D(selectedYear);

    // 11f. Earthquakes Layer (Real USGS Live Seismic Epicenters)
    const earthquakesGroup = new THREE.Group();
    earthGroup.add(earthquakesGroup);
    let earthquakeMeshes = [];
    let earthquakeClickMeshes = [];

    const updateEarthquakeMeshes = (eqList) => {
      earthquakeMeshes.forEach((m) => {
        earthquakesGroup.remove(m.mesh);
        m.mesh.geometry.dispose();
        m.mat.dispose();
      });
      earthquakeClickMeshes.forEach((m) => {
        earthquakesGroup.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      });
      earthquakeMeshes = [];
      earthquakeClickMeshes = [];

      (eqList || []).slice(0, 50).forEach((eq) => {
        const mag = parseFloat(eq.mag) || 3.0;
        const color = mag >= 5.0 ? 0xff2a4d : mag >= 4.0 ? 0xffb703 : 0x00f2fe;
        const radius = 0.012 + (mag / 8) * 0.035;
        const [x, y, z] = coordsToVector(eq.lng, eq.lat, R_EARTH + 0.007);
        const pos = new THREE.Vector3(x, y, z);

        const geom = new THREE.RingGeometry(radius * 0.4, radius, 20);
        const mat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(pos);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
        earthquakesGroup.add(mesh);

        // Click proxy for reliable selection in 3D
        const hitGeom = new THREE.SphereGeometry(Math.max(0.045, radius * 1.8), 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeom, hitMat);
        hitMesh.position.copy(pos);
        hitMesh.userData = { isEarthquake: true, earthquake: eq };
        earthquakesGroup.add(hitMesh);
        earthquakeClickMeshes.push(hitMesh);

        earthquakeMeshes.push({ mesh, mat, baseRadius: radius });
      });
    };

    // 11g. Satellites Layer (Keplerian Orbital Trajectory Rings & Starlink Swarm in 3D)
    const satellitesGroup = new THREE.Group();
    earthGroup.add(satellitesGroup);
    const activeSatellites = [];
    const satelliteClickMeshes = [];

    // Reusable math objects for Keplerian orbits (zero GC allocations)
    const axisX = new THREE.Vector3(1, 0, 0);
    const axisY = new THREE.Vector3(0, 1, 0);
    const scratchNextOrbitalPos = new THREE.Vector3();

    // Helper: Compute Keplerian 3D orbital position directly into a target vector
    const computeKeplerianOrbitalVector = (target, radius, inclinationDeg, raanDeg, thetaRad) => {
      target.set(radius * Math.cos(thetaRad), 0, radius * Math.sin(thetaRad));
      target.applyAxisAngle(axisX, (inclinationDeg * Math.PI) / 180);
      target.applyAxisAngle(axisY, (raanDeg * Math.PI) / 180);
      return target;
    };

    const getKeplerianOrbitalVector = (radius, inclinationDeg, raanDeg, thetaRad) => {
      return computeKeplerianOrbitalVector(new THREE.Vector3(), radius, inclinationDeg, raanDeg, thetaRad);
    };

    SATELLITES_DATA.forEach((sat, idx) => {
      let R_orb;
      if (sat.orbitType === 'GEO' || sat.altitudeKm > 30000) {
        R_orb = R_EARTH + 0.88; // GEO outer shell
      } else if (sat.orbitType === 'MEO' || sat.altitudeKm > 1500) {
        R_orb = R_EARTH + 0.44 + ((sat.altitudeKm - 2000) / 25000) * 0.28; // MEO GPS & Galileo
      } else {
        R_orb = R_EARTH + 0.16 + (sat.altitudeKm / 1200) * 0.14; // LEO ISS & Starlink
      }

      const raan = sat.raan !== undefined ? sat.raan : (idx * 37) % 360;

      // 1. Continuous 3D Orbital Trajectory Ring
      const orbitPoints = [];
      const segments = 120;
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        orbitPoints.push(getKeplerianOrbitalVector(R_orb, sat.inclination, raan, theta));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const ringMat = new THREE.LineBasicMaterial({
        color: sat.color ? new THREE.Color(sat.color) : 0x00f2fe,
        transparent: true,
        opacity: sat.orbitType === 'GEO' ? 0.6 : 0.35,
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      satellitesGroup.add(ringLine);

      // 2. High-Precision Satellite Avionics Mesh
      const satGroup = new THREE.Group();

      // Main Bus / Chassis
      const bodyGeom = new THREE.OctahedronGeometry(sat.orbitType === 'GEO' ? 0.022 : 0.016, 0);
      const bodyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      satGroup.add(bodyMesh);

      // Solar Array Wings
      const panelGeom = new THREE.BoxGeometry(sat.orbitType === 'GEO' ? 0.06 : 0.042, 0.008, 0.002);
      const panelMat = new THREE.MeshBasicMaterial({ color: sat.color ? new THREE.Color(sat.color) : 0x00f2fe });
      const panelMesh = new THREE.Mesh(panelGeom, panelMat);
      satGroup.add(panelMesh);

      // Glowing Orbital Beacon Halo
      const haloGeom = new THREE.RingGeometry(0.012, 0.025, 18);
      const haloMat = new THREE.MeshBasicMaterial({
        color: sat.color ? new THREE.Color(sat.color) : 0x00f2fe,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      const haloMesh = new THREE.Mesh(haloGeom, haloMat);
      satGroup.add(haloMesh);

      // Invisible click proxy sphere for reliable 3D raycasting
      const satHitGeom = new THREE.SphereGeometry(0.048, 8, 8);
      const satHitMat = new THREE.MeshBasicMaterial({ visible: false });
      const satHitMesh = new THREE.Mesh(satHitGeom, satHitMat);
      satHitMesh.userData = { satellite: sat };
      satGroup.add(satHitMesh);

      satGroup.userData = { satellite: sat };
      satellitesGroup.add(satGroup);
      satelliteClickMeshes.push(satHitMesh);
      satelliteClickMeshes.push(bodyMesh);
      bodyMesh.userData = { satellite: sat };

      // Physics angular velocity scaling:
      // Real physical proportions:
      // GEO: 24h period (geostationary) -> matches Earth rotation exactly!
      // MEO: 12h period -> ~2x Earth rotation
      // LEO: 90min period -> ~16x Earth rotation (smooth majestic glide)
      let speedFactor;
      if (sat.orbitType === 'GEO') {
        speedFactor = 0.00010; // strictly synchronized with Earth auto-rotation
      } else if (sat.orbitType === 'MEO') {
        speedFactor = 0.00022; // ~12h period
      } else {
        speedFactor = 0.00085 + (idx % 3) * 0.00010; // LEO majestic slow crawl (~90 min period)
      }

      activeSatellites.push({
        sat,
        R_orb,
        inclination: sat.inclination,
        raan,
        mesh: satGroup,
        haloMesh,
        speed: speedFactor,
        phase: (idx * 0.8) % (Math.PI * 2),
      });
    });

    // Starlink Constellation Swarm (32 active nodes across 4 orbital planes)
    const starlinkSwarmGroup = new THREE.Group();
    satellitesGroup.add(starlinkSwarmGroup);
    const starlinkNodes = [];
    const starlinkPlanes = [0, 90, 180, 270];

    // 4 Glowing Orbital Plane Rings
    starlinkPlanes.forEach((planeRaan) => {
      const planePoints = [];
      const R_STARLINK = R_EARTH + 0.20;
      for (let j = 0; j <= 80; j++) {
        const theta = (j / 80) * Math.PI * 2;
        planePoints.push(getKeplerianOrbitalVector(R_STARLINK, 53.2, planeRaan, theta));
      }
      const planeGeo = new THREE.BufferGeometry().setFromPoints(planePoints);
      const planeMat = new THREE.LineBasicMaterial({
        color: 0x00f5a0,
        transparent: true,
        opacity: 0.22,
      });
      starlinkSwarmGroup.add(new THREE.Line(planeGeo, planeMat));
    });

    STARLINK_SWARM_NODES.forEach((node) => {
      const R_STARLINK = R_EARTH + 0.20;
      const nodeGeom = new THREE.SphereGeometry(0.0065, 8, 8);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00f5a0 });
      const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
      starlinkSwarmGroup.add(nodeMesh);
      satelliteClickMeshes.push(nodeMesh);
      nodeMesh.userData = {
        satellite: {
          id: node.id,
          name: node.name,
          noradId: 60000 + Math.floor(Math.random() * 5000),
          type: 'MÉGACONSTELLATION INTERNET BROADBAND',
          orbitType: 'LEO',
          country: 'SpaceX / USA',
          altitudeKm: 550,
          speedKmh: 27350,
          inclination: 53.2,
          raan: node.raan,
          periodMin: 95.5,
          status: 'MAILLAGE LASER INTER-SATELLITES ACTIF',
          color: '#00f5a0',
          description: 'Nœud actif du maillage orbital Starlink assurant le relais de télécommunications mondial.',
        },
      };

      starlinkNodes.push({
        node,
        mesh: nodeMesh,
        R_orb: R_STARLINK,
        inclination: node.inclination,
        raan: node.raan,
        phase: node.phase,
        speed: 0.00085, // Realistic LEO velocity
      });
    });

    // Selected satellite tactical 3D inspection (Nadir projection beam down to Earth surface + Ground footprint ring)
    let selectedSatGroup = null;
    let currentSelectedSatItem = null;

    const updateSelectedSatellite = (sat) => {
      try {
        if (selectedSatGroup) {
          satellitesGroup.remove(selectedSatGroup);
          selectedSatGroup.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          selectedSatGroup = null;
          currentSelectedSatItem = null;
        }

        if (!sat) return;

        // Find matching active satellite item
        const match = activeSatellites.find(
          (it) => it.sat.id === sat.id || it.sat.noradId === sat.noradId || it.sat.name === sat.name
        );
        if (!match) return;

        currentSelectedSatItem = match;
        selectedSatGroup = new THREE.Group();

        // 1. 3D Nadir Beam (connects orbital satellite to Earth surface)
        const beamGeom = new THREE.BufferGeometry().setFromPoints([
          match.mesh.position.clone(),
          match.mesh.position.clone().normalize().multiplyScalar(R_EARTH + 0.003),
        ]);
        const satColorHex = match.sat.color ? new THREE.Color(match.sat.color) : new THREE.Color(0x00f2fe);
        const beamMat = new THREE.LineDashedMaterial({
          color: satColorHex,
          dashSize: 0.04,
          gapSize: 0.02,
          transparent: true,
          opacity: 0.85,
        });
        const beamLine = new THREE.Line(beamGeom, beamMat);
        beamLine.computeLineDistances();
        selectedSatGroup.add(beamLine);

        // 2. 3D Footprint Ring on Earth surface
        const altKm = match.sat.altitudeKm || 400;
        const angRad = Math.acos(Math.max(0.01, Math.min(0.999, 6371 / (6371 + altKm))));
        const fpWorldRadius = Math.sin(angRad) * R_EARTH * 0.95;
        const fpRingGeom = new THREE.RingGeometry(Math.max(0.01, fpWorldRadius * 0.96), Math.max(0.015, fpWorldRadius * 1.04), 48);
        const fpRingMat = new THREE.MeshBasicMaterial({
          color: satColorHex,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
        });
        const fpRingMesh = new THREE.Mesh(fpRingGeom, fpRingMat);
        selectedSatGroup.add(fpRingMesh);

        // 3. Nadir Sub-Satellite Ground Spot
        const nadirDotGeom = new THREE.SphereGeometry(0.012, 16, 16);
        const nadirDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const nadirDotMesh = new THREE.Mesh(nadirDotGeom, nadirDotMat);
        selectedSatGroup.add(nadirDotMesh);

        selectedSatGroup.userData = {
          beamLine,
          fpRingMesh,
          nadirDotMesh,
          satItem: match,
        };

        satellitesGroup.add(selectedSatGroup);
      } catch (err) {
        console.warn('updateSelectedSatellite error:', err);
      }
    };
    updateSelectedSatelliteRef.current = updateSelectedSatellite;
    if (inspectedTarget?.type === 'satellite') {
      updateSelectedSatellite(inspectedTarget);
    }

    // 11h. CCTV Cameras Layer (Pulsing 3D Video Beacons)
    const cctvGroup = new THREE.Group();
    earthGroup.add(cctvGroup);
    const cctvMeshes = [];
    const allCCTVAndNews = [...CCTV_FEEDS, ...(WORLD_TV_CHANNELS || [])];

    allCCTVAndNews.forEach((cam) => {
      const [x, y, z] = coordsToVector(cam.lng, cam.lat, R_EARTH + 0.008);
      const pos = new THREE.Vector3(x, y, z);
      const isNews = (cam.category || '').toLowerCase().includes('info');

      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);
      beaconGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());

      const ringGeom = new THREE.RingGeometry(0.01, 0.026, 20);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isNews ? 0xf59e0b : 0x38bdf8,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      beaconGroup.add(ringMesh);

      const pinGeom = new THREE.SphereGeometry(0.012, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: isNews ? 0xffb703 : 0xff3366 });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.z = 0.012;
      pinMesh.userData = { isCCTV: true, camera: cam };
      beaconGroup.add(pinMesh);

      // Ergonomic invisible hit target (0.045 radius) for effortless raycast picking in 3D
      const hitGeom = new THREE.SphereGeometry(0.045, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.z = 0.012;
      hitMesh.userData = { isCCTV: true, camera: cam };
      beaconGroup.add(hitMesh);

      beaconGroup.userData = { isCCTV: true, camera: cam };
      cctvGroup.add(beaconGroup);
      cctvMeshes.push(hitMesh);
      cctvMeshes.push(pinMesh);
    });

    // 11i. Submarine Fiber-Optic Cables Layer (Curved 3D Optical Fibers)
    const cablesGroup = new THREE.Group();
    earthGroup.add(cablesGroup);

    SUBMARINE_CABLES.forEach((cable) => {
      const points = cable.path.map(([cLat, cLng]) => {
        const [cx, cy, cz] = coordsToVector(cLng, cLat, R_EARTH + 0.004);
        return new THREE.Vector3(cx, cy, cz);
      });
      const cableGeo = new THREE.BufferGeometry().setFromPoints(points);
      const cableMat = new THREE.LineBasicMaterial({
        color: cable.color ? new THREE.Color(cable.color) : 0xa855f7,
        transparent: true,
        opacity: 0.75,
      });
      const cableLine = new THREE.Line(cableGeo, cableMat);
      cablesGroup.add(cableLine);
    });

    // 11j. Extreme Weather, Global Wind Streamlines & Rotating Cyclonic Vortices
    const weatherGroup = new THREE.Group();
    earthGroup.add(weatherGroup);
    const weatherMeshes = [];
    const weatherClickMeshes = [];
    const activeCyclones = [];

    // 1. Global Wind Streamlines Particle System (Zoom.earth & Nullschool inspired)
    // 900 wind streamline segments flowing across the globe in physical circulation bands
    const WIND_PARTICLES_COUNT = 900;
    const windPositions = new Float32Array(WIND_PARTICLES_COUNT * 6);
    const windColors = new Float32Array(WIND_PARTICLES_COUNT * 6);
    const windParticles = [];

    for (let i = 0; i < WIND_PARTICLES_COUNT; i++) {
      const lat = (Math.random() - 0.5) * 160;
      const lng = (Math.random() - 0.5) * 360;
      windParticles.push({
        lat,
        lng,
        prevLat: lat,
        prevLng: lng,
        speed: 0.18 + Math.random() * 0.22,
        life: Math.floor(Math.random() * 80),
        maxLife: 60 + Math.floor(Math.random() * 60),
      });
    }

    const windGeo = new THREE.BufferGeometry();
    windGeo.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    windGeo.setAttribute('color', new THREE.BufferAttribute(windColors, 3));
    const windMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const windLines = new THREE.LineSegments(windGeo, windMat);
    weatherGroup.add(windLines);

    // 2. NASA FIRMS Thermal Anomalies (Wildfire Clusters)
    THERMAL_ANOMALIES.forEach((fire) => {
      const [x, y, z] = coordsToVector(fire.lng, fire.lat, R_EARTH + 0.007);
      const pos = new THREE.Vector3(x, y, z);
      const geom = new THREE.CircleGeometry(0.018, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfb923c,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
      mesh.userData = { weather: { type: 'wildfire', ...fire } };
      weatherGroup.add(mesh);
      weatherMeshes.push(mesh);
      weatherClickMeshes.push(mesh);
    });

    // 3. Rotating Cyclonic Storm Vortices (Typhoons, Hurricanes & Winter Storms)
    WEATHER_SYSTEMS.forEach((w) => {
      const [x, y, z] = coordsToVector(w.lng, w.lat, R_EARTH + 0.008);
      const pos = new THREE.Vector3(x, y, z);
      const cycloneGroup = new THREE.Group();
      cycloneGroup.position.copy(pos);
      cycloneGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());

      // Eye of the storm (calm central ring)
      const eyeGeom = new THREE.RingGeometry(0.012, 0.024, 24);
      const eyeMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const eyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
      cycloneGroup.add(eyeMesh);

      // 4 Logarithmic Spiral Storm Arms
      for (let a = 0; a < 4; a++) {
        const armPts = [];
        const baseAngle = (a / 4) * Math.PI * 2;
        for (let p = 0; p <= 24; p++) {
          const t = p / 24;
          const r = 0.016 + t * 0.065;
          const phi = baseAngle + t * 3.8 * (w.hemisphere || 1);
          armPts.push(new THREE.Vector3(r * Math.cos(phi), r * Math.sin(phi), 0.002));
        }
        const armGeo = new THREE.BufferGeometry().setFromPoints(armPts);
        const armMat = new THREE.LineBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.65,
        });
        cycloneGroup.add(new THREE.Line(armGeo, armMat));
      }

      // Outer Wind Field Envelope Ring
      const outerRingGeom = new THREE.RingGeometry(0.055, 0.075, 24);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const outerRingMesh = new THREE.Mesh(outerRingGeom, outerRingMat);
      cycloneGroup.add(outerRingMesh);

      // Hit area for raycaster
      const hitGeom = new THREE.CircleGeometry(0.075, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.userData = { weather: { type: 'weather', ...w } };
      cycloneGroup.add(hitMesh);

      cycloneGroup.userData = { weather: { type: 'weather', ...w } };
      weatherGroup.add(cycloneGroup);
      weatherMeshes.push(eyeMesh);
      weatherClickMeshes.push(hitMesh);

      activeCyclones.push({
        group: cycloneGroup,
        hemisphere: w.hemisphere || 1,
        speed: 0.014,
      });
    });

    // 11k. Strategic Nuclear & Critical Infrastructure Layer (3D Glowing Atomic Beacons)
    const nuclearGroup = new THREE.Group();
    earthGroup.add(nuclearGroup);
    const nuclearMeshes = [];
    const nuclearClickMeshes = [];

    STRATEGIC_NUCLEAR_SITES.forEach((site) => {
      const [x, y, z] = coordsToVector(site.lng, site.lat, R_EARTH + 0.008);
      const pos = new THREE.Vector3(x, y, z);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);
      beaconGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());

      // Glowing yellow atomic outer ring
      const ringGeom = new THREE.RingGeometry(0.012, 0.028, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xeab308,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      beaconGroup.add(ringMesh);

      // Center nuclear reactor core pin
      const coreGeom = new THREE.SphereGeometry(0.012, 12, 12);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      coreMesh.position.z = 0.012;
      coreMesh.userData = { nuclear: site };
      beaconGroup.add(coreMesh);

      beaconGroup.userData = { nuclear: site };
      nuclearGroup.add(beaconGroup);
      nuclearMeshes.push(ringMesh);
      nuclearClickMeshes.push(coreMesh);
    });

    // 12. GPS Raycasting & Unified Left-Click Select / Right-Click Grab
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isHoveringEarth = false;
    let pointerDownPos = { x: 0, y: 0 };
    let isRightDragging = false;

    const onContextMenu = (e) => {
      e.preventDefault();
    };
    container.addEventListener('contextmenu', onContextMenu);

    const updateCoordsFromLocalPoint = (p) => {
      const r = p.length();
      const latDeg = Math.asin(Math.max(-1, Math.min(1, p.y / r))) * (180 / Math.PI);
      let angle = Math.atan2(p.z, -p.x);
      if (angle < 0) angle += Math.PI * 2;
      let lngDeg = (angle / (Math.PI * 2) - 0.5) * 360;

      const latStr = `${Math.abs(latDeg).toFixed(2)}° ${latDeg >= 0 ? 'N' : 'S'}`;
      const lngStr = `${Math.abs(lngDeg).toFixed(2)}° ${lngDeg >= 0 ? 'E' : 'W'}`;
      if (coordLatRef.current) coordLatRef.current.textContent = latStr;
      if (coordLngRef.current) coordLngRef.current.textContent = lngStr;
      return { lat: latDeg, lng: lngDeg };
    };

    const onPointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };

      if (e.button === 2) {
        isRightDragging = true;
        container.style.cursor = 'grabbing';
        container.classList.add('is-grabbing');
        document.body.classList.add('is-grabbing');
      }
    };

    const onPointerUp = (e) => {
      if (e.button === 2 || e.buttons === 0) {
        isRightDragging = false;
        container.classList.remove('is-grabbing');
        document.body.classList.remove('is-grabbing');
        container.style.cursor = hoveredFeatureRef.current ? 'pointer' : 'default';
        if (e.button === 2) return;
      }

      // Left click
      if (e.button === 0) {
        const dx = Math.abs(e.clientX - pointerDownPos.x);
        const dy = Math.abs(e.clientY - pointerDownPos.y);
        if (dx > 6 || dy > 6) return;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 1. Check CCTV Beacons click
        if (activeLayersRef.current.has('cctv')) {
          const cctvHits = raycaster.intersectObjects(cctvMeshes, true);
          if (cctvHits.length > 0) {
            const hitCam = cctvHits[0].object.userData?.camera;
            if (hitCam) {
              sound.click();
              setInspectedTarget({ type: 'cctv', ...hitCam });
              if (onSelectCCTV) onSelectCCTV(hitCam);
              return;
            }
          }
        }

        // 2. Check Satellites click
        if (activeLayersRef.current.has('satellites')) {
          const satHits = raycaster.intersectObjects(satelliteClickMeshes, true);
          if (satHits.length > 0) {
            const hitSat = satHits[0].object.userData?.satellite;
            if (hitSat) {
              sound.click();
              const satWorldPos = satHits[0].object.getWorldPosition(new THREE.Vector3());
              const satLocalPos = earthMesh.worldToLocal(satWorldPos.clone());
              const r = satLocalPos.length();
              const subLat = Math.asin(Math.max(-1, Math.min(1, satLocalPos.y / r))) * (180 / Math.PI);
              let angle = Math.atan2(satLocalPos.z, -satLocalPos.x);
              if (angle < 0) angle += Math.PI * 2;
              const subLng = (angle / (Math.PI * 2) - 0.5) * 360;

              const enrichedSat = {
                type: 'satellite',
                ...hitSat,
                lat: subLat,
                lng: subLng,
              };
              updateSelectedSatellite(enrichedSat);
              setInspectedTarget(enrichedSat);
              if (onSelectSatellite) onSelectSatellite(enrichedSat);
              return;
            }
          }
        }

        // 3. Check Live Flights click (Flightradar24 InstancedMesh Fleet)
        if (activeLayersRef.current.has('aviation') && planesInstancedMesh) {
          const flightHits = raycaster.intersectObject(planesInstancedMesh);
          if (flightHits.length > 0) {
            const hitInstanceId = flightHits[0].instanceId;
            const hitFl = currentLiveFlights[hitInstanceId];
            if (hitFl) {
              sound.click();
              updateSelectedFlightPath(hitFl);
              setInspectedTarget({ type: 'flight', ...hitFl });
              return;
            }
          }
        }

        // 4. Check Live Maritime Vessels click (MarineTraffic InstancedMesh Fleet)
        if (activeLayersRef.current.has('maritime') && vesselsInstancedMesh) {
          const vesselHits = raycaster.intersectObject(vesselsInstancedMesh);
          if (vesselHits.length > 0) {
            const hitInstanceId = vesselHits[0].instanceId;
            const hitVes = currentLiveVessels[hitInstanceId];
            if (hitVes) {
              sound.click();
              updateSelectedVesselMarker(hitVes);
              setInspectedTarget({ type: 'vessel', isVessel: true, ...hitVes });
              return;
            }
          }
        }

        // 5. Check Strategic Nuclear Infrastructure click
        if (activeLayersRef.current.has('nuclear')) {
          const nuclearHits = raycaster.intersectObjects(nuclearClickMeshes, true);
          if (nuclearHits.length > 0) {
            const hitNuc = nuclearHits[0].object.userData?.nuclear;
            if (hitNuc) {
              sound.click();
              setInspectedTarget({ type: 'nuclear', ...hitNuc });
              return;
            }
          }
        }

        // 6. Check Weather Systems & Storms click
        if (activeLayersRef.current.has('weather')) {
          const weatherHits = raycaster.intersectObjects(weatherClickMeshes, true);
          if (weatherHits.length > 0) {
            const hitWeather = weatherHits[0].object.userData?.weather;
            if (hitWeather) {
              sound.click();
              setInspectedTarget(hitWeather);
              return;
            }
          }
        }

        // 7. Check Cyber Warfare Attacks click
        if (activeLayersRef.current.has('cyber')) {
          const cyberHits = raycaster.intersectObjects(cyberClickMeshes, true);
          if (cyberHits.length > 0) {
            const hitCy = cyberHits[0].object.userData?.cyber;
            if (hitCy) {
              sound.click();
              setInspectedTarget({ type: 'cyber', ...hitCy });
              return;
            }
          }
        }

        // 8. Check Geopolitical Hotspots click
        if (activeLayersRef.current.has('conflicts')) {
          const conflictHits = raycaster.intersectObjects(conflictClickMeshes, true);
          if (conflictHits.length > 0) {
            const hitZone = conflictHits[0].object.userData?.conflict;
            if (hitZone) {
              sound.click();
              setInspectedTarget({ type: 'conflict', ...hitZone });
              return;
            }
          }
        }

        // 9. Check Earthquakes click
        if (activeLayersRef.current.has('telluric')) {
          const eqHits = raycaster.intersectObjects(earthquakeClickMeshes, true);
          if (eqHits.length > 0) {
            const hitEq = eqHits[0].object.userData?.earthquake;
            if (hitEq) {
              sound.click();
              setInspectedTarget({ type: 'earthquake', ...hitEq });
              return;
            }
          }
        }

        const intersects = raycaster.intersectObject(earthMesh);

        if (intersects.length > 0) {
          const hitWorld = intersects[0].point;

          // Proximity fallback check for live planes in 3D (sélection immédiate et ergonomique sans pixel-hunting)
          if (activeLayersRef.current.has('aviation') && currentLiveFlights.length > 0) {
            let closestFl = null;
            let minDistSq = 0.008; // Rayon de tolérance étendu (~35px à l'écran pour un clic direct et facile)
            for (let k = 0; k < currentLiveFlights.length; k++) {
              const fl = currentLiveFlights[k];
              const [px, py, pz] = coordsToVector(fl.lng, fl.lat, R_EARTH + 0.024);
              const dx = hitWorld.x - px;
              const dy = hitWorld.y - py;
              const dz = hitWorld.z - pz;
              const dSq = dx * dx + dy * dy + dz * dz;
              if (dSq < minDistSq) {
                minDistSq = dSq;
                closestFl = fl;
              }
            }
            if (closestFl) {
              sound.click();
              updateSelectedFlightPath(closestFl);
              setInspectedTarget({ type: 'flight', ...closestFl });
              return;
            }
          }

          // Proximity fallback check for live MarineTraffic vessels in 3D
          if (activeLayersRef.current.has('maritime') && currentLiveVessels.length > 0) {
            let closestVes = null;
            let minVesDistSq = 0.012;
            const maxCheck = Math.min(vesselLimitRef.current || 5000, currentLiveVessels.length);
            for (let k = 0; k < maxCheck; k++) {
              const ves = currentLiveVessels[k];
              const [px, py, pz] = coordsToVector(ves.lng, ves.lat, R_EARTH + 0.0042);
              const dx = hitWorld.x - px;
              const dy = hitWorld.y - py;
              const dz = hitWorld.z - pz;
              const dSq = dx * dx + dy * dy + dz * dz;
              if (dSq < minVesDistSq) {
                minVesDistSq = dSq;
                closestVes = ves;
              }
            }
            if (closestVes) {
              sound.click();
              updateSelectedVesselMarker(closestVes);
              setInspectedTarget({ type: 'vessel', isVessel: true, ...closestVes });
              return;
            }
          }

          const localPoint = earthMesh.worldToLocal(intersects[0].point.clone());
          const { lat, lng } = updateCoordsFromLocalPoint(localPoint);

          // Proximity fallback check for live CCTV cameras & News channels in 3D (clic direct immédiat sans pixel-hunting)
          const allStreams3D = [...CCTV_FEEDS, ...(WORLD_TV_CHANNELS || [])];
          if (activeLayersRef.current.has('cctv') && allStreams3D.length > 0) {
            let closestCam = null;
            let minCamDistSq = 0.009; // Rayon d'attraction ergonomique (~30px)
            for (let k = 0; k < allStreams3D.length; k++) {
              const cam = allStreams3D[k];
              const [px, py, pz] = coordsToVector(cam.lng, cam.lat, R_EARTH + 0.008);
              const dx = localPoint.x - px;
              const dy = localPoint.y - py;
              const dz = localPoint.z - pz;
              const dSq = dx * dx + dy * dy + dz * dz;
              if (dSq < minCamDistSq) {
                minCamDistSq = dSq;
                closestCam = cam;
              }
            }
            if (closestCam) {
              sound.click();
              setInspectedTarget({ type: 'cctv', ...closestCam });
              if (onSelectCCTV) onSelectCCTV(closestCam);
              return;
            }
          }

          const foundFeature = findCountryFeature(lat, lng);

          if (foundFeature) {
            applyTerritorySelection(foundFeature, lat, lng);
          } else {
            sound.click();
            handleResetSelection();
          }
        }
      }
    };

    const onPointerMove = (e) => {
      if (isRightDragging || (e.buttons & 2)) {
        container.style.cursor = 'grabbing';
        sound.woosh();
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(earthMesh);

      if (intersects.length > 0) {
        isHoveringEarth = true;
        const localPoint = earthMesh.worldToLocal(intersects[0].point.clone());
        const { lat, lng } = updateCoordsFromLocalPoint(localPoint);

        const foundFeature = findCountryFeature(lat, lng);

        if (foundFeature) {
          const props = foundFeature.properties || {};
          const countryKey = props.ADM0_A3 || props.ISO_A3 || props.SOVEREIGNT || props.NAME;
          if (countryKey && countryKey !== hoveredCountryIdRef.current) {
            hoveredCountryIdRef.current = countryKey;
            sound.countryHover(countryKey, 0.35);
          }
        } else {
          hoveredCountryIdRef.current = null;
          sound.clearCountryHover();
        }

        if (foundFeature && foundFeature !== hoveredFeatureRef.current) {
          const props = foundFeature.properties || {};
          const isCurrentSelected = selectedTerritory && (
            props.NAME === selectedTerritory.name ||
            props.NAME_FR === selectedTerritory.name ||
            props.ADMIN === selectedTerritory.name
          );

          if (!isCurrentSelected) {
            removeHoverMesh();
            hoveredFeatureRef.current = foundFeature;

            const hoverMesh = createTerritoryMesh(foundFeature, {
              surfaceRadius: 2.013,
              borderRadius: 2.016,
              baseRadius: 2.008,
              fillColor: 0x00f2fe,
              fillOpacity: 0.32,
              borderColor: 0x00ffff,
              borderOpacity: 1.0,
              hasWalls: false,
            });

            earthGroup.add(hoverMesh);
            hoverMeshRef.current = hoverMesh;

            const rawName = props.NAME || props.SUBUNIT || props.ADMIN || 'Territoire';
            const displayName = TERRITORY_NAMES_FR[rawName] || props.NAME_FR || rawName;
            const sovereign = props.SOVEREIGNT || props.SOV_A3 || displayName;
            const continent = props.CONTINENT || 'International';
            const pop = props.POP_EST || props.POP2005;
            const popFormatted = pop ? Number(pop).toLocaleString('fr-FR') : 'N/A';
            const areaKm2 = getCountryAreaKm2(foundFeature);
            const areaFormatted = formatAreaKm2(areaKm2);

            setHoveredTerritory({
              x: e.clientX,
              y: e.clientY,
              name: displayName,
              sovereign: sovereign !== displayName ? sovereign : null,
              continent,
              pop: popFormatted,
              area: areaFormatted,
            });
          } else {
            removeHoverMesh();
            setHoveredTerritory(null);
          }
        } else if (foundFeature && hoveredTerritory) {
          setHoveredTerritory((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
        } else if (!foundFeature && hoveredFeatureRef.current) {
          removeHoverMesh();
          setHoveredTerritory(null);
        }

        if (!isRightDragging && !(e.buttons & 2)) {
          let isInteractive = !!foundFeature;
          if (!isInteractive && activeLayersRef.current.has('cctv') && cctvMeshes.length > 0) {
            if (raycaster.intersectObjects(cctvMeshes, true).length > 0) isInteractive = true;
          }
          if (!isInteractive && activeLayersRef.current.has('satellites') && satelliteClickMeshes.length > 0) {
            if (raycaster.intersectObjects(satelliteClickMeshes, true).length > 0) isInteractive = true;
          }
          if (!isInteractive && activeLayersRef.current.has('nuclear') && nuclearClickMeshes.length > 0) {
            if (raycaster.intersectObjects(nuclearClickMeshes, true).length > 0) isInteractive = true;
          }
          container.style.cursor = isInteractive ? 'pointer' : 'default';
        }
      } else {
        hoveredCountryIdRef.current = null;
        sound.clearCountryHover();
        if (hoveredFeatureRef.current) {
          removeHoverMesh();
          setHoveredTerritory(null);
        }
        isHoveringEarth = false;
        scratchDirVector.copy(camera.position).negate().normalize().multiplyScalar(2);
        const localPoint = earthMesh.worldToLocal(scratchDirVector);
        updateCoordsFromLocalPoint(localPoint);

        if (!isRightDragging && !(e.buttons & 2)) {
          let isInteractive = false;
          if (activeLayersRef.current.has('cctv') && cctvMeshes.length > 0) {
            if (raycaster.intersectObjects(cctvMeshes, true).length > 0) isInteractive = true;
          }
          if (!isInteractive && activeLayersRef.current.has('satellites') && satelliteClickMeshes.length > 0) {
            if (raycaster.intersectObjects(satelliteClickMeshes, true).length > 0) isInteractive = true;
          }
          if (!isInteractive && activeLayersRef.current.has('nuclear') && nuclearClickMeshes.length > 0) {
            if (raycaster.intersectObjects(nuclearClickMeshes, true).length > 0) isInteractive = true;
          }
          container.style.cursor = isInteractive ? 'pointer' : 'default';
        }
      }

      const dist = camera.position.length();
      const altKm = Math.round(((dist - 2) / 2) * 6371);
      if (coordAltRef.current) coordAltRef.current.textContent = `${Math.max(450, altKm).toLocaleString('fr-FR')} KM`;
    };

    const onWheel = () => {
      sound.woosh(0.7);
    };
    container.addEventListener('wheel', onWheel, { passive: true });

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);

    // 13. Window Resize Handler
    const onWindowResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onWindowResize);

    // 14. Continuous Animation Loop
    let animationFrameId;
    let frameCount = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      frameCount++;

      if (autoRotateRef.current) {
        earthGroup.rotation.y += 0.00065;
        starField.rotation.y += 0.0002;
        cloudsMesh.rotation.y += 0.00018;
      } else {
        cloudsMesh.rotation.y += 0.00008;
      }

      // Tactical Mode Visibility & Animations
      const layers = activeLayersRef.current || new Set();
      aviationGroup.visible = layers.has('aviation');
      cyberGroup.visible = layers.has('cyber');
      conflictsGroup.visible = layers.has('conflicts');
      earthquakesGroup.visible = layers.has('telluric');
      satellitesGroup.visible = layers.has('satellites');
      cctvGroup.visible = layers.has('cctv');
      cablesGroup.visible = layers.has('cables');
      weatherGroup.visible = layers.has('weather');

      // Animate satellites along their 3D Keplerian orbital planes (Zero-Allocation 60 FPS)
      if (satellitesGroup.visible) {
        activeSatellites.forEach((item) => {
          const theta = (frameCount * item.speed + item.phase) % (Math.PI * 2);
          computeKeplerianOrbitalVector(item.mesh.position, item.R_orb, item.inclination, item.raan, theta);

          // Orient satellite solar arrays along orbit tangent (zero allocation)
          const nextTheta = theta + 0.01;
          computeKeplerianOrbitalVector(scratchNextOrbitalPos, item.R_orb, item.inclination, item.raan, nextTheta);
          scratchSatTangent.subVectors(scratchNextOrbitalPos, item.mesh.position).normalize();
          item.mesh.quaternion.setFromUnitVectors(upZAxis, scratchSatTangent);

          // Pulsing orbital halo
          const haloScale = 1.0 + 0.25 * Math.sin(frameCount * 0.08 + item.phase);
          item.haloMesh.scale.set(haloScale, haloScale, haloScale);
        });

        // Animate Starlink swarm nodes (zero allocation)
        starlinkNodes.forEach((node) => {
          const theta = (frameCount * node.speed + node.phase) % (Math.PI * 2);
          computeKeplerianOrbitalVector(node.mesh.position, node.R_orb, node.inclination, node.raan, theta);
        });

        // Continuously update inspected satellite 3D nadir beam and ground footprint
        if (selectedSatGroup && currentSelectedSatItem) {
          const satPos = currentSelectedSatItem.mesh.position;
          scratchNormal.copy(satPos).normalize();
          scratchPos.copy(scratchNormal).multiplyScalar(R_EARTH + 0.004);

          const { beamLine, fpRingMesh, nadirDotMesh } = selectedSatGroup.userData || {};
          if (beamLine) {
            const posAttr = beamLine.geometry.attributes.position;
            if (posAttr && posAttr.count >= 2) {
              posAttr.setXYZ(0, satPos.x, satPos.y, satPos.z);
              posAttr.setXYZ(1, scratchPos.x, scratchPos.y, scratchPos.z);
              posAttr.needsUpdate = true;
              beamLine.computeLineDistances();
            }
          }
          if (fpRingMesh) {
            fpRingMesh.position.copy(scratchPos);
            fpRingMesh.quaternion.setFromUnitVectors(upZAxis, scratchNormal);
          }
          if (nadirDotMesh) {
            nadirDotMesh.position.copy(scratchPos);
          }
        }
      }

      // Animate CCTV beacons
      if (cctvGroup.visible) {
        cctvMeshes.forEach((mesh, idx) => {
          const s = 1.0 + 0.22 * Math.sin(frameCount * 0.08 + idx);
          mesh.scale.set(s, s, s);
        });
      }

      // Animate Weather: Global Wind Streamlines, Cyclonic Vortices & Wildfires
      if (weatherGroup.visible) {
        // 1. Update Wind Particle Streamlines (Physical Atmospheric Circulation)
        windParticles.forEach((p, idx) => {
          p.prevLat = p.lat;
          p.prevLng = p.lng;
          p.life++;

          if (p.life > p.maxLife || Math.abs(p.lat) > 85) {
            p.lat = (Math.random() - 0.5) * 160;
            p.lng = (Math.random() - 0.5) * 360;
            p.prevLat = p.lat;
            p.prevLng = p.lng;
            p.life = 0;
          }

          const absLat = Math.abs(p.lat);
          let dLng = 0;
          let dLat = 0;

          // Tropical Easterly Trade Winds (Alizés 0° to 28°)
          if (absLat < 28) {
            dLng = -0.16 * p.speed;
            dLat = -Math.sign(p.lat) * 0.02 * p.speed;
          }
          // Mid-latitude Westerlies (Vents d'Ouest 28° to 62°)
          else if (absLat >= 28 && absLat < 62) {
            const wave = Math.sin((p.lng * Math.PI) / 45) * 0.08;
            dLng = (0.28 + (absLat > 38 && absLat < 55 ? 0.16 : 0)) * p.speed;
            dLat = wave * p.speed;
          }
          // Polar Easterlies (62° to 85°)
          else {
            dLng = -0.12 * p.speed;
            dLat = -Math.sign(p.lat) * 0.015 * p.speed;
          }

          p.lng = ((p.lng + dLng + 180) % 360) - 180;
          p.lat += dLat;

          const R_WIND = R_EARTH + 0.012;
          const [hx, hy, hz] = coordsToVector(p.lng, p.lat, R_WIND);
          const [tx, ty, tz] = coordsToVector(p.prevLng, p.prevLat, R_WIND);

          const baseIdx = idx * 6;
          windPositions[baseIdx] = tx;
          windPositions[baseIdx + 1] = ty;
          windPositions[baseIdx + 2] = tz;
          windPositions[baseIdx + 3] = hx;
          windPositions[baseIdx + 4] = hy;
          windPositions[baseIdx + 5] = hz;

          const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.85;
          const isJetStream = absLat >= 38 && absLat <= 55;
          const c = isJetStream ? [0.0, 0.95, 0.9] : [0.06, 0.72, 0.85];

          windColors[baseIdx] = c[0] * alpha;
          windColors[baseIdx + 1] = c[1] * alpha;
          windColors[baseIdx + 2] = c[2] * alpha;
          windColors[baseIdx + 3] = c[0] * alpha;
          windColors[baseIdx + 4] = c[1] * alpha;
          windColors[baseIdx + 5] = c[2] * alpha;
        });
        windGeo.attributes.position.needsUpdate = true;
        windGeo.attributes.color.needsUpdate = true;

        // 2. Rotate Cyclonic Storm Vortices (Counter-clockwise in North, Clockwise in South)
        activeCyclones.forEach((cyc) => {
          cyc.group.rotation.z += (cyc.hemisphere || 1) * cyc.speed;
        });

        // 3. Pulse thermal anomalies
        weatherMeshes.forEach((mesh, idx) => {
          const s = 1.0 + 0.22 * Math.sin(frameCount * 0.09 + idx);
          mesh.scale.set(s, s, s);
        });
      }

      // Animate aviation flights (Flightradar24 Commercial Fleet - 30 Hz live direct advancement)
      if (aviationGroup.visible && planesInstancedMesh) {
        if (flightRadarService.flights.length > 0 && frameCount % 2 === 0) {
          update3DPlanes(flightRadarService.flights);
        }
      }

      // Animate maritime fleet (MarineTraffic Commercial Fleet - 30 Hz live direct advancement)
      maritimeGroup.visible = layers.has('maritime');
      if (maritimeGroup.visible && vesselsInstancedMesh) {
        if (marineTrafficService.vessels.length > 0 && frameCount % 2 === 0) {
          update3DVessels(marineTrafficService.vessels);
        }
      }

      // Update camera distance & time for dynamic shader micro-relief & atmospheric progression
      if (earthShaderRef.current && earthShaderRef.current.uniforms) {
        if (earthShaderRef.current.uniforms.uCamDist) {
          earthShaderRef.current.uniforms.uCamDist.value = camera.position.length();
        }
        if (earthShaderRef.current.uniforms.uTime) {
          earthShaderRef.current.uniforms.uTime.value = frameCount;
        }
      }
      if (cloudsShaderRef.current && cloudsShaderRef.current.uniforms && cloudsShaderRef.current.uniforms.uTime) {
        cloudsShaderRef.current.uniforms.uTime.value = frameCount;
      }

      // Animate cyber attack pulses (Kaspersky Traveling Laser Beams & Ground Shockwaves)
      cyberGroup.visible = layers.has('cyber');
      if (cyberGroup.visible) {
        activeAttacks.forEach((att, idx) => {
          const t = (frameCount * att.speed + att.offset) % 1.0;
          if (t < 0.94) {
            att.headMesh.visible = true;
            att.trailMesh.visible = true;
            att.curve.getPoint(t, att.headMesh.position);
            att.curve.getPoint(Math.max(0, t - 0.035), att.trailMesh.position);
            // Idle impact ring
            att.impactMesh.scale.setScalar(1.0);
            att.impactMat.opacity = 0.25;
          } else {
            // Impact shockwave detonates and expands upon laser packet landing
            att.headMesh.visible = false;
            att.trailMesh.visible = false;
            const shockProgress = (t - 0.94) / 0.06;
            const s = 1.0 + shockProgress * 3.2;
            att.impactMesh.scale.setScalar(s);
            att.impactMat.opacity = Math.max(0, 0.95 * (1.0 - shockProgress));
          }
          if (att.originMesh) {
            const originPulse = 1.0 + 0.25 * Math.sin(frameCount * 0.09 + idx);
            att.originMesh.scale.setScalar(originPulse);
          }
        });
      }

      // Animate conflict radar hotspots & ballistic missile vectors
      conflictsGroup.visible = layers.has('conflicts');
      if (conflictsGroup.visible) {
        activeHotspots.forEach((hs, idx) => {
          const scale = 1.0 + 0.35 * Math.sin(frameCount * 0.08 + idx);
          hs.radarMesh.scale.set(scale, scale, scale);
          hs.radarMat.opacity = 0.5 + 0.35 * Math.sin(frameCount * 0.08 + idx);
        });
        activeTrajectories.forEach((tr) => {
          if (tr.missileMesh && tr.curve) {
            const t = (frameCount * tr.speed) % 1.0;
            tr.curve.getPointAt(t, tr.missileMesh.position);
          }
        });
      }

      // Animate earthquakes
      if (earthquakesGroup.visible) {
        earthquakeMeshes.forEach((eq, idx) => {
          const pulse = 1.0 + 0.25 * Math.sin(frameCount * 0.1 + idx);
          eq.mesh.scale.set(pulse, pulse, pulse);
        });
      }

      // Animate Strategic Nuclear Infrastructure
      nuclearGroup.visible = layers.has('nuclear');
      if (nuclearGroup.visible) {
        nuclearMeshes.forEach((ring, idx) => {
          const pulse = 1.0 + 0.22 * Math.sin(frameCount * 0.08 + idx);
          ring.scale.set(pulse, pulse, pulse);
        });
      }

      // Selected country glowing pulse effect
      if (selectedFillMatRef.current) {
        selectedFillMatRef.current.opacity = 0.45 + 0.12 * Math.sin(frameCount * 0.07);
      }

      // Continuous coordinates update (zero React re-renders)
      if (frameCount % 8 === 0 && !isHoveringEarth) {
        scratchDirVector.copy(camera.position).negate().normalize().multiplyScalar(2);
        const localPoint = earthMesh.worldToLocal(scratchDirVector);
        updateCoordsFromLocalPoint(localPoint);

        const dist = camera.position.length();
        const altKm = Math.round(((dist - 2) / 2) * 6371);
        if (coordAltRef.current) coordAltRef.current.textContent = `${Math.max(450, altKm).toLocaleString('fr-FR')} KM`;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
        e.preventDefault();
        sound.click();
        if (onAutoRotateChange) {
          onAutoRotateChange((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      update3DPlanesRef.current = null;
      update3DVesselsRef.current = null;
      container.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('keydown', onKeyDown);

      unsubscribeStream();
      if (unsubscribeFR24_3D) unsubscribeFR24_3D();
      if (unsubscribeMTS_3D) unsubscribeMTS_3D();


      controls.dispose();
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      dayMap.dispose();
      cloudsMap.dispose();

      removeSelectedMesh();
      removeHoverMesh();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Smoothly rotate 3D Earth towards target coordinates
  useEffect(() => {
    if (!targetLocation || !earthGroupRef.current) return;
    const targetLng = targetLocation.lng;
    const targetRad = -((targetLng + 180) * (Math.PI / 180)) + Math.PI;
    earthGroupRef.current.rotation.y = targetRad;
    sound.woosh(0.5);
  }, [targetLocation]);

  return (
    <div className="orbit-view-viewport">
      {/* 3D WebGL Canvas Container */}
      <div
        className="orbit-canvas-container"
        ref={mountRef}
      />

      {/* 3D Interactive Country Hover Floating Tooltip */}
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
            <div className="orbit-tooltip-title">{hoveredTerritory.name}</div>
            {hoveredTerritory.sovereign && (
              <div className="orbit-tooltip-sub">Rattaché : {hoveredTerritory.sovereign}</div>
            )}
            <div className="orbit-tooltip-stats">
              <span>{hoveredTerritory.continent}</span>
              <span>•</span>
              <span>{hoveredTerritory.pop} hab.</span>
              {hoveredTerritory.area && (
                <>
                  <span>•</span>
                  <span>{hoveredTerritory.area}</span>
                </>
              )}
            </div>
            <div className="orbit-tooltip-hint">Cliquer pour dossier stratégique</div>
          </div>
        </div>
      )}

      {/* Strategic Country Dossier Card (Awwwards OSINT Inspection) - Exactly like 2D! */}
      {selectedTerritory && (
        <CountryDossierCard
          territory={selectedTerritory}
          selectedYear={selectedYear}
          onClose={handleResetSelection}
          onResetView={handleResetSelection}
          onCompareSize={() => {}}
          onOpenDrawer={(terr) => {
            if (onSelectCountry) {
              const code = terr.geopolitics?.iso2 || 'FR';
              onSelectCountry(code, terr.name);
            }
          }}
          isDrawerOpen={isDrawerOpen}
        />
      )}

      {/* Tactical Bottom-Right Inspection Target Card (Osiris HUD style) */}
      <TacticalInspectionCard
        target={inspectedTarget}
        onClose={() => setInspectedTarget(null)}
        onOpenLive={(target) => {
          if (onSelectCCTV) onSelectCCTV(target);
        }}
        onCenter={(lat, lng) => {
          const [x, y, z] = coordsToVector(lng, lat, 4.2);
          if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(x, y, z);
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
        }}
        isDrawerOpen={isDrawerOpen}
      />

      {/* Floating Center-Bottom Coordinates - Pure typography directly on space canvas */}
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
        <span className="coord-divider">/</span>
        <div className="coord-item">
          <span className="coord-tag">ALT</span>
          <span className="coord-value" ref={coordAltRef}>12 450 KM</span>
        </div>
      </div>
    </div>
  );
}
