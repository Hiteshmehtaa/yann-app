import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { registerForPushNotificationsAsync, scheduleLocalNotification } from './notifications';

/**
 * Debug utility to test notification system
 * Call this from a debug screen or button to diagnose issues
 */
export async function debugNotificationSystem() {
    const results: string[] = [];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 NOTIFICATION SYSTEM DIAGNOSTIC');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Device Check
    const isPhysicalDevice = Device.isDevice;
    const deviceInfo = {
        isDevice: isPhysicalDevice,
        platform: Platform.OS,
        deviceName: Device.deviceName,
        osVersion: Device.osVersion,
    };

    console.log('📱 Device Info:', deviceInfo);
    results.push(`Device: ${isPhysicalDevice ? '✅ Physical' : '❌ Simulator/Emulator'}`);

    if (!isPhysicalDevice) {
        results.push('⚠️ Push notifications require a physical device');
    }

    // 2. Permission Check
    try {
        const { status } = await Notifications.getPermissionsAsync();
        console.log('🔐 Permission Status:', status);
        results.push(`Permissions: ${status === 'granted' ? '✅ Granted' : '❌ ' + status}`);

        if (status !== 'granted') {
            results.push('💡 Enable notifications in device settings');
        }
    } catch (error: any) {
        console.error('❌ Permission check failed:', error);
        results.push('❌ Permission check failed: ' + error.message);
    }

    // 3. Notification Channels (Android)
    if (Platform.OS === 'android') {
        try {
            const channels = await Notifications.getNotificationChannelsAsync();
            console.log('📢 Notification Channels:', channels);
            results.push(`Channels: ${channels.length} configured`);

            channels.forEach(channel => {
                console.log(`   - ${channel.name} (${channel.id}): importance=${channel.importance}`);
            });
        } catch (error: any) {
            console.error('❌ Channel check failed:', error);
            results.push('❌ Channel check failed: ' + error.message);
        }
    }

    // 4. Push Token Generation
    try {
        const token = await registerForPushNotificationsAsync();

        if (token) {
            console.log('✅ Push Token:', token);
            results.push('✅ Push token generated successfully');
            results.push(`Token: ${token.substring(0, 40)}...`);

            // Validate token format
            if (token.startsWith('ExponentPushToken[')) {
                results.push('✅ Token format is valid');
            } else {
                results.push('⚠️ Token format may be invalid');
            }
        } else {
            console.error('❌ No push token generated');
            results.push('❌ No push token generated');
            results.push('💡 Check permissions and device type');
        }
    } catch (error: any) {
        console.error('❌ Token generation failed:', error);
        results.push('❌ Token generation failed: ' + error.message);

        if (error.message?.includes('credentials')) {
            results.push('💡 Upload FCM credentials to Expo');
        }
    }

    // 5. Test Local Notification
    try {
        console.log('📲 Sending test local notification...');
        await scheduleLocalNotification(
            '🧪 Test Notification',
            'If you see this, local notifications are working!',
            { test: true }
        );
        results.push('✅ Local notification sent');
        results.push('💡 Check if notification appeared');
    } catch (error: any) {
        console.error('❌ Local notification failed:', error);
        results.push('❌ Local notification failed: ' + error.message);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTIC SUMMARY:');
    results.forEach(result => console.log('   ' + result));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Show results to user
    Alert.alert(
        '🔍 Notification Diagnostic',
        results.join('\n\n'),
        [{ text: 'OK' }]
    );

    return {
        success: results.filter(r => r.includes('✅')).length > 0,
        results,
        deviceInfo,
    };
}

/**
 * Get current push token (for debugging)
 */
export async function getCurrentPushToken(): Promise<string | null> {
    try {
        const token = await registerForPushNotificationsAsync();
        return token || null;
    } catch (error) {
        console.error('Failed to get push token:', error);
        return null;
    }
}

/**
 * Test notification listener setup
 */
export function testNotificationListeners() {
    console.log('🔔 Setting up test notification listeners...');

    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📬 NOTIFICATION RECEIVED (Foreground)');
        console.log('   Title:', notification.request.content.title);
        console.log('   Body:', notification.request.content.body);
        console.log('   Data:', JSON.stringify(notification.request.content.data, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👆 NOTIFICATION TAPPED');
        console.log('   Title:', response.notification.request.content.title);
        console.log('   Body:', response.notification.request.content.body);
        console.log('   Data:', JSON.stringify(response.notification.request.content.data, null, 2));
        console.log('   Action:', response.actionIdentifier);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    console.log('✅ Test listeners registered');

    return () => {
        receivedListener.remove();
        responseListener.remove();
        console.log('🔕 Test listeners removed');
    };
}
