import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check, FileText } from 'lucide-react';

const DEFAULT_NOTES = [
  {
    id: '1',
    title: 'Hackathon Project Plan',
    content: '## Goals\n- Design awesome browser OS\n- Ensure smooth dragging physics\n- Integrate Web Audio Visualizer\n- Add customizable settings and wallpapers\n\n## Tasks\n- [x] Base Design Tokens\n- [x] Settings UI\n- [x] Music App Synthesis\n- [ ] Deploy to web',
    date: 'Jun 17, 2026'
  },
  {
    id: '2',
    title: 'Quick Scratchpad',
    content: 'Just some quick thoughts: We should add a drawing app (Canvas Paint) and a retro arcade game (Snake) in the browser to show off interactive elements. The user will love double-clicking files and running matrix rain in terminal.',
    date: 'Jun 16, 2026'
  },
  {
    id: '3',
    title: 'im onto something',
    content: "they are adding something in our water that makes us pee",
    date: 'Jun 17, 2026'
  }
];

export default function NotesApp() {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('tejaswas_webos_notes');
    return saved ? JSON.parse(saved) : DEFAULT_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [hoveredDeleteId, setHoveredDeleteId] = useState(null);

  // Save notes to LocalStorage
  useEffect(() => {
    localStorage.setItem('tejaswas_webos_notes', JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const createNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: 'Start typing here...',
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  // Deletes a note by id. Stops propagation so clicking the trash icon
  // doesn't also trigger the parent note-item's onClick (which would
  // re-select the note we just removed).
  const deleteNote = (id, e) => {
    e.stopPropagation();
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);

    if (activeNoteId === id && remaining.length > 0) {
      setActiveNoteId(remaining[0].id);
    } else if (remaining.length === 0) {
      setActiveNoteId(null);
    }
  };

  const startEditingTitle = () => {
    if (!activeNote) return;
    setTempTitle(activeNote.title);
    setEditingTitle(true);
  };

  const saveTitle = () => {
    if (tempTitle.trim()) {
      setNotes(notes.map(n => n.id === activeNoteId ? { ...n, title: tempTitle } : n));
    }
    setEditingTitle(false);
  };

  const updateContent = (content) => {
    setNotes(notes.map(n => n.id === activeNoteId ? { ...n, content } : n));
  };

  return (
    <div style={styles.container}>
      {/* Notes Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>Notes</span>
          <button onClick={createNote} className="new-note-btn" style={styles.newBtn} title="Create Note">
            <Plus size={16} />
          </button>
        </div>

        <div style={styles.notesList}>
          {notes.map(note => {
            const isActive = note.id === activeNoteId;
            return (
              <div
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setEditingTitle(false);
                }}
                className="note-item"
                style={{ ...styles.noteItem, ...(isActive ? styles.noteItemActive : {}) }}
              >
                <div style={styles.noteItemRow}>
                  <FileText size={16} color={isActive ? 'var(--accent)' : 'var(--text-secondary)'} />
                  <span style={styles.noteItemTitle} className="text-truncate">{note.title}</span>
                </div>
                <div style={styles.noteItemRow2}>
                  <span style={styles.noteItemDate}>{note.date}</span>
                  <button
                    onClick={(e) => deleteNote(note.id, e)}
                    onMouseEnter={() => setHoveredDeleteId(note.id)}
                    onMouseLeave={() => setHoveredDeleteId(null)}
                    className="delete-note-btn"
                    style={{
                      ...styles.deleteBtn,
                      opacity: isActive ? 0.7 : 0.45,
                      color: hoveredDeleteId === note.id
                        ? '#e05252'
                        : (isActive ? 'var(--text-primary, #e5e5e5)' : 'var(--text-muted, #999999)'),
                    }}
                    title="Delete note"
                    aria-label={`Delete ${note.title}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {notes.length === 0 && (
            <div style={styles.emptyState}>No notes saved. Click "+" to create one.</div>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div style={styles.editor}>
        {activeNote ? (
          <div style={styles.editorContent} className="fade-in">
            {/* Title Header */}
            <div style={styles.titleHeader}>
              {editingTitle ? (
                <div style={styles.titleInputForm}>
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    style={styles.titleInput}
                    autoFocus
                    maxLength={40}
                  />
                  <button onClick={saveTitle} style={styles.saveTitleBtn}>
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div style={styles.titleDisplay}>
                  <h2 style={styles.noteTitle} onClick={startEditingTitle}>
                    {activeNote.title}
                  </h2>
                  <button onClick={startEditingTitle} className="edit-title-btn" style={styles.editTitleBtn}>
                    <Edit size={14} />
                  </button>
                </div>
              )}
              <span style={styles.noteDateLabel}>{activeNote.date}</span>
            </div>

            {/* Notepad Textarea */}
            <textarea
              value={activeNote.content}
              onChange={(e) => updateContent(e.target.value)}
              style={styles.textarea}
              placeholder="Write something amazing..."
            />
          </div>
        ) : (
          <div style={styles.noActiveNote}>
            <FileText size={48} color="var(--text-muted)" />
            <h3>No Note Selected</h3>
            <p>Choose an existing note from the sidebar or make a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sidebar: {
    width: '200px',
    borderRight: '1px solid var(--border-glass)',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '16px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
  },
  sidebarTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  newBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: 'var(--accent)',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  // Single definition (the old file had a second `notesList` key further
  // down that silently overwrote this one, dropping flexDirection/gap/padding)
  notesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  noteItem: {
    padding: '10px 12px',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  noteItemActive: {
    backgroundColor: 'var(--accent-light)',
  },
  noteItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  noteItemTitle: {
    fontWeight: '600',
    fontSize: '13px',
    color: 'var(--text-primary)',
  },
  noteItemRow2: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteItemDate: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s, color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: '24px 8px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  editor: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  editorContent: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  titleHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
  },
  titleDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  noteTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  editTitleBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
  },
  titleInputForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  titleInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--accent)',
    outline: 'none',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-title)',
    paddingBottom: '2px',
  },
  saveTitleBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: 'var(--accent)',
  },
  noteDateLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  textarea: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    resize: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-main)',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '4px 0',
  },
  noActiveNote: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
    color: 'var(--text-muted)',
    padding: '24px',
  }
};

// Add standard hover stylesheet rule for notes app
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    .new-note-btn:hover {
      background-color: var(--accent-light) !important;
    }
    .note-item:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
    .edit-title-btn:hover {
      color: var(--text-primary) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}