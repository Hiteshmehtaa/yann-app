# Rive Animations Integration

This directory contains Rive animation components for the Yann Mobile app.

## Components

### 1. **RiveAnimation** (Base Component)
Generic wrapper for Rive animations with customizable properties.

```tsx
<RiveAnimation
  animationUrl="https://..."
  autoplay={true}
  loop={true}
/>
```

### 2. **SuccessAnimation**
Checkmark success animation for confirmations.

```tsx
<SuccessAnimation 
  size={200} 
  onComplete={() => console.log('Animation done!')}
/>
```

**Used in:**
- Booking confirmation modal
- Payment success screens

### 3. **LoadingAnimation**
Smooth loading animation replacing ActivityIndicator.

```tsx
<LoadingAnimation size={100} />
```

**Used in:**
- LoadingSpinner component
- Form submissions
- Data fetching states

### 4. **EmptyStateAnimation**
Context-aware empty state animations.

```tsx
<EmptyStateAnimation 
  type="no-bookings" 
  size={220} 
/>
```

**Types:**
- `no-data`: General empty state
- `no-search`: Search with no results
- `no-bookings`: No bookings available

**Used in:**
- BookingsListScreen
- Search results
- Profile sections

### 5. **HeartAnimation**
Interactive heart/like animation.

```tsx
<HeartAnimation size={80} />
```

**Used in:**
- AnimatedFavoriteButton
- Service favoriting
- Provider likes

## Additional Animation Components

### **ButtonRippleAnimation**
Ripple effect for buttons to draw attention.

```tsx
<ButtonRippleAnimation 
  size={100}
  color="#3B82F6"
  duration={2000}
/>
```

### **AnimatedFavoriteButton**
Complete favorite button with integrated heart animation.

```tsx
<AnimatedFavoriteButton
  isFavorite={isFavorite}
  onToggle={() => setIsFavorite(!isFavorite)}
  size={40}
/>
```

## Features

✅ **Smooth Animations**: Professional Rive animations from the community
✅ **Performance Optimized**: Native rendering for 60fps animations
✅ **Customizable**: Size, colors, and behavior can be adjusted
✅ **Interactive**: State machines for user interactions
✅ **Reusable**: Modular components for easy integration

## Rive Animation Sources

All animations are sourced from the public Rive community:
- https://rive.app/community

## Usage Examples

### Success Modal with Animation
```tsx
<SuccessModal
  visible={showSuccess}
  title="Booking Confirmed! 🎉"
  message="Your service has been booked successfully."
  onClose={() => setShowSuccess(false)}
/>
```

### Loading Spinner with Animation
```tsx
<LoadingSpinner visible={isLoading} size="large" />
```

### Empty State in List
```tsx
<FlatList
  data={items}
  ListEmptyComponent={() => (
    <View style={styles.empty}>
      <EmptyStateAnimation type="no-data" size={200} />
      <Text>No items found</Text>
    </View>
  )}
/>
```

## Integration Notes

1. **Rive Package**: Uses `rive-react-native` package
2. **Performance**: Animations run on native thread
3. **File Size**: Animations are streamed from CDN
4. **Offline**: Consider caching for offline use
5. **Accessibility**: Animations respect reduced motion settings

## Future Enhancements

- [ ] Local .riv file support
- [ ] Custom state machine interactions
- [ ] Animation preloading
- [ ] Gesture-driven animations
- [ ] Dark mode variants
