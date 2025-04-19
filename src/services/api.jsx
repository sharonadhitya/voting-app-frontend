import axios from 'axios';

const API_URL = 'http://localhost:3333';
export const api = axios.create({ baseURL: API_URL, withCredentials: true });

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

export const createPoll = async (title, options) => {
  try {
    const response = await api.post('/polls', { title, options });
    return response.data;
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

export const fetchPolls = async () => {
  try {
    const response = await api.get('/polls');
    return response.data;
  } catch (error) {
    console.error('Error fetching polls:', error);
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

export const votePoll = async (pollId, pollOptionId) => {
  try {
    await api.post(`/polls/${pollId}/votes`, { pollOptionId });
    return true;
  } catch (error) {
    console.error('Error voting on poll:', error);
    throw error;
  }
};

export const deletePoll = async (pollId) => {
  try {
    await api.delete(`/polls/${pollId}`);
  } catch (error) {
    console.error('Error deleting poll:', error);
    throw error;
  }
};

export const updatePoll = async (pollId, data) => {
  try {
    await api.put(`/polls/${pollId}`, data);
  } catch (error) {
    console.error('Error updating poll:', error);
    throw error;
  }
};

export const connectToResults = (pollId, callback) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = API_URL.replace(/^https?:\/\//, '');
  const ws = new WebSocket(`${protocol}//${host}/polls/${pollId}/results`);
  ws.onopen = () => {
    console.log('WebSocket connected');
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.pollOptionId) {
      callback(data);
    } else if (data.poll) {
      callback({ poll: data.poll });
    }
  };
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  return () => {
    ws.close();
  };
};

export const fetchMyPolls = async () => {
  try {
    const response = await api.get('/polls/my');
    return response.data;
  } catch (error) {
    console.error('Error fetching my polls:', error);
    throw error;
  }
};