import express from 'express';
import passport from '../config/passport.js';  // This imports the configured passport
import { register, login, googleCallback, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/auth/error`,
    session: true
  }),
  googleCallback
);

router.get('/profile', protect, getProfile);

export default router;