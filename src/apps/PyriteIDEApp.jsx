import React, { useState, useEffect } from 'react';
import { Save, Play, Plus, Trash2, FileCode, Terminal, Code2 } from 'lucide-react';
import { runPyrite } from '../utils/pyrite';

const ROOT = '/home/tejaswa';

export default function PyriteIDEApp({ files, setFiles }) {
  const [activeFilePath, setActiveFilePath] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [consoleError, setConsoleError] = useState(null);
  const [execTime, setExecTime] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  // Load the first available Pyrite file on mount
  useEffect(() => {
    const pyriteFiles = Object.keys(files).filter(path => 
      files[path].type === 'file' && (path.endsWith('.pyt') || path.endsWith('.pyr'))
    );
    if (pyriteFiles.length > 0 && !activeFilePath) {
      handleOpenFile(pyriteFiles[0]);
    }
  }, [files]);

  const handleOpenFile = (path) => {
    setActiveFilePath(path);
    setEditorContent(files[path]?.content || '');
    setConsoleOutput([]);
    setConsoleError(null);
    setExecTime(null);
  };

  const handleSaveFile = () => {
    if (!activeFilePath) return;
    setFiles(prev => ({
      ...prev,
      [activeFilePath]: {
        ...prev[activeFilePath],
        content: editorContent
      }
    }));
    setConsoleOutput(prev => [...prev, `[IDE] Saved: ${activeFilePath.split('/').pop()}`]);
  };

  const handleCreateFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    let name = newFileName.trim();
    if (!name.endsWith('.pyt') && !name.endsWith('.pyr')) {
      name += '.pyt';
    }

    const path = `${ROOT}/documents/${name}`;
    if (files[path]) {
      alert('File already exists!');
      return;
    }

    setFiles(prev => ({
      ...prev,
      [path]: {
        type: 'file',
        content: `# New Pyrite Script: ${name}\n\nfn main():\n    print("Hello from ${name}!")\n\nmain()`
      }
    }));

    setNewFileName('');
    setShowNewFileModal(false);
    setActiveFilePath(path);
    setEditorContent(`# New Pyrite Script: ${name}\n\nfn main():\n    print("Hello from ${name}!")\n\nmain()`);
  };

  const handleDeleteFile = (path, e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${path.split('/').pop()}?`)) {
      const newFiles = { ...files };
      delete newFiles[path];
      setFiles(newFiles);

      if (activeFilePath === path) {
        setActiveFilePath('');
        setEditorContent('');
      }
    }
  };

  const handleRunCode = () => {
    const logs = [];
    setConsoleOutput([]);
    setConsoleError(null);
    const start = performance.now();
    try {
      runPyrite(editorContent, (line) => {
        logs.push(line);
      });
      const end = performance.now();
      setConsoleOutput(logs);
      setExecTime((end - start).toFixed(1));
    } catch (err) {
      setConsoleError(err.message);
      setConsoleOutput(logs);
      setExecTime(null);
    }
  };

  // Get list of Pyrite files
  const pyriteFiles = Object.keys(files)
    .filter(path => files[path].type === 'file' && (path.endsWith('.pyt') || path.endsWith('.pyr')))
    .sort();

  return (
    <div style={styles.container}>
      {/* Top Menu Bar */}
      <div style={styles.menuBar}>
        <div style={styles.menuLeft}>
          <Code2 size={16} color="#fbbf24" style={{ marginRight: '6px' }} />
          <span style={styles.menuTitle}>Pyrite Studio IDE</span>
        </div>
        <div style={styles.menuRight}>
          <button onClick={() => setShowNewFileModal(true)} style={styles.actionBtn} title="Create New File">
            <Plus size={14} style={{ marginRight: '4px' }} /> New
          </button>
          <button onClick={handleSaveFile} disabled={!activeFilePath} style={{ ...styles.actionBtn, ...(!activeFilePath ? styles.disabledBtn : {}) }} title="Save Current File (Ctrl+S)">
            <Save size={14} style={{ marginRight: '4px' }} /> Save
          </button>
          <button onClick={handleRunCode} disabled={!editorContent} style={{ ...styles.actionBtnRun, ...(!editorContent ? styles.disabledBtn : {}) }} title="Run Code">
            <Play size={14} style={{ marginRight: '4px' }} /> Run
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={styles.workspace}>
        {/* Left Panel: Files Explorer */}
        <div style={styles.fileTree}>
          <div style={styles.sidebarHeader}>
            <span>📁 FILES (.pyt)</span>
          </div>
          <div style={styles.filesList}>
            {pyriteFiles.map(path => {
              const name = path.split('/').pop();
              const isActive = activeFilePath === path;
              return (
                <div 
                  key={path} 
                  onClick={() => handleOpenFile(path)}
                  style={{ ...styles.fileItem, ...(isActive ? styles.fileItemActive : {}) }}
                  className="file-explorer-item"
                >
                  <FileCode size={14} color={isActive ? '#fbbf24' : '#94a3b8'} style={{ marginRight: '8px', minWidth: '14px' }} />
                  <span style={styles.fileName} title={path}>{name}</span>
                  <button 
                    onClick={(e) => handleDeleteFile(path, e)} 
                    style={styles.deleteBtn}
                    className="delete-file-btn"
                    title="Delete File"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
            {pyriteFiles.length === 0 && (
              <div style={styles.emptyFiles}>No Pyrite files found. Click "New" to create one.</div>
            )}
          </div>
        </div>

        {/* Center Panel: Code Editor */}
        <div style={styles.editorArea}>
          <div style={styles.editorHeader}>
            <span style={styles.currentFilePath}>
              {activeFilePath ? `documents / ${activeFilePath.split('/').pop()}` : 'No File Open'}
            </span>
          </div>
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const nextContent = editorContent.substring(0, start) + "    " + editorContent.substring(end);
                setEditorContent(nextContent);
                setTimeout(() => {
                  e.target.selectionStart = e.target.selectionEnd = start + 4;
                }, 0);
              }
            }}
            placeholder="# Write your Pyrite code here..."
            style={styles.textarea}
            disabled={!activeFilePath}
            spellCheck="false"
          />
        </div>

        {/* Right Panel: Interactive Console */}
        <div style={styles.consoleArea}>
          <div style={styles.consoleHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={14} /> Output Terminal
            </span>
            {execTime && (
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                Done in {execTime}ms
              </span>
            )}
          </div>
          <div style={styles.consoleBody}>
            {consoleError && (
              <div style={styles.consoleError}>{consoleError}</div>
            )}
            {consoleOutput.map((line, idx) => (
              <div key={idx} style={styles.consoleLine}>{line}</div>
            ))}
            {consoleOutput.length === 0 && !consoleError && (
              <div style={styles.consolePlaceholder}>
                Press "Run" to execute code. Output will display here.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleCreateFile} style={styles.modal}>
            <h3 style={styles.modalTitle}>Create New Pyrite File</h3>
            <input 
              type="text" 
              placeholder="script_name.pyt" 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              style={styles.modalInput}
              autoFocus
            />
            <div style={styles.modalButtons}>
              <button type="button" onClick={() => setShowNewFileModal(false)} style={styles.modalCancelBtn}>
                Cancel
              </button>
              <button type="submit" style={styles.modalSubmitBtn}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
  },
  menuBar: {
    height: '40px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
  },
  menuLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  menuRight: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  actionBtnRun: {
    backgroundColor: '#fbbf24',
    color: '#0f172a',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  disabledBtn: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  workspace: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    minHeight: 0,
    overflow: 'hidden',
  },
  fileTree: {
    width: '180px',
    flexShrink: 0,
    backgroundColor: '#1e293b',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '10px 12px',
    borderBottom: '1px solid #334155',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: '0.05em',
  },
  filesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#cbd5e1',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  fileItemActive: {
    backgroundColor: '#334155',
    color: '#fbbf24',
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    display: 'none',
    transition: 'color 0.2s',
  },
  emptyFiles: {
    padding: '12px',
    fontSize: '11px',
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  editorArea: {
    flex: 1.5,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #334155',
  },
  editorHeader: {
    height: '32px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    flexShrink: 0,
  },
  currentFilePath: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  textarea: {
    flex: 1,
    backgroundColor: '#0b0f19',
    color: '#f8fafc',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '12px',
    border: 'none',
    outline: 'none',
    resize: 'none',
  },
  consoleArea: {
    flex: 0.8,
    minWidth: 0,
    backgroundColor: '#020617',
    display: 'flex',
    flexDirection: 'column',
  },
  consoleHeader: {
    height: '32px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#94a3b8',
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
  consoleError: {
    color: '#ef4444',
    whiteSpace: 'pre-wrap',
  },
  consolePlaceholder: {
    color: '#475569',
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modal: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '20px',
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modalTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#cbd5e1',
    margin: 0,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '8px 12px',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    backgroundColor: '#fbbf24',
    color: '#0f172a',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 16px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  }
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .file-explorer-item:hover {
      background-color: rgba(255, 255, 255, 0.04) !important;
    }
    .file-explorer-item:hover .delete-file-btn {
      display: block !important;
    }
    .delete-file-btn:hover {
      color: #ef4444 !important;
      background-color: rgba(239, 68, 68, 0.1) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
