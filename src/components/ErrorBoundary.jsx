import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AEGIS ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          background: '#080c14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e2e8f0',
          fontFamily: "'JetBrains Mono', monospace",
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(255, 51, 102, 0.12)',
            border: '1px solid rgba(255, 51, 102, 0.4)',
            borderRadius: 12,
            padding: '24px 32px',
            maxWidth: 500,
          }}>
            <h2 style={{ color: '#ff3366', margin: '0 0 12px 0', fontSize: 18 }}>
              AEGIS // INTERRUPTION TÉLÉMÉTRIQUE
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Une réinitialisation du flux d'affichage est requise pour restaurer la télémétrie en direct.
            </p>
            {this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 51, 102, 0.3)',
                borderRadius: 6,
                padding: '10px',
                marginBottom: '16px',
                textAlign: 'left',
                maxHeight: '180px',
                overflow: 'auto',
                fontSize: '11px',
                color: '#f87171',
                fontFamily: 'monospace'
              }}>
                <div style={{ fontWeight: 'bold' }}>{String(this.state.error.message || this.state.error)}</div>
                {this.state.error.stack && (
                  <pre style={{ margin: '6px 0 0', fontSize: '10px', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            <button
              onClick={this.handleReset}
              style={{
                background: '#00f2fe',
                color: '#080c14',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                letterSpacing: '0.8px',
              }}
            >
              RÉINITIALISER L'INTERFACE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
