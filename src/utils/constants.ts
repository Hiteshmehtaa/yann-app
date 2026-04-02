import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { COLORS } from './theme';

// API Configuration
// Automatic backend detection - pings local server and falls back to production
// For physical devices, use your computer's local IP address
// For emulators/simulators, use special localhost addresses
const getLocalhost = () => {
  const isDevice = Constants.isDevice; // true for physical device, false for simulator/emulator

  if (isDevice) {
    return '192.168.31.198'; // Updated to user's current local IP
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2'; // Android emulator
  }
  return 'localhost'; // iOS simulator
};
const LOCAL_API_URL = `http://${getLocalhost()}:3000/api`;
const PRODUCTION_API_URL = 'https://yann-care.vercel.app/api';

// Dynamic API URL with caching
let cachedApiUrl: string | null = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Re-check every 30 seconds

/**
 * Ping a backend URL to check if it's available
 * @param url - The base URL to ping (without /api)
 * @returns true if backend responds within timeout
 */
async function pingBackend(url: string): Promise<boolean> {
  try {
    console.log(`🏓 Pinging: ${url}/health`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout (longer for Android emulator)

    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);
    const isOk = response.ok;
    console.log(`${isOk ? '✅' : '❌'} ${url} - Status: ${response.status}`);
    return isOk;
  } catch (error: any) {
    // Network error or timeout
    console.log(`❌ ${url} - Error: ${error.message}`);
    return false;
  }
}

/**
 * Detect which backend is available
 * Tries local first, falls back to production
 */
async function detectActiveBackend(): Promise<string> {
  const now = Date.now();

  // Return cached URL if it's still fresh
  if (cachedApiUrl && (now - lastCheckTime < CHECK_INTERVAL)) {
    return cachedApiUrl;
  }

  console.log('🔎 Detecting active backend...');

  // Try local backend first
  const localBase = LOCAL_API_URL.replace('/api', '');
  const isLocalAwake = await pingBackend(localBase);

  if (isLocalAwake) {
    console.log(`✅ Using LOCAL backend: ${LOCAL_API_URL}`);
    cachedApiUrl = LOCAL_API_URL;
  } else {
    console.log(`⚠️ Local backend unreachable, falling back to PRODUCTION: ${PRODUCTION_API_URL}`);
    cachedApiUrl = PRODUCTION_API_URL;
  }

  lastCheckTime = now;
  return cachedApiUrl;
}

// Export as a promise that resolves to the active backend URL
export const getApiBaseUrl = detectActiveBackend;

// For immediate synchronous access (will be updated after first detection)
export const API_BASE_URL = cachedApiUrl || PRODUCTION_API_URL;

// Export URLs for debugging
export const DEBUG_INFO = {
  LOCAL_URL: LOCAL_API_URL,
  PRODUCTION_URL: PRODUCTION_API_URL,
  IS_DEVICE: Constants.isDevice,
  PLATFORM: Platform.OS,
  LOCALHOST: getLocalhost()
};

// ============================================================================
// SERVICE CONFIGURATION - Based on Services charges.xlsx
// ============================================================================

// Static Services - Yannhome Platform Categories
// Service configuration includes overtime tracking and GST rates per service
export const SERVICES = [
  // =========== DRIVERS (18% GST, Overtime YES) ===========
  {
    id: 1,
    title: 'Personal Driver',
    description: 'Professional driver for your vehicle (In-city & Outstation)',
    category: 'driver',
    price: 'Varies',
    icon: require('../../assets/service-icons/Driver.png'),
    popular: true,
    features: ['Licensed drivers', 'Flexible hours', 'Background verified', 'In-city & Outstation'],
    hasOvertimeCharges: true,
    gstRate: 0.18,
    platformCommission: 0.10,
  },

  // =========== PUJARI SERVICES (0% GST, Overtime NO) ===========
  {
    id: 3,
    title: 'Lakshmi Puja',
    description: 'Traditional Lakshmi puja at home',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Lakshmi Pooja.png'),
    popular: true,
    features: ['Experienced pujari', 'All materials included', 'Timely service'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 4,
    title: 'Satyanarayan Katha',
    description: 'Complete Satyanarayan Katha ceremony',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Satyanarayan Katha.png'),
    features: ['Full ceremony', 'Prasad included', 'Experienced pujari'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 5,
    title: 'Ganesh Puja at Home',
    description: 'Ganesh puja for new beginnings',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['Auspicious ceremony', 'All rituals', 'Materials provided'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 6,
    title: 'Griha Pravesh Puja',
    description: 'House warming ceremony puja',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Lord Vishnu Pooja.png'),
    features: ['Complete ritual', 'Havan included', 'Experienced pujari'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 7,
    title: 'Vastu Shanti Puja',
    description: 'Vastu shanti for positive energy',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Vishnu.png'),
    features: ['Vastu remedies', 'Complete puja', 'Expert pujari'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 8,
    title: 'Havan Ceremony',
    description: 'Traditional havan ceremony',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['Agni puja', 'Mantras chanting', 'All materials'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 9,
    title: 'Rudrabhishek Puja',
    description: 'Shiva Rudrabhishek ceremony',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['Shiva puja', 'Abhishek ritual', 'Experienced priest'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 10,
    title: 'Vivah (Wedding Ceremony)',
    description: 'Complete wedding rituals',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['All wedding rituals', 'Experienced pandit', 'Muhurat planning'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 11,
    title: 'Ring Ceremony',
    description: 'Engagement ring ceremony puja',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ring Ceremony.png'),
    features: ['Engagement ritual', 'Blessings', 'Short ceremony'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 12,
    title: 'Ramjan Path',
    description: 'Ramayan path recitation',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['Complete path', 'Group recitation', 'Prasad'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 13,
    title: 'Mahamrityunjay Jaap',
    description: 'Mahamrityunjay mantra jaap',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Mahamrityunjay.png'),
    features: ['108 times jaap', 'Health benefits', 'Expert chanting'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 14,
    title: 'Gayatri Jaap',
    description: 'Gayatri mantra jaap ceremony',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['Vedic chanting', 'Spiritual benefits', 'Morning ceremony'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 15,
    title: 'Pitra Shanti Puja',
    description: 'Ancestors peace ceremony',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['Tarpan ritual', 'Pind daan', 'Complete ceremony'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 16,
    title: 'Nav Graha Shanti',
    description: 'Nine planets pacification puja',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['All 9 planets', 'Dosha nivaran', 'Expert astrologer'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 17,
    title: 'Bhoomi Poojan',
    description: 'Ground breaking ceremony',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Bhoomi Poojan.png'),
    features: ['Construction start', 'Bhoomi puja', 'Auspicious beginning'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 18,
    title: 'Vaahan Poojan',
    description: 'Vehicle puja ceremony',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Ganeshpuja.png'),
    features: ['New vehicle puja', 'Safety blessings', 'Quick ceremony'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 19,
    title: 'Shraddh Karm',
    description: 'Annual ancestral rituals',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Shraadh Karm.png'),
    features: ['Pitru shraddh', 'Complete ritual', 'Brahmin bhojan'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 20,
    title: 'Janmadin Poojan',
    description: 'Birthday puja ceremony',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Janmdin Poojan.png'),
    features: ['Birthday blessings', 'Aarti', 'Short ceremony'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },
  {
    id: 21,
    title: 'Sundarkand Path',
    description: 'Sundarkand recitation',
    category: 'pujari',
    price: 'Varies',
    icon: require('../../assets/service-icons/Sundarkaand Paath.png'),
    features: ['Complete path', 'Group chanting', 'Spiritual benefits'],
    hasOvertimeCharges: false,
    gstRate: 0,
    platformCommission: 0.10,
  },

  // =========== CLEANING SERVICES (18% GST) ===========
  {
    id: 22,
    title: 'Deep House Cleaning',
    description: 'Thorough deep cleaning service',
    category: 'cleaning',
    price: 'Varies',
    icon: require('../../assets/service-icons/Deep House Cleaning.png'),
    popular: true,
    features: ['All rooms', 'Deep clean', 'Eco-friendly products'],
    hasOvertimeCharges: true,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 23,
    title: 'Regular House Cleaning',
    description: 'Daily/weekly house cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: require('../../assets/service-icons/House Cleaning.png'),
    popular: true,
    features: ['Regular maintenance', 'Flexible timing', 'Trained staff'],
    hasOvertimeCharges: true,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 24,
    title: 'Bathroom Deep Clean',
    description: 'Specialized bathroom cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: require('../../assets/service-icons/Deep Bathroom Cleaning.png'),
    features: ['Sanitization', 'Tile cleaning', 'Odor removal'],
    hasOvertimeCharges: true,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 25,
    title: 'Car Washing',
    description: 'Professional car cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: require('../../assets/service-icons/Car Cleaning.png'),
    features: ['Interior & exterior', 'Polishing', 'Vacuum cleaning'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 26,
    title: 'Laundry & Ironing',
    description: 'Clothes washing and ironing',
    category: 'cleaning',
    price: 'Varies',
    icon: require('../../assets/service-icons/Laundary And Iron.png'),
    features: ['Wash & fold', 'Ironing', 'Pickup available'],
    hasOvertimeCharges: true,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 27,
    title: 'Dry Cleaning Service',
    description: 'Professional dry cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: require('../../assets/service-icons/Dry Cleaning.png'),
    features: ['Delicate fabrics', 'Stain removal', 'Premium care'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 28,
    title: 'Chimney & Exhaust Cleaning',
    description: 'Kitchen chimney cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: require('../../assets/service-icons/Chimney Cleaning.png'),
    features: ['Deep cleaning', 'Filter wash', 'Motor check'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 29,
    title: 'Water Tank Cleaning',
    description: 'Overhead/underground tank cleaning',
    category: 'cleaning',
    price: 'Varies',
    icon: require('../../assets/service-icons/Tank Cleaning.png'),
    features: ['Sanitization', 'Algae removal', 'Safe water'],
    hasOvertimeCharges: true,
    gstRate: 0.18,
    platformCommission: 0.10,
  },

  // =========== ELECTRICAL SERVICES (18% GST) ===========
  {
    id: 30,
    title: 'Light Fitting',
    description: 'Installation and replacement of indoor or outdoor lights',
    category: 'electrical',
    price: 'Varies',
    icon: '💡',
    popular: true,
    features: ['Ceiling lights', 'Wall lights', 'Safe wiring checks'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 31,
    title: 'Fan Fitting',
    description: 'Ceiling and wall fan installation by trained electricians',
    category: 'electrical',
    price: 'Varies',
    icon: '🌀',
    popular: true,
    features: ['New fitting', 'Alignment checks', 'Safety testing'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 32,
    title: 'Fan Repair',
    description: 'Fan noise, speed, capacitor and motor issue repair',
    category: 'electrical',
    price: 'Varies',
    icon: '🛠️',
    features: ['Capacitor replacement', 'Motor checks', 'Wiring fixes'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 33,
    title: 'Switch and Socket Repair',
    description: 'Switchboard, socket and minor wiring fault repair',
    category: 'electrical',
    price: 'Varies',
    icon: '🔌',
    features: ['Switch replacement', 'Socket repair', 'Loose connection fix'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 34,
    title: 'Short Circuit Troubleshooting',
    description: 'Diagnosis and repair of short-circuit and trip issues',
    category: 'electrical',
    price: 'Varies',
    icon: '⚡',
    popular: true,
    features: ['Fault tracing', 'Load checks', 'Safe restoration'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 35,
    title: 'MCB and Fuse Repair',
    description: 'MCB, fuse and distribution board related repair work',
    category: 'electrical',
    price: 'Varies',
    icon: '🧰',
    features: ['MCB replacement', 'Fuse fix', 'DB inspection'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 36,
    title: 'Wiring and Rewiring',
    description: 'Partial or full rewiring for homes and offices',
    category: 'electrical',
    price: 'Varies',
    icon: '🧵',
    features: ['New wiring', 'Old wire replacement', 'Load planning'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 37,
    title: 'Water Pump Repair',
    description: 'Residential water pump wiring and motor issue repair',
    category: 'electrical',
    price: 'Varies',
    icon: '🚰',
    features: ['Motor check', 'Starter check', 'Power line fix'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 38,
    title: 'Starter Repair',
    description: 'Starter panel and starter circuit troubleshooting',
    category: 'electrical',
    price: 'Varies',
    icon: '🎛️',
    features: ['Panel diagnosis', 'Relay checks', 'Component replacement'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 39,
    title: 'Cooler Repair',
    description: 'Air cooler motor, pump and electrical fault repair',
    category: 'electrical',
    price: 'Varies',
    icon: '❄️',
    features: ['Motor service', 'Pump repair', 'Cooling check'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },

  // =========== HOME APPLIANCE REPAIR (18% GST) ===========
  {
    id: 40,
    title: 'AC Service and Repair',
    description: 'General AC service and diagnosis for cooling issues',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🌬️',
    popular: true,
    features: ['General service', 'Cooling check', 'Gas pressure check'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 41,
    title: 'Window AC Installation',
    description: 'Professional window AC fitting and setup',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🪟',
    features: ['Mounting', 'Power check', 'Test run'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 42,
    title: 'Split AC Installation',
    description: 'Indoor/outdoor unit installation with piping checks',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🏡',
    popular: true,
    features: ['Unit fitting', 'Pipe setup', 'Performance check'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 43,
    title: 'Window AC Service',
    description: 'Routine cleaning and service of window AC units',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🧼',
    features: ['Filter cleaning', 'Coil clean', 'Airflow check'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 44,
    title: 'Split AC Service',
    description: 'Routine cleaning and performance service for split AC',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🛋️',
    features: ['Indoor unit clean', 'Outdoor wash', 'Cooling tune-up'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 45,
    title: 'Window AC Water Leakage',
    description: 'Drain and leakage issue repair for window AC units',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '💧',
    features: ['Drain cleaning', 'Leak trace', 'Seal correction'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 46,
    title: 'Split AC Water Leakage',
    description: 'Drain line and indoor leakage troubleshooting for split AC',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🌊',
    features: ['Drain unclog', 'Pipe correction', 'Leak prevention'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 47,
    title: 'AC Noise and Start Issue',
    description: 'Compressor, capacitor and startup issue diagnosis',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🔊',
    features: ['Noise diagnosis', 'Startup fix', 'Component checks'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 48,
    title: 'Refrigerator Repair',
    description: 'Cooling, gas, thermostat and electrical fridge repairs',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🧊',
    popular: true,
    features: ['Cooling fix', 'Thermostat checks', 'Gas top-up'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 49,
    title: 'Washing Machine Repair',
    description: 'Drum, motor, inlet and drain related machine repairs',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🧺',
    popular: true,
    features: ['Spin issues', 'Drain fix', 'Motor checks'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 50,
    title: 'Microwave Repair',
    description: 'Microwave heating and control board troubleshooting',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '📡',
    features: ['Heating fix', 'Door switch check', 'Board repair'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 51,
    title: 'LCD/LED TV Repair',
    description: 'Display, power and audio issues for TV units',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '📺',
    features: ['Power issues', 'Display diagnostics', 'Sound fixes'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 52,
    title: 'Music System Repair',
    description: 'Speaker and amplifier level diagnostics and repairs',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🎵',
    features: ['Audio checks', 'Amplifier repair', 'Power board fix'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 53,
    title: 'Induction Cooktop Repair',
    description: 'Induction plate not heating or display issue fixes',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🍳',
    features: ['Heating diagnostics', 'Sensor checks', 'Board service'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 54,
    title: 'Iron Repair',
    description: 'Electric iron heating and cord issue repair',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🧷',
    features: ['Heating element check', 'Cord repair', 'Switch service'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
  {
    id: 55,
    title: 'Juicer Mixer Grinder Repair',
    description: 'Mixer motor, jar lock and blade issue troubleshooting',
    category: 'appliance-repair',
    price: 'Varies',
    icon: '🥤',
    features: ['Motor repair', 'Blade replacement', 'Speed control fix'],
    hasOvertimeCharges: false,
    gstRate: 0.18,
    platformCommission: 0.10,
  },
];

// Service Categories
export const SERVICE_CATEGORIES = [
  'cleaning',
  'pujari',
  'driver',
  'electrical',
  'appliance-repair',
  'maintenance',
  'healthcare',
  'security',
  'domestic',
  'specialty',
] as const;

// Payment Methods - Simplified to Cash and Wallet only
// Users who want online payment must recharge their wallet first
export const PAYMENT_METHODS = [
  {
    id: 'wallet',
    label: 'Yann Wallet',
    value: 'wallet',
    icon: 'wallet-outline',
    description: 'Pay 25% now, 75% after service',
    recommended: true
  },
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
  pending: COLORS.warning,
  awaiting_response: COLORS.warning,
  pending_payment: COLORS.warning,
  accepted: COLORS.success,
  in_progress: COLORS.info, // or COLORS.primary
  rejected: COLORS.error,
  awaiting_completion_payment: COLORS.accentOrange,  // Orange - action needed from member
  completed: COLORS.info, // using info (blue) for completed as per theme
  cancelled: COLORS.textTertiary,
  expired: COLORS.textTertiary,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  EMAIL: 'email',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  RECENT_LOCATION_SEARCHES: '@yann_recent_location_searches',
} as const;

// Helper function to get service config by title
export const getServiceConfig = (title: string) => {
  return SERVICES.find(s => s.title === title);
};

// Helper function to get GST rate for a service
export const getServiceGstRate = (title: string): number => {
  const service = getServiceConfig(title);
  return service?.gstRate ?? 0.18; // Default to 18% if not found
};

// Driver Constants
export const VEHICLE_TYPES = ['hatchback', 'sedan', 'suv', 'luxury', 'van'];
export const TRANSMISSION_TYPES = ['manual', 'automatic'];
export const TRIP_PREFERENCES = [
  { id: 'incity', label: 'In-City' },
  { id: 'outstation', label: 'Outstation' },
  { id: 'both', label: 'Both' }
];

// Helper function to check if service has overtime charges
export const hasOvertimeCharges = (title: string): boolean => {
  const service = getServiceConfig(title);
  return service?.hasOvertimeCharges ?? false;
};
