import React, { useState } from 'react';
import { LIVE_BULLETINS } from '../data/mockData';
import { ChevronRight, ChevronLeft, Radio, AlertOctagon, TrendingUp, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/soundFX';

export function IntelligenceDrawer({ onSelectAlert }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = () => {
    sound.tick();
    setIsOpen(!isOpen);
  };

  return (
    <aside className={`intelligence-dock ${isOpen ? 'dock-open' : 'dock-closed'}`}>
      {/* Toggle Tab */}
      <button className="dock-toggle-tab" onClick={toggleOpen} title="Afficher/Masquer le flux de renseignement">
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        <span className="tab-vertical-text">{isOpen ? 'RÉDUIRE' : 'FLUX OSINT'}</span>
      </button>

      {isOpen && (
        <div className="dock-inner-content">
          {/* Header */}
          <div className="dock-header">
            <div className="dock-title-group">
              <Radio size={13} className="text-crimson animate-pulse" />
              <span className="dock-title">FLUX DE RENSEIGNEMENT</span>
            </div>
            <span className="bulletin-count-badge">{LIVE_BULLETINS.length} ACTIFS</span>
          </div>

          {/* Risk Level Gauge Widget */}
          <div className="risk-gauge-card">
            <div className="risk-gauge-header">
              <div className="risk-title-line">
                <ShieldAlert size={13} className="text-crimson" />
                <span>INDICE DE RISQUE MONDIAL</span>
              </div>
              <span className="risk-score-val text-crimson">84.2 / 100</span>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="risk-progress-track">
              <div className="risk-progress-bar" style={{ width: '84.2%' }} />
            </div>

            <div className="risk-breakdown">
              <span>RISQUE NUCLÉAIRE : ÉLEVÉ</span>
              <span>CONFLITS ACTIFS : 16</span>
            </div>
          </div>

          {/* Live Feed List */}
          <div className="bulletins-scroll-list">
            <div className="bulletins-subheading">DERNIÈRES DÉPÊCHES OSINT // TEMPS RÉEL</div>

            {LIVE_BULLETINS.map((b) => {
              const isCrit = b.level === 'CRITIQUE';
              const isAlerte = b.level === 'ALERTE';

              return (
                <article
                  key={b.id}
                  className={`bulletin-card ${isCrit ? 'card-crit' : isAlerte ? 'card-alert' : ''}`}
                  onMouseEnter={() => sound.tick()}
                  onClick={() => {
                    sound.alert();
                    onSelectAlert && onSelectAlert(b);
                  }}
                >
                  <div className="bulletin-top">
                    <span className={`bulletin-tag ${isCrit ? 'tag-crit' : 'tag-neutral'}`}>{b.tag}</span>
                    <span className="bulletin-timestamp">{b.time}</span>
                  </div>

                  <h4 className="bulletin-headline">{b.title}</h4>
                  <p className="bulletin-body">{b.text}</p>

                  <div className="bulletin-footer">
                    <span className="bulletin-origin">{b.origin}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
