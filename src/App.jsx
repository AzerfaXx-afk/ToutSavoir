import React, { useState, useEffect, useCallback } from 'react';
import { Switch3D } from './components/Switch3D';
import { TacticalMap2D } from './components/TacticalMap2D';
import { OrbitView3D } from './components/OrbitView3D';
import { TacticalLegend } from './components/TacticalLegend';
import { LiveTelemetryDrawer } from './components/LiveTelemetryDrawer';
import { TimelineWheel } from './components/TimelineWheel';
import { LayerPillsBar } from './components/LayerPillsBar';
import { GlobalSpotlightModal } from './components/GlobalSpotlightModal';
import { CCTVLiveMonitor } from './components/CCTVLiveMonitor';
import { Play, Pause, Search } from 'lucide-react';
import { sound } from './utils/soundFX';
import './App.css';

export default function App() {
  const [is3D, setIs3D] = useState(false);
  const [activeLayer] = useState('satellite');
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Multi-toggle active layers set
  const [activeLayers, setActiveLayers] = useState(
    () => new Set(['aviation', 'satellites', 'cctv', 'conflicts'])
  );

  // Global search spotlight modal state
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  // Live CCTV PiP stream monitor state
  const [activeCCTV, setActiveCCTV] = useState(null);

  // Selected Country for deep-dive dossier
  const [selectedCountry, setSelectedCountry] = useState('FR');

  // Unified Drawer active tab & state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('worldometer');

  // Target Location for smooth cinematic flyTo / rotate
  const [targetLocation, setTargetLocation] = useState(null);

  // Space background music (space.mp3) lifecycle - strictly active in 3D
  useEffect(() => {
    if (is3D) {
      sound.startSpaceMusic();
    } else {
      sound.stopSpaceMusic();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sound.stopSpaceMusic();
      } else if (is3D) {
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
  }, [is3D]);

  // Universal Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sound.click();
        setIsSpotlightOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Layer toggle handler
  const handleToggleLayer = useCallback((layerId) => {
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
      {/* Centered Top Controls: 2D/3D Switch, Spotlight Button, Rotation Toggle & Layer Pills Deck */}
      <div className="top-center-dock">
        <div className="top-mode-row">
          <Switch3D
            is3D={is3D}
            onToggle={setIs3D}
          />

          {/* Search Trigger Button (Cmd+K) */}
          <button
            type="button"
            className="top-spotlight-btn"
            onClick={() => {
              sound.click();
              setIsSpotlightOpen(true);
            }}
            title="Recherche universelle (Cmd + K)"
          >
            <Search size={13} />
            <span>RECHERCHER</span>
            <span className="top-spotlight-kbd">⌘K</span>
          </button>

          {/* In 3D: Minimalist Awwwards rotation play/pause toggle */}
          {is3D && (
            <button
              type="button"
              className="top-rotation-icon-btn"
              onMouseEnter={() => sound.hover()}
              onClick={() => {
                sound.click();
                setAutoRotate((prev) => !prev);
              }}
              title={autoRotate ? 'Pause (Espace)' : 'Lecture (Espace)'}
              aria-label={autoRotate ? 'Pause rotation' : 'Reprendre rotation'}
            >
              {autoRotate ? <Pause size={15} strokeWidth={1.8} /> : <Play size={15} strokeWidth={1.8} />}
            </button>
          )}
        </div>

        {/* Tactical Multi-Toggle Layer Pills Bar */}
        <LayerPillsBar
          activeLayers={activeLayers}
          onToggleLayer={handleToggleLayer}
          onSetAllLayers={setActiveLayers}
        />
      </div>

      {/* Left-Side Interactive Notched Wheel (Jog Dial 1950 - 2100) */}
      <TimelineWheel
        currentYear={selectedYear}
        onYearChange={setSelectedYear}
      />

      {/* Main Map Viewport (Takes 100% Fullscreen) */}
      <main className="aegis-main-stage">
        {!is3D ? (
          <TacticalMap2D
            activeLayer={activeLayer}
            activeLayers={activeLayers}
            onSelectCCTV={handleSelectCCTV}
            onSelectSatellite={handleSelectSatellite}
            onSelectCountry={handleSelectCountry}
            targetLocation={targetLocation}
          />
        ) : (
          <OrbitView3D
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            activeLayers={activeLayers}
            onSelectCCTV={handleSelectCCTV}
            onSelectSatellite={handleSelectSatellite}
            onSelectCountry={handleSelectCountry}
            targetLocation={targetLocation}
          />
        )}
      </main>

      {/* Pure Typography Bottom-Left Legend (Awwwards - Zero background) */}
      <TacticalLegend />

      {/* Responsive Right-Side Unified Intelligence Drawer */}
      <LiveTelemetryDrawer
        selectedYear={selectedYear}
        isOpen={isDrawerOpen}
        onToggleOpen={setIsDrawerOpen}
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
        onSelectCCTV={handleSelectCCTV}
        onSelectSatellite={handleSelectSatellite}
        onSelectLocation={handleSelectLocation}
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
      />
    </div>
  );
}
