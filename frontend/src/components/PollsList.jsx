import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function PollsList() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/polls');
        setPolls(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load polls');
        setLoading(false);
      }
    };

    fetchPolls();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchPolls, 5000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredPolls = () => {
    if (filter === 'all') return polls;
    if (filter === 'active') return polls.filter(poll => new Date(poll.end_date) > new Date());
    if (filter === 'ended') return polls.filter(poll => new Date(poll.end_date) <= new Date());
    return polls;
  };

  if (loading) return <div className="loading">Loading polls...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="polls-container">
      <h2>Available Polls</h2>
      
      <div className="filter-controls">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}>
          All
        </button>
        <button 
          className={filter === 'active' ? 'active' : ''} 
          onClick={() => setFilter('active')}>
          Active
        </button>
        <button 
          className={filter === 'ended' ? 'active' : ''} 
          onClick={() => setFilter('ended')}>
          Ended
        </button>
      </div>

      {getFilteredPolls().length === 0 ? (
        <div className="no-polls">
          <p>No polls available. Create your first poll!</p>
          <Link to="/create" className="create-poll-button">Create Poll</Link>
        </div>
      ) : (
        <div className="polls-grid">
          {getFilteredPolls().map(poll => {
            // Get top two options for preview
            const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
            const topOptions = sortedOptions.slice(0, 2);
            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
            
            // Prepare chart data
            const chartData = {
              labels: topOptions.map(option => option.text.substring(0, 15) + (option.text.length > 15 ? '...' : '')),
              datasets: [
                {
                  label: 'Votes',
                  data: topOptions.map(option => option.votes),
                  backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                  borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                  borderWidth: 1,
                },
              ],
            };
            
            const chartOptions = {
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const value = context.raw;
                      const percentage = totalVotes ? Math.round((value / totalVotes) * 100) : 0;
                      return `${value} votes (${percentage}%)`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0
                  }
                }
              },
              maintainAspectRatio: false
            };
            
            const isActive = new Date(poll.end_date) > new Date();
            
            return (
              <div key={poll.id} className={`poll-card ${isActive ? 'active' : 'ended'}`}>
                <div className="poll-status">
                  {isActive ? 'Active' : 'Ended'}
                </div>
                <h3>{poll.title}</h3>
                <p className="poll-description">{poll.description}</p>
                
                <div className="poll-stats">
                  <div className="poll-vote-count">
                    <span className="vote-number">{totalVotes}</span>
                    <span className="vote-label">votes</span>
                  </div>
                  <div className="poll-date">
                    {isActive ? (
                      <>Ends: {format(new Date(poll.end_date), 'MMM d, yyyy')}</>
                    ) : (
                      <>Ended: {format(new Date(poll.end_date), 'MMM d, yyyy')}</>
                    )}
                  </div>
                </div>
                
                <div className="poll-preview-chart">
                  <Bar data={chartData} options={chartOptions} height={100} />
                </div>
                
                <Link to={`/poll/${poll.id}`} className="view-poll-button">
                  {isActive ? 'Vote Now' : 'View Results'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PollsList;

