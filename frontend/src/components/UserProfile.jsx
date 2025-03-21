import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

function UserProfile() {
  const navigate = useNavigate();
  const [userPolls, setUserPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchUserPolls = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/user/polls');
        setUserPolls(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load your polls');
        setLoading(false);
      }
    };

    fetchUserPolls();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading your polls...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Your Profile</h2>
        <div className="user-info">
          <strong>Username:</strong> {user.username}<br />
          <strong>Email:</strong> {user.email}
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <div className="user-polls-section">
        <h3>Your Polls</h3>
        
        {userPolls.length === 0 ? (
          <div className="no-polls">
            <p>You haven't created any polls yet.</p>
            <Link to="/create" className="create-poll-button">Create Your First Poll</Link>
          </div>
        ) : (
          <div className="user-polls-grid">
            {userPolls.map(poll => {
              const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
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
                  
                  <Link to={`/poll/${poll.id}`} className="view-poll-button">
                    View Results
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
