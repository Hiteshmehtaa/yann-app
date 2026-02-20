import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Foreground notification handler.
// Suppress system sound for booking requests — the in-app expo-av buzzer handles those.
Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const type = notification.request.content.data?.type as string | undefined;
        const isBookingRequest = type === 'booking_request' || type === 'booking_request_reminder';
        return {
            shouldPlaySound: !isBookingRequest,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        };
    },
});

/**
 * Setup Android notification channels on app startup.
 * Uses 'booking_alert_v3' — a fresh channel ID that has never been cached
 * by Android, so our custom MP3 sound is always applied.
 */
export async function setupNotificationChannels() {
    if (Platform.OS !== 'android') return;

    try {
        // Default channel
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });

        // Booking buzzer channel
        const existing = await Notifications.getNotificationChannelAsync('booking_alert_v3').catch(() => null);

        if (existing && existing.sound === 'custom') {
            console.log('🔔 booking_alert_v3 channel OK (sound: custom)');
        } else {
            if (existing) {
                await Notifications.deleteNotificationChannelAsync('booking_alert_v3').catch(() => { });
                console.log('🔔 Recreating booking_alert_v3 (old sound:', existing.sound, ')');
            }

            await Notifications.setNotificationChannelAsync('booking_alert_v3', {
                name: 'Booking Requests',
                sound: 'booking_request',  // Android res/raw references use filename WITHOUT extension
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
                lightColor: '#FF231F7C',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
                enableVibrate: true,
                enableLights: true,
                audioAttributes: {
                    usage: Notifications.AndroidAudioUsage.ALARM,
                    contentType: Notifications.AndroidAudioContentType.SONIFICATION,
                },
            });

            const verified = await Notifications.getNotificationChannelAsync('booking_alert_v3').catch(() => null);
            if (verified?.sound === 'custom') {
                console.log('🔔 booking_alert_v3 created ✅ (custom MP3)');
            } else {
                console.warn('🔔 booking_alert_v3 created ⚠️ sound:', verified?.sound, '(expected: custom)');
            }
        }
    } catch (error) {
        console.error('❌ Channel setup failed:', error);
    }
}

/**
 * Register for push notifications and get Expo push token.
 * Retries up to 3 times for transient Google Play Services failures.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (!Device.isDevice) {
        console.warn('⚠️ Not a physical device — push notifications unavailable');
        return undefined;
    }

    await setupNotificationChannels();

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.error('❌ Notification permissions denied');
        return undefined;
    }

    // Get push token with retry
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5000;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
        console.error('❌ Expo Project ID not found in app.json');
        return undefined;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`📲 Push token request (attempt ${attempt}/${MAX_RETRIES})...`);
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('✅ Push token:', token);
            break;
        } catch (error: any) {
            const isRetryable = error.message?.includes('SERVICE_NOT_AVAILABLE') ||
                error.message?.includes('TIMEOUT') ||
                error.code === 'E_REGISTRATION_FAILED';

            if (isRetryable && attempt < MAX_RETRIES) {
                console.warn(`⚠️ Attempt ${attempt} failed (${error.code}), retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            } else {
                console.error(`❌ Push token failed after ${attempt} attempts:`, error.message);
            }
        }
    }

    return token;
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        onNotificationReceived?.(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        onNotificationTapped?.(response);
    });

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
        content: { title, body, data, sound: true },
        trigger: null,
    });
}
