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
    console.log("Sending chat message:", { message });
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
  try {
    await api.post("/speak", { text });
    return true;
  } catch (error) {
    console.error("Text to speech error:", error);
    throw error;
  }
};

export const listenAudio = async () => {
  const response = await api.post("/listen");
  return response.data;
};

export const generateImage = async (prompt) => {
  try {
    const response = await api.post("/generate-image", { prompt });
    return response.data;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
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

export const startSpeechToText = async () => {
  try {
    const response = await api.post("/listen");
    return response.data.text;
  } catch (error) {
    console.error("Speech to text error:", error);
    throw error;
  }
};

export const textToSpeech = async (text) => {
  try {
    const response = await api.post("/speak", {
      text: text.toString().trim(),
    });
    if (response.data && response.data.status === "success") {
      return true;
    }
    throw new Error(response.data?.detail || "Text to speech failed");
  } catch (error) {
    console.error(
      "Text to speech error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload-file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};
