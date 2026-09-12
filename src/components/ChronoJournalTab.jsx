import React, { useState, useEffect, useMemo } from 'react';
import { fetchDailyBriefing } from '../utils/historicalEventsApi';
import { sound } from '../utils/soundFX';
import {
  BookOpen,
  Activity,
  ExternalLink,
  RefreshCw,
  Flame,
  AlertTriangle,
  History,
  TrendingUp,
} from 'lucide-react';
import './ChronoJournalTab.css';

export function ChronoJournalTab({ selectedDate = new Date(), metrics = {} }) {
  const [briefing, setBriefing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    fetchDailyBriefing(selectedDate)
      .then((data) => {
        if (!isCancelled) {
          setBriefing(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedDate]);

  const filteredItems = useMemo(() => {
    if (!briefing) return [];
    if (activeFilter === 'events') return briefing.events;
    if (activeFilter === 'quakes') return briefing.earthquakes;
    if (activeFilter === 'geopolitics') {
      return briefing.events.filter((e) => e.category === 'GEOPOLITIQUE' || e.category === 'DIPLOMATIE');
    }
    return briefing.events;
  }, [briefing, activeFilter]);

  const handleFilterClick = (filterId) => {
    sound.click(0.35);
    setActiveFilter(filterId);
  };

  if (isLoading) {
    return (
      <div className="journal-loading-state">
        <RefreshCw size={24} className="journal-spin-icon" />
        <span className="journal-loading-text">INTERROGATION DES REGISTRES MONDIAUX...</span>
      </div>
    );
  }

  return (
    <div className="chrono-journal-container">
      {/* Header Banner */}
      <div className="journal-header-card">
        <div className="journal-header-top">
          <div className="journal-title-tag">
            <BookOpen size={13} />
            <span>JOURNAL DU MONDE // BRIEFING QUOTIDIEN</span>
          </div>
          <span className="journal-source-tag">ARCHIVES ONTHISDAY & USGS</span>
        </div>

        <div className="journal-date-large">
          {briefing?.formattedDate || 'Aujourd’hui'}
        </div>

        <div className="journal-stats-pills">
          <div className="journal-stat-pill">
            <History size={11} />
            <span>Événements recensés : <strong>{briefing?.events?.length || 0}</strong></span>
          </div>
          <div className="journal-stat-pill">
            <Activity size={11} />
            <span>Séismes mondiaux (M4.5+) : <strong>{briefing?.earthquakes?.length || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Daily Figures Snapshot Grid */}
      <div className="journal-figures-grid">
        <div className="journal-fig-card">
          <span className="journal-fig-label">Naissances aujourd’hui</span>
          <span className="journal-fig-val" style={{ color: '#00f5a0' }}>
            {metrics.births_today ? Number(metrics.births_today).toLocaleString('fr-FR') : '345 852'}
          </span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">Décès aujourd’hui</span>
          <span className="journal-fig-val" style={{ color: '#ef4444' }}>
            {metrics.deaths_today ? Number(metrics.deaths_today).toLocaleString('fr-FR') : '162 967'}
          </span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">Dépenses de santé mondiales</span>
          <span className="journal-fig-val" style={{ color: '#00f2fe' }}>
            ${metrics.health_spending_public_today ? Math.round(Number(metrics.health_spending_public_today) / 1e9 * 10) / 10 + ' Mds' : '$17.5 Mds'}
          </span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">Dépenses militaires mondiales</span>
          <span className="journal-fig-val" style={{ color: '#f59e0b' }}>
            ${metrics.military_spending_today ? Math.round(Number(metrics.military_spending_today) / 1e9 * 10) / 10 + ' Mds' : '$4.6 Mds'}
          </span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="journal-filter-bar">
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          Tous ({briefing?.events?.length || 0})
        </button>
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'geopolitics' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('geopolitics')}
        >
          Géopolitique & Traités
        </button>
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'quakes' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('quakes')}
        >
          Séismes ({briefing?.earthquakes?.length || 0})
        </button>
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'events' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('events')}
        >
          Histoire Générale
        </button>
      </div>

      {/* Feed list */}
      <div className="journal-feed">
        {activeFilter === 'quakes' ? (
          briefing?.earthquakes?.length > 0 ? (
            briefing.earthquakes.map((q) => (
              <div
                key={q.id}
                className={`journal-item-card is-earthquake ${q.mag >= 6.0 ? 'critical' : ''}`}
              >
                <div className="journal-item-top">
                  <div className={`quake-mag-badge ${q.mag >= 6.0 ? 'critical' : (q.mag >= 5.2 ? 'high' : 'moderate')}`}>
                    <Flame size={12} />
                    <span>M {q.mag}</span>
                  </div>
                  <span className="journal-cat-badge catastrophe">
                    SÉISME MAJEUR • {q.time}
                  </span>
                </div>

                <div className="journal-item-title">{q.place}</div>
                <div className="journal-item-text">
                  Profondeur épicentrique : {q.depthKm} km sous la croûte terrestre. Enregistré en direct par le réseau mondial de sismographes USGS.
                </div>

                {q.url && (
                  <a
                    href={q.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="journal-item-link"
                  >
                    <span>Bulletin technique officiel USGS</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="journal-item-card">
              <span className="journal-item-text">Aucun séisme majeur supérieur à M4.5 enregistré à cette date.</span>
            </div>
          )
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="journal-item-card">
              <div className="journal-item-top">
                <span className="journal-year-badge">{item.year}</span>
                <span className={`journal-cat-badge ${(item.category || '').toLowerCase().replace(/[^a-z]/g, '')}`}>
                  {item.category || 'HISTOIRE'}
                </span>
              </div>

              <div className="journal-item-title">{item.title}</div>

              <div className="journal-item-body">
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="journal-item-thumb"
                    loading="lazy"
                  />
                )}
                <div className="journal-item-text">
                  {item.text}
                </div>
              </div>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="journal-item-link"
                >
                  <span>Consulter la notice d’archive</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
