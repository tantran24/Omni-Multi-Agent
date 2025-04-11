import React, { useState } from "react";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";
import { Paperclip } from "lucide-react";
import { IconButton, Button } from "../utils/customizeButton"
import VoiceRecorder from "./VoiceInput";

const InputContainer = styled.div`
  width: 60%;
  height: 10%;
  display: flex;
  align-items: center;
  align-self: center;
  padding: 10px;
  border-top: 1px solid #ddd;
  flex-wrap: wrap;
  justify-content: end;
  margin:20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
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

  // Xử lý kết quả từ voice recorder
  const handleVoiceResult = (transcriptionText) => {
    setMessage(currentMessage => {
      // Nếu đã có text trong input, thêm khoảng trắng trước khi nối
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
        placeholder="Enter your message here"
      />

      {/* File attachment button */}
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <IconButton>
          <Paperclip color="white" size={20} />
        </IconButton>
      </div>

      {/* Voice recorder with callback for results */}
      <VoiceRecorder onResult={handleVoiceResult} />

      {/* Send button */}
      <Button onClick={handleSendMessage}>Send</Button>
    </InputContainer>
  );
};

export default MessageInput;