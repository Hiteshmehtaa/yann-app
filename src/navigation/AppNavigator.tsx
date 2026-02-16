import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/theme';
import { FloatingTabBar } from '../components/ui/FloatingTabBar';
import { TopBar } from '../components/ui/TopBar';

// Create navigation ref for use outside of components
export const navigationRef = createNavigationContainerRef();

// Screen transition configuration
const screenTransitionConfig = {
  animation: 'slide_from_right' as const,
  animationDuration: 300,
};

const fadeTransitionConfig = {
  animation: 'fade' as const,
  animationDuration: 200,
};

// Auth Screens
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { PartnerLoginScreen } from '../screens/auth/PartnerLoginScreen';
import { VerifyOTPScreen } from '../screens/auth/VerifyOTPScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ProviderSignupScreen } from '../screens/auth/ProviderSignupScreen';

// Common Screens
import { ComingSoonScreen } from '../screens/common/ComingSoonScreen';

// Home Screens
import { HomeScreen } from '../screens/home/HomeScreen';

// Booking Screens
import { ServiceDetailScreen } from '../screens/booking/ServiceDetailScreen';
import { BookingsListScreen } from '../screens/booking/BookingsListScreen';
import { BookingDetailScreen } from '../screens/booking/BookingDetailScreen';
import { BookingFormScreen } from '../screens/booking/BookingFormScreen';
import { BookingWaitingScreen } from '../screens/booking/BookingWaitingScreen';
import { ProviderPublicProfileScreen } from '../screens/booking/ProviderPublicProfileScreen';
import { DriverBookingScreen } from '../screens/booking/DriverBookingScreen';
import { DriverSearchResultsScreen } from '../screens/booking/DriverSearchResultsScreen';
import { DriverBookingFormScreen } from '../screens/booking/DriverBookingFormScreen';

// Profile Screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SavedAddressesScreen } from '../screens/profile/SavedAddressesScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { NotificationsListScreen } from '../screens/profile/NotificationsListScreen';
import { HelpSupportScreen } from '../screens/profile/HelpSupportScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { ChatScreen } from '../screens/profile/ChatScreen';
import { LanguageSettingsScreen } from '../screens/settings/LanguageSettingsScreen';

// Provider Screens
import { ProviderDashboardScreen } from '../screens/provider/ProviderDashboardScreen';
import { ProviderBookingsScreen } from '../screens/provider/ProviderBookingsScreen';
import { ProviderProfileScreen } from '../screens/provider/ProviderProfileScreen';
import { ProviderServicesScreen } from '../screens/provider/ProviderServicesScreen';
import { ProviderEarningsScreen } from '../screens/provider/ProviderEarningsScreen';
import { BankDetailsScreen } from '../screens/provider/BankDetailsScreen';
import { ProviderChatScreen } from '../screens/provider/ProviderChatScreen';
import { AadhaarVerificationScreen } from '../screens/auth/AadhaarVerificationScreen';

// Legal Screens
import { TermsConditionsScreen } from '../screens/legal/TermsConditionsScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { RefundPolicyScreen } from '../screens/legal/RefundPolicyScreen';
import { ProviderTermsScreen } from '../screens/legal/ProviderTermsScreen';
import { SafetyPolicyScreen } from '../screens/legal/SafetyPolicyScreen';

// Admin Screens
import { AdminPushNotificationScreen } from '../screens/admin/AdminPushNotificationScreen';

// Global Components
import { GlobalPaymentModal } from '../components/GlobalPaymentModal';
import { GlobalBookingRequestModal } from '../components/GlobalBookingRequestModal';

// Navigation Types
type RootStackParamList = {
  RoleSelection: undefined;
  Login: undefined;
  PartnerLogin: undefined;
  Signup: undefined;
  ProviderSignup: undefined;
  VerifyOTP: { email: string; isPartner?: boolean };
  MainTabs: { screen?: string; params?: any } | undefined;
  ProviderTabs: { screen?: string; params?: any } | undefined;
  ServiceDetail: { service: any };
  BookingForm: { service: any; selectedProvider?: any; selectedAddress?: any };
  DriverBooking: { service: any; selectedProvider: any; selectedAddress?: any };
  DriverSearchResults: { service: any; tripType: string; tripDirection: string; vehicleType: string; transmission: string; pickupAddress: string; dropAddress: string; pickupCoords: any; dropCoords: any; routeDistanceKm: number; driverReturnFare: number };
  DriverBookingForm: { service: any; selectedDriver: any; tripType: string; tripDirection: string; vehicleType: string; transmission: string; pickupAddress: string; dropAddress: string; pickupCoords: any; dropCoords: any; routeDistanceKm: number; driverReturnFare: number; driverRate: number };
  BookingWaiting: { bookingId: string; providerId: string; providerName: string; serviceName: string; experienceRange?: any };
  ProviderPublicProfile: { provider: any; service?: any };
  // Provider screens
  ProviderEditProfile: undefined;
  ProviderServices: undefined;
  ProviderEarnings: undefined;
  BankDetails: undefined;
  // Homeowner profile screens
  EditProfile: undefined;
  SavedAddresses: { fromBooking?: boolean } | undefined;
  Notifications: undefined;
  NotificationsList: undefined;
  HelpSupport: undefined;
  Wallet: undefined;
  // Legal screens
  Terms: undefined;
  Privacy: undefined;
  RefundPolicy: undefined;
  ProviderTerms: undefined;
  SafetyPolicy: undefined;
  AadhaarVerification: undefined;
  LanguageSettings: undefined;
  BookingsList: undefined;
  BookingDetail: { booking: any };
  Favorites: undefined;
  AdminPush: undefined;
};

// Premium Apple-like Theme - Using new design system
const THEME = {
  bg: COLORS.background,
  bgCard: COLORS.cardBg,
  primary: COLORS.primary,
  secondary: COLORS.accentOrange,
  accent: COLORS.primary,
  text: COLORS.text,
  textMuted: COLORS.textSecondary,
  border: COLORS.border,
  shadow: 'rgba(79, 70, 229, 0.08)',
};

const PremiumTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.cardBg,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Custom tab bar icon
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <Ionicons
    name={name as any}
    size={24}
    color={focused ? '#FFF' : COLORS.textSecondary} // Update color to be White when focused (for the Neo pill) and Gray when inactive
  />
);

// Tab icon render functions (extracted to avoid inline component definitions)
const renderHomeIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "home" : "home-outline"} focused={props.focused} />
);

const renderBookingsIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "clipboard" : "clipboard-outline"} focused={props.focused} />
);

const renderProfileIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "person" : "person-outline"} focused={props.focused} />
);

const renderFavoritesIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "heart" : "heart-outline"} focused={props.focused} />
);

const renderChatIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "chatbubbles" : "chatbubbles-outline"} focused={props.focused} />
);

const renderDashboardIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "stats-chart" : "stats-chart-outline"} focused={props.focused} />
);

const renderEarningsIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "cash" : "cash-outline"} focused={props.focused} />
);

// Homeowner/Customer Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: (props) => <TopBar {...props} glass showLogo title={props.options.title || props.route.name} />, // Use new Glass TopBar globally for tabs
        tabBarShowLabel: false, // Hide labels for clean look
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: renderHomeIcon,
          tabBarLabel: 'HOME',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="BookingsList"
        component={BookingsListScreen}
        options={{
          tabBarLabel: 'BOOKINGS',
          tabBarIcon: renderBookingsIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'FAVORITES',
          tabBarIcon: renderFavoritesIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ComingSoonScreen}
        options={{
          tabBarLabel: 'CHAT',
          tabBarIcon: renderChatIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: renderProfileIcon,
          tabBarLabel: 'PROFILE',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Provider Tab Navigator
function ProviderTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: (props) => <TopBar {...props} glass showLogo title={props.options.title || props.route.name} />,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="ProviderDashboard"
        component={ProviderDashboardScreen}
        options={{
          tabBarIcon: renderHomeIcon, // Using Home icon for Dashboard as requested (Home)
          tabBarLabel: 'HOME',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ProviderBookings"
        component={ProviderBookingsScreen}
        options={{
          tabBarLabel: 'BOOKINGS',
          tabBarIcon: renderBookingsIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ProviderChat"
        component={ProviderChatScreen}
        options={{
          tabBarLabel: 'CHAT',
          tabBarIcon: renderChatIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ProviderEarnings"
        component={ProviderEarningsScreen}
        options={{
          tabBarLabel: 'EARNINGS',
          tabBarIcon: renderEarningsIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ProviderProfile"
        component={ProviderProfileScreen}
        options={{
          tabBarIcon: renderProfileIcon,
          tabBarLabel: 'PROFILE',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

const linking = {
  prefixes: [Linking.createURL('/'), 'yann://', 'https://yann.app', 'https://www.yann.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Profile: 'verification-success',
          Home: {
            screens: {
              ProviderPublicProfile: 'provider/:providerId',
            },
          },
        },
      },
      ProviderTabs: {
        screens: {
          ProviderProfile: 'verification-success',
        },
      },
      ProviderPublicProfile: 'provider/:providerId',
    },
  },
};

export function AppNavigator() {
  const { isAuthenticated, isLoading, user, isGuest } = useAuth();

  if (isLoading) {
    return null;
  }

  const isProvider = user?.role === 'provider';

  return (
    <NavigationContainer ref={navigationRef} theme={PremiumTheme} linking={linking as any}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: THEME.bg },
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        {isAuthenticated || isGuest ? (
          <>
            {isProvider ? (
              <>
                <Stack.Screen name="ProviderTabs" component={ProviderTabNavigator} options={fadeTransitionConfig} />
                <Stack.Screen name="ProviderEditProfile" component={EditProfileScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderServices" component={ProviderServicesScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderEarnings" component={ProviderEarningsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="BankDetails" component={BankDetailsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Wallet" component={WalletScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Notifications" component={NotificationsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="NotificationsList" component={NotificationsListScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Terms" component={TermsConditionsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Privacy" component={PrivacyPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderTerms" component={ProviderTermsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="SafetyPolicy" component={SafetyPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="AadhaarVerification" component={AadhaarVerificationScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="AdminPush" component={AdminPushNotificationScreen as any} options={screenTransitionConfig} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={TabNavigator} options={fadeTransitionConfig} />
                <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderPublicProfile" component={ProviderPublicProfileScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="BookingsList" component={BookingsListScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="BookingDetail" component={BookingDetailScreen as any} options={screenTransitionConfig} />

                <Stack.Screen name="BookingForm" component={BookingFormScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="DriverBooking" component={DriverBookingScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="DriverSearchResults" component={DriverSearchResultsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="DriverBookingForm" component={DriverBookingFormScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="BookingWaiting" component={BookingWaitingScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Wallet" component={WalletScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Notifications" component={NotificationsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="NotificationsList" component={NotificationsListScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Terms" component={TermsConditionsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Privacy" component={PrivacyPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderTerms" component={ProviderTermsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="SafetyPolicy" component={SafetyPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="AadhaarVerification" component={AadhaarVerificationScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Favorites" component={FavoritesScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="AdminPush" component={AdminPushNotificationScreen as any} options={screenTransitionConfig} />
              </>
            )}
          </>
        ) : (
          <>
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={fadeTransitionConfig} />
            <Stack.Screen name="Login" component={LoginScreen} options={screenTransitionConfig} />
            <Stack.Screen name="PartnerLogin" component={PartnerLoginScreen} options={screenTransitionConfig} />
            <Stack.Screen name="Signup" component={SignupScreen as any} options={screenTransitionConfig} />
            <Stack.Screen name="ProviderSignup" component={ProviderSignupScreen} options={screenTransitionConfig} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen as any} options={screenTransitionConfig} />
          </>
        )}
      </Stack.Navigator>

      {/* Global Payment Modal - Shows automatically when job is completed */}
      {isAuthenticated && !isProvider && <GlobalPaymentModal />}

      {/* Global Booking Request Modal - Shows for providers when new booking request arrives */}
      {isAuthenticated && isProvider && <GlobalBookingRequestModal />}
    </NavigationContainer>
  );
}
