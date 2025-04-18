import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PollList from './components/PollList';
import CreatePoll from './components/CreatePoll';
import PollDetails from './components/PollDetails';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import AuthRoute from './components/AuthRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={
                <div>
                  <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Real-time Polling App</h1>
                    <p className="text-gray-600">Create polls and see results update in real-time!</p>
                  </div>
                  <PollList />
                </div>
              } />
              <Route path="/create" element={
                <AuthRoute>
                  <CreatePoll />
                </AuthRoute>
              } />
              <Route path="/poll/:pollId" element={<PollDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={
                <AuthRoute>
                  <Profile />
                </AuthRoute>
              } />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;