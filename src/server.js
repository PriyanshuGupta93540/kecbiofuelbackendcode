import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import passport from './config/passport.js';  // Import configured passport
import authRoutes from './routes/authRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// Load environment variables FIRST
// dotenv.config({ path: join(__dirname, '../.env') });

// Debug: Check ALL Google OAuth variables
console.log('\n=== Environment Variables Check ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Loaded' : '✗ NOT FOUND');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Loaded' : '✗ NOT FOUND');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Loaded' : '✗ NOT FOUND');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Loaded' : '✗ NOT FOUND');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Using default');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✓ Loaded' : '✗ NOT FOUND');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');
console.log('PORT:', process.env.PORT || '5000');
console.log('===================================\n');

const app = express();

// Connect to database
connectDB();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration (MUST come before passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
  })
);

// Initialize passport (using the configured instance)
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Blog Backend API is running',
    googleOAuthConfigured: !!process.env.GOOGLE_CLIENT_ID
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});