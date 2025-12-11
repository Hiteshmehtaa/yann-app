# 🎨 Animation Implementation Guide

## Overview
This document outlines all Lottie animations and micro-interactions implemented in the Yann Care mobile app.

---

## 📦 Lottie Animations

### 1. Loading Animation (`loading.json`)
**Location:** `assets/lottie/loading.json`  
**Used in:**
- `LoadingSpinner` component - Global loading indicator
- All screens during data fetching
- API calls and async operations

**Implementation:**
```tsx
<LoadingSpinner visible={isLoading} />
```

---

### 2. Success Animation (`Jumping-Lottie-Animation.json`)
**Location:** `assets/lottie/Jumping-Lottie-Animation.json`  
**Used in:**
- `BookingSuccessModal` - Booking confirmation
- Success states after form submissions

**Features:**
- Plays once (loop=false)
- Auto-redirects after completion (~1.27s)
- Blur backdrop with message

---

### 3. Empty Cart Animation (`empty cart.json`)
**Location:** `assets/lottie/empty cart.json`  
**Used in:**
- `EmptyState` component
- BookingsListScreen - No bookings
- ProviderBookingsScreen - No bookings
- FavoritesScreen - No favorites
- Empty search results

**Implementation:**
```tsx
<EmptyState
  title="No bookings yet"
  subtitle="Your bookings will appear here"
/>
```

---

### 4. Error Animation (`error.json`)
**Location:** `assets/lottie/error.json`  
**Used in:**
- `ErrorModal` component
- API error responses
- Form validation errors
- Network failures (non-connection issues)

**Implementation:**
```tsx
<ErrorModal
  visible={showError}
  title="Oops!"
  message="Something went wrong"
  onClose={() => setShowError(false)}
/>
```

---

### 5. Connection Lost Animation (`Connection-Lost-Animation.json`)
**Location:** `assets/lottie/Connection-Lost-Animation.json`  
**Used in:**
- `OfflineIndicator` - Network status banner
- ProviderBookingsScreen - Error banner
- Network connectivity issues

**Implementation:**
```tsx
<OfflineIndicator />
```

---

### 6. Email Sent Animation (`Email-Sent.json`)
**Location:** `assets/lottie/Email-Sent.json`  
**Used in:**
- `VerifyOTPScreen` - OTP sent confirmation
- Email verification screens
- Password reset confirmation

**Features:**
- Plays once on screen load
- Visual feedback for email sent
- 150x150px size

---

### 7. Map Location Picker Animation (`map-location-picker.json`)
**Location:** `assets/lottie/map-location-picker.json`  
**Planned for:**
- `MapLocationPicker` component
- Address selection screens
- Location-based services

---

### 8. Welcome Animation (`Campers-Welcome.json`)
**Location:** `assets/lottie/Campers-Welcome.json`  
**Planned for:**
- Onboarding screens
- First-time user experience
- Welcome screens

---

## 🎯 Micro-Interactions

### 1. Button Press Effect
**Component:** `AnimatedButton`  
**Location:** `src/components/AnimatedButton.tsx`

**Features:**
- Scale animation on press (1 → 0.95 → 1)
- Spring physics (bouncy feel)
- Works with any button style

**Usage:**
```tsx
<AnimatedButton
  style={styles.button}
  onPress={handlePress}
>
  <Text>Click me</Text>
</AnimatedButton>
```

**Used in:**
- BookingFormScreen - Confirm Booking button
- BookingsListScreen - Browse Services button
- VerifyOTPScreen - Verify button
- All primary CTAs throughout app

---

### 2. Card Selection Effect
**Component:** `AnimatedCard`  
**Location:** `src/components/AnimatedCard.tsx`

**Features:**
- Glow effect on selection (border color animation)
- Subtle scale on press (1 → 0.98 → 1)
- Customizable glow color
- Elevated shadow when selected

**Usage:**
```tsx
<AnimatedCard
  isSelected={selectedId === item.id}
  glowColor={COLORS.primary}
  onPress={() => setSelectedId(item.id)}
>
  <Text>{item.name}</Text>
</AnimatedCard>
```

**Used in:**
- HomeScreen - Category tags
- Service selection cards
- Address cards
- Payment method selection

---

### 3. Screen Transitions
**Location:** `src/navigation/AppNavigator.tsx`

**Configurations:**
1. **Fade Transition** (`fadeTransitionConfig`)
   - Duration: 200ms
   - Used for: Tab navigators, main screens
   - Effect: Smooth fade in/out

2. **Slide Transition** (`screenTransitionConfig`)
   - Duration: 300ms
   - Direction: Right to left
   - Used for: Detail screens, forms, sub-screens
   - Effect: Smooth slide animation

**Implementation:**
```tsx
<Stack.Screen
  name="ServiceDetail"
  component={ServiceDetailScreen}
  options={screenTransitionConfig}
/>
```

---

## 🎬 Animation Flow Examples

### Booking Confirmation Flow
```
User clicks "Confirm Booking"
    ↓
LoadingSpinner appears (loading.json)
    ↓
API call completes
    ↓
BookingSuccessModal shows (Jumping-Lottie-Animation.json)
    ↓
Animation completes (~1.27s)
    ↓
Navigate to BookingsList
```

### Empty State Flow
```
Screen loads
    ↓
Check if data exists
    ↓
No data found
    ↓
EmptyState component shows (empty cart.json)
    ↓
User clicks "Browse Services" (AnimatedButton)
    ↓
Navigate to Home
```

### Network Error Flow
```
Network disconnects
    ↓
OfflineIndicator appears (Connection-Lost-Animation.json)
    ↓
Banner shows at top of screen
    ↓
Network reconnects
    ↓
Banner disappears
```

---

## 📱 Performance Optimization

### Best Practices
1. **Native Driver Usage**
   - All transform animations use `useNativeDriver: true`
   - Non-transform properties use `useNativeDriver: false`

2. **Loop Control**
   - Loading animations: `loop={true}`
   - Success/Error: `loop={false}`
   - Background effects: `loop={true}`

3. **Animation Sizes**
   - Loading: 150x150px
   - Success: 120x120px
   - Empty State: 250x250px
   - Icons: 24x24px, 32x32px

4. **Memory Management**
   - Animations cleanup on unmount
   - Conditional rendering (only when visible)
   - Lazy loading for large animations

---

## 🚀 Usage Guidelines

### When to Use Animations

✅ **DO USE:**
- Loading states (API calls, data fetching)
- Success confirmations (booking created, payment success)
- Empty states (no data, no results)
- Error feedback (form errors, API errors)
- Button interactions (press, hover)
- Card selections (active state)
- Screen transitions (navigation)

❌ **DON'T OVERUSE:**
- Static content
- Text-only screens
- Fast repeated actions
- Background processes

### Animation Duration Guidelines
- **Micro-interactions:** 200-300ms
- **Loading states:** Continuous loop
- **Success/Error:** 1-2 seconds
- **Screen transitions:** 200-300ms

---

## 🔧 Troubleshooting

### Common Issues

1. **Animation not playing**
   - Check file path is correct
   - Verify `autoPlay={true}`
   - Ensure component is mounted

2. **Performance issues**
   - Reduce animation size
   - Use `loop={false}` when appropriate
   - Check `useNativeDriver` usage

3. **Timing issues**
   - Adjust `speed` prop (0.5 = slower, 2 = faster)
   - Use `onAnimationFinish` callback
   - Check animation file duration

---

## 📚 Component Reference

### Core Animation Components
- `LoadingSpinner` - Global loading with blur
- `EmptyState` - Empty state with animation
- `ErrorModal` - Error feedback with animation
- `AnimatedButton` - Button with press effect
- `AnimatedCard` - Card with selection glow
- `BookingSuccessModal` - Success animation modal
- `OfflineIndicator` - Network status with animation

### Animation Exports
All animation components can be imported from:
```tsx
import {
  LoadingSpinner,
  EmptyState,
  ErrorModal,
  AnimatedButton,
  AnimatedCard,
} from '../components';
```

---

## 🎨 Design System Integration

All animations follow the app's design system:
- **Colors:** COLORS.primary, COLORS.error, COLORS.success
- **Spacing:** SPACING.sm, SPACING.md, SPACING.lg
- **Radius:** RADIUS.sm (8px), RADIUS.md (12px), RADIUS.lg (16px)
- **Shadows:** SHADOWS.small, SHADOWS.medium, SHADOWS.large

---

## 📝 Next Steps

### Planned Integrations
1. Map location picker animation in MapLocationPicker component
2. Welcome animation for onboarding flow
3. Pull-to-refresh custom animation
4. Swipe gesture animations for booking cards
5. Parallax effects for service detail screens

### Future Enhancements
1. Custom Lottie animations for specific services
2. Seasonal/holiday themed animations
3. User preference for reduced motion
4. Animation preloading for faster performance

---

**Last Updated:** ${new Date().toLocaleDateString()}  
**Version:** 1.0.0  
**Maintainer:** Yann Care Development Team
