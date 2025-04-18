// src/components/PollOption.jsx
import React from 'react';

const PollOption = ({ option, onVote, hasVoted, selectedOption }) => {
  const isSelected = selectedOption === option.id;
  const totalVotes = option.score || 0;
  
  return (
    <div className={`mb-3 p-4 border rounded-md transition ${
      isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex justify-between items-center">
        <span className="text-lg">{option.title}</span>
        <span className="text-sm text-gray-500">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
      </div>
      
      {!hasVoted && (
        <button
          onClick={() => onVote(option.id)}
          className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Vote
        </button>
      )}
      
      {hasVoted && (
        <div className="mt-3 relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${totalVotes > 0 ? '100%' : '0%'}` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollOption;