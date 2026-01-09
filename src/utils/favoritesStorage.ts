/**
 * Favorites Storage Utility
 * 
 * Manages liked/favorited providers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceProvider } from '../types';

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
 * Get all favorite providers
 */
export async function getFavorites(): Promise<FavoriteProvider[]> {
    try {
        const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
        if (!favoritesJson) return [];

        const favorites = JSON.parse(favoritesJson);
        return Array.isArray(favorites) ? favorites : [];
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
}

/**
 * Add provider to favorites
 */
export async function addToFavorites(provider: ServiceProvider): Promise<boolean> {
    try {
        const favorites = await getFavorites();

        const providerId = (provider as any).id || provider._id;

        // Check if already favorited
        const exists = favorites.some(fav =>
            fav.id === providerId || fav._id === providerId
        );

        if (exists) {
            return true; // Already favorited
        }

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
    } catch (error) {
        console.error('Error adding to favorites:', error);
        return false;
    }
}

/**
 * Remove provider from favorites
 */
export async function removeFromFavorites(providerId: string): Promise<boolean> {
    try {
        const favorites = await getFavorites();
        const updatedFavorites = favorites.filter(
            fav => fav.id !== providerId && fav._id !== providerId
        );

        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
        return true;
    } catch (error) {
        console.error('Error removing from favorites:', error);
        return false;
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
