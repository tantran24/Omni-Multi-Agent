import React, { useState } from "react";
import styled from "styled-components";
import { useDropzone } from "react-dropzone";

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
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const MessageInput = ({ onSendMessage, onAttachFile }) => {
  const [message, setMessage] = useState("");
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => onAttachFile(acceptedFiles),
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <InputContainer>
      <Input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your message here"
      />
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Button>Attach Files</Button>
      </div>
      <Button onClick={handleSendMessage}>Send</Button>
    </InputContainer>
  );
};

export default MessageInput;
