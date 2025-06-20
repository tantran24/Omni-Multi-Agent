import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  MessageSquare,
  Calendar,
  Trash2,
  Edit3,
  Check,
  Clock,
} from "lucide-react";
import {
  listSessions,
  createSession,
  deleteSession,
  updateSession,
  getSessionMessages,
} from "../../services/memoryApi";

const SessionManager = ({
  isOpen,
  onClose,
  onSessionSelect,
  currentSessionId,
}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionList = await listSessions();
      setSessions(sessionList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      const newSession = await createSession();
      await fetchSessions();
      onSessionSelect(newSession.id);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteSession(sessionId);
      await fetchSessions();

      // If we deleted the current session, clear the selection
      if (sessionId === currentSessionId) {
        onSessionSelect(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = async (sessionId) => {
    if (!editTitle.trim()) return;

    try {
      setLoading(true);
      await updateSession(sessionId, editTitle);
      await fetchSessions();
      setEditingSession(null);
      setEditTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (session) => {
    setEditingSession(session.id);
    setEditTitle(session.title);
  };

  const cancelEditing = () => {
    setEditingSession(null);
    setEditTitle("");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[80vh] bg-[var(--background)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[var(--foreground)]" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Chat Sessions
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:bg-[var(--foreground)]/90 transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
              New Chat
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {loading && sessions.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-[var(--muted-foreground)] py-12">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No chat sessions yet</p>
              <p className="text-sm">
                Create your first chat session to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`group p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      session.id === currentSessionId
                        ? "border-[var(--foreground)] bg-[var(--accent)]/20"
                        : "border-[var(--border)] hover:border-[var(--foreground)]/30 hover:bg-[var(--muted)]/50"
                    }`}
                    onClick={() => {
                      if (editingSession !== session.id) {
                        onSessionSelect(session.id);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {editingSession === session.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 px-2 py-1 bg-transparent border border-[var(--border)] rounded text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleEditSession(session.id);
                                } else if (e.key === "Escape") {
                                  cancelEditing();
                                }
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSession(session.id);
                              }}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditing();
                              }}
                              className="p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-medium text-[var(--foreground)] truncate">
                              {session.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-[var(--muted-foreground)]">
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatDate(session.updated_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare size={12} />
                                {session.message_count} messages
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {editingSession !== session.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(session);
                            }}
                            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded"
                            title="Edit session title"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            title="Delete session"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

SessionManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSessionSelect: PropTypes.func.isRequired,
  currentSessionId: PropTypes.string,
};

export default SessionManager;
