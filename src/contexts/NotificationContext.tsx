import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

export interface AppNotification {
  id: string;
  type: 'otp_start' | 'otp_end' | 'booking_accepted' | 'booking_rejected' | 'booking_completed' | 'payment_required' | 'general';
  title: string;
  message: string;
  otp?: string;
  bookingId?: string;
  completionAmount?: number;
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
  paymentModalData: { bookingId: string; completionAmount: number; notificationId: string } | null;
  setPaymentModalData: (data: { bookingId: string; completionAmount: number; notificationId: string } | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [paymentModalData, setPaymentModalData] = useState<{ bookingId: string; completionAmount: number; notificationId: string } | null>(null);
  const { user } = useAuth();

  const STORAGE_KEY = `yann_notifications_${user?.id || 'guest'}`;

  // Load notifications on mount or when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();

      // Active polling every 15 seconds to ensure OTP delivery even if push fails
      const intervalId = setInterval(() => {
        loadNotifications();
      }, 15000);

      return () => clearInterval(intervalId);
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
        return;
      }

      const newNotification: AppNotification = {
        id: Date.now().toString(),
        type: (data.type as any) || (data.otp ? (data.otpType === 'start' ? 'otp_start' : 'otp_end') : (data.action === 'pay_completion' || data.completionAmount ? 'payment_required' : 'general')),
        title: notification.request.content.title || 'New Notification',
        message: notification.request.content.body || '',
        otp: data.otp as string | undefined,
        bookingId: data.bookingId as string | undefined,
        completionAmount: data.completionAmount as number | undefined,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // INSTANT PAYMENT TRIGGER: If payment required, show modal immediately!
      if (newNotification.type === 'payment_required' && data.bookingId && data.completionAmount) {
        const notifId = (data.notificationId as string) || newNotification.id;
        setPaymentModalData({
          bookingId: data.bookingId as string,
          completionAmount: data.completionAmount as number,
          notificationId: notifId
        });
      }

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

      // Extract user ID with fallback
      const userId = user.id || user._id;
      if (!userId) {
        console.warn('⚠️ No user ID available for notifications');
        return;
      }

      // 1. Try to fetch from backend first (Single Source of Truth)
      const response = await apiService.getNotifications(userId);

      if (response.success && response.data && response.data.length > 0) {
        const serverNotifications = response.data;

        // Map backend notifications to AppNotification format
        const mappedNotifications: AppNotification[] = serverNotifications.map(n => ({
          id: n.id,
          type: n.type as AppNotification['type'],
          title: n.title,
          message: n.message,
          bookingId: n.data?.bookingId,
          otp: n.data?.otp,
          completionAmount: n.data?.completionAmount,
          timestamp: n.timestamp,
          read: n.read || false
        }));

        // CHECK FOR PAYMENT REQUIRED: Trigger payment modal if there's an unread payment_required notification
        const paymentRequiredNotif = mappedNotifications.find(
          n => n.type === 'payment_required' && !n.read && n.bookingId && n.completionAmount
        );
        
        if (paymentRequiredNotif && !paymentModalData) {
          setPaymentModalData({
            bookingId: paymentRequiredNotif.bookingId!,
            completionAmount: paymentRequiredNotif.completionAmount!,
            notificationId: paymentRequiredNotif.id
          });
        }

        setNotifications(prevNotifications => {
          // Create a map of currently read notifications to preserve local optimistic updates
          const localReadMap = new Map();
          prevNotifications.forEach(n => {
            if (n.read) localReadMap.set(n.id, true);
          });

          // Merge: ALWAYS prefer local read state over backend
          // This prevents backend from reverting read notifications to unread
          const mergedNotifications = mappedNotifications.map(n => ({
            ...n,
            read: localReadMap.has(n.id) ? true : n.read
          }));

          saveNotifications(mergedNotifications); // Cache locally
          return mergedNotifications;
        });
        return;
      }

      // 2. Fallback to local storage if backend empty or failed
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
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
    // 1. Optimistic Update (Immediate UI change)
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await saveNotifications(updated);

    // 2. Persist to Backend
    try {
      await apiService.markNotificationsRead([id]);
    } catch (error) {
      console.error('Failed to mark notification as read on server:', error);
      // Optional: Revert optimistic update if critical, but usually fine to ignore
    }
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
        refreshNotifications: loadNotifications,
        paymentModalData,
        setPaymentModalData
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
