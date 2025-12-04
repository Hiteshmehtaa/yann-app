import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

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

// Premium Apple-like Theme
const THEME = {
  bg: '#FFFFFF',
  bgCard: '#F8F9FB',
  primary: '#2E59F3',
  secondary: '#FF7A32',
  accent: '#2E59F3',
  text: '#1A1D29',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  shadow: 'rgba(46, 89, 243, 0.08)',
};

const PremiumTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8F9FB',
    card: THEME.bg,
    text: THEME.text,
    border: THEME.border,
    primary: THEME.primary,
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Custom tab bar icon with label
const TabIcon = ({ name, focused, label }: { name: string; focused: boolean; label: string }) => (
  <View style={tabStyles.iconContainer}>
    <View style={[tabStyles.iconWrapper, focused && tabStyles.iconWrapperActive]}>
      <Ionicons 
        name={name as any} 
        size={22} 
        color={focused ? THEME.accent : THEME.textMuted} 
      />
    </View>
  </View>
);

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(46, 89, 243, 0.12)',
  },
});

// Tab icon render functions (extracted to avoid inline component definitions)
const renderHomeIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "grid" : "grid-outline"} focused={props.focused} label="HOME" />
);

const renderBookingsIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "calendar" : "calendar-outline"} focused={props.focused} label="BOOKINGS" />
);

const renderProfileIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "person" : "person-outline"} focused={props.focused} label="PROFILE" />
);

const renderDashboardIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "stats-chart" : "stats-chart-outline"} focused={props.focused} label="DASHBOARD" />
);

const renderEarningsIcon = (props: { focused: boolean }) => (
  <TabIcon name={props.focused ? "wallet" : "wallet-outline"} focused={props.focused} label="EARNINGS" />
);

// Homeowner/Customer Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: THEME.bg,
          borderTopWidth: 0,
          // Floating style with margin from edges
          marginHorizontal: 16,
          marginBottom: Platform.OS === 'ios' ? 20 : 12,
          height: Platform.OS === 'ios' ? 68 : 64,
          borderRadius: 20,
          paddingBottom: 8,
          paddingTop: 8,
          // Premium shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 15,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 4,
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
          headerTitle: 'BOOKINGS',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: renderProfileIcon,
          tabBarLabel: 'PROFILE',
          headerTitle: 'PROFILE',
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
        tabBarInactiveTintColor: THEME.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: THEME.bg,
          borderTopWidth: 0,
          marginHorizontal: 16,
          marginBottom: Platform.OS === 'ios' ? 20 : 12,
          height: Platform.OS === 'ios' ? 68 : 64,
          borderRadius: 20,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 15,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 4,
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
          headerTitle: 'MY BOOKINGS',
        }}
      />
      <Tab.Screen
        name="ProviderProfile"
        component={ProfileScreen}
        options={{
          tabBarIcon: renderProfileIcon,
          tabBarLabel: 'PROFILE',
          headerTitle: 'MY PROFILE',
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
        }}
      >
        {isAuthenticated ? (
          <>
            {isProvider ? (
              <>
                <Stack.Screen name="ProviderTabs" component={ProviderTabNavigator} />
                <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen as any} />
                <Stack.Screen name="ProviderServices" component={ProviderServicesScreen as any} />
                <Stack.Screen name="ProviderEarnings" component={ProviderEarningsScreen as any} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen as any} />
                <Stack.Screen name="Terms" component={TermsConditionsScreen as any} />
                <Stack.Screen name="Privacy" component={PrivacyPolicyScreen as any} />
                <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen as any} />
                <Stack.Screen name="ProviderTerms" component={ProviderTermsScreen as any} />
                <Stack.Screen name="SafetyPolicy" component={SafetyPolicyScreen as any} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen as any} />
                <Stack.Screen name="BookingForm" component={BookingFormScreen as any} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen as any} />
                <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen as any} />
                <Stack.Screen name="Notifications" component={NotificationsScreen as any} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen as any} />
                <Stack.Screen name="Terms" component={TermsConditionsScreen as any} />
                <Stack.Screen name="Privacy" component={PrivacyPolicyScreen as any} />
                <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen as any} />
                <Stack.Screen name="ProviderTerms" component={ProviderTermsScreen as any} />
                <Stack.Screen name="SafetyPolicy" component={SafetyPolicyScreen as any} />
              </>
            )}
          </>
        ) : (
          <>
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="PartnerLogin" component={PartnerLoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen as any} />
            <Stack.Screen name="ProviderSignup" component={ProviderSignupScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen as any} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
