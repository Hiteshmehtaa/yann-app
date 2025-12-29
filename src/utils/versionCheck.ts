import * as Updates from 'expo-updates';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERSION_CHECK_KEY = '@yann_last_version_check';
const DISMISSED_VERSION_KEY = '@yann_dismissed_version';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export interface VersionInfo {
    currentVersion: string;
    latestVersion: string | null;
    updateAvailable: boolean;
    shouldShowNotification: boolean;
}

/**
 * Get the current app version from package.json
 */
export const getCurrentVersion = (): string => {
    return Application.nativeApplicationVersion || '1.0.0';
};

/**
 * Check if we should perform a version check based on last check time
 */
const shouldCheckVersion = async (): Promise<boolean> => {
    try {
        const lastCheck = await AsyncStorage.getItem(VERSION_CHECK_KEY);
        if (!lastCheck) return true;

        const lastCheckTime = parseInt(lastCheck, 10);
        const now = Date.now();
        return (now - lastCheckTime) > CHECK_INTERVAL;
    } catch (error) {
        console.error('Error checking last version check time:', error);
        return true;
    }
};

/**
 * Save the current time as last version check time
 */
const saveVersionCheckTime = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(VERSION_CHECK_KEY, Date.now().toString());
    } catch (error) {
        console.error('Error saving version check time:', error);
    }
};

/**
 * Check if user has dismissed this version update
 */
const hasUserDismissedVersion = async (version: string): Promise<boolean> => {
    try {
        const dismissedVersion = await AsyncStorage.getItem(DISMISSED_VERSION_KEY);
        return dismissedVersion === version;
    } catch (error) {
        console.error('Error checking dismissed version:', error);
        return false;
    }
};

/**
 * Save dismissed version
 */
export const dismissVersionUpdate = async (version: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(DISMISSED_VERSION_KEY, version);
    } catch (error) {
        console.error('Error saving dismissed version:', error);
    }
};

/**
 * Fetch latest version from expo-updates or simulate for development
 * In production, this would check the Play Store/App Store
 */
const fetchLatestVersion = async (): Promise<string | null> => {
    try {
        // Check if updates are available via expo-updates
        if (!__DEV__) {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                // In production, version checking would be done through app store APIs
                // or a custom backend endpoint that compares versions
                // For now, we return null as the manifest doesn't expose version directly
                return null;
            }
        }

        // In development or if no update available, return null
        return null;
    } catch (error) {
        console.error('Error fetching latest version:', error);
        return null;
    }
};

/**
 * Compare two version strings (e.g., "1.0.4" vs "1.0.5")
 */
const compareVersions = (current: string, latest: string): boolean => {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (latestPart > currentPart) return true;
        if (latestPart < currentPart) return false;
    }

    return false; // Versions are equal
};

/**
 * Main function to check for app updates
 * Returns version info including whether to show notification
 */
export const checkForAppUpdate = async (): Promise<VersionInfo> => {
    const currentVersion = getCurrentVersion();

    // Check if we should perform version check
    const shouldCheck = await shouldCheckVersion();
    if (!shouldCheck) {
        return {
            currentVersion,
            latestVersion: null,
            updateAvailable: false,
            shouldShowNotification: false,
        };
    }

    // Fetch latest version
    const latestVersion = await fetchLatestVersion();

    // Save check time
    await saveVersionCheckTime();

    if (!latestVersion) {
        return {
            currentVersion,
            latestVersion: null,
            updateAvailable: false,
            shouldShowNotification: false,
        };
    }

    // Compare versions
    const updateAvailable = compareVersions(currentVersion, latestVersion);

    if (!updateAvailable) {
        return {
            currentVersion,
            latestVersion,
            updateAvailable: false,
            shouldShowNotification: false,
        };
    }

    // Check if user has dismissed this version
    const dismissed = await hasUserDismissedVersion(latestVersion);

    return {
        currentVersion,
        latestVersion,
        updateAvailable: true,
        shouldShowNotification: !dismissed,
    };
};

/**
 * Open the app store for update
 */
export const openAppStore = (): void => {
    const packageName = Application.applicationId || 'com.yann.mobile';

    if (Platform.OS === 'android') {
        const url = `market://details?id=${packageName}`;
        // This would be handled by Linking.openURL in the component
        console.log('Opening Play Store:', url);
    } else if (Platform.OS === 'ios') {
        // iOS App Store URL would go here
        const appId = 'YOUR_APP_ID'; // Replace with actual App Store ID
        const url = `itms-apps://apps.apple.com/app/id${appId}`;
        console.log('Opening App Store:', url);
    }
};
