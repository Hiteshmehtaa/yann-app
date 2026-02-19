import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import { stopBuzzer, playBookingRequestBuzzer, initializeBuzzerSound } from '../utils/soundNotifications';

export interface AppNotification {
  id: string;
  type: 'otp_start' | 'otp_end' | 'booking_accepted' | 'booking_rejected' | 'booking_completed' | 'booking_expired' | 'booking_request' | 'booking_request_reminder' | 'payment_required' | 'completion_payment_required' | 'general';
  title: string;
  message: string;
  otp?: string;
  bookingId?: string;
  completionAmount?: number;
  expiresAt?: string;
  serviceName?: string;
  customerName?: string;
  totalPrice?: number;
  timestamp: string; // ISO string for storage
  read: boolean;
}

// Booking request data for provider incoming request modal
export interface BookingRequestData {
  bookingId: string;
  serviceName: string;
  serviceCategory?: string;
  customerName: string;
  customerProfileImage?: string;
  customerAddress?: string;
  customerPhone?: string;
  totalPrice: number;
  bookedHours?: number;
  billingType?: string;
  bookingDate?: string;
  bookingTime?: string;
  notes?: string;
  expiresAt: string;
  notificationIdentifier?: string;
  // Driver-specific details (JSON stringified from backend, parsed on arrival)
  driverDetails?: any;
  driverTripDetails?: any;
  pricingBreakdown?: any;
}

// Payment modal data (support both initial and completion payments)
export interface PaymentModalData {
  type: 'initial' | 'completion';
  bookingId: string;
  initialPaymentAmount?: number; // For initial payment (25%)
  completionAmount?: number; // For completion payment (75%)
  totalPrice?: number;
  providerName?: string;
  serviceName?: string;
  expiresAt?: string; // For initial payment timer
  notificationId: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  paymentModalData: PaymentModalData | null;
  setPaymentModalData: (data: PaymentModalData | null) => void;
  // Booking request for providers
  incomingBookingRequest: BookingRequestData | null;
  setIncomingBookingRequest: (data: BookingRequestData | null) => void;
  ignoreBookingRequest: (bookingId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [paymentModalData, setPaymentModalData] = useState<PaymentModalData | null>(null);
  const [incomingBookingRequest, setIncomingBookingRequest] = useState<BookingRequestData | null>(null);
  // Track ignored bookings to prevent re-fetching (race condition fix)
  const ignoredBookingIds = useRef<Set<string>>(new Set());
  const { user } = useAuth();

  // Initialise the audio session once at startup so it is ready before the
  // first booking request notification arrives.
  useEffect(() => {
    initializeBuzzerSound().catch(() => {});
  }, []);

  const ignoreBookingRequest = (bookingId: string) => {
    console.log('🔇 Ignoring booking and STOPPING buzzer:', bookingId);
    stopBuzzer(); // Explicitly stop sound
    
    // Dismiss the system notification to stop buzzer from continuing
    Notifications.dismissAllNotificationsAsync()
      .then(() => console.log('✅ System notification dismissed'))
      .catch(err => console.error('❌ Failed to dismiss notification:', err));
    
    ignoredBookingIds.current.add(bookingId);
    setIncomingBookingRequest(null);
  };

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

  // Listen for incoming notifications (app in foreground)
  useEffect(() => {
    if (!user) return;

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;

      // Filter: Only accept if recipientId matches current user
      const recipientId = data.recipientId;
      const currentUserId = user.id || user._id;

      if (recipientId && currentUserId && String(recipientId) !== String(currentUserId)) {
        return; // Silent filter - not for this user
      }

      const newNotification: AppNotification = {
        id: Date.now().toString(),
        type: (data.type as any) || (data.otp ? (data.otpType === 'start' ? 'otp_start' : 'otp_end') : (data.action === 'pay_completion' || data.completionAmount ? 'payment_required' : 'general')),
        title: notification.request.content.title || 'New Notification',
        message: notification.request.content.body || '',
        otp: data.otp as string | undefined,
        bookingId: data.bookingId as string | undefined,
        completionAmount: data.completionAmount as number | undefined,
        expiresAt: data.expiresAt as string | undefined,
        serviceName: data.serviceName as string | undefined,
        customerName: data.customerName as string | undefined,
        totalPrice: data.totalPrice as number | undefined,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // PAYMENT MODAL TRIGGER - Log ONLY payment-related
      if ((data.type === 'payment_required' || data.type === 'completion_payment_required') && data.bookingId) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💳 PAYMENT NOTIFICATION RECEIVED');
        console.log('   Type:', data.type);
        console.log('   BookingId:', data.bookingId);
        console.log('   InitialAmount:', data.initialPaymentAmount || 'N/A');
        console.log('   CompletionAmount:', data.completionAmount || 'N/A');
        console.log('   ExpiresAt:', data.expiresAt || 'N/A');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const notifId = (data.notificationId as string) || newNotification.id;

        if (data.type === 'completion_payment_required' && data.completionAmount) {
          // 75% Completion payment
          console.log('🟢 TRIGGERING 75% COMPLETION MODAL');

          setPaymentModalData({
            type: 'completion',
            bookingId: data.bookingId as string,
            completionAmount: data.completionAmount as number,
            totalPrice: data.totalPrice as number,
            serviceName: data.serviceName as string,
            notificationId: notifId
          });

          console.log('✅ 75% modal data SET');
        } else if (data.initialPaymentAmount && data.expiresAt) {
          // 25% Initial payment
          console.log('🟢 TRIGGERING 25% INITIAL MODAL');

          setPaymentModalData({
            type: 'initial',
            bookingId: data.bookingId as string,
            initialPaymentAmount: data.initialPaymentAmount as number,
            totalPrice: data.totalPrice as number,
            providerName: data.providerName as string,
            serviceName: data.serviceName as string,
            expiresAt: data.expiresAt as string,
            notificationId: notifId
          });

          console.log('✅ 25% modal data SET');
        } else {
          console.log('⚠️ Payment notification missing required fields');
          console.log('   Has initialPaymentAmount:', !!data.initialPaymentAmount);
          console.log('   Has completionAmount:', !!data.completionAmount);
          console.log('   Has expiresAt:', !!data.expiresAt);
        }
      }

      // BOOKING REQUEST for providers (no logging needed)
      if ((data.type === 'booking_request' || data.type === 'booking_request_reminder') && data.bookingId && data.expiresAt) {
        // Dismiss old booking notifications to prevent stacking
        Notifications.dismissAllNotificationsAsync()
          .then(() => console.log('✅ Old booking notifications cleared'))
          .catch(err => console.error('❌ Failed to dismiss old notifications:', err));
        
        // If a reminder arrives for the booking ALREADY displayed in the modal,
        // silently update only the expiresAt field so the countdown timer stays
        // accurate.  Replacing the entire object would change requestData, which
        // triggers the ProviderIncomingRequest Sound useEffect to teardown and
        // restart — stopping the continuous in-app buzzer for over 500 ms.
        setIncomingBookingRequest((prev: BookingRequestData | null) => {
          if (
            prev &&
            prev.bookingId === (data.bookingId as string) &&
            data.type === 'booking_request_reminder'
          ) {
            return { ...prev, expiresAt: data.expiresAt as string };
          }
          // Fresh booking request (or app was idle) — show the full modal
          return {
            bookingId: data.bookingId as string,
            serviceName: data.serviceName as string || 'Service',
            serviceCategory: data.serviceCategory as string || '',
            customerName: data.customerName as string || 'Customer',
            customerProfileImage: data.customerProfileImage as string,
            customerAddress: data.customerAddress as string,
            customerPhone: data.customerPhone as string,
            totalPrice: data.totalPrice as number || 0,
            bookedHours: data.bookedHours as number || 0,
            billingType: data.billingType as string || 'one-time',
            bookingDate: data.bookingDate as string,
            bookingTime: data.bookingTime as string,
            notes: data.notes as string,
            expiresAt: data.expiresAt as string,
            notificationIdentifier: notification.request.identifier,
            driverDetails: parsedDriverDetails,
            driverTripDetails: parsedDriverTripDetails,
            pricingBreakdown: parsedPricingBreakdown,
          };
        });
      }

      // Add to state and save
      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        saveNotifications(updated);
        return updated;
      });
    });

    return () => subscription.remove();
  }, [user]);

  // Listen for notification taps (when user opens app from notification)
  useEffect(() => {
    if (!user) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      console.log('📲 Notification tapped, data:', data);

      // Filter by recipientId
      const recipientId = data.recipientId;
      const currentUserId = user.id || user._id;

      if (recipientId && currentUserId && String(recipientId) !== String(currentUserId)) {
        console.log(`🚫 Filtering tapped notification: not for current user`);
        return;
      }

      // BOOKING REQUEST: Show incoming request modal (only for providers)
      if ((data.type === 'booking_request' || data.type === 'booking_request_reminder') && data.bookingId) {
        // Only check if user is a provider
        if (user.role === 'provider' || (user as any).audience === 'provider') {
          // Dismiss all system notifications to stop notification buzzer
          Notifications.dismissAllNotificationsAsync()
            .then(() => console.log('✅ System notifications dismissed on tap'))
            .catch(err => console.error('❌ Failed to dismiss notifications:', err));
          
          // Fetch fresh booking data to get timer info
          checkPendingBookingRequest(data.bookingId as string);
        }
      }

      // PAYMENT REQUIRED: Show payment modal
      if ((data.type === 'payment_required' || data.type === 'completion_payment_required') && data.bookingId) {
        console.log('💰 Payment notification tapped:', {
          type: data.type,
          initialPaymentAmount: data.initialPaymentAmount,
          completionAmount: data.completionAmount,
          expiresAt: data.expiresAt
        });

        const notifId = data.notificationId as string || Date.now().toString();

        if (data.type === 'completion_payment_required' && data.completionAmount) {
          // Completion payment (75%)
          console.log('💰 Showing completion payment modal from tap');
          setPaymentModalData({
            type: 'completion',
            bookingId: data.bookingId as string,
            completionAmount: data.completionAmount as number,
            totalPrice: data.totalPrice as number,
            serviceName: data.serviceName as string,
            notificationId: notifId
          });
        } else if (data.initialPaymentAmount && data.expiresAt) {
          // Initial payment (25%)
          console.log('💰 Showing initial payment modal from tap');
          setPaymentModalData({
            type: 'initial',
            bookingId: data.bookingId as string,
            initialPaymentAmount: data.initialPaymentAmount as number,
            totalPrice: data.totalPrice as number,
            providerName: data.providerName as string,
            serviceName: data.serviceName as string,
            expiresAt: data.expiresAt as string,
            notificationId: notifId
          });
        } else {
          console.log('⚠️ Payment notification but missing required data');
        }
      }
    });

    return () => subscription.remove();
  }, [user]);

  // Check for pending booking requests on mount (for providers)
  useEffect(() => {
    if (!user) return;

    // Only for providers
    if (user.role === 'provider' || (user as any).audience === 'provider') {
      checkPendingBookingRequests();
    }
  }, [user]);

  // Check for a specific pending booking request (when notification tapped)
  const checkPendingBookingRequest = async (bookingId: string) => {
    // Respect the ignore list — prevents re-showing a booking the provider already
    // acted on (accept/reject) if the notification tap fires slightly late.
    if (ignoredBookingIds.current.has(bookingId)) {
      console.log(`🔇 Skipping ignored booking (notification tap): ${bookingId}`);
      // Make sure the buzzer is stopped in case it's still going
      stopBuzzer();
      return;
    }

    try {
      const response = await apiService.getBookingStatus(bookingId);

      if (response.success && response.data) {
        const { status, remainingSeconds, serviceName, provider, totalPrice, isExpired } = response.data;

        // Only show modal if still awaiting response and not expired
        if (status === 'awaiting_response' && !isExpired && remainingSeconds > 0) {
          // Calculate new expiresAt based on remainingSeconds
          const expiresAt = new Date(Date.now() + remainingSeconds * 1000).toISOString();

          setIncomingBookingRequest({
            bookingId: bookingId,
            serviceName: serviceName || 'Service',
            customerName: response.data.customerName || 'Customer',
            customerProfileImage: response.data.customerProfileImage, // Map Image from status check
            customerAddress: response.data.customerAddress,
            customerPhone: response.data.customerPhone,
            totalPrice: totalPrice || 0,
            bookingDate: response.data.bookingDate,
            bookingTime: response.data.bookingTime,
            notes: response.data.notes,
            expiresAt: expiresAt
          });

          console.log('✅ Showing booking request modal with timer:', remainingSeconds, 'seconds remaining');
        } else {
          console.log('⏰ Booking request expired or already responded to');
        }
      }
    } catch (error) {
      console.error('Failed to check pending booking request:', error);
    }
  };

  // Check for any pending booking requests assigned to this provider
  const checkPendingBookingRequests = async () => {
    try {
      const userId = user?.id || user?._id;
      if (!userId) return;

      const response = await apiService.getProviderPendingRequests(userId);

      if (response.success && response.data && response.data.length > 0) {
        // Show the first pending request (most recent)
        const pendingRequest = response.data[0];

        // CRITICAL: Check ignore list first to prevent race condition buzzer loop
        if (ignoredBookingIds.current.has(pendingRequest.bookingId)) {
          console.log(`🔇 Skipping ignored booking in poller: ${pendingRequest.bookingId}`);
          return;
        }

        // Also check if we are currently displaying this exact booking
        if (incomingBookingRequest && incomingBookingRequest.bookingId === pendingRequest.bookingId) {
          return; // Already showing it
        }

        setIncomingBookingRequest({
          bookingId: pendingRequest.bookingId,
          serviceName: pendingRequest.serviceName,
          customerName: pendingRequest.customerName,
          customerAddress: pendingRequest.customerAddress,
          customerPhone: pendingRequest.customerPhone,
          totalPrice: pendingRequest.totalPrice,
          bookingDate: pendingRequest.bookingDate,
          bookingTime: pendingRequest.bookingTime,
          notes: pendingRequest.notes,
          expiresAt: pendingRequest.expiresAt
        });

        console.log('✅ Found pending booking request on app open:', pendingRequest.bookingId);
        // Start buzzer ONLY if not already playing and verified not ignored
        playBookingRequestBuzzer();
      }
    } catch (error) {
      console.error('Failed to check pending booking requests:', error);
    }
  };

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
          n => (n.type === 'payment_required' || n.type === 'completion_payment_required') && !n.read && n.bookingId
        );

        if (paymentRequiredNotif && !paymentModalData) {
          // Determine if it's initial or completion payment based on data
          if (paymentRequiredNotif.completionAmount) {
            // Completion payment (75%)
            setPaymentModalData({
              type: 'completion',
              bookingId: paymentRequiredNotif.bookingId!,
              completionAmount: Number(paymentRequiredNotif.completionAmount),
              notificationId: paymentRequiredNotif.id
            });
          }
          // Note: Initial payment (25%) should come from real-time notification with timer
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

  /**
   * GLOBAL ACTIVE JOB POLLING
   * Polls every 5s to check if any active job has been completed
   */
  useEffect(() => {
    if (!user) return;

    // Safety check: Don't poll if we already have a payment modal open
    if (paymentModalData) return;

    let pollInterval: NodeJS.Timeout;

    const checkActiveJobs = async () => {
      // Only homeowners check for active jobs to pay
      if (user.role === 'provider' || (user as any).audience === 'provider') return;

      try {
        const response = await apiService.getMyBookings();
        if (response.success && response.data) {
          // Find any booking that is active OR awaiting completion payment
          const activeOrJustFinishedBooking = response.data.find((b: any) =>
            b.status === 'in_progress' ||
            b.status === 'awaiting_completion_payment' ||
            (b.status === 'completed' && b.paymentMethod === 'wallet' && !b.escrowDetails?.isCompletionPaid)
          );

          if (activeOrJustFinishedBooking) {
            // Check if we need to show completion modal
            if (
              activeOrJustFinishedBooking.status === 'completed' ||
              activeOrJustFinishedBooking.status === 'awaiting_completion_payment'
            ) {
              // Double check it's a wallet payment needing completion
              if (
                activeOrJustFinishedBooking.paymentMethod === 'wallet' &&
                !activeOrJustFinishedBooking.escrowDetails?.isCompletionPaid
              ) {
                console.log('🔥 GLOBAL POLLER: Found completed job needing payment!');
                console.log('   Booking ID:', activeOrJustFinishedBooking._id);

                const completionAmount = activeOrJustFinishedBooking.escrowDetails?.completionAmount ||
                  Number((activeOrJustFinishedBooking.totalPrice * 0.75).toFixed(2));

                console.log('🔥 GLOBAL POLLER: Found completed job needing payment!');
                console.log('   Booking ID:', activeOrJustFinishedBooking._id);
                console.log('   Status:', activeOrJustFinishedBooking.status);
                console.log('   Paid:', activeOrJustFinishedBooking.paymentStatus);

                // STRICT CHECK: Verify we haven't already paid
                if (activeOrJustFinishedBooking.paymentStatus === 'paid' ||
                  activeOrJustFinishedBooking.walletPaymentStage === 'completed' ||
                  (activeOrJustFinishedBooking.escrowDetails?.isCompletionPaid === true)) {
                  console.log('   🛑 Already paid, skipping modal.');
                  return;
                }

                // Verify valid amounts
                if (!completionAmount || !activeOrJustFinishedBooking.totalPrice) {
                  return;
                }

                setPaymentModalData({
                  type: 'completion',
                  bookingId: activeOrJustFinishedBooking._id,
                  completionAmount: completionAmount,
                  totalPrice: activeOrJustFinishedBooking.totalPrice,
                  serviceName: activeOrJustFinishedBooking.serviceName,
                  notificationId: 'poll_' + Date.now().toString()
                });
              }
            }
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    /**
     * PROVIDER: CHECK PENDING REQUESTS
     * Checks if there are any pending booking requests for this provider
     */
    /**
     * PROVIDER: CHECK PENDING REQUESTS
     * Checks if there are any pending booking requests for this provider
     * Uses dedicated endpoint for reliability
     */
    const checkPendingRequests = async () => {
      // Only for providers
      if (user.role !== 'provider') return;
      if (incomingBookingRequest) return; // Already showing one

      try {
        const userId = user.id || user._id;
        if (!userId) return;

        // Use the dedicated pending requests endpoint which is much more reliable
        // than fetching all bookings and filtering client-side
        const response = await apiService.getProviderPendingRequests(userId);

        if (response.success && response.data && response.data.length > 0) {
          // Get the most recent pending request
          const pendingBooking = response.data[0];

          // CRITICAL: Check ignore list first to prevent race condition buzzer loop
          if (ignoredBookingIds.current.has(pendingBooking.bookingId)) {
            return;
          }

          console.log('🔥 FOUND PENDING REQUEST ON RESUME:', pendingBooking.bookingId);

          // Calculate actual expiry from backend data
          let expiresAtString = pendingBooking.expiresAt;

          if (!expiresAtString && pendingBooking.requestTimer?.expiresAt) {
            expiresAtString = pendingBooking.requestTimer.expiresAt;
          }

          // Fallback: If no explicit expiry, assume 3 mins from creation
          if (!expiresAtString && pendingBooking.createdAt) {
            const createdTime = new Date(pendingBooking.createdAt).getTime();
            expiresAtString = new Date(createdTime + 3 * 60 * 1000).toISOString();
          }

          // Start timer check: If already expired, don't show modal
          if (expiresAtString) {
            const remainingMs = new Date(expiresAtString).getTime() - Date.now();
            if (remainingMs <= 0) {
              console.log('❌ Pending request already expired, ignoring.');
              return;
            }
          } else {
            // If we absolutely cannot determine expiry, default to "now + 3 mins" 
            // to show the modal (better to show than hide)
            expiresAtString = new Date(Date.now() + 180000).toISOString();
          }

          setIncomingBookingRequest({
            bookingId: pendingBooking.bookingId,
            serviceName: pendingBooking.serviceName,
            customerName: pendingBooking.customerName || 'Customer',
            customerProfileImage: pendingBooking.customerProfileImage,
            customerAddress: pendingBooking.customerAddress || 'Address hidden',
            customerPhone: pendingBooking.customerPhone,
            totalPrice: pendingBooking.totalPrice,
            bookingDate: pendingBooking.bookingDate,
            bookingTime: pendingBooking.bookingTime,
            notes: pendingBooking.notes,
            expiresAt: expiresAtString
          });
        }
      } catch (error) {
        console.error('Failed to check pending requests:', error);
      }
    };

    // Initial check
    checkActiveJobs();
    checkPendingRequests();

    // Poll every 5 seconds
    pollInterval = setInterval(() => {
      checkActiveJobs();
      checkPendingRequests();
    }, 5000);

    // AppState Listener for Resume
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App Resumed - Checking for critical modals...');
        checkActiveJobs();
        checkPendingRequests();
      }
    });

    return () => {
      clearInterval(pollInterval);
      subscription.remove();
    };
  }, [user, paymentModalData, incomingBookingRequest]);

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
        setPaymentModalData,
        incomingBookingRequest,
        setIncomingBookingRequest,
        ignoreBookingRequest
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
