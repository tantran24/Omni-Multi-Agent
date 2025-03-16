import React, { useState } from "react";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";

// Styled components
const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ddd;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-right: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #e66a53, #e0a97d);
    transform: translateY(-2px);
  }
`;

// MessageInput Component
const MessageInput = ({ onSendMessage, onAttachFile }) => {
  const [message, setMessage] = useState("");

  // Dropzone configuration
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => onAttachFile(acceptedFiles),
  });

  // Handle sending a message
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  // Handle pressing "Enter" key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <InputContainer>
      {/* Text input for the message */}
      <Input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your message here"
      />

      {/* File attachment button */}
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Button>Attach Files</Button>
      </div>

      {/* Send button */}
      <Button onClick={handleSendMessage}>Send</Button>
    </InputContainer>
  );
};

export default MessageInput;