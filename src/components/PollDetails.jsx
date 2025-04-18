import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoll } from '../hooks/usePolls';
import { votePoll } from '../services/api';
import PollOption from './PollOption';
import PollResults from './PollResults';
import { useAuth } from '../contexts/AuthContext';

const PollDetails = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { poll, loading, error, refreshPoll } = usePoll(pollId);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const { user } = useAuth();
  
  // Check if user has voted
  useEffect(() => {
    if (!poll || !poll.options || !user) return;
    
    // Check if the logged-in user has voted
    const userVote = poll.options.find(option => 
      option.voters && option.voters.some(voter => voter.id === user.id)
    );
    
    if (userVote) {
      setHasVoted(true);
      setSelectedOption(userVote.id);
    }
  }, [poll, pollId, user]);
  
  const handleVote = async (optionId) => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login', { state: { from: `/poll/${pollId}` } });
      return;
    }
    
    try {
      setVoteError(null);
      await votePoll(pollId, optionId);
      
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
  
  const handleRetry = () => {
    refreshPoll();
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading poll...</p>
        </div>
      </div>
    );
  }
  
  if (error || !poll) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Poll not found'}
        </div>
        <div className="flex gap-4">
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">{poll.title}</h1>
        <div className="text-sm text-gray-600 mb-4">
          <div>Created: {new Date(poll.createdAt).toLocaleDateString()}</div>
          {poll.user && (
            <div className="font-medium">Created by: {poll.user.name}</div>
          )}
        </div>
        
        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
            You need to <a href="/login" className="underline font-medium">login</a> to vote on this poll.
          </div>
        )}
        
        {voteError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {voteError}
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Options</h2>
          {poll.options.map(option => (
            <PollOption 
              key={option.id}
              option={option}
              onVote={handleVote}
              hasVoted={hasVoted || !user}
              selectedOption={selectedOption}
              showVoters={true}
            />
          ))}
        </div>
        
        <div className="flex gap-4">
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
      
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <PollResults pollId={pollId} initialOptions={poll.options} />
      </div>
    </div>
  );
};

export default PollDetails;