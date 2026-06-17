import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, WifiOff, Volume2, VolumeX, Battery, BatteryCharging, 
  Bell, Calendar as CalendarIcon, Sliders, Moon, Sun, 
  Bluetooth, Shield, Compass, Check, AlertCircle, Trash2
} from 'lucide-react';

const PINNED_APPS = [
  { id: 'settings', title: 'Settings', icon: '⚙️' },
  { id: 'music', title: 'Music Player', icon: '🎵' },
  { id: 'terminal', title: 'Terminal', icon: '💻' },
  { id: 'browser', title: 'Browser', icon: '🌐' },
  { id: 'notes', title: 'Notes', icon: '📝' },
  { id: 'paint', title: 'Paint', icon: '🎨' }
];

export default function Taskbar({
  activeWindows,
  onStartMenuToggle,
  onOpenApp,
  settings,
  updateSettings,
  notifications,
  clearNotifications,
  activeAppId
}) {
  const [time, setTime] = useState(new Date());
  
  // Flyouts state
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Quick settings state
  const [wifiConnected, setWifiConnected] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [airplaneMode, setAirplaneMode] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isCharging, setIsCharging] = useState(false);

  // Update clock time
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update battery status mock simulation
  useEffect(() => {
    const batTimer = setInterval(() => {
      setBatteryLevel(prev => {
        if (prev <= 10) {
          setIsCharging(true);
          return 11;
        }
        if (prev >= 100) {
          setIsCharging(false);
          return 99;
        }
        return isCharging ? prev + 1 : prev - 1;
      });
    }, 60000);
    return () => clearInterval(batTimer);
  }, [isCharging]);

  // Click outside listener to close flyouts
  const taskbarRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (taskbarRef.current && !taskbarRef.current.contains(e.target)) {
        setShowControlCenter(false);
        setShowCalendar(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Date formatting options based on Settings
  const formatTimeStr = () => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.timeFormat === '12h'
    };
    return time.toLocaleTimeString([], options);
  };

  const formatDateStr = () => {
    const format = settings.dateFormat || 'MM/DD/YYYY';
    const d = time;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    if (format === 'DD/MM/YYYY') return `${dd}/${mm}/${yyyy}`;
    if (format === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
    return `${mm}/${dd}/${yyyy}`; // MM/DD/YYYY default
  };

  const activeAppIds = activeWindows.filter(w => w.isOpen).map(w => w.id);

  // Generate dynamic days array for Calendar
  const getCalendarDays = () => {
    const days = [];
    const date = new Date(time.getFullYear(), time.getMonth(), 1);
    const startDay = date.getDay();
    const totalDays = new Date(time.getFullYear(), time.getMonth() + 1, 0).getDate();
    
    // Add empty spacer cells for padding
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  };

  const handleTaskbarIconClick = (appId) => {
    onOpenApp(appId);
    setShowControlCenter(false);
    setShowCalendar(false);
    setShowNotifications(false);
  };

  return (
    <div ref={taskbarRef} style={styles.container} className="glass-panel">
      {/* Start Button */}
      <button 
        onClick={onStartMenuToggle}
        style={styles.startBtn}
        className="interactive-btn"
      >
        <span style={{ fontSize: '18px', filter: 'drop-shadow(0 0 4px var(--accent))' }}>⌬</span>
      </button>

      {/* Pinned / Open Apps Dock */}
      <div style={styles.dock}>
        {PINNED_APPS.map(app => {
          const isRunning = activeAppIds.includes(app.id);
          const isActive = activeAppId === app.id;
          
          return (
            <div 
              key={app.id}
              onClick={() => handleTaskbarIconClick(app.id)}
              style={styles.dockItemContainer}
              title={app.title}
            >
              <div 
                style={{
                  ...styles.dockIcon,
                  transform: isActive ? 'scale(1.1) translateY(-2px)' : 'none',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  borderColor: isActive ? 'var(--accent)' : 'transparent',
                }}
                className="taskbar-app-icon"
              >
                {app.icon}
              </div>
              
              {/* Dynamic status indicators */}
              {isRunning && (
                <div 
                  style={{
                    ...styles.indicatorDot,
                    width: isActive ? '12px' : '4px',
                    borderRadius: isActive ? '2px' : '50%',
                    backgroundColor: isActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.5)'
                  }} 
                />
              )}
            </div>
          );
        })}
      </div>

      {/* System Tray Controls */}
      <div style={styles.tray}>
        {/* Notifications Icon with Indicator */}
        <button 
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowControlCenter(false);
            setShowCalendar(false);
          }}
          style={styles.trayIconBtn}
          className="interactive-btn"
        >
          <Bell size={15} />
          {notifications.length > 0 && (
            <span style={styles.badge}>{notifications.length}</span>
          )}
        </button>

        {/* Quick Settings Group */}
        <button 
          onClick={() => {
            setShowControlCenter(!showControlCenter);
            setShowNotifications(false);
            setShowCalendar(false);
          }}
          style={styles.quickSettingsBtn}
          className="interactive-btn"
        >
          {wifiConnected ? <Wifi size={14} /> : <WifiOff size={14} color="#ef4444" />}
          <Volume2 size={14} />
          <div style={styles.batteryGroup}>
            <Battery size={14} style={{ transform: 'rotate(0deg)' }} />
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{batteryLevel}%</span>
          </div>
        </button>

        {/* Live Clock Calendar Indicator */}
        <button 
          onClick={() => {
            setShowCalendar(!showCalendar);
            setShowControlCenter(false);
            setShowNotifications(false);
          }}
          style={styles.clockBtn}
          className="interactive-btn"
        >
          <span style={styles.clockTime}>{formatTimeStr()}</span>
          <span style={styles.clockDate}>{formatDateStr()}</span>
        </button>
      </div>

      {/* Floating Control Center Panel */}
      <AnimatePresence>
        {showControlCenter && (
          <motion.div 
            className="glass-panel" 
            style={styles.controlCenter}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Action Toggles Row */}
            <div style={styles.quickGrid}>
              <button 
                onClick={() => setWifiConnected(!wifiConnected)}
                style={{ ...styles.quickCell, ...(wifiConnected ? styles.quickCellActive : {}) }}
              >
                {wifiConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span>Wi-Fi</span>
              </button>

              <button 
                onClick={() => setBluetoothOn(!bluetoothOn)}
                style={{ ...styles.quickCell, ...(bluetoothOn ? styles.quickCellActive : {}) }}
              >
                <Bluetooth size={16} />
                <span>Bluetooth</span>
              </button>

              <button 
                onClick={() => {
                  const targetTheme = settings.theme === 'dark' ? 'light' : 'dark';
                  updateSettings({ theme: targetTheme });
                }}
                style={{ ...styles.quickCell, ...(settings.theme === 'dark' ? styles.quickCellActive : {}) }}
              >
                {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span>Dark Mode</span>
              </button>
            </div>

            {/* Volume Control Slider Widget */}
            <div style={styles.settingSliderRow}>
              <Volume2 size={16} color="var(--text-secondary)" />
              <input 
                type="range"
                className="glass-slider"
                style={{ flex: 1 }}
                min="0"
                max="100"
                defaultValue="70"
              />
            </div>

            {/* Battery Health Section */}
            <div style={styles.batteryStatusCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Battery Power Status</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {isCharging ? 'Charging' : 'On Battery Power'}
                </span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${batteryLevel}%`, backgroundColor: batteryLevel < 20 ? '#ef4444' : 'var(--accent)' }}></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {batteryLevel}% remaining • Power saver mode inactive
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Clock / Calendar expansion panel */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div 
            className="glass-panel" 
            style={styles.calendarPanel}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Header info */}
            <div style={styles.calHeader}>
              <span style={styles.calMonthText}>
                {time.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Week header titles */}
            <div style={styles.calWeekdays}>
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            {/* Days grid layout */}
            <div style={styles.calGrid}>
              {getCalendarDays().map((day, idx) => {
                const isToday = day === time.getDate();
                return (
                  <div 
                    key={idx} 
                    style={{
                      ...styles.calCell,
                      ...(isToday ? styles.calTodayCell : {}),
                      opacity: day === null ? 0 : 1
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            <div style={styles.calFooter}>
              <CalendarIcon size={12} color="var(--accent)" />
              <span>No meetings scheduled today.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Notifications Popover Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            className="glass-panel" 
            style={styles.notificationsPanel}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div style={styles.notifHeader}>
              <span style={{ fontWeight: '700', fontSize: '13px' }}>System Notifications</span>
              {notifications.length > 0 && (
                <button onClick={clearNotifications} style={styles.clearAllBtn}>
                  <Trash2 size={12} /> Clear All
                </button>
              )}
            </div>

            <div style={styles.notifList}>
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div key={n.id} style={styles.notifCard} className="notif-card-fade">
                    <div style={styles.notifIcon}>
                      <AlertCircle size={14} color="var(--accent)" />
                    </div>
                    <div style={styles.notifContent}>
                      <div style={styles.notifTitle}>{n.title}</div>
                      <div style={styles.notifMessage}>{n.message}</div>
                      <div style={styles.notifTime}>{n.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.notifEmpty}>
                  <Bell size={24} color="var(--text-muted)" />
                  <span>No active notifications.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: {
    height: '48px',
    margin: '0 16px 12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
    background: 'rgba(var(--bg-panel-rgb), 0.7)',
    backdropFilter: 'blur(var(--blur-intensity)) saturate(130%)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    zIndex: 999999,
  },
  startBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    borderRadius: 'var(--border-radius-sm)',
    fontWeight: 'bold',
  },
  dock: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  dockItemContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    cursor: 'pointer',
    width: '42px',
  },
  dockIcon: {
    width: '32px',
    height: '32px',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid transparent',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  indicatorDot: {
    height: '4px',
    marginTop: '2px',
    transition: 'all 0.2s ease',
  },
  tray: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  trayIconBtn: {
    padding: '8px',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    display: 'flex',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '8px',
    fontWeight: 'bold',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--accent-glow)',
  },
  quickSettingsBtn: {
    padding: '6px 10px',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  batteryGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  clockBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '4px 10px',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-main)',
  },
  clockTime: {
    fontSize: '12px',
    fontWeight: '600',
  },
  clockDate: {
    fontSize: '9px',
    color: 'var(--text-secondary)',
  },
  controlCenter: {
    position: 'absolute',
    bottom: '56px',
    right: '84px',
    width: '260px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'rgba(var(--bg-panel-rgb), 0.82)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  quickCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 4px',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-main)',
    fontSize: '10px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  quickCellActive: {
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    borderColor: 'var(--accent)',
    boxShadow: 'var(--accent-glow)',
  },
  settingSliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(0, 0, 0, 0.15)',
    padding: '10px 12px',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-glass)',
  },
  batteryStatusCard: {
    background: 'rgba(0,0,0,0.15)',
    padding: '10px 12px',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  calendarPanel: {
    position: 'absolute',
    bottom: '56px',
    right: '10px',
    width: '260px',
    padding: '16px',
    background: 'rgba(var(--bg-panel-rgb), 0.82)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  calHeader: {
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--border-glass)',
  },
  calMonthText: {
    fontFamily: 'var(--font-title)',
    fontWeight: '700',
    fontSize: '14px',
  },
  calWeekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center',
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  calGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    rowGap: '6px',
    textAlign: 'center',
  },
  calCell: {
    fontSize: '11px',
    padding: '4px 0',
    borderRadius: '4px',
    cursor: 'default',
  },
  calTodayCell: {
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    fontWeight: 'bold',
    boxShadow: 'var(--accent-glow)',
  },
  calFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '8px',
    marginTop: '4px',
  },
  notificationsPanel: {
    position: 'absolute',
    bottom: '56px',
    right: '200px',
    width: '300px',
    maxHeight: '360px',
    background: 'rgba(var(--bg-panel-rgb), 0.85)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  notifHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearAllBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: 'var(--accent)',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  notifList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  notifCard: {
    display: 'flex',
    gap: '10px',
    padding: '10px',
    backgroundColor: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--border-radius-md)',
  },
  notifIcon: {
    display: 'flex',
    alignItems: 'flex-start',
    marginTop: '2px',
  },
  notifContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  notifTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  notifMessage: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: '1.3',
  },
  notifTime: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  notifEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    fontSize: '12px',
    padding: '40px 0',
  }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .taskbar-app-icon:hover {
      transform: scale(1.15) translateY(-3px) !important;
      background: rgba(255,255,255,0.06) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
