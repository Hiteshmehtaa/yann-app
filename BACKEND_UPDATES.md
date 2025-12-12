# Backend Updates Required

## Issue #2: Delete Rejected Bookings from Database

Update `api/bookings/reject/route.js` to **delete** the booking from the database when a provider rejects it, instead of just marking it as rejected.

### Updated Code:

```javascript
import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Booking from '@/models/Booking';
import ServiceProvider from '@/models/ServiceProvider';
import ResidentRequest from '@/models/ResidentRequest';

export async function POST(request) {
  try {
    await connectDB();

    const { bookingId, providerId, reason } = await request.json();

    if (!bookingId || !providerId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID and Provider ID are required' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Add to provider responses
    booking.providerResponses.push({
      providerId: providerId,
      response: 'rejected',
      respondedAt: new Date(),
      rejectionReason: reason || 'Not specified'
    });

    await booking.save();

    // Check if all providers have rejected
    const allProviders = await ServiceProvider.find({
      services: booking.serviceName,
      status: 'active'
    });

    const rejectedCount = booking.providerResponses.filter(r => r.response === 'rejected').length;
    
    if (rejectedCount >= allProviders.length) {
      // ✅ DELETE THE BOOKING FROM DATABASE
      await Booking.findByIdAndDelete(bookingId);

      // Update resident request if exists
      if (booking.residentRequest) {
        await ResidentRequest.findByIdAndDelete(booking.residentRequest);
      }
      
      // In production: Notify customer that booking couldn't be fulfilled
      console.log(`❌ All providers rejected booking ${bookingId} - DELETED FROM DATABASE`);

      return NextResponse.json({
        success: true,
        message: 'Booking has been removed as all providers declined',
        deleted: true,
        booking: {
          id: booking._id,
          status: 'deleted'
        }
      }, { status: 200 });
    }

    console.log(`⏭️ Provider rejected booking ${bookingId}. Reason: ${reason || 'Not specified'}`);

    return NextResponse.json({
      success: true,
      message: 'Booking rejected. It will be offered to other providers.',
      booking: {
        id: booking._id,
        status: booking.status
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Booking rejection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to reject booking',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
```

### Key Changes:

1. **Line 51-53**: Changed from `booking.status = 'rejected'` to `await Booking.findByIdAndDelete(bookingId)`
2. **Line 55-57**: Also delete the associated ResidentRequest
3. **Line 60**: Updated console log message
4. **Line 63-69**: Return response indicating deletion
5. **Status 'deleted'**: Indicates the booking no longer exists

### Impact:

- ✅ Rejected bookings are **permanently deleted** from database
- ✅ Member's booking screen won't show rejected bookings (already filtered in mobile app)
- ✅ Provider's booking screen shows empty animation when no bookings exist
- ✅ Cleaner database without rejected booking records
- ✅ ResidentRequest also deleted to maintain data consistency

### Mobile App Changes (Already Completed):

✅ **BookingsListScreen.tsx** - Filters out any 'rejected' status bookings  
✅ **ProviderBookingsScreen.tsx** - Uses EmptyState component with animation  
✅ **Empty states** - Proper messages for ongoing/completed/cancelled tabs  
✅ **Tab-specific messages** - Different empty state text per tab

---

## Testing Checklist:

- [ ] Provider rejects a booking → Booking deleted from DB
- [ ] All providers reject → Booking and ResidentRequest deleted
- [ ] Member's screen doesn't show rejected bookings
- [ ] Provider's screen shows empty animation when no bookings
- [ ] Empty animation shows for ongoing/completed/cancelled tabs
- [ ] Empty state messages are correct per tab
