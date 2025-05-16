import React, { useEffect, useRef, useCallback, memo, useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import "katex/dist/katex.min.css";
import debounce from "lodash/debounce";
import { Volume2, X, Sparkles, MessageSquare } from "lucide-react";
import MessageBubble from "./MessageBubble";

const ChatBox = ({ messages, isTyping, darkMode, onPromptClick }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [modalImage, setModalImage] = useState(null);
  const [pdfAnalysisMessages, setPdfAnalysisMessages] = useState({});

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

  // Handle receiving PDF analysis results
  const handlePdfAnalysis = useCallback(
    (messageId, pdfContent) => {
      setPdfAnalysisMessages((prev) => ({
        ...prev,
        [messageId]: pdfContent,
      }));

      // Automatically create a new AI message with the analysis
      const analysisMessage = {
        text: `Here's an analysis of the PDF document:\n\n${pdfContent.substring(
          0,
          1000
        )}${pdfContent.length > 1000 ? "..." : ""}`,
        isUser: false,
        timestamp: new Date().toISOString(),
        isPdfAnalysis: true,
      };

      // We should ideally add this message to the state managed by App.jsx
      // For now, we'll use speak to communicate the analysis
      speak(
        `I've analyzed the PDF document. Here's what I found: ${pdfContent.substring(
          0,
          300
        )}`
      );
    },
    [speak]
  );

  const handleImageClick = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };
  const EmptyState = () => {
    // Animation variants for staggered animation
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          delayChildren: 0.3,
          staggerChildren: 0.2,
        },
      },
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    };

    return (
      <motion.div
        className="flex flex-col items-center justify-center h-full text-center p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {" "}
        <motion.div
          variants={itemVariants}
          className="w-20 h-20 rounded-full bg-[var(--foreground)] flex items-center justify-center mb-6 shadow-lg"
        >
          <Sparkles className="text-[var(--background)] h-10 w-10" />
        </motion.div>
        <motion.h2
          variants={itemVariants}
          className="text-2xl font-bold mb-3 text-[var(--foreground)]"
        >
          Omni Multi-Agent
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="text-[var(--muted-foreground)] max-w-md mb-8"
        >
          An intelligent assistant that can understand text and images, generate
          content, and help with various tasks.
        </motion.p>
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full"
        >
          {[
            "Tell me about artificial intelligence",
            "Write a creative story about space exploration",
            "Describe the difference between machine learning and deep learning",
            "Help me brainstorm ideas for a science project",
          ].map((suggestion, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-left p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors text-sm shadow-sm"
              onClick={() => onPromptClick(suggestion)}
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    );
  };
  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden bg-[var(--background)] custom-scrollbar focus:outline-none relative max-h-[calc(100vh-140px)] transition-colors duration-300"
      ref={containerRef}
      tabIndex={-1}
      style={{ height: "calc(100vh - 140px)" }}
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
                    !message.isUser
                      ? message.isPdfAnalysis
                        ? undefined // Don't offer speech for PDF analysis results that have already been spoken
                        : () => speak(message.text)
                      : undefined
                  }
                  onPdfAnalysis={
                    message.fileType === "pdf" ||
                    (message.image &&
                      message.image.toLowerCase().endsWith(".pdf"))
                      ? (pdfContent) => handlePdfAnalysis(index, pdfContent)
                      : undefined
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[var(--bot-message)] shadow-message w-fit border border-[var(--border)]"
              aria-label="Omni AI is typing..."
              role="status"
            >
              {" "}
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <MessageSquare
                    size={12}
                    className="text-[var(--foreground)]"
                  />
                </div>
                <div className="typing-indicator flex gap-1.5 items-center">
                  <motion.div
                    className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--foreground)]"
                    animate={{
                      y: [0, -3, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      times: [0, 0.5, 1],
                      delay: 0,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--foreground)]"
                    animate={{
                      y: [0, -3, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      times: [0, 0.5, 1],
                      delay: 0.2,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--foreground)]"
                    animate={{
                      y: [0, -3, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      times: [0, 0.5, 1],
                      delay: 0.4,
                      ease: "easeInOut",
                    }}
                  />
                </div>
                <span className="text-xs text-[var(--foreground)] font-medium">
                  Omni AI is thinking...
                </span>
              </div>
              <span className="sr-only">Omni AI is typing a response</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <EmptyState />
      )}{" "}
      {/* Image modal for viewing images larger */}
      {modalImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalImage}
              alt="Full size view"
              className="object-contain max-h-[85vh] rounded-lg"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white dark:bg-black/80 dark:hover:bg-black/95 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-700"
              aria-label="Close image"
            >
              <X size={24} />
            </motion.button>
          </motion.div>
        </motion.div>
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
  onPromptClick: PropTypes.func,
};

export default memo(ChatBox);
