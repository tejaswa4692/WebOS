import React, { useRef, useEffect } from 'react';
import { setCanvasContext } from '../utils/pyrite';

export default function PyriteGuiAppWindow({ guiConfig }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let active = true;

    const loop = () => {
      if (!active) return;

      const draw = guiConfig.getDraw();
      if (draw) {
        setCanvasContext(ctx);
        try {
          draw();
        } catch (err) {
          console.error("Pyrite GUI Draw Error:", err);
        }
        setCanvasContext(null);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    // Focus container on mount for immediate keyboard events
    containerRef.current?.focus();

    return () => {
      active = false;
    };
  }, [guiConfig]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const click = guiConfig.getClick();
    if (click) {
      try {
        click(x, y);
      } catch (err) {
        console.error("Pyrite GUI Click Error:", err);
      }
    }
  };

  const handleKeyDown = (e) => {
    const keyPress = guiConfig.getKey();
    if (keyPress) {
      try {
        keyPress(e.key);
      } catch (err) {
        console.error("Pyrite GUI Key Error:", err);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      style={styles.container}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <canvas 
        ref={canvasRef}
        width={guiConfig.width}
        height={guiConfig.height}
        onClick={handleCanvasClick}
        style={styles.canvas}
      />
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090d16',
    outline: 'none',
  },
  canvas: {
    display: 'block',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
    borderRadius: '4px',
  }
};
