import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { CaptureState, Message } from '../types';

function Popup() {
  const [state, setState] = useState<CaptureState | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load state on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' } as Message, (response) => {
      if (response?.state) {
        setState(response.state);
      }
    });

    // Listen for state updates
    const listener = (message: Message) => {
      if (message.type === 'STATE_UPDATE') {
        setState(message.state);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const handleStart = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await chrome.runtime.sendMessage({ type: 'START_CAPTURE' } as Message);

      if (response?.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError('');

    try {
      await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' } as Message);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (!state) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>AlgorithmLens</h1>
        <div style={styles.status}>
          <span style={{
            ...styles.statusDot,
            backgroundColor: state.isCapturing ? '#22c55e' : '#64748b'
          }}></span>
          <span style={styles.statusText}>
            {state.isCapturing ? 'Capturing' : 'Idle'}
          </span>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.info}>
        {state.session && (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Session:</span>
            <span style={styles.infoValue}>
              {state.session.sessionId.substring(2, 21)}...
            </span>
          </div>
        )}

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Queue:</span>
          <span style={styles.infoValue}>
            {state.queueSize} events
          </span>
        </div>

        {state.lastUpload && (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Last upload:</span>
            <span style={styles.infoValue}>
              {state.lastUpload.accepted} accepted, {state.lastUpload.skipped} skipped
            </span>
          </div>
        )}
      </div>

      <div style={styles.actions}>
        {!state.isCapturing ? (
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Session'}
          </button>
        ) : (
          <button
            style={{ ...styles.button, ...styles.buttonDanger }}
            onClick={handleStop}
            disabled={loading}
          >
            {loading ? 'Stopping...' : 'Stop Session'}
          </button>
        )}

        <button
          style={{ ...styles.button, ...styles.buttonSecondary }}
          onClick={openOptions}
        >
          Settings
        </button>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Privacy-respecting content capture for feed analysis
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  container: {
    width: '320px',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    color: '#1f2937'
  },
  header: {
    marginBottom: '16px'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.3s'
  },
  statusText: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500'
  },
  error: {
    padding: '12px',
    marginBottom: '12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '6px',
    fontSize: '13px'
  },
  info: {
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    ':last-child': {
      marginBottom: 0
    }
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: '13px'
  },
  infoValue: {
    color: '#111827',
    fontSize: '13px',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px'
  },
  button: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none'
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    ':hover': {
      backgroundColor: '#2563eb'
    }
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
    color: '#fff',
    ':hover': {
      backgroundColor: '#dc2626'
    }
  },
  buttonSecondary: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
    ':hover': {
      backgroundColor: '#d1d5db'
    }
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '12px'
  },
  footerText: {
    margin: 0,
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center'
  },
  loading: {
    textAlign: 'center',
    color: '#6b7280'
  }
};

// Mount popup
render(<Popup />, document.getElementById('app')!);
