/**
 * GET /api/provider/service-counts
 * 
 * Returns the count of active partners for each service category.
 * Used by the mobile app to display partner availability on service cards.
 * 
 * Response format:
 * {
 *   "success": true,
 *   "data": {
 *     "Drivers": 3,
 *     "Pujari": 1,
 *     "Maids": 5,
 *     "Baby Sitters": 2,
 *     ...
 *   }
 * }
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ServiceProvider from '@/models/ServiceProvider';

export async function GET(request) {
  try {
    await dbConnect();

    // Fetch all active service providers
    const providers = await ServiceProvider.find({ 
      status: 'active' 
    }).select('services');

    // Count providers per service
    const serviceCounts = {};

    providers.forEach(provider => {
      if (provider.services && Array.isArray(provider.services)) {
        provider.services.forEach(serviceName => {
          serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Partner counts retrieved successfully',
      data: serviceCounts,
    });

  } catch (error) {
    console.error('Error fetching partner counts:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch partner counts',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
