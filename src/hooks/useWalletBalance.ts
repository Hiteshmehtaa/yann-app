import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

interface WalletBalanceState {
    balance: number;
    isLoading: boolean;
    error: string | null;
}

/**
 * Custom hook to fetch and manage wallet balance
 * Auto-refreshes when screen comes into focus
 */
export const useWalletBalance = (autoRefreshOnFocus: boolean = false) => {
    const [state, setState] = useState<WalletBalanceState>({
        balance: 0,
        isLoading: true,
        error: null,
    });

    const fetchBalance = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await apiService.getWalletBalance();

            if (response.success && response.data) {
                setState({
                    balance: response.data.balance || 0,
                    isLoading: false,
                    error: null,
                });
            } else {
                setState({
                    balance: 0,
                    isLoading: false,
                    error: 'Failed to fetch balance',
                });
            }
        } catch (error: any) {
            console.error('Error fetching wallet balance:', error);
            setState({
                balance: 0,
                isLoading: false,
                error: error.message || 'Failed to fetch balance',
            });
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    // Auto-refresh on focus if enabled
    useFocusEffect(
        useCallback(() => {
            if (autoRefreshOnFocus) {
                fetchBalance();
            }
        }, [autoRefreshOnFocus, fetchBalance])
    );

    return {
        balance: state.balance,
        isLoading: state.isLoading,
        error: state.error,
        refresh: fetchBalance,
    };
};
