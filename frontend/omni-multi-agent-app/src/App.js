import React, { useState, useEffect } from "react";
import ChatBox from "./components/ChatBox";
import MessageInput from "./components/MessageInput";
import styled from "styled-components";
import "./App.css";
import { chatWithLLM } from "./services/api";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
`;

const App = () => {
  // Initialize messages from localStorage
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem("chatMessages");
    return stored ? JSON.parse(stored) : [];
  });

  // Save messages to localStorage on each update
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (text) => {
    setMessages((prev) => [...prev, { text, isUser: true }]);
    const data = await chatWithLLM(text);
    setMessages((prev) => [...prev, { text: data.response, isUser: false }]);
  };

  const handleAttachFile = (files) => {
    // Handle file attachments
    console.log(files);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Omni Multi-Agent ChatBot</h1>
      </header>
      <main className="chat-area">
        <ChatBox messages={messages} />
      </main>
      <footer className="input-area">
        <MessageInput
          onSendMessage={handleSendMessage}
          onAttachFile={handleAttachFile}
        />
      </footer>
    </div>
  );
};

export default App;
