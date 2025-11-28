import express from 'express';
import { login } from '../controllers/authController.js';
import { supabase, getAuthUser } from '../config/supabase.js';

const router = express.Router();

router.post('/login', login);

/**
 * POST /api/auth/sync
 * Sync user to users table after Supabase auth signup
 */
router.post('/sync', getAuthUser, async (req, res) => {
  try {
    const { name, role } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingUser) {
      return res.json({ success: true, message: 'User already synced', data: existingUser });
    }

    // Insert user into users table
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        name: name || email.split('@')[0],
        email: email,
        role: role || 'student'
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', getAuthUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ 
      success: true, 
      data: data || {
        id: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.name || req.user.email.split('@')[0],
        role: req.user.user_metadata?.role || 'student'
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
