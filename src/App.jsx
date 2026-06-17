import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Monitor, Music, Terminal, Globe, FileText, Paintbrush, 
  RefreshCw, Power, ShieldAlert
} from 'lucide-react';

// Import apps
import SettingsApp from './apps/SettingsApp';
import MusicApp from './apps/MusicApp';
import TerminalApp from './apps/TerminalApp';
import BrowserApp from './apps/BrowserApp';
import NotesApp from './apps/NotesApp';
import PaintApp from './apps/PaintApp';

// Import components
import Window from './components/Window';
import ContextMenu from './components/ContextMenu';
import DesktopIcon from './components/DesktopIcon';
import StartMenu from './components/StartMenu';
import Taskbar from './components/Taskbar';

// Default user preference settings
const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: 'ruby',
  wallpaper: '/wallpaper_dark_cosmic.jpg',
  blurIntensity: 20,
  animationSpeed: 0.3,
  timeFormat: '12h',
  dateFormat: 'MM/DD/YYYY'
};

export default function App() {
  // Loading & Boot state
  const [bootState, setBootState] = useState('booting');
  const [bootLogs, setBootLogs] = useState([]);
  
  // Settings & Theme
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tejaswas_webos_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Windows State Manager
  const [windows, setWindows] = useState([
    { id: 'settings', title: 'Settings', icon: Monitor, isOpen: false, isMinimized: false, isMaximized: false, x: 80, y: 40, w: 720, h: 500, zIndex: 10 },
    { id: 'music', title: 'Music Player', icon: Music, isOpen: false, isMinimized: false, isMaximized: false, x: 120, y: 70, w: 850, h: 560, zIndex: 11 },
    { id: 'terminal', title: 'System Terminal', icon: Terminal, isOpen: false, isMinimized: false, isMaximized: false, x: 160, y: 110, w: 640, h: 420, zIndex: 12 },
    { id: 'browser', title: 'Browser', icon: Globe, isOpen: false, isMinimized: false, isMaximized: false, x: 200, y: 150, w: 820, h: 540, zIndex: 13 },
    { id: 'notes', title: 'Notes Editor', icon: FileText, isOpen: false, isMinimized: false, isMaximized: false, x: 240, y: 190, w: 720, h: 460, zIndex: 14 },
    { id: 'paint', title: 'Paint Board', icon: Paintbrush, isOpen: false, isMinimized: false, isMaximized: false, x: 280, y: 230, w: 680, h: 460, zIndex: 15 }
  ]);

  const [activeAppId, setActiveAppId] = useState(null);
  const [maxZIndex, setMaxZIndex] = useState(20);

  // Desktop Icons selection
  const [selectedIconId, setSelectedIconId] = useState(null);
  
  // Drag Selection Box
  const [dragSelect, setDragSelect] = useState({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  });

  // Start Menu
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  // Custom right click context menu
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    visible: false
  });

  // Notification center alerts
  const [notifications, setNotifications] = useState([]);
  const [activeToasts, setActiveToasts] = useState([]);

  // Boot Checklist effect
  useEffect(() => {
    if (bootState !== 'booting') return;

    const checklist = [
      'Mounting virtual root file system...',
      'Initializing audio visualization engine...',
      'Loading procedural synthesizer...',
      'Registering window snap event controllers...',
      'Applying theme configurations & wallpapers...',
      'Starting desktop environments...',
      'TejasWa\'s Epic OS has successfully loaded.'
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < checklist.length) {
        setBootLogs(prev => [...prev, checklist[currentLogIdx]]);
        currentLogIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setBootState('ready');
          addNotification('System Ready', 'Welcome to TejasWa\'s Epic OS! Double-click shortcuts to explore the desktop environment.');
        }, 600);
      }
    }, 350);

    return () => clearInterval(interval);
  }, [bootState]);

  // Sync settings and apply to document body variables
  useEffect(() => {
    localStorage.setItem('tejaswas_webos_settings', JSON.stringify(settings));

    const root = document.documentElement;
    root.className = `theme-${settings.theme} accent-${settings.accentColor}`;
    root.style.setProperty('--blur-intensity', `${settings.blurIntensity}px`);
    root.style.setProperty('--anim-speed', `${settings.animationSpeed}s`);
  }, [settings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Notifications Helpers
  const addNotification = (title, message) => {
    const id = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newNotif = { id, title, message, time: timeStr };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToasts(prev => [...prev, newNotif]);

    // Auto clear toast after 4s
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Window Focus / Bring to front
  const focusWindow = (id) => {
    const nextZ = maxZIndex + 1;
    setMaxZIndex(nextZ);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: nextZ } : w));
    setActiveAppId(id);
    setSelectedIconId(null);
  };

  // App Launcher
  const openApp = (appId) => {
    setWindows(prev => prev.map(w => {
      if (w.id === appId) {
        return { ...w, isOpen: true, isMinimized: false };
      }
      return w;
    }));
    focusWindow(appId);
  };

  const closeWindow = (id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
    if (activeAppId === id) setActiveAppId(null);
  };

  const minimizeWindow = (id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeAppId === id) setActiveAppId(null);
  };

  const maximizeWindow = (id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const handleWindowMove = (id, newX, newY) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x: newX, y: newY } : w));
  };

  const handleWindowResize = (id, newW, newH) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, w: newW, h: newH } : w));
  };

  // Right Click Trigger
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    });
  };

  // Context Menu Commands
  const handleContextAction = (action) => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    switch (action) {
      case 'refresh':
        addNotification('System Refresh', 'Desktop widgets refreshed and cache cleared.');
        break;
      case 'theme':
        updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
        break;
      case 'wallpaper':
        openApp('settings');
        break;
      case 'terminal':
        openApp('terminal');
        break;
      case 'about':
        openApp('settings');
        break;
      default:
        break;
    }
  };

  // Desktop Drag Selection box logic
  const handleDesktopMouseDown = (e) => {
    // Only trigger if clicking directly on the desktop layout content
    if (!e.target.classList.contains('desktop-content')) return;
    
    // Close context menu, start menu and focus off icons
    setContextMenu(prev => ({ ...prev, visible: false }));
    setStartMenuOpen(false);
    setSelectedIconId(null);

    setDragSelect({
      isSelecting: true,
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY
    });
  };

  const handleDesktopMouseMove = (e) => {
    if (!dragSelect.isSelecting) return;
    setDragSelect(prev => ({
      ...prev,
      endX: e.clientX,
      endY: e.clientY
    }));
  };

  const handleDesktopMouseUp = () => {
    setDragSelect(prev => ({ ...prev, isSelecting: false }));
  };

  // Power Off Boot sequences
  const handlePowerOff = () => {
    setBootState('shutdown');
    setWindows(prev => prev.map(w => ({ ...w, isOpen: false })));
  };

  const handleBootUp = () => {
    setBootLogs([]);
    setBootState('booting');
  };

  // Generate background style
  const desktopStyle = {
    backgroundImage: `url(${settings.wallpaper})`,
  };

  return (
    <>
      {/* 1. Animated Systems Bootloader */}
      {bootState === 'booting' && (
        <div style={styles.bootScreen}>
          <div style={styles.bootConsole}>
            <div style={styles.bootLogo}>⌬ TEJASWAS EPIC OS</div>
            <div style={styles.bootSub}>System Boot Loader Version 2.0.26</div>
            <div style={styles.bootLogContainer}>
              {bootLogs.map((log, idx) => (
                <div key={idx} style={styles.bootLogLine}>
                  <span style={styles.bootGreen}>[ OK ]</span> {log}
                </div>
              ))}
            </div>
            <div style={styles.spinner} />
          </div>
        </div>
      )}

      {/* 2. Systems Shutdown Powerless Screen */}
      {bootState === 'shutdown' && (
        <div style={styles.powerScreen}>
          <div style={styles.powerOffModal}>
            <ShieldAlert size={36} color="#ef4444" />
            <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>TejasWa's Epic OS Powered Off</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Session ended. Press the power button to boot virtual environments.</p>
            <button onClick={handleBootUp} style={styles.powerOnButton} className="flex-center power-on-btn">
              <Power size={22} color="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Running Desktop Environment */}
      {bootState === 'ready' && (
        <div 
          className="desktop-container" 
          style={desktopStyle}
          onContextMenu={handleContextMenu}
        >
          {/* Main Desktop icons grid */}
          <div 
            className="desktop-content"
            onMouseDown={handleDesktopMouseDown}
            onMouseMove={handleDesktopMouseMove}
            onMouseUp={handleDesktopMouseUp}
          >
            {/* Drag Selection Box overlay */}
            {dragSelect.isSelecting && (
              <div 
                className="drag-select-box"
                style={{
                  left: Math.min(dragSelect.startX, dragSelect.endX),
                  top: Math.min(dragSelect.startY, dragSelect.endY),
                  width: Math.abs(dragSelect.startX - dragSelect.endX),
                  height: Math.abs(dragSelect.startY - dragSelect.endY)
                }}
              />
            )}

            {/* Desktop grid columns */}
            <div style={styles.iconsGrid}>
              <DesktopIcon 
                title="Settings" 
                icon={Monitor} 
                onOpen={() => openApp('settings')}
                isSelected={selectedIconId === 'settings'}
                onSelect={() => setSelectedIconId('settings')}
              />
              <DesktopIcon 
                title="Music Player" 
                icon={Music} 
                onOpen={() => openApp('music')}
                isSelected={selectedIconId === 'music'}
                onSelect={() => setSelectedIconId('music')}
              />
              <DesktopIcon 
                title="Terminal" 
                icon={Terminal} 
                onOpen={() => openApp('terminal')}
                isSelected={selectedIconId === 'terminal'}
                onSelect={() => setSelectedIconId('terminal')}
              />
              <DesktopIcon 
                title="Browser" 
                icon={Globe} 
                onOpen={() => openApp('browser')}
                isSelected={selectedIconId === 'browser'}
                onSelect={() => setSelectedIconId('browser')}
              />
              <DesktopIcon 
                title="Notes Editor" 
                icon={FileText} 
                onOpen={() => openApp('notes')}
                isSelected={selectedIconId === 'notes'}
                onSelect={() => setSelectedIconId('notes')}
              />
              <DesktopIcon 
                title="Paint Board" 
                icon={Paintbrush} 
                onOpen={() => openApp('paint')}
                isSelected={selectedIconId === 'paint'}
                onSelect={() => setSelectedIconId('paint')}
              />
            </div>

            {/* Windows rendering manager panel */}
            <AnimatePresence>
              {windows.map(win => {
                if (!win.isOpen) return null;
                return (
                  <Window
                    key={win.id}
                    id={win.id}
                    title={win.title}
                    icon={win.icon}
                    isOpen={win.isOpen}
                    isMinimized={win.isMinimized}
                    isMaximized={win.isMaximized}
                    isActive={activeAppId === win.id}
                    x={win.x}
                    y={win.y}
                    width={win.w}
                    height={win.h}
                    zIndex={win.zIndex}
                    onClose={closeWindow}
                    onMinimize={minimizeWindow}
                    onMaximize={maximizeWindow}
                    onFocus={() => focusWindow(win.id)}
                    onWindowMove={handleWindowMove}
                    onWindowResize={handleWindowResize}
                  >
                    {win.id === 'settings' && <SettingsApp settings={settings} updateSettings={updateSettings} />}
                    {win.id === 'music' && <MusicApp />}
                    {win.id === 'terminal' && <TerminalApp settings={settings} updateSettings={updateSettings} />}
                    {win.id === 'browser' && <BrowserApp />}
                    {win.id === 'notes' && <NotesApp />}
                    {win.id === 'paint' && <PaintApp />}
                  </Window>
                );
              })}
            </AnimatePresence>

            {/* Slide Toast notification stack (Bottom Right overlay) */}
            <div style={styles.toastStack}>
              {activeToasts.map(toast => (
                <div key={toast.id} className="glass-panel notif-card-fade" style={styles.toastCard}>
                  <div style={styles.toastHeader}>
                    <span style={styles.toastTitle}>{toast.title}</span>
                    <span style={styles.toastTime}>{toast.time}</span>
                  </div>
                  <div style={styles.toastMessage}>{toast.message}</div>
                </div>
              ))}
            </div>

            {/* Start Menu application launcher flyout */}
            <AnimatePresence>
              {startMenuOpen && (
                <StartMenu
                  isOpen={startMenuOpen}
                  onOpenApp={openApp}
                  onClose={() => setStartMenuOpen(false)}
                  onPowerOff={handlePowerOff}
                />
              )}
            </AnimatePresence>

            {/* Right click custom Context Menu */}
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              visible={contextMenu.visible}
              onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
              onAction={handleContextAction}
            />
          </div>

          {/* Bottom Taskbar docks */}
          <Taskbar
            activeWindows={windows}
            onStartMenuToggle={() => setStartMenuOpen(!startMenuOpen)}
            onOpenApp={openApp}
            settings={settings}
            updateSettings={updateSettings}
            notifications={notifications}
            clearNotifications={clearNotifications}
            activeAppId={activeAppId}
          />
        </div>
      )}
    </>
  );
}

const styles = {
  bootScreen: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#050508',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999999,
  },
  bootConsole: {
    width: '460px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    color: '#a0aec0',
    fontFamily: 'var(--font-mono)',
  },
  bootLogo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '1px',
    textShadow: '0 0 10px rgba(255,255,255,0.2)',
  },
  bootSub: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '8px',
  },
  bootLogContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minHeight: '180px',
    fontSize: '12px',
  },
  bootLogLine: {
    lineHeight: '1.4',
  },
  bootGreen: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    alignSelf: 'center',
    marginTop: '12px',
  },
  powerScreen: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999999,
  },
  powerOffModal: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
    color: '#ffffff',
    padding: '32px',
    borderRadius: 'var(--border-radius-lg)',
    backgroundColor: '#09090b',
    border: '1px solid #18181b',
    maxWidth: '360px',
  },
  powerOnButton: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)',
    transition: 'transform 0.15s, background-color 0.2s',
  },
  iconsGrid: {
    position: 'absolute',
    left: '16px',
    top: '16px',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: '12px',
    maxHeight: 'calc(100% - 60px)',
    alignContent: 'flex-start',
    zIndex: 3,
  },
  toastStack: {
    position: 'absolute',
    bottom: '64px',
    right: '24px',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    pointerEvents: 'none',
  },
  toastCard: {
    width: '240px',
    padding: '10px 14px',
    pointerEvents: 'auto',
    background: 'rgba(var(--bg-panel-rgb), 0.85)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
    borderRadius: 'var(--border-radius-md)',
  },
  toastHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  toastTitle: {
    fontWeight: 'bold',
    fontSize: '11px',
    color: '#fff',
  },
  toastTime: {
    fontSize: '9px',
    color: 'var(--text-muted)',
  },
  toastMessage: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  }
};

// Injection of animations keys for Spinner
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .power-on-btn:hover {
      transform: scale(1.08) !important;
      background-color: #14d494 !important;
      box-shadow: 0 0 32px rgba(20, 212, 148, 0.6) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
