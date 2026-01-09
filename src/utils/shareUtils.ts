/**
 * Share Utility
 * 
 * Provider profile sharing with deep linking
 */

import { Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';

const APP_SCHEME = 'yann://';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.yann.app'; // Update with your actual package name
const APP_STORE_URL = 'https://apps.apple.com/app/yann/id123456789'; // Update with your actual app ID

export interface ShareProviderParams {
    providerId: string;
    providerName: string;
    rating?: number;
    services?: string[];
}

/**
 * Generate a shareable deep link for provider profile
 */
export function generateProviderLink(params: ShareProviderParams): string {
    const { providerId, providerName } = params;

    // Create deep link that works with app
    const deepLink = Linking.createURL(`provider/${providerId}`, {
        scheme: 'yann',
    });

    // Create web fallback URL that redirects to store
    const webUrl = `https://yann.app/provider/${providerId}`; // Your website URL

    return webUrl; // Use web URL for better compatibility
}

/**
 * Share provider profile
 */
export async function shareProviderProfile(params: ShareProviderParams): Promise<boolean> {
    try {
        const { providerId, providerName, rating, services } = params;

        const shareUrl = generateProviderLink(params);

        // Create share message
        let message = `Check out ${providerName} on YANN!`;

        if (rating) {
            message += `\n⭐ ${rating}/5 rating`;
        }

        if (services && services.length > 0) {
            message += `\n🔧 Services: ${services.slice(0, 3).join(', ')}`;
        }

        message += `\n\n${shareUrl}`;

        const result = await Share.share({
            message,
            url: Platform.OS === 'ios' ? shareUrl : undefined,
            title: `${providerName} - YANN Service Provider`,
        });

        return result.action === Share.sharedAction;
    } catch (error) {
        console.error('Error sharing provider:', error);
        return false;
    }
}

/**
 * Handle incoming deep link
 */
export function handleDeepLink(url: string): { type: string; params: any } | null {
    try {
        const { hostname, path, queryParams } = Linking.parse(url);

        // Handle provider profile deep link
        if (path?.startsWith('provider/')) {
            const providerId = path.replace('provider/', '');
            return {
                type: 'PROVIDER_PROFILE',
                params: { providerId },
            };
        }

        return null;
    } catch (error) {
        console.error('Error parsing deep link:', error);
        return null;
    }
}

/**
 * Open Play Store or App Store
 */
export function openAppStore() {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(storeUrl);
}
