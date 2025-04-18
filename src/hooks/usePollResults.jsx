import { useState, useEffect } from 'react';
import { connectToResults } from '../services/api';

export const usePollResults = (pollId, initialOptions = []) => {
  const [options, setOptions] = useState(initialOptions);

  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  useEffect(() => {
    if (!pollId) return;

    const disconnect = connectToResults(pollId, (data) => {
      // Handle different data formats from the WebSocket
      if (data.pollOptionId) {
        // Update the vote count for the specific option
        setOptions(currentOptions => 
          currentOptions.map(option => 
            option.id === data.pollOptionId 
              ? { ...option, score: data.votes } 
              : option
          )
        );
      } else if (data.options) {
        // Handle full options update
        setOptions(data.options);
      }
    });

    return () => disconnect();
  }, [pollId]);

  return { options };
};