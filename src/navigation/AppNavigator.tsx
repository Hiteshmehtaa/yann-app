import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/theme';

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

// Home Screens
import { HomeScreen } from '../screens/home/HomeScreen';

// Booking Screens
import { ServiceDetailScreen } from '../screens/booking/ServiceDetailScreen';
import { BookingFormScreen } from '../screens/booking/BookingFormScreen';
import { BookingsListScreen } from '../screens/booking/BookingsListScreen';

// Profile Screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SavedAddressesScreen } from '../screens/profile/SavedAddressesScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { HelpSupportScreen } from '../screens/profile/HelpSupportScreen';
import { FavoritesScreen } from '../screens/profile/FavoritesScreen';
import { ChatScreen } from '../screens/profile/ChatScreen';

// Provider Screens
import { ProviderDashboardScreen } from '../screens/provider/ProviderDashboardScreen';
import { ProviderBookingsScreen } from '../screens/provider/ProviderBookingsScreen';
import { ProviderProfileScreen } from '../screens/provider/ProviderProfileScreen';
import { ProviderServicesScreen } from '../screens/provider/ProviderServicesScreen';
import { ProviderEarningsScreen } from '../screens/provider/ProviderEarningsScreen';

// Legal Screens
import { TermsConditionsScreen } from '../screens/legal/TermsConditionsScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { RefundPolicyScreen } from '../screens/legal/RefundPolicyScreen';
import { ProviderTermsScreen } from '../screens/legal/ProviderTermsScreen';
import { SafetyPolicyScreen } from '../screens/legal/SafetyPolicyScreen';

// Navigation Types
type RootStackParamList = {
  RoleSelection: undefined;
  Login: undefined;
  PartnerLogin: undefined;
  Signup: undefined;
  ProviderSignup: undefined;
  VerifyOTP: { email: string; isPartner?: boolean };
  MainTabs: undefined;
  ProviderTabs: undefined;
  ServiceDetail: { service: any };
  BookingForm: { service: any };
  // Provider screens
  ProviderProfile: undefined;
  ProviderServices: undefined;
  ProviderEarnings: undefined;
  // Homeowner profile screens
  EditProfile: undefined;
  SavedAddresses: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  // Legal screens
  Terms: undefined;
  Privacy: undefined;
  RefundPolicy: undefined;
  ProviderTerms: undefined;
  SafetyPolicy: undefined;
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
    color={focused ? THEME.accent : THEME.textMuted} 
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
  <TabIcon name={props.focused ? "wallet" : "wallet-outline"} focused={props.focused} />
);

// Homeowner/Customer Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: THEME.bg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: THEME.border,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 17,
          color: THEME.text,
          letterSpacing: 1,
        },
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
        component={ChatScreen}
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
      screenOptions={{
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: THEME.bg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: THEME.border,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 17,
          color: THEME.text,
          letterSpacing: 1,
        },
      }}
    >
      <Tab.Screen
        name="ProviderDashboard"
        component={ProviderDashboardScreen}
        options={{
          tabBarIcon: renderDashboardIcon,
          tabBarLabel: 'DASHBOARD',
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
        component={ChatScreen}
        options={{
          tabBarLabel: 'CHAT',
          tabBarIcon: renderChatIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ProviderProfile"
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

export function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  const isProvider = user?.role === 'provider';

  return (
    <NavigationContainer theme={PremiumTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: THEME.bg },
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        {isAuthenticated ? (
          <>
            {isProvider ? (
              <>
                <Stack.Screen name="ProviderTabs" component={ProviderTabNavigator} options={fadeTransitionConfig} />
                <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderServices" component={ProviderServicesScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderEarnings" component={ProviderEarningsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Terms" component={TermsConditionsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Privacy" component={PrivacyPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderTerms" component={ProviderTermsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="SafetyPolicy" component={SafetyPolicyScreen as any} options={screenTransitionConfig} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={TabNavigator} options={fadeTransitionConfig} />
                <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="BookingForm" component={BookingFormScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Notifications" component={NotificationsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Terms" component={TermsConditionsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="Privacy" component={PrivacyPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="ProviderTerms" component={ProviderTermsScreen as any} options={screenTransitionConfig} />
                <Stack.Screen name="SafetyPolicy" component={SafetyPolicyScreen as any} options={screenTransitionConfig} />
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
    </NavigationContainer>
  );
}
