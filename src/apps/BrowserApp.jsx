import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, Bookmark, Globe } from 'lucide-react';
import { runPyrite } from '../utils/pyrite';

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

  // Pyrite Docs & Playground state variables
  const [activeDocsTab, setActiveDocsTab] = useState('intro');
  const [playgroundCode, setPlaygroundCode] = useState(
`# Hello Pyrite Playground!
# Type some Python-like code here

fn greet(name):
    print("Hello, " + name + "! Welcome to Pyrite.")
    print("Pyrite is sparkling like a diamond")

greet("Developer")`
  );
  const [playgroundOutput, setPlaygroundOutput] = useState([]);
  const [playgroundError, setPlaygroundError] = useState(null);
  const [execTime, setExecTime] = useState(null);

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
          MoogleSearch
        </button>
        <button onClick={() => navigateTo('moogle://wiki')} className="bookmark-btn" style={styles.bookmarkBtn}>
          Wiki: Moogle
        </button>
        <button onClick={() => navigateTo('moogle://arcade')} className="bookmark-btn" style={styles.bookmarkBtn}>
          Retro Arcade: Snake
        </button>
        <button onClick={() => navigateTo('moogle://pyrite')} className="bookmark-btn" style={styles.bookmarkBtn}>
          Pyrite Lang
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
                  {(() => {
                    const allResults = [
                      {
                        title: "Pyrite Programming Language - Sparkling & Simple Python-like Language",
                        link: "moogle://pyrite",
                        urlDisplay: "https://pyrite-lang.org",
                        snippet: "Official documentation and interactive playground for Pyrite (.pyt). A lightweight Python-like programming language featuring block structures, recursion, arrays, and standard output.",
                        keywords: ["pyrite", "pyt", "lang", "programming", "python", "code", "run", "interpreter", "syntax"]
                      },
                      {
                        title: "Moogle - WikiWeb Encyclopedia",
                        link: "moogle://wiki",
                        urlDisplay: "https://en.wikipedia.org/wiki/Moogle",
                        snippet: "Moogle is a hypothetical force or device that cancels or negates gravity. It is a recurring concept in science fiction, particularly in spacecraft propulsion. Explore equations...",
                        keywords: ["moogle", "gravity", "wiki", "science", "physics", "cavorite"]
                      },
                      {
                        title: "Play Space Snake - Premium Retro Arcade Room",
                        link: "moogle://arcade",
                        urlDisplay: "https://moogle-arcade.net/play-snake",
                        snippet: "Control the pixel serpent in zero gravity. Collect cosmic apples, dodge your own tail, and challenge your high scores in this canvas simulation. Fully GPU-accelerated.",
                        keywords: ["snake", "arcade", "game", "play", "retro", "score", "apple"]
                      },
                      {
                        title: "TejasWa's Epic OS - Next Generation Web Operating System",
                        link: "https://moogle-os.org/about",
                        urlDisplay: "https://moogle-os.org/about",
                        snippet: "A gorgeous desktop portal that runs entirely inside your browser. Developed for extreme visual polish and premium desktop experience with fluid draggable windows and dynamic blur widgets.",
                        keywords: ["epic", "os", "webos", "tejaswa", "desktop", "browser", "react"]
                      }
                    ];

                    const queryLower = searchQuery.toLowerCase();
                    const filtered = allResults.filter(item => 
                      item.keywords.some(k => queryLower.includes(k)) || 
                      item.title.toLowerCase().includes(queryLower) ||
                      item.snippet.toLowerCase().includes(queryLower)
                    );
                    const displayList = filtered.length > 0 ? filtered : allResults;

                    return (
                      <>
                        <div style={styles.resultsStats}>About {displayList.length} results found for "{searchQuery}"</div>
                        {displayList.map((item, idx) => (
                          <div key={idx} style={styles.resultItem}>
                            <div style={styles.resultLink}>{item.urlDisplay}</div>
                            <div 
                              style={styles.resultTitle} 
                              onClick={() => {
                                if (item.link.startsWith("moogle://")) {
                                  navigateTo(item.link);
                                }
                              }}
                            >
                              {item.title}
                            </div>
                            <div style={styles.resultSnippet}>{item.snippet}</div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
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

        {/* Pyrite Language Docs & Playground */}
        {url.startsWith('moogle://pyrite') && (
          <div style={styles.pyritePage} className="fade-in">
            {/* Pyrite Sidebar */}
            <div style={styles.pyriteSidebar}>
              <div style={styles.pyriteSidebarHeader}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💎 Pyrite Lang
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>v1.0.0</span>
              </div>
              <div style={styles.pyriteSidebarNav}>
                <button 
                  onClick={() => setActiveDocsTab('intro')} 
                  style={{ ...styles.pyriteSidebarBtn, ...(activeDocsTab === 'intro' ? styles.pyriteSidebarBtnActive : {}) }}
                >
                  🚀 Introduction
                </button>
                <button 
                  onClick={() => setActiveDocsTab('syntax')} 
                  style={{ ...styles.pyriteSidebarBtn, ...(activeDocsTab === 'syntax' ? styles.pyriteSidebarBtnActive : {}) }}
                >
                  📝 Syntax Guide
                </button>
                <button 
                  onClick={() => setActiveDocsTab('stdlib')} 
                  style={{ ...styles.pyriteSidebarBtn, ...(activeDocsTab === 'stdlib' ? styles.pyriteSidebarBtnActive : {}) }}
                >
                  📚 Standard Library
                </button>
                <button 
                  onClick={() => setActiveDocsTab('playground')} 
                  style={{ ...styles.pyriteSidebarBtn, ...(activeDocsTab === 'playground' ? styles.pyriteSidebarBtnActive : {}) }}
                >
                  ⚡ Interactive Playground
                </button>
              </div>
              <div style={styles.pyriteSidebarFooter}>
                Sparkling like a Python, sharp like a diamond.
              </div>
            </div>

            {/* Pyrite Main Content */}
            <div style={styles.pyriteContent}>
              {activeDocsTab === 'intro' && (
                <div style={styles.docsSection}>
                  <h1 style={styles.docsTitle}>Welcome to Pyrite! 💎</h1>
                  <p style={styles.docsPara}>
                    <b>Pyrite</b> is a custom, lightweight, interpreted programming language inspired by Python, designed to run within Tejaswa's Epic WebOS. It combines Python's clean indentation-based style with powerful WebOS integrations.
                  </p>
                  
                  <h2 style={styles.docsSubTitle}>Why Pyrite?</h2>
                  <p style={styles.docsPara}>
                    Just like the mineral *pyrite* (often called "fool's gold") sparkles brilliantly and mimics gold, our Pyrite language mimics Python's appearance while running directly in a JavaScript virtual machine. It is designed to be:
                  </p>
                  <ul style={styles.docsList}>
                    <li><b>Clean & Indentation-based:</b> No braces or semicolons required. Code blocks are defined by indentation level.</li>
                    <li><b>Fully Recursive:</b> Functions support nested closures and full recursion.</li>
                    <li><b>WebOS-Native:</b> Runs inside the system console terminal and the browser web page alike.</li>
                    <li><b>Rich Expression System:</b> Seamlessly handles lists, objects, arithmetic, and logic.</li>
                  </ul>

                  <div style={styles.docsCallout}>
                    <strong>💡 Pro Tip:</strong> You can create Pyrite files in the terminal with the <code>.pyt</code> or <code>.pyr</code> extension, and execute them using the command: <code>pyrite documents/fizzbuzz.pyt</code>.
                  </div>

                  <h2 style={styles.docsSubTitle}>A Quick Taste of Pyrite</h2>
                  <pre style={styles.docsCode}>
{`# Define a function to generate message
fn get_greeting(user):
    return "Hello, " + user + "! Welcome to Pyrite."

# Run a loop
for i in range(3):
    print(get_greeting("User " + str(i)))`}
                  </pre>
                  
                  <button onClick={() => {
                    setPlaygroundCode(
`# Taste of Pyrite
fn get_greeting(user):
    return "Hello, " + user + "! Welcome to Pyrite."

for i in range(3):
    print(get_greeting("User " + str(i)))`
                    );
                    setActiveDocsTab('playground');
                  }} style={styles.docsActionBtn}>
                    Try this Example in Playground
                  </button>
                </div>
              )}

              {activeDocsTab === 'syntax' && (
                <div style={styles.docsSection}>
                  <h1 style={styles.docsTitle}>Syntax Guide</h1>
                  <p style={styles.docsPara}>
                    Pyrite syntax is pythonic, indentation-based, and colon-terminated for structural statements. Let's look at the syntax rules:
                  </p>

                  <h2 style={styles.docsSubTitle}>1. Variables & Comments</h2>
                  <p style={styles.docsPara}>
                    Comments start with a <code>#</code> character. Variables are dynamically typed and assigned using the <code>=</code> sign:
                  </p>
                  <pre style={styles.docsCode}>
{`# This is a comment
name = "Pyrite Language"
version = 1.0
sparkling = True
tags = ["python", "js", "interpreter"]`}
                  </pre>

                  <h2 style={styles.docsSubTitle}>2. Functions</h2>
                  <p style={styles.docsPara}>
                    Functions are declared using the <code>fn</code> keyword (different from Python's <code>def</code>) and their bodies must be indented:
                  </p>
                  <pre style={styles.docsCode}>
{`fn calculate_area(width, height):
    return width * height

print(calculate_area(10, 5)) # Outputs 50`}
                  </pre>

                  <h2 style={styles.docsSubTitle}>3. Conditionals (if, elif, else)</h2>
                  <p style={styles.docsPara}>
                    Conditionals evaluate boolean expressions. Instead of <code>and</code>, <code>or</code>, <code>not</code>, Pyrite supports Python keyword expressions natively:
                  </p>
                  <pre style={styles.docsCode}>
{`x = 15
if x > 20:
    print("Greater than 20")
elif x > 10 and x <= 20:
    print("Between 11 and 20")
else:
    print("10 or less")`}
                  </pre>

                  <h2 style={styles.docsSubTitle}>4. Loops (while & for)</h2>
                  <p style={styles.docsPara}>
                    Loops allow repeating code blocks:
                  </p>
                  <pre style={styles.docsCode}>
{`# While loops
count = 5
while count > 0:
    print("Count:", count)
    count = count - 1

# For loops (requires an iterable list or range)
for num in range(3):
    print("Number is:", num)`}
                  </pre>
                </div>
              )}

              {activeDocsTab === 'stdlib' && (
                <div style={styles.docsSection}>
                  <h1 style={styles.docsTitle}>Standard Library</h1>
                  <p style={styles.docsPara}>
                    Pyrite comes with a small but powerful set of built-in functions:
                  </p>

                  <table style={styles.docsTable}>
                    <thead>
                      <tr>
                        <th style={styles.docsTh}>Function</th>
                        <th style={styles.docsTh}>Description</th>
                        <th style={styles.docsTh}>Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={styles.docsTd}><code>print(*args)</code> / <code>show(*args)</code></td>
                        <td style={styles.docsTd}>Outputs values to the console separated by spaces.</td>
                        <td style={styles.docsTd}><code>print("Val:", 10)</code></td>
                      </tr>
                      <tr>
                        <td style={styles.docsTd}><code>range(start, end[, step])</code></td>
                        <td style={styles.docsTd}>Generates a list of numbers from start (inclusive) to end (exclusive).</td>
                        <td style={styles.docsTd}><code>range(1, 10, 2)</code></td>
                      </tr>
                      <tr>
                        <td style={styles.docsTd}><code>len(iterable)</code></td>
                        <td style={styles.docsTd}>Returns the length of a string or array.</td>
                        <td style={styles.docsTd}><code>len([1, 2, 3])</code></td>
                      </tr>
                      <tr>
                        <td style={styles.docsTd}><code>abs(x)</code></td>
                        <td style={styles.docsTd}>Returns the absolute value of a number.</td>
                        <td style={styles.docsTd}><code>abs(-5)</code></td>
                      </tr>
                      <tr>
                        <td style={styles.docsTd}><code>random()</code></td>
                        <td style={styles.docsTd}>Returns a random float between 0 (inclusive) and 1 (exclusive).</td>
                        <td style={styles.docsTd}><code>random()</code></td>
                      </tr>
                      <tr>
                        <td style={styles.docsTd}><code>randint(a, b)</code></td>
                        <td style={styles.docsTd}>Returns a random integer between a and b (inclusive).</td>
                        <td style={styles.docsTd}><code>randint(1, 10)</code></td>
                      </tr>
                      <tr>
                        <td style={styles.docsTd}><code>str(x)</code> / <code>num(x)</code> / <code>int(x)</code></td>
                        <td style={styles.docsTd}>Type conversion helpers for string, number, and integer.</td>
                        <td style={styles.docsTd}><code>str(10) + " items"</code></td>
                      </tr>
                    </tbody>
                  </table>

                  <h2 style={styles.docsSubTitle}>Array Methods</h2>
                  <p style={styles.docsPara}>
                    Because Pyrite arrays are powered by JS arrays, you can invoke array methods like <code>.push(item)</code>, <code>.pop()</code>, and <code>.join(sep)</code> directly!
                  </p>
                  <pre style={styles.docsCode}>
{`arr = []
arr.push("first")
arr.push("second")
print("Array joined:", arr.join(" -> "))`}
                  </pre>
                </div>
              )}

              {activeDocsTab === 'playground' && (
                <div style={styles.playgroundContainer}>
                  <h1 style={{ ...styles.docsTitle, marginBottom: '6px' }}>⚡ Interactive Pyrite Playground</h1>
                  <p style={{ ...styles.docsPara, marginBottom: '14px' }}>
                    Write, run, and experiment with Pyrite code in real time!
                  </p>

                  <div style={styles.playgroundGrid}>
                    {/* Left: Code Editor */}
                    <div style={styles.editorPanel}>
                      <div style={styles.panelHeader}>
                        <span>📝 Source Code (.pyt)</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Examples:</span>
                          <select 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'fizzbuzz') {
                                setPlaygroundCode(
`# FizzBuzz in Pyrite
fn fizzbuzz(limit):
    for i in range(1, limit + 1):
        if i % 3 == 0 and i % 5 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

fizzbuzz(15)`
                                );
                              } else if (val === 'fib') {
                                setPlaygroundCode(
`# Recursive Fibonacci
fn fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

for i in range(8):
    print("fib(" + str(i) + ") = " + str(fib(i)))`
                                );
                              } else if (val === 'primes') {
                                setPlaygroundCode(
`# Prime Number Finder
fn is_prime(n):
    if n <= 1:
        return False
    for i in range(2, n):
        if n % i == 0:
            return False
    return True

print("Primes under 30:")
primes = []
for i in range(1, 30):
    if is_prime(i):
        primes.push(i)

print(primes)`
                                );
                              }
                            }}
                            style={styles.playgroundSelect}
                          >
                            <option value="">-- Choose Example --</option>
                            <option value="fizzbuzz">FizzBuzz Loop</option>
                            <option value="fib">Fibonacci Recursion</option>
                            <option value="primes">Prime Finder</option>
                          </select>
                        </div>
                      </div>
                      <textarea
                        value={playgroundCode}
                        onChange={(e) => setPlaygroundCode(e.target.value)}
                        style={styles.codeTextarea}
                        spellCheck="false"
                      />
                      <button 
                        onClick={() => {
                          const logs = [];
                          setPlaygroundOutput([]);
                          setPlaygroundError(null);
                          const start = performance.now();
                          try {
                            runPyrite(playgroundCode, (line) => {
                              logs.push(line);
                            });
                            const end = performance.now();
                            setPlaygroundOutput(logs);
                            setExecTime((end - start).toFixed(1));
                          } catch (err) {
                            setPlaygroundError(err.message);
                            setPlaygroundOutput(logs);
                            setExecTime(null);
                          }
                        }}
                        style={styles.runButton}
                      >
                        ▶ Run Code
                      </button>
                    </div>

                    {/* Right: Output Console */}
                    <div style={styles.consolePanel}>
                      <div style={styles.panelHeader}>
                        <span>💻 Console Output</span>
                        {execTime && (
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                            Success ({execTime}ms)
                          </span>
                        )}
                      </div>
                      <div style={styles.consoleBody}>
                        {playgroundError && (
                          <div style={styles.consoleErrorLine}>{playgroundError}</div>
                        )}
                        {playgroundOutput.map((line, idx) => (
                          <div key={idx} style={styles.consoleLine}>{line}</div>
                        ))}
                        {playgroundOutput.length === 0 && !playgroundError && (
                          <div style={styles.consolePlaceholder}>Click "Run Code" to see the output here...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
    overflowX: 'auto',
    whiteSpace: 'nowrap',
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
  },
  pyritePage: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'row',
  },
  pyriteSidebar: {
    width: '220px',
    backgroundColor: '#1e293b',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
  },
  pyriteSidebarHeader: {
    padding: '0 16px 16px 16px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
  },
  pyriteSidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    padding: '0 8px',
  },
  pyriteSidebarBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    textAlign: 'left',
    padding: '8px 12px',
    borderRadius: '6px',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  pyriteSidebarBtnActive: {
    backgroundColor: '#334155',
    color: '#fbbf24',
  },
  pyriteSidebarFooter: {
    padding: '16px',
    fontSize: '11px',
    color: '#64748b',
    borderTop: '1px solid #334155',
    textAlign: 'center',
  },
  pyriteContent: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    backgroundColor: '#0f172a',
  },
  docsSection: {
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  docsTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: '8px',
  },
  docsSubTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fbbf24',
    marginTop: '16px',
    marginBottom: '4px',
  },
  docsPara: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#cbd5e1',
  },
  docsList: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#cbd5e1',
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  docsCallout: {
    backgroundColor: '#1e293b',
    borderLeft: '4px solid #fbbf24',
    padding: '12px 16px',
    borderRadius: '0 8px 8px 0',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#e2e8f0',
    margin: '12px 0',
  },
  docsCode: {
    backgroundColor: '#1e293b',
    padding: '14px',
    borderRadius: '8px',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#f8fafc',
    border: '1px solid #334155',
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
  docsActionBtn: {
    backgroundColor: '#fbbf24',
    color: '#0f172a',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },
  docsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    marginBottom: '16px',
  },
  docsTh: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '2px solid #334155',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  docsTd: {
    padding: '10px 12px',
    borderBottom: '1px solid #1e293b',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  playgroundContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  playgroundGrid: {
    display: 'flex',
    gap: '16px',
    flex: 1,
    minHeight: '400px',
  },
  editorPanel: {
    flex: 1.2,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  consolePanel: {
    flex: 0.8,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#020617',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '10px 14px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#cbd5e1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeTextarea: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    padding: '12px',
    border: 'none',
    outline: 'none',
    resize: 'none',
    lineHeight: '1.5',
  },
  runButton: {
    backgroundColor: '#fbbf24',
    color: '#0f172a',
    border: 'none',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  consoleBody: {
    flex: 1,
    padding: '12px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  consoleLine: {
    color: '#10b981',
    whiteSpace: 'pre-wrap',
  },
  consoleErrorLine: {
    color: '#ef4444',
    whiteSpace: 'pre-wrap',
  },
  consolePlaceholder: {
    color: '#475569',
    fontStyle: 'italic',
  },
  playgroundSelect: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '4px',
    fontSize: '11px',
    padding: '2px 4px',
    outline: 'none',
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
    .pyrite-sidebar-btn:hover {
      background-color: rgba(255,255,255,0.05) !important;
      color: #fbbf24 !important;
    }
    .pyrite-run-btn:hover {
      background-color: #f59e0b !important;
    }
    .pyrite-action-btn:hover {
      background-color: #f59e0b !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
