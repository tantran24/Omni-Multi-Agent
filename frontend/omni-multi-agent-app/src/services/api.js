import axios from "axios";

const API_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Add 30s timeout
});

export const chatWithLLM = async (message) => {
  try {
    console.log("Sending message to backend:", message); // Debug log
    const response = await api.post("/chat", { message });

    console.log("Response from backend:", response.data); // Debug log

    if (!response.data?.response) {
      throw new Error("Invalid response format");
    }

    return { response: response.data.response };
  } catch (error) {
    console.error("Chat error:", error); // Debug log
    throw new Error(
      error.response?.data?.detail ||
        error.message ||
        "An unexpected error occurred"
    );
  }
};
