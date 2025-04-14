import React, { useState, useEffect, useCallback } from "react";
import ChatBox from "./components/chat/ChatBox";
import MessageInput from "./components/chat/MessageInput";
import { chatWithLLM } from "./services/api";
import { Button } from "./components/ui/Button";
import { Moon, Sun, RotateCcw, Menu } from "lucide-react";
import "./App.css";

const App = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return (
      savedMode === "true" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });
  const [menuOpen, setMenuOpen] = useState(false);

  // Set dark mode class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Save chat history to localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (!text || !text.trim()) return;

    try {
      setMessages((prev) => [
        ...prev,
        { text, isUser: true, timestamp: new Date().toISOString() },
      ]);
      setIsTyping(true);

      const response = await chatWithLLM(text);

      if (response && response.response) {
        const botMessage = {
          text: response.response,
          isUser: false,
          timestamp: new Date().toISOString(),
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
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("chatHistory");
    setMenuOpen(false);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
    setMenuOpen(false);
  }, []);

  const handleAttachFile = (files) => {
    // Handle file attachment logic here
    console.log("Files attached:", files);
    // You can implement file handling functionality later
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Header with modern styling */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)] backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="mr-3 lg:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-full hover:bg-[var(--accent)] transition-colors"
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-claude-purple to-claude-lavender flex items-center justify-center">
                <span className="text-white font-semibold text-sm">O</span>
              </div>
              <h1 className="text-xl font-semibold hidden md:block">
                Omni Multi-Agent
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-[var(--accent)] transition-colors"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Button
              onClick={clearHistory}
              className="hidden md:flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--accent-foreground)]"
              variant="outline"
            >
              <RotateCcw size={16} />
              <span>Clear Chat</span>
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-[var(--border)] bg-[var(--background)]">
            <div className="container mx-auto p-4 flex flex-col gap-2">
              <Button
                onClick={clearHistory}
                className="flex items-center justify-center gap-2 w-full"
                variant="outline"
              >
                <RotateCcw size={16} />
                <span>Clear Chat</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      <ChatBox messages={messages} isTyping={isTyping} darkMode={darkMode} />

      <MessageInput
        onSendMessage={handleSendMessage}
        onAttachFile={handleAttachFile}
        isTyping={isTyping}
      />
    </div>
  );
};

export default App;
