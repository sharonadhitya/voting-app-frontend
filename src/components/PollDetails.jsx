import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoll } from '../hooks/usePolls';
import { usePollResults } from '../hooks/usePollResults';
import { votePoll, deletePoll, updatePoll } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PollDetails = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { poll, loading, error } = usePoll(pollId);
  const { options } = usePollResults(pollId, poll?.options || []);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!poll || !poll.options || !user) return;
    const userVote = poll.options.find(option =>
      option.voters && option.voters.some(voter => voter.id === user.id)
    );
    if (userVote) {
      setHasVoted(true);
      setSelectedOption(userVote.id);
    }
  }, [poll, pollId, user]);

  const handleVote = async (optionId) => {
    if (!user) {
      navigate('/login', { state: { from: `/poll/${pollId}` } });
      return;
    }
    try {
      setVoteError(null);
      await votePoll(pollId, optionId);
      setSelectedOption(optionId);
      setHasVoted(true);
    } catch (err) {
      console.error('Vote error:', err);
      setVoteError('Failed to submit vote. ' + (err.response?.data?.message || 'You may have already voted on this poll.'));
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      try {
        await deletePoll(pollId);
        navigate('/');
      } catch (err) {
        setVoteError('Failed to delete poll. ' + (err.response?.data?.message || 'Please try again.'));
      }
    }
  };

  const handleUpdate = async (newTitle, newOptions) => {
    try {
      await updatePoll(pollId, { title: newTitle, options: newOptions });
      window.location.reload();
    } catch (err) {
      setVoteError('Failed to update poll. ' + (err.response?.data?.message || 'Please try again.'));
    }
  };

  const handleRetry = () => {
    window.location.reload();
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

  const totalVotes = options.reduce((sum, option) => sum + (option.score || 0), 0);

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
          <h2 className="text-xl font-semibold mb-3">{hasVoted ? 'Results' : 'Options'}</h2>
          {options.map(option => (
            <div key={option.id} className="border border-gray-200 rounded-md p-4 mb-2">
              {!hasVoted && user ? (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`poll-option-${pollId}`}
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={() => handleVote(option.id)}
                    className="form-radio"
                  />
                  <span className="font-medium">{option.title}</span>
                </label>
              ) : (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{option.title}</span>
                    <span>
                      {totalVotes > 0 ? Math.round((option.score / totalVotes) * 100) : 0}% ({option.score} vote{option.score !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      style={{ width: `${totalVotes > 0 ? (option.score / totalVotes) * 100 : 0}%` }}
                      className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                    ></div>
                  </div>
                  {option.voters && option.voters.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">Voters:</p>
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
              )}
            </div>
          ))}
          {hasVoted && (
            <div className="mt-4 text-right text-gray-600">Total votes: {totalVotes}</div>
          )}
        </div>

        {user && poll.userId === user.id && (
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Delete Poll
            </button>
            <button
              onClick={() => handleUpdate(
                prompt('New title:', poll.title),
                prompt('New options (comma-separated):', poll.options.map(o => o.title).join(','))?.split(',').map(o => o.trim())
              )}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
            >
              Update Poll
            </button>
          </div>
        )}

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
    </div>
  );
};

export default PollDetails;