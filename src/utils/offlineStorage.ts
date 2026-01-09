/**
 * Offline Storage Manager
 * 
 * Handles caching and syncing data when offline
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEYS = {
    BOOKINGS: '@yann_cache_bookings',
    PROVIDERS: '@yann_cache_providers',
    SERVICES: '@yann_cache_services',
    PROFILE: '@yann_cache_profile',
    PENDING_ACTIONS: '@yann_pending_actions',
    LAST_SYNC: '@yann_last_sync',
};

export interface PendingAction {
    id: string;
    type: 'create_booking' | 'update_profile' | 'cancel_booking' | 'accept_booking';
    data: any;
    timestamp: number;
    retryCount: number;
}

class OfflineStorageManager {
    private isOnline: boolean = true;
    private listeners: ((isOnline: boolean) => void)[] = [];

    constructor() {
        this.initNetworkListener();
    }

    /**
     * Initialize network status listener
     */
    private initNetworkListener() {
        NetInfo.addEventListener(state => {
            const wasOnline = this.isOnline;
            this.isOnline = state.isConnected ?? false;

            // Notify listeners of network status change
            this.listeners.forEach(listener => listener(this.isOnline));

            // Auto-sync when coming back online
            if (!wasOnline && this.isOnline) {
                console.log('📶 Back online - syncing pending actions');
                this.syncPendingActions();
            }
        });
    }

    /**
     * Subscribe to network status changes
     */
    onNetworkChange(callback: (isOnline: boolean) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Check if currently online
     */
    async checkOnlineStatus(): Promise<boolean> {
        const state = await NetInfo.fetch();
        this.isOnline = state.isConnected ?? false;
        return this.isOnline;
    }

    /**
     * Cache data
     */
    async cacheData(key: keyof typeof CACHE_KEYS, data: any): Promise<void> {
        try {
            await AsyncStorage.setItem(CACHE_KEYS[key], JSON.stringify(data));
            await this.updateLastSync(key);
        } catch (error) {
            console.error(`Failed to cache ${key}:`, error);
        }
    }

    /**
     * Get cached data
     */
    async getCachedData<T>(key: keyof typeof CACHE_KEYS): Promise<T | null> {
        try {
            const data = await AsyncStorage.getItem(CACHE_KEYS[key]);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Failed to get cached ${key}:`, error);
            return null;
        }
    }

    /**
     * Add pending action to queue
     */
    async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
        try {
            const pendingActions = await this.getPendingActions();
            const newAction: PendingAction = {
                ...action,
                id: `${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                retryCount: 0,
            };

            pendingActions.push(newAction);
            await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(pendingActions));

            console.log('📝 Added pending action:', action.type);
        } catch (error) {
            console.error('Failed to add pending action:', error);
        }
    }

    /**
     * Get all pending actions
     */
    async getPendingActions(): Promise<PendingAction[]> {
        try {
            const data = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to get pending actions:', error);
            return [];
        }
    }

    /**
     * Remove pending action
     */
    async removePendingAction(actionId: string): Promise<void> {
        try {
            const pendingActions = await this.getPendingActions();
            const filtered = pendingActions.filter(a => a.id !== actionId);
            await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
        } catch (error) {
            console.error('Failed to remove pending action:', error);
        }
    }

    /**
     * Sync pending actions when back online
     */
    async syncPendingActions(): Promise<void> {
        if (!this.isOnline) {
            console.log('⚠️ Cannot sync - offline');
            return;
        }

        const pendingActions = await this.getPendingActions();
        if (pendingActions.length === 0) {
            return;
        }

        console.log(`🔄 Syncing ${pendingActions.length} pending actions`);

        for (const action of pendingActions) {
            try {
                await this.executePendingAction(action);
                await this.removePendingAction(action.id);
                console.log('✅ Synced action:', action.type);
            } catch (error) {
                console.error('❌ Failed to sync action:', action.type, error);

                // Increment retry count
                action.retryCount++;

                // Remove if too many retries
                if (action.retryCount >= 3) {
                    console.log('⚠️ Removing action after 3 failed attempts');
                    await this.removePendingAction(action.id);
                }
            }
        }
    }

    /**
     * Execute a pending action
     */
    private async executePendingAction(action: PendingAction): Promise<void> {
        // Import API service dynamically to avoid circular dependencies
        const { apiService } = await import('../services/api');

        switch (action.type) {
            case 'create_booking':
                await apiService.createBooking(action.data);
                break;

            case 'update_profile':
                await apiService.updateProfile(action.data);
                break;

            case 'cancel_booking':
                await apiService.cancelBooking(action.data.bookingId, action.data.providerId);
                break;

            case 'accept_booking':
                await apiService.acceptBooking(action.data.bookingId, action.data.providerId);
                break;

            default:
                console.warn('Unknown action type:', action.type);
        }
    }

    /**
     * Update last sync timestamp
     */
    private async updateLastSync(key: string): Promise<void> {
        try {
            const lastSync = await this.getLastSync();
            lastSync[key] = Date.now();
            await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, JSON.stringify(lastSync));
        } catch (error) {
            console.error('Failed to update last sync:', error);
        }
    }

    /**
     * Get last sync timestamps
     */
    async getLastSync(): Promise<Record<string, number>> {
        try {
            const data = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Clear all cached data
     */
    async clearCache(): Promise<void> {
        try {
            await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
            console.log('🗑️ Cache cleared');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
}

export const offlineStorage = new OfflineStorageManager();
