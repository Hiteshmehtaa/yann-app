import React, { useState, useEffect } from 'react';
import { InitialPaymentModal } from './InitialPaymentModal';
import { useNotifications } from '../contexts/NotificationContext';
import { apiService } from '../services/api';

/**
 * Global initial payment modal for customers
 * Shows when provider accepts booking and requires 25% payment
 */
export const GlobalInitialPaymentModal: React.FC = () => {
  const { paymentModalData, setPaymentModalData, refreshNotifications, markAsRead } = useNotifications();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch booking details when modal data is set
  useEffect(() => {
    if (paymentModalData?.bookingId && paymentModalData.type === 'initial') {
      fetchBookingDetails(paymentModalData.bookingId);
    }
  }, [paymentModalData]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.getBooking(bookingId);
      if (response.success) {
        setBooking(response.booking);
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
      setPaymentModalData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('✅ Initial payment successful');
    
    // Mark notification as read
    if (paymentModalData?.notificationId) {
      await markAsRead(paymentModalData.notificationId);
    }
    
    // Refresh notifications and booking list
    await refreshNotifications();
    
    setPaymentModalData(null);
  };

  const handleTimeout = () => {
    console.log('⏰ Payment timer expired');
    // Booking will be auto-cancelled by backend
    setPaymentModalData(null);
  };

  const handleClose = () => {
    setPaymentModalData(null);
  };

  // Only show modal for initial payment type
  if (!paymentModalData || paymentModalData.type !== 'initial' || !booking || isLoading) {
    return null;
  }

  return (
    <InitialPaymentModal
      visible={true}
      bookingId={booking._id || booking.id}
      serviceName={booking.serviceName}
      providerName={paymentModalData.providerName || booking.providerName || 'Provider'}
      initialPaymentAmount={paymentModalData.initialPaymentAmount || Math.round(booking.totalPrice * 0.25)}
      totalAmount={booking.totalPrice}
      expiresAt={paymentModalData.expiresAt}
      onClose={handleClose}
      onPaymentSuccess={handlePaymentSuccess}
      onTimeout={handleTimeout}
    />
  );
};
