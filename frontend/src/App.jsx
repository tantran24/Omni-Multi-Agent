import React, { useState, useEffect } from "react";
import ChatBox from "./components/chat/ChatBox";
import MessageInput from "./components/chat/MessageInput";
import { chatWithLLM } from "./services/api";
import { Button } from "./components/ui/Button";
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

  const handleAttachFile = (files) => {
    // Handle file attachment logic here
    console.log("Files attached:", files);
    // You can implement file handling functionality later
  };

  return (
    <div className="app-container">
      {/* Update header classes for flex layout and vertical centering */}
      <header className="header flex items-center justify-between p-4"> {/* Added flex, items-center, justify-between, p-4 */}
        <h1 className="font-black text-4xl md:text-6xl text-center flex-grow">Omni Multi-Agent</h1> {/* Adjusted text size and added flex-grow */}
        {/* Use the styled Button component */}
        <Button onClick={clearHistory} className="ml-4"> {/* Added ml-4 for spacing */}
          Clear Chat
        </Button>
      </header>

      <ChatBox messages={messages} isTyping={isTyping} />

      <MessageInput
        onSendMessage={handleSendMessage}
        onAttachFile={handleAttachFile}
      />
    </div>
  );
};

export default App;
