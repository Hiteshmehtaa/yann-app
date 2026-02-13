import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

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

    // Setup Android notification channels
    if (Platform.OS === 'android') {
        console.log('🤖 Setting up Android notification channels...');

        try {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
            console.log('✅ Default channel created');

            // Add channel for booking requests with custom buzzer sound
            // This plays even when app is closed/background (like Uber)
            await Notifications.setNotificationChannelAsync('booking_requests_v3', {
                name: 'Booking Requests',
                sound: 'booking_request.mp3', // Custom buzzer from res/raw/booking_request.mp3
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 1000, 500, 1000, 500, 1000], // Repeating pattern
                lightColor: '#FF231F7C',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
                enableVibrate: true,
                enableLights: true,
            });
            console.log('✅ Booking requests channel created');
        } catch (error) {
            console.error('❌ Failed to create notification channels:', error);
        }
    }

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
