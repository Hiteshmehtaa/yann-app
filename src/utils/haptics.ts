import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic Feedback Utils
 * 
 * Centralized control for haptic feedback to ensure consistency across the app.
 * Automatically handles platform differences where necessary.
 */

// Helper to safely trigger haptics only on supported platforms (iOS/Android)
const trigger = async (type: () => Promise<void>) => {
    if (Platform.OS === 'web') return;
    try {
        await type();
    } catch (error) {
        // Fail silently if haptics aren't supported or permission is denied
        console.debug('Haptics failed:', error);
    }
};

export const haptics = {
    /**
     * Light feedback, good for button presses, tab switches, and standard interactions.
     * equivalent to UIImpactFeedbackGenerator(style: .light)
     */
    light: () => trigger(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

    /**
     * Medium feedback, good for secondary actions or prominent buttons.
     * equivalent to UIImpactFeedbackGenerator(style: .medium)
     */
    medium: () => trigger(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

    /**
     * Heavy feedback, good for primary actions, destructive actions, or "long press" events.
     * equivalent to UIImpactFeedbackGenerator(style: .heavy)
     */
    heavy: () => trigger(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

    /**
     * Success feedback, distinct pattern indicating a completed task.
     * equivalent to UINotificationFeedbackGenerator(type: .success)
     */
    success: () => trigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

    /**
     * Warning feedback, distinct pattern indicating a warning.
     * equivalent to UINotificationFeedbackGenerator(type: .warning)
     */
    warning: () => trigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

    /**
     * Error feedback, distinct pattern indicating failure.
     * equivalent to UINotificationFeedbackGenerator(type: .error)
     */
    error: () => trigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),

    /**
     * Selection feedback, used for scrolling through pickers or lists.
     * equivalent to UISelectionFeedbackGenerator
     */
    selection: () => trigger(() => Haptics.selectionAsync()),
};
