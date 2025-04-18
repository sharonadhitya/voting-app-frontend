// src/components/PollList.jsx
import React from 'react';
import PollCard from './PollCard';
import { usePolls } from '../hooks/usePolls';

const PollList = () => {
  const { polls, loading, error } = usePolls();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 text-red-600 rounded-lg">
        <p>{error}</p>
        <p className="mt-2 text-sm">Please check if your backend server is running.</p>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No polls available. Create your first poll!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {polls.map(poll => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
};

export default PollList;