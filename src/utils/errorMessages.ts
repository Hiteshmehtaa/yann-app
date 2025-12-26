/**
 * Error Message Utility
 * Provides user-friendly error messages for common error scenarios
 */

export const getErrorMessage = (error: any): string => {
    // Network errors
    if (error.code === 'ECONNABORTED') {
        return 'Request timeout. Please check your internet connection and try again.';
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return 'No internet connection. Please check your network and try again.';
    }
    if (error.code === 'ETIMEDOUT') {
        return 'Connection timed out. Please try again.';
    }

    // HTTP Status errors
    const status = error.response?.status;
    if (status === 400) {
        return error.response?.data?.message || 'Invalid request. Please check your input.';
    }
    if (status === 401) {
        return 'Session expired. Please login again.';
    }
    if (status === 403) {
        return 'Access denied. You don\'t have permission for this action.';
    }
    if (status === 404) {
        return error.response?.data?.message || 'Service not found. Please try again.';
    }
    if (status === 409) {
        return error.response?.data?.message || 'This action conflicts with existing data.';
    }
    if (status === 429) {
        return 'Too many requests. Please wait a moment and try again.';
    }
    if (status === 500) {
        return 'Server error. Our team has been notified. Please try again later.';
    }
    if (status === 503) {
        return 'Service temporarily unavailable. Please try again in a few moments.';
    }

    // Wallet-specific errors
    if (error.message?.toLowerCase().includes('insufficient balance')) {
        return 'Insufficient wallet balance. Please add money to continue.';
    }
    if (error.message?.toLowerCase().includes('wallet')) {
        return error.message || 'Wallet error. Please try again.';
    }

    // Booking-specific errors
    if (error.message?.toLowerCase().includes('already booked')) {
        return 'This time slot is already booked. Please choose another time.';
    }
    if (error.message?.toLowerCase().includes('provider not available')) {
        return 'Selected service provider is not available. Please choose another.';
    }
    if (error.message?.toLowerCase().includes('booking')) {
        return error.response?.data?.message || error.message || 'Booking error. Please try again.';
    }

    // Authentication errors
    if (error.message?.toLowerCase().includes('invalid otp')) {
        return 'Invalid OTP. Please check and try again.';
    }
    if (error.message?.toLowerCase().includes('otp expired')) {
        return 'OTP has expired. Please request a new one.';
    }
    if (error.message?.toLowerCase().includes('unauthorized')) {
        return 'Session expired. Please login again.';
    }

    // Payment errors
    if (error.message?.toLowerCase().includes('payment failed')) {
        return 'Payment failed. Please try again or use a different payment method.';
    }
    if (error.message?.toLowerCase().includes('razorpay')) {
        return error.message || 'Payment error. Please try again.';
    }

    // File upload errors
    if (error.message?.toLowerCase().includes('file too large')) {
        return 'File is too large. Please choose a smaller file.';
    }
    if (error.message?.toLowerCase().includes('invalid file')) {
        return 'Invalid file type. Please choose a different file.';
    }

    // Default fallback
    return error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
};

/**
 * Get a short error title for toast notifications
 */
export const getErrorTitle = (error: any): string => {
    const status = error.response?.status;

    if (error.code === 'ERR_NETWORK') return 'No Internet';
    if (status === 401) return 'Session Expired';
    if (status === 500) return 'Server Error';
    if (error.message?.toLowerCase().includes('insufficient balance')) return 'Insufficient Balance';
    if (error.message?.toLowerCase().includes('payment')) return 'Payment Failed';

    return 'Error';
};
