// Audio Telemetry Engine // Chronos-Terra High-Fidelity Audio System (Zero-Latency Web Audio + Preload)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.audioPool = new Map();
    this.spaceAudio = null;
    this.lastHoverTime = 0;
    this.lastClickTime = 0;
    this.lastWooshTime = 0;
    this.lastCountryHoverTime = 0;
    this.currentHoveredCountry = null;
    this.isInitialized = false;
    this.unlocked = false;
    this.muted = false;

    // Auto-setup when running in browser
    if (typeof window !== 'undefined') {
      this.init();
      this.setupAutoUnlock();
      this.setupGlobalInteractions();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopSpaceMusic();
    }
    return this.muted;
  }

  setMuted(val) {
    this.muted = !!val;
    if (this.muted) {
      this.stopSpaceMusic();
    }
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.preloadAll();
    }
  }

  setupAutoUnlock() {
    const unlockEvents = ['pointerdown', 'keydown', 'pointermove', 'pointerover', 'touchstart', 'wheel'];
    const unlock = () => {
      this.init();
      if (this.ctx && this.ctx.state === 'running') {
        this.unlocked = true;
        unlockEvents.forEach((evt) => {
          window.removeEventListener(evt, unlock);
        });
      }
    };
    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, unlock, { passive: true, once: false });
    });
  }

  // Preload sound files into AudioBuffer for 0ms latency
  async preloadBuffer(name, url) {
    if (typeof window === 'undefined' || !this.ctx) return;
    try {
      const res = await fetch(url);
      const arrayBuf = await res.arrayBuffer();
      const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
      this.buffers.set(name, audioBuf);
    } catch {
      // Fallback: populate audioPool
      this.getPoolAudio(name, url);
    }
  }

  preloadAll() {
    this.preloadBuffer('hover', '/hover.mp3');
    this.preloadBuffer('click', '/click.mp3');
    this.preloadBuffer('toggle', '/toggle.mp3');

    // Create warm fallback HTML5 audio objects
    this.getPoolAudio('hover', '/hover.mp3');
    this.getPoolAudio('click', '/click.mp3');
    this.getPoolAudio('toggle', '/toggle.mp3');
  }

  getPoolAudio(name, url) {
    if (!this.audioPool.has(name)) {
      const pool = [];
      for (let i = 0; i < 4; i++) {
        const a = new Audio(url);
        a.preload = 'auto';
        pool.push(a);
      }
      this.audioPool.set(name, { pool, index: 0 });
    }
    const item = this.audioPool.get(name);
    const audio = item.pool[item.index];
    item.index = (item.index + 1) % item.pool.length;
    return audio;
  }

  // Ultra-fast playback: Web Audio buffer preferred, fallback to HTML5 Audio pool
  playSound(name, url, volume = 0.5, pitchVar = 0.0) {
    if (this.muted) return;
    this.init();

    // 1. High-speed Web Audio Buffer (0 ms latency, no browser element throttle)
    if (this.ctx && this.ctx.state === 'running' && this.buffers.has(name)) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.get(name);

        if (pitchVar > 0) {
          source.playbackRate.value = 1.0 + (Math.random() * 2 - 1) * pitchVar;
        }

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch {
        // Fallback below
      }
    }

    // 2. HTML5 Audio fallback pool
    try {
      const audio = this.getPoolAudio(name, url);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.currentTime = 0;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  // High-fidelity Awwwards micro-tone synthesized in Web Audio (0 ms latency guaranteed)
  synthAwwwardsTick(volume = 0.28, baseFreq = 1200) {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t + 0.012);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, t + 0.024);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(volume * 0.35, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.026);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.028);
    } catch {
      // ignore
    }
  }

  // 1. Hover Sound (hover.mp3) - Plays on cards, buttons & UI elements
  hover(volume = 0.35) {
    if (this.muted) return;
    const now = Date.now();
    if (now - this.lastHoverTime < 60) return; // Prevent stutter on superfast sweep
    this.lastHoverTime = now;

    this.init();
    if (this.ctx && this.ctx.state === 'running' && this.buffers.has('hover')) {
      this.playSound('hover', '/hover.mp3', volume, 0.02);
    } else if (this.ctx && this.ctx.state === 'running') {
      this.synthAwwwardsTick(volume, 1350);
    } else {
      this.playSound('hover', '/hover.mp3', volume, 0.02);
    }
  }

  // Signature Awwwards Country Hover Sound - Plays strictly once per country entry
  countryHover(countryKey, volume = 0.35) {
    if (this.muted || !countryKey) return;
    // Strictly play ONCE per country. Moving or staying inside the same country produces zero sound re-triggers.
    if (this.currentHoveredCountry === countryKey) return;

    const now = Date.now();
    if (now - this.lastCountryHoverTime < 75) return;
    this.lastCountryHoverTime = now;
    this.currentHoveredCountry = countryKey;

    this.init();
    if (this.ctx && this.ctx.state === 'running' && this.buffers.has('hover')) {
      this.playSound('hover', '/hover.mp3', volume, 0.02);
    } else if (this.ctx && this.ctx.state === 'running') {
      this.synthAwwwardsTick(volume, 1250);
    } else {
      this.playSound('hover', '/hover.mp3', volume, 0.02);
    }
  }

  // Clear hovered country memory when cursor exits countries or hits empty ocean
  clearCountryHover() {
    this.currentHoveredCountry = null;
  }

  // Alias for hover
  tick(volume = 0.35) {
    this.hover(volume);
  }

  // 2. Click Sound for selections, territory cards, controls (click.mp3)
  click(volume = 0.55) {
    if (this.muted) return;
    const now = Date.now();
    if (now - this.lastClickTime < 50) return;
    this.lastClickTime = now;

    this.init();
    if (this.ctx && this.ctx.state === 'running' && this.buffers.has('click')) {
      this.playSound('click', '/click.mp3', volume);
    } else if (this.ctx && this.ctx.state === 'running') {
      this.synthAwwwardsTick(volume * 0.9, 880);
    } else {
      this.playSound('click', '/click.mp3', volume);
    }
  }

  // Alias for click
  alert(volume = 0.55) {
    this.click(volume);
  }

  // 3. Toggle 2D / 3D Switch Sound (toggle.mp3)
  toggle(volume = 0.65) {
    this.playSound('toggle', '/toggle.mp3', volume);
  }

  // 4. Subtle, realistic atmospheric woosh when dragging / rotating the Earth
  woosh(speed = 1.0) {
    const now = Date.now();
    if (now - this.lastWooshTime < 320) return;
    this.lastWooshTime = now;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const duration = 0.42;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.055;
        b1 = 0.963 * b1 + white * 0.075;
        b2 = 0.570 * b2 + white * 0.153;
        data[i] = (b0 + b1 + b2) * 0.45;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1.6;

      const t = this.ctx.currentTime;
      filter.frequency.setValueAtTime(190, t);
      filter.frequency.exponentialRampToValueAtTime(560, t + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(170, t + duration);

      const gain = this.ctx.createGain();
      const peakVol = Math.min(0.065, 0.04 * speed);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peakVol, t + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + duration);
    } catch {
      // ignore
    }
  }

  // 5. Warp sound generator for mode switcher / timeline scrubber
  warp(freq = 440) {
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') {
      this.click(0.5);
      return;
    }
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.12);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch {
      this.click(0.4);
    }
  }

  // 5b. Ultra-crisp mechanical notch tick for timeline jog dial
  notchTick(freq = 1400) {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(250, t + 0.022);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    } catch {
      // ignore
    }
  }

  // 6. 3D Ambient Space BGM (space.mp3) - Seamless loop in background only during 3D view
  startSpaceMusic() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.spaceAudio) {
        this.spaceAudio = new Audio('/space.mp3');
        this.spaceAudio.loop = true;
        this.spaceAudio.volume = 0.32;
      }
      this.spaceAudio.currentTime = 0;
      const promise = this.spaceAudio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('Space music autoplay policy:', err);
        });
      }
    } catch {
      console.warn('Could not play space music');
    }
  }

  stopSpaceMusic() {
    try {
      if (this.spaceAudio) {
        this.spaceAudio.pause();
        this.spaceAudio.currentTime = 0;
      }
    } catch {
      // ignore
    }
  }

  // Automated global delegation for all UI elements
  setupGlobalInteractions() {
    if (typeof window === 'undefined') return;

    let lastHoverEl = null;

    const isInteractive = (el) => {
      if (!el || !el.closest) return null;
      return el.closest(
        'button, a, [role="button"], input, select, label.switch-3d, .kpi-card, .country-pill-core, .top-rotation-toggle-btn, .inspector-close-btn, .inspector-reset-zoom-btn, .coord-item, [data-interactive="true"], .leaflet-marker-icon, .cctv-div-marker, .news-div-marker, .nuclear-div-marker, .weather-div-marker, .conflict-div-marker, .telluric-div-marker, .marker-div-icon, .awwwards-date-reset-pill, .timeline-awwwards-trigger, .layer-pill-btn, .control-hud-btn, .drawer-nav-item, .journal-filter-chip, .tic-close-btn, .cctv-pip-btn'
      );
    };

    window.addEventListener(
      'pointerover',
      (e) => {
        const target = isInteractive(e.target);
        if (target && target !== lastHoverEl) {
          lastHoverEl = target;
          this.hover(0.32);
        } else if (!target) {
          lastHoverEl = null;
        }
      },
      { passive: true, capture: true }
    );

    window.addEventListener(
      'click',
      (e) => {
        const target = isInteractive(e.target);
        if (target) {
          this.click(0.55);
        }
      },
      { passive: true, capture: true }
    );
  }
}

export const sound = new SoundFX();
