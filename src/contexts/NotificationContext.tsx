import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

export interface AppNotification {
  id: string;
  type: 'otp_start' | 'otp_end' | 'booking_accepted' | 'booking_rejected' | 'booking_completed' | 'general';
  title: string;
  message: string;
  otp?: string;
  bookingId?: string;
  timestamp: string; // ISO string for storage
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();

  const STORAGE_KEY = `yann_notifications_${user?.id || 'guest'}`;

  // Load notifications on mount or when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Listen for incoming notifications
  useEffect(() => {
    if (!user) return;

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      
      // Filter notifications: Only accept if recipientId matches current user or if generic (no recipientId)
      const recipientId = data.recipientId;
      if (recipientId && user && recipientId !== user.id) {
        console.log('Ignored notification for different user', { recipientId, currentUserId: user.id });
        return;
      }

      const newNotification: AppNotification = {
        id: Date.now().toString(),
        type: (data.type as any) || (data.otp ? (data.otpType === 'start' ? 'otp_start' : 'otp_end') : 'general'),
        title: notification.request.content.title || 'New Notification',
        message: notification.request.content.body || '',
        otp: data.otp as string | undefined,
        bookingId: data.bookingId as string | undefined,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Add to state and save to storage
      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        saveNotifications(updated);
        return updated;
      });
    });

    return () => subscription.remove();
  }, [user]);

  const loadNotifications = async () => {
    try {
      if (!user) return;
      
      // 1. Try to fetch from backend first (Single Source of Truth)
      const response = await apiService.getNotifications(user.id);
      
      if (response.success && response.data && response.data.length > 0) {
          const serverNotifications = response.data;
          console.log(`🔔 Loaded ${serverNotifications.length} notifications from backend`);
          
          // Map backend notifications to AppNotification format
          const mappedNotifications: AppNotification[] = serverNotifications.map(n => ({
              id: n.id,
              type: n.type as AppNotification['type'],
              title: n.title,
              message: n.message,
              bookingId: n.data?.bookingId,
              otp: n.data?.otp,
              timestamp: n.timestamp,
              read: n.read || false 
          }));
          
          setNotifications(mappedNotifications);
          saveNotifications(mappedNotifications); // Cache locally
          return;
      }
      
      // 2. Fallback to local storage if backend empty or failed
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        console.log('Using locally cached notifications');
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Try local storage as last resort
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    }
  };

  const saveNotifications = async (newNotifications: AppNotification[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await saveNotifications(updated);
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    await saveNotifications(updated);
  };

  const clearAll = async () => {
    setNotifications([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        clearAll,
        refreshNotifications: loadNotifications 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
