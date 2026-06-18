import React, { useState, useEffect, useRef } from 'react';

// ── Filesystem root ──────────────────────────────────────────────────────
const ROOT = '/home/tejaswa';

function buildInitialFiles() {
  return {
    '/': { type: 'dir' },
    '/home': { type: 'dir' },
    [ROOT]: { type: 'dir' },
    [`${ROOT}/documents`]: { type: 'dir' },
    [`${ROOT}/downloads`]: { type: 'dir' },
    [`${ROOT}/welcome.txt`]: {
      type: 'file',
      content: 'Welcome to Tejaswa\'s Epic OS Terminal!\nFeel free to explore our virtual file system.\nType "help" to see available command instructions.'
    },
    [`${ROOT}/system.cfg`]: {
      type: 'file',
      content: 'kernel=V8.React.Engine\nversion=2.0.26\nhardware_acceleration=enabled\naccent=sapphire\nblur_intensity=20px'
    },
    [`${ROOT}/manifesto.txt`]: {
      type: 'file',
      content: 'Tejaswa\'s Epic OS aims to challenge the boundaries of browser desktop interfaces.\nVisual polish, premium aesthetics, and buttery-smooth animations are our core principles.'
    },
  };
}

// ── Shell-style tokenizer: keeps "quoted strings" as one token ──────────────
function tokenize(str) {
  const tokens = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuote) {
      if (ch === quoteChar) { tokens.push(current); current = ''; inQuote = false; }
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      inQuote = true; quoteChar = ch;
    } else if (ch === ' ') {
      if (current) { tokens.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

// Strip surrounding single or double quotes
function stripOuterQuotes(s) {
  if (!s) return '';
  if ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}

// Returns error string if a path SEGMENT (not a full path) is invalid
function validateFilename(name) {
  if (!name) return 'Filename cannot be empty.';
  if (name.length > 64) return 'Filename too long (max 64 chars).';
  if (/[<>:"\\|?*\x00-\x1F]/.test(name)) return `Invalid characters in filename: "${name}"`;
  if (name === '.' || name === '..') return `Invalid filename: "${name}"`;
  return null;
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ── Path helpers ─────────────────────────────────────────────────────────
// Resolves an input path (absolute, relative, '~', '.', '..') against cwd
// into a normalized absolute path string, e.g. '/home/tejaswa/documents'.
function resolvePath(cwd, input) {
  if (!input) return cwd;

  let working = input;
  let baseParts;

  if (working.startsWith('~')) {
    working = working.slice(1);
    if (working.startsWith('/')) working = working.slice(1);
    baseParts = ROOT.split('/').filter(Boolean);
  } else if (working.startsWith('/')) {
    working = working.slice(1);
    baseParts = [];
  } else {
    baseParts = cwd.split('/').filter(Boolean);
  }

  const inputParts = working.split('/').filter(Boolean);
  const stack = [...baseParts];
  for (const part of inputParts) {
    if (part === '.' ) continue;
    if (part === '..') { if (stack.length) stack.pop(); }
    else stack.push(part);
  }
  return '/' + stack.join('/');
}

function getParentPath(path) {
  if (path === '/') return null;
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

function getBaseName(path) {
  if (path === '/') return '/';
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

function joinPath(dir, name) {
  return dir === '/' ? '/' + name : dir + '/' + name;
}

// Renders ROOT as '~' for the prompt, like a real shell
function displayPath(path) {
  if (path === ROOT) return '~';
  if (path.startsWith(ROOT + '/')) return '~' + path.slice(ROOT.length);
  return path;
}

export default function TerminalApp({ settings, updateSettings }) {
  const [files, setFiles] = useState(buildInitialFiles);
  const [cwd, setCwd] = useState(ROOT);
  const [history, setHistory] = useState([
    { text: 'Tejaswa\'s Epic OS Terminal [Version 2.0.26]', type: 'system' },
    { text: 'Type "help" for a list of available commands.', type: 'system' },
    { text: '', type: 'system' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [matrixActive, setMatrixActive] = useState(false);

  const consoleBottomRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      ctx.fillStyle = '#0F0';
      ctx.font = '14px monospace';
      for (let i = 0; i < rainDrops.length; i++) {
        const text = String.fromCharCode(Math.floor(33 + Math.random() * 93));
        ctx.fillText(text, i * 14, rainDrops[i] * 14);
        if (rainDrops[i] * 14 > canvas.height && Math.random() > 0.975) rainDrops[i] = 0;
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', handleResize); };
  }, [matrixActive]);

  const push = (lines, type = 'response') => {
    const entries = (Array.isArray(lines) ? lines : [lines]).map(text => ({ text, type }));
    setHistory(prev => [...prev, ...entries]);
  };

  const handleCommand = (e) => {
    e.preventDefault();
    const cmdStr = inputVal.trim();
    if (!cmdStr) return;
    setInputVal('');

    // Echo the command at the prompt that was active when it was typed
    setHistory(prev => [...prev, { text: `tejaswas-webos:${displayPath(cwd)}> ${cmdStr}`, type: 'input' }]);

    const tokens = tokenize(cmdStr);
    const command = tokens[0]?.toLowerCase();

    // Local snapshot of files/cwd, flushed at the end to keep things clean
    let newFiles = { ...files };
    let flushed = false;
    const flushFiles = () => { setFiles(newFiles); flushed = true; };
    let nextCwd = cwd;

    switch (command) {

      // ── help ───────────────────────────────────────────────────────────
      case 'help':
        push(`Available Commands:
  help                     Display this information guide
  clear                    Clear the terminal console screen
  neofetch                 View visual system diagnostics
  pwd                      Print current working directory
  cd [path]                Change directory (supports .. ~ / relative)
  ls [path]                List directory contents (default: cwd)
  mkdir [-p] [dir]         Create a new directory (-p creates parents)
  rmdir [dir]              Remove an empty directory
  tree [path]              Show directory tree (default: cwd)
  cat [file]               Read file contents
  touch [file]             Create a new empty file
  touch [file] "content"   Create a file with content
  touch -f [file] [...]    Force create / overwrite existing file
  echo "text" > [file]     Write (overwrite) text into a file
  echo "text" >> [file]    Append text to a file
  rm [file]                Remove a file
  rm -r [dir]              Remove a directory recursively
  mv [src] [dest]          Rename / move a file or directory
  cp [src] [dest]          Copy a file or directory
  stat [path]              Show file/directory metadata
  theme [color]            Change accent (sapphire emerald sunset ruby purple)
  date                     Display current date & time
  joke                     Random developer joke
  matrix                   Toggle matrix rain effect
  exit                     Close the terminal`);
        break;

      // ── clear ──────────────────────────────────────────────────────────
      case 'clear':
        setHistory([]);
        return;

      // ── neofetch ───────────────────────────────────────────────────────
      case 'neofetch':
        push(
`             /\\\\         OS: Tejaswa's Epic OS Hackathon Edition
            /  \\\\        Kernel: Web-React-Electron-Kernel v9.4
           /    \\\\       Shell: Powershell-JS v2.0
          /  /\\  \\\\      Uptime: 2h 43m
         /  /  \\  \\\\     Resolution: ${window.innerWidth}x${window.innerHeight}
        /  /____\\  \\\\    Theme: ${settings.accentColor.toUpperCase()} | ${settings.theme.toUpperCase()}
       /  /======\\  \\   CPU: Virtual WebOS Quantum Core (8 Cores)
      /  /        \\  \\\\  GPU: WebGL 2.0 Hardware Accelerated
     /__/          \\__\\\\ Memory: 4.8 GB / 16.0 GB (30% used)`, 'response_mono');
        break;

      // ── pwd ────────────────────────────────────────────────────────────
      case 'pwd':
        push(cwd);
        break;

      // ── cd ─────────────────────────────────────────────────────────────
      case 'cd': {
        const target = tokens[1];
        const dest = resolvePath(cwd, target || '~');
        const entry = newFiles[dest];
        if (!entry) { push(`cd: ${target || '~'}: No such directory`, 'error'); break; }
        if (entry.type !== 'dir') { push(`cd: ${target}: Not a directory`, 'error'); break; }
        nextCwd = dest;
        setCwd(dest);
        break;
      }

      // ── ls ─────────────────────────────────────────────────────────────
      case 'ls': {
        const t = tokens[1];
        const dest = t ? resolvePath(cwd, t) : cwd;
        const entry = newFiles[dest];
        if (!entry) { push(`ls: ${t}: No such file or directory`, 'error'); break; }
        if (entry.type !== 'dir') { push(getBaseName(dest)); break; }

        const childNames = Object.keys(newFiles)
          .filter(p => getParentPath(p) === dest)
          .map(p => getBaseName(p))
          .sort();

        if (!childNames.length) { push('(empty directory)', 'system'); break; }

        const formatted = childNames.map(name => {
          const full = joinPath(dest, name);
          return newFiles[full].type === 'dir' ? `${name}/` : name;
        });
        push(formatted.join('    '));
        break;
      }

      // ── mkdir ──────────────────────────────────────────────────────────
      case 'mkdir': {
        let recursive = false;
        let argStart = 1;
        if (tokens[1] === '-p') { recursive = true; argStart = 2; }

        const targets = tokens.slice(argStart);
        if (!targets.length) { push('Usage: mkdir [-p] [dir...]', 'error'); break; }

        const created = [];
        for (const t of targets) {
          const dest = resolvePath(cwd, t);
          const nameErr = validateFilename(getBaseName(dest));
          if (nameErr) { push(nameErr, 'error'); continue; }

          if (newFiles[dest]) { push(`mkdir: ${t}: File exists`, 'error'); continue; }

          if (recursive) {
            const parts = dest.split('/').filter(Boolean);
            let cur = '';
            let failed = false;
            for (const p of parts) {
              cur = cur + '/' + p;
              if (!newFiles[cur]) newFiles[cur] = { type: 'dir' };
              else if (newFiles[cur].type !== 'dir') {
                push(`mkdir: ${cur}: Not a directory`, 'error');
                failed = true;
                break;
              }
            }
            if (!failed) created.push(t);
          } else {
            const parent = getParentPath(dest);
            if (!newFiles[parent] || newFiles[parent].type !== 'dir') {
              push(`mkdir: ${t}: No such directory (use -p to create parents)`, 'error');
              continue;
            }
            newFiles[dest] = { type: 'dir' };
            created.push(t);
          }
        }
        if (created.length) {
          flushFiles();
          push(created.map(t => `Created directory: ${t}`), 'success');
        }
        break;
      }

      // ── rmdir ──────────────────────────────────────────────────────────
      case 'rmdir': {
        const t = tokens[1];
        if (!t) { push('Usage: rmdir [dir]', 'error'); break; }
        const dest = resolvePath(cwd, t);
        const entry = newFiles[dest];
        if (!entry || entry.type !== 'dir') { push(`rmdir: ${t}: No such directory`, 'error'); break; }
        if (dest === '/' || dest === ROOT) { push(`rmdir: ${t}: Cannot remove protected directory`, 'error'); break; }
        const hasChildren = Object.keys(newFiles).some(p => getParentPath(p) === dest);
        if (hasChildren) { push(`rmdir: ${t}: Directory not empty`, 'error'); break; }
        delete newFiles[dest];
        flushFiles();
        push(`Removed directory: ${t}`, 'success');
        break;
      }

      // ── tree ───────────────────────────────────────────────────────────
      case 'tree': {
        const t = tokens[1];
        const dest = t ? resolvePath(cwd, t) : cwd;
        const entry = newFiles[dest];
        if (!entry || entry.type !== 'dir') { push(`tree: ${t}: No such directory`, 'error'); break; }

        const lines = [dest === '/' ? '/' : `${getBaseName(dest)}/`];
        const buildTree = (path, prefix) => {
          const children = Object.keys(newFiles)
            .filter(p => getParentPath(p) === path)
            .sort((a, b) => getBaseName(a).localeCompare(getBaseName(b)));
          children.forEach((child, i) => {
            const isLast = i === children.length - 1;
            const name = getBaseName(child);
            const connector = isLast ? '└── ' : '├── ';
            const childIsDir = newFiles[child].type === 'dir';
            lines.push(prefix + connector + name + (childIsDir ? '/' : ''));
            if (childIsDir) buildTree(child, prefix + (isLast ? '    ' : '│   '));
          });
        };
        buildTree(dest, '');
        push(lines, 'response_mono');
        break;
      }

      // ── cat ────────────────────────────────────────────────────────────
      case 'cat': {
        const t = tokens[1];
        if (!t) { push('Usage: cat [file]', 'error'); break; }
        const dest = resolvePath(cwd, t);
        const entry = newFiles[dest];
        if (!entry) { push(`cat: ${t}: No such file`, 'error'); break; }
        if (entry.type === 'dir') { push(`cat: ${t}: Is a directory`, 'error'); break; }
        push(entry.content === '' ? '(empty file)' : entry.content,
             entry.content === '' ? 'system' : 'response');
        break;
      }

      // ── touch ──────────────────────────────────────────────────────────
      // Usage:
      //   touch path                  → create empty file (fails if exists)
      //   touch path "content"        → create with content (fails if exists)
      //   touch -f path                ← force create / overwrite
      //   touch -f path "content"     → force overwrite with content
      case 'touch': {
        let force = false;
        let argIdx = 1;

        if (tokens[1] === '-f') { force = true; argIdx = 2; }

        const t = tokens[argIdx];
        if (!t) {
          push([
            'Usage: touch [file]',
            '       touch [file] "content"',
            '       touch -f [file]          ← force overwrite existing',
            '       touch -f [file] "content"',
          ], 'error');
          break;
        }

        const dest = resolvePath(cwd, t);
        const nameErr = validateFilename(getBaseName(dest));
        if (nameErr) { push(nameErr, 'error'); break; }

        const parent = getParentPath(dest);
        if (!newFiles[parent] || newFiles[parent].type !== 'dir') {
          push(`touch: ${t}: No such directory`, 'error'); break;
        }

        if (newFiles[dest] && newFiles[dest].type === 'dir') {
          push(`touch: ${t}: Is a directory`, 'error'); break;
        }

        if (newFiles[dest] && !force) {
          push(`touch: ${t}: File already exists. Use -f to overwrite.`, 'error');
          break;
        }

        const rawContent = tokens.slice(argIdx + 1).join(' ');
        const content = stripOuterQuotes(rawContent);

        const existed = !!newFiles[dest];
        newFiles[dest] = { type: 'file', content };
        flushFiles();

        if (existed && force) {
          push(`Overwrote: ${t}${content ? '' : ' (empty)'}`, 'success');
          if (content) push(`Content: ${truncate(content, 60)}`, 'system');
        } else {
          push(`Created: ${t}${content ? '' : ' (empty)'}`, 'file-created');
          if (content) push(`Content: ${truncate(content, 60)}`, 'system');
        }
        break;
      }

      // ── echo "text" > file  /  echo "text" >> file ─────────────────────
      case 'echo': {
        const afterEcho = cmdStr.slice(5); // everything after "echo "
        const appendMatch    = afterEcho.match(/^(.*?)>>\s*(\S+)\s*$/s);
        const overwriteMatch = afterEcho.match(/^(.*?)(?<!>)>\s*(\S+)\s*$/s);

        if (appendMatch || overwriteMatch) {
          const isAppend = !!appendMatch;
          const match    = isAppend ? appendMatch : overwriteMatch;
          const text     = stripOuterQuotes(match[1].trim());
          const t        = match[2].trim();

          const dest = resolvePath(cwd, t);
          const nameErr = validateFilename(getBaseName(dest));
          if (nameErr) { push(nameErr, 'error'); break; }

          const parent = getParentPath(dest);
          if (!newFiles[parent] || newFiles[parent].type !== 'dir') {
            push(`echo: ${t}: No such directory`, 'error'); break;
          }
          if (newFiles[dest] && newFiles[dest].type === 'dir') {
            push(`echo: ${t}: Is a directory`, 'error'); break;
          }

          if (isAppend) {
            const prevContent = newFiles[dest]?.content ?? '';
            newFiles[dest] = {
              type: 'file',
              content: prevContent + (prevContent ? '\n' : '') + text
            };
            flushFiles();
            push(`Appended to: ${t}`, 'success');
          } else {
            const existed = !!newFiles[dest];
            newFiles[dest] = { type: 'file', content: text };
            flushFiles();
            push(`${existed ? 'Overwrote' : 'Created'}: ${t}`, existed ? 'success' : 'file-created');
          }
        } else {
          // Plain echo — just print to terminal
          push(stripOuterQuotes(afterEcho.trim()) || '', 'response');
        }
        break;
      }

      // ── rm ─────────────────────────────────────────────────────────────
      case 'rm': {
        let recursive = false;
        let argIdx = 1;
        if (tokens[1] === '-r' || tokens[1] === '-rf' || tokens[1] === '-fr') {
          recursive = true; argIdx = 2;
        }

        const t = tokens[argIdx];
        if (!t) { push('Usage: rm [-r] [file/dir]', 'error'); break; }
        const dest = resolvePath(cwd, t);
        const entry = newFiles[dest];
        if (!entry) { push(`rm: ${t}: No such file or directory`, 'error'); break; }

        if (entry.type === 'dir') {
          if (!recursive) { push(`rm: ${t}: Is a directory (use rm -r)`, 'error'); break; }
          if (dest === '/' || dest === ROOT) { push(`rm: ${t}: Cannot remove protected directory`, 'error'); break; }

          Object.keys(newFiles).forEach(p => {
            if (p === dest || p.startsWith(dest + '/')) delete newFiles[p];
          });
          flushFiles();

          // If cwd was inside the removed tree, snap back to the nearest surviving ancestor
          if (cwd === dest || cwd.startsWith(dest + '/')) {
            nextCwd = getParentPath(dest) || ROOT;
            setCwd(nextCwd);
          }
          push(`Removed directory: ${t}`, 'success');
        } else {
          delete newFiles[dest];
          flushFiles();
          push(`Removed: ${t}`, 'success');
        }
        break;
      }

      // ── mv ─────────────────────────────────────────────────────────────
      case 'mv': {
        const s = tokens[1], d = tokens[2];
        if (!s || !d) { push('Usage: mv [source] [destination]', 'error'); break; }

        const src = resolvePath(cwd, s);
        let dest = resolvePath(cwd, d);
        const srcEntry = newFiles[src];
        if (!srcEntry) { push(`mv: ${s}: No such file or directory`, 'error'); break; }

        if (newFiles[dest] && newFiles[dest].type === 'dir') {
          dest = joinPath(dest, getBaseName(src));
        }
        if (newFiles[dest]) { push(`mv: ${d}: File already exists`, 'error'); break; }

        const nameErr = validateFilename(getBaseName(dest));
        if (nameErr) { push(nameErr, 'error'); break; }
        const destParent = getParentPath(dest);
        if (!newFiles[destParent] || newFiles[destParent].type !== 'dir') {
          push(`mv: ${d}: No such directory`, 'error'); break;
        }
        if (dest === src || dest.startsWith(src + '/')) {
          push(`mv: cannot move "${s}" into itself`, 'error'); break;
        }

        if (srcEntry.type === 'dir') {
          const toMove = Object.keys(newFiles).filter(p => p === src || p.startsWith(src + '/'));
          toMove.forEach(p => {
            const newPath = dest + p.slice(src.length);
            newFiles[newPath] = newFiles[p];
            delete newFiles[p];
          });
        } else {
          newFiles[dest] = newFiles[src];
          delete newFiles[src];
        }

        if (cwd === src || cwd.startsWith(src + '/')) {
          nextCwd = dest + cwd.slice(src.length);
          setCwd(nextCwd);
        }

        flushFiles();
        push(`Moved: ${s} → ${d}`, 'success');
        break;
      }

      // ── cp ─────────────────────────────────────────────────────────────
      case 'cp': {
        const s = tokens[1], d = tokens[2];
        if (!s || !d) { push('Usage: cp [source] [destination]', 'error'); break; }

        const src = resolvePath(cwd, s);
        let dest = resolvePath(cwd, d);
        const srcEntry = newFiles[src];
        if (!srcEntry) { push(`cp: ${s}: No such file or directory`, 'error'); break; }

        if (newFiles[dest] && newFiles[dest].type === 'dir') {
          dest = joinPath(dest, getBaseName(src));
        }
        if (newFiles[dest]) { push(`cp: ${d}: File already exists`, 'error'); break; }

        const nameErr = validateFilename(getBaseName(dest));
        if (nameErr) { push(nameErr, 'error'); break; }
        const destParent = getParentPath(dest);
        if (!newFiles[destParent] || newFiles[destParent].type !== 'dir') {
          push(`cp: ${d}: No such directory`, 'error'); break;
        }
        if (dest === src || dest.startsWith(src + '/')) {
          push(`cp: cannot copy "${s}" into itself`, 'error'); break;
        }

        if (srcEntry.type === 'dir') {
          const toCopy = Object.keys(newFiles).filter(p => p === src || p.startsWith(src + '/'));
          toCopy.forEach(p => {
            const newPath = dest + p.slice(src.length);
            newFiles[newPath] = { ...newFiles[p] };
          });
        } else {
          newFiles[dest] = { ...newFiles[src] };
        }

        flushFiles();
        push(`Copied: ${s} → ${d}`, 'success');
        break;
      }

      // ── stat ───────────────────────────────────────────────────────────
      case 'stat': {
        const t = tokens[1];
        if (!t) { push('Usage: stat [path]', 'error'); break; }
        const dest = resolvePath(cwd, t);
        const entry = newFiles[dest];
        if (!entry) { push(`stat: ${t}: No such file or directory`, 'error'); break; }

        if (entry.type === 'dir') {
          const childCount = Object.keys(newFiles).filter(p => getParentPath(p) === dest).length;
          push(
`Path:   ${dest}
Type:   Directory
Items:  ${childCount}
Access: drwxr-xr-x`, 'response');
        } else {
          const content = entry.content;
          const bytes   = new TextEncoder().encode(content).length;
          const lines   = content ? content.split('\n').length : 0;
          const name    = getBaseName(dest);
          const ext     = name.includes('.') ? name.split('.').pop().toUpperCase() : 'unknown';
          push(
`Path:   ${dest}
Size:   ${bytes} bytes
Lines:  ${lines}
Type:   ${ext}
Access: -rw-r--r--`, 'response');
        }
        break;
      }

      // ── theme ──────────────────────────────────────────────────────────
      case 'theme': {
        const newAccent = tokens[1]?.toLowerCase();
        const valid = ['sapphire', 'emerald', 'sunset', 'ruby', 'purple'];
        if (!newAccent) {
          push('Usage: theme [sapphire | emerald | sunset | ruby | purple]');
        } else if (valid.includes(newAccent)) {
          updateSettings({ accentColor: newAccent });
          push(`Accent color changed to: ${newAccent}`, 'success');
        } else {
          push(`Error: Unknown accent "${newAccent}". Try: ${valid.join(', ')}`, 'error');
        }
        break;
      }

      // ── date ───────────────────────────────────────────────────────────
      case 'date':
        push(`Current Date: ${new Date().toString()}`);
        break;

      // ── joke ───────────────────────────────────────────────────────────
      case 'joke': {
        const jokes = [
          "Why do programmers wear glasses? Because they can't C#!",
          "There are 10 types of people: those who understand binary, and those who don't.",
          "How many programmers to change a light bulb? None — that's a hardware problem.",
          "What's a programmer's favorite hangout place? Foo Bar!",
          "A SQL query walks into a bar and asks two tables: 'Can I join you?'"
        ];
        push(jokes[Math.floor(Math.random() * jokes.length)]);
        break;
      }

      // ── matrix ─────────────────────────────────────────────────────────
      case 'matrix':
        setMatrixActive(prev => !prev);
        push(`Matrix rain ${!matrixActive ? 'ACTIVATED' : 'DEACTIVATED'}.`);
        break;

      // ── exit ───────────────────────────────────────────────────────────
      case 'exit':
        push('Closing session...', 'system');
        break;

      default:
        push(`Command not found: "${command}". Type "help" for instructions.`, 'error');
    }

    // If file mutations happened but flushFiles wasn't called (shouldn't happen), flush anyway
    if (!flushed) setFiles(newFiles);
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
            <div key={idx} style={{ ...styles.line, ...styles[line.type] }}>
              {line.text}
            </div>
          ))}
          <div ref={consoleBottomRef}></div>
        </div>

        <form onSubmit={handleCommand} style={styles.promptForm}>
          <span style={styles.promptSign}>tejaswas-webos:{displayPath(cwd)}&gt;</span>
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
    color: '#39ff14',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  matrixContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
  },
  canvas: { flex: 1, display: 'block' },
  exitMatrixBtn: {
    position: 'absolute',
    top: '16px', right: '16px',
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
  system:        { color: '#a0aec0' },
  input:         { color: '#f7fafc', fontWeight: 'bold' },
  response:      { color: '#38b2ac' },
  response_mono: { color: '#805ad5', fontFamily: 'var(--font-mono)' },
  error:         { color: '#f56565' },
  success:       { color: '#68d391' },    // green — for overwrites, rm, mv, cp
  'file-created':{ color: '#f6e05e' },    // yellow — new file created
  promptForm: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '6px',
  },
  promptSign: {
    color: '#a855f7',
    fontWeight: 'bold',
    marginRight: '8px',
    whiteSpace: 'nowrap',
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
  const styleSheet = document.createElement('style');
  styleSheet.innerText = `.exit-matrix-btn:hover { background-color: #0f0 !important; color: #000 !important; }`;
  document.head.appendChild(styleSheet);
}