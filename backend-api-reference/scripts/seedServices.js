/**
 * Seed Services Script
 * 
 * Run this script to populate your database with initial services
 * 
 * Usage:
 * node scripts/seedServices.js
 * 
 * Or add to package.json:
 * "scripts": {
 *   "seed:services": "node scripts/seedServices.js"
 * }
 */

// This should be run in your Next.js backend project
const mongoose = require('mongoose');
const Service = require('../models/Service').default;

const services = [
  {
    title: 'House Cleaning',
    description: 'Professional cleaning services for your home. Deep cleaning, regular maintenance, and more.',
    category: 'cleaning',
    price: 'Starting at ₹299',
    features: ['Deep Cleaning', 'Regular Maintenance', 'Move-in/Move-out'],
    icon: '🏠',
    popular: true,
    order: 1,
  },
  {
    title: 'Repairs & Maintenance',
    description: 'Expert technicians for all your repair needs. Plumbing, electrical, carpentry, and more.',
    category: 'maintenance',
    price: 'Starting at ₹399',
    features: ['Plumbing', 'Electrical', 'Carpentry'],
    icon: '🔧',
    popular: false,
    order: 2,
  },
  {
    title: 'Delivery Services',
    description: 'Fast and reliable delivery for packages, groceries, and more. Track in real-time.',
    category: 'delivery',
    price: 'Starting at ₹99',
    features: ['Same-day Delivery', 'Package Tracking', 'Grocery Delivery'],
    icon: '🚚',
    popular: false,
    order: 3,
  },
  {
    title: 'Pet Care',
    description: 'Loving care for your furry friends. Walking, grooming, sitting, and veterinary services.',
    category: 'pet-care',
    price: 'Starting at ₹129',
    features: ['Dog Walking', 'Pet Grooming', 'Pet Sitting'],
    icon: '🐾',
    popular: false,
    order: 4,
  },
  {
    title: 'Personal Assistant',
    description: 'Your dedicated helper for errands, appointments, and daily tasks. Save time and stress.',
    category: 'assistant',
    price: 'Starting at ₹399',
    features: ['Errand Running', 'Appointment Scheduling', 'Personal Shopping'],
    icon: '👤',
    popular: false,
    order: 5,
  },
  {
    title: 'Garden & Landscaping',
    description: 'Transform your outdoor space. Lawn care, planting, design, and maintenance.',
    category: 'garden',
    price: 'Starting at ₹299',
    features: ['Lawn Care', 'Garden Design', 'Tree Trimming'],
    icon: '🌿',
    popular: false,
    order: 6,
  },
  {
    title: 'Full-Day Personal Driver',
    description: 'Hire a background-verified driver for full-day commutes, airport drops, or VIP errands.',
    category: 'driver',
    price: 'Starting at ₹1,500',
    features: ['Full-day Service', 'Hourly Pricing', 'Overtime Available'],
    icon: '🚗',
    popular: true,
    order: 7,
  },
  {
    title: 'Pujari Services',
    description: 'Professional pujari for religious ceremonies and rituals at your home.',
    category: 'pujari',
    price: 'Starting at ₹501',
    features: ['Home Puja', 'Religious Ceremonies', 'Festival Rituals'],
    icon: '🙏',
    popular: false,
    order: 8,
  },
];

async function seedServices() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing services');

    // Insert new services
    const result = await Service.insertMany(services);
    console.log(`✅ Successfully seeded ${result.length} services`);

    // Display seeded services
    console.log('\n📋 Seeded services:');
    result.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.icon} ${service.title} - ${service.price}`);
    });

    console.log('\n🎉 Service seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    process.exit(1);
  }
}

// Run the seed function
seedServices();
