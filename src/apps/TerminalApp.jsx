import React, { useState, useEffect, useRef } from 'react';

const FILES = {
  'welcome.txt': 'Welcome to TejasWa\'s Epic OS Terminal!\nFeel free to explore our virtual file system.\nType "help" to see available command instructions.',
  'system.cfg': 'kernel=V8.React.Engine\nversion=2.0.26\nhardware_acceleration=enabled\naccent=sapphire\nblur_intensity=20px',
  'manifesto.txt': 'TejasWa\'s Epic OS aims to challenge the boundaries of browser desktop interfaces.\nVisual polish, premium aesthetics, and buttery-smooth animations are our core principles.'
};

export default function TerminalApp({ settings, updateSettings }) {
  const [history, setHistory] = useState([
    { text: 'TejasWa\'s Epic OS Terminal [Version 2.0.26]', type: 'system' },
    { text: 'Type "help" for a list of available commands.', type: 'system' },
    { text: '', type: 'system' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [matrixActive, setMatrixActive] = useState(false);
  
  const consoleBottomRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // Matrix rain effect
  useEffect(() => {
    if (!matrixActive || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const columns = Math.floor(canvas.width / 14);
    const rainDrops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0'; // Green text
      ctx.font = '14px monospace';

      for (let i = 0; i < rainDrops.length; i++) {
        const text = String.fromCharCode(Math.floor(33 + Math.random() * 93));
        const x = i * 14;
        const y = rainDrops[i] * 14;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [matrixActive]);

  const handleCommand = (e) => {
    e.preventDefault();
    const cmdStr = inputVal.trim();
    if (!cmdStr) return;

    const args = cmdStr.split(' ');
    const command = args[0].toLowerCase();
    
    // Add command to history
    const newHistory = [...history, { text: `tejaswas-webos> ${cmdStr}`, type: 'input' }];

    switch (command) {
      case 'help':
        newHistory.push({
          text: `Available Commands:
  help               Display this information guide
  clear              Clear the terminal console screen
  neofetch           View visual system architecture diagnostics
  ls                 List items in the active directory
  cat [filename]     Read file contents
  theme [color]      Change accent color (sapphire, emerald, sunset, ruby, purple)
  date               Display current local system clock
  joke               Trigger a random developer joke
  matrix             Toggle the green code rain digital background
  exit               Close the terminal shell`,
          type: 'response'
        });
        break;

      case 'clear':
        setHistory([]);
        setInputVal('');
        return;

      case 'neofetch':
        newHistory.push({
          text: `             /\\\\         OS: TejasWa's Epic OS Hackathon Edition
            /  \\\\        Kernel: Web-React-Electron-Kernel v9.4
           /    \\\\       Shell: Powershell-JS v2.0
          /  /\\  \\\\      Uptime: 2h 43m
         /  /  \\  \\\\     Resolution: ${window.innerWidth}x${window.innerHeight}
        /  /____\\  \\\\    Theme: Accent: ${settings.accentColor.toUpperCase()} | Theme: ${settings.theme.toUpperCase()}
       /  /======\\  \\   CPU: Virtual WebOS Quantum Core (8 Cores)
      /  /        \\  \\\\  GPU: WebGL 2.0 Hardware Accelerated
     /__/          \\__\\\\ Memory: 4.8 GB / 16.0 GB (30% used)
`,
          type: 'response_mono'
        });
        break;

      case 'ls':
        newHistory.push({
          text: Object.keys(FILES).join('    '),
          type: 'response'
        });
        break;

      case 'cat':
        const filename = args[1];
        if (!filename) {
          newHistory.push({ text: 'Error: Please specify a file. Usage: cat [filename]', type: 'error' });
        } else if (FILES[filename]) {
          newHistory.push({ text: FILES[filename], type: 'response' });
        } else {
          newHistory.push({ text: `Error: File "${filename}" not found.`, type: 'error' });
        }
        break;

      case 'theme':
        const newAccent = args[1]?.toLowerCase();
        const validAccents = ['sapphire', 'emerald', 'sunset', 'ruby', 'purple'];
        if (!newAccent) {
          newHistory.push({ text: 'Usage: theme [sapphire | emerald | sunset | ruby | purple]', type: 'response' });
        } else if (validAccents.includes(newAccent)) {
          updateSettings({ accentColor: newAccent });
          newHistory.push({ text: `Accent color successfully changed to ${newAccent}!`, type: 'response' });
        } else {
          newHistory.push({ text: `Error: Unknown accent color "${newAccent}". Try: ${validAccents.join(', ')}`, type: 'error' });
        }
        break;

      case 'date':
        newHistory.push({ text: `Current Date: ${new Date().toString()}`, type: 'response' });
        break;

      case 'joke':
        const jokes = [
          "Why do programmers wear glasses? Because they can't C#!",
          "There are 10 types of people in this world: those who understand binary, and those who don't.",
          "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
          "What is a programmer's favorite hangout place? Foo Bar!",
          "A SQL query goes into a bar, walks up to two tables and asks, 'Can I join you?'"
        ];
        newHistory.push({ text: jokes[Math.floor(Math.random() * jokes.length)], type: 'response' });
        break;

      case 'matrix':
        setMatrixActive(!matrixActive);
        newHistory.push({ text: `Matrix rain effect has been ${!matrixActive ? 'ACTIVATED' : 'DEACTIVATED'}.`, type: 'response' });
        break;

      case 'exit':
        newHistory.push({ text: 'Closing session...', type: 'system' });
        // Normally closes the window, we can just log
        break;

      default:
        newHistory.push({ text: `Command not found: "${command}". Type "help" for instructions.`, type: 'error' });
    }

    setHistory(newHistory);
    setInputVal('');
  };

  return (
    <div style={styles.container}>
      {matrixActive && (
        <div style={styles.matrixContainer}>
          <canvas ref={canvasRef} style={styles.canvas}></canvas>
          <button 
            onClick={() => setMatrixActive(false)}
            className="exit-matrix-btn"
            style={styles.exitMatrixBtn}
          >
            Exit Matrix (Press to Return)
          </button>
        </div>
      )}

      <div style={styles.terminalScreen}>
        <div style={styles.historyContainer}>
          {history.map((line, idx) => (
            <div 
              key={idx} 
              style={{
                ...styles.line,
                ...styles[line.type]
              }}
            >
              {line.text}
            </div>
          ))}
          <div ref={consoleBottomRef}></div>
        </div>

        <form onSubmit={handleCommand} style={styles.promptForm}>
          <span style={styles.promptSign}>tejaswas-webos&gt;</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={styles.promptInput}
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#050508',
    color: '#39ff14', // Matrix green color scheme default
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  matrixContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
  },
  canvas: {
    flex: 1,
    display: 'block',
  },
  exitMatrixBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    border: '1px solid #0f0',
    color: '#0f0',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  terminalScreen: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  historyContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  line: {
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
  },
  system: {
    color: '#a0aec0',
  },
  input: {
    color: '#f7fafc',
    fontWeight: 'bold',
  },
  response: {
    color: '#38b2ac',
  },
  response_mono: {
    color: '#805ad5',
    fontFamily: 'var(--font-mono)',
  },
  error: {
    color: '#f56565',
  },
  promptForm: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '6px',
  },
  promptSign: {
    color: '#a855f7', // Purple prompt color
    fontWeight: 'bold',
    marginRight: '8px',
  },
  promptInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#e2e8f0',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
  }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .exit-matrix-btn:hover {
      background-color: #0f0 !important;
      color: #000 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
