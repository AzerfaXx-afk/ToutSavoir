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
    this.isInitialized = false;
    this.unlocked = false;

    // Auto-setup when running in browser
    if (typeof window !== 'undefined') {
      this.setupAutoUnlock();
      this.setupGlobalInteractions();
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
    const unlock = () => {
      this.init();
      if (this.ctx && this.ctx.state === 'running') {
        this.unlocked = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      }
    };
    window.addEventListener('pointerdown', unlock, { passive: true, once: false });
    window.addEventListener('keydown', unlock, { passive: true, once: false });
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

  // 1. Hover Sound (hover.mp3) - Plays on country borders, cards & buttons
  hover(volume = 0.45) {
    const now = Date.now();
    if (now - this.lastHoverTime < 55) return; // Prevent stutter on superfast sweep
    this.lastHoverTime = now;
    this.playSound('hover', '/hover.mp3', volume, 0.03);
  }

  // Alias for hover
  tick(volume = 0.45) {
    this.hover(volume);
  }

  // 2. Click Sound for selections, territory cards, controls (click.mp3)
  click(volume = 0.6) {
    const now = Date.now();
    if (now - this.lastClickTime < 40) return;
    this.lastClickTime = now;
    this.playSound('click', '/click.mp3', volume);
  }

  // Alias for click
  alert(volume = 0.6) {
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
        'button, a, [role="button"], input, select, label.switch-3d, .kpi-card, .country-pill-core, .top-rotation-toggle-btn, .inspector-close-btn, .inspector-reset-zoom-btn, .coord-item, [data-interactive="true"]'
      );
    };

    window.addEventListener(
      'pointerover',
      (e) => {
        const target = isInteractive(e.target);
        if (target && target !== lastHoverEl) {
          lastHoverEl = target;
          this.hover(0.38);
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
