import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Real-time Polling</Link>
        <div className="flex space-x-4 items-center">
          <Link to="/" className="hover:text-indigo-200 transition">Home</Link>
          <Link to="/create" className="hover:text-indigo-200 transition">Create Poll</Link>
          {user ? (
            <>
              <Link to="/profile" className="hover:text-indigo-200 transition">Profile</Link>
              <button onClick={logout} className="hover:text-indigo-200 transition">Logout</button>
              <Notifications />
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-200 transition">Login</Link>
              <Link to="/register" className="hover:text-indigo-200 transition">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;