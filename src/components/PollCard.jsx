import React from 'react';
import { Link } from 'react-router-dom';

const PollCard = ({ poll }) => {
  return (
    <div className="border border-gray-300 p-4 rounded-md shadow-sm mb-4 hover:shadow-md transition">
      <h2 className="text-xl font-semibold mb-2">{poll.title}</h2>
      <div className="flex flex-col text-sm text-gray-600 mb-3">
        <span>Created: {new Date(poll.createdAt).toLocaleDateString()}</span>
        {poll.user && <span>Created by: {poll.user.name}</span>}
        <span>{poll.options.length} options</span>
      </div>
      <Link 
        to={`/poll/${poll.id}`}
        className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
      >
        View Poll
      </Link>
    </div>
  );
};

export default PollCard;