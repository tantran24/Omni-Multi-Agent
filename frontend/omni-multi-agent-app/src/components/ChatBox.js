import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { motion, AnimatePresence } from "framer-motion";
import { formatModelOutput } from "../utils/formatOutput";
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

const ChatBox = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const messageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <ChatContainer>
      <MessagesContainer>
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageBubble
              key={`${index}-${message.isUser}`}
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
              >
                {formatModelOutput(message.text)}
              </MessageContent>
            </MessageBubble>
          ))}
        </AnimatePresence>
        {isTyping && (
          <TypingIndicator>
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

export default ChatBox;
