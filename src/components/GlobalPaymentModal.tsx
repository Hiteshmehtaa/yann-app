import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { CompletionPaymentModal } from './CompletionPaymentModal';
import { InitialPaymentModal } from './InitialPaymentModal';
import { useNotifications } from '../contexts/NotificationContext';
import { apiService } from '../services/api';
import { navigationRef } from '../navigation/AppNavigator';
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💳 PAYMENT MODAL STATE CHANGE');
    console.log('   paymentModalData:', paymentModalData ? {
      type: paymentModalData.type,
      bookingId: paymentModalData.bookingId,
      initialAmount: paymentModalData.initialPaymentAmount,
      completionAmount: paymentModalData.completionAmount
    } : 'NULL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (paymentModalData?.bookingId) {
      console.log('📋 Fetching booking for modal:', paymentModalData.bookingId);
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
          console.log('✅ Booking found for modal:', foundBooking._id, 'status:', foundBooking.status);

          // STRICT CHECK: Verify if payment is actually needed
          if (paymentModalData.type === 'completion') {
            const isActuallyPaid = foundBooking.paymentStatus === 'paid' ||
              foundBooking.walletPaymentStage === 'completed' ||
              (foundBooking.escrowDetails?.isCompletionPaid === true);

            if (isActuallyPaid) {
              console.log('🛑 Payment already done! Closing modal.');
              setPaymentModalData(null);
              setBooking(null);
              return;
            }
          }

          setBooking(foundBooking as Booking);
        } else {
          console.log('⚠️ Booking NOT in list, trying direct fetch...');
          try {
            const directResponse = await apiService.getBookingStatus(bookingId);
            if (directResponse.success && directResponse.data) {
              console.log('✅ Booking found via direct fetch');
              setBooking(directResponse.data as Booking);
              return;
            }
          } catch (err) {
            console.error('Direct fetch failed:', err);
          }

          console.log('❌ Booking not found anywhere, closing modal');
          setPaymentModalData(null);
          setBooking(null);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch booking:', error);
      setPaymentModalData(null);
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🔴 Payment modal CLOSED by user');
    if (paymentModalData?.notificationId) {
      markAsRead(paymentModalData.notificationId);
    }
    setPaymentModalData(null);
    setBooking(null);
  };

  const handlePaymentSuccess = () => {
    console.log('✅ Payment SUCCESS - closing modal');
    setPaymentModalData(null);
    setBooking(null);
    refreshNotifications();

    if (navigationRef.isReady()) {
      navigationRef.navigate('MainTabs' as never, { screen: 'BookingsList' } as never);
    }
  };

  const handleTimeout = () => {
    console.log('⏰ Payment TIMEOUT - modal closing');
    setPaymentModalData(null);
    setBooking(null);
    refreshNotifications();
  };

  // Check if modal should show
  if (!paymentModalData || !booking || isLoading) {
    if (paymentModalData && !booking && !isLoading) {
      console.log('⏳ Waiting for booking data...');
    }
    return null;
  }

  // SHOW MODAL
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🟢 SHOWING PAYMENT MODAL');
  console.log('   Type:', paymentModalData.type === 'initial' ? '25% INITIAL' : '75% COMPLETION');
  console.log('   Booking:', booking._id);
  console.log('   Service:', booking.serviceName);
  console.log('   Total:', booking.totalPrice);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Show initial payment modal (25%)
  if (paymentModalData.type === 'initial') {
    console.log('💰 Rendering 25% INITIAL Payment Modal');
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
  console.log('💰 Rendering 75% COMPLETION Payment Modal');
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
