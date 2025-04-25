import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { fetchNotifications, markNotificationAsRead } from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchAndUpdateNotifications = async () => {
      try {
        const data = await fetchNotifications();
        console.log('Fetched notifications:', data);
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchAndUpdateNotifications();

    // Connect to Socket.IO for real-time notifications
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3333', {
      withCredentials: true,
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected for notifications:', socket.id);
    });

    socket.on('newNotification', (notification) => {
      console.log('Received new notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      console.log('Socket.IO disconnected for notifications');
    };
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      // Remove the notification from the state
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-white hover:text-indigo-200 focus:outline-none relative"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-3 text-gray-600 text-sm">No notifications</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 border-b last:border-b-0 ${notif.read ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition`}
              >
                <p className="text-sm text-gray-800 break-words line-clamp-2">
                  {notif.message || 'No message available'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
                {!notif.read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="mt-1 px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;