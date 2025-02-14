import axios from "axios";

const API_URL = "http://localhost:8000";

export const chatWithLLM = async (prompt) => {
  const response = await axios.post(`${API_URL}/chat`, { prompt });
  return response.data;
};

export const speakText = async (text) => {
  await axios.post(`${API_URL}/speak`, { text });
};

export const listenAudio = async () => {
  const response = await axios.post(`${API_URL}/listen`);
  return response.data;
};

export const generateImage = async (prompt) => {
  const response = await axios.post(`${API_URL}/generate-image`, { prompt });
  return response.data;
};
