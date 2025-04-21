import React, { useState, useEffect, useCallback } from "react";
import ChatBox from "./components/chat/ChatBox";
import MessageInput from "./components/chat/MessageInput";
import { chatWithLLM } from "./services/api";
import { Button } from "./components/ui/Button";
import { Moon, Sun, RotateCcw, Menu } from "lucide-react";
import "./App.css";
import McpManager from "./components/mcp/McpManager"; // import MCP Manager

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
  const [showMcpManager, setShowMcpManager] = useState(false); // MCP manager visibility

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (text, imageFile) => {
    if ((!text || !text.trim()) && !imageFile) return;

    try {
      const newUserMessage = {
        text: text || "",
        isUser: true,
        timestamp: new Date().toISOString(),
      };

      if (imageFile) {
        newUserMessage.image = URL.createObjectURL(imageFile);
      }

      setMessages((prev) => [...prev, newUserMessage]);
      setIsTyping(true);

      let response;
      if (imageFile) {
        const formData = new FormData();
        formData.append("text", text || "");
        formData.append("image", imageFile);

        response = await chatWithLLM(text, formData);
      } else {
        response = await chatWithLLM(text);
      }
      if (response) {
        const botMessage = {
          text: response.response || "",
          isUser: false,
          timestamp: new Date().toISOString(),
        };

        if (response.image) {
          try {
            const serverUrl =
              import.meta.env.VITE_API_URL || "http://localhost:8000";
            const imageUrl = response.image.startsWith("/")
              ? `${serverUrl}${response.image}`
              : `${serverUrl}/${response.image}`;

            botMessage.image = imageUrl;
            console.log("Image URL:", botMessage.image);
          } catch (err) {
            console.error("Error forming image URL:", err);
          }
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
    if (!files || files.length === 0) return;

    const file = files[0];

    handleSendMessage("", file);
  };

  const handleStarterPrompt = (promptText) => {
    handleSendMessage(promptText);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
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
              onClick={() => {
                console.log("MCP Tools button clicked");
                setShowMcpManager(true);
              }}
              variant="primary"
              className="flex items-center gap-2"
            >
              MCP Tools
            </Button>

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
                onClick={() => {
                  console.log("MCP Tools (mobile) clicked");
                  setShowMcpManager(true);
                }}
                variant="primary"
                className="flex items-center justify-center gap-2 w-full"
              >
                MCP Tools
              </Button>
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

      {showMcpManager && (
        <McpManager onClose={() => setShowMcpManager(false)} />
      )}

      <ChatBox
        messages={messages}
        isTyping={isTyping}
        darkMode={darkMode}
        onPromptClick={handleStarterPrompt}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        onAttachFile={handleAttachFile}
        isTyping={isTyping}
        darkMode={darkMode}
      />
    </div>
  );
};

export default App;
