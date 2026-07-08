import { createNavigationContainerRef } from '@react-navigation/native';

// Navigation ref for use outside of React components (e.g. from modals/services).
// Kept in its own file, separate from AppNavigator.tsx, so components that only
// need this ref (like GlobalPaymentModal) don't have to import AppNavigator
// itself - avoids a require cycle since AppNavigator renders those components.
export const navigationRef = createNavigationContainerRef();
