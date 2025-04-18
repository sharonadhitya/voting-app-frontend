import React, { createContext, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }) => {
  useEffect(() => {
    return () => socket.disconnect();
  }, []);
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};