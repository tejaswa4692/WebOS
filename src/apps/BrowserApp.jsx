import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, Bookmark, Globe } from 'lucide-react';

export default function BrowserApp() {
  const [url, setUrl] = useState('moogle://search');
  const [inputUrl, setInputUrl] = useState('moogle://search');
  const [history, setHistory] = useState(['moogle://search']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Snake Game state variables
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  const navigateTo = (targetUrl) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(targetUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setUrl(targetUrl);
    setInputUrl(targetUrl);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const targetUrl = history[historyIndex - 1];
      setUrl(targetUrl);
      setInputUrl(targetUrl);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const targetUrl = history[historyIndex + 1];
      setUrl(targetUrl);
      setInputUrl(targetUrl);
    }
  };

  const handleRefresh = () => {
    // Reset snake game if on arcade url
    if (url === 'moogle://arcade') {
      setGameOver(false);
      setScore(0);
      setGameActive(true);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    let target = inputUrl.trim();
    if (!target.startsWith('moogle://') && !target.startsWith('http://') && !target.startsWith('https://')) {
      target = `moogle://search?q=${encodeURIComponent(target)}`;
    }
    navigateTo(target);
  };

  // Snake Arcade Game loop
  useEffect(() => {
    if (url !== 'moogle://arcade' || !canvasRef.current) {
      setGameActive(false);
      return;
    }
    
    setGameActive(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let grid = 16;
    let count = 0;
    
    let snake = {
      x: 160,
      y: 160,
      dx: grid,
      dy: 0,
      cells: [{x: 160, y: 160}, {x: 144, y: 160}, {x: 128, y: 160}],
      maxCells: 3
    };
    
    let apple = {
      x: 320,
      y: 320
    };

    let localScore = 0;
    setScore(0);
    setGameOver(false);

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    let animationId;

    const gameLoop = () => {
      if (!gameActive) return;
      animationId = requestAnimationFrame(gameLoop);

      // Slow down loop to 10 FPS
      if (++count < 6) {
        return;
      }
      count = 0;

      ctx.clearRect(0,0,canvas.width,canvas.height);

      // Move snake
      snake.x += snake.dx;
      snake.y += snake.dy;

      // Wrap snake positions horizontally on edge of screen
      if (snake.x < 0) snake.x = canvas.width - grid;
      else if (snake.x >= canvas.width) snake.x = 0;
      
      // Wrap snake positions vertically on edge of screen
      if (snake.y < 0) snake.y = canvas.height - grid;
      else if (snake.y >= canvas.height) snake.y = 0;

      // Keep track of where snake has been. Front of the array is always the head
      snake.cells.unshift({x: snake.x, y: snake.y});

      // Remove cells as we move away from them
      if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
      }

      // Draw apple
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(apple.x, apple.y, grid - 1, grid - 1, 4);
      ctx.fill();

      // Draw snake
      ctx.fillStyle = '#10b981';
      snake.cells.forEach((cell, index) => {
        // Draw head slightly different color
        ctx.fillStyle = index === 0 ? '#34d399' : '#059669';
        
        ctx.beginPath();
        ctx.roundRect(cell.x, cell.y, grid - 1, grid - 1, 3);
        ctx.fill();

        // Snake ate apple
        if (cell.x === apple.x && cell.y === apple.y) {
          snake.maxCells++;
          localScore += 10;
          setScore(localScore);
          
          if (localScore > highScore) {
            setHighScore(localScore);
          }

          // Canvas dimensions: 400x300
          apple.x = getRandomInt(0, 25) * grid;
          apple.y = getRandomInt(0, 18) * grid;
        }

        // Check collision with all cells after this one (body collision)
        for (let i = index + 1; i < snake.cells.length; i++) {
          if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
            setGameOver(true);
            cancelAnimationFrame(animationId);
          }
        }
      });
    };

    const handleKeyDown = (e) => {
      // Prevent screen scroll keys inside terminal/browser
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' && snake.dx === 0) {
        snake.dx = -grid;
        snake.dy = 0;
      }
      else if (e.key === 'ArrowUp' && snake.dy === 0) {
        snake.dy = -grid;
        snake.dx = 0;
      }
      else if (e.key === 'ArrowRight' && snake.dx === 0) {
        snake.dx = grid;
        snake.dy = 0;
      }
      else if (e.key === 'ArrowDown' && snake.dy === 0) {
        snake.dy = grid;
        snake.dx = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [url, gameActive]);

  // Query parameter parsing
  const getSearchQuery = () => {
    if (url.includes('?q=')) {
      const parts = url.split('?q=');
      return decodeURIComponent(parts[1]);
    }
    return '';
  };

  const searchQuery = getSearchQuery();

  return (
    <div style={styles.container}>
      {/* Top control bar */}
      <div style={styles.browserHeader}>
        <div style={styles.controlsLeft}>
          <button onClick={handleBack} disabled={historyIndex === 0} className="nav-btn" style={styles.navBtn}>
            <ArrowLeft size={16} />
          </button>
          <button onClick={handleForward} disabled={historyIndex === history.length - 1} className="nav-btn" style={styles.navBtn}>
            <ArrowRight size={16} />
          </button>
          <button onClick={handleRefresh} className="nav-btn" style={styles.navBtn}>
            <RotateCw size={14} />
          </button>
          <button onClick={() => navigateTo('moogle://search')} className="nav-btn" style={styles.navBtn}>
            <Home size={16} />
          </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleUrlSubmit} style={styles.addressBarForm}>
          <Globe size={14} color="var(--text-muted)" style={{ marginLeft: '8px' }} />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            style={styles.addressInput}
          />
        </form>
      </div>

      {/* Bookmarks */}
      <div style={styles.bookmarksBar}>
        <button onClick={() => navigateTo('moogle://search')} className="bookmark-btn" style={styles.bookmarkBtn}>
          🔍 MoogleSearch
        </button>
        <button onClick={() => navigateTo('moogle://wiki')} className="bookmark-btn" style={styles.bookmarkBtn}>
          📖 Wiki: Moogle
        </button>
        <button onClick={() => navigateTo('moogle://arcade')} className="bookmark-btn" style={styles.bookmarkBtn}>
          🎮 Retro Arcade: Snake
        </button>
      </div>

      {/* Main Browser Viewport */}
      <div style={styles.viewport}>
        
        {/* MoogleSearch (Search Engine Page) */}
        {url.startsWith('moogle://search') && (
          <div style={styles.searchPage} className="fade-in">
            {!searchQuery ? (
              // Main search homepage
              <div style={styles.searchCenter}>
                <div style={styles.searchLogo}>
                  <span style={{ color: '#0066ff' }}>M</span>
                  <span style={{ color: '#ef4444' }}>o</span>
                  <span style={{ color: '#f97316' }}>o</span>
                  <span style={{ color: '#10b981' }}>g</span>
                  <span style={{ color: '#a855f7' }}>l</span>
                  <span style={{ color: '#ef4444' }}>e</span>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const query = e.target.query.value;
                    navigateTo(`moogle://search?q=${encodeURIComponent(query)}`);
                  }}
                  style={styles.searchForm}
                >
                  <Search size={18} color="var(--text-muted)" style={{ marginLeft: 12 }} />
                  <input name="query" type="text" placeholder="Search the virtual web..." style={styles.searchFormInput} autoFocus />
                  <button type="submit" className="search-submit-btn" style={styles.searchSubmitBtn}>Search</button>
                </form>
                <div style={styles.trendingContainer}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trending: </span>
                  <span onClick={() => navigateTo('moogle://search?q=Space%20Travel')} style={styles.trendLink}>Space Travel</span>
                  <span onClick={() => navigateTo('moogle://wiki')} style={styles.trendLink}>Quantum Engine</span>
                  <span onClick={() => navigateTo('moogle://arcade')} style={styles.trendLink}>Play Retro Arcade</span>
                </div>
              </div>
            
            ) : (
              // Search results page
              <div style={styles.resultsPage}>
                <div style={styles.resultsHeader}>
                  <div style={styles.resultsLogo} onClick={() => navigateTo('moogle://search')}>Moogle</div>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const query = e.target.query.value;
                      navigateTo(`moogle://search?q=${encodeURIComponent(query)}`);
                    }}
                    style={styles.resultsSearchForm}
                  >
                    <input name="query" type="text" defaultValue={searchQuery} style={styles.resultsInput} />
                    <button type="submit" style={styles.resultsSearchBtn}><Search size={14} /></button>
                  </form>
                </div>

                <div style={styles.resultsContainer}>
                  <div style={styles.resultsStats}>About 3 results found for "{searchQuery}"</div>
                  
                  {/* Result 1 */}
                  <div style={styles.resultItem}>
                    <div style={styles.resultLink}>https://en.wikipedia.org/wiki/Moogle</div>
                    <div style={styles.resultTitle} onClick={() => navigateTo('moogle://wiki')}>
                      Moogle - WikiWeb Encyclopedia
                    </div>
                    <div style={styles.resultSnippet}>
                      Moogle is a hypothetical force or device that cancels or negates gravity. It is a recurring concept in science fiction, particularly in spacecraft propulsion. Explore equations...
                    </div>
                  </div>

                  {/* Result 2 */}
                  <div style={styles.resultItem}>
                    <div style={styles.resultLink}>https://moogle-arcade.net/play-snake</div>
                    <div style={styles.resultTitle} onClick={() => navigateTo('moogle://arcade')}>
                      Play Space Snake - Premium Retro Arcade Room
                    </div>
                    <div style={styles.resultSnippet}>
                      Control the pixel serpent in zero gravity. Collect cosmic apples, dodge your own tail, and challenge your high scores in this canvas simulation. Fully GPU-accelerated.
                    </div>
                  </div>

                  {/* Result 3 */}
                  <div style={styles.resultItem}>
                    <div style={styles.resultLink}>https://moogle-os.org/about</div>
                    <div style={styles.resultTitle}>
                      TejasWa's Epic OS - Next Generation Web Operating System
                    </div>
                    <div style={styles.resultSnippet}>
                      A gorgeous desktop portal that runs entirely inside your browser. Developed for extreme visual polish and premium desktop experience with fluid draggable windows and dynamic blur widgets.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wiki Gravity (Wikipedia page) */}
        {url.startsWith('moogle://wiki') && (
          <div style={styles.wikiPage} className="fade-in">
            <div style={styles.wikiHeader}>
              <div style={styles.wikiLogo}>WikiWeb</div>
              <div style={styles.wikiSubtitle}>The Free Encyclopedia</div>
            </div>
            
            <div style={styles.wikiContent}>
              <h1 style={styles.wikiTitle}>Moogle Physics</h1>
              <div style={styles.wikiBanner}>This article describes a theoretical construct. For real propulsion systems, see Spaceflight.</div>
              
              <p style={styles.wikiPara}>
                <b>Moogle</b> is the idea of creating a place or object that is free from the force of gravity. It does not refer to the state of weightlessness under gravity experienced in free fall or orbit, nor to balancing the force of gravity with some other force, such as aerodynamics or electromagnetic levitation.
              </p>

              <h3 style={styles.wikiSectionHdr}>Theoretical Hypotheses</h3>
              <p style={styles.wikiPara}>
                In Newton's law of universal gravitation, gravity was a pull force. In Albert Einstein's general theory of relativity, gravity is a geometric consequence of spacetime curvature. Under general relativity, gravity is not an attractive force but a result of mass bending space. Under this geometry, true "moogle" requires mass with a negative energy density, which has not been discovered.
              </p>

              <h3 style={styles.wikiSectionHdr}>Fictional Media Representations</h3>
              <p style={styles.wikiPara}>
                Moogle is a common plot device in science fiction movies and literature. Examples include "Cavorite", a gravity-blocking metal in H.G. Wells' novel <i>The First Men in the Moon</i>, and various gravity-control nodes used in modern space flight movies like <i>Interstellar</i>.
              </p>

              <div style={styles.wikiSeeAlso}>
                <h4>See Also</h4>
                <ul>
                  <li onClick={() => navigateTo('moogle://arcade')} style={{ cursor: 'pointer', color: 'var(--accent)' }}>Space Snake Arcade</li>
                  <li onClick={() => navigateTo('moogle://search?q=Dark%20Matter')} style={{ cursor: 'pointer', color: 'var(--accent)' }}>Search: Dark Matter</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Space Snake Arcade (Playable Game page) */}
        {url.startsWith('moogle://arcade') && (
          <div style={styles.arcadePage} className="fade-in">
            <div style={styles.arcadeHeader}>
              <div style={styles.arcadeLogo}>🎮 Zero-G Retro Arcade</div>
              <div style={styles.arcadeStats}>
                <span>Score: {score}</span>
                <span style={{ marginLeft: 20 }}>High Score: {highScore}</span>
              </div>
            </div>

            <div style={styles.arcadeContainer}>
              {gameOver ? (
                <div style={styles.arcadeOverlay}>
                  <h2>GAME OVER</h2>
                  <p>Final Score: {score}</p>
                  <button 
                    onClick={() => {
                      setGameOver(false);
                      setScore(0);
                      setGameActive(true);
                    }}
                    style={styles.arcadeStartBtn}
                  >
                    Play Again
                  </button>
                </div>
              ) : null}

              <canvas 
                ref={canvasRef} 
                width="400" 
                height="288" 
                style={styles.arcadeCanvas}
              ></canvas>
              
              <div style={styles.arcadeInstructions}>
                <div>Use your keyboard <b>Arrow Keys</b> to navigate the Snake.</div>
                <div>Collect the red pixel apples to score points. Do not eat your own tail!</div>
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
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    color: '#333',
  },
  browserHeader: {
    height: '44px',
    backgroundColor: '#f1f3f4',
    borderBottom: '1px solid #dadce0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    gap: '8px',
  },
  controlsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#5f6368',
  },
  addressBarForm: {
    flex: 1,
    height: '28px',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #dadce0',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addressInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    padding: '0 8px',
    fontSize: '12px',
    color: '#333',
  },
  bookmarksBar: {
    height: '28px',
    backgroundColor: '#f1f3f4',
    borderBottom: '1px solid #dadce0',
    display: 'flex',
    padding: '0 12px',
    alignItems: 'center',
    gap: '12px',
  },
  bookmarkBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '11px',
    color: '#5f6368',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  viewport: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  searchPage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  searchCenter: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    width: '100%',
    maxWidth: '500px',
    padding: '20px',
  },
  searchLogo: {
    fontSize: '42px',
    fontFamily: 'var(--font-title)',
    fontWeight: '800',
    letterSpacing: '-1.5px',
  },
  searchForm: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #dfe1e5',
    borderRadius: '24px',
    backgroundColor: '#fff',
    overflow: 'hidden',
    boxShadow: '0 1px 6px rgba(32,33,36,0.1)',
  },
  searchFormInput: {
    flex: 1,
    height: '42px',
    border: 'none',
    outline: 'none',
    padding: '0 12px',
    fontSize: '14px',
    color: '#333',
  },
  searchSubmitBtn: {
    height: '42px',
    padding: '0 16px',
    backgroundColor: '#f8f9fa',
    border: 'none',
    borderLeft: '1px solid #dfe1e5',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#3c4043',
  },
  trendingContainer: {
    fontSize: '12px',
  },
  trendLink: {
    marginLeft: '8px',
    color: '#1a0dab',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  resultsPage: {
    padding: '20px 24px',
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    borderBottom: '1px solid #f1f3f4',
    paddingBottom: '16px',
    marginBottom: '16px',
  },
  resultsLogo: {
    fontFamily: 'var(--font-title)',
    fontSize: '20px',
    fontWeight: '800',
    color: '#1a73e8',
    cursor: 'pointer',
  },
  resultsSearchForm: {
    display: 'flex',
    border: '1px solid #dfe1e5',
    borderRadius: '20px',
    width: '360px',
    height: '32px',
    overflow: 'hidden',
  },
  resultsInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '0 12px',
    fontSize: '13px',
  },
  resultsSearchBtn: {
    border: 'none',
    background: 'none',
    padding: '0 12px',
    cursor: 'pointer',
    color: '#5f6368',
  },
  resultsContainer: {
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  resultsStats: {
    fontSize: '12px',
    color: '#70757a',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultLink: {
    fontSize: '11px',
    color: '#202124',
  },
  resultTitle: {
    fontSize: '16px',
    color: '#1a0dab',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '500',
  },
  resultSnippet: {
    fontSize: '13px',
    color: '#4d5156',
    lineHeight: '1.4',
  },
  wikiPage: {
    backgroundColor: '#ffffff',
    color: '#202124',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  wikiHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #a2a9b1',
    backgroundColor: '#f6f6f6',
    display: 'flex',
    flexDirection: 'column',
  },
  wikiLogo: {
    fontFamily: 'Georgia, serif',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#000',
  },
  wikiSubtitle: {
    fontSize: '11px',
    color: '#54595d',
    fontStyle: 'italic',
  },
  wikiContent: {
    padding: '24px',
    maxWidth: '750px',
  },
  wikiTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: '28px',
    fontWeight: 'normal',
    borderBottom: '1px solid #a2a9b1',
    paddingBottom: '6px',
    marginBottom: '12px',
  },
  wikiBanner: {
    padding: '6px 12px',
    border: '1px solid #a2a9b1',
    backgroundColor: '#f8f9fa',
    fontSize: '12px',
    marginBottom: '16px',
  },
  wikiPara: {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '14px',
  },
  wikiSectionHdr: {
    fontFamily: 'Georgia, serif',
    fontSize: '18px',
    fontWeight: 'normal',
    borderBottom: '1px solid #a2a9b1',
    paddingBottom: '4px',
    marginTop: '20px',
    marginBottom: '10px',
  },
  wikiSeeAlso: {
    marginTop: '24px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #eaecf0',
  },
  arcadePage: {
    backgroundColor: '#111827',
    color: '#fff',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
  },
  arcadeHeader: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  arcadeLogo: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#10b981',
  },
  arcadeStats: {
    fontSize: '13px',
    fontWeight: '600',
  },
  arcadeContainer: {
    position: 'relative',
    width: '400px',
    backgroundColor: '#030712',
    border: '4px solid #374151',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  arcadeCanvas: {
    display: 'block',
    backgroundColor: '#030712',
  },
  arcadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: 10,
  },
  arcadeStartBtn: {
    backgroundColor: '#10b981',
    border: 'none',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '700',
    transition: 'transform 0.1s',
  },
  arcadeInstructions: {
    padding: '10px',
    backgroundColor: '#1f2937',
    fontSize: '11px',
    color: '#d1d5db',
    lineHeight: '1.4',
    textAlign: 'center',
    borderTop: '2px solid #374151',
  }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .nav-btn:hover {
      background-color: rgba(0,0,0,0.06) !important;
      color: #1a73e8 !important;
    }
    .nav-btn:disabled {
      opacity: 0.4 !important;
      cursor: not-allowed !important;
      background-color: transparent !important;
      color: #5f6368 !important;
    }
    .bookmark-btn:hover {
      background-color: rgba(0,0,0,0.04) !important;
      color: #1a73e8 !important;
    }
    .search-submit-btn:hover {
      background-color: #f1f3f4 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
