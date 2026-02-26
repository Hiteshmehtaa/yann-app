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
 * Set up the audio system for booking request sounds.
 * Call once at app startup (e.g. from AppContext / AuthContext) so the audio
 * session is ready before the first notification arrives.
 */
export async function initializeBuzzerSound() {
  if (!Audio) {
    console.log('⚠️ Audio not available. Skipping sound initialization.');
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.InterruptionModeIOS?.DoNotMix ?? 2,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,          // Don't lower other apps — be dominant
      interruptionModeAndroid: Audio.InterruptionModeAndroid?.DoNotMix ?? 1,
      playThroughEarpieceAndroid: false, // Use speaker, not earpiece
    });
    console.log('✅ Audio system initialised for booking buzzer');
  } catch (error) {
    console.error('❌ Failed to initialise audio system:', error);
  }
}

/**
 * Play the booking-request buzzer continuously until stopBuzzer() is called.
 *
 * Reliability improvements over the naïve approach:
 *  1. `setIsLoopingAsync(true)` is called explicitly AFTER createAsync —
 *     some Android devices ignore the option passed inside createAsync.
 *  2. A `setOnPlaybackStatusUpdate` callback watches for the sound finishing
 *     and immediately replays it in case the native looping silently drops.
 *  3. Audio mode has `shouldDuckAndroid: false` so the buzzer is never
 *     attenuated by another app's audio stream.
 */
export async function playBookingRequestBuzzer() {
  try {
    console.log('🔔 Starting continuous buzzer for booking request...');

    // Don't restart if already playing.
    // IMPORTANT: set isPlaying = true SYNCHRONOUSLY before any await so that
    // concurrent callers that reach this check before the first await resolves
    // don't also proceed and create a second orphaned Sound instance that
    // can never be stopped by stopBuzzer().
    if (isPlaying) {
      console.log('⚠️ Buzzer already playing, skipping restart');
      return;
    }
    isPlaying = true; // claim the slot synchronously — reset on any failure path

    if (!Audio) {
      console.log('⚠️ expo-av not available — haptic feedback only');
      isPlaying = false; // no Audio — release the slot, fall through to haptic
    } else {
      // Ensure the audio session is configured correctly
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.InterruptionModeIOS?.DoNotMix ?? 2,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        interruptionModeAndroid: Audio.InterruptionModeAndroid?.DoNotMix ?? 1,
        playThroughEarpieceAndroid: false,
      });

      // Tear down any lingering instance first
      if (buzzerSound) {
        try {
          await buzzerSound.stopAsync();
          await buzzerSound.unloadAsync();
        } catch (_e) { /* ignore */ }
        buzzerSound = null;
      }

      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/booking_request.wav'),
          { shouldPlay: false, isLooping: true, volume: 1.0 }
        );

        // Explicitly set looping at the native level — more reliable than
        // the option in createAsync on some Android versions.
        await sound.setIsLoopingAsync(true);

        // Safety net: if the sound ever finishes despite the loop flag,
        // immediately replay it so the buzzer never silently stops.
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (!isPlaying) return; // buzzer was intentionally stopped
          if (status.didJustFinish && !status.isLooping) {
            console.log('🔄 Buzzer finished without looping — restarting...');
            sound.replayAsync().catch((e: any) =>
              console.log('⚠️ Buzzer replay error:', e)
            );
          }
        });

        await sound.playAsync();
        buzzerSound = sound;
        // isPlaying already set to true synchronously above
        console.log('✅ Buzzer sound playing (looping) — will stop when stopBuzzer() is called');
      } catch (e) {
        console.log('⚠️ Sound file error, haptic feedback only:', e);
        isPlaying = false; // release the slot so a retry can succeed
      }
    }

    // Always give immediate haptic alert
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
    } else {
      console.log('⚠️ No buzzerSound instance to stop');
    }
    // Always reset the flag — even when buzzerSound was already null.
    // This prevents a stuck isPlaying=true state that would block future
    // playBookingRequestBuzzer() calls from ever starting.
    isPlaying = false;
  } catch (error) {
    console.error('❌ Failed to stop buzzer:', error);
    // Even on error, force-reset so the next buzzer can start cleanly
    isPlaying = false;
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
