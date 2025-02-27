import React, { useEffect, useRef, useCallback, memo, useMemo } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { motion, AnimatePresence } from "framer-motion";
import { formatModelOutput } from "../utils/formatOutput";
import { FaVolumeUp } from "react-icons/fa";
import "katex/dist/katex.min.css";

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
`;

const MessageBubbleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 70%;
  align-self: ${({ $isUser }) => ($isUser ? "flex-end" : "flex-start")};
  justify-content: ${({ $isUser }) => ($isUser ? "flex-end" : "flex-start")};
`;

const MessageBubble = styled(motion.div)`
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 15px;
  font-size: 1rem;
  background: ${({ $isUser }) => ($isUser ? "#FF7E5F" : "#FFFFFF")};
  color: ${({ $isUser }) => ($isUser ? "#fff" : "rgba(0, 0, 0, 0.87)")};
  align-self: ${({ $isUser }) => ($isUser ? "flex-end" : "flex-start")};
  border-bottom-${({ $isUser }) => ($isUser ? "right" : "left")}-radius: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 8px 0;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const SpeakButton = styled.button`
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const MessageContent = styled(ReactMarkdown)`
  word-wrap: break-word;
  white-space: pre-wrap;

  code {
    background: #f0f0f0;
    padding: 2px 4px;
    border-radius: 4px;
  }

  pre {
    background: #f0f0f0;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #f0f0f0;
  border-radius: 15px;
  width: fit-content;
  margin: 10px 0;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  background: #666;
  border-radius: 50%;
  animation: bounce 1s infinite ${(props) => props.delay}s;

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
`;

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const MessageImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
`;

const messageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const ChatBox = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottomImmediate = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToBottom = useMemo(
    () => debounce(scrollToBottomImmediate, 100),
    [scrollToBottomImmediate]
  );

  useEffect(() => {
    scrollToBottom();
    return () => scrollToBottom.cancel?.();
  }, [messages, scrollToBottom]);

  const speak = useCallback((text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const renderers = {
    img: ({ src, alt }) => (
      <MessageImage
        src={`http://localhost:8000${src}`}
        alt={alt}
        loading="lazy"
      />
    ),
  };

  return (
    <ChatContainer>
      <MessagesContainer>
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageBubbleContainer
              key={`${index}-${message.isUser}`}
              $isUser={message.isUser}
            >
              <MessageBubble
                $isUser={message.isUser}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={messageVariants}
                layout
              >
                <MessageContent
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={renderers}
                >
                  {formatModelOutput(message.text)}
                </MessageContent>
              </MessageBubble>
              {!message.isUser && (
                <SpeakButton
                  onClick={() => speak(message.text)}
                  title="Speak message"
                  aria-label="Speak message"
                >
                  <FaVolumeUp />
                </SpeakButton>
              )}
            </MessageBubbleContainer>
          ))}
        </AnimatePresence>
        {isTyping && (
          <TypingIndicator aria-label="Bot is typing">
            <Dot delay={0} />
            <Dot delay={0.2} />
            <Dot delay={0.4} />
          </TypingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
    </ChatContainer>
  );
};

ChatBox.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      isUser: PropTypes.bool.isRequired,
    })
  ).isRequired,
  isTyping: PropTypes.bool,
};

ChatBox.defaultProps = {
  isTyping: false,
};

export default memo(ChatBox);
