import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import styled from "styled-components";
import { formatModelOutput } from "../../utils/formatters/formatOutput";

// Message bubble container with better positioning
const BubbleContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  width: 100%;
  align-items: ${({ $isUser }) => ($isUser ? "flex-end" : "flex-start")};
`;

// User/bot indicator
const SenderIndicator = styled.div`
  font-size: 0.75rem;
  margin-bottom: 4px;
  color: ${({ $isUser }) => ($isUser ? "#7c7c7c" : "#505050")};
  padding-left: ${({ $isUser }) => ($isUser ? "0" : "12px")};
  padding-right: ${({ $isUser }) => ($isUser ? "12px" : "0")};
`;

// Actual message bubble with balanced dimensions
const Bubble = styled(motion.div)`
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.95rem;
  background: ${({ $isUser }) => ($isUser ? "#FF7E5F" : "#FFFFFF")};
  color: ${({ $isUser }) => ($isUser ? "#fff" : "#333")};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-bottom-${({ $isUser }) => ($isUser ? "right" : "left")}-radius: 4px;
  transition: transform 0.2s ease;
  max-width: 65%;
  width: fit-content;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

// Content styling
const Content = styled.div`
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
  color: ${({ $isUser }) => ($isUser ? "#fff" : "#333")};

  code {
    background: #f0f0f0;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: monospace;
    color: #333; /* Ensure code text is visible */
  }

  pre {
    background: #f0f0f0;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-family: monospace;
    margin: 10px 0;
    color: #333; /* Ensure preformatted text is visible */
  }
`;

// Image styling
const MessageImage = styled.img`
  max-width: 100%;
  margin-top: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }
`;

// Actions container for things like speak button
const ActionsContainer = styled.div`
  display: flex;
  justify-content: ${({ $isUser }) => ($isUser ? "flex-end" : "flex-start")};
  margin-top: 4px;
`;

const messageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * MessageBubble - Displays a chat message with text and optional image
 * @param {Object} props Component props
 * @param {Object} props.message The message object with text, isUser flag, and optional image
 * @param {Function} props.onImageClick Function to call when image is clicked
 * @param {ReactNode} props.actions Optional actions to display below the message (like speak button)
 */
const MessageBubble = ({ message, onImageClick, actions }) => {
  const { text, isUser, image } = message;

  return (
    <BubbleContainer $isUser={isUser}>
      <SenderIndicator $isUser={isUser}>
        {isUser ? "You" : "Omni Assistant"}
      </SenderIndicator>
      <Bubble
        $isUser={isUser}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={messageVariants}
        layout
      >
        <Content $isUser={isUser}>{formatModelOutput(text)}</Content>

        {image && (
          <MessageImage
            src={image}
            alt="Generated Content"
            onClick={() => onImageClick(image)}
            onError={(e) => {
              console.error("Image failed to load:", image);
              e.target.src = "/path/to/fallback-image.png";
            }}
          />
        )}
      </Bubble>

      {actions && (
        <ActionsContainer $isUser={isUser}>{actions}</ActionsContainer>
      )}
    </BubbleContainer>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    text: PropTypes.string.isRequired,
    isUser: PropTypes.bool.isRequired,
    image: PropTypes.string,
  }).isRequired,
  onImageClick: PropTypes.func.isRequired,
  actions: PropTypes.node,
};

export default MessageBubble;
