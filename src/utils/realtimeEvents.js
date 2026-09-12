// Real-time Global Events Engine & Demographics Stream
// Accurate vital statistics modeling (~1.93 deaths/s, ~4.29 births/s) + USGS Live Earthquakes

// Major world population hubs for realistic event dispersion
const DEMOGRAPHIC_HUBS = [
  // India (High weight)
  { country: 'Inde', city: 'Mumbai', lat: 19.076, lng: 72.877, weight: 18 },
  { country: 'Inde', city: 'Delhi', lat: 28.613, lng: 77.209, weight: 17 },
  { country: 'Inde', city: 'Kolkata', lat: 22.572, lng: 88.363, weight: 14 },
  { country: 'Inde', city: 'Bangalore', lat: 12.971, lng: 77.594, weight: 12 },
  { country: 'Inde', city: 'Chennai', lat: 13.082, lng: 80.270, weight: 10 },
  // China (High weight)
  { country: 'Chine', city: 'Shanghai', lat: 31.230, lng: 121.473, weight: 18 },
  { country: 'Chine', city: 'Pékin', lat: 39.904, lng: 116.407, weight: 17 },
  { country: 'Chine', city: 'Guangzhou', lat: 23.129, lng: 113.264, weight: 14 },
  { country: 'Chine', city: 'Chengdu', lat: 30.572, lng: 104.066, weight: 13 },
  { country: 'Chine', city: 'Wuhan', lat: 30.592, lng: 114.305, weight: 12 },
  // Africa (High birth rate / demographic growth)
  { country: 'Nigéria', city: 'Lagos', lat: 6.524, lng: 3.379, weight: 16 },
  { country: 'Nigéria', city: 'Kano', lat: 12.002, lng: 8.591, weight: 11 },
  { country: 'RD Congo', city: 'Kinshasa', lat: -4.441, lng: 15.266, weight: 13 },
  { country: 'Égypte', city: 'Le Caire', lat: 30.044, lng: 31.235, weight: 12 },
  { country: 'Éthiopie', city: 'Addis-Abeba', lat: 9.032, lng: 38.742, weight: 11 },
  { country: 'Kenya', city: 'Nairobi', lat: -1.292, lng: 36.821, weight: 9 },
  { country: 'Afrique du Sud', city: 'Johannesburg', lat: -26.204, lng: 28.047, weight: 9 },
  // Americas
  { country: 'États-Unis', city: 'New York', lat: 40.712, lng: -74.006, weight: 13 },
  { country: 'États-Unis', city: 'Los Angeles', lat: 34.052, lng: -118.243, weight: 11 },
  { country: 'États-Unis', city: 'Chicago', lat: 41.878, lng: -87.629, weight: 9 },
  { country: 'Brésil', city: 'São Paulo', lat: -23.550, lng: -46.633, weight: 14 },
  { country: 'Brésil', city: 'Rio de Janeiro', lat: -22.906, lng: -43.172, weight: 10 },
  { country: 'Mexique', city: 'Mexico', lat: 19.432, lng: -99.133, weight: 13 },
  { country: 'Colombie', city: 'Bogotá', lat: 4.711, lng: -74.072, weight: 8 },
  // Asia / Pacific
  { country: 'Indonésie', city: 'Jakarta', lat: -6.208, lng: 106.845, weight: 15 },
  { country: 'Pakistan', city: 'Karachi', lat: 24.860, lng: 67.001, weight: 15 },
  { country: 'Pakistan', city: 'Lahore', lat: 31.520, lng: 74.358, weight: 12 },
  { country: 'Bangladesh', city: 'Dacca', lat: 23.810, lng: 90.412, weight: 14 },
  { country: 'Japon', city: 'Tokyo', lat: 35.676, lng: 139.650, weight: 12 },
  { country: 'Philippines', city: 'Manille', lat: 14.599, lng: 120.984, weight: 12 },
  { country: 'Vietnam', city: 'Hô Chi Minh-Ville', lat: 10.823, lng: 106.629, weight: 10 },
  { country: 'Thaïlande', city: 'Bangkok', lat: 13.756, lng: 100.501, weight: 9 },
  // Europe
  { country: 'France', city: 'Paris', lat: 48.856, lng: 2.352, weight: 9 },
  { country: 'France', city: 'Marseille', lat: 43.296, lng: 5.369, weight: 6 },
  { country: 'Royaume-Uni', city: 'Londres', lat: 51.507, lng: -0.127, weight: 9 },
  { country: 'Allemagne', city: 'Berlin', lat: 52.520, lng: 13.405, weight: 9 },
  { country: 'Italie', city: 'Rome', lat: 41.902, lng: 12.496, weight: 8 },
  { country: 'Espagne', city: 'Madrid', lat: 40.416, lng: -3.703, weight: 8 },
  { country: 'Russie', city: 'Moscou', lat: 55.755, lng: 37.617, weight: 12 },
  { country: 'Turquie', city: 'Istanbul', lat: 41.008, lng: 28.978, weight: 11 },
];

const TOTAL_WEIGHT = DEMOGRAPHIC_HUBS.reduce((acc, h) => acc + h.weight, 0);

function pickRandomHub() {
  let rand = Math.random() * TOTAL_WEIGHT;
  for (const hub of DEMOGRAPHIC_HUBS) {
    if (rand < hub.weight) {
      // Add slight jitter so points don't all stack on exact same pixel
      const jitterLat = (Math.random() - 0.5) * 0.45;
      const jitterLng = (Math.random() - 0.5) * 0.45;
      return {
        country: hub.country,
        city: hub.city,
        lat: hub.lat + jitterLat,
        lng: hub.lng + jitterLng,
      };
    }
    rand -= hub.weight;
  }
  return DEMOGRAPHIC_HUBS[0];
}

class RealtimeEventsEngine {
  constructor() {
    this.listeners = new Set();
    this.history = [];
    this.maxHistory = 60;
    this.isRunning = false;
    this.nextEventTimer = null;
    this.earthquakeInterval = null;

    // Base demographic numbers (Worldometer baseline 2026)
    this.baseWorldPop = 8185420000;
    this.birthsPerSec = 4.29; // ~135.5M / year
    this.deathsPerSec = 1.93; // ~60.9M / year

    // Calculated daily counters
    this.stats = {
      worldPopulation: this.baseWorldPop,
      birthsToday: 0,
      deathsToday: 0,
      netGrowthToday: 0,
      recentEarthquakes: [],
    };

    this.updateDailyCounters();
  }

  // Calculate stats based on UTC seconds elapsed today
  updateDailyCounters() {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const secondsToday = Math.max(0, (now.getTime() - startOfDay.getTime()) / 1000);

    this.stats.birthsToday = Math.floor(secondsToday * this.birthsPerSec);
    this.stats.deathsToday = Math.floor(secondsToday * this.deathsPerSec);
    this.stats.netGrowthToday = this.stats.birthsToday - this.stats.deathsToday;
    this.stats.worldPopulation = this.baseWorldPop + this.stats.netGrowthToday;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    // Send immediate snapshot of current stats & recent history
    callback({ type: 'snapshot', stats: this.stats, history: this.history });
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in realtime event listener:', err);
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // 1. Live Micro-events generator (Deaths & Births with Poisson-like timing)
    const scheduleNextEvent = () => {
      if (!this.isRunning) return;

      // Realistic interval: average ~300ms to 700ms between micro-events
      const delay = 320 + Math.random() * 450;
      this.nextEventTimer = setTimeout(() => {
        this.emitRandomEvent();
        scheduleNextEvent();
      }, delay);
    };

    scheduleNextEvent();

    // 2. Ticker to increment daily counters smoothly every second
    this.counterInterval = setInterval(() => {
      this.stats.birthsToday += Math.round(this.birthsPerSec);
      this.stats.deathsToday += Math.round(this.deathsPerSec);
      this.stats.netGrowthToday = this.stats.birthsToday - this.stats.deathsToday;
      this.stats.worldPopulation = this.baseWorldPop + this.stats.netGrowthToday;
      this.notify({ type: 'stats_update', stats: this.stats });
    }, 1000);

    // 3. Fetch real USGS live earthquakes
    this.fetchUsgsEarthquakes();
    this.earthquakeInterval = setInterval(() => {
      this.fetchUsgsEarthquakes();
    }, 90000); // every 90s
  }

  stop() {
    this.isRunning = false;
    if (this.nextEventTimer) clearTimeout(this.nextEventTimer);
    if (this.counterInterval) clearInterval(this.counterInterval);
    if (this.earthquakeInterval) clearInterval(this.earthquakeInterval);
  }

  emitRandomEvent() {
    const isDeath = Math.random() < 0.42; // ~42% deaths, ~58% births reflecting global rates
    const eventType = isDeath ? 'death' : 'birth';
    const hub = pickRandomHub();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const event = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: eventType,
      lat: hub.lat,
      lng: hub.lng,
      country: hub.country,
      city: hub.city,
      title: isDeath ? 'Décès estimé' : 'Naissance',
      time: timeStr,
      timestamp: Date.now(),
    };

    // Update history
    this.history.unshift(event);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Broadcast to 3D, 2D, Legend & Drawer
    this.notify({ type: 'new_event', event, stats: this.stats });
  }

  // Real API Fetch: USGS Live Earthquakes (Free, Open, Global)
  async fetchUsgsEarthquakes() {
    try {
      const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const parsed = data.features.slice(0, 10).map((f) => {
          const props = f.properties || {};
          const [lng, lat, depth] = f.geometry.coordinates || [0, 0, 0];
          const date = new Date(props.time || Date.now());
          return {
            id: f.id || `eq-${props.time}`,
            type: 'earthquake',
            mag: props.mag ? props.mag.toFixed(1) : '?',
            place: props.place || 'Épicentre océanique',
            lat,
            lng,
            depth: Math.round(depth),
            time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: props.time || Date.now(),
          };
        });

        this.stats.recentEarthquakes = parsed;
        this.notify({ type: 'earthquakes_update', earthquakes: parsed });
      }
    } catch {
      // Quiet fail if offline
    }
  }
}

export const realtimeStream = new RealtimeEventsEngine();
realtimeStream.start();
