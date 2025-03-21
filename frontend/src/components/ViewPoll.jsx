import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ConfettiExplosion from 'react-confetti-explosion';

ChartJS.register(ArcElement, Tooltip, Legend);

function ViewPoll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/poll/${id}`);
    
    const loadPoll = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/polls/${id}`);
        setPoll(response.data);
        
        // Check if user has already voted
        const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
        if (votedPolls[id]) {
          setHasVoted(true);
          setSelectedOption(votedPolls[id]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load poll');
        setLoading(false);
      }
    };

    loadPoll();
    
    // Set up Socket.io connection
    socketRef.current = io('http://localhost:3001');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      socketRef.current.emit('joinPoll', id);
    });
    
    socketRef.current.on('voteUpdate', (updatedPoll) => {
      if (updatedPoll.id.toString() === id) {
        setPoll(updatedPoll);
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const handleVote = async () => {
    if (!selectedOption) return;
    
    try {
      await axios.post(`http://localhost:3001/api/polls/${id}/vote`, {
        optionId: selectedOption
      });
      
      // Save vote to localStorage
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
      votedPolls[id] = selectedOption;
      localStorage.setItem('votedPolls', JSON.stringify(votedPolls));
      
      setHasVoted(true);
      setShowConfetti(true);
      
      // Fetch updated poll data
      const response = await axios.get(`http://localhost:3001/api/polls/${id}`);
      setPoll(response.data);
    } catch (err) {
      setError('Failed to submit vote');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };

  if (loading) return <div className="loading">Loading poll...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!poll) return <div className="not-found">Poll not found</div>;

  const isPollActive = new Date(poll.end_date) > new Date();
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  
  // Sort options by votes (descending)
  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
  
  // Prepare chart data
  const chartData = {
    labels: poll.options.map(option => option.text),
    datasets: [
      {
        data: poll.options.map(option => option.votes),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(40, 159, 64, 0.8)',
          'rgba(210, 199, 199, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(40, 159, 64, 1)',
          'rgba(210, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const percentage = totalVotes ? Math.round((value / totalVotes) * 100) : 0;
            return `${context.label}: ${value} votes (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };
  
  // Determine if results should be shown (either poll is ended, user has voted, or poll is not private)
  const showResults = !isPollActive || hasVoted || !poll.is_private;

  return (
    <div className="view-poll-container">
      {showConfetti && (
        <div className="confetti-container">
          <ConfettiExplosion 
            force={0.8}
            duration={3000}
            particleCount={100}
            width={1600}
          />
        </div>
      )}
      
      <div className="poll-header">
        <h2>{poll.title}</h2>
        <div className="poll-metadata">
          <div className={`poll-status ${isPollActive ? 'active' : 'ended'}`}>
            {isPollActive ? 'Active' : 'Ended'}
          </div>
          <div className="poll-date">
            {isPollActive ? (
              <>Ends: {format(new Date(poll.end_date), 'MMM d, yyyy')}</>
            ) : (
              <>Ended: {format(new Date(poll.end_date), 'MMM d, yyyy')}</>
            )}
          </div>
        </div>
      </div>
      
      {poll.description && (
        <div className="poll-description">
          <p>{poll.description}</p>
        </div>
      )}
      
      <div className="vote-count-badge">
        <span className="vote-number">{totalVotes}</span>
        <span className="vote-label">{totalVotes === 1 ? 'vote' : 'votes'}</span>
      </div>
      
      <div className="poll-content">
        <div className="options-container">
          {!showResults && poll.is_private && (
            <div className="private-notice">
              Results will be visible after you vote
            </div>
          )}
          
          {isPollActive && !hasVoted ? (
            <div className="voting-section">
              <div className="options-list">
                {poll.options.map(option => (
                  <div 
                    key={option.id} 
                    className={`option-item ${selectedOption === option.id ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <div className="option-selector">
                      <div className="radio-button">
                        <div className="radio-inner"></div>
                      </div>
                      <span className="option-text">{option.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                className="vote-button"
                onClick={handleVote}
                disabled={!selectedOption}
              >
                Submit Vote
              </button>
            </div>
          ) : (
            <div className="results-section">
              {showResults ? (
                <>
                  <div className="results-chart">
                    {totalVotes > 0 ? (
                      <Pie data={chartData} options={chartOptions} />
                    ) : (
                      <div className="no-votes">
                        No votes yet
                      </div>
                    )}
                  </div>
                  
                  <div className="results-list">
                    {sortedOptions.map((option, index) => {
                      const percentage = totalVotes ? (option.votes / totalVotes) * 100 : 0;
                      
                      return (
                        <div key={option.id} className="result-item">
                          <div className="result-rank">#{index + 1}</div>
                          <div className="result-info">
                            <div className="result-text">{option.text}</div>
                            <div className="result-bar-container">
                              <div 
                                className="result-bar" 
                                style={{width: `${percentage}%`}}
                              ></div>
                              <div className="result-stats">
                                <span className="result-percentage">{percentage.toFixed(1)}%</span>
                                <span className="result-votes">{option.votes} {option.votes === 1 ? 'vote' : 'votes'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="private-poll-message">
                  <p>This is a private poll. Results will be visible after you vote.</p>
                  {isPollActive && (
                    <div className="options-list">
                      {poll.options.map(option => (
                        <div 
                          key={option.id} 
                          className={`option-item ${selectedOption === option.id ? 'selected' : ''}`}
                          onClick={() => setSelectedOption(option.id)}
                        >
                          <div className="option-selector">
                            <div className="radio-button">
                              <div className="radio-inner"></div>
                            </div>
                            <span className="option-text">{option.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isPollActive && (
                    <button 
                      className="vote-button"
                      onClick={handleVote}
                      disabled={!selectedOption}
                    >
                      Submit Vote
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="poll-actions">
        <button className="share-button" onClick={handleShare}>
          {copySuccess ? 'Link Copied!' : 'Share Poll'}
        </button>
        <button className="back-button" onClick={() => navigate('/')}>
          Back to Polls
        </button>
      </div>
    </div>
  );
}

export default ViewPoll;
