import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPolls, fetchPoll } from "../services/api";
import { io } from "socket.io-client";

export const usePolls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch initial polls
    const getPolls = async () => {
      try {
        setLoading(true);
        const data = await fetchPolls();
        setPolls(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch polls");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getPolls();

    // Connect to Socket.IO for real-time updates
    const token = localStorage.getItem("token");
    const socket = io("http://localhost:3333", {
      withCredentials: true,
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected for polls:", socket.id);
    });

    socket.on("newPoll", (newPoll) => {
      console.log("Received new poll:", newPoll);
      setPolls((prevPolls) => {
        // Prevent duplicate polls
        if (prevPolls.some((poll) => poll.id === newPoll.id)) {
          return prevPolls;
        }
        // Add new poll to the top of the list
        return [newPoll, ...prevPolls];
      });
    });

    socket.on("deletePoll", ({ pollId }) => {
      console.log("Received delete poll:", pollId);
      setPolls((prevPolls) => {
        // Remove the poll with the matching pollId
        return prevPolls.filter((poll) => poll.id !== pollId);
      });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error for polls:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected for polls:", reason);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log("Socket.IO disconnected for polls");
    };
  }, []);

  return { polls, loading, error, refreshPolls: () => fetchPolls().then(setPolls) };
};

export const usePoll = (pollId) => {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch poll data
    const loadPoll = async () => {
      try {
        setLoading(true);
        const data = await fetchPoll(pollId);
        setPoll(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load poll");
        setPoll(null);
      } finally {
        setLoading(false);
      }
    };

    if (pollId) {
      loadPoll();
    }

    // Connect to Socket.IO for real-time deletion updates
    const token = localStorage.getItem("token");
    const socket = io("http://localhost:3333", {
      withCredentials: true,
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected for poll:", socket.id);
    });

    socket.on("deletePoll", ({ pollId: deletedPollId }) => {
      console.log("Received delete poll for poll:", deletedPollId);
      if (deletedPollId === pollId) {
        console.log("Current poll deleted, redirecting to home");
        navigate("/", { state: { message: "The poll was deleted by its owner" } });
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error for poll:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected for poll:", reason);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log("Socket.IO disconnected for poll");
    };
  }, [pollId, navigate]);

  return { poll, loading, error };
};