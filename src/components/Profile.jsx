import React from 'react';
import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyPolls } from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Custom hook to fetch user's polls
  const useMyPolls = () => {
    const [myPolls, setMyPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchUserPolls = async () => {
        try {
          setLoading(true);
          const data = await fetchMyPolls();
          setMyPolls(data);
          setError(null);
        } catch (err) {
          setError('Failed to fetch your polls');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchUserPolls();
    }, []);

    return { myPolls, loading, error };
  };

  const { myPolls, loading, error } = useMyPolls();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">My Polls</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-center p-6 bg-red-50 text-red-600 rounded-lg">
            <p>{error}</p>
          </div>
        ) : myPolls.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You haven't created any polls yet.</p>
            <button
              onClick={() => navigate('/create')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Create Your First Poll
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPolls.map(poll => (
              <div key={poll.id} className="border rounded-md p-4 hover:shadow-md transition">
                <h3 className="font-medium mb-2">{poll.title}</h3>
                <div className="text-sm text-gray-500 mb-3">
                  Created: {new Date(poll.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => navigate(`/poll/${poll.id}`)}
                  className="w-full px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;