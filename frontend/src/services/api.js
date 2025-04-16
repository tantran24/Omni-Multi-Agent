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

export const uploadVoiceRecording = async (audioChunks) => {
  const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

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