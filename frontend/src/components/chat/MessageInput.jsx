import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useDropzone } from "react-dropzone";
import { Popover } from "react-tiny-popover";
import { Send, Paperclip, Mic, Image, Loader2 } from "lucide-react";

/**
 * MessageInput Component - Handles user text input, voice recording, and file attachments
 */
const MessageInput = ({ onSendMessage, onAttachFile, isTyping }) => {
  const [message, setMessage] = useState("");
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  // Auto-focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Dropzone configuration for file attachments
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      onAttachFile(acceptedFiles);
      setAttachmentMenuOpen(false);
    },
    noClick: true, // Prevent click from opening file dialog
  });

  // Handle sending a message
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
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

  return (
    <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)]">
      <div className="container mx-auto px-4 py-3 max-w-3xl">
        {/* Drag and drop area */}
        <div
          {...getRootProps()}
          className={`relative rounded-lg transition-all duration-200 ${
            isDragActive
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
              <Popover
                isOpen={attachmentMenuOpen}
                positions={["top"]}
                padding={10}
                onClickOutside={() => setAttachmentMenuOpen(false)}
                content={
                  <div className="p-2 bg-[var(--background)] shadow-lg rounded-lg border border-[var(--border)] flex flex-col gap-1">
                    <button
                      className="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-[var(--accent)] text-[var(--foreground)]"
                      onClick={() => {
                        document.getElementById("file-upload").click();
                      }}
                    >
                      <Image size={16} /> Image
                    </button>
                    <button
                      className="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-[var(--accent)] text-[var(--foreground)]"
                      onClick={() => {
                        setAttachmentMenuOpen(false);
                        // Voice recording functionality would go here
                      }}
                    >
                      <Mic size={16} /> Voice
                    </button>
                  </div>
                }
              >
                <button
                  type="button"
                  onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                  disabled={isTyping}
                  className={`p-2 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] disabled:opacity-50`}
                  aria-label="Attach files"
                >
                  <Paperclip size={20} />
                </button>
              </Popover>

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping}
                className={`
                  p-2 rounded-md transition-colors
                  ${
                    message.trim() && !isTyping
                      ? "bg-claude-purple text-white hover:bg-claude-purple/90"
                      : "text-[var(--muted-foreground)] bg-transparent"
                  }
                  disabled:opacity-50
                `}
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
};

export default MessageInput;
