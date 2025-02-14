import React, { useState, useEffect } from "react";
import ChatBox from "./components/ChatBox";
import MessageInput from "./components/MessageInput";
import GPTConfig from "./components/GPTConfig";
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
  const [messages, setMessages] = useState([]);
  const [isConfigured, setIsConfigured] = useState(() => {
    // Check localStorage for configuration state
    return localStorage.getItem("gptConfigured") === "true";
  });

  const handleSendMessage = async (text) => {
    try {
      console.log("Sending message:", text); // Debug log

      // Add user message
      setMessages((prev) => [...prev, { text, isUser: true }]);

      // Get response from backend
      const response = await chatWithLLM(text);
      console.log("Response:", response); // Debug log

      if (response && response.response) {
        setMessages((prev) => [
          ...prev,
          {
            text: response.response,
            isUser: false,
          },
        ]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error details:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: `Error: ${error.response?.data?.detail || error.message}`,
          isUser: false,
        },
      ]);
    }
  };

  const handleGPTConfigured = () => {
    setIsConfigured(true);
    localStorage.setItem("gptConfigured", "true");
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Omni Multi-Agent ChatBot</h1>
        {!isConfigured && <GPTConfig onConfigured={handleGPTConfigured} />}
      </header>
      <main className="chat-area">
        <ChatBox messages={messages} />
      </main>
      <footer className="input-area">
        <MessageInput onSendMessage={handleSendMessage} />
      </footer>
    </div>
  );
};

export default App;
