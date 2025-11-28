import express from 'express';
import { getAuthUser } from '../config/supabase.js';
import ClassService from '../services/classService.js';

const router = express.Router();

// Middleware to verify auth
router.use(getAuthUser);

/**
 * POST /api/classes
 * Teacher creates a new class
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, subject, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    const classData = await ClassService.createClass(req.user.id, { name, description, subject, color });
    res.json({ success: true, data: classData });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/classes
 * Get classes (teacher: own classes, student: enrolled classes)
 */
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    let classes;

    if (role === 'teacher') {
      classes = await ClassService.getTeacherClasses(req.user.id);
    } else {
      classes = await ClassService.getStudentClasses(req.user.id);
    }

    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/classes/:id
 * Get class detail with members
 */
router.get('/:id', async (req, res) => {
  try {
    const classDetail = await ClassService.getClassDetail(req.params.id);
    res.json({ success: true, data: classDetail });
  } catch (error) {
    console.error('Get class detail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/classes/:id
 * Update class (teacher only)
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const updated = await ClassService.updateClass(req.params.id, { name, description });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/classes/:id
 * Delete class (teacher only)
 */
router.delete('/:id', async (req, res) => {
  try {
    await ClassService.deleteClass(req.params.id);
    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/classes/:id/enroll
 * Enroll a student to a class
 */
router.post('/:id/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const enrollment = await ClassService.enrollStudent(req.params.id, studentId);
    res.json({ success: true, data: enrollment });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/classes/:id/unenroll/:studentId
 * Remove a student from a class
 */
router.delete('/:id/unenroll/:studentId', async (req, res) => {
  try {
    await ClassService.unenrollStudent(req.params.id, req.params.studentId);
    res.json({ success: true, message: 'Student unenrolled' });
  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/classes/enroll-by-code
 * Student enrolls in a class using class code
 */
router.post('/enroll-by-code', async (req, res) => {
  try {
    const { classCode, code } = req.body;
    const enrollCode = classCode || code;
    
    if (!enrollCode) {
      return res.status(400).json({ success: false, message: 'Class code is required' });
    }

    const classData = await ClassService.getClassByCode(enrollCode);
    const enrollment = await ClassService.enrollStudent(classData.id, req.user.id);
    
    res.json({ success: true, data: { class: classData, enrollment } });
  } catch (error) {
    console.error('Enroll by code error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
