import React from 'react';

const PollOption = ({ option, onVote, hasVoted, selectedOption, showVoters = false }) => {
  const isSelected = selectedOption === option.id;
  const totalVotes = option.score || 0;
  
  return (
    <div className={`border p-4 rounded-md mb-2 ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}>
      <div className="flex justify-between">
        <h3 className="font-medium">{option.title}</h3>
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="mt-2">
        {!hasVoted && (
          <button
            onClick={() => onVote(option.id)}
            className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Vote
          </button>
        )}
        
        {hasVoted && (
          <div className="w-full bg-gray-200 rounded-full h-6 mt-2">
            <div 
              style={{ width: `${totalVotes > 0 ? '100%' : '0%'}` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 rounded-full h-6"
            >
            </div>
          </div>
        )}
      </div>
      
      {showVoters && option.voters && option.voters.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">Voters:</p>
          <div className="flex flex-wrap gap-1">
            {option.voters.map((voter, idx) => (
              <span key={idx} className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-medium text-gray-700">
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