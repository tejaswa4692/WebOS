import React from 'react';
import { Sliders, Monitor, Shield, Cpu, HardDrive, Info, Moon, Sun, Check } from 'lucide-react';

const WALLPAPERS = [
  { id: 'neon_glass', name: 'Neon Glassmorphism', url: '/wallpaper_neon_glass.jpg' },
  { id: 'dark_cosmic', name: 'Dark Cosmic Nebula', url: '/wallpaper_dark_cosmic.jpg' },
  { id: 'glass_mesh', name: 'Cyber Mesh Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop' },
  { id: 'abstract_waves', name: 'Ethereal Flow', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1964&auto=format&fit=crop' }
];

const ACCENTS = [
  { id: 'sapphire', name: 'Sapphire Blue', color: '#0066ff' },
  { id: 'emerald', name: 'Emerald Green', color: '#10b981' },
  { id: 'sunset', name: 'Sunset Orange', color: '#f97316' },
  { id: 'ruby', name: 'Ruby Red', color: '#ef4444' },
  { id: 'purple', name: 'Cyber Purple', color: '#a855f7' }
];

export default function SettingsApp({ settings, updateSettings }) {
  const [activeTab, setActiveTab] = React.useState('personalization');
  const [customUrl, setCustomUrl] = React.useState('');

  const handleCustomWallpaper = (e) => {
    e.preventDefault();
    if (customUrl.trim()) {
      updateSettings({ wallpaper: customUrl });
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>Settings</div>
        
        <button
          onClick={() => setActiveTab('personalization')}
          style={{
            ...styles.sidebarItem,
            ...(activeTab === 'personalization' ? styles.sidebarItemActive : {})
          }}
        >
          <Monitor size={16} />
          Personalization
        </button>

        <button
          onClick={() => setActiveTab('system')}
          style={{
            ...styles.sidebarItem,
            ...(activeTab === 'system' ? styles.sidebarItemActive : {})
          }}
        >
          <Sliders size={16} />
          System Controls
        </button>

        <button
          onClick={() => setActiveTab('specs')}
          style={{
            ...styles.sidebarItem,
            ...(activeTab === 'specs' ? styles.sidebarItemActive : {})
          }}
        >
          <Cpu size={16} />
          Device Specs
        </button>
      </div>

      {/* Main Content Area */}
      <div style={styles.content}>
        {activeTab === 'personalization' && (
          <div style={styles.section} className="fade-in">
            <h2 style={styles.heading}>Personalization</h2>
            
            {/* Theme Toggle */}
            <div style={styles.row}>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>Color Theme</div>
                <div style={styles.rowDesc}>Toggle between dark mode and light mode</div>
              </div>
              <div style={styles.themeToggleGroup}>
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  style={{
                    ...styles.toggleBtn,
                    ...(settings.theme === 'dark' ? styles.toggleBtnActive : {})
                  }}
                >
                  <Moon size={14} />
                  Dark
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  style={{
                    ...styles.toggleBtn,
                    ...(settings.theme === 'light' ? styles.toggleBtnActive : {})
                  }}
                >
                  <Sun size={14} />
                  Light
                </button>
              </div>
            </div>

            {/* Accent Color Selection */}
            <div style={styles.rowCol}>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>Accent Color</div>
                <div style={styles.rowDesc}>Choose the primary color for highlights, buttons and panels</div>
              </div>
              <div style={styles.accentGrid}>
                {ACCENTS.map(accent => (
                  <button
                    key={accent.id}
                    onClick={() => updateSettings({ accentColor: accent.id })}
                    style={{
                      ...styles.accentColorBtn,
                      backgroundColor: accent.color,
                      borderColor: settings.accentColor === accent.id ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.2)'
                    }}
                    title={accent.name}
                  >
                    {settings.accentColor === accent.id && (
                      <Check size={14} color="#fff" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Wallpaper selector */}
            <div style={styles.rowCol}>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>Desktop Wallpaper</div>
                <div style={styles.rowDesc}>Select from futuristic OS wallpapers</div>
              </div>
              <div style={styles.wallpaperGrid}>
                {WALLPAPERS.map(wp => (
                  <div
                    key={wp.id}
                    onClick={() => updateSettings({ wallpaper: wp.url })}
                    style={{
                      ...styles.wallpaperCard,
                      backgroundImage: `url(${wp.url})`,
                      boxShadow: settings.wallpaper === wp.url ? '0 0 0 2px var(--accent)' : 'none'
                    }}
                  >
                    <div style={styles.wallpaperCardLabel}>{wp.name}</div>
                  </div>
                ))}
              </div>

              {/* Custom Wallpaper Input */}
              <form onSubmit={handleCustomWallpaper} style={styles.customWallpaperForm}>
                <input
                  type="text"
                  placeholder="Paste custom wallpaper image URL..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="glass-input"
                  style={styles.customUrlInput}
                />
                <button type="submit" className="interactive-btn active">
                  Apply
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={styles.section} className="fade-in">
            <h2 style={styles.heading}>System Controls</h2>

            {/* Blur Slider */}
            <div style={styles.rowCol}>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>Glassmorphism Blur: {settings.blurIntensity}px</div>
                <div style={styles.rowDesc}>Adjust transparency blurring effect on panels and windows</div>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={settings.blurIntensity}
                onChange={(e) => updateSettings({ blurIntensity: parseInt(e.target.value) })}
                className="glass-slider"
                style={styles.slider}
              />
            </div>

            {/* Animation Speed Slider */}
            <div style={styles.rowCol}>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>Animation Duration: {settings.animationSpeed}s</div>
                <div style={styles.rowDesc}>Speed of window opening/closing and transition motions</div>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.animationSpeed}
                onChange={(e) => updateSettings({ animationSpeed: parseFloat(e.target.value) })}
                className="glass-slider"
                style={styles.slider}
              />
            </div>

            {/* Time format config */}
            <div style={styles.row}>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>Time Format</div>
                <div style={styles.rowDesc}>Display style in System Tray</div>
              </div>
              <select
                value={settings.timeFormat}
                onChange={(e) => updateSettings({ timeFormat: e.target.value })}
                className="glass-select"
                style={styles.select}
              >
                <option value="12h">12-Hour (AM/PM)</option>
                <option value="24h">24-Hour (Military)</option>
              </select>
            </div>

            {/* Date format config */}
            <div style={styles.row}>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>Date Format</div>
                <div style={styles.rowDesc}>Choose your localized date display format</div>
              </div>
              <select
                value={settings.dateFormat}
                onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                className="glass-select"
                style={styles.select}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div style={styles.section} className="fade-in">
            <h2 style={styles.heading}>Device Specifications</h2>
            
            <div style={styles.specsContainer}>
              <div style={styles.specCard}>
                <div style={styles.specCardHeader}>
                  <Cpu size={18} color="var(--accent)" />
                  <span>Processor & Core Load</span>
                </div>
                <div style={styles.specCardValue}>AMD Ryzen 7 5700X (8 Cores)</div>
                <div style={styles.specCardDesc}>Base Clock: 4.2 GHz | Load: 12%</div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: '12%', backgroundColor: 'var(--accent)' }}></div>
                </div>
              </div>

              <div style={styles.specCard}>
                <div style={styles.specCardHeader}>
                  <HardDrive size={18} color="var(--accent)" />
                  <span>Memory & Disk Utilization</span>
                </div>
                <div style={styles.specCardValue}>16.0 GB Virtual RAM</div>
                <div style={styles.specCardDesc}>Used: 4.8 GB | Free: 11.2 GB</div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: '30%', backgroundColor: 'var(--accent)' }}></div>
                </div>
              </div>

              <div style={styles.specInfoTable}>
                <div style={styles.specInfoRow}>
                  <span style={styles.specInfoKey}>OS Name</span>
                  <span style={styles.specInfoVal}>TejasWa's Epic OS Premium Edition</span>
                </div>
                <div style={styles.specInfoRow}>
                  <span style={styles.specInfoKey}>OS Version</span>
                  <span style={styles.specInfoVal}>v2.0.26 (Hackathon Build)</span>
                </div>
                <div style={styles.specInfoRow}>
                  <span style={styles.specInfoKey}>Architecture</span>
                  <span style={styles.specInfoVal}>JavaScript WebAssembly 64-bit</span>
                </div>
                <div style={styles.specInfoRow}>
                  <span style={styles.specInfoKey}>Kernel Version</span>
                  <span style={styles.specInfoVal}>Electron.V8.React.Engine.9.4</span>
                </div>
                <div style={styles.specInfoRow}>
                  <span style={styles.specInfoKey}>Hardware Acceleration</span>
                  <span style={styles.specInfoVal}>Enabled (WebGL 2.0 active)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  sidebar: {
    width: '180px',
    borderRight: '1px solid var(--border-glass)',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'rgba(0, 0, 0, 0.15)',
  },
  sidebarTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '18px',
    fontWeight: '700',
    padding: '0 8px 16px 8px',
    color: 'var(--text-primary)',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-main)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  sidebarItemActive: {
    backgroundColor: 'var(--accent-light)',
    color: 'var(--accent)',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heading: {
    fontFamily: 'var(--font-title)',
    fontSize: '22px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-glass)',
    gap: '16px',
  },
  rowCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-glass)',
  },
  rowInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  rowTitle: {
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontSize: '15px',
  },
  rowDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  themeToggleGroup: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 'var(--border-radius-md)',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    fontFamily: 'var(--font-main)',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  toggleBtnActive: {
    backgroundColor: 'var(--accent)',
    color: '#fff',
    boxShadow: 'var(--accent-glow)',
  },
  accentGrid: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  accentColorBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    transition: 'transform 0.15s ease',
  },
  wallpaperGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '4px',
  },
  wallpaperCard: {
    height: '90px',
    borderRadius: 'var(--border-radius-md)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  wallpaperCardLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    fontSize: '11px',
    padding: '4px 8px',
    fontWeight: '500',
  },
  customWallpaperForm: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  customUrlInput: {
    flex: 1,
    fontSize: '13px',
  },
  slider: {
    marginTop: '4px',
    width: '100%',
  },
  select: {
    width: '180px',
    fontSize: '13px',
  },
  specsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  specCard: {
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--border-radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  specCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  specCardValue: {
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: 'var(--font-title)',
  },
  specCardDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  specInfoTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '8px 4px',
  },
  specInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
  },
  specInfoKey: {
    color: 'var(--text-secondary)',
  },
  specInfoVal: {
    fontWeight: '500',
    color: 'var(--text-primary)',
  }
};
