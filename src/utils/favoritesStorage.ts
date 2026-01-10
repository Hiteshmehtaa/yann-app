/**
 * Favorites Storage Utility with Backend Sync
 * 
 * Manages liked/favorited providers with backend synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceProvider } from '../types';
import { apiService } from '../services/api';

const FAVORITES_KEY = '@yann_favorites';

export interface FavoriteProvider {
    id: string;
    _id?: string;
    name: string;
    profileImage?: string;
    avatar?: string;
    rating?: number;
    services?: string[];
    experience?: number;
    totalReviews?: number;
    addedAt: string;
}

/**
 * Get all favorite providers (from backend with local fallback)
 */
export async function getFavorites(): Promise<FavoriteProvider[]> {
    try {
        // 1. Get local favorites first (fastest, and truth source for offline)
        const localFavorites = await getLocalFavorites();

        // 2. Try to fetch from backend
        let serverFavorites: FavoriteProvider[] = [];
        try {
            const response = await apiService.getFavorites();
            if (response.success && response.data) {
                // Map backend data to FavoriteProvider format
                serverFavorites = response.data.map((provider: any) => ({
                    id: provider.id || provider._id,
                    _id: provider._id,
                    name: provider.name,
                    profileImage: provider.profileImage || provider.avatar,
                    avatar: provider.avatar || provider.profileImage,
                    rating: provider.rating,
                    services: provider.services,
                    experience: provider.experience,
                    totalReviews: provider.totalReviews,
                    addedAt: new Date().toISOString(),
                }));
            }
        } catch (apiError) {
            console.warn('Failed to fetch favorites from backend, using local:', apiError);
            return localFavorites;
        }

        // 3. Merge strategies: Union (Server + Local) to ensure nothing is lost during sync failures
        const mergedMap = new Map<string, FavoriteProvider>();

        // Add local ones first
        localFavorites.forEach(fav => mergedMap.set(fav.id || fav._id || '', fav));

        // Add server ones (overwriting local details if they differ, effectively updating them)
        serverFavorites.forEach(fav => mergedMap.set(fav.id || fav._id || '', fav));

        const mergedFavorites = Array.from(mergedMap.values());

        // 4. Update local cache with the merged list
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(mergedFavorites));

        return mergedFavorites;
    } catch (error) {
        console.error('Error getting favorites:', error);
        return await getLocalFavorites();
    }
}

/**
 * Get favorites from local storage only
 */
async function getLocalFavorites(): Promise<FavoriteProvider[]> {
    try {
        const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
        if (!favoritesJson) return [];

        const favorites = JSON.parse(favoritesJson);
        return Array.isArray(favorites) ? favorites : [];
    } catch (error) {
        console.error('Error getting local favorites:', error);
        return [];
    }
}

/**
 * Add provider to favorites (synced with backend)
 */
export async function addToFavorites(provider: ServiceProvider): Promise<boolean> {
    try {
        const providerId = (provider as any).id || provider._id;

        // Add to backend
        const response = await apiService.addToFavorites(providerId);

        if (response.success) {
            // Update local cache
            const favorites = await getLocalFavorites();

            const exists = favorites.some(fav =>
                fav.id === providerId || fav._id === providerId
            );

            if (!exists) {
                const favoriteProvider: FavoriteProvider = {
                    id: providerId,
                    _id: provider._id,
                    name: provider.name,
                    profileImage: provider.profileImage || (provider as any).avatar,
                    avatar: (provider as any).avatar || provider.profileImage,
                    rating: provider.rating,
                    services: provider.services,
                    experience: provider.experience,
                    totalReviews: provider.totalReviews,
                    addedAt: new Date().toISOString(),
                };

                const updatedFavorites = [favoriteProvider, ...favorites];
                await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
            }

            return true;
        }

        return false;
    } catch (error) {
        console.error('Error adding to favorites:', error);

        // Fallback to local-only storage
        try {
            const favorites = await getLocalFavorites();
            const providerId = (provider as any).id || provider._id;

            const exists = favorites.some(fav =>
                fav.id === providerId || fav._id === providerId
            );

            if (exists) return true;

            const favoriteProvider: FavoriteProvider = {
                id: providerId,
                _id: provider._id,
                name: provider.name,
                profileImage: provider.profileImage || (provider as any).avatar,
                avatar: (provider as any).avatar || provider.profileImage,
                rating: provider.rating,
                services: provider.services,
                experience: provider.experience,
                totalReviews: provider.totalReviews,
                addedAt: new Date().toISOString(),
            };

            const updatedFavorites = [favoriteProvider, ...favorites];
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
            return true;
        } catch (localError) {
            console.error('Error with local fallback:', localError);
            return false;
        }
    }
}

/**
 * Remove provider from favorites (synced with backend)
 */
export async function removeFromFavorites(providerId: string): Promise<boolean> {
    try {
        // Remove from backend
        const response = await apiService.removeFromFavorites(providerId);

        if (response.success) {
            // Update local cache
            const favorites = await getLocalFavorites();
            const updatedFavorites = favorites.filter(
                fav => fav.id !== providerId && fav._id !== providerId
            );

            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error removing from favorites:', error);

        // Fallback to local-only removal
        try {
            const favorites = await getLocalFavorites();
            const updatedFavorites = favorites.filter(
                fav => fav.id !== providerId && fav._id !== providerId
            );

            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
            return true;
        } catch (localError) {
            console.error('Error with local fallback:', localError);
            return false;
        }
    }
}

/**
 * Check if provider is favorited
 */
export async function isFavorited(providerId: string): Promise<boolean> {
    try {
        const favorites = await getFavorites();
        return favorites.some(fav => fav.id === providerId || fav._id === providerId);
    } catch (error) {
        console.error('Error checking favorite status:', error);
        return false;
    }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(provider: ServiceProvider): Promise<boolean> {
    const providerId = (provider as any).id || provider._id;
    const isCurrentlyFavorited = await isFavorited(providerId);

    if (isCurrentlyFavorited) {
        return await removeFromFavorites(providerId);
    } else {
        return await addToFavorites(provider);
    }
}

/**
 * Get favorites count
 */
export async function getFavoritesCount(): Promise<number> {
    const favorites = await getFavorites();
    return favorites.length;
}
