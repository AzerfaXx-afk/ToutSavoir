import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Globe,
  MapPin,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Compass,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  WORLD_TERRITORIES,
  searchTerritories,
  getAlphabetGroupedTerritories,
  ALPHABET_LETTERS,
  normalizeSearchText,
} from '../data/worldTerritoriesData';
import { sound } from '../utils/soundFX';
import './TopSearchBar.css';

export function TopSearchBar({
  onSelectCountry,
  onSelectLocation,
  is3D = false,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'countries' | 'islands'
  const [selectedLetter, setSelectedLetter] = useState(null); // null | 'A'...'Z'
  const [sortMode, setSortMode] = useState('alpha'); // 'alpha' | 'pop'
  const [focusedIndex, setFocusedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const railRef = useRef(null);

  const handleScrollRail = (direction) => {
    sound.tick(0.2);
    if (railRef.current) {
      railRef.current.scrollBy({
        left: direction === 'left' ? -140 : 140,
        behavior: 'smooth',
      });
    }
  };

  // Compute filtered list
  const filteredList = useMemo(() => {
    let list = searchTerritories(query, activeCategory, selectedLetter);

    if (sortMode === 'pop') {
      list = [...list].sort((a, b) => {
        const popA = parseInt(String(a.pop).replace(/[^0-9]/g, ''), 10) || 0;
        const popB = parseInt(String(b.pop).replace(/[^0-9]/g, ''), 10) || 0;
        return popB - popA;
      });
    } else {
      // Default: Strict French alphabetical order
      list = [...list].sort((a, b) =>
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
    }

    return list;
  }, [query, activeCategory, selectedLetter, sortMode]);

  // Alphabetical groups (for A-Z mode when no specific letter filter is active)
  const groupedTerritories = useMemo(() => {
    if (sortMode !== 'alpha' || selectedLetter) return null;
    return getAlphabetGroupedTerritories(filteredList);
  }, [filteredList, sortMode, selectedLetter]);

  // Reset focused index when filtered items change
  useEffect(() => {
    setFocusedIndex(0);
  }, [query, activeCategory, selectedLetter, sortMode]);

  // Focus helper: focuses input, opens dropdown and highlights text
  const focusAndOpen = useCallback(() => {
    sound.click(0.4);
    setIsOpen(true);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    });
  }, []);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K focus) and custom event listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusAndOpen();
      }
    };

    const handleCustomFocus = () => {
      focusAndOpen();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('focus-top-search-bar', handleCustomFocus);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('focus-top-search-bar', handleCustomFocus);
    };
  }, [focusAndOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select territory action
  const handleSelectTerritory = useCallback(
    (item) => {
      if (!item) return;
      sound.click(0.45);

      // 1. Fly map / globe camera
      if (onSelectLocation) {
        onSelectLocation(item.lat, item.lng, item.zoom || 6, {
          countryKey: item.groupKey || item.iso3,
          name: item.name,
        });
      }

      // 2. Select country dossier in drawer
      if (onSelectCountry) {
        const code = item.iso2 || item.groupKey || 'FR';
        onSelectCountry(code, item.name);
      }

      // 3. Keep selected name in input or reset
      setQuery(item.name);
      setIsOpen(false);
    },
    [onSelectLocation, onSelectCountry]
  );

  // Keyboard navigation within list
  const handleKeyDownInput = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      sound.hover(0.15);
      setFocusedIndex((prev) => Math.min(prev + 1, filteredList.length - 1));
      scrollActiveItemIntoView(focusedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      sound.hover(0.15);
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
      scrollActiveItemIntoView(focusedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredList[focusedIndex]) {
        handleSelectTerritory(filteredList[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const scrollActiveItemIntoView = (index) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('.top-search-item');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  // Highlight matched search text
  const renderHighlightedName = (text, highlight) => {
    if (!highlight || !highlight.trim()) return text;
    const normText = normalizeSearchText(text);
    const normHighlight = normalizeSearchText(highlight);
    const startIdx = normText.indexOf(normHighlight);
    if (startIdx === -1) return text;

    const endIdx = startIdx + normHighlight.length;
    return (
      <>
        {text.substring(0, startIdx)}
        <mark className="search-query-match">{text.substring(startIdx, endIdx)}</mark>
        {text.substring(endIdx)}
      </>
    );
  };

  // Toggle letter filter
  const handleLetterClick = (letter) => {
    sound.tick(0.35);
    setSelectedLetter((prev) => (prev === letter ? null : letter));
  };

  return (
    <div
      className={`top-search-bar-root ${isOpen ? 'is-open' : ''}`}
      ref={containerRef}
    >
      {/* Sleek Neumorphic Search Input Bar */}
      <div className="neumorphic-search-container">
        <div className="search-icon-wrap">
          <Search size={15} className="search-magnifier-icon" />
          <span className="search-pulse-glow" />
        </div>

        <input
          ref={inputRef}
          type="text"
          className="neumorphic-search-input"
          placeholder="Rechercher un pays, île, archipel..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            sound.hover(0.2);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDownInput}
          spellCheck={false}
          autoComplete="off"
        />

        {query ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              sound.tick(0.3);
              setQuery('');
              inputRef.current?.focus();
            }}
            title="Effacer"
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        ) : (
          <div
            className="search-shortcut-badge"
            onClick={(e) => {
              e.stopPropagation();
              focusAndOpen();
            }}
            title="Raccourci clavier universel : Ctrl+K ou ⌘+K"
          >
            <kbd className="kbd-key">Ctrl</kbd>
            <span className="kbd-sep">+</span>
            <kbd className="kbd-key">K</kbd>
          </div>
        )}
      </div>

      {/* Extruded Neumorphic Dropdown Panel */}
      {isOpen && (
        <div className="neumorphic-dropdown-panel">
          {/* Header Controls: Categories & Sort Modes */}
          <div className="dropdown-controls-bar">
            {/* Category Filter Pills */}
            <div className="category-pills-group">
              <button
                type="button"
                className={`filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => {
                  sound.tick(0.3);
                  setActiveCategory('all');
                }}
              >
                TOUS ({WORLD_TERRITORIES.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${activeCategory === 'countries' ? 'active' : ''}`}
                onClick={() => {
                  sound.tick(0.3);
                  setActiveCategory('countries');
                }}
              >
                PAYS ({WORLD_TERRITORIES.filter((t) => t.type === 'country').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${activeCategory === 'islands' ? 'active' : ''}`}
                onClick={() => {
                  sound.tick(0.3);
                  setActiveCategory('islands');
                }}
              >
                ÎLES & ARCHIPELS ({WORLD_TERRITORIES.filter((t) => t.type === 'island' || t.type === 'drom-com').length})
              </button>
            </div>

            {/* Sort Toggle (Keep A-Z and Population here in dropdown) */}
            <div className="sort-toggle-group">
              <button
                type="button"
                className={`sort-pill ${sortMode === 'alpha' ? 'active' : ''}`}
                onClick={() => {
                  sound.tick(0.3);
                  setSortMode('alpha');
                }}
                title="Trier par ordre alphabétique"
              >
                A-Z
              </button>
              <button
                type="button"
                className={`sort-pill ${sortMode === 'pop' ? 'active' : ''}`}
                onClick={() => {
                  sound.tick(0.3);
                  setSortMode('pop');
                }}
                title="Trier par population"
              >
                Population
              </button>
            </div>
          </div>

          {/* Alphabetical Quick-Jump Rail with Smooth Arrow Scroll */}
          <div className="alphabet-rail-wrap">
            <button
              type="button"
              className="rail-arrow-btn left"
              onClick={() => handleScrollRail('left')}
              title="Faire défiler vers la gauche"
              aria-label="Lettres précédentes"
            >
              <ChevronLeft size={13} strokeWidth={2.4} />
            </button>

            <div className="alphabet-scrubber-rail" ref={railRef}>
              <button
                type="button"
                className={`letter-pill letter-all ${selectedLetter === null ? 'active' : ''}`}
                onClick={() => handleLetterClick(null)}
              >
                TOUT
              </button>
              {ALPHABET_LETTERS.map((letter) => {
                const isSelected = selectedLetter === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    className={`letter-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => handleLetterClick(letter)}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="rail-arrow-btn right"
              onClick={() => handleScrollRail('right')}
              title="Faire défiler vers la droite"
              aria-label="Lettres suivantes"
            >
              <ChevronRight size={13} strokeWidth={2.4} />
            </button>
          </div>

          {/* Results Counter & Active Filter Tag */}
          <div className="results-meta-bar">
            <span className="results-count-tag">
              {filteredList.length} {filteredList.length > 1 ? 'résultats' : 'résultat'}
            </span>
            {selectedLetter && (
              <span className="active-filter-badge">
                Lettre : <strong>{selectedLetter}</strong>
                <button
                  type="button"
                  className="badge-remove-btn"
                  onClick={() => setSelectedLetter(null)}
                >
                  ×
                </button>
              </span>
            )}
            {query && (
              <span className="active-filter-badge">
                Recherche : <strong>"{query}"</strong>
              </span>
            )}
          </div>

          {/* Scrollable Results List */}
          <div className="dropdown-scroll-list" ref={listRef}>
            {filteredList.length === 0 ? (
              <div className="empty-search-state">
                <Compass size={28} className="empty-search-icon" />
                <div className="empty-title">Aucun territoire correspondant</div>
                <div className="empty-subtitle">
                  Vérifiez l'orthographe ou essayez un autre nom de pays, île ou code ISO.
                </div>
              </div>
            ) : sortMode === 'alpha' && !selectedLetter && groupedTerritories ? (
              // Grouped Alphabetical View (A, B, C...)
              Object.entries(groupedTerritories).map(([letter, items]) => (
                <div key={letter} className="alpha-group-section">
                  <div className="alpha-group-header">
                    <span className="alpha-group-letter">{letter}</span>
                    <span className="alpha-group-line" />
                    <span className="alpha-group-count">{items.length}</span>
                  </div>
                  <div className="alpha-group-items">
                    {items.map((item) => {
                      const globalIdx = filteredList.indexOf(item);
                      const isFocused = globalIdx === focusedIndex;
                      return (
                        <TerritoryRowItem
                          key={item.id}
                          item={item}
                          query={query}
                          isFocused={isFocused}
                          onSelect={() => handleSelectTerritory(item)}
                          renderHighlightedName={renderHighlightedName}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              // Flat View (When filtered by letter, population, or search query)
              filteredList.map((item, idx) => {
                const isFocused = idx === focusedIndex;
                return (
                  <TerritoryRowItem
                    key={item.id}
                    item={item}
                    query={query}
                    isFocused={isFocused}
                    onSelect={() => handleSelectTerritory(item)}
                    renderHighlightedName={renderHighlightedName}
                  />
                );
              })
            )}
          </div>

          {/* Footer Keyboard Hints */}
          <div className="dropdown-footer-hints">
            <div className="footer-hint-item">
              <kbd className="mini-kbd">↑</kbd>
              <kbd className="mini-kbd">↓</kbd>
              <span>Naviguer</span>
            </div>
            <div className="footer-hint-item">
              <kbd className="mini-kbd">↵ Entrée</kbd>
              <span>Centrer & Fiche</span>
            </div>
            <div className="footer-hint-item">
              <kbd className="mini-kbd">Échap</kbd>
              <span>Fermer</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual item row
function TerritoryRowItem({
  item,
  query,
  isFocused,
  onSelect,
  renderHighlightedName,
}) {
  const [imgError, setImgError] = useState(false);

  // High-fidelity flag resolution with SVG fallback
  const flagSrc = useMemo(() => {
    if (imgError && item.iso2) {
      return `https://flagcdn.com/${item.iso2.toLowerCase()}.svg`;
    }
    return item.flagUrl || (item.iso2 ? `https://flagcdn.com/w80/${item.iso2.toLowerCase()}.png` : null);
  }, [item.flagUrl, item.iso2, imgError]);

  return (
    <div
      className={`top-search-item ${isFocused ? 'is-focused' : ''} is-${item.type}`}
      onClick={onSelect}
      onMouseEnter={() => sound.hover(0.12)}
    >
      {/* Flag / Icon Avatar */}
      <div className="item-flag-wrap" title={`${item.name} (${item.iso2 || ''})`}>
        {flagSrc ? (
          <img
            src={flagSrc}
            alt={`Drapeau ${item.name}`}
            className="item-flag-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="item-flag-fallback">
            <span className="item-flag-iso-fallback">{item.iso2 || 'TER'}</span>
          </div>
        )}
      </div>

      {/* Info Block */}
      <div className="item-content-block">
        <div className="item-primary-row">
          <span className="item-name">
            {renderHighlightedName(item.name, query)}
          </span>

          {item.sovereign && item.sovereign !== item.name && (
            <span className="item-sovereign-tag">
              Rattaché : {item.sovereign}
            </span>
          )}
        </div>

        <div className="item-secondary-row">
          {item.capital && (
            <span className="item-meta-detail">
              <MapPin size={10} className="meta-icon" />
              {item.capital}
            </span>
          )}

          <span className="item-meta-detail">{item.continent}</span>

          {item.pop && item.pop !== 'N/A' && (
            <span className="item-meta-pop">{item.pop}</span>
          )}

          {item.area && item.area !== 'N/A' && (
            <span className="item-meta-area">{item.area}</span>
          )}
        </div>
      </div>

      {/* Badges & Arrow */}
      <div className="item-trailing-block">
        <span className={`type-badge badge-${item.type}`}>
          {item.typeLabel}
        </span>

        {item.iso2 && (
          <span className="iso-code-badge">{item.iso2}</span>
        )}

        <ArrowRight size={13} className="item-arrow-icon" />
      </div>
    </div>
  );
}
