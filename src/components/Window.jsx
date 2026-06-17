import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

export default function Window({
  id,
  title,
  icon: IconComponent,
  isOpen,
  isMinimized,
  isMaximized,
  isActive,
  x,
  y,
  width,
  height,
  zIndex,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onWindowMove,
  onWindowResize,
  children
}) {
  const windowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeType, setResizeType] = useState(null); // 'r', 'b', 'se'

  // Ref to hold coords to avoid closures in event listeners
  const coordsRef = useRef({ x, y, width, height });
  useEffect(() => {
    coordsRef.current = { x, y, width, height };
  }, [x, y, width, height]);

  // Drag logic
  const handleMouseDown = (e) => {
    if (isMaximized) return;
    if (e.target.closest('button')) return; // Avoid drag on control buttons
    
    onFocus();
    
    // Check if click is on the title bar
    const titleBar = windowRef.current.querySelector('.window-titlebar');
    if (!titleBar || !titleBar.contains(e.target)) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - coordsRef.current.x,
      y: e.clientY - coordsRef.current.y
    });
    
    e.preventDefault();
  };

  // Resize start
  const handleResizeMouseDown = (type, e) => {
    if (isMaximized) return;
    onFocus();
    setIsResizing(true);
    setResizeType(type);
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        onWindowMove(id, newX, newY);
      } else if (isResizing) {
        const currentCoords = coordsRef.current;
        let newWidth = currentCoords.width;
        let newHeight = currentCoords.height;

        if (resizeType === 'r' || resizeType === 'se') {
          newWidth = Math.max(300, e.clientX - currentCoords.x);
        }
        if (resizeType === 'b' || resizeType === 'se') {
          newHeight = Math.max(200, e.clientY - currentCoords.y);
        }

        onWindowResize(id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeType(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, id, resizeType]);

  // Double click title bar to maximize
  const handleTitleDoubleClick = () => {
    onMaximize(id);
  };

  if (isMinimized) return null;

  const style = {
    position: 'absolute',
    left: isMaximized ? 0 : x,
    top: isMaximized ? 0 : y,
    width: isMaximized ? '100%' : width,
    height: isMaximized ? 'calc(100% - 48px)' : height, // Subtract taskbar height if maximized
    zIndex: zIndex,
    display: isOpen ? 'flex' : 'none',
    boxShadow: isActive ? '0 20px 50px rgba(0, 0, 0, 0.4)' : '0 10px 25px rgba(0,0,0,0.25)',
    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
  };

  return (
    <motion.div
      ref={windowRef}
      style={style}
      className="glass-window"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: parseFloat(document.documentElement.style.getPropertyValue('--anim-speed') || '0.3') }}
      onMouseDown={onFocus}
    >
      {/* Title Bar */}
      <div 
        className="window-titlebar" 
        style={{
          ...styles.titlebar,
          backgroundColor: isActive ? 'rgba(var(--bg-panel-rgb), 0.3)' : 'rgba(var(--bg-panel-rgb), 0.1)'
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTitleDoubleClick}
      >
        <div style={styles.titleInfo}>
          {IconComponent && <IconComponent size={15} style={styles.titleIcon} />}
          <span style={styles.titleText}>{title}</span>
        </div>

        <div style={styles.controls}>
          <button onClick={() => onMinimize(id)} style={styles.controlBtn} title="Minimize">
            <Minus size={14} />
          </button>
          <button onClick={() => onMaximize(id)} style={styles.controlBtn} title="Maximize">
            <Square size={10} />
          </button>
          <button onClick={() => onClose(id)} style={{ ...styles.controlBtn, ...styles.closeBtn }} title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Window Body Container */}
      <div style={styles.content}>
        {children}
      </div>

      {/* Resize handles */}
      {!isMaximized && (
        <>
          <div 
            style={styles.resizeRight} 
            onMouseDown={(e) => handleResizeMouseDown('r', e)}
          />
          <div 
            style={styles.resizeBottom} 
            onMouseDown={(e) => handleResizeMouseDown('b', e)}
          />
          <div 
            style={styles.resizeBottomRight} 
            onMouseDown={(e) => handleResizeMouseDown('se', e)}
          />
        </>
      )}
    </motion.div>
  );
}

const styles = {
  titlebar: {
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    borderBottom: '1px solid var(--border-glass)',
    cursor: 'default',
    userSelect: 'none',
  },
  titleInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  titleIcon: {
    color: 'var(--accent)',
  },
  titleText: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-main)',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  controlBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  content: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(var(--bg-window-rgb), 0.95)',
  },
  resizeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '6px',
    height: '100%',
    cursor: 'ew-resize',
    zIndex: 9999,
  },
  resizeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '6px',
    cursor: 'ns-resize',
    zIndex: 9999,
  },
  resizeBottomRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '12px',
    height: '12px',
    cursor: 'nwse-resize',
    zIndex: 10000,
  }
};
