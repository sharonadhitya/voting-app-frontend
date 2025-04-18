import React from 'react';
import { Link } from 'react-router-dom';

const PollCard = ({ poll }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg transition duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">{poll.title}</h2>
      <div className="text-sm text-gray-500 mb-4">
        Created: {new Date(poll.createdAt).toLocaleDateString()}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{poll.options.length} options</span>
        <Link 
          to={`/poll/${poll.id}`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          View Poll
        </Link>
      </div>
    </div>
  );
};

export default PollCard;