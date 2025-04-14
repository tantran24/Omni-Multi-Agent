import React, { useEffect, useRef, useCallback, memo, useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import "katex/dist/katex.min.css";
import debounce from "lodash/debounce";
import { Volume2, X } from "lucide-react";
import MessageBubble from "./MessageBubble";

const ChatBox = ({ messages, isTyping, darkMode }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [modalImage, setModalImage] = useState(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const debouncedScrollToBottom = useCallback(
    debounce(() => {
      scrollToBottom();
    }, 100),
    [scrollToBottom]
  );

  useEffect(() => {
    debouncedScrollToBottom();
  }, [messages, isTyping, debouncedScrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      containerRef.current?.focus();
    }
  }, [messages.length]);

  const speak = useCallback((text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleImageClick = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-claude-purple to-claude-lavender flex items-center justify-center mb-6">
        <span className="text-white font-semibold text-xl">O</span>
      </div>
      <h2 className="text-2xl font-bold mb-2">Omni Multi-Agent</h2>
      <p className="text-[var(--muted-foreground)] max-w-md mb-6">
        An intelligent assistant that can understand text and images, generate
        content, and help with various tasks.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {[
          "Tell me about artificial intelligence",
          "Write a creative story about space exploration",
          "Describe the difference between machine learning and deep learning",
          "Help me brainstorm ideas for a science project",
        ].map((suggestion, index) => (
          <button
            key={index}
            className="text-left p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors text-sm"
            onClick={() => {
              // You can implement this functionality later
              console.log("Suggestion clicked:", suggestion);
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="flex-1 overflow-y-auto bg-[var(--background)] custom-scrollbar focus:outline-none relative"
      ref={containerRef}
      tabIndex={-1}
    >
      {messages.length > 0 ? (
        <div className="flex flex-col w-full max-w-3xl mx-auto py-4 px-4 md:px-0">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 last:mb-6"
              >
                <MessageBubble
                  message={message}
                  darkMode={darkMode}
                  onImageClick={handleImageClick}
                  showTimestamp={
                    index === messages.length - 1 ||
                    messages[index + 1]?.isUser !== message.isUser
                  }
                  onSpeakClick={
                    !message.isUser ? () => speak(message.text) : undefined
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bot-message)] shadow-message w-fit"
            >
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Image modal for viewing images larger */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <img
            src={modalImage}
            alt="Full size view"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center text-lg"
            aria-label="Close image"
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

ChatBox.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      isUser: PropTypes.bool.isRequired,
      image: PropTypes.string,
      isError: PropTypes.bool,
      timestamp: PropTypes.string,
    })
  ).isRequired,
  isTyping: PropTypes.bool.isRequired,
  darkMode: PropTypes.bool,
};

export default memo(ChatBox);
