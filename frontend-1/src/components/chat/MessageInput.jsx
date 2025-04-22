import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useDropzone } from "react-dropzone";
import { Send, Paperclip, Mic, Loader2, X } from "lucide-react";
import { uploadVoiceRecording } from "../../services/api";
import VoiceRecorder from "./VoiceInput";

/**
 * MessageInput Component - Handles user text input, voice recording, and file attachments
 */
const MessageInput = ({ onSendMessage, onAttachFile, isTyping, darkMode }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const [pastedImage, setPastedImage] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleSaveRecording = (text) => {
    setMessage(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    setShowVoiceRecorder(false);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle clipboard paste events for images
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            const imageUrl = URL.createObjectURL(blob);
            setPastedImage({
              file: blob,
              preview: imageUrl,
            });
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  // Dropzone configuration for file attachments
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      onAttachFile(acceptedFiles);
    },
    noClick: true, // Prevent click from opening file dialog
  });

  // Handle sending a message
  const handleSendMessage = () => {
    if (message.trim() || pastedImage) {
      onSendMessage(message, pastedImage?.file);
      setMessage("");
      setPastedImage(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Handle key presses, particularly for sending messages with Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Remove the pasted image
  const handleRemovePastedImage = () => {
    setPastedImage(null);
  };

  return (
    <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)]">
      <div className="container mx-auto px-4 py-3 max-w-3xl">
        {/* Voice recorder overlay */}
        {showVoiceRecorder && (
          <VoiceRecorder
            onResult={handleSaveRecording}
            onClose={() => setShowVoiceRecorder(false)}
            darkMode={darkMode}
          />
        )}
        {/* Pasted image preview */}
        {pastedImage && (
          <div className="mb-2 relative">
            <div className="inline-block relative">
              <img
                src={pastedImage.preview}
                alt="Pasted content"
                className="max-h-40 rounded-lg border border-[var(--border)]"
              />
              <button
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                onClick={handleRemovePastedImage}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Drag and drop area */}
        <div
          {...getRootProps()}
          className={`relative rounded-lg transition-all duration-200 ${isDragActive
            ? "border-2 border-dashed border-primary-400 bg-primary-50 dark:bg-primary-950/30"
            : ""
            }`}
        >
          {isDragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent)]/50 backdrop-blur-sm rounded-lg z-10">
              <div className="text-center p-4 rounded-lg bg-[var(--background)] shadow-lg">
                <p className="font-medium text-sm">Drop files to attach</p>
              </div>
            </div>
          )}

          <input {...getInputProps()} />

          <div className="flex items-end gap-2 bg-[var(--accent)] p-2 rounded-lg border border-[var(--border)]">
            <div className="flex-grow relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Omni AI..."
                className="w-full resize-none bg-transparent py-2 px-3 outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                rows={1}
                disabled={isTyping}
              />
            </div>

            <div className="flex items-center">
              {" "}
              {/* Voice button */}
              <button
                type="button"
                onClick={() => {
                  // Voice recording functionality will be implemented
                  setShowVoiceRecorder(true);
                }}
                disabled={isTyping}
                className="p-2 rounded-md hover:bg-[var(--muted)] transition-all duration-200 text-[var(--muted-foreground)] disabled:opacity-50 mr-1 hover:scale-105 active:scale-95"
                aria-label="Voice input"
              >
                <Mic size={20} />
              </button>
              {/* Attach files button */}
              <button
                type="button"
                onClick={() => {
                  document.getElementById("file-upload").click();
                }}
                disabled={isTyping}
                className="p-2 rounded-md hover:bg-[var(--muted)] transition-all duration-200 text-[var(--muted-foreground)] disabled:opacity-50 mr-1 hover:scale-105 active:scale-95"
                aria-label="Attach files"
              >
                <Paperclip size={20} />
              </button>{" "}
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={(!message.trim() && !pastedImage) || isTyping}
                className="p-2 rounded-md transition-all duration-200 bg-claude-purple text-white hover:bg-claude-purple/90 disabled:opacity-50 disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)] hover:scale-105 active:scale-95"
                aria-label="Send message"
              >
                {isTyping ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input for attachments */}
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAttachFile(Array.from(e.target.files));
            }
          }}
        />
      </div>
    </div>
  );
};

MessageInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onAttachFile: PropTypes.func.isRequired,
  isTyping: PropTypes.bool,
  darkMode: PropTypes.bool,
};

export default MessageInput;
