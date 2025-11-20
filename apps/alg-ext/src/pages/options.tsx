import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { ExtensionSettings } from '../types';

function Options() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    accountId: 'test_user',
    apiBaseUrl: 'http://localhost:5050',
    enabledSites: {
      reddit: true,
      youtube: true,
      instagram: true,
      x: true,
      facebook: true
    }
  });

  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
    });
  }, []);

  const handleSave = async () => {
    await chrome.storage.sync.set({ settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = <K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSite = (site: keyof ExtensionSettings['enabledSites'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      enabledSites: {
        ...prev.enabledSites,
        [site]: enabled
      }
    }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>AlgorithmLens Settings</h1>
        <p style={styles.subtitle}>Configure your content capture preferences</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Account Configuration</h2>

        <div style={styles.field}>
          <label style={styles.label}>Account ID</label>
          <input
            type="text"
            style={styles.input}
            value={settings.accountId}
            onChange={(e) => updateSetting('accountId', (e.target as HTMLInputElement).value)}
            placeholder="e.g., user_123"
          />
          <p style={styles.hint}>
            Your unique identifier for organizing captured data
          </p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>API Base URL</label>
          <input
            type="text"
            style={styles.input}
            value={settings.apiBaseUrl}
            onChange={(e) => updateSetting('apiBaseUrl', (e.target as HTMLInputElement).value)}
            placeholder="http://localhost:5050"
          />
          <p style={styles.hint}>
            The ingest API endpoint (default: http://localhost:5050)
          </p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Enabled Sites</h2>
        <p style={styles.description}>
          Choose which social media sites to capture content from
        </p>

        <div style={styles.checkboxGroup}>
          {Object.entries(settings.enabledSites).map(([site, enabled]) => (
            <label key={site} style={styles.checkbox}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => updateSite(
                  site as keyof ExtensionSettings['enabledSites'],
                  (e.target as HTMLInputElement).checked
                )}
              />
              <span style={styles.checkboxLabel}>
                {site === 'x' ? 'X (Twitter)' : site.charAt(0).toUpperCase() + site.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div style={styles.actions}>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={handleSave}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      <div style={styles.footer}>
        <h3 style={styles.footerTitle}>Privacy Notice</h3>
        <p style={styles.footerText}>
          AlgorithmLens captures only the text content visible on your screen.
          No images, videos, or personal authentication data is collected.
          All data is stored locally and uploaded to your configured API endpoint only.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '40px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    color: '#1f2937'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '600',
    color: '#111827'
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    color: '#6b7280'
  },
  section: {
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827'
  },
  description: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#6b7280'
  },
  field: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  hint: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#9ca3af'
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background-color 0.2s'
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#374151',
    userSelect: 'none'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '32px'
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none'
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
    color: '#fff'
  },
  footer: {
    padding: '24px',
    backgroundColor: '#fef3c7',
    borderRadius: '12px',
    border: '1px solid #fde68a'
  },
  footerTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#92400e'
  },
  footerText: {
    margin: 0,
    fontSize: '14px',
    color: '#78350f',
    lineHeight: '1.6'
  }
};

// Mount options
render(<Options />, document.getElementById('app')!);
