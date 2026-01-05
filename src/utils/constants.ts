import Constants from 'expo-constants';

// API Configuration
// For local development: Use your machine's IP address (find it with `ipconfig getifaddr en0` on Mac)
// The mobile app needs your computer's IP, not localhost, to connect from the device
const USE_LOCAL_BACKEND = true; // Set to false to use production Vercel backend
const LOCAL_API_URL = 'http://192.168.1.10:3000/api'; // Update this IP to match your machine's IP
const PRODUCTION_API_URL = 'https://yann-care.vercel.app/api';

export const API_BASE_URL = USE_LOCAL_BACKEND
  ? LOCAL_API_URL
  : (Constants.expoConfig?.extra?.apiUrl || PRODUCTION_API_URL);

// Static Services - Yannhome Platform Categories
export const SERVICES = [
  {
    id: 1,
    title: 'Drivers',
    description: 'Professional drivers for your transportation needs',
    category: 'driver',
    price: 'Varies',
    icon: '🚗',
    popular: true,
    features: ['Licensed drivers', 'Flexible hours', 'Background verified'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 2,
    title: 'Pujari',
    description: 'Experienced pujaris for religious ceremonies',
    category: 'pujari',
    price: 'Varies',
    icon: '🙏',
    popular: true,
    features: ['Experienced pujaris', 'All rituals', 'Timely service'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 3,
    title: 'Maids',
    description: 'Reliable maids for household cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: '🧹',
    popular: true,
    features: ['Daily cleaning', 'Background verified', 'Flexible timing'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 4,
    title: 'Baby Sitters',
    description: 'Trusted baby sitters for childcare',
    category: 'childcare',
    price: 'Varies',
    icon: '👶',
    popular: true,
    features: ['Experienced caregivers', 'Background verified', 'Day/night shifts'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 5,
    title: 'Nurses',
    description: 'Qualified nurses for healthcare needs',
    category: 'healthcare',
    price: 'Varies',
    icon: '👩‍⚕️',
    popular: true,
    features: ['Certified nurses', '24/7 available', 'Emergency care'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 6,
    title: 'Attendants',
    description: 'Dedicated attendants for elderly and patient care',
    category: 'healthcare',
    price: 'Varies',
    icon: '🤝',
    features: ['Patient care', 'Elderly support', 'Day/night shifts'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 7,
    title: 'Cleaners',
    description: 'Professional cleaners for deep cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: '🧽',
    features: ['Deep cleaning', 'All surfaces', 'Eco-friendly products'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 8,
    title: 'Office Boys',
    description: 'Office support staff for various tasks',
    category: 'assistant',
    price: 'Varies',
    icon: '👔',
    features: ['Office tasks', 'Document handling', 'Reliable'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 9,
    title: 'Chaprasi',
    description: 'Chaprasi for office and residential support',
    category: 'assistant',
    price: 'Varies',
    icon: '🏢',
    features: ['Multi-task support', 'Document delivery', 'Office maintenance'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 10,
    title: 'Heena Artists',
    description: 'Skilled heena artists for events and occasions',
    category: 'specialty',
    price: 'Varies',
    icon: '🎨',
    features: ['Bridal heena', 'Modern designs', 'Natural heena'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 11,
    title: 'AC Service Technicians',
    description: 'Expert AC repair and maintenance',
    category: 'maintenance',
    price: 'Varies',
    icon: '❄️',
    features: ['All AC brands', 'Installation & repair', 'Maintenance'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 12,
    title: 'RO Service Technicians',
    description: 'RO water purifier service and repair',
    category: 'maintenance',
    price: 'Varies',
    icon: '💧',
    features: ['All RO brands', 'Installation & repair', 'Filter replacement'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 13,
    title: 'Refrigerator Service Technicians',
    description: 'Refrigerator repair and maintenance',
    category: 'maintenance',
    price: 'Varies',
    icon: '🧊',
    features: ['All brands', 'Gas refilling', 'Cooling issues'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 14,
    title: 'Air Purifier Service Technicians',
    description: 'Air purifier servicing and filter replacement',
    category: 'maintenance',
    price: 'Varies',
    icon: '🌬️',
    features: ['All brands', 'Filter replacement', 'Deep cleaning'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 15,
    title: 'Toilet Cleaning Experts',
    description: 'Specialized toilet and bathroom cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: '🚽',
    features: ['Deep cleaning', 'Sanitization', 'Odor removal'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 16,
    title: 'Chimney Service Technicians',
    description: 'Kitchen chimney cleaning and repair',
    category: 'maintenance',
    price: 'Varies',
    icon: '🔥',
    features: ['All brands', 'Deep cleaning', 'Motor repair'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
  {
    id: 17,
    title: 'Security Guards',
    description: 'Professional security guards for your safety',
    category: 'security',
    price: 'Varies',
    icon: '🛡️',
    features: ['Trained guards', '24/7 shifts', 'Background verified'],
    profileRequirements: ['Photo', 'Name', 'Aadhaar'],
  },
];

// Service Categories
export const SERVICE_CATEGORIES = [
  'cleaning',
  'deep-clean',
  'bathroom',
  'kitchen',
  'laundry',
  'carpet',
  'window',
  'move',
  'pujari',
  'specialty',
  'driver',
  'general',
  'maintenance',
  'delivery',
  'pet-care',
  'assistant',
  'garden',
  'childcare',
  'healthcare',
  'security',
] as const;

// Payment Methods (using valid Ionicons names)
export const PAYMENT_METHODS = [
  { id: 'wallet', label: 'Yann Wallet', value: 'wallet', icon: 'wallet-outline' },
  { id: 'cash', label: 'Cash', value: 'cash', icon: 'cash-outline' },
  { id: 'upi', label: 'UPI', value: 'upi', icon: 'phone-portrait-outline' },
  { id: 'card', label: 'Card', value: 'card', icon: 'card-outline' },
  { id: 'online', label: 'Online', value: 'online', icon: 'globe-outline' },
];

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Status Colors
export const STATUS_COLORS = {
  pending: '#F59E0B',
  accepted: '#10B981',
  rejected: '#EF4444',
  completed: '#06B6D4',
  cancelled: '#6B7280',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  EMAIL: 'email',
} as const;
