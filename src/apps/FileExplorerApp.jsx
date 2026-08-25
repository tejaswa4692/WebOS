import React, { useState } from 'react';
import {
  Folder, File, ChevronLeft, ChevronRight, ArrowUp, Plus,
  Trash2, Edit, HardDrive, FileText, FileCode, Search, RefreshCw
} from 'lucide-react';

// ── Filesystem root (must match Terminal app / App.jsx) ────────────────────
const ROOT = '/home/tejaswa';

// ── Path helpers (identical logic to TerminalApp.jsx, kept in sync) ────────
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

function displayPath(path) {
  if (path === ROOT) return '~';
  if (path.startsWith(ROOT + '/')) return '~' + path.slice(ROOT.length);
  return path;
}

// Validates a single path SEGMENT (not a full path) — same rules as Terminal
function validateFilename(name) {
  if (!name) return 'Name cannot be empty.';
  if (name.length > 64) return 'Name too long (max 64 chars).';
  if (/[<>:"\\|?*\x00-\x1F]/.test(name)) return `Invalid characters in name: "${name}"`;
  if (name === '.' || name === '..') return `Invalid name: "${name}"`;
  return null;
}

const PROTECTED = new Set(['/', ROOT, `${ROOT}/documents`, `${ROOT}/downloads`]);

export default function FileExplorerApp({ files = {}, setFiles, openApp }) {
  const [currentDir, setCurrentDir] = useState(ROOT);
  const [history, setHistory] = useState([ROOT]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const flash = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // ── Navigation ─────────────────────────────────────────────────────────
  const navigateTo = (path) => {
    if (!files[path] || files[path].type !== 'dir') return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentDir(path);
    setSelectedPath(null);
  };

  const handleBack = () => {
    if (historyIndex === 0) return;
    setHistoryIndex(historyIndex - 1);
    setCurrentDir(history[historyIndex - 1]);
    setSelectedPath(null);
  };

  const handleForward = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(historyIndex + 1);
    setCurrentDir(history[historyIndex + 1]);
    setSelectedPath(null);
  };

  const handleUp = () => {
    const parent = getParentPath(currentDir);
    if (parent && files[parent]) navigateTo(parent);
  };

  // ── Create folder ──────────────────────────────────────────────────────
  const handleNewFolder = () => {
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();

    const err = validateFilename(trimmed);
    if (err) { alert(err); return; }

    const path = joinPath(currentDir, trimmed);
    if (files[path]) { alert('An item with that name already exists!'); return; }

    setFiles(prev => ({ ...prev, [path]: { type: 'dir' } }));
    flash(`Created folder: ${trimmed}`);
  };

  // ── Create file ────────────────────────────────────────────────────────
  const handleNewFile = () => {
    const name = prompt('Enter file name (e.g. script.pyt or notes.txt):');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();

    const err = validateFilename(trimmed);
    if (err) { alert(err); return; }

    const path = joinPath(currentDir, trimmed);
    if (files[path]) { alert('An item with that name already exists!'); return; }

    setFiles(prev => ({ ...prev, [path]: { type: 'file', content: '' } }));
    flash(`Created file: ${trimmed}`);
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!selectedPath) return;
    const name = getBaseName(selectedPath);

    if (PROTECTED.has(selectedPath)) {
      alert('Protected system folder cannot be deleted!');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    const entry = files[selectedPath];
    if (!entry) return;

    setFiles(prev => {
      const next = { ...prev };
      if (entry.type === 'dir') {
        Object.keys(next).forEach(path => {
          if (path === selectedPath || path.startsWith(selectedPath + '/')) delete next[path];
        });
      } else {
        delete next[selectedPath];
      }
      return next;
    });

    flash(`Deleted: ${name}`);
    setSelectedPath(null);
  };

  // ── Rename ─────────────────────────────────────────────────────────────
  const handleRename = () => {
    if (!selectedPath) return;
    const oldName = getBaseName(selectedPath);

    if (PROTECTED.has(selectedPath)) {
      alert('Protected system folder cannot be renamed!');
      return;
    }

    const newName = prompt('Enter new name:', oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const trimmed = newName.trim();

    const err = validateFilename(trimmed);
    if (err) { alert(err); return; }

    const parent = getParentPath(selectedPath);
    const newPath = joinPath(parent, trimmed);

    if (files[newPath]) { alert('Destination name already exists!'); return; }

    const entry = files[selectedPath];
    if (!entry) return;

    setFiles(prev => {
      const next = { ...prev };
      if (entry.type === 'dir') {
        Object.keys(next).forEach(path => {
          if (path === selectedPath) {
            next[newPath] = next[path];
            delete next[path];
          } else if (path.startsWith(selectedPath + '/')) {
            const suffix = path.slice(selectedPath.length);
            next[newPath + suffix] = next[path];
            delete next[path];
          }
        });
      } else {
        next[newPath] = entry;
        delete next[selectedPath];
      }
      return next;
    });

    flash(`Renamed to: ${trimmed}`);
    setSelectedPath(newPath);
  };

  // ── Open file in appropriate app ──────────────────────────────────────
  const handleOpenFile = (path) => {
    if (path.endsWith('.pyt') || path.endsWith('.pyr') || path.endsWith('.txt') || path.endsWith('.cfg')) {
      window.activeOpenFile_pyrite_ide = path;
      openApp('pyrite_ide');
    } else if (path.endsWith('.mp3')) {
      openApp('music');
    } else {
      alert('No default viewer for this file type. You can open text files in the Pyrite IDE.');
    }
  };

  // ── Derived list of items in current dir ────────────────────────────────
  const currentItems = Object.keys(files)
    .filter(path => getParentPath(path) === currentDir)
    .map(path => ({ path, ...files[path] }))
    .filter(item => !searchQuery || getBaseName(item.path).toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return getBaseName(a.path).localeCompare(getBaseName(b.path));
    });

  const selectedIsProtected = selectedPath && PROTECTED.has(selectedPath);

  return (
    <div style={styles.container}>
      {/* Top toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.navGroup}>
          <button onClick={handleBack} disabled={historyIndex === 0} style={styles.toolBtn} title="Back">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleForward} disabled={historyIndex >= history.length - 1} style={styles.toolBtn} title="Forward">
            <ChevronRight size={16} />
          </button>
          <button onClick={handleUp} disabled={currentDir === '/'} style={styles.toolBtn} title="Up a level">
            <ArrowUp size={16} />
          </button>
        </div>

        <div style={styles.addressBar}>
          <HardDrive size={14} style={{ marginRight: '6px', color: '#94a3b8', flexShrink: 0 }} />
          <span style={styles.addressText}>{displayPath(currentDir)}</span>
        </div>

        <div style={styles.searchContainer}>
          <Search size={14} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* File Action Controls */}
      <div style={styles.actionControls}>
        <button onClick={handleNewFolder} style={styles.actionBtn}>
          <Plus size={14} style={{ marginRight: '4px' }} /> Folder
        </button>
        <button onClick={handleNewFile} style={styles.actionBtn}>
          <Plus size={14} style={{ marginRight: '4px' }} /> File
        </button>
        <button
          onClick={handleRename}
          disabled={!selectedPath || selectedIsProtected}
          style={{ ...styles.actionBtn, ...((!selectedPath || selectedIsProtected) ? styles.disabledBtn : {}) }}
        >
          <Edit size={14} style={{ marginRight: '4px' }} /> Rename
        </button>
        <button
          onClick={handleDelete}
          disabled={!selectedPath || selectedIsProtected}
          style={{ ...styles.actionBtnDanger, ...((!selectedPath || selectedIsProtected) ? styles.disabledBtn : {}) }}
        >
          <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete
        </button>

        {statusMsg && <span style={styles.statusMsg}>{statusMsg}</span>}
      </div>

      <div style={styles.mainArea}>
        {/* Left quick links */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>PLACES</div>
          <div onClick={() => navigateTo(ROOT)} style={{ ...styles.sidebarItem, ...(currentDir === ROOT ? styles.sidebarItemActive : {}) }}>
            🏠 Home
          </div>
          <div onClick={() => navigateTo(`${ROOT}/documents`)} style={{ ...styles.sidebarItem, ...(currentDir === `${ROOT}/documents` ? styles.sidebarItemActive : {}) }}>
            📁 Documents
          </div>
          <div onClick={() => navigateTo(`${ROOT}/downloads`)} style={{ ...styles.sidebarItem, ...(currentDir === `${ROOT}/downloads` ? styles.sidebarItemActive : {}) }}>
            📁 Downloads
          </div>
          <div onClick={() => navigateTo('/')} style={{ ...styles.sidebarItem, ...(currentDir === '/' ? styles.sidebarItemActive : {}) }}>
            💾 Root (/)
          </div>
        </div>

        {/* Right main grid */}
        <div style={styles.gridContainer}>
          {currentItems.map(item => {
            const name = getBaseName(item.path);
            const isDir = item.type === 'dir';
            const isSelected = selectedPath === item.path;

            let IconComponent = File;
            let iconColor = '#94a3b8';
            if (isDir) {
              IconComponent = Folder;
              iconColor = '#fbbf24';
            } else if (name.endsWith('.pyt') || name.endsWith('.pyr')) {
              IconComponent = FileCode;
              iconColor = '#60a5fa';
            } else if (name.endsWith('.txt') || name.endsWith('.cfg')) {
              IconComponent = FileText;
              iconColor = '#34d399';
            }

            return (
              <div
                key={item.path}
                onClick={() => setSelectedPath(item.path)}
                onDoubleClick={() => (isDir ? navigateTo(item.path) : handleOpenFile(item.path))}
                style={{ ...styles.gridItem, ...(isSelected ? styles.gridItemSelected : {}) }}
                className="explorer-grid-item"
              >
                <IconComponent size={36} color={iconColor} style={{ marginBottom: '8px' }} />
                <span style={styles.gridItemLabel}>{name}</span>
              </div>
            );
          })}
          {currentItems.length === 0 && (
            <div style={styles.emptyDir}>
              {searchQuery ? 'No matching items' : 'Folder is empty'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
  },
  toolbar: {
    height: '42px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '12px',
    flexShrink: 0,
    overflowX: 'auto',
  },
  navGroup: { display: 'flex', gap: '4px', flexShrink: 0 },
  toolBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  addressBar: {
    flex: 1,
    minWidth: 0,
    height: '28px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
  },
  addressText: {
    fontSize: '12px',
    color: '#cbd5e1',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  searchContainer: {
    width: '160px',
    flexShrink: 0,
    height: '28px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    gap: '6px',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#f8fafc',
    fontSize: '12px',
    width: '100%',
  },
  actionControls: {
    minHeight: '36px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '8px',
    flexShrink: 0,
    overflowX: 'auto',
  },
  actionBtn: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  actionBtnDanger: {
    backgroundColor: '#991b1b',
    color: '#fca5a5',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  disabledBtn: { opacity: 0.4, cursor: 'not-allowed' },
  statusMsg: {
    marginLeft: 'auto',
    fontSize: '11px',
    color: '#34d399',
    fontStyle: 'italic',
  },
  mainArea: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'row',
  },
  sidebar: {
    width: '180px',
    flexShrink: 0,
    backgroundColor: '#1e293b',
    borderRight: '1px solid #334155',
    padding: '12px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflowY: 'auto',
  },
  sidebarHeader: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#64748b',
    padding: '6px 8px',
    letterSpacing: '0.05em',
  },
  sidebarItem: {
    padding: '8px 10px',
    fontSize: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#cbd5e1',
    transition: 'all 0.2s',
  },
  sidebarItemActive: {
    backgroundColor: '#334155',
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  gridContainer: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    padding: '16px',
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gridAutoRows: 'max-content',
    gap: '16px',
    alignContent: 'flex-start',
  },
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  gridItemSelected: {
    backgroundColor: '#334155',
    border: '1px solid #fbbf24',
  },
  gridItemLabel: {
    fontSize: '11px',
    textAlign: 'center',
    wordBreak: 'break-all',
    marginTop: '4px',
    color: '#cbd5e1',
    lineHeight: '1.3',
  },
  emptyDir: {
    gridColumn: '1 / -1',
    padding: '40px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#475569',
    fontStyle: 'italic',
  },
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    .toolBtn:hover { background-color: rgba(255,255,255,0.05) !important; }
    .explorer-grid-item:hover { background-color: rgba(255, 255, 255, 0.03); }
  `;
  document.head.appendChild(styleSheet);
}