// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import PollsList from './components/PollsList';
import CreatePoll from './components/CreatePoll';
import ViewPoll from './components/ViewPoll';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(storedUser);
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        <header>
          <div className="logo">
            <span className="pulse"></span>
            <h1>LivePulse</h1>
          </div>
          <nav>
            <Link to="/">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/create">Create Poll</Link>
                <Link to="/profile">My Profile</Link>
                <button className="logout-nav-button" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<PollsList />} />
            <Route path="/create" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <CreatePoll user={user} />
              </PrivateRoute>
            } />
            <Route path="/poll/:id" element={<ViewPoll user={user} />} />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/" /> : <Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
            } />
            <Route path="/profile" element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <UserProfile user={user} />
              </PrivateRoute>
            } />
            <Route path="*" element={<div className="not-found"><h2>404 - Page Not Found</h2></div>} />
          </Routes>
        </main>
        <footer>
          <p>&copy; {new Date().getFullYear()} LivePulse - Real-time polling platform</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
