import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { CompletionPaymentModal } from './CompletionPaymentModal';
import { InitialPaymentModal } from './InitialPaymentModal';
import { useNotifications } from '../contexts/NotificationContext';
import { apiService } from '../services/api';
import type { Booking } from '../types';

/**
 * Global payment modal - handles both initial (25%) and completion (75%) payments
 */
export const GlobalPaymentModal: React.FC = () => {
  const { paymentModalData, setPaymentModalData, refreshNotifications, markAsRead } = useNotifications();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch booking details when payment modal data is set
  useEffect(() => {
    if (paymentModalData?.bookingId) {
      fetchBookingDetails(paymentModalData.bookingId);
    } else {
      setBooking(null);
    }
  }, [paymentModalData]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.getMyBookings();
      
      if (response.success && response.data) {
        const foundBooking = response.data.find((b: any) => b._id === bookingId || b.id === bookingId);
        if (foundBooking) {
          setBooking(foundBooking as Booking);
        } else {
          // Clear modal data if booking not found (might be old/deleted)
          setPaymentModalData(null);
          setBooking(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
      setPaymentModalData(null);
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Mark notification as read when user dismisses
    if (paymentModalData?.notificationId) {
      markAsRead(paymentModalData.notificationId);
    }
    setPaymentModalData(null);
    setBooking(null);
  };

  const handlePaymentSuccess = () => {
    // Close modal immediately
    setPaymentModalData(null);
    setBooking(null);
    // Refresh notifications
    refreshNotifications();
  };

  const handleTimeout = () => {
    console.log('⏰ Payment timer expired, booking auto-cancelled');
    setPaymentModalData(null);
    setBooking(null);
    refreshNotifications();
  };

  if (!paymentModalData || !booking || isLoading) {
    return null;
  }

  // Show initial payment modal (25%)
  if (paymentModalData.type === 'initial') {
    return (
      <InitialPaymentModal
        visible={true}
        bookingId={booking._id}
        serviceName={booking.serviceName}
        providerName={paymentModalData.providerName || booking.providerName || 'Provider'}
        initialPaymentAmount={paymentModalData.initialPaymentAmount || Math.round(booking.totalPrice * 0.25)}
        totalAmount={booking.totalPrice}
        expiresAt={paymentModalData.expiresAt || new Date(Date.now() + 3 * 60 * 1000).toISOString()}
        onClose={handleClose}
        onPaymentSuccess={handlePaymentSuccess}
        onTimeout={handleTimeout}
      />
    );
  }

  // Show completion payment modal (75%)
  return (
    <CompletionPaymentModal
      visible={true}
      bookingId={booking._id}
      serviceName={booking.serviceName}
      completionAmount={paymentModalData.completionAmount || (booking as any).escrowDetails?.completionAmount || booking.totalPrice * 0.75}
      totalAmount={booking.totalPrice}
      onClose={handleClose}
      onPaymentSuccess={handlePaymentSuccess}
    />
  );
};
