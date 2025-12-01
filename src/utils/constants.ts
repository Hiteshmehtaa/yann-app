import Constants from 'expo-constants';

// API Configuration
export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://yann-care.vercel.app/api';

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
] as const;

// Services Data
export const SERVICES = [
  {
    id: 1,
    title: 'House Cleaning',
    description: 'Professional cleaning services for your home. Deep cleaning, regular maintenance, and more.',
    icon: '🏠',
    gradient: ['#3B82F6', '#06B6D4'],
    features: ['Deep Cleaning', 'Regular Maintenance', 'Move-in/Move-out'],
    price: 'Starting at ₹299',
    popular: true,
    category: 'cleaning',
  },
  {
    id: 2,
    title: 'Repairs & Maintenance',
    description: 'Expert technicians for all your repair needs. Plumbing, electrical, carpentry, and more.',
    icon: '🔧',
    gradient: ['#A855F7', '#EC4899'],
    features: ['Plumbing', 'Electrical', 'Carpentry'],
    price: 'Starting at ₹399',
    popular: false,
    category: 'maintenance',
  },
  {
    id: 3,
    title: 'Delivery Services',
    description: 'Fast and reliable delivery for packages, groceries, and more. Track in real-time.',
    icon: '🚚',
    gradient: ['#10B981', '#14B8A6'],
    features: ['Same-day Delivery', 'Package Tracking', 'Grocery Delivery'],
    price: 'Starting at ₹99',
    popular: false,
    category: 'delivery',
  },
  {
    id: 4,
    title: 'Pet Care',
    description: 'Loving care for your furry friends. Walking, grooming, sitting, and veterinary services.',
    icon: '🐾',
    gradient: ['#F97316', '#EF4444'],
    features: ['Dog Walking', 'Pet Grooming', 'Pet Sitting'],
    price: 'Starting at ₹129',
    popular: false,
    category: 'pet-care',
  },
  {
    id: 5,
    title: 'Personal Assistant',
    description: 'Your dedicated helper for errands, appointments, and daily tasks. Save time and stress.',
    icon: '👤',
    gradient: ['#6366F1', '#A855F7'],
    features: ['Errand Running', 'Appointment Scheduling', 'Personal Shopping'],
    price: 'Starting at ₹399',
    popular: false,
    category: 'assistant',
  },
  {
    id: 6,
    title: 'Garden & Landscaping',
    description: 'Transform your outdoor space. Lawn care, planting, design, and maintenance.',
    icon: '🌿',
    gradient: ['#059669', '#84CC16'],
    features: ['Lawn Care', 'Garden Design', 'Tree Trimming'],
    price: 'Starting at ₹299',
    popular: false,
    category: 'garden',
  },
  {
    id: 7,
    title: 'Full-Day Personal Driver',
    description: 'Hire a background-verified driver for full-day commutes, airport drops, or VIP errands.',
    icon: '🚗',
    gradient: ['#0891B2', '#3B82F6'],
    features: ['Full-day Service', 'Hourly Pricing', 'Overtime Available'],
    price: 'Starting at ₹1,500',
    popular: true,
    category: 'driver',
  },
  {
    id: 8,
    title: 'Pujari Services',
    description: 'Professional pujari for religious ceremonies and rituals at your home.',
    icon: '🙏',
    gradient: ['#F59E0B', '#EF4444'],
    features: ['Home Puja', 'Religious Ceremonies', 'Festival Rituals'],
    price: 'Starting at ₹501',
    popular: false,
    category: 'pujari',
  },
];

// Payment Methods
export const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash', icon: '💵' },
  { label: 'UPI', value: 'upi', icon: '📱' },
  { label: 'Card', value: 'card', icon: '💳' },
  { label: 'Online', value: 'online', icon: '🌐' },
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
