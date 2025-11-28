import Teacher from '../models/Teacher.js';

/**
 * Dummy authentication (for MVP purposes)
 * In production, use proper password hashing (bcrypt) and JWT tokens
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Dummy authentication - hardcoded credentials
    if (username === 'teacher' && password === 'password123') {
      const user = {
        id: '1',
        username: 'teacher',
        name: 'Demo Teacher',
        email: 'teacher@eduai.com',
      };
      
      // In production, generate a real JWT token
      const token = 'dummy-jwt-token-' + Date.now();
      
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user,
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};
