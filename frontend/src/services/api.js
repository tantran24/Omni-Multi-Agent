import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const API_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const chatWithLLM = async (message, formData) => {
  try {
    let response;

    if (formData) {
      const formApi = axios.create({
        baseURL: API_URL,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      response = await formApi.post("/chat-with-image", formData);
    } else {
      response = await api.post("/chat", { message });
    }

    console.log("API Response:", response.data);

    if (response.data === undefined) {
      throw new Error("Empty response from server");
    }

    return {
      response: response.data.response || "",
      image: response.data.image,
    };
  } catch (error) {
    console.error("API Error:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "An unexpected error occurred"
    );
  }
};

export const uploadVoiceRecording = async (audioChunks) => {
  const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });

  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.mp3");

    const formApi = axios.create({
      baseURL: "http://127.0.0.1:8000/api",
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const response = await formApi.post("/transcribe", formData);

    if (!response.data?.transcription) {
      throw new Error("Invalid transcription response format");
    }

    return {
      transcription: response.data.transcription,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to transcribe audio"
    );
  }
};

// MCP config management
export const listMcpConfigs = async () => {
  const response = await api.get("/mcp/configs");
  return response.data;
};

export const addMcpConfig = async (mapping) => {
  // mapping: { toolName: configObject, ... }
  return api.post("/mcp/configs", mapping);
};

export const deleteMcpConfig = async (name) => {
  return api.delete(`/mcp/configs/${name}`);
};

export const listMcpTools = async () => {
  const response = await api.get("/mcp/tools");
  return response.data;
};

const getConnectionStatusText = (readyState) => {
  return (
    {
      [ReadyState.CONNECTING]: "Connecting",
      [ReadyState.OPEN]: "Open",
      [ReadyState.CLOSING]: "Closing",
      [ReadyState.CLOSED]: "Closed",
      [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState] || "Unknown"
  );
};

export const useConversationWebSocket = (options = {}) => {
  const [socketUrl] = useState("ws://127.0.0.1:8000/api/ws/conversation");

  const {
    sendMessage: wsSendMessage,
    lastMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log("WebSocket opened");
      options.onOpen?.();
    },
    onClose: () => {
      console.log("WebSocket closed");
      options.onClose?.();
    },
    onError: (event) => {
      console.error("WebSocket error:", event);
      options.onError?.(event);
    },
    shouldReconnect: (closeEvent) =>
      options.shouldReconnect?.(closeEvent) ?? true,
    reconnectAttempts: options.reconnectAttempts ?? 10,
    reconnectInterval: options.reconnectInterval ?? 3000,
    ...options.webSocketOptions,
  });

  const connectionStatus = getConnectionStatusText(readyState);

  const sendMessage = useCallback(
    (message) => {
      if (readyState === ReadyState.OPEN) {
        wsSendMessage(message);
      } else {
        console.warn("WebSocket is not open. Message not sent.");
      }
    },
    [readyState, wsSendMessage]
  );

  return {
    sendMessage,
    lastMessage,
    readyState,
    connectionStatus,
    getWebSocket,
  };
};
export { ReadyState };
