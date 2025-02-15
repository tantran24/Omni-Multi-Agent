import React, { useState, useEffect } from "react";
import ChatBox from "./components/ChatBox";
import MessageInput from "./components/MessageInput";
import GPTConfig from "./components/GPTConfig";
import "./App.css";
import {
  chatWithLLM,
  startSpeechToText,
  textToSpeech,
  uploadFile,
} from "./services/api";

const App = () => {
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage on initial render
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [isConfigured, setIsConfigured] = useState(() => {
    // Check localStorage for configuration state
    return localStorage.getItem("gptConfigured") === "true";
  });

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (text) => {
    try {
      if (!text || !text.trim()) {
        throw new Error("Message cannot be empty");
      }

      // Add user message
      setMessages((prev) => [...prev, { text, isUser: true }]);

      // Get response from backend
      const response = await chatWithLLM(text);

      if (response && response.response) {
        try {
          await textToSpeech(response.response);
        } catch (ttsError) {
          console.warn("TTS failed but continuing with chat:", ttsError);
        }

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
      console.error("Error in handleSendMessage:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: `Error: ${
            error.response?.data?.detail ||
            error.message ||
            "An unexpected error occurred"
          }`,
          isUser: false,
          isError: true,
        },
      ]);
    }
  };

  const handleSpeechInput = async () => {
    try {
      const text = await startSpeechToText();
      return text;
    } catch (error) {
      console.error("Speech input error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Error processing speech input",
          isUser: false,
        },
      ]);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      const result = await uploadFile(file);
      setMessages((prev) => [
        ...prev,
        {
          text: `File uploaded: ${file.name}`,
          isUser: true,
          file: result.url,
        },
      ]);
    } catch (error) {
      console.error("File upload error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Error uploading file",
          isUser: false,
        },
      ]);
    }
  };

  const handleGPTConfigured = () => {
    setIsConfigured(true);
    localStorage.setItem("gptConfigured", "true");
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chatHistory");
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Omni Multi-Agent ChatBot</h1>
        {!isConfigured && <GPTConfig onConfigured={handleGPTConfigured} />}
        <button className="clear-chat-btn" onClick={clearChat}>
          Clear Chat
        </button>
      </header>
      <main className="chat-area">
        <ChatBox messages={messages} />
      </main>
      <footer className="input-area">
        <MessageInput
          onSendMessage={handleSendMessage}
          onSpeechInput={handleSpeechInput}
          onFileUpload={handleFileUpload}
        />
      </footer>
    </div>
  );
};

export default App;
