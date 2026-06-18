import React, { useRef, useState, useEffect } from 'react';
import { Palette, Trash2, Download, Square } from 'lucide-react';

const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Ruby', hex: '#ef4444' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Sapphire', hex: '#0066ff' },
  { name: 'Sunset', hex: '#f97316' },
  { name: 'Cyber Purple', hex: '#a855f7' }
];

export default function PaintApp() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0066ff');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush'); // brush, eraser, bucket
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Initialize Canvas background to white on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set fixed sizes or dynamic based on container
    canvas.width = canvas.parentElement.clientWidth || 550;
    canvas.height = canvas.parentElement.clientHeight - 60 || 320;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid helper (subtle dot patterns on paper)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let x = 8; x < canvas.width; x += 16) {
      for (let y = 8; y < canvas.height; y += 16) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Handle touches vs mouse
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const coords = getCoordinates(e);
    
    if (tool === 'bucket') {
      floodFill(coords.x, coords.y);
    } else {
      setLastPos(coords);
      setIsDrawing(true);
    }
  };

  const draw = (e) => {
    if (!isDrawing || tool === 'bucket') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const coords = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(coords.x, coords.y);
    
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    setLastPos(coords);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const floodFill = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Get the color of the clicked pixel
    const index = (Math.floor(y) * width + Math.floor(x)) * 4;
    const targetR = data[index];
    const targetG = data[index + 1];
    const targetB = data[index + 2];
    const targetA = data[index + 3];
    
    // Get fill color
    const fillRgb = hexToRgb(color);
    const fillR = fillRgb.r;
    const fillG = fillRgb.g;
    const fillB = fillRgb.b;
    
    // Check if colors are already the same
    if (targetR === fillR && targetG === fillG && targetB === fillB) {
      return;
    }
    
    // BFS flood fill
    const queue = [[Math.floor(x), Math.floor(y)]];
    const visited = new Set();
    
    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      
      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
      
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      
      const pixelIndex = (cy * width + cx) * 4;
      
      if (data[pixelIndex] === targetR && 
          data[pixelIndex + 1] === targetG && 
          data[pixelIndex + 2] === targetB && 
          data[pixelIndex + 3] === targetA) {
        
        data[pixelIndex] = fillR;
        data[pixelIndex + 1] = fillG;
        data[pixelIndex + 2] = fillB;
        
        queue.push([cx + 1, cy]);
        queue.push([cx - 1, cy]);
        queue.push([cx, cy + 1]);
        queue.push([cx, cy - 1]);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw grid
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let x = 8; x < canvas.width; x += 16) {
      for (let y = 8; y < canvas.height; y += 16) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `paint_artwork_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div style={styles.container}>
      {/* Control Panel */}
      <div style={styles.toolbar}>
        {/* Presets */}
        <div style={styles.toolGroup}>
          <button 
            onClick={() => setTool('brush')}
            style={{ ...styles.toolBtn, ...(tool === 'brush' ? styles.toolBtnActive : {}) }}
          >
            ✏️ Brush
          </button>
          <button 
            onClick={() => setTool('eraser')}
            style={{ ...styles.toolBtn, ...(tool === 'eraser' ? styles.toolBtnActive : {}) }}
          >
            🧹 Eraser
          </button>
          <button 
            onClick={() => setTool('bucket')}
            style={{ ...styles.toolBtn, ...(tool === 'bucket' ? styles.toolBtnActive : {}) }}
          >
            🪣 Bucket
          </button>
        </div>

        {/* Brush Size */}
        <div style={styles.sizeControl}>
          <span style={styles.label}>Size: {brushSize}px</span>
          <input
            type="range"
            min="1"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={styles.sizeSlider}
          />
        </div>

        {/* Color Palette */}
        {(tool === 'brush' || tool === 'bucket') && (
          <div style={styles.colorPalette}>
            {COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                style={{ 
                  ...styles.colorCircle, 
                  backgroundColor: c.hex,
                  borderColor: color === c.hex ? 'var(--accent)' : 'rgba(0, 0, 0, 0.25)',
                  transform: color === c.hex ? 'scale(1.15)' : 'none'
                }}
                title={c.name}
              />
            ))}
            <input 
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={styles.colorPicker}
            />
          </div>
        )}

        {/* Action Controls */}
        <div style={styles.actionGroup}>
          <button onClick={clearCanvas} className="paint-action-btn" style={styles.actionBtn} title="Clear Canvas">
            <Trash2 size={15} /> Clear
          </button>
          <button onClick={downloadImage} className="paint-action-btn" style={{ ...styles.actionBtn, backgroundColor: 'var(--accent)', color: '#fff' }} title="Download Image">
            <Download size={15} /> Save
          </button>
        </div>
      </div>

      {/* Canvas Drawing viewport */}
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{...styles.canvas, cursor: tool === 'bucket' ? 'pointer' : 'crosshair'}}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  toolbar: {
    height: '52px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    justifyContent: 'space-between',
    gap: '12px',
    zIndex: 10,
  },
  toolGroup: {
    display: 'flex',
    gap: '4px',
  },
  toolBtn: {
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#334155',
    transition: 'all 0.15s ease',
  },
  toolBtnActive: {
    backgroundColor: 'var(--accent-light)',
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
  },
  sizeControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontSize: '11px',
    color: '#475569',
    fontWeight: '600',
    width: '68px',
  },
  sizeSlider: {
    width: '80px',
    cursor: 'pointer',
  },
  colorPalette: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  colorCircle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid transparent',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
  },
  colorPicker: {
    border: 'none',
    background: 'none',
    outline: 'none',
    width: '24px',
    height: '24px',
    padding: 0,
    cursor: 'pointer',
  },
  actionGroup: {
    display: 'flex',
    gap: '6px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#fff',
    color: '#334155',
    transition: 'all 0.1s ease',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: '8px',
    display: 'flex',
  },
  canvas: {
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
    borderRadius: '6px',
    margin: 'auto',
  }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .paint-action-btn:hover {
      background-color: #f1f5f9 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
