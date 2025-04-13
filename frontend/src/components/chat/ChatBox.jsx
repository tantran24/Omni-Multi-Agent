import React, {
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { AnimatePresence } from "framer-motion";
import "katex/dist/katex.min.css";
import debounce from "lodash/debounce";
import MessageBubble from "./MessageBubble";

// Styled Components
const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f9f9f9;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
`;

const SpeakButton = styled.button`
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
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

const ImageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  pointer-events: ${(props) => (props.$isOpen ? "auto" : "none")};
  transition: opacity 0.3s ease;
`;

const ModalImage = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
  }
`;

/**
 * ChatBox - Main component that displays the conversation
 * @param {Object} props Component props
 * @param {Array} props.messages Array of message objects
 * @param {boolean} props.isTyping Whether the bot is currently typing
 */
const ChatBox = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);
  const [modalImage, setModalImage] = useState(null);

  // Scroll to bottom when messages change
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

  // Text-to-speech functionality
  const speak = useCallback((text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Image modal handlers
  const handleImageClick = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  return (
    <ChatContainer>
      <MessagesContainer>
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <div key={`${index}-${message.isUser}`}>
              <MessageBubble
                message={message}
                onImageClick={handleImageClick}
                actions={
                  !message.isUser && (
                    <SpeakButton
                      onClick={() => speak(message.text)}
                      title="Speak message"
                      aria-label="Speak message"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M15.5 8a6.5 6.5 0 0 1 0 8"></path>
                        <path d="M17.5 5.5a10 10 0 0 1 0 13"></path>
                        <path d="M11 5 6 9H2v6h4l5 4V5z"></path>
                      </svg>
                    </SpeakButton>
                  )
                }
              />
            </div>
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

      {/* Image modal for viewing images larger */}
      <ImageModal $isOpen={!!modalImage} onClick={closeModal}>
        {modalImage && <ModalImage src={modalImage} alt="Full size view" />}
        <CloseButton onClick={closeModal} aria-label="Close image">
          ×
        </CloseButton>
      </ImageModal>
    </ChatContainer>
  );
};

ChatBox.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      isUser: PropTypes.bool.isRequired,
      image: PropTypes.string,
    })
  ).isRequired,
  isTyping: PropTypes.bool,
};

ChatBox.defaultProps = {
  isTyping: false,
};

export default memo(ChatBox);
