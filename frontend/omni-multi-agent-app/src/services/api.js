import axios from "axios";

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const configureGPT = async (apiKey) => {
  try {
    const response = await api.post("/config/gpt", { api_key: apiKey });
    return response.data;
  } catch (error) {
    console.error("Configuration error:", error.response?.data || error);
    throw error;
  }
};

export const chatWithLLM = async (message) => {
  try {
    const response = await api.post("/chat", { message });
    return response.data;
  } catch (error) {
    console.error("Chat error:", error.response?.data || error);
    throw error;
  }
};

export const textToSpeech = async (text) => {
  try {
    const response = await api.post("/speak", { text: text.toString().trim() });
    if (response.data?.status === "success") return true;
    throw new Error(response.data?.detail || "Text to speech failed");
  } catch (error) {
    console.error(
      "Text to speech error:",
      error.response?.data || error.message
    );
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

export const generateImage = async (prompt) => {
  try {
    const response = await api.post("/generate-image", { prompt });
    return response.data;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};
