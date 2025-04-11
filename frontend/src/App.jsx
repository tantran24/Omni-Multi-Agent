import React, { useState, useEffect } from "react";
import ChatBox from "./components/ChatBox";
import MessageInput from "./components/MessageInput";
import { chatWithLLM } from "./services/api";
import "./App.css";

const App = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (!text || !text.trim()) return;

    try {

      setMessages((prev) => [...prev, { text, isUser: true }]);
      setIsTyping(true);


      const response = await chatWithLLM(text);

      if (response && response.response) {
        const botMessage = {
          text: response.response,
          isUser: false,
        };


        if (response.image) {
          const serverUrl =
            process.env.REACT_APP_API_URL || "http://localhost:8000";
          botMessage.image = `${serverUrl}${response.image}`;
        }


        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {

      setMessages((prev) => [
        ...prev,
        {
          text: `Error: ${error.message || "An unexpected error occurred"}`,
          isUser: false,
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };
  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem("chatHistory");
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="font-black text-6xl text-center">Omni Multi-Agent</h1>
        <button className="clear-chat-btn float-right" onClick={clearHistory}>
          Clear Chat
        </button>
      </header>

      <ChatBox messages={messages} isTyping={isTyping} />

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default App;