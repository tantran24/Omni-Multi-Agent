import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import VoiceRecorder from "./VoiceInput";
import { Button, IconButton } from "../ui/Button";

const InputContainer = styled.div`
  max-width: 800px;
  width: 90%;
  display: flex;
  align-items: center;
  align-self: center;
  padding: 12px;
  border-top: 1px solid #ddd;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
  gap: 8px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  color: #333;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
    box-shadow: 0 0 0 2px rgba(255, 126, 95, 0.2);
  }
`;

/**
 * MessageInput Component - Handles user text input, voice recording, and file attachments
 */
const MessageInput = ({ onSendMessage, onAttachFile }) => {
  const [message, setMessage] = useState("");

  // Dropzone configuration for file attachments
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
    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
      e.preventDefault();
      onSendMessage(message);
      setMessage("");
    }
  };

  // Handle voice recognition results
  const handleVoiceResult = (transcriptionText) => {
    setMessage((currentMessage) => {
      // If there's already text in input, add space before appending
      if (currentMessage.trim()) {
        return `${currentMessage.trim()} ${transcriptionText}`;
      }
      return transcriptionText;
    });
  };

  return (
    <InputContainer>
      {/* Text input for the message */}
      <Input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        aria-label="Message input"
      />{" "}
      {/* File attachment button */}
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <IconButton type="button" aria-label="Attach file">
          {" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </IconButton>
      </div>
      {/* Voice recorder with callback for results */}
      <VoiceRecorder onResult={handleVoiceResult} />
      {/* Send button */}
      <Button
        onClick={handleSendMessage}
        type="button"
        aria-label="Send message"
      >
        Send
      </Button>
    </InputContainer>
  );
};

MessageInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onAttachFile: PropTypes.func.isRequired,
};

export default MessageInput;
