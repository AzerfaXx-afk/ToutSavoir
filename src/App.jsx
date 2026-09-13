import React, { useState, useEffect, useCallback } from 'react';
import { Switch3D } from './components/Switch3D';
import { TacticalMap2D } from './components/TacticalMap2D';
import { OrbitView3D } from './components/OrbitView3D';
import { LiveTelemetryDrawer } from './components/LiveTelemetryDrawer';
import { TimelineWheel } from './components/TimelineWheel';
import { GlobalSpotlightModal } from './components/GlobalSpotlightModal';
import { CCTVLiveMonitor } from './components/CCTVLiveMonitor';
import { TacticalShortcutsModal } from './components/TacticalShortcutsModal';
import { MapLayerToggles } from './components/MapLayerToggles';
import { flightRadarService } from './services/flightRadarService';
import { marineTrafficService } from './services/marineTrafficService';
import { Play, Pause, VolumeX, Maximize2, Minimize2, HelpCircle } from 'lucide-react';
import { sound } from './utils/soundFX';
import './App.css';

export default function App() {
  const [is3D, setIs3D] = useState(false);
  const [activeLayer] = useState('satellite');
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Curated default entry: Aviation, Maritime, and Conflicts active for immediate authentic live tracking
  const [activeLayers, setActiveLayers] = useState(
    () => new Set(['aviation', 'maritime', 'conflicts'])
  );

  // Flight traffic density limit (default: 2500 for authentic dense Flightradar24 experience at 60 FPS)
  const [flightLimit, setFlightLimit] = useState(2500);

  const handleFlightLimitChange = useCallback((limit) => {
    setFlightLimit(limit);
    flightRadarService.setFlightLimit(limit);
  }, []);

  // Maritime traffic density limit (default: 5000 for authentic dense MarineTraffic experience at 60 FPS)
  const [vesselLimit, setVesselLimit] = useState(5000);

  const handleVesselLimitChange = useCallback((limit) => {
    setVesselLimit(limit);
    marineTrafficService.setVesselLimit(limit);
  }, []);

  const handleToggleLayer = useCallback((layerId) => {
    sound.click(0.35);
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const handleToggleAllLayers = useCallback((enableAll) => {
    sound.click(0.45);
    if (enableAll) {
      setActiveLayers(
        new Set(['aviation', 'maritime', 'cctv', 'satellites', 'cables', 'conflicts', 'telluric', 'cyber', 'weather', 'nuclear'])
      );
    } else {
      setActiveLayers(new Set());
    }
  }, []);

  // Global search spotlight modal state
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  // Keyboard shortcuts modal state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(() => sound.isMuted());

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live CCTV PiP stream monitor state
  const [activeCCTV, setActiveCCTV] = useState(null);

  // Selected Country for deep-dive dossier
  const [selectedCountry, setSelectedCountry] = useState('FR');

  // Unified Drawer active tab & state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('worldometer');

  // Target Location for smooth cinematic flyTo / rotate
  const [targetLocation, setTargetLocation] = useState(null);

  // Inspected Target for TacticalInspectionCard HUD
  const [inspectedTarget, setInspectedTarget] = useState(null);

  // Sound Mute Toggle Handler
  const handleToggleMute = useCallback(() => {
    const next = sound.toggleMute();
    setIsMuted(next);
    if (!next) {
      sound.click();
      if (is3D) sound.startSpaceMusic();
    }
  }, [is3D]);

  // Fullscreen Toggle Handler
  const handleToggleFullscreen = useCallback(() => {
    sound.click();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Sync fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Space background music (space.mp3) lifecycle - strictly active in 3D
  useEffect(() => {
    if (is3D && !isMuted) {
      sound.startSpaceMusic();
    } else {
      sound.stopSpaceMusic();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sound.stopSpaceMusic();
      } else if (is3D && !sound.isMuted()) {
        sound.startSpaceMusic();
      }
    };

    const handleBeforeUnload = () => {
      sound.stopSpaceMusic();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      sound.stopSpaceMusic();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [is3D, isMuted]);

  // Universal keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Universal Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sound.click();
        setIsSpotlightOpen((prev) => !prev);
        return;
      }

      // If user is typing inside an input field, textarea, or contentEditable, don't intercept keys
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;
      if (isInput) return;

      // 2. Escape: close modals / PiP / drawer hierarchically
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isSpotlightOpen) {
          setIsSpotlightOpen(false);
        } else if (activeCCTV) {
          setActiveCCTV(null);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
        return;
      }

      // 3. 'T' toggles drawer
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        sound.click();
        setIsDrawerOpen((prev) => !prev);
        return;
      }

      // 4. 'M' toggles sound
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      // 5. 'F' toggles fullscreen
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
        return;
      }

      // 6. '?' toggles tactical shortcuts helper modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        sound.click();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isSpotlightOpen, activeCCTV, isDrawerOpen, handleToggleMute, handleToggleFullscreen]);

  // Country selection handler (from map, search or drawer)
  const handleSelectCountry = useCallback((countryCode) => {
    setSelectedCountry(countryCode);
    setDrawerTab('country');
    setIsDrawerOpen(true);
  }, []);

  // Worldometer metric select from search
  const handleSelectMetric = useCallback(() => {
    setDrawerTab('worldometer');
    setIsDrawerOpen(true);
  }, []);

  // Satellite select handler
  const handleSelectSatellite = useCallback((sat) => {
    setDrawerTab('satellites');
    setIsDrawerOpen(true);
    setTargetLocation({ lat: (sat.inclination || 45) * 0.6, lng: 15, zoom: 4 });
  }, []);

  // CCTV select handler
  const handleSelectCCTV = useCallback((cam) => {
    setActiveCCTV(cam);
    setTargetLocation({ lat: cam.lat, lng: cam.lng, zoom: 6 });
  }, []);

  // Generic coordinate target handler
  const handleSelectLocation = useCallback((lat, lng, zoom = 5) => {
    setTargetLocation({ lat, lng, zoom });
  }, []);

  return (
    <div className="aegis-app-root">
      {/* Centered Top: Pure 2D/3D Switcher with Pause/Play directly below */}
      <div className="top-center-dock">
        <Switch3D
          is3D={is3D}
          onToggle={setIs3D}
        />

        {/* In 3D: Minimalist Awwwards rotation play/pause toggle directly below */}
        {is3D && (
          <button
            type="button"
            className="top-rotation-icon-btn"
            onMouseEnter={() => sound.hover()}
            onClick={() => {
              sound.click();
              setAutoRotate((prev) => !prev);
            }}
            title={autoRotate ? 'Pause rotation (Espace)' : 'Reprendre rotation (Espace)'}
            aria-label={autoRotate ? 'Pause rotation' : 'Reprendre rotation'}
          >
            {autoRotate ? <Pause size={14} strokeWidth={1.8} /> : <Play size={14} strokeWidth={1.8} />}
          </button>
        )}
      </div>

      {/* Top-Right: Shortcuts Help Button */}
      <div className="top-right-dock">
        <button
          type="button"
          className="tactical-dock-btn"
          onMouseEnter={() => sound.hover()}
          onClick={() => {
            sound.click();
            setIsShortcutsOpen(true);
          }}
          title="Commandes et raccourcis (?)"
          aria-label="Aide raccourcis"
        >
          <HelpCircle size={15} strokeWidth={1.8} />
        </button>
      </div>

      {/* Bottom-Right: Sound Equalizer & Fullscreen Controls */}
      <div className="bottom-right-dock">
        {/* Sound / Equalizer Toggle Button (M) */}
        <button
          type="button"
          className={`tactical-dock-btn ${isMuted ? 'is-muted' : 'is-active'}`}
          onMouseEnter={() => sound.hover()}
          onClick={handleToggleMute}
          title={isMuted ? 'Activer le son (M)' : 'Couper le son (M)'}
          aria-label="Contrôle audio"
        >
          {isMuted ? (
            <VolumeX size={15} strokeWidth={1.8} />
          ) : (
            <div className="top-audio-equalizer">
              <span className="audio-bar bar-1" />
              <span className="audio-bar bar-2" />
              <span className="audio-bar bar-3" />
              <span className="audio-bar bar-4" />
            </div>
          )}
        </button>

        {/* Fullscreen Toggle Button (F) */}
        <button
          type="button"
          className="tactical-dock-btn"
          onMouseEnter={() => sound.hover()}
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Quitter plein écran (F)' : 'Mode plein écran immersif (F)'}
          aria-label="Plein écran"
        >
          {isFullscreen ? <Minimize2 size={15} strokeWidth={1.8} /> : <Maximize2 size={15} strokeWidth={1.8} />}
        </button>
      </div>

      {/* Left-Side Interactive Notched Wheel (Jog Dial 1950 - 2100) */}
      <TimelineWheel
        currentYear={selectedYear}
        onYearChange={setSelectedYear}
      />

      {/* Bottom-Left: Cybernetic Map Layer Toggles HUD */}
      <MapLayerToggles
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
        onToggleAll={handleToggleAllLayers}
        is3D={is3D}
        onSwitchTo3D={() => setIs3D(true)}
        flightLimit={flightLimit}
        onFlightLimitChange={handleFlightLimitChange}
        vesselLimit={vesselLimit}
        onVesselLimitChange={handleVesselLimitChange}
      />

      {/* Main Map Viewport (Takes 100% Fullscreen) */}
      <main className="aegis-main-stage">
        {!is3D ? (
          <TacticalMap2D
            activeLayer={activeLayer}
            activeLayers={activeLayers}
            flightLimit={flightLimit}
            vesselLimit={vesselLimit}
            onSelectCCTV={handleSelectCCTV}
            onSelectSatellite={handleSelectSatellite}
            onSelectCountry={handleSelectCountry}
            targetLocation={targetLocation}
            isDrawerOpen={isDrawerOpen}
            inspectedTarget={inspectedTarget}
            onInspectTarget={setInspectedTarget}
          />
        ) : (
          <OrbitView3D
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            activeLayers={activeLayers}
            flightLimit={flightLimit}
            vesselLimit={vesselLimit}
            onSelectCCTV={handleSelectCCTV}
            onSelectSatellite={handleSelectSatellite}
            onSelectCountry={handleSelectCountry}
            targetLocation={targetLocation}
            isDrawerOpen={isDrawerOpen}
            inspectedTarget={inspectedTarget}
            onInspectTarget={setInspectedTarget}
          />
        )}
      </main>

      {/* Responsive Right-Side Unified Intelligence Drawer */}
      <LiveTelemetryDrawer
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        isOpen={isDrawerOpen}
        onToggleOpen={setIsDrawerOpen}
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
        onSelectCCTV={handleSelectCCTV}
        onSelectSatellite={handleSelectSatellite}
        onSelectLocation={handleSelectLocation}
        onInspectTarget={setInspectedTarget}
        selectedCountry={selectedCountry}
      />

      {/* Global Spotlight / Command Palette Modal */}
      <GlobalSpotlightModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onSelectCountry={handleSelectCountry}
        onSelectMetric={handleSelectMetric}
        onSelectSatellite={handleSelectSatellite}
        onSelectCCTV={handleSelectCCTV}
        onSelectLocation={handleSelectLocation}
      />

      {/* Live CCTV Video Monitor (Picture-in-Picture) */}
      <CCTVLiveMonitor
        camera={activeCCTV}
        onClose={() => setActiveCCTV(null)}
        onSelectCamera={setActiveCCTV}
        onSelectLocation={handleSelectLocation}
      />

      {/* Tactical Keyboard Shortcuts Help Modal */}
      <TacticalShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

