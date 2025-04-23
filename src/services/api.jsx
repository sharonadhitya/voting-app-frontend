import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "http://localhost:3333";
export const api = axios.create({ baseURL: API_URL, withCredentials: true });

const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  }
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common["Authorization"];
  localStorage.removeItem("token");
};

export const votePoll = async (pollId, pollOptionId) => {
  console.log(`Sending vote for poll ${pollId}, option ${pollOptionId}`);
  try {
    const response = await api.post(`/polls/${pollId}/votes`, { pollOptionId });
    console.log("Vote response:", response.status, response.data);
    return true;
  } catch (error) {
    console.error("Error voting on poll:", error.response?.data || error.message);
    throw error;
  }
};

export const createPoll = async (title, options) => {
  try {
    const response = await api.post("/polls", { title, options });
    return response.data;
  } catch (error) {
    console.error("Error creating poll:", error);
    throw error;
  }
};

export const fetchPolls = async () => {
  try {
    const response = await api.get("/polls");
    return response.data;
  } catch (error) {
    console.error("Error fetching polls:", error);
    throw error;
  }
};

export const fetchPoll = async (pollId) => {
  try {
    const response = await api.get(`/polls/${pollId}`);
    return response.data.poll;
  } catch (error) {
    console.error(`Error fetching poll ${pollId}:`, error);
    throw error;
  }
};

export const deletePoll = async (pollId) => {
  try {
    await api.delete(`/polls/${pollId}`);
  } catch (error) {
    console.error("Error deleting poll:", error);
    throw error;
  }
};

export const updatePoll = async (pollId, data) => {
  try {
    await api.put(`/polls/${pollId}`, data);
  } catch (error) {
    console.error("Error updating poll:", error);
    throw error;
  }
};

export const connectToResults = (pollId, callback) => {
  const token = localStorage.getItem("token");
  const socket = io(API_URL, {
    withCredentials: true,
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Socket.IO connected:", socket.id);
    socket.emit("joinPoll", { pollId });
  });

  socket.on("pollUpdate", (data) => {
    console.log("Received pollUpdate:", data);
    callback(data);
  });

  socket.on("voteUpdate", (data) => {
    console.log("Received voteUpdate:", data);
    callback(data);
  });

  socket.on("error", (error) => {
    console.error("Socket.IO error:", error);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket.IO connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket.IO disconnected:", reason);
  });

  return () => {
    socket.disconnect();
    console.log("Socket.IO disconnected");
  };
};

export const fetchMyPolls = async () => {
  try {
    const response = await api.get("/polls/my");
    return response.data;
  } catch (error) {
    console.error("Error fetching my polls:", error);
    throw error;
  }
};

export const fetchNotifications = async () => {
  try {
    const response = await api.get("/notifications");
    return response.data.notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await api.put(`/notifications/${notificationId}/read`);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};