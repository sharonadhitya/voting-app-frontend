// src/components/PollOption.jsx
import React from 'react';

const PollOption = ({ option, onVote, hasVoted, selectedOption, showVoters }) => {
  const voteCount = option.score || 0;
  const totalVotes = option.voters?.length || voteCount; // Adjust based on your data structure
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  const handleVote = () => {
    if (!hasVoted) {
      onVote(option.id);
    }
  };

  return (
    <div className="border border-gray-200 rounded-md p-4 mb-2">
      <div className="flex items-center justify-between mb-1">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name={`poll-option-${option.pollId}`}
            value={option.id}
            checked={selectedOption === option.id}
            onChange={handleVote}
            disabled={hasVoted}
            className="form-radio"
          />
          <span className="font-medium">{option.title}</span>
        </label>
        <span>
          {percentage}% ({voteCount} vote{voteCount !== 1 ? 's' : ''})
        </span>
      </div>
      {showVoters && option.voters && option.voters.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">Voters:</p>
          <div className="flex flex-wrap gap-1">
            {option.voters.map((voter, idx) => (
              <span
                key={idx}
                className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-medium text-gray-700"
              >
                {voter.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PollOption;