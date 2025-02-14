import React, { useState } from "react";
import styled from "styled-components";

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px;
  background: white;
  width: 100%;
  max-width: 800px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const SendButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;

  &:hover {
    background: linear-gradient(135deg, #e66a53, #e0a97d);
  }
`;

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputContainer>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <SendButton type="submit">Send</SendButton>
      </InputContainer>
    </form>
  );
};

export default MessageInput;
