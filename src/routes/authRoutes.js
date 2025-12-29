import express from 'express';
import passport from '../config/passport.js';
import { register, login, googleCallback, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Local auth routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`,
    session: false  // Changed to false since we're using JWT
  }),
  googleCallback
);

// Protected routes
router.get('/profile', protect, getProfile);

export default router;