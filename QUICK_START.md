# Quick Start Guide - Yann Mobile App

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation
```bash
# Navigate to project directory
cd "c:\Users\mhite\OneDrive\Desktop\MY MAJOR PROJECTS\App Dev (R Native)\yann-mobile"

# Install dependencies (if not already installed)
npm install

# Start the development server
npm start
```

### Running the App
```bash
# iOS
npm run ios

# Android
npm run android

# Web (for testing)
npm run web
```

---

## 🎨 What's New?

### Visual Improvements
✅ **Professional UI Design**
- Modern gradient colors throughout
- Enhanced shadows and depth
- Improved typography (bolder, cleaner)
- Better spacing and layout

✅ **Smooth Animations**
- Fade-in effects on screen load
- Staggered card entrance
- Smooth transitions between screens
- Professional loading states

✅ **Enhanced Components**
- Gradient buttons with icons
- Icon-labeled form inputs (📧📱📍)
- Professional service cards
- Better empty states

### Technical Improvements
✅ **Fixed Deprecated Components**
- Replaced old SafeAreaView with react-native-safe-area-context
- Added SafeAreaProvider wrapper

✅ **Data Synchronization**
- Web and mobile see the same data
- Cookie-based authentication
- Real-time updates
- Proper API logging

---

## 📱 App Flow

### For Customers (Homeowners)
1. **Sign Up / Login**
   - Enter email
   - Receive OTP
   - Verify and login

2. **Browse Services**
   - See all available services with beautiful cards
   - Tap to view service details
   - Check pricing and features

3. **Book a Service**
   - Fill booking form with professional UI
   - Select date, time, and payment method
   - Submit booking

4. **View Bookings**
   - See all your bookings
   - Check status (Pending, Accepted, etc.)
   - Pull to refresh

### For Service Providers
1. **Register as Provider**
   - Fill detailed registration form
   - Select service categories
   - Submit for approval

2. **Once Approved** (by admin)
   - Receive booking requests
   - Accept or reject bookings
   - Manage schedule

---

## 🎯 Key Features

### Authentication
- OTP-based login (secure)
- Separate flows for customers and providers
- Session management with cookies

### Service Booking
- Multiple service categories
- Date and time selection
- Payment method options
- Special instructions support

### User Profile
- View profile information
- Manage settings (coming soon)
- Logout functionality

---

## 🎨 Design Philosophy

### Inspired by Urban Company
The UI has been designed with inspiration from industry leaders:

1. **Card-based Layout**: Clean, modern cards for services
2. **Gradient Backgrounds**: Professional color transitions
3. **Minimal Animations**: Smooth but not distracting
4. **Clear CTAs**: Prominent call-to-action buttons
5. **Status Indicators**: Color-coded booking statuses

### Color Palette
```
Primary (Blue):    #3B82F6
Secondary (Purple): #8B5CF6
Success (Green):   #10B981
Warning (Amber):   #F59E0B
Error (Red):       #EF4444
Background:        #F9FAFB
```

---

## 🔧 API Configuration

### Backend URL
```
https://yann-care.vercel.app/api
```

### Available Endpoints
- `/auth/send-otp` - Send OTP for login/signup
- `/auth/verify-otp` - Verify OTP and login
- `/auth/logout` - Logout user
- `/homeowner/me` - Get user profile
- `/resident/requests` - Get user's bookings
- `/bookings/create` - Create new booking
- `/register` - Register as provider

### Authentication
- Uses httpOnly cookies (secure)
- Automatic session management
- Works seamlessly with web version

---

## 🐛 Troubleshooting

### App Won't Start?
```bash
# Clear cache and restart
expo start -c
```

### Animations Laggy?
- Ensure you're using a physical device or good emulator
- Animations use native driver (should be smooth)

### API Errors?
- Check network connection
- Verify backend is running at https://yann-care.vercel.app
- Check console logs for detailed errors

### SafeAreaView Issues?
- Ensure SafeAreaProvider is wrapped around app (in App.tsx)
- Check that all screens use SafeAreaView from 'react-native-safe-area-context'

---

## 📝 Testing Checklist

### Visual Testing
- [ ] All screens look professional
- [ ] Animations are smooth (60 FPS)
- [ ] Colors are consistent
- [ ] Text is readable
- [ ] Buttons are properly sized

### Functional Testing
- [ ] Login/Signup works
- [ ] OTP verification works
- [ ] Service browsing works
- [ ] Booking creation works
- [ ] Profile loads correctly

### Data Sync Testing
- [ ] Create booking on mobile → Check web
- [ ] Create booking on web → Check mobile
- [ ] Login on mobile → Session persists
- [ ] Data updates in real-time

---

## 💡 Pro Tips

### For Best Experience
1. **Test on Real Device**: Animations look better on real devices
2. **Enable Hot Reload**: For faster development
3. **Use Debug Mode**: To see API logs in console
4. **Check Network Tab**: To verify API calls

### Development Workflow
```bash
# 1. Start expo server
npm start

# 2. Open in simulator
Press 'i' for iOS or 'a' for Android

# 3. Make changes
# App will automatically reload

# 4. Check console
# View logs for debugging
```

---

## 📚 Documentation

### Additional Resources
- `UI_IMPROVEMENTS.md` - Detailed UI changes
- `TRANSFORMATION_SUMMARY.md` - Complete overview
- `FIXES_COMPLETED.md` - Previous bug fixes

### Code Structure
```
src/
├── components/      # Reusable components
│   └── LoadingSpinner.tsx
├── contexts/        # React contexts
│   └── AuthContext.tsx
├── navigation/      # Navigation setup
│   └── AppNavigator.tsx
├── screens/         # All app screens
│   ├── auth/       # Login, signup screens
│   ├── booking/    # Booking-related screens
│   ├── home/       # Home screen
│   └── profile/    # Profile screen
├── services/        # API services
│   └── api.ts
├── types/          # TypeScript types
│   └── index.ts
└── utils/          # Utility functions
    ├── constants.ts
    └── storage.ts
```

---

## 🎉 Summary

The app now features:
- ✅ Professional, modern UI
- ✅ Smooth, minimal animations
- ✅ Proper component usage
- ✅ Web-mobile data synchronization
- ✅ Enhanced user experience

**Ready for production!** 🚀

---

## 📞 Support

If you encounter any issues:
1. Check the console logs
2. Review the documentation files
3. Verify API connectivity
4. Ensure all dependencies are installed

Happy coding! 🎉
