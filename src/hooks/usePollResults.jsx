// src/hooks/usePollResults.jsx
import { useState, useEffect } from 'react';
import { connectToResults } from '../services/api';

export const usePollResults = (pollId, initialOptions = []) => {
  const [options, setOptions] = useState(initialOptions);

  useEffect(() => {
    console.log('Initial options updated:', initialOptions);
    setOptions(initialOptions);
  }, [initialOptions]);

  useEffect(() => {
    if (!pollId) return;

    const disconnect = connectToResults(pollId, (data) => {
      console.log('Received data:', data);
      if (data.poll) {
        console.log('Updating options with poll data:', data.poll.options);
        setOptions(data.poll.options);
      } else if (data.pollOptionId) {
        console.log('Updating option with vote data:', data);
        setOptions((currentOptions) => {
          const newOptions = currentOptions.map((option) => {
            if (option.id === data.pollOptionId) {
              const updatedOption = { ...option, score: data.votes };
              if (data.userId && data.userName) {
                if (!updatedOption.voters) {
                  updatedOption.voters = [];
                }
                const existingVoterIndex = updatedOption.voters.findIndex(
                  (v) => v.id === data.userId
                );
                if (existingVoterIndex === -1) {
                  updatedOption.voters = [
                    ...updatedOption.voters,
                    { id: data.userId, name: data.userName },
                  ];
                }
              }
              return updatedOption;
            }
            return option;
          });
          console.log('New options after vote update:', newOptions);
          return newOptions;
        });
      }
    });

    return () => disconnect();
  }, [pollId]);

  return { options };
};