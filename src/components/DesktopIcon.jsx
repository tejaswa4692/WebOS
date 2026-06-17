import React from 'react';

export default function DesktopIcon({ title, icon: IconComponent, onOpen, isSelected, onSelect }) {
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onOpen();
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        ...styles.iconContainer,
        backgroundColor: isSelected ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
        border: isSelected ? '1px solid rgba(var(--accent-rgb), 0.35)' : '1px solid transparent',
      }}
      className="desktop-shortcut"
    >
      <div 
        style={{
          ...styles.iconWrapper,
          background: isSelected ? 'rgba(var(--accent-rgb), 0.15)' : 'rgba(255, 255, 255, 0.05)',
        }}
        className="shortcut-glow"
      >
        {IconComponent && <IconComponent size={36} color="var(--accent)" />}
      </div>
      <span style={styles.titleText}>{title}</span>
    </div>
  );
}

const styles = {
  iconContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100px',
    padding: '10px 6px',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    gap: '8px',
    textAlign: 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: 'var(--border-radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.12)',
    transition: 'all 0.2s',
    boxShadow: '0 4px 16px rgba(var(--accent-rgb), 0.2)',
  },
  titleText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'var(--font-main)',
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.9)',
    maxWidth: '90px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .desktop-shortcut:hover .shortcut-glow {
      transform: translateY(-2px) scale(1.05);
      background: rgba(var(--accent-rgb), 0.1) !important;
      box-shadow: 0 4px 12px rgba(var(--accent-rgb), 0.25);
      border-color: rgba(var(--accent-rgb), 0.3);
    }
  `;
  document.head.appendChild(styleSheet);
}
