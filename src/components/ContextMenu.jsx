import React, { useEffect } from 'react';
import { RefreshCw, Monitor, Paintbrush, Terminal, ShieldAlert } from 'lucide-react';

export default function ContextMenu({ x, y, visible, onClose, onAction }) {
  useEffect(() => {
    const handleOutsideClick = () => {
      if (visible) onClose();
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 999999,
        padding: '6px',
        width: '180px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        borderRadius: 'var(--border-radius-md)',
        background: 'rgba(var(--bg-panel-rgb), 0.85)',
        border: '1px solid var(--border-glass)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}
    >
      <button 
        className="context-menu-item"
        style={styles.menuItem} 
        onClick={() => onAction('refresh')}
      >
        <RefreshCw size={14} />
        <span>Refresh System</span>
      </button>

      <button 
        className="context-menu-item"
        style={styles.menuItem} 
        onClick={() => onAction('theme')}
      >
        <Paintbrush size={14} />
        <span>Toggle Dark/Light</span>
      </button>

      <button 
        className="context-menu-item"
        style={styles.menuItem} 
        onClick={() => onAction('wallpaper')}
      >
        <Monitor size={14} />
        <span>Change Wallpaper</span>
      </button>

      <div style={styles.divider} />

      <button 
        className="context-menu-item"
        style={styles.menuItem} 
        onClick={() => onAction('terminal')}
      >
        <Terminal size={14} />
        <span>Open Terminal</span>
      </button>

      <button 
        className="context-menu-item"
        style={styles.menuItem} 
        onClick={() => onAction('about')}
      >
        <ShieldAlert size={14} />
        <span>System Info</span>
      </button>
    </div>
  );
}

const styles = {
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    fontFamily: 'var(--font-main)',
    fontSize: '12px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-glass)',
    margin: '4px 6px',
  }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .context-menu-item:hover {
      background-color: var(--accent-light) !important;
      color: var(--accent) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
