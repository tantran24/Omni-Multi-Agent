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
