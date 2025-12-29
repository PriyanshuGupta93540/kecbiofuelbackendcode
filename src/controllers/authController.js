import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      authProvider: 'local',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.authProvider !== 'local') {
      return res.status(400).json({
        success: false,
        message: `This account uses ${user.authProvider} login`,
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const token = generateToken(req.user._id);
    const user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    };
    
    // Send HTML that posts message to parent window
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f97316 0%, #16a34a 100%);
              color: white;
            }
            .message {
              text-align: center;
              padding: 2rem;
              background: rgba(255,255,255,0.1);
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            .spinner {
              width: 40px;
              height: 40px;
              margin: 1rem auto;
              border: 4px solid rgba(255,255,255,0.3);
              border-top-color: white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="message">
            <div class="spinner"></div>
            <h2>Authentication Successful!</h2>
            <p>Closing window...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage(
                  { 
                    token: '${token}',
                    user: ${JSON.stringify(user)}
                  },
                  '${process.env.FRONTEND_URL || 'http://localhost:3000'}'
                );
                setTimeout(() => window.close(), 1000);
              } else {
                // Fallback if popup was blocked
                window.location.href = '${process.env.FRONTEND_URL}/?token=${token}';
              }
            } catch (error) {
              console.error('Popup error:', error);
              window.location.href = '${process.env.FRONTEND_URL}';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Google callback error:', error);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
            }
            .message {
              text-align: center;
              padding: 2rem;
              background: rgba(255,255,255,0.1);
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h2>❌ Authentication Failed</h2>
            <p>${error.message || 'Something went wrong'}</p>
            <p>This window will close in 3 seconds...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage(
                { error: '${error.message || 'Authentication failed'}' },
                '${process.env.FRONTEND_URL || 'http://localhost:3000'}'
              );
              setTimeout(() => window.close(), 3000);
            } else {
              setTimeout(() => {
                window.location.href = '${process.env.FRONTEND_URL}';
              }, 3000);
            }
          </script>
        </body>
      </html>
    `);
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};