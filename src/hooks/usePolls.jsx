import { useState, useEffect } from 'react';
import { fetchPolls, fetchPoll } from '../services/api';

export const usePolls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getPolls = async () => {
      try {
        setLoading(true);
        const data = await fetchPolls();
        setPolls(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch polls');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getPolls();
  }, []);

  return { polls, loading, error, refreshPolls: () => fetchPolls().then(setPolls) };
};

export const usePoll = (pollId) => {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPoll = async () => {
      try {
        setLoading(true);
        const data = await fetchPoll(pollId);
        setPoll(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load poll');
        setPoll(null);
      } finally {
        setLoading(false);
      }
    };
    if (pollId) {
      loadPoll();
    }
  }, [pollId]);

  return { poll, loading, error };
};