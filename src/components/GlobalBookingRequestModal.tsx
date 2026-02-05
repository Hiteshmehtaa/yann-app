import React from 'react';
import { ProviderIncomingRequest } from './provider/ProviderIncomingRequest';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Global booking request modal for providers
 * Listens to notification context and shows incoming booking request modal
 * with continuous buzzer when a new booking request arrives
 */
export const GlobalBookingRequestModal: React.FC = () => {
  const { incomingBookingRequest, setIncomingBookingRequest, ignoreBookingRequest } = useNotifications();
  const { user } = useAuth();

  const providerId = user?._id || user?.id || '';

  const handleAccept = () => {
    console.log('✅ GlobalModal: handleAccept called');
    // Booking accepted - dismiss modal and ignore future polls
    if (incomingBookingRequest) ignoreBookingRequest(incomingBookingRequest.bookingId);
    else {
      console.warn('⚠️ GlobalModal: incomingBookingRequest is null in handleAccept');
      setIncomingBookingRequest(null);
    }
  };

  const handleReject = () => {
    console.log('❌ GlobalModal: handleReject called');
    // Booking rejected - dismiss modal and ignore future polls
    if (incomingBookingRequest) ignoreBookingRequest(incomingBookingRequest.bookingId);
    else {
      console.warn('⚠️ GlobalModal: incomingBookingRequest is null in handleReject');
      setIncomingBookingRequest(null);
    }
  };

  const handleDismiss = () => {
    console.log('👋 GlobalModal: handleDismiss called');
    // Timer expired or manually dismissed
    if (incomingBookingRequest) ignoreBookingRequest(incomingBookingRequest.bookingId);
    else {
      console.warn('⚠️ GlobalModal: incomingBookingRequest is null in handleDismiss');
      setIncomingBookingRequest(null);
    }
  };

  return (
    <ProviderIncomingRequest
      visible={!!incomingBookingRequest}
      requestData={incomingBookingRequest}
      providerId={providerId}
      onAccept={handleAccept}
      onReject={handleReject}
      onDismiss={handleDismiss}
    />
  );
};
