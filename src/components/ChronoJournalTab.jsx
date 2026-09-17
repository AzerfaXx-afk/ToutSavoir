import React, { useState, useEffect, useMemo } from 'react';
import { fetchWorldDailyIntel, formatRelativeTime } from '../utils/worldEventsLiveApi';
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
  Radio,
  Compass,
  Crosshair,
  MapPin,
  ArrowDownUp,
  Zap,
  History,
  TrendingUp,
  Users,
  ShieldAlert,
  HeartPulse,
} from 'lucide-react';
import './ChronoJournalTab.css';

export function ChronoJournalTab({
  selectedDate = new Date(),
  metrics = {},
  onSelectLocation,
}) {
  const [intelData, setIntelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll24h, setShowAll24h] = useState(false);
  // 'recent' : les plus récents en premier (décroissant) | 'beginning_of_day' : depuis le début de la journée (croissant de 00:00 à maintenant)
  const [sortOrder, setSortOrder] = useState('recent');
  const [targetedId, setTargetedId] = useState(null);

  // Charger les données mondiales en temps réel
  const loadDailyIntel = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await fetchWorldDailyIntel(selectedDate, { showAll24h });
      setIntelData(data);
    } catch (err) {
      console.error('[ChronoJournal] Erreur chargement direct:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDailyIntel();
  }, [selectedDate, showAll24h]);

  // Liste active selon le filtre horaire (cycle 24h ou jusqu'à maintenant)
  const activeTimeline = useMemo(() => {
    if (!intelData) return [];
    return showAll24h ? (intelData.allItems24h || []) : (intelData.filteredItems || []);
  }, [intelData, showAll24h]);

  // Compteurs par catégorie
  const categoryCounts = useMemo(() => {
    const list = activeTimeline;
    return {
      all: list.length,
      geopolitics: list.filter((i) => i.category === 'GÉOPOLITIQUE').length,
      quakes: list.filter((i) => i.category === 'SÉISME' || i.category === 'CLIMAT & NATURE').length,
      diplomacy: list.filter((i) => i.category === 'DIPLOMATIE').length,
      science: list.filter((i) => i.category === 'SCIENCE & ESPACE' || i.category === 'SOCIÉTÉ & MONDE').length,
    };
  }, [activeTimeline]);

  // Filtrage thématique & recherche textuelle
  const filteredTimeline = useMemo(() => {
    let list = activeTimeline;

    if (activeFilter === 'geopolitics') {
      list = list.filter((i) => i.category === 'GÉOPOLITIQUE');
    } else if (activeFilter === 'quakes') {
      list = list.filter((i) => i.category === 'SÉISME' || i.category === 'CLIMAT & NATURE');
    } else if (activeFilter === 'diplomacy') {
      list = list.filter((i) => i.category === 'DIPLOMATIE');
    } else if (activeFilter === 'science') {
      list = list.filter((i) => i.category === 'SCIENCE & ESPACE' || i.category === 'SOCIÉTÉ & MONDE');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.text && i.text.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          (i.source && i.source.toLowerCase().includes(q)) ||
          (i.placeName && i.placeName.toLowerCase().includes(q)) ||
          (i.time && i.time.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeTimeline, activeFilter, searchQuery]);

  // Tri selon l'ordre choisi : SOIT les plus récents en premier (décroissant), SOIT depuis le début du jour (croissant 00:00 -> maintenant)
  const sortedTimeline = useMemo(() => {
    const list = [...filteredTimeline];
    if (sortOrder === 'recent') {
      // Décroissant : plus récents en premier
      list.sort((a, b) => {
        const tA = a.timestamp || (a.minutesOfDay !== undefined ? a.minutesOfDay * 60000 : 0);
        const tB = b.timestamp || (b.minutesOfDay !== undefined ? b.minutesOfDay * 60000 : 0);
        return tB - tA;
      });
    } else {
      // Croissant : depuis le début de la journée (00:00 du matin)
      list.sort((a, b) => {
        const tA = a.timestamp || (a.minutesOfDay !== undefined ? a.minutesOfDay * 60000 : 0);
        const tB = b.timestamp || (b.minutesOfDay !== undefined ? b.minutesOfDay * 60000 : 0);
        return tA - tB;
      });
    }
    return list;
  }, [filteredTimeline, sortOrder]);

  const handleFilterClick = (filterId) => {
    sound.click(0.35);
    setActiveFilter(filterId);
  };

  const handleToggleRange = () => {
    sound.tick();
    setShowAll24h((prev) => !prev);
  };

  const handleToggleSortOrder = (newOrder) => {
    if (newOrder === sortOrder) return;
    sound.tick();
    setSortOrder(newOrder);
  };

  // Centrage immédiat sur la carte lors d'un clic sur l'événement
  const handleLocateItem = (item, e) => {
    if (e) e.stopPropagation();
    sound.click(0.45);
    setTargetedId(item.id);

    if (onSelectLocation && item.lat !== undefined && item.lng !== undefined) {
      onSelectLocation(item.lat, item.lng, item.zoom || 6);
    }
  };

  if (isLoading && !intelData) {
    return (
      <div className="journal-loading-state">
        <RefreshCw size={26} className="journal-spin-icon" />
        <span className="journal-loading-text">ACQUISITION DES FLUX MONDIAUX EN DIRECT...</span>
        <span className="journal-loading-sub">
          Agrégation France 24, RFI, Nations Unies, Euronews, sismographes USGS & NASA EONET
        </span>
      </div>
    );
  }

  return (
    <div className="chrono-journal-container">
      {/* ─── Entête Journal du Jour ─── */}
      <div className="journal-header-card">
        <div className="journal-header-top">
          <div className="journal-title-tag">
            <Radio size={13} className="journal-pulse-icon" />
            <span>JOURNAL DU JOUR // DIRECT MONDIAL</span>
          </div>
          <button
            type="button"
            className="journal-refresh-btn"
            onClick={() => {
              sound.tick();
              loadDailyIntel(true);
            }}
            title="Actualiser les dépêches mondiales et séismes"
          >
            <RefreshCw size={11} className={isRefreshing ? 'journal-spin-icon' : ''} />
            <span>ACTUALISER</span>
          </button>
        </div>

        <div className="journal-date-large">
          {intelData?.formattedDate || 'Aujourd’hui'}
        </div>

        {/* Sélecteur de fenêtre horaire (Direct jusqu'à présent vs 24h complètes) */}
        <div className="journal-time-window-row">
          <div className="time-window-badge">
            <Clock size={11} />
            <span>
              {showAll24h
                ? 'Cycle complet 24 heures (00:00 - 23:59)'
                : `Flux direct : depuis 00:00 jusqu’à ${intelData?.currentTimeStr || 'l’heure actuelle'}`}
            </span>
          </div>

          <button
            type="button"
            className="time-window-toggle"
            onClick={handleToggleRange}
            title={showAll24h ? "Filtrer jusqu'à maintenant" : "Afficher l'ensemble de la journée"}
          >
            {showAll24h ? 'Filtrer jusqu’à maintenant' : 'Voir tout le fil (24h)'}
          </button>
        </div>

        <div className="journal-stats-pills">
          <div className="journal-stat-pill">
            <Clock size={11} />
            <span>
              Événements recensés : <strong>{activeTimeline.length}</strong>
            </span>
          </div>
          <div className="journal-stat-pill">
            <Activity size={11} />
            <span>
              Séismes USGS : <strong>{intelData?.earthquakes?.length || 0}</strong>
            </span>
          </div>
          <div className="journal-stat-pill is-source-summary">
            <Globe size={11} />
            <span>France 24, RFI, ONU, Euronews, USGS, NASA</span>
          </div>
        </div>
      </div>

      {/* ─── Sélecteur d'Ordre Chronologique : Plus Récent vs Depuis le Début de Journée ─── */}
      <div className="journal-order-selector-card">
        <div className="order-selector-header">
          <div className="order-selector-title">
            <ArrowDownUp size={12} className="order-title-icon" />
            <span>ORDRE D'AFFICHAGE DU FIL :</span>
          </div>
          <span className="order-selector-status">
            {sortOrder === 'recent' ? 'DERNIÈRES MINUTES EN PREMIER' : 'CHRONOLOGIE DEPUIS 00:00'}
          </span>
        </div>

        <div className="order-pills-row">
          <button
            type="button"
            className={`order-pill-btn ${sortOrder === 'recent' ? 'is-active is-recent' : ''}`}
            onClick={() => handleToggleSortOrder('recent')}
            title="Afficher les événements les plus récents en premier (en direct au sommet du fil)"
          >
            <Zap size={12} className="order-pill-icon" />
            <div className="order-pill-content">
              <span className="order-pill-main">LE PLUS RÉCENT</span>
              <span className="order-pill-hint">Dernières dépêches en haut</span>
            </div>
            {sortOrder === 'recent' && <span className="order-live-dot" />}
          </button>

          <button
            type="button"
            className={`order-pill-btn ${sortOrder === 'beginning_of_day' ? 'is-active is-chronological' : ''}`}
            onClick={() => handleToggleSortOrder('beginning_of_day')}
            title="Afficher la chronologie depuis le début de journée (00:00 du matin vers maintenant)"
          >
            <History size={12} className="order-pill-icon" />
            <div className="order-pill-content">
              <span className="order-pill-main">DEPUIS LE DÉBUT DU JOUR</span>
              <span className="order-pill-hint">00:00 &rarr; maintenant (chronologique)</span>
            </div>
            {sortOrder === 'beginning_of_day' && <span className="order-live-dot" />}
          </button>
        </div>
      </div>

      {/* ─── Indicateurs Vitaux du Monde (Worldometer Calibré) ─── */}
      <div className="journal-figures-grid">
        <div className="journal-fig-card is-pop-card">
          <span className="journal-fig-label">
            <Users size={10} /> Population mondiale
          </span>
          <span className="journal-fig-val is-cyan">
            {metrics.world_pop ? Number(metrics.world_pop).toLocaleString('fr-FR') : '8 316 502 341'}
          </span>
          <span className="journal-fig-sub">+2.2 hab/s</span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">Naissances aujourd’hui</span>
          <span className="journal-fig-val is-emerald">
            {metrics.births_today ? Number(metrics.births_today).toLocaleString('fr-FR') : '239 026'}
          </span>
          <span className="journal-fig-sub is-emerald">+4.2 / sec</span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">Décès aujourd’hui</span>
          <span className="journal-fig-val is-crimson">
            {metrics.deaths_today ? Number(metrics.deaths_today).toLocaleString('fr-FR') : '112 630'}
          </span>
          <span className="journal-fig-sub is-crimson">+2.0 / sec</span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">
            <TrendingUp size={10} /> Croissance nette auj.
          </span>
          <span className="journal-fig-val is-cyan">
            {metrics.net_growth_today ? Number(metrics.net_growth_today).toLocaleString('fr-FR') : '+126 396'}
          </span>
          <span className="journal-fig-sub">Solde net</span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">
            <HeartPulse size={10} /> Dépenses santé publiques
          </span>
          <span className="journal-fig-val is-cyan">
            ${metrics.health_spending_public_today ? (Number(metrics.health_spending_public_today) / 1e9).toFixed(2) + ' Mds' : '$12.09 Mds'}
          </span>
          <span className="journal-fig-sub">Aujourd'hui (OMS)</span>
        </div>
        <div className="journal-fig-card">
          <span className="journal-fig-label">
            <ShieldAlert size={10} /> Dépenses militaires
          </span>
          <span className="journal-fig-val is-amber">
            ${metrics.military_spending_today ? (Number(metrics.military_spending_today) / 1e9).toFixed(2) + ' Mds' : '$3.17 Mds'}
          </span>
          <span className="journal-fig-sub">Aujourd'hui (SIPRI)</span>
        </div>
      </div>

      {/* ─── Barre de Recherche Rapide ─── */}
      <div className="journal-search-wrap">
        <Search size={13} className="journal-search-icon" />
        <input
          type="text"
          className="journal-search-input"
          placeholder="Rechercher une dépêche, séisme, pays, ville..."
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

      {/* ─── Onglets de Filtrage Thématique ─── */}
      <div className="journal-filter-bar">
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          Tout le direct ({categoryCounts.all})
        </button>
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'geopolitics' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('geopolitics')}
        >
          Géopolitique ({categoryCounts.geopolitics})
        </button>
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'quakes' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('quakes')}
        >
          Séismes & Nature ({categoryCounts.quakes})
        </button>
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'diplomacy' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('diplomacy')}
        >
          Diplomatie & ONU ({categoryCounts.diplomacy})
        </button>
        <button
          type="button"
          className={`journal-filter-btn ${activeFilter === 'science' ? 'is-active' : ''}`}
          onClick={() => handleFilterClick('science')}
        >
          Sciences & Société ({categoryCounts.science})
        </button>
      </div>

      {/* ─── Fil Chronologique Connecté à la Carte ─── */}
      <div className="journal-timeline-feed">
        <div className="timeline-spine-rail" />

        {sortedTimeline.length === 0 ? (
          <div className="journal-empty-state">
            <Globe size={24} className="journal-empty-icon" />
            <span>Aucune dépêche ou événement dans cette tranche horaire.</span>
            {!showAll24h && (
              <button
                type="button"
                className="journal-empty-btn"
                onClick={() => setShowAll24h(true)}
              >
                Afficher l'ensemble des 24 heures
              </button>
            )}
          </div>
        ) : (
          sortedTimeline.map((item, index) => {
            const isQuake = item.category === 'SÉISME';
            const isTargeted = targetedId === item.id;
            const relTime = formatRelativeTime(item.timestamp);

            return (
              <div
                key={item.id || index}
                className={`journal-timeline-node ${isQuake ? 'is-earthquake-node' : ''}`}
              >
                {/* Repère temporel sur l'axe vertical */}
                <div className="timeline-node-marker">
                  <span className="node-dot" />
                  <div className="node-time-container">
                    <span className="node-time-badge">{item.time}</span>
                    {relTime && <span className="node-relative-pill">{relTime}</span>}
                  </div>
                </div>

                {/* Carte de l'événement cliquable pour centrer sur la carte */}
                <div
                  className={`journal-item-card ${isQuake ? 'is-earthquake' : ''} ${
                    isTargeted ? 'is-targeted' : ''
                  }`}
                  onClick={() => handleLocateItem(item)}
                  title="Cliquer pour afficher et centrer sur la carte"
                >
                  <div className="journal-item-top">
                    <div className="journal-source-badge-wrap">
                      <span
                        className="journal-source-pill"
                        style={{
                          borderColor: item.sourceColor ? `${item.sourceColor}44` : 'rgba(0, 242, 254, 0.3)',
                          color: item.sourceColor || '#00f2fe',
                        }}
                      >
                        <span
                          className="source-pulse-dot"
                          style={{ background: item.sourceColor || '#00f2fe' }}
                        />
                        {item.source}
                      </span>
                      {item.sourceType && (
                        <span className="journal-source-type">{item.sourceType}</span>
                      )}
                    </div>

                    <div className="journal-right-badges">
                      {isQuake && item.mag && (
                        <div
                          className={`quake-mag-badge ${
                            item.mag >= 6.0 ? 'critical' : item.mag >= 5.0 ? 'high' : 'moderate'
                          }`}
                        >
                          <Flame size={11} />
                          <span>M {item.mag}</span>
                        </div>
                      )}
                      <span
                        className={`journal-cat-badge ${(item.category || '')
                          .toLowerCase()
                          .replace(/[^a-z]/g, '')}`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="journal-item-title">{item.title}</div>

                  <div className="journal-item-body">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="journal-item-thumb"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="journal-item-text">{item.text}</div>
                  </div>

                  {/* Barre d'action : Localisation sur la carte & Source externe */}
                  <div className="journal-item-actions-row">
                    <button
                      type="button"
                      className={`journal-locate-btn ${isTargeted ? 'is-active-target' : ''}`}
                      onClick={(e) => handleLocateItem(item, e)}
                      title="Centrer la carte sur ce point géographique"
                    >
                      <Crosshair size={11} />
                      <span>{isTargeted ? 'Cible verrouillée' : 'Localiser sur la carte'}</span>
                      {item.placeName && (
                        <span className="locate-place-pill">
                          <MapPin size={9} />
                          {item.placeName}
                        </span>
                      )}
                    </button>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="journal-item-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>
                          {isQuake
                            ? 'Bulletin officiel USGS'
                            : `Dépêche ${item.source}`}
                        </span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
