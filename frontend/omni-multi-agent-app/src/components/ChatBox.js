import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { formatModelOutput } from "../utils/formatOutput";
import "katex/dist/katex.min.css";

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #f5f5f5;
  padding: 20px;
  gap: 10px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 15px;
  font-size: 1rem;
  background: ${({ isUser }) => (isUser ? "#007bff" : "#e5e5ea")};
  color: ${({ isUser }) => (isUser ? "#fff" : "#000")};
  align-self: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
  border-bottom-${({ isUser }) => (isUser ? "right" : "left")}-radius: 0;
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

const ChatBox = ({ messages }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <ChatContainer className="chat-box">
      <MessagesContainer>
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            isUser={message.isUser}
            className={`chat-message ${message.isUser ? "user" : "bot"}`}
          >
            <MessageContent
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {formatModelOutput(message.text)}
            </MessageContent>
            <small className="message-time">
              {new Date().toLocaleTimeString()}
            </small>
          </MessageBubble>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
    </ChatContainer>
  );
};

export default ChatBox;
