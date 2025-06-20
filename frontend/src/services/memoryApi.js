import axios from "axios";

const API_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Session management API calls
export const createSession = async (title = null, metadata = null) => {
  try {
    const response = await api.post("/memory/sessions", {
      title,
      metadata,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating session:", error);
    throw new Error(error.response?.data?.detail || "Failed to create session");
  }
};

export const listSessions = async (userId = null, limit = 50) => {
  try {
    const params = {};
    if (userId) params.user_id = userId;
    if (limit) params.limit = limit;

    const response = await api.get("/memory/sessions", { params });
    return response.data;
  } catch (error) {
    console.error("Error listing sessions:", error);
    throw new Error(error.response?.data?.detail || "Failed to list sessions");
  }
};

export const getSession = async (sessionId) => {
  try {
    const response = await api.get(`/memory/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting session:", error);
    throw new Error(error.response?.data?.detail || "Failed to get session");
  }
};

export const updateSession = async (
  sessionId,
  title = null,
  metadata = null
) => {
  try {
    const response = await api.put(`/memory/sessions/${sessionId}`, {
      title,
      metadata,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating session:", error);
    throw new Error(error.response?.data?.detail || "Failed to update session");
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const response = await api.delete(`/memory/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting session:", error);
    throw new Error(error.response?.data?.detail || "Failed to delete session");
  }
};

export const getSessionMessages = async (sessionId, limit = 50) => {
  try {
    const response = await api.get(`/memory/sessions/${sessionId}/messages`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting session messages:", error);
    throw new Error(
      error.response?.data?.detail || "Failed to get session messages"
    );
  }
};

export const getSessionContext = async (sessionId) => {
  try {
    const response = await api.get(`/memory/sessions/${sessionId}/context`);
    return response.data;
  } catch (error) {
    console.error("Error getting session context:", error);
    throw new Error(
      error.response?.data?.detail || "Failed to get session context"
    );
  }
};
