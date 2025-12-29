import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('✗ Deserialize error:', error);
    done(error, null);
  }
});

// Check if Google OAuth credentials exist
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (hasGoogleCredentials) {
  console.log('=== Configuring Google OAuth Strategy ===');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
  console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback');
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('✓ Google authentication callback received');
          console.log('Profile:', profile.displayName, profile.emails[0].value);
          
          let user = await User.findOne({ 
            $or: [
              { googleId: profile.id },
              { email: profile.emails[0].value }
            ]
          });

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              user.authProvider = 'google';
              await user.save();
            }
            console.log('✓ Existing user authenticated:', user._id);
            return done(null, user);
          }

          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            authProvider: 'google',
          });

          console.log('✓ New user created:', user._id);
          done(null, user);
        } catch (error) {
          console.error('✗ Google Strategy error:', error);
          done(error, null);
        }
      }
    )
  );
  console.log('✓ Google OAuth Strategy configured successfully');
} else {
  console.error('✗✗✗ GOOGLE OAUTH NOT CONFIGURED ✗✗✗');
  console.error('Missing environment variables:');
  if (!process.env.GOOGLE_CLIENT_ID) console.error('  - GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) console.error('  - GOOGLE_CLIENT_SECRET');
  console.error('Google login will NOT work until these are set in .env file');
}

// Export the configured passport instance
export default passport;