import REAL_VESSELS_SNAPSHOT from '../data/realVesselsSnapshot.json';

// MarineTraffic Official Ship Types & Colors
export const MARITIME_TYPES = {
  container: { label: 'Porte-conteneurs Ultra-Large (ULCV)', color: '#00f5a0', icon: '🚢' },
  tanker: { label: 'Pétrolier Brut Supertanker (VLCC)', color: '#ef4444', icon: '⛽' },
  lng: { label: 'Méthanier GNL Cryogénique', color: '#f97316', icon: '🔥' },
  bulk: { label: 'Vraquier Minéralier (Capesize)', color: '#00f2fe', icon: '⚓' },
  cargo: { label: 'Transporteur de Véhicules (Ro-Ro)', color: '#10b981', icon: '🚛' },
  passenger: { label: 'Paquebot de Croisière Géant', color: '#eab308', icon: '🛳️' },
  tug: { label: 'Remorqueur Hauturier d’Assistance', color: '#a855f7', icon: '🛥️' },
};

// Generates the authentic MarineTraffic pointed vessel hull SVG icon
export function getMarineTrafficVesselSvg(course = 0, size = 20, category = 'container', isSelected = false) {
  const typeDef = MARITIME_TYPES[category] || MARITIME_TYPES.container;
  const fillColor = isSelected ? '#ffffff' : typeDef.color;
  const strokeColor = isSelected ? '#00f2fe' : '#0a0f18';
  const strokeWidth = isSelected ? '1.5' : '1.1';
  const bridgeColor = isSelected ? '#00f2fe' : '#ffffff';
  const glowFilter = isSelected
    ? 'drop-shadow(0 0 8px #00f2fe) drop-shadow(0 0 2px #ffffff)'
    : `drop-shadow(0 1px 3px rgba(0,0,0,0.85)) drop-shadow(0 0 3px ${typeDef.color}55)`;

  return `
    <div class="marinetraffic-vessel-marker ${isSelected ? 'is-selected' : ''}" style="width: ${size}px; height: ${size}px;">
      <div class="marinetraffic-vessel-rotator" style="transform: rotate(${course}deg); filter: ${glowFilter}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
          <!-- Ship Hull: Pointed hydrodynamic bow, straight midships, transom stern -->
          <path fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"
            d="M12 2 L17.5 8.8 L17 21 L7 21 L6.5 8.8 Z" />
          <!-- Bridge / Deck Castle -->
          <rect x="9.5" y="13.5" width="5" height="3.5" rx="0.6" fill="${bridgeColor}" stroke="${strokeColor}" stroke-width="0.8" />
        </svg>
      </div>
      ${isSelected ? '<div class="marinetraffic-pulse-ring"></div>' : ''}
    </div>
  `;
}

class MarineTrafficService {
  constructor() {
    this.vessels = [];
    this.vesselsMap = new Map();
    this.totalGlobalVessels = 8950;
    this.vesselLimit = 25;
    this.listeners = new Set();
    this.animationTimer = null;
    this.lastMotionUpdate = Date.now();

    // Direct initialization from the authentic worldwide MarineTraffic dataset (2,210+ ships)
    if (Array.isArray(REAL_VESSELS_SNAPSHOT) && REAL_VESSELS_SNAPSHOT.length > 0) {
      for (let i = 0; i < REAL_VESSELS_SNAPSHOT.length; i++) {
        const item = REAL_VESSELS_SNAPSHOT[i];
        if (item && item.id) {
          this.vesselsMap.set(item.id, {
            ...item,
            lastUpdate: Date.now(),
          });
        }
      }
    }

    this.vessels = Array.from(this.vesselsMap.values());
    this.totalGlobalVessels = Math.max(8950, this.vessels.length);
  }

  setVesselLimit(limit) {
    this.vesselLimit = Math.max(10, limit);
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    if (this.vessels.length > 0) {
      callback(this.vessels, this.totalGlobalVessels, this.vesselLimit);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    for (const cb of this.listeners) {
      try {
        cb(this.vessels, this.totalGlobalVessels, this.vesselLimit);
      } catch (err) {
        console.error('Error in vessel subscriber:', err);
      }
    }
  }

  // Dead-reckoning motion at real physical maritime speed (1x)
  updatePhysicalMotion() {
    const now = Date.now();
    if (this.vessels.length === 0) return;

    let updated = false;
    for (const vessel of this.vessels) {
      if (!vessel.speedKts || vessel.speedKts <= 0.4) {
        // At anchor in roads or moored: tidal micro-drift
        vessel.lat += Math.sin(now * 0.0008 + vessel.imo) * 0.000004;
        vessel.lng += Math.cos(now * 0.0008 + vessel.mmsi) * 0.000004;
        vessel.lastUpdate = now;
        updated = true;
        continue;
      }

      const elapsedSec = (now - vessel.lastUpdate) / 1000;
      if (elapsedSec <= 0 || elapsedSec > 15) {
        vessel.lastUpdate = now;
        continue;
      }

      // 1 knot = 1.852 km/h
      const distKm = ((vessel.speedKts * 1.852) / 3600) * elapsedSec;
      const headingRad = ((vessel.course || vessel.heading || 0) * Math.PI) / 180;

      // 1 deg latitude = 111.32 km
      const dLat = (distKm * Math.cos(headingRad)) / 111.32;
      const cosLat = Math.cos((vessel.lat * Math.PI) / 180);
      const dLng = cosLat !== 0 ? (distKm * Math.sin(headingRad)) / (111.32 * cosLat) : 0;

      vessel.lat += dLat;
      vessel.lng += dLng;
      if (vessel.lng > 180) vessel.lng -= 360;
      if (vessel.lng < -180) vessel.lng += 360;
      vessel.lastUpdate = now;
      updated = true;
    }

    if (updated) {
      this.notify();
    }
  }

  start() {
    // 1-second physical motion ticker for live AIS navigation
    this.animationTimer = setInterval(() => {
      this.updatePhysicalMotion();
    }, 1000);
  }

  stop() {
    if (this.animationTimer) clearInterval(this.animationTimer);
  }
}

export const marineTrafficService = new MarineTrafficService();
marineTrafficService.start();
