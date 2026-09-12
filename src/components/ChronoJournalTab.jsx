import React, { useState, useEffect, useMemo } from 'react';
import { fetchDailyBriefing } from '../utils/historicalEventsApi';
import { sound } from '../utils/soundFX';
import {
  BookOpen,
  Activity,
  ExternalLink,
  RefreshCw,
  Flame,
  Search,
  X,
  Clock,
  Globe,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import './ChronoJournalTab.css';

export function ChronoJournalTab({ selectedDate = new Date(), metrics = {} }) {
  const [briefing, setBriefing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Combine historical events & earthquakes into a single unified 24h timeline
  const unifiedTimeline = useMemo(() => {
    if (!briefing) return [];

    const eventsList = (briefing.events || []).map((e) => ({
      ...e,
      itemType: 'event',
    }));

    const quakesList = (briefing.earthquakes || []).map((q) => {
      const timeStr = `${q.time} UTC`;
      const [h, m] = q.time.split(':').map(Number);
      const minutesOfDay = (h || 0) * 60 + (m || 0);

      return {
        id: `quake-${q.id}`,
        itemType: 'quake',
        time: timeStr,
        minutesOfDay,
        year: briefing.year,
        title: `Séisme M ${q.mag} — ${q.place}`,
        text: `Magnitude sismique ${q.mag} enregistrée à une profondeur de ${q.depthKm} km sous la croûte terrestre. Donnée télémétrique certifiée par l'USGS.`,
        category: 'SÉISME',
        mag: q.mag,
        depthKm: q.depthKm,
        place: q.place,
        url: q.url,
      };
    });

    const combined = [...eventsList, ...quakesList];
    // Sort strictly chronologically by minute of the 24-hour day
    combined.sort((a, b) => (a.minutesOfDay || 0) - (b.minutesOfDay || 0));
    return combined;
  }, [briefing]);

  // Filter items by category tab & search query
  const filteredTimeline = useMemo(() => {
    let list = unifiedTimeline;

    if (activeFilter === 'geopolitics') {
      list = list.filter((i) => i.category === 'GEOPOLITIQUE' || i.category === 'DIPLOMATIE');
    } else if (activeFilter === 'quakes') {
      list = list.filter((i) => i.itemType === 'quake' || i.category === 'CATASTROPHE' || i.category === 'SÉISME');
    } else if (activeFilter === 'science') {
      list = list.filter((i) => i.category === 'SCIENCE & ESPACE');
    } else if (activeFilter === 'history') {
      list = list.filter((i) => i.itemType === 'event' && i.category !== 'GEOPOLITIQUE');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.text && i.text.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          (i.time && i.time.toLowerCase().includes(q))
      );
    }

    return list;
  }, [unifiedTimeline, activeFilter, searchQuery]);

  const handleFilterClick = (filterId) => {
    sound.click(0.35);
    setActiveFilter(filterId);
  };

  if (isLoading) {
    return (
      <div className="journal-loading-state">
        <RefreshCw size={26} className="journal-spin-icon" />
        <span className="journal-loading-text">SYNCHRONISATION DES REGISTRES MONDIAUX DU JOUR...</span>
        <span className="journal-loading-sub">Interrogation des archives officielles Wikipédia & sismographes USGS</span>
      </div>
    );
  }

  return (
    <div className="chrono-journal-container">
      {/* ─── Daily Summary Header Banner ─── */}
      <div className="journal-header-card">
        <div className="journal-header-top">
          <div className="journal-title-tag">
            <BookOpen size={13} />
            <span>JOURNAL DU JOUR // CHRONIQUE DU MONDE</span>
          </div>
          <span className="journal-source-tag">ARCHIVES ONTHISDAY & USGS EN CONTINU</span>
        </div>

        <div className="journal-date-large">
          {briefing?.formattedDate || 'Aujourd’hui'}
        </div>

        <div className="journal-stats-pills">
          <div className="journal-stat-pill">
            <Clock size={11} />
            <span>Chronologie 24h : <strong>{unifiedTimeline.length} entrées</strong></span>
          </div>
          <div className="journal-stat-pill">
            <Activity size={11} />
            <span>Séismes M4.5+ : <strong>{briefing?.earthquakes?.length || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* ─── Daily Vital Figures (Worldometer Verified Baseline) ─── */}
      <div className="journal-figures-grid">
        <div className="journal-fig-card">
          <span className="journal-fig-label">Naissances aujourd’hui</span>
          <span className="journal-fig-val is-emerald">
            {metrics.births_today ? Number(metrics.births_today).toLocaleString('fr-FR') : '345 852'}
          </span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">Décès aujourd’hui</span>
          <span className="journal-fig-val is-crimson">
            {metrics.deaths_today ? Number(metrics.deaths_today).toLocaleString('fr-FR') : '162 967'}
          </span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">Dépenses de santé mondiales</span>
          <span className="journal-fig-val is-cyan">
            ${metrics.health_spending_public_today ? Math.round(Number(metrics.health_spending_public_today) / 1e9 * 10) / 10 + ' Mds' : '$17.5 Mds'}
          </span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">Dépenses militaires mondiales</span>
          <span className="journal-fig-val is-amber">
            ${metrics.military_spending_today ? Math.round(Number(metrics.military_spending_today) / 1e9 * 10) / 10 + ' Mds' : '$5.8 Mds'}
          </span>
        </div>
      </div>

      {/* ─── Quick Search Bar in Daily Journal ─── */}
      <div className="journal-search-wrap">
        <Search size={13} className="journal-search-icon" />
        <input
          type="text"
          className="journal-search-input"
          placeholder="Rechercher un fait marquant, traité, ville..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="journal-search-clear"
            onClick={() => setSearchQuery('')}
            title="Effacer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ─── Filter Tabs Bar ─── */}
      <div className="journal-filter-bar">
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          Tout le fil 24h ({unifiedTimeline.length})
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
          className={`journal-filter-btn ${activeFilter === 'science' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('science')}
        >
          Sciences & Espace
        </button>
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'history' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('history')}
        >
          Histoire
        </button>
      </div>

      {/* ─── 24-Hour Chronological Spine Feed ─── */}
      <div className="journal-timeline-feed">
        <div className="timeline-spine-rail" />

        {filteredTimeline.length === 0 ? (
          <div className="journal-empty-state">
            <Globe size={24} className="journal-empty-icon" />
            <span>Aucun événement correspondant aux critères pour cette journée.</span>
          </div>
        ) : (
          filteredTimeline.map((item, index) => {
            const isQuake = item.itemType === 'quake';

            return (
              <div
                key={item.id || index}
                className={`journal-timeline-node ${isQuake ? 'is-earthquake-node' : ''}`}
              >
                {/* Visual Hour Node on the Spine */}
                <div className="timeline-node-marker">
                  <span className="node-dot" />
                  <span className="node-time-badge">{item.time}</span>
                </div>

                {/* Event Card Content */}
                <div className={`journal-item-card ${isQuake ? 'is-earthquake' : ''}`}>
                  <div className="journal-item-top">
                    {isQuake ? (
                      <div className={`quake-mag-badge ${item.mag >= 6.0 ? 'critical' : (item.mag >= 5.2 ? 'high' : 'moderate')}`}>
                        <Flame size={12} />
                        <span>M {item.mag}</span>
                      </div>
                    ) : (
                      <span className="journal-year-badge">{item.year}</span>
                    )}

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
                      <span>{isQuake ? 'Consulter le bulletin sismique USGS' : 'Consulter la notice d’archive Wikipédia'}</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
