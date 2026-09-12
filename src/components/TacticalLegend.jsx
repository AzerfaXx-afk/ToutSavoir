import React, { useEffect, useState } from 'react';
import { realtimeStream } from '../utils/realtimeEvents';

export function TacticalLegend() {
  const [stats, setStats] = useState({
    birthsToday: 0,
    deathsToday: 0,
  });

  useEffect(() => {
    const unsubscribe = realtimeStream.subscribe((data) => {
      if (data.stats) {
        setStats({
          birthsToday: data.stats.birthsToday,
          deathsToday: data.stats.deathsToday,
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="tactical-floating-legend" aria-label="Légende de la carte">
      <div className="legend-entry">
        <span className="legend-indicator dot-death" />
        <span className="legend-label">DÉCÈS</span>
      </div>

      <span className="legend-sep">/</span>

      <div className="legend-entry">
        <span className="legend-indicator dot-birth" />
        <span className="legend-label">NAISSANCES</span>
      </div>

      <span className="legend-sep">/</span>

      <div className="legend-entry stats-entry">
        <span className="legend-stats-tag">AUJOURD'HUI</span>
        <span className="legend-stats-bracket">[</span>
        <span className="legend-stats-val text-crimson">-{stats.deathsToday.toLocaleString('fr-FR')}</span>
        <span className="legend-stats-slash">|</span>
        <span className="legend-stats-val text-emerald">+{stats.birthsToday.toLocaleString('fr-FR')}</span>
        <span className="legend-stats-bracket">]</span>
      </div>
    </div>
  );
}

