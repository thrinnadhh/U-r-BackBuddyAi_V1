import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// CRA exposes only REACT_APP_* variables to client code
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Axios instance bound to API base
const http = axios.create({ baseURL: API });

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('default');

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    // Load notifications from backend
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await http.get('/notifications', { params: { limit: 10 } });
      if (response.data?.success) {
        const apiNotifications = response.data.data.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.timestamp),
          read: n.is_read
        }));
        setNotifications(apiNotifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    try {
      // requestPermission returns a promise in modern browsers
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendNotification = (title, message, type = 'info') => {
    // Add to local notifications list (keep latest 10)
    const newNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);

    // Send browser notification if permission granted
    if (permissionStatus === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: 'https://cdn-icons-png.flaticon.com/512/2942/2942813.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2942/2942813.png',
        tag: type,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
    // Note: API logging is performed from TimerContext to avoid duplication
  };

  const clearNotifications = async () => {
    try {
      await http.delete('/notifications/clear');
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      // Clear locally anyway
      setNotifications([]);
    }
  };

  const markAsRead = async (id) => {
    try {
      await http.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Update locally anyway
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    }
  };

  const value = {
    notifications,
    permissionStatus,
    requestNotificationPermission,
    sendNotification,
    clearNotifications,
    markAsRead,
    reload: loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
