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
          currentOptions.map(option => {
            if (option.id === data.pollOptionId) {
              // Update vote count
              const updatedOption = { ...option, score: data.votes };
              
              // Add voter if user information is available
              if (data.userId && data.userName) {
                if (!updatedOption.voters) {
                  updatedOption.voters = [];
                }
                
                // Check if this voter already exists
                const existingVoterIndex = updatedOption.voters.findIndex(v => v.id === data.userId);
                
                if (existingVoterIndex === -1) {
                  // Add new voter
                  updatedOption.voters.push({
                    id: data.userId,
                    name: data.userName
                  });
                }
              }
              
              return updatedOption;
            }
            return option;
          })
        );
      } else if (data.poll && data.poll.options) {
        // Handle full poll update with voter information
        setOptions(data.poll.options);
      } else if (data.options) {
        // Handle full options update
        setOptions(data.options);
      }
    });
    
    return () => disconnect();
  }, [pollId]);
  
  return { options };
};