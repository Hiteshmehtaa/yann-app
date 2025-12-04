// Type definitions for Yann Care Mobile App

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: 'homeowner' | 'provider';
  preferences?: string[];
  savedProviders?: string[];
  addressBook?: Address[];
  lastLoginAt?: Date;
  // Provider-specific fields
  services?: string[];
  serviceRates?: Record<string, number>;
  status?: 'active' | 'inactive' | 'pending';
  rating?: number;
  totalReviews?: number;
  experience?: number;
  bio?: string;
}

export interface Address {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ServiceProvider {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  experience: number;
  services: string[];
  serviceRates: ServiceRate[];
  selectedCategories?: string[];
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  totalReviews: number;
}

export interface ServiceRate {
  serviceName: string;
  price: number;
}

export interface Booking {
  _id: string;
  serviceId: number;
  serviceName: string;
  serviceCategory: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  bookingDate: Date;
  bookingTime: string;
  basePrice: number;
  extras?: Extra[];
  totalPrice: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  billingType: 'one-time' | 'monthly' | 'hourly' | 'daily';
  quantity: number;
  notes?: string;
  driverDetails?: DriverDetails;
  assignedProvider?: string;
  providerName?: string;
  residentRequest?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  negotiation?: Negotiation;
  createdAt: Date;
  updatedAt: Date;
}

export interface Extra {
  serviceId: number;
  serviceName: string;
  price: number;
}

export interface DriverDetails {
  startTime: string;
  endTime: string;
  totalHours: number;
  baseHours: number;
  hourlyRate: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeMultiplier: number;
  baseCost: number;
  overtimeCost: number;
}

export interface Negotiation {
  isActive: boolean;
  proposedAmount?: number;
  providerId?: string;
  providerName?: string;
  note?: string;
  status: 'idle' | 'pending' | 'accepted' | 'declined' | 'cancelled';
  respondedAt?: Date;
  createdAt?: Date;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  category: string;
  price: string;
  icon: string;
  popular?: boolean;
  features: string[];
}

export interface Homeowner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  preferences?: string[];
  savedProviders?: string[];
  addressBook?: Address[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  homeowner?: Homeowner;
  audience?: 'homeowner' | 'provider';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
