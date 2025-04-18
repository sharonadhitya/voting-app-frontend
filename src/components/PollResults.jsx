// src/components/PollResults.jsx
import React from 'react';
import { usePollResults } from '../hooks/usePollResults';

const PollResults = ({ pollId, initialOptions }) => {
  const { options } = usePollResults(pollId, initialOptions);
  
  // Calculate total votes
  const totalVotes = options.reduce((sum, option) => sum + (option.score || 0), 0);
  
  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Results</h3>
      <div className="space-y-4">
        {options.map(option => {
          const voteCount = option.score || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          
          return (
            <div key={option.id} className="bg-white rounded-md shadow-sm p-4">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{option.title}</span>
                <span className="text-gray-600">{percentage}% ({voteCount} vote{voteCount !== 1 ? 's' : ''})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-right mt-2 text-sm text-gray-500">
        Total votes: {totalVotes}
      </div>
    </div>
  );
};

export default PollResults;