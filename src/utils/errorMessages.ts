/**
 * Enhanced Error Messages
 * 
 * User-friendly error messages with actionable suggestions
 */

import { AxiosError } from 'axios';

export interface EnhancedError {
    title: string;
    message: string;
    suggestion: string;
    retryable: boolean;
    code?: string;
}

/**
 * Get enhanced error message from error object
 */
export function getEnhancedErrorMessage(error: any): EnhancedError {
    // Network errors
    if (!error.response) {
        return {
            title: 'Connection Problem',
            message: 'Unable to connect to the server',
            suggestion: 'Check your internet connection and try again',
            retryable: true,
            code: 'NETWORK_ERROR',
        };
    }

    const status = error.response?.status;
    const data = error.response?.data;

    // Rate limiting
    if (status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'];
        const waitTime = retryAfter ? `${retryAfter} seconds` : 'a moment';

        return {
            title: 'Too Many Requests',
            message: data?.message || 'You\'re doing that too often',
            suggestion: `Please wait ${waitTime} before trying again`,
            retryable: true,
            code: 'RATE_LIMIT',
        };
    }

    // Authentication errors
    if (status === 401) {
        return {
            title: 'Session Expired',
            message: 'Your session has expired',
            suggestion: 'Please log in again to continue',
            retryable: false,
            code: 'AUTH_EXPIRED',
        };
    }

    // Authorization errors
    if (status === 403) {
        return {
            title: 'Access Denied',
            message: data?.message || 'You don\'t have permission to do this',
            suggestion: 'Contact support if you believe this is an error',
            retryable: false,
            code: 'FORBIDDEN',
        };
    }

    // Validation errors
    if (status === 400) {
        const errors = data?.errors;
        const errorList = errors ? Object.values(errors).join(', ') : '';

        return {
            title: 'Invalid Input',
            message: data?.message || 'Please check your input',
            suggestion: errorList || 'Make sure all required fields are filled correctly',
            retryable: false,
            code: 'VALIDATION_ERROR',
        };
    }

    // Not found errors
    if (status === 404) {
        return {
            title: 'Not Found',
            message: data?.message || 'The requested resource was not found',
            suggestion: 'The item may have been deleted or moved',
            retryable: false,
            code: 'NOT_FOUND',
        };
    }

    // Server errors
    if (status >= 500) {
        return {
            title: 'Server Error',
            message: 'Something went wrong on our end',
            suggestion: 'Please try again in a few moments',
            retryable: true,
            code: 'SERVER_ERROR',
        };
    }

    // Payment errors
    if (data?.message?.toLowerCase().includes('payment')) {
        return {
            title: 'Payment Failed',
            message: data?.message || 'Unable to process payment',
            suggestion: 'Check your payment method and try again',
            retryable: true,
            code: 'PAYMENT_ERROR',
        };
    }

    // Wallet errors
    if (data?.message?.toLowerCase().includes('wallet') || data?.message?.toLowerCase().includes('balance')) {
        return {
            title: 'Insufficient Balance',
            message: data?.message || 'Not enough balance in your wallet',
            suggestion: 'Add money to your wallet to continue',
            retryable: false,
            code: 'INSUFFICIENT_BALANCE',
        };
    }

    // Generic error
    return {
        title: 'Something Went Wrong',
        message: data?.message || error.message || 'An unexpected error occurred',
        suggestion: 'Please try again or contact support if the problem persists',
        retryable: true,
        code: 'UNKNOWN_ERROR',
    };
}

/**
 * Get simple error message (backward compatible)
 */
export function getErrorMessage(error: any): string {
    const enhanced = getEnhancedErrorMessage(error);
    return `${enhanced.message}. ${enhanced.suggestion}`;
}
