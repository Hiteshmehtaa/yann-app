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
      // Ensure Android plays even if other audio is active
      interruptionModeAndroid: Audio.InterruptionModeAndroid?.DoNotMix ?? 1,
      playThroughEarpieceAndroid: false,
    });

    // Sound file is optional - app works with haptic feedback only
    // To enable sound: add booking-request.mp3 to /assets/sounds/
    console.log('✅ Audio system initialized (sound file optional)');

    // Uncomment when sound file is added:
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/booking_request.mp3'),
        { shouldPlay: false, isLooping: false, volume: 1.0 }
      );
      buzzerSound = sound;
      console.log('✅ Buzzer sound loaded');
    } catch (fileError) {
      console.log('⚠️ Sound file not found. Using haptic feedback only.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize audio system:', error);
    // Fallback to haptic feedback only
  }
}

/**
 * Play booking request notification sound with vibration
 * This buzzer will play continuously until stopBuzzer() is called
 * (typically for the full 3-minute booking modal duration)
 */
export async function playBookingRequestBuzzer() {
  try {
    console.log('🔔 Starting continuous buzzer for booking request...');

    // Don't restart if already playing
    if (isPlaying) {
      console.log('⚠️ Buzzer already playing, skipping restart');
      return;
    }

    // Ensure audio mode is set before playing
    if (Audio) {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.InterruptionModeAndroid?.DoNotMix ?? 1,
        playThroughEarpieceAndroid: false,
      });
    }

    // Play sound if available
    if (Audio) {
      try {
        // Unload existing sound if any to prevent state issues
        if (buzzerSound) {
          try { 
            await buzzerSound.stopAsync();
            await buzzerSound.unloadAsync(); 
          } catch (e) { 
            console.log('Cleanup warning:', e);
          }
        }

        // Create and load the sound to play continuously
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/booking_request.mp3'),
          { 
            shouldPlay: true, 
            isLooping: true,  // Loop continuously
            volume: 1.0 
          }
        );

        buzzerSound = sound;
        isPlaying = true;
        console.log('✅ Buzzer sound playing - will loop until stopBuzzer() is called');
      } catch (e) {
        console.log('⚠️ Sound file error, using haptic feedback only:', e);
      }
    }

    // Provide initial haptic feedback to alert user
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

  } catch (error) {
    console.error('❌ Failed to start buzzer:', error);
  }
}

/**
 * Stop any playing buzzer sound
 */
export async function stopBuzzer() {
  try {
    console.log('🛑 stopBuzzer called');
    if (buzzerSound) {
      try {
        await buzzerSound.stopAsync();
        await buzzerSound.unloadAsync();
      } catch (e) {
        console.log('Error stopping/unloading sound:', e);
      }
      buzzerSound = null;
      isPlaying = false;
      console.log('✅ Buzzer stopped and unloaded');
    } else {
      console.log('⚠️ No buzzerSound instance to stop');
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
