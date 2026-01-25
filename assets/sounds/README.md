# Sound File Setup Instructions

## Required Sound File

Add a notification sound file to enable audio alerts when providers receive booking requests.

### File Location
```
/assets/sounds/booking-request.mp3
```

### Specifications
- **Format**: MP3
- **Duration**: 1-2 seconds
- **Type**: Alert/Notification sound
- **Volume**: Normalized (peak at -3dB to prevent clipping)
- **Sample Rate**: 44.1kHz recommended
- **Bit Rate**: 128-320 kbps

### Recommended Sound Characteristics
- Clear, attention-grabbing tone
- Not too loud or jarring
- Professional notification sound
- Similar to phone notification tones

### Free Sound Resources
You can download free notification sounds from:
- **Zapsplat**: https://www.zapsplat.com (free with attribution)
- **Freesound**: https://freesound.org
- **Notification Sounds**: https://notificationsounds.com

### Alternative: Use System Sound (Temporary)
If you don't have a sound file yet, the app will fallback to:
- Haptic feedback (vibration)
- Visual notifications

The haptic feedback is already implemented and will work without the sound file.

### Testing
After adding the sound file:
1. Build the app: `expo start` or `npm run ios`/`npm run android`
2. Navigate to provider dashboard
3. Trigger a test booking request
4. Verify sound plays along with vibration

### Expo Configuration
Make sure your `app.json` includes audio permissions:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to play notification sounds."
        }
      ]
    ]
  }
}
```

### iOS Specific
For iOS, ensure the sound plays even when device is on silent mode (already configured in code):
```typescript
await Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,  // ✅ Already set
  staysActiveInBackground: true
});
```

---

## Quick Start (Without Sound File)

The app will work perfectly fine without the sound file. The notification system includes:
- ✅ Vibration patterns (iOS & Android)
- ✅ Haptic feedback
- ✅ Visual notifications
- ⏳ Sound (optional enhancement)

Simply continue testing and add the sound file later when ready.
