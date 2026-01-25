# Backend Connection Guide - Local & Physical Device

## Current Setup

✅ **Emulator**: Connects to local backend  
❌ **Physical Device**: Not connecting to local backend

## Configuration

The app automatically detects and connects to:
1. **Local backend** (http://192.168.1.11:3000/api) - FIRST PRIORITY
2. **Production backend** (https://yann-care.vercel.app/api) - FALLBACK

### Device IP Mapping
- **Physical Device**: `192.168.1.11:3000` (your computer's WiFi IP)
- **Android Emulator**: `10.0.2.2:3000` (special emulator localhost)
- **iOS Simulator**: `localhost:3000`

## Quick Fix Steps

### 1. Verify Backend is Running
```bash
cd Yann-Website
npm run dev
```
Should see: `Network: http://192.168.1.11:3000`

### 2. Test from Browser on Your Phone
Open on your physical device's browser:
```
http://192.168.1.11:3000/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"...","environment":"development"}
```

### 3. Check Your Network IP
If the IP changed, update in `src/utils/constants.ts`:
```typescript
if (isDevice) {
  return '192.168.1.11'; // ← Update this if your IP changed
}
```

To find your current IP:
```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# The output shows your network IP (usually 192.168.x.x)
```

### 4. Use Debug Screen (Recommended)

Add this to your navigation to test connectivity:

**In `src/navigation/AppNavigator.tsx`:**
```typescript
import BackendDebugScreen from '../screens/debug/BackendDebugScreen';

// Add this screen temporarily to your stack:
<Stack.Screen 
  name="BackendDebug" 
  component={BackendDebugScreen}
  options={{ title: 'Backend Debug' }}
/>
```

Then navigate to it from your app to see live connection status.

## Common Issues & Solutions

### Issue 1: Firewall Blocking Port 3000
**Solution (macOS):**
```bash
# Allow port 3000
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Issue 2: Different WiFi Networks
- Ensure phone and computer are on **same WiFi network**
- Some corporate/guest WiFi blocks device-to-device communication

### Issue 3: IP Address Changed
- WiFi networks can assign different IPs
- Update the IP in `src/utils/constants.ts` (line 13)

### Issue 4: Port 3000 in Use
Check logs - Next.js may use port 3001 if 3000 is busy:
```bash
lsof -ti:3000
```
If using different port, update constants or kill the process.

## Verification Logs

When the app starts, check Metro/console logs for:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 BACKEND DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Device Type: Physical Device
📱 Platform: ios/android
🌐 Local URL: http://192.168.1.11:3000/api
🌐 Production URL: https://yann-care.vercel.app/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏓 Pinging: http://192.168.1.11:3000/health
✅ http://192.168.1.11:3000 - Status: 200
✅ SUCCESS: Connected to local backend
🔗 Using: http://192.168.1.11:3000/api
```

## Testing the Fix

1. **Start backend**: `cd Yann-Website && npm run dev`
2. **Start app**: `npx expo start`
3. **Open app on physical device**
4. **Check logs** - should see "✅ SUCCESS: Connected to local backend"
5. **Make a booking** - should hit local server (check backend logs)

## Still Not Working?

Try manual test:
```bash
# From your computer
curl http://192.168.1.11:3000/health

# Should return:
# {"status":"ok",...}
```

If this works but app doesn't connect, the issue is likely:
- App needs rebuild: `npx expo start --clear`
- iOS requires HTTPS for non-localhost (add exception in Info.plist if needed)
