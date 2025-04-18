import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoll } from '../hooks/usePolls';
import { votePoll } from '../services/api';
import PollOption from './PollOption';
import PollResults from './PollResults';

const PollDetails = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { poll, loading, error, refreshPoll } = usePoll(pollId);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState(null);

  // Check if user has voted (using sessionStorage as a simple way to track)
  useEffect(() => {
    const votedPolls = JSON.parse(sessionStorage.getItem('votedPolls') || '{}');
    if (votedPolls[pollId]) {
      setHasVoted(true);
      setSelectedOption(votedPolls[pollId]);
    }
  }, [pollId]);

  const handleVote = async (optionId) => {
    try {
      setVoteError(null);
      await votePoll(pollId, optionId);
     
      // Save vote in session storage
      const votedPolls = JSON.parse(sessionStorage.getItem('votedPolls') || '{}');
      votedPolls[pollId] = optionId;
      sessionStorage.setItem('votedPolls', JSON.stringify(votedPolls));
     
      setSelectedOption(optionId);
      setHasVoted(true);
      
      // Refresh poll data after voting
      setTimeout(() => {
        refreshPoll();
      }, 500);
      
    } catch (err) {
      console.error('Vote error:', err);
      setVoteError('Failed to submit vote. ' + (err.response?.data?.message || 'You may have already voted on this poll.'));
    }
  };

  // Add retry mechanism
  const handleRetry = () => {
    refreshPoll();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="text-center p-6 bg-red-50 text-red-600 rounded-lg">
        <p>{error || 'Poll not found'}</p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Back to Polls
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{poll.title}</h1>
        <p className="text-sm text-gray-500">
          Created: {new Date(poll.createdAt).toLocaleDateString()}
        </p>
        {poll.user && (
          <p className="text-sm text-gray-500">
            Created by: {poll.user.name}
          </p>
        )}
      </div>
      
      {voteError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {voteError}
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Options</h2>
        {poll.options.map(option => (
          <PollOption
            key={option.id}
            option={option}
            onVote={handleVote}
            hasVoted={hasVoted}
            selectedOption={selectedOption}
          />
        ))}
      </div>
      
      <PollResults pollId={pollId} initialOptions={poll.options} />
      
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
        >
          Back to Polls
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Share Poll
        </button>
      </div>
    </div>
  );
};

export default PollDetails;