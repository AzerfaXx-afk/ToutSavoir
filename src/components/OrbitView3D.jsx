import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { X, Maximize2 } from 'lucide-react';
import { sound } from '../utils/soundFX';
import { TERRITORY_NAMES_FR, getCountryAreaKm2, formatAreaKm2 } from '../utils/countryData';
import { realtimeStream } from '../utils/realtimeEvents';
import { AVIATION_ROUTES, CYBER_ATTACK_VECTORS, GEOPOLITICAL_ZONES } from '../data/tacticalStreams';
import {
  SATELLITES_DATA,
  CCTV_FEEDS,
  SUBMARINE_CABLES,
  THERMAL_ANOMALIES,
  WEATHER_SYSTEMS,
} from '../data/osirisStreams';
import { LIVE_FLIGHTS, LIVE_VESSELS } from '../data/liveTransits';
import { TacticalInspectionCard } from './TacticalInspectionCard';

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
  activeLayers = new Set(['aviation', 'satellites', 'cctv']),
  onSelectCCTV,
  onSelectSatellite,
  onSelectCountry,
  targetLocation,
  isDrawerOpen = false,
}) {
  const mountRef = useRef(null);
  const [coords, setCoords] = useState({ lat: '48.85° N', lng: '2.35° E' });
  const [altitude, setAltitude] = useState(12450);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [hoverScreenPos, setHoverScreenPos] = useState({ x: 0, y: 0 });
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [inspectedTarget, setInspectedTarget] = useState(null);

  // References
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const earthGroupRef = useRef(null);
  const earthMeshRef = useRef(null);
  const starFieldRef = useRef(null);
  const geoFeaturesRef = useRef([]);
  const selectedMeshRef = useRef(null);
  const selectedFillMatRef = useRef(null);
  const hoverMeshRef = useRef(null);
  const hoverFillMatRef = useRef(null);
  const lastHoveredFeatureRef = useRef(null);

  const autoRotateRef = useRef(autoRotate);
  const activeLayersRef = useRef(activeLayers);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    activeLayersRef.current = activeLayers;
  }, [activeLayers]);

  // Radius constants
  const R_EARTH = 2.0;
  const R_BORDERS = 2.003;
  const R_HOVER_BASE = 2.002;
  const R_HOVER_SURFACE = 2.025; // 25km equivalent orbital elevation
  const R_HOVER_BORDER = 2.028;
  const R_SELECT = 2.038; // Selection lifts even higher

  const coordsToVector = (lng, lat, radius = R_BORDERS) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
  };

  const removeHoverMesh = () => {
    if (hoverMeshRef.current && earthGroupRef.current) {
      earthGroupRef.current.remove(hoverMeshRef.current);
      hoverMeshRef.current.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      hoverMeshRef.current = null;
      hoverFillMatRef.current = null;
    }
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

  const handleResetSelection = () => {
    sound.click();
    setSelectedTerritory(null);
    removeSelectedMesh();
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
    surfaceRadius = R_HOVER_SURFACE,
    borderRadius = R_HOVER_BORDER,
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    // 7. Texture Loading
    const textureLoader = new THREE.TextureLoader();
    const dayMap = textureLoader.load('/textures/earth_day.jpg');
    const cloudsMap = textureLoader.load('/textures/earth_clouds.png');

    // 8. Full Daylight Photorealistic Shader
    const earthGeo = new THREE.SphereGeometry(R_EARTH, 64, 64);
    const earthShader = {
      uniforms: {
        uDayMap: { value: dayMap },
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

        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec4 dayColor = texture2D(uDayMap, vUv);

          vec3 normal = normalize(vWorldNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          vec3 lightDir = normalize(vec3(0.8, 1.2, 1.5));
          float NdotL = dot(normal, lightDir);
          float diffuse = 0.88 + 0.12 * max(NdotL, 0.0);

          vec3 surface = dayColor.rgb * diffuse;

          float rim = 1.0 - max(dot(normal, viewDir), 0.0);
          float limbHaze = pow(rim, 4.0) * 0.45;
          vec3 atmosHaze = vec3(0.08, 0.72, 1.0) * limbHaze;

          gl_FragColor = vec4(surface + atmosHaze, 1.0);
        }
      `,
    };

    const earthMat = new THREE.ShaderMaterial(earthShader);
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

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

    // 10. Semi-transparent Atmospheric Clouds Layer
    const cloudsGeo = new THREE.SphereGeometry(R_EARTH + 0.008, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthGroup.add(cloudsMesh);

    // 11. Cyan / Blue Atmospheric Glow
    const atmosGeo = new THREE.SphereGeometry(R_EARTH + 0.06, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.0, 0.95, 1.0, 1.0) * intensity * 0.42;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // 11b. Realtime Event Pulse Markers (Deaths = red, Births = emerald)
    const pulsesGroup = new THREE.Group();
    earthGroup.add(pulsesGroup);
    const activePulses = [];

    const unsubscribeStream = realtimeStream.subscribe((data) => {
      if (data.type === 'new_event' && data.event) {
        const evt = data.event;
        const isDeath = evt.type === 'death';
        const color = isDeath ? 0xff3366 : 0x00f5a0;
        const [x, y, z] = coordsToVector(evt.lng, evt.lat, R_EARTH + 0.007);
        const pos = new THREE.Vector3(x, y, z);

        const ringGeom = new THREE.RingGeometry(0.008, 0.022, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthTest: true,
          depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());

        const coreGeom = new THREE.CircleGeometry(0.006, 16);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide,
          depthTest: true,
          depthWrite: false,
        });
        const coreMesh = new THREE.Mesh(coreGeom, coreMat);
        ringMesh.add(coreMesh);

        pulsesGroup.add(ringMesh);
        activePulses.push({
          mesh: ringMesh,
          ringMat,
          coreMat,
          maxAge: 65,
          age: 0,
        });

        if (activePulses.length > 35) {
          const oldest = activePulses.shift();
          pulsesGroup.remove(oldest.mesh);
          oldest.mesh.geometry.dispose();
          oldest.ringMat.dispose();
          oldest.coreMat.dispose();
        }
      }
      if (data.earthquakes) {
        updateEarthquakeMeshes(data.earthquakes);
      }
    });

    // 11c. Aviation Layer (3D Geodesic Arcs + Moving Aircraft Nodes)
    const aviationGroup = new THREE.Group();
    earthGroup.add(aviationGroup);
    const activeFlights = [];
    const flightClickMeshes = [];

    LIVE_FLIGHTS.forEach((fl, idx) => {
      const [fromLat, fromLng] = fl.origin.coords;
      const [toLat, toLng] = fl.destination.coords;
      const vFrom = new THREE.Vector3(...coordsToVector(fromLng, fromLat, R_EARTH + 0.005));
      const vTo = new THREE.Vector3(...coordsToVector(toLng, toLat, R_EARTH + 0.005));
      const dist = vFrom.distanceTo(vTo);
      const arcApex = R_EARTH + Math.min(0.38, 0.06 + dist * 0.12);
      const vMid = vFrom.clone().add(vTo).multiplyScalar(0.5).normalize().multiplyScalar(arcApex);

      const curve = new THREE.QuadraticBezierCurve3(vFrom, vMid, vTo);
      const points = curve.getPoints(40);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f5a0,
        transparent: true,
        opacity: 0.35,
      });
      const arcLine = new THREE.Line(lineGeom, lineMat);
      aviationGroup.add(arcLine);

      // Moving Aircraft Node
      const planeGeom = new THREE.ConeGeometry(0.014, 0.04, 6);
      const planeMat = new THREE.MeshBasicMaterial({ color: 0x00f5a0 });
      const planeMesh = new THREE.Mesh(planeGeom, planeMat);
      planeMesh.userData = { isFlight: true, flight: fl };
      aviationGroup.add(planeMesh);
      flightClickMeshes.push(planeMesh);

      // Airport Hub Dots
      const hubGeom = new THREE.CircleGeometry(0.008, 12);
      const hubMat = new THREE.MeshBasicMaterial({ color: 0x00f5a0, side: THREE.DoubleSide });
      const hubFrom = new THREE.Mesh(hubGeom, hubMat);
      hubFrom.position.copy(vFrom);
      hubFrom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vFrom.clone().normalize());
      aviationGroup.add(hubFrom);

      activeFlights.push({
        curve,
        planeMesh,
        speed: 0.0016 + (idx % 3) * 0.0005,
        offset: (idx * 0.14) % 1,
      });
    });

    // 11c-2. Maritime Shipping Lanes Layer
    const maritimeGroup = new THREE.Group();
    earthGroup.add(maritimeGroup);
    const activeVessels = [];
    const vesselClickMeshes = [];

    LIVE_VESSELS.forEach((ves, idx) => {
      const pts = ves.routeWaypoints.map(([wLat, wLng]) => {
        return new THREE.Vector3(...coordsToVector(wLng, wLat, R_EARTH + 0.004));
      });
      const curve = new THREE.CatmullRomCurve3(pts);
      const routePoints = curve.getPoints(50);
      const routeGeom = new THREE.BufferGeometry().setFromPoints(routePoints);
      const routeMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.25,
      });
      maritimeGroup.add(new THREE.Line(routeGeom, routeMat));

      // Ship Mesh
      const shipGeom = new THREE.BoxGeometry(0.014, 0.008, 0.026);
      const shipMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const shipMesh = new THREE.Mesh(shipGeom, shipMat);
      shipMesh.userData = { isVessel: true, vessel: ves };
      maritimeGroup.add(shipMesh);
      vesselClickMeshes.push(shipMesh);

      activeVessels.push({
        curve,
        shipMesh,
        speed: 0.0007 + (idx % 3) * 0.0003,
        offset: (idx * 0.16) % 1,
      });
    });

    // 11d. Cyber Warfare Layer (Parabolic Laser Arcs + Traveling Attack Heads)
    const cyberGroup = new THREE.Group();
    earthGroup.add(cyberGroup);
    const activeAttacks = [];

    CYBER_ATTACK_VECTORS.forEach((vec, idx) => {
      const [fromLat, fromLng] = vec.from;
      const [toLat, toLng] = vec.to;
      const vFrom = new THREE.Vector3(...coordsToVector(fromLng, fromLat, R_EARTH + 0.006));
      const vTo = new THREE.Vector3(...coordsToVector(toLng, toLat, R_EARTH + 0.006));
      const dist = vFrom.distanceTo(vTo);
      const apex = R_EARTH + Math.min(0.48, 0.10 + dist * 0.18);
      const vMid = vFrom.clone().add(vTo).multiplyScalar(0.5).normalize().multiplyScalar(apex);

      const curve = new THREE.QuadraticBezierCurve3(vFrom, vMid, vTo);
      const points = curve.getPoints(45);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const arcColor = vec.severity === 'CRITICAL' ? 0xff0055 : vec.severity === 'HIGH' ? 0xffaa00 : 0xaa00ff;
      const lineMat = new THREE.LineBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: 0.42,
      });
      const arcLine = new THREE.Line(lineGeom, lineMat);
      cyberGroup.add(arcLine);

      // Traveling Attack Photon Head
      const headGeom = new THREE.SphereGeometry(0.014, 12, 12);
      const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const headMesh = new THREE.Mesh(headGeom, headMat);
      cyberGroup.add(headMesh);

      // Impact ring at target
      const impactGeom = new THREE.RingGeometry(0.008, 0.024, 20);
      const impactMat = new THREE.MeshBasicMaterial({
        color: arcColor,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const impactMesh = new THREE.Mesh(impactGeom, impactMat);
      impactMesh.position.copy(vTo);
      impactMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vTo.clone().normalize());
      cyberGroup.add(impactMesh);

      activeAttacks.push({
        curve,
        headMesh,
        impactMesh,
        speed: 0.0035 + (idx % 3) * 0.001,
        offset: (idx * 0.23) % 1,
      });
    });

    // 11e. Geopolitical Conflicts Layer (Radar circles over hotspot zones)
    const conflictsGroup = new THREE.Group();
    earthGroup.add(conflictsGroup);
    const activeHotspots = [];

    GEOPOLITICAL_ZONES.forEach((zone) => {
      const [x, y, z] = coordsToVector(zone.lng, zone.lat, R_EARTH + 0.007);
      const pos = new THREE.Vector3(x, y, z);

      const radarGeom = new THREE.RingGeometry(0.015, 0.045, 24);
      const radarMat = new THREE.MeshBasicMaterial({
        color: 0xff2a4d,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      const radarMesh = new THREE.Mesh(radarGeom, radarMat);
      radarMesh.position.copy(pos);
      radarMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
      conflictsGroup.add(radarMesh);

      activeHotspots.push({
        radarMesh,
        radarMat,
      });
    });

    // 11f. Earthquakes Layer (Real USGS Live Seismic Epicenters)
    const earthquakesGroup = new THREE.Group();
    earthGroup.add(earthquakesGroup);
    let earthquakeMeshes = [];

    const updateEarthquakeMeshes = (eqList) => {
      earthquakeMeshes.forEach((m) => {
        earthquakesGroup.remove(m.mesh);
        m.mesh.geometry.dispose();
        m.mat.dispose();
      });
      earthquakeMeshes = [];

      (eqList || []).slice(0, 15).forEach((eq) => {
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

        earthquakeMeshes.push({ mesh, mat, baseRadius: radius });
      });
    };

    // 11g. Satellites Layer (Orbital Rings & Satellites in 3D)
    const satellitesGroup = new THREE.Group();
    earthGroup.add(satellitesGroup);
    const activeSatellites = [];
    const satelliteClickMeshes = [];

    SATELLITES_DATA.forEach((sat, idx) => {
      const R_orb = R_EARTH + 0.22 + (sat.altitudeKm / 30000) * 0.45;
      const inclinationRad = (sat.inclination * Math.PI) / 180;

      // 3D Orbital Trajectory Ring
      const orbitPoints = [];
      const segments = 64;
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        const x = R_orb * Math.cos(theta);
        const y = R_orb * Math.sin(theta) * Math.sin(inclinationRad);
        const z = R_orb * Math.sin(theta) * Math.cos(inclinationRad);
        orbitPoints.push(new THREE.Vector3(x, y, z));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const ringMat = new THREE.LineBasicMaterial({
        color: sat.color ? new THREE.Color(sat.color) : 0x00f2fe,
        transparent: true,
        opacity: 0.35,
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      satellitesGroup.add(ringLine);

      // Satellite Diamond / Solar Array Mesh
      const satGroup = new THREE.Group();
      const bodyGeom = new THREE.OctahedronGeometry(0.018, 0);
      const bodyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      satGroup.add(bodyMesh);

      const panelGeom = new THREE.BoxGeometry(0.045, 0.008, 0.002);
      const panelMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
      const panelMesh = new THREE.Mesh(panelGeom, panelMat);
      satGroup.add(panelMesh);

      satGroup.userData = { satellite: sat };
      satellitesGroup.add(satGroup);
      satelliteClickMeshes.push(bodyMesh);
      bodyMesh.userData = { satellite: sat };

      activeSatellites.push({
        sat,
        R_orb,
        inclination: inclinationRad,
        mesh: satGroup,
        speed: 0.0025 + (idx % 3) * 0.0008,
      });
    });

    // 11h. CCTV Cameras Layer (Pulsing 3D Video Beacons)
    const cctvGroup = new THREE.Group();
    earthGroup.add(cctvGroup);
    const cctvMeshes = [];

    CCTV_FEEDS.forEach((cam) => {
      const [x, y, z] = coordsToVector(cam.lng, cam.lat, R_EARTH + 0.008);
      const pos = new THREE.Vector3(x, y, z);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);
      beaconGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());

      const ringGeom = new THREE.RingGeometry(0.01, 0.026, 20);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      beaconGroup.add(ringMesh);

      const pinGeom = new THREE.SphereGeometry(0.012, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.z = 0.012;
      pinMesh.userData = { isCCTV: true, camera: cam };
      beaconGroup.add(pinMesh);

      beaconGroup.userData = { isCCTV: true, camera: cam };
      cctvGroup.add(beaconGroup);
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

    // 11j. Extreme Weather & Thermal Anomalies (Wildfires & Cyclones)
    const weatherGroup = new THREE.Group();
    earthGroup.add(weatherGroup);
    const weatherMeshes = [];

    THERMAL_ANOMALIES.forEach((fire) => {
      const [x, y, z] = coordsToVector(fire.lng, fire.lat, R_EARTH + 0.007);
      const pos = new THREE.Vector3(x, y, z);
      const geom = new THREE.CircleGeometry(0.016, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfb923c,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
      weatherGroup.add(mesh);
      weatherMeshes.push(mesh);
    });

    WEATHER_SYSTEMS.forEach((w) => {
      const [x, y, z] = coordsToVector(w.lng, w.lat, R_EARTH + 0.008);
      const pos = new THREE.Vector3(x, y, z);
      const geom = new THREE.RingGeometry(0.015, 0.05, 20);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());
      weatherGroup.add(mesh);
      weatherMeshes.push(mesh);
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
      setCoords({ lat: latStr, lng: lngStr });
      return { lat: latDeg, lng: lngDeg };
    };

    // Find country feature for a given coordinate
    const findCountryFeature = (lat, lng) => {
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
          if (pointInPolygon([lng, lat], poly[0])) {
            return f;
          }
        }
      }
      return null;
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
        container.style.cursor = 'pointer';
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
        const cctvHits = raycaster.intersectObjects(cctvMeshes, true);
        if (cctvHits.length > 0) {
          const hitCam = cctvHits[0].object.userData?.camera;
          if (hitCam) {
            sound.click();
            setInspectedTarget({ type: 'cctv', ...hitCam });
            return;
          }
        }

        // 2. Check Satellites click
        const satHits = raycaster.intersectObjects(satelliteClickMeshes, true);
        if (satHits.length > 0) {
          const hitSat = satHits[0].object.userData?.satellite;
          if (hitSat) {
            sound.click();
            setInspectedTarget({ type: 'satellite', ...hitSat });
            if (onSelectSatellite) onSelectSatellite(hitSat);
            return;
          }
        }

        // 3. Check Live Flights click
        const flightHits = raycaster.intersectObjects(flightClickMeshes, true);
        if (flightHits.length > 0) {
          const hitFl = flightHits[0].object.userData?.flight;
          if (hitFl) {
            sound.click();
            setInspectedTarget({ type: 'flight', ...hitFl });
            return;
          }
        }

        // 4. Check Live Maritime Vessels click
        const vesselHits = raycaster.intersectObjects(vesselClickMeshes, true);
        if (vesselHits.length > 0) {
          const hitVes = vesselHits[0].object.userData?.vessel;
          if (hitVes) {
            sound.click();
            setInspectedTarget({ type: 'vessel', ...hitVes });
            return;
          }
        }

        const intersects = raycaster.intersectObject(earthMesh);

        if (intersects.length > 0) {
          const localPoint = earthMesh.worldToLocal(intersects[0].point.clone());
          const { lat, lng } = updateCoordsFromLocalPoint(localPoint);

          const foundFeature = findCountryFeature(lat, lng);

          if (foundFeature) {
            sound.click();
            const props = foundFeature.properties || {};
            if (onSelectCountry) onSelectCountry(props.ISO_A2 || props.ADM0_A3 || props.NAME, props.NAME || 'Pays');
            const rawName = props.NAME || props.SUBUNIT || props.ADMIN || 'Territoire';
            const displayName = TERRITORY_NAMES_FR[rawName] || props.NAME_FR || rawName;
            const sovereign = props.SOVEREIGNT || props.SOV_A3 || displayName;
            const continent = props.CONTINENT || 'International';
            const subregion = props.SUBREGION || '';
            const pop = props.POP_EST || props.POP2005;
            const popFormatted = pop ? Number(pop).toLocaleString('fr-FR') : 'N/A';
            const areaKm2 = getCountryAreaKm2(foundFeature);
            const areaFormatted = formatAreaKm2(areaKm2);

            setSelectedTerritory({
              name: displayName,
              sovereign,
              continent,
              subregion,
              pop: popFormatted,
              area: areaFormatted,
              centerLat: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`,
              centerLng: `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`,
            });

            // Remove existing selected mesh
            removeSelectedMesh();

            // Build full selected mesh with elevated surface, walls and bright neon border
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

            earthGroup.add(selectedMesh);
            selectedMeshRef.current = selectedMesh;
            selectedFillMatRef.current = selectedMesh.userData.fillMat;
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

      setHoverScreenPos({ x: e.clientX, y: e.clientY });

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
          if (foundFeature !== lastHoveredFeatureRef.current) {
            lastHoveredFeatureRef.current = foundFeature;
            sound.hover();

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

            setHoveredCountry({
              name: displayName,
              sovereign,
              continent,
              subregion,
              pop: popFormatted,
              area: areaFormatted,
            });

            // If this territory is not already the selected one, elevate it in 3D!
            removeHoverMesh();
            const hoverMesh = createTerritoryMesh(foundFeature, {
              surfaceRadius: R_HOVER_SURFACE,
              borderRadius: R_HOVER_BORDER,
              baseRadius: R_HOVER_BASE,
              fillColor: 0x00f2fe,
              fillOpacity: 0.42,
              borderColor: 0x00ffff,
              borderOpacity: 1.0,
              hasWalls: true,
              wallColor: 0x00d8f6,
              wallOpacity: 0.32,
            });

            // Initial small scale for spring pop-in
            hoverMesh.scale.set(0.998, 0.998, 0.998);
            earthGroup.add(hoverMesh);
            hoverMeshRef.current = hoverMesh;
            hoverFillMatRef.current = hoverMesh.userData.fillMat;
          }

          if (!isRightDragging && !(e.buttons & 2)) {
            container.style.cursor = 'pointer';
          }
        } else {
          // Over ocean
          if (lastHoveredFeatureRef.current) {
            lastHoveredFeatureRef.current = null;
            removeHoverMesh();
            setHoveredCountry(null);
          }
        }
      } else {
        isHoveringEarth = false;
        if (lastHoveredFeatureRef.current) {
          lastHoveredFeatureRef.current = null;
          removeHoverMesh();
          setHoveredCountry(null);
        }

        const dir = camera.position.clone().negate().normalize().multiplyScalar(2);
        const localPoint = earthMesh.worldToLocal(dir);
        updateCoordsFromLocalPoint(localPoint);

        if (!isRightDragging && !(e.buttons & 2)) {
          container.style.cursor = 'pointer';
        }
      }

      const dist = camera.position.length();
      const altKm = Math.round(((dist - 2) / 2) * 6371);
      setAltitude(Math.max(450, altKm));
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
      }

      // Update real-time event pulses (deaths & births)
      for (let i = activePulses.length - 1; i >= 0; i--) {
        const p = activePulses[i];
        p.age++;
        const progress = p.age / p.maxAge;
        const scale = 1.0 + progress * 1.5;
        p.mesh.scale.set(scale, scale, scale);
        p.ringMat.opacity = 0.85 * (1 - progress);
        p.coreMat.opacity = Math.max(0, 0.95 * (1 - progress * 1.4));

        if (p.age >= p.maxAge) {
          pulsesGroup.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.ringMat.dispose();
          p.coreMat.dispose();
          activePulses.splice(i, 1);
        }
      }

      // Tactical Mode Visibility & Animations
      const layers = activeLayersRef.current || new Set();
      pulsesGroup.visible = true;
      aviationGroup.visible = layers.has('aviation');
      cyberGroup.visible = layers.has('cyber');
      conflictsGroup.visible = layers.has('conflicts');
      earthquakesGroup.visible = layers.has('telluric');
      satellitesGroup.visible = layers.has('satellites');
      cctvGroup.visible = layers.has('cctv');
      cablesGroup.visible = layers.has('cables');
      weatherGroup.visible = layers.has('weather');

      // Animate satellites along their 3D orbital planes
      if (satellitesGroup.visible) {
        activeSatellites.forEach((item, idx) => {
          const t = (frameCount * item.speed + idx * 0.7) % (Math.PI * 2);
          const x = item.R_orb * Math.cos(t);
          const y = item.R_orb * Math.sin(t) * Math.sin(item.inclination);
          const z = item.R_orb * Math.sin(t) * Math.cos(item.inclination);
          item.mesh.position.set(x, y, z);
          item.mesh.rotation.y += 0.02;
        });
      }

      // Animate CCTV beacons
      if (cctvGroup.visible) {
        cctvMeshes.forEach((mesh, idx) => {
          const s = 1.0 + 0.22 * Math.sin(frameCount * 0.08 + idx);
          mesh.scale.set(s, s, s);
        });
      }

      // Animate Weather / Wildfire clusters
      if (weatherGroup.visible) {
        weatherMeshes.forEach((mesh, idx) => {
          const s = 1.0 + 0.25 * Math.sin(frameCount * 0.09 + idx);
          mesh.scale.set(s, s, s);
        });
      }

      // Animate aviation flights along 3D curves
      if (aviationGroup.visible) {
        activeFlights.forEach((fl) => {
          const t = (frameCount * fl.speed + fl.offset) % 1;
          const pos = fl.curve.getPoint(t);
          fl.planeMesh.position.copy(pos);
          const tangent = fl.curve.getTangent(t).normalize();
          fl.planeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
        });
      }

      // Animate maritime cargo vessels
      maritimeGroup.visible = layers.has('aviation') || layers.has('maritime');
      if (maritimeGroup.visible) {
        activeVessels.forEach((ves) => {
          const t = (frameCount * ves.speed + ves.offset) % 1;
          const pos = ves.curve.getPoint(t);
          ves.shipMesh.position.copy(pos);
          const tangent = ves.curve.getTangent(t).normalize();
          ves.shipMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        });
      }

      // Animate cyber attack pulses
      if (cyberGroup.visible) {
        activeAttacks.forEach((att) => {
          const t = (frameCount * att.speed + att.offset) % 1;
          const pos = att.curve.getPoint(t);
          att.headMesh.position.copy(pos);
          const impactScale = 1.0 + Math.sin(t * Math.PI * 4) * 0.35;
          att.impactMesh.scale.set(impactScale, impactScale, impactScale);
        });
      }

      // Animate conflict radar hotspots
      if (conflictsGroup.visible) {
        activeHotspots.forEach((hs, idx) => {
          const scale = 1.0 + 0.35 * Math.sin(frameCount * 0.08 + idx);
          hs.radarMesh.scale.set(scale, scale, scale);
          hs.radarMat.opacity = 0.5 + 0.35 * Math.sin(frameCount * 0.08 + idx);
        });
      }

      // Animate earthquakes
      if (earthquakesGroup.visible) {
        earthquakeMeshes.forEach((eq, idx) => {
          const pulse = 1.0 + 0.25 * Math.sin(frameCount * 0.1 + idx);
          eq.mesh.scale.set(pulse, pulse, pulse);
        });
      }

      // Smooth hover mesh spring pop-in & glowing pulse
      if (hoverMeshRef.current) {
        hoverMeshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
        if (hoverFillMatRef.current) {
          hoverFillMatRef.current.opacity = 0.40 + 0.08 * Math.sin(frameCount * 0.1);
        }
      }

      // Selected country glowing pulse effect
      if (selectedFillMatRef.current) {
        selectedFillMatRef.current.opacity = 0.45 + 0.12 * Math.sin(frameCount * 0.07);
      }

      // Continuous coordinates update
      if (frameCount % 8 === 0 && !isHoveringEarth) {
        const dir = camera.position.clone().negate().normalize().multiplyScalar(2);
        const localPoint = earthMesh.worldToLocal(dir);
        updateCoordsFromLocalPoint(localPoint);

        const dist = camera.position.length();
        const altKm = Math.round(((dist - 2) / 2) * 6371);
        setAltitude(Math.max(450, altKm));
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
      container.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('keydown', onKeyDown);

      unsubscribeStream();
      activePulses.forEach((p) => {
        pulsesGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.ringMat.dispose();
        p.coreMat.dispose();
      });
      earthGroup.remove(pulsesGroup);

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

      removeHoverMesh();
      removeSelectedMesh();

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

      {/* Floating Tactical Country Pill (Follows Cursor on Hover in 3D) */}
      {hoveredCountry && (
        <div
          className="country-hover-pill orbit-hover-pill"
          style={{
            left: hoverScreenPos.x + 18,
            top: hoverScreenPos.y - 46,
          }}
        >
          <div className="country-pill-core awwwards-pill">
            <span className="pill-item-name">{hoveredCountry.name.toUpperCase()}</span>
            <span className="pill-item-sep">/</span>
            <span className="pill-item-detail">{hoveredCountry.continent}</span>
            <span className="pill-item-sep">/</span>
            <span className="pill-item-pop">POP: {hoveredCountry.pop}</span>
            <span className="pill-item-sep">/</span>
            <span className="pill-item-area">SUP: {hoveredCountry.area}</span>
          </div>
        </div>
      )}

      {/* Country Inspector HUD Overlay (Same design as 2D) */}
      {selectedTerritory && (
        <div className="territory-inspector-card">
          <div className="inspector-header">
            <div className="inspector-title-group">
              <span className="inspector-badge">TERRITOIRE SÉLECTIONNÉ (3D)</span>
              <div className="inspector-titles">
                <h3 className="inspector-main-name">{selectedTerritory.name}</h3>
                {selectedTerritory.sovereign && selectedTerritory.sovereign !== selectedTerritory.name && (
                  <span className="inspector-sub-name">RATTACHÉ : {selectedTerritory.sovereign}</span>
                )}
              </div>
            </div>
            <button
              className="inspector-close-btn"
              onClick={handleResetSelection}
              onMouseEnter={() => sound.hover()}
              title="Fermer"
            >
              <X size={13} />
            </button>
          </div>

          <div className="inspector-body">
            <div className="inspector-metric-row">
              <span className="metric-tag">CONTINENT / ZONE</span>
              <span className="metric-val">{selectedTerritory.continent}</span>
            </div>

            {selectedTerritory.subregion && (
              <div className="inspector-metric-row">
                <span className="metric-tag">SOUS-RÉGION</span>
                <span className="metric-val text-cyan">{selectedTerritory.subregion}</span>
              </div>
            )}

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
              onClick={handleResetSelection}
              onMouseEnter={() => sound.hover()}
            >
              <Maximize2 size={12} />
              <span>REPRENDRE LA ROTATION GLOBALE</span>
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
          <span className="coord-value">{coords.lat}</span>
        </div>
        <span className="coord-divider">/</span>
        <div className="coord-item">
          <span className="coord-tag">LNG</span>
          <span className="coord-value">{coords.lng}</span>
        </div>
        <span className="coord-divider">/</span>
        <div className="coord-item">
          <span className="coord-tag">ALT</span>
          <span className="coord-value">{altitude.toLocaleString('fr-FR')} KM</span>
        </div>
      </div>
    </div>
  );
}
