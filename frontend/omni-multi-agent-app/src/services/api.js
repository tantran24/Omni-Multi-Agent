import axios from "axios";

const API_URL = "http://localhost:8000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const configureGPT = async (apiKey) => {
  try {
    console.log("Configuring GPT with API key...");
    const response = await api.post("/config/gpt", {
      api_key: apiKey,
    });
    console.log("Configuration response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Configuration error:", error.response?.data || error);
    throw error;
  }
};

export const chatWithLLM = async (message) => {
  try {
    console.log("Sending chat message:", message);
    const response = await api.post("/chat", {
      message: message,
    });
    console.log("Chat response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Chat error:", error.response?.data || error);
    throw error;
  }
};

export const speakText = async (text) => {
  await api.post("/speak", { text });
};

export const listenAudio = async () => {
  const response = await api.post("/listen");
  return response.data;
};

export const generateImage = async (prompt) => {
  const response = await api.post("/generate-image", { prompt });
  return response.data;
};

export const sendChatMessage = async (message) => {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Failed to send chat message");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};
