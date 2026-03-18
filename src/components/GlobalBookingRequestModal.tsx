import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ProviderIncomingRequest } from './provider/ProviderIncomingRequest';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Global booking request modal for providers
 * Listens to notification context and shows incoming booking request modal
 * with continuous buzzer when a new booking request arrives
 */
export const GlobalBookingRequestModal: React.FC = () => {
  const { incomingBookingRequest, setIncomingBookingRequest, ignoreBookingRequest, cancelledBookingMessage } = useNotifications();
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isPartnerVerified = !!(user?.isVerified || user?.aadhaarVerified);

  const providerId = user?._id || user?.id || '';

  // Animate the cancellation toast
  useEffect(() => {
    if (cancelledBookingMessage) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2400),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [cancelledBookingMessage]);

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
    <>
      <ProviderIncomingRequest
        visible={!!incomingBookingRequest && isPartnerVerified}
        requestData={incomingBookingRequest}
        providerId={providerId}
        onAccept={handleAccept}
        onReject={handleReject}
        onDismiss={handleDismiss}
      />

      {/* Cancellation toast — shows briefly when homeowner cancels */}
      {cancelledBookingMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          <View style={styles.toast}>
            <Text style={styles.toastIcon}>❌</Text>
            <Text style={styles.toastText}>{cancelledBookingMessage}</Text>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  toastIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});
