import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Power, ShieldAlert, Monitor, Music, Terminal, Globe, FileText, Paintbrush } from 'lucide-react';

const ALL_APPS = [
  { id: 'settings', title: 'Settings', icon: Monitor, description: 'Personalize theme and system parameters' },
  { id: 'music', title: 'Music Player', icon: Music, description: 'Listen to tunes and watch audio visualizers' },
  { id: 'terminal', title: 'System Terminal', icon: Terminal, description: 'Command line virtual shell' },
  { id: 'browser', title: 'Browser', icon: Globe, description: 'Surf mock websites and play space games' },
  { id: 'notes', title: 'Notes Editor', icon: FileText, description: 'Edit and save local notebooks' },
  { id: 'paint', title: 'Paint Board', icon: Paintbrush, description: 'Draw sketches and download designs' }
];

export default function StartMenu({ isOpen, onOpenApp, onClose, onPowerOff }) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredApps = ALL_APPS.filter(app => 
    app.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="glass-panel"
      style={styles.container}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    >
      {/* Search Input */}
      <div style={styles.searchContainer}>
        <Search size={16} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Type to search applications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
          autoFocus
        />
      </div>

      {/* Main Apps Layout */}
      <div style={styles.content}>
        <div style={styles.sectionHeader}>Pinned Applications</div>
        
        {filteredApps.length > 0 ? (
          <div style={styles.appsGrid}>
            {filteredApps.map(app => {
              const AppIcon = app.icon;
              return (
                <div
                  key={app.id}
                  onClick={() => {
                    onOpenApp(app.id);
                    onClose();
                  }}
                  style={styles.appCard}
                  className="start-app-card"
                >
                  <div style={styles.appCardIconBg}>
                    <AppIcon size={20} color="var(--accent)" />
                  </div>
                  <span style={styles.appCardTitle}>{app.title}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptySearch}>
            <ShieldAlert size={24} color="var(--text-muted)" />
            <span>No applications found matching query.</span>
          </div>
        )}

        {/* Recommended Panel */}
        <div style={styles.recommendedSection}>
          <div style={styles.sectionHeader}>Recommended</div>
          <div style={styles.recList}>
            <div style={styles.recItem} onClick={() => { onOpenApp('notes'); onClose(); }}>
              <FileText size={14} color="var(--text-secondary)" />
              <div style={styles.recText}>
                <div style={styles.recTitle}>Hackathon Project Plan</div>
                <div style={styles.recDesc}>Modified yesterday</div>
              </div>
            </div>
            <div style={styles.recItem} onClick={() => { onOpenApp('music'); onClose(); }}>
              <Music size={14} color="var(--text-secondary)" />
              <div style={styles.recText}>
                <div style={styles.recTitle}>Cosmic synthesized web audio track</div>
                <div style={styles.recDesc}>Play now in browser</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Profile bar */}
      <div style={styles.footer}>
        <div style={styles.profile}>
          <div style={styles.avatar}>AG</div>
          <div style={styles.profileInfo}>
            <div style={styles.userName}>Guest User</div>
            <div style={styles.userRole}>System Administrator</div>
          </div>
        </div>

        <button onClick={onPowerOff} style={styles.powerBtn} title="Shut Down OS session">
          <Power size={15} />
        </button>
      </div>
    </motion.div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    bottom: '60px',
    left: 'calc(50% - 240px)',
    width: '480px',
    height: '420px',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'rgba(var(--bg-panel-rgb), 0.82)',
    backdropFilter: 'blur(var(--blur-intensity)) saturate(130%)',
    border: '1px solid var(--border-glass)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '16px',
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--border-radius-md)',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-main)',
    fontSize: '13px',
  },
  content: {
    flex: 1,
    padding: '0 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  appsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  appCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 6px',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    gap: '8px',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  },
  appCardIconBg: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border-glass)',
    transition: 'transform 0.2s',
  },
  appCardTitle: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptySearch: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    fontSize: '12px',
    padding: '24px 0',
  },
  recommendedSection: {
    marginTop: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '14px',
  },
  recList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 10px',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  recText: {
    display: 'flex',
    flexDirection: 'column',
  },
  recTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  recDesc: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  footer: {
    height: '56px',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderTop: '1px solid var(--border-glass)',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '12px',
    boxShadow: 'var(--accent-glow)',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  userRole: {
    fontSize: '9px',
    color: 'var(--text-secondary)',
  },
  powerBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .start-app-card:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
    .start-app-card:hover .appCardIconBg {
      transform: scale(1.1);
      background: var(--accent-light);
      border-color: rgba(var(--accent-rgb), 0.3);
    }
  `;
  document.head.appendChild(styleSheet);
}
