import React from 'react';

const PollOption = ({ option, onVote, hasVoted, selectedOption, showVoters = false }) => {
  const isSelected = selectedOption === option.id;
  const totalVotes = option.score || 0;
  
  return (
    <div className={`p-4 mb-3 rounded-lg border ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
      <div className="flex justify-between">
        <h3 className="font-medium">{option.title}</h3>
        <span className="text-gray-500">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
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
              {/* Progress bar */}
            </div>
          </div>
        )}
        
        {showVoters && option.voters && option.voters.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <p>Voters:</p>
            <ul className="ml-4">
              {option.voters.map((voter, idx) => (
                <li key={idx} className="list-disc">
                  {voter.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollOption;