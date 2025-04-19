import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchNotifications, markNotificationAsRead } from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchAndUpdateNotifications = async () => {
      try {
        const data = await fetchNotifications();
        console.log('Fetched notifications:', data); // Debug log
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchAndUpdateNotifications();
    const interval = setInterval(fetchAndUpdateNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-10">
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-600">No notifications</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 border-b ${notif.read ? 'bg-gray-50' : 'bg-white'}`}
                style={{ minHeight: '60px' }} // Ensure enough space for text
              >
                <p className="text-sm break-words" style={{ color: 'black', visibility: 'visible' }}>
                  {notif.message || 'No message available'} {/* Explicitly render message */}
                </p>
                <p className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</p>
                {!notif.read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="mt-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
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