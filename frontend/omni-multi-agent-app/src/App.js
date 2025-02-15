import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  const [isTyping, setIsTyping] = useState(false);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (text) => {
    try {
      if (!text || !text.trim()) return;

      setMessages((prev) => [...prev, { text, isUser: true }]);
      setIsTyping(true);

      await new Promise((resolve) => setTimeout(resolve, 500));
      const response = await chatWithLLM(text);

      if (response && response.response) {
        try {
          await textToSpeech(response.response);
        } catch (ttsError) {
          console.warn("TTS failed but continuing with chat:", ttsError);
        }

        // Create a local copy of the response for the typing effect
        const fullResponse = response.response;
        const totalLength = fullResponse.length;

        // Add an initial bot message
        setMessages((prev) => [...prev, { text: "", isUser: false }]);

        // Update the message character by character
        for (let i = 0; i <= totalLength; i++) {
          const currentText = fullResponse.slice(0, i);
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            newMessages[newMessages.length - 1] = {
              text: currentText,
              isUser: false,
            };
            return newMessages;
          });

          // Add delay between characters
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
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
    <motion.div
      className="app-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header">
        <h1>Omni Multi-Agent ChatBot</h1>
        {!isConfigured && <GPTConfig onConfigured={handleGPTConfigured} />}
        <button className="clear-chat-btn" onClick={clearChat}>
          Clear Chat
        </button>
      </div>
      <ChatBox messages={messages} isTyping={isTyping} />
      <div className="input-area">
        <MessageInput
          onSendMessage={handleSendMessage}
          onSpeechInput={handleSpeechInput}
          onFileUpload={handleFileUpload}
        />
      </div>
    </motion.div>
  );
};

export default App;
