import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Optional: Import expo-av if available
let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.log('📢 expo-av not installed. Using haptic feedback only for notifications.');
}

let buzzerSound: any | null = null;
let isPlaying = false;

/**
 * Initialize and load the booking request buzzer sound
 * Note: Requires expo-av package. If not installed, will use haptic feedback only.
 */
export async function initializeBuzzerSound() {
  if (!Audio) {
    console.log('⚠️ Audio not available. Skipping sound initialization.');
    return;
  }

  try {
    // Set audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    // Sound file is optional - app works with haptic feedback only
    // To enable sound: add booking-request.mp3 to /assets/sounds/
    console.log('✅ Audio system initialized (sound file optional)');
    
    // Uncomment when sound file is added:
    // try {
    //   const { sound } = await Audio.Sound.createAsync(
    //     require('../../assets/sounds/booking-request.mp3'),
    //     { shouldPlay: false, isLooping: false, volume: 1.0 }
    //   );
    //   buzzerSound = sound;
    //   console.log('✅ Buzzer sound loaded');
    // } catch (fileError) {
    //   console.log('⚠️ Sound file not found. Using haptic feedback only.');
    // }
  } catch (error) {
    console.error('❌ Failed to initialize audio system:', error);
    // Fallback to haptic feedback only
  }
}

/**
 * Play booking request notification sound with vibration
 */
export async function playBookingRequestBuzzer() {
  try {
    // Play sound if available
    if (buzzerSound && !isPlaying) {
      isPlaying = true;
      await buzzerSound.replayAsync();
      
      // Auto-reset playing flag after sound duration
      setTimeout(() => {
        isPlaying = false;
      }, 2000); // Adjust based on sound duration
    }

    // Always provide haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Additional vibration pattern
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
      
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 400);
    } else {
      // Android vibration pattern
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 150);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 300);
    }
  } catch (error) {
    console.error('❌ Failed to play buzzer:', error);
  }
}

/**
 * Stop any playing buzzer sound
 */
export async function stopBuzzer() {
  try {
    if (buzzerSound && isPlaying) {
      await buzzerSound.stopAsync();
      isPlaying = false;
    }
  } catch (error) {
    console.error('❌ Failed to stop buzzer:', error);
  }
}

/**
 * Cleanup sound resources
 */
export async function cleanupBuzzerSound() {
  try {
    if (buzzerSound) {
      await buzzerSound.unloadAsync();
      buzzerSound = null;
      isPlaying = false;
      console.log('✅ Buzzer sound cleaned up');
    }
  } catch (error) {
    console.error('❌ Failed to cleanup buzzer:', error);
  }
}

/**
 * Play a simple success sound for accepted bookings
 */
export async function playSuccessSound() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.error('❌ Failed to play success sound:', error);
  }
}

/**
 * Play a simple error sound for rejected bookings
 */
export async function playErrorSound() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.error('❌ Failed to play error sound:', error);
  }
}
