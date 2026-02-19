import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground.
// For booking_request / booking_request_reminder we intentionally suppress the
// system notification sound because the in-app modal immediately starts a
// continuously-looping expo-av buzzer.  Playing both at the same time produces
// the "heard twice" double-sound experienced by partners.
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const type = notification.request.content.data?.type as string | undefined;
        const isBookingRequest = type === 'booking_request' || type === 'booking_request_reminder';
        return {
            shouldPlaySound: !isBookingRequest, // in-app looping buzzer handles booking requests
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        };
    },
});

/**
 * Setup notification channels on app startup (Android only).
 *
 * WHY 'booking_alert' AND NOT 'booking_requests':
 * Android permanently caches user preferences per channel ID.  The old
 * 'booking_requests' channel (and v3/v4/v5 variants) was created and deleted
 * dozens of times with broken configurations — Android has cached "Default"
 * sound for that ID on every partner device.  Even after delete+recreate,
 * Android restores the cached preference and ignores our WAV.
 *
 * Solution: use a completely new ID 'booking_alert' that has NEVER existed on
 * any device.  A fresh ID has zero cached preferences → our WAV is applied.
 *
 * We do NOT delete this channel on every startup (the old broken approach).
 * We create it once, verify the sound loaded, and leave it permanently.
 * Only re-create if the channel is missing or the sound didn't apply.
 */
export async function setupNotificationChannels() {
    if (Platform.OS !== 'android') {
        return;
    }

    console.log('🔔 Setting up notification channels...');

    try {
        // Default channel (unchanged)
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });

        // Check if the booking_alert channel already exists with a custom sound.
        // 'sound' field returns 'custom' when a non-default sound is applied,
        // 'default' when the WAV failed to load, or null when no sound is set.
        const existing = await Notifications.getNotificationChannelAsync('booking_alert').catch(() => null);

        if (existing && existing.sound === 'custom') {
            // Perfect — channel already registered with our WAV.
            console.log('✅ booking_alert channel already correct (sound: custom)');
        } else {
            // First run on this device, OR previous creation didn't apply the sound.
            // Delete first if a broken version exists.
            if (existing) {
                await Notifications.deleteNotificationChannelAsync('booking_alert').catch(() => {});
                console.log('🗑️ Deleted broken booking_alert channel (sound was:', existing.sound, ')');
            }

            await Notifications.setNotificationChannelAsync('booking_alert', {
                name: 'Booking Requests',
                sound: 'booking_request.wav',         // resolves to res/raw/booking_request in APK
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
                lightColor: '#FF231F7C',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
                enableVibrate: true,
                enableLights: true,
            });

            // Verify the sound was actually applied (returns 'custom' on success)
            const verified = await Notifications.getNotificationChannelAsync('booking_alert').catch(() => null);
            if (verified?.sound === 'custom') {
                console.log('✅ booking_alert channel created — custom WAV confirmed');
            } else {
                console.warn('⚠️ booking_alert channel created but sound =', verified?.sound, '(expected: custom). WAV may be missing from res/raw.');
            }
        }

        // Silently retire all old channel IDs — leave them registered so old
        // notifications in the tray still show, but new ones go to booking_alert.
        // (Deleting them here would cause Android to restore their cached prefs
        //  on the next create attempt — so we just leave them alone.)

        console.log('✅ Notification channels ready');
    } catch (error) {
        console.error('❌ Failed to setup notification channels:', error);
    }
}

/**
 * Register for push notifications and get Expo push token
 * @returns {Promise<string|undefined>} Push token or undefined if failed
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 NOTIFICATION REGISTRATION STARTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if device is physical
    console.log('📱 Device Check:', {
        isDevice: Device.isDevice,
        platform: Platform.OS,
        deviceName: Device.deviceName,
        osVersion: Device.osVersion,
    });

    if (!Device.isDevice) {
        console.warn('⚠️ Not a physical device - push notifications will not work');
        console.warn('   Use a physical device or production build for testing');
        return undefined;
    }

    // Setup notification channels (ensures they exist)
    await setupNotificationChannels();

    // Check and request permissions
    console.log('🔐 Checking notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('   Current permission status:', existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        console.log('   Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('   Permission request result:', status);
    }

    if (finalStatus !== 'granted') {
        console.error('❌ NOTIFICATION PERMISSIONS DENIED');
        console.error('   User must enable notifications in device settings');
        console.error('   Go to: Settings > Apps > Yann > Notifications');
        return undefined;
    }

    console.log('✅ Notification permissions granted');

    // Get Expo push token
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        console.log('🎯 Expo Project Configuration:', {
            projectId: projectId || 'NOT FOUND',
            expoConfigExists: !!Constants.expoConfig,
            easConfigExists: !!Constants.easConfig,
        });

        if (!projectId) {
            console.error('❌ CRITICAL: Expo Project ID not found!');
            console.error('   Check app.json for extra.eas.projectId');
            return undefined;
        }

        console.log('📲 Requesting Expo push token...');
        token = (
            await Notifications.getExpoPushTokenAsync({
                projectId,
            })
        ).data;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ PUSH TOKEN OBTAINED SUCCESSFULLY');
        console.log('   Token:', token);
        console.log('   Length:', token?.length);
        console.log('   Format:', token?.startsWith('ExponentPushToken[') ? 'Valid' : 'Invalid');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error: any) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ PUSH TOKEN GENERATION FAILED');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        console.error('   Stack:', error.stack);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (error.message?.includes('credentials')) {
            console.error('💡 SOLUTION: Upload FCM credentials to Expo');
            console.error('   1. Go to https://expo.dev/accounts/[account]/projects/[projectId]/credentials');
            console.error('   2. Upload google-services.json for Android');
            console.error('   3. Rebuild the app');
        }
    }

    return token;
}

/**
 * Setup notification listeners
 * @param onNotificationReceived Callback when notification received (foreground)
 * @param onNotificationTapped Callback when notification tapped
 * @returns Cleanup function to remove listeners
 */
export function setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
    // Handle notification received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        onNotificationReceived?.(notification);
    });

    // Handle notification tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        onNotificationTapped?.(response);
    });

    // Return cleanup function
    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}

/**
 * Get the last notification response (useful for handling notification that opened the app)
 */
export async function getLastNotificationResponse() {
    return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
        },
        trigger: null, // Show immediately
    });
}
