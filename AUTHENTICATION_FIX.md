# Authentication Fix - Email & Phone OTP Support

## Summary of Changes

This fix addresses the OTP authentication issues and implements support for users to sign up and sign in using either email or phone number (or both).

## Changes Made

### 1. Mobile App - SignupScreen (`src/screens/auth/SignupScreen.tsx`)
- **Updated validation**: Users can now provide either email OR phone number (or both) during signup
- **Flexible OTP sending**: OTP is sent to whichever identifier the user provides (email or phone)
- **Improved UX**: Added helpful hints explaining that at least one identifier is required
- **Metadata**: Both email and phone are passed to backend when provided

### 2. Backend - Send OTP API (`Yann-Website/src/app/api/auth/send-otp/route.js`)
- **Better error handling**: Added try-catch block for email sending with detailed error messages
- **Improved logging**: Added console logs to track email sending success/failure
- **Cleanup on failure**: Deletes OTP record if email fails to send
- **User-friendly messages**: Returns clearer error messages when email configuration is missing

### 3. Database Models

#### Homeowner Model (`Yann-Website/src/models/Homeowner.js`)
- Already had proper validation: at least one of email or phone required
- Sparse unique indexes prevent duplicates while allowing optional fields

#### ServiceProvider Model (`Yann-Website/src/models/ServiceProvider.js`)
- **Updated to match Homeowner flexibility**: Made email and phone fields optional (but at least one required)
- **Added sparse indexes**: Allows unique constraint while supporting optional fields
- **Pre-validation hook**: Ensures at least one identifier (email or phone) is provided

### 4. Documentation
- **Created `.env.example`**: Documents all required environment variables
- **Email setup guide**: Instructions for configuring Gmail with App Password

## How Authentication Now Works

### Sign Up Flow
1. User provides name + (email and/or phone)
2. System validates at least one identifier is provided
3. OTP sent to primary identifier (email if provided, otherwise phone)
4. Both email and phone stored in database (if provided)
5. User can later sign in with either identifier

### Sign In Flow
1. User enters email OR phone number
2. System auto-detects input type
3. OTP sent to the provided identifier
4. After verification, user is logged in

## Required Environment Variables

For **email OTP** to work, you need these environment variables in `Yann-Website/.env.local`:

```bash
# Email Configuration (Required for Email OTP)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# SMS (Required for Phone OTP)
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_msg91_template_id
```

### Setting Up Gmail for Email OTP

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** → **2-Step Verification** (enable if not already)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Create a new App Password for "Mail"
5. Use that 16-character password as `EMAIL_PASS` (without spaces)
6. Use your Gmail address as `EMAIL_USER`

## Testing

### Test Email OTP
1. Ensure `EMAIL_USER` and `EMAIL_PASS` are configured
2. Run the backend: `cd Yann-Website && npm run dev`
3. Sign up with email address
4. Check email inbox for OTP
5. Verify OTP to complete signup

### Test Phone OTP
1. Ensure `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` are configured
2. Sign up with phone number
3. Check SMS for OTP
4. Verify OTP to complete signup

### Test Both
1. Sign up with both email and phone
2. OTP will be sent to email (primary)
3. After signup, test signing in with phone number
4. OTP will be sent via SMS

## Troubleshooting

### Email OTP Not Working

**Check 1: Environment Variables**
```bash
cd Yann-Website
cat .env.local | grep EMAIL
```
Should show:
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

**Check 2: Gmail App Password**
- Regular Gmail password won't work
- Must use App Password (16 characters)
- 2-Factor Authentication must be enabled on Google Account

**Check 3: Backend Logs**
Look for these in terminal:
```
✅ Email transporter configured with user: your_email@gmail.com
📧 Sending OTP email to: user@example.com for homeowner signup
✅ OTP email sent successfully to: user@example.com
```

If you see:
```
❌ Email credentials not configured
```
Then EMAIL_USER or EMAIL_PASS is missing.

**Check 4: Gmail Security**
- Allow "Less secure app access" (if using old Gmail)
- Or better: Use App Password (recommended)

### Phone OTP Not Working

**Check MSG91 Configuration:**
```bash
cd Yann-Website
cat .env.local | grep MSG91
```

Ensure MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are set.

## Database Schema

### Homeowner Collection
```javascript
{
  name: String (required),
  email: String (optional, unique if provided),
  phone: String (optional, unique if provided),
  // ... other fields
}
// Validation: At least one of email or phone required
```

### ServiceProvider Collection
```javascript
{
  name: String (required),
  email: String (optional, unique if provided),
  phone: String (optional, unique if provided),
  services: [String] (required),
  // ... other fields
}
// Validation: At least one of email or phone required
```

## API Endpoints

### POST `/api/auth/send-otp`
**Request:**
```json
{
  "identifier": "user@example.com OR 9876543210",
  "audience": "homeowner",
  "intent": "signup",
  "metadata": {
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "9876543210"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "identifierType": "email"
}
```

### POST `/api/auth/verify-otp`
**Request:**
```json
{
  "identifier": "user@example.com OR 9876543210",
  "otp": "123456",
  "audience": "homeowner",
  "intent": "signup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resident account created",
  "homeowner": {
    "id": "...",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "9876543210"
  },
  "token": "jwt_token_here"
}
```

## Next Steps

1. **Set up environment variables** in `Yann-Website/.env.local`
2. **Test email OTP** by signing up with an email
3. **Test phone OTP** by signing up with a phone number
4. **Test login** with both email and phone
5. **Monitor logs** in backend terminal for any errors

## Notes

- The backend already had most of the logic in place
- The main issue was likely missing EMAIL_USER and EMAIL_PASS environment variables
- Now both email and phone are treated equally as valid identifiers
- Users can have both email and phone, improving account security and flexibility
