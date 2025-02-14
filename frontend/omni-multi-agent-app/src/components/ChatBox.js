import React from "react";
import styled from "styled-components";

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

const ChatBox = ({ messages }) => {
  return (
    <ChatContainer className="chat-box">
      {messages.map((message, index) => (
        <MessageBubble
          key={index}
          isUser={message.isUser}
          className={`chat-message ${message.isUser ? "user" : "bot"}`}
        >
          {message.text}
        </MessageBubble>
      ))}
    </ChatContainer>
  );
};

export default ChatBox;
