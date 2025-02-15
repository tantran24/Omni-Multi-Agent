import React, { useState } from "react";
import styled from "styled-components";
import { FaMicrophone, FaStop, FaFileUpload } from "react-icons/fa";

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px;
  background: white;
  width: 100%;
  max-width: 800px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const IconButton = styled.button`
  padding: 10px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.isRecording ? "#ff4444" : "#f0f0f0")};
  color: ${(props) => (props.isRecording ? "white" : "black")};

  &:hover {
    opacity: 0.8;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const SendButton = styled.button`
  padding: 10px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const MessageInput = ({ onSendMessage, onSpeechInput, onFileUpload }) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = React.useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onSendMessage(message);
      setMessage("");
      setIsTyping(false);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      const text = await onSpeechInput();
      if (text) {
        setMessage((prev) => prev + " " + text);
      }
    }
    setIsRecording(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputContainer>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isTyping}
        />
        <IconButton
          type="button"
          isRecording={isRecording}
          onClick={toggleRecording}
        >
          {isRecording ? <FaStop /> : <FaMicrophone />}
        </IconButton>
        <IconButton type="button" onClick={() => fileInputRef.current.click()}>
          <FaFileUpload />
        </IconButton>
        <FileInput
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,audio/*"
        />
        <SendButton type="submit" disabled={isTyping || !message.trim()}>
          Send
        </SendButton>
      </InputContainer>
    </form>
  );
};

export default MessageInput;
