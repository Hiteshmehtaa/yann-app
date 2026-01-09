/**
 * Error Display Component with Retry
 * 
 * Shows user-friendly error messages with retry button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getEnhancedErrorMessage, EnhancedError } from '../utils/errorMessages';

interface ErrorDisplayProps {
    error: any;
    onRetry?: () => void;
    style?: any;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, style }) => {
    const errorInfo: EnhancedError = getEnhancedErrorMessage(error);

    const getErrorIcon = () => {
        switch (errorInfo.code) {
            case 'NETWORK_ERROR':
                return 'cloud-offline';
            case 'AUTH_EXPIRED':
                return 'lock-closed';
            case 'RATE_LIMIT':
                return 'time';
            case 'PAYMENT_ERROR':
                return 'card';
            case 'INSUFFICIENT_BALANCE':
                return 'wallet';
            default:
                return 'alert-circle';
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconContainer}>
                <Ionicons name={getErrorIcon()} size={48} color="#EF4444" />
            </View>

            <Text style={styles.title}>{errorInfo.title}</Text>
            <Text style={styles.message}>{errorInfo.message}</Text>
            <Text style={styles.suggestion}>{errorInfo.suggestion}</Text>

            {errorInfo.retryable && onRetry && (
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetry}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#2E59F3', '#4362FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.retryGradient}
                    >
                        <Ionicons name="refresh" size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.retryText}>Try Again</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1C1E',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#4A4D52',
        marginBottom: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    suggestion: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#2E59F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    retryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    retryText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});
