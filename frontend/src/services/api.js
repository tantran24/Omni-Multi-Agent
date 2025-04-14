import axios from "axios";

const API_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const chatWithLLM = async (message) => {
  try {
    const response = await api.post("/chat", { message });

    if (!response.data?.response) {
      throw new Error("Invalid response format");
    }

    return {
      response: response.data.response,
      image: response.data.image,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "An unexpected error occurred"
    );
  }
};

export const uploadVoiceRecording = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice-message.webm");

    // Use a different instance for form data to set the right headers
    const formApi = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const response = await formApi.post("/speech-to-text", formData);

    if (!response.data?.text) {
      throw new Error("Invalid speech-to-text response format");
    }

    return {
      text: response.data.text,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "Failed to process voice recording"
    );
  }
};
