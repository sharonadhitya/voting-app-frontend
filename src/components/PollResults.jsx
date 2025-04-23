// src/components/PollResults.jsx
import React, { useEffect } from "react";
import { usePollResults } from "../hooks/usePollResults";

const PollResults = ({ pollId, initialOptions }) => {
  const { options } = usePollResults(pollId, initialOptions);

  useEffect(() => {
    console.log("PollResults options updated:", options);
  }, [options]);

  const totalVotes = options.reduce((sum, option) => sum + (option.score || 0), 0);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Results</h2>
      <div className="space-y-4">
        {options.map((option) => {
          const voteCount = option.score || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          return (
            <div key={option.id} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{option.title}</span>
                <span>
                  {percentage}% ({voteCount} vote{voteCount !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  style={{ width: `${percentage}%` }}
                  className="bg-indigo-600 h-4 rounded-full"
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
          );
        })}
      </div>
      <div className="mt-4 text-right text-gray-600">Total votes: {totalVotes}</div>
    </div>
  );
};

export default PollResults;