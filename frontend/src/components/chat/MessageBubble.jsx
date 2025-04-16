import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Copy, Check, MessageSquare, User, Volume2 } from "lucide-react";
import { formatModelOutput } from "../../utils/formatters/formatOutput";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

const TypewriterEffect = ({ text, delay = 3, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) onComplete();
    }
  }, [currentIndex, delay, text, isComplete, onComplete]);

  return (
    <>
      {formatModelOutput ? formatModelOutput(displayedText) : displayedText}
      {!isComplete && (
        <span className="typing-cursor">|</span>
      )}
    </>
  );
};

TypewriterEffect.propTypes = {
  text: PropTypes.string.isRequired,
  delay: PropTypes.number,
  onComplete: PropTypes.func
};

const MessageBubble = ({
  message,
  darkMode,
  showTimestamp,
  onImageClick,
  onSpeakClick,
}) => {
  const { text, isUser, image, isError, timestamp } = message;
  const [copied, setCopied] = useState(false);
  const [typewriterComplete, setTypewriterComplete] = useState(isUser);

  const formattedTimestamp = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakText = () => {
    if (onSpeakClick) {
      onSpeakClick();
    } else if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleImageClick = (imageUrl) => {
    if (onImageClick) {
      onImageClick(imageUrl);
    }
  };

  return (
    <div
      className={`flex flex-col w-full ${isUser ? "items-end" : "items-start"}`}
    >
      <div className="flex items-center gap-2 mb-1 px-2">
        <div
          className={`flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]`}
        >
          {isUser ? (
            <>
              <User size={12} />
              <span>You</span>
            </>
          ) : (
            <>
              <MessageSquare size={12} />
              <span>Omni AI</span>
            </>
          )}
          {showTimestamp && formattedTimestamp && (
            <span className="opacity-70 ml-1">{formattedTimestamp}</span>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`
          relative group max-w-[80%] md:max-w-[65%] w-fit
          rounded-lg shadow-message
          ${isUser
            ? "bg-white dark:bg-[var(--muted)] text-[var(--foreground)] dark:text-[var(--foreground)] rounded-br-sm border border-[var(--border)]"
            : isError
              ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
              : "bg-[var(--bot-message)] text-[var(--foreground)] rounded-bl-sm border border-[var(--border)]"
          }
        `}
      >
        {" "}
        <div className="p-3.5 overflow-hidden break-words whitespace-pre-wrap text-sm">
          {isUser || typewriterComplete ? (
            formatModelOutput ? formatModelOutput(text) : text
          ) : (
            <TypewriterEffect
              text={text}
              delay={5}
              onComplete={() => setTypewriterComplete(true)}
            />
          )}

          {image && (
            <div className="mt-2">
              <img
                src={image}
                alt="Generated content"
                className="chat-image rounded-md max-w-full cursor-pointer hover:opacity-95 transition-opacity hover:scale-[1.02]"
                onClick={() => handleImageClick(image)}
                onError={(e) => {
                  console.error("Image failed to load:", image);
                  e.target.src = "/path/to/fallback-image.png";
                }}
              />
            </div>
          )}
        </div>{" "}
        {!isUser && typewriterComplete && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity message-actions flex gap-1 bg-[var(--background)]/80 backdrop-blur-sm p-1 rounded-md shadow-sm border border-[var(--border)]">
            <button
              onClick={copyToClipboard}
              className="p-1 rounded-md hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
              aria-label="Copy message"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button
              onClick={speakText}
              className="p-1 rounded-md hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
              aria-label="Speak message"
            >
              <Volume2 size={14} />
            </button>
          </div>
        )}
      </motion.div>

      <style jsx>{`
        .typing-cursor {
          display: inline-block;
          animation: blink 1s step-end infinite;
        }
        
        @keyframes blink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    text: PropTypes.string.isRequired,
    isUser: PropTypes.bool.isRequired,
    image: PropTypes.string,
    isError: PropTypes.bool,
    timestamp: PropTypes.string,
  }).isRequired,
  darkMode: PropTypes.bool,
  showTimestamp: PropTypes.bool,
  onImageClick: PropTypes.func,
  onSpeakClick: PropTypes.func,
};

export default MessageBubble;