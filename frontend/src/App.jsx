import React, { useState, useEffect, useCallback, useRef } from "react";
import ChatBox from "./components/chat/ChatBox";
import MessageInput from "./components/chat/MessageInput";
import SessionManager from "./components/chat/SessionManager";
import { chatWithLLM } from "./services/api";
import { getSessionMessages, createSession } from "./services/memoryApi";
import { Button } from "./components/ui/Button";
import {
  Moon,
  Sun,
  RotateCcw,
  Menu,
  BotMessageSquare,
  MessageSquare,
  History,
} from "lucide-react";
import "./App.css";
import McpManager from "./components/mcp/McpManager";
import Conversation from "./components/conversation/conversation";
import NewWindow from "react-new-window";
import { normalizeImageUrl } from "./utils/imageUtils";
import { useVADConfiguration } from "./utils/vadConfig";

const App = () => {
  // Initialize VAD configuration
  useVADConfiguration();
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const skipNextReload = useRef(false);
  const isSendingMessage = useRef(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return (
      savedMode === "true" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMcpManager, setShowMcpManager] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]); // Load session messages when session changes
  useEffect(() => {
    const loadSessionMessages = async () => {
      // Skip reload if this change was due to our own message sending
      if (skipNextReload.current) {
        console.log("Skipping reload due to skipNextReload flag");
        skipNextReload.current = false;
        return;
      }

      // Skip reload if we're currently sending a message
      if (isSendingMessage.current) {
        console.log("Skipping reload because we're sending a message");
        return;
      }

      console.log("Loading messages for session:", currentSessionId);
      if (currentSessionId) {
        try {
          const sessionMessages = await getSessionMessages(currentSessionId);
          console.log("Loaded messages:", sessionMessages);
          setMessages(sessionMessages);
        } catch (error) {
          console.error("Failed to load session messages:", error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };

    loadSessionMessages();
  }, [currentSessionId]);
  const handleSendMessage = async (text, imageFile) => {
    if ((!text || !text.trim()) && !imageFile) return;

    try {
      // Set flag to prevent reloading during send operation
      isSendingMessage.current = true;

      // Create session if none exists
      if (!currentSessionId) {
        console.log("Creating new session...");
        const newSession = await createSession();
        console.log("Created session:", newSession.id);
        skipNextReload.current = true; // Skip reload since we're starting fresh
        setCurrentSessionId(newSession.id);
      }

      const newUserMessage = {
        text: text || "",
        isUser: true,
        timestamp: new Date().toISOString(),
      };

      if (imageFile) {
        // Check if the file is a PDF
        const isPdf =
          imageFile.type === "application/pdf" ||
          imageFile.name.toLowerCase().endsWith(".pdf");

        if (isPdf) {
          // For PDFs, don't use createObjectURL which causes rendering errors
          newUserMessage.fileType = "pdf";
          newUserMessage.fileName = imageFile.name;
        } else {
          // For images, create an object URL as before
          newUserMessage.image = URL.createObjectURL(imageFile);
          newUserMessage.fileType = "image";
        }
      }

      setMessages((prev) => [...prev, newUserMessage]);
      setIsTyping(true);

      let response;
      if (imageFile) {
        const formData = new FormData();
        formData.append("text", text || "");
        formData.append("image", imageFile);

        response = await chatWithLLM(text, formData, currentSessionId);
      } else {
        response = await chatWithLLM(text, null, currentSessionId);
      }
      if (response) {
        const botMessage = {
          text: response.response || "",
          isUser: false,
          timestamp: new Date().toISOString(),
        }; // Check for image in the direct response.image field
        if (response.image) {
          try {
            const serverUrl =
              import.meta.env.VITE_API_URL || "http://localhost:8000";
            // Use the normalizeImageUrl utility to ensure consistent URL formatting
            botMessage.image = normalizeImageUrl(response.image, serverUrl);
            botMessage.imageValidated = true;
            console.log("Image URL from response:", botMessage.image);
          } catch (err) {
            console.error("Error forming image URL from response:", err);
          }
        } else if (
          response.artifacts &&
          response.artifacts.generate_image &&
          response.artifacts.generate_image.image_url
        ) {
          try {
            const serverUrl =
              import.meta.env.VITE_API_URL || "http://localhost:8000";
            botMessage.image = normalizeImageUrl(
              response.artifacts.generate_image.image_url,
              serverUrl
            );
            botMessage.imageValidated = true;
            console.log(
              "Image URL from artifacts.generate_image:",
              botMessage.image
            );
          } catch (err) {
            console.error("Error forming image URL from artifacts:", err);
          }
        }
        setMessages((prev) => [...prev, botMessage]);

        // Update current session ID if it changed, but don't reload messages since we just added them
        if (response.sessionId && response.sessionId !== currentSessionId) {
          console.log(
            "Session ID changed from",
            currentSessionId,
            "to",
            response.sessionId
          );
          skipNextReload.current = true; // Skip the next reload since we just updated locally
          setCurrentSessionId(response.sessionId);
        }
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
      // Clear the sending flag
      isSendingMessage.current = false;
    }
  };
  const clearHistory = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setMenuOpen(false);
  }, []);

  const handleSessionSelect = useCallback(async (sessionId) => {
    setCurrentSessionId(sessionId);
    setShowSessionManager(false);
  }, []);

  const handleNewSession = useCallback(async () => {
    try {
      const newSession = await createSession();
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create new session:", error);
    }
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

  const handleOpenConversation = () => {
    setIsWindowOpen(true);
  };

  const handleCloseWindow = () => {
    setIsWindowOpen(false);
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
            </div>{" "}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--foreground)] flex items-center justify-center">
                <span className="text-[var(--background)] font-semibold text-sm">
                  O
                </span>
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
              onClick={handleOpenConversation}
              className="hidden md:flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--accent-foreground)]"
              variant="outline"
              disabled={isWindowOpen}
            >
              <BotMessageSquare size={16} />
              <span>Conversation</span>
            </Button>
            {isWindowOpen && (
              <NewWindow
                onUnload={handleCloseWindow}
                title="Conversation Window"
              >
                <Conversation handleCloseWindow={handleCloseWindow} />
              </NewWindow>
            )}{" "}
            <Button
              onClick={() => {
                console.log("MCP Tools button clicked");
                setShowMcpManager(true);
              }}
              variant="outline"
              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--accent-foreground)]"
            >
              MCP Tools
            </Button>
            <Button
              onClick={() => setShowSessionManager(true)}
              className="hidden md:flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--accent-foreground)]"
              variant="outline"
            >
              <History size={16} />
              <span>Sessions</span>
            </Button>
            <Button
              onClick={handleNewSession}
              className="hidden md:flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--accent-foreground)]"
              variant="outline"
            >
              <MessageSquare size={16} />
              <span>New Chat</span>
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
        {/* Mobile menu */}{" "}
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
                onClick={() => {
                  setShowSessionManager(true);
                  setMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full"
                variant="outline"
              >
                <History size={16} />
                <span>Sessions</span>
              </Button>
              <Button
                onClick={() => {
                  handleNewSession();
                  setMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full"
                variant="outline"
              >
                <MessageSquare size={16} />
                <span>New Chat</span>
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
        )}{" "}
      </header>{" "}
      <McpManager
        isOpen={showMcpManager}
        onClose={() => setShowMcpManager(false)}
      />
      <SessionManager
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
        onSessionSelect={handleSessionSelect}
        currentSessionId={currentSessionId}
      />
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
