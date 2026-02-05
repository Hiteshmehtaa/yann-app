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
    // Booking accepted - dismiss modal and ignore future polls
    if (incomingBookingRequest) ignoreBookingRequest(incomingBookingRequest.bookingId);
    else setIncomingBookingRequest(null);
  };

  const handleReject = () => {
    // Booking rejected - dismiss modal and ignore future polls
    if (incomingBookingRequest) ignoreBookingRequest(incomingBookingRequest.bookingId);
    else setIncomingBookingRequest(null);
  };

  const handleDismiss = () => {
    // Timer expired or manually dismissed
    if (incomingBookingRequest) ignoreBookingRequest(incomingBookingRequest.bookingId);
    else setIncomingBookingRequest(null);
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
