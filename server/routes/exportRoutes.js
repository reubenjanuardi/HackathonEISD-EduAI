import express from 'express';
import { getAuthUser } from '../config/supabase.js';
import ExportService from '../services/exportService.js';

const router = express.Router();

// Middleware to verify auth
router.use(getAuthUser);

/**
 * GET /api/export/class/:classId/grades.csv
 * Export all student grades for a class as CSV
 * Teacher only
 */
router.get('/class/:classId/grades.csv', async (req, res) => {
  try {
    const csvData = await ExportService.exportClassGradesCSV(req.params.classId);
    
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="class-grades-${req.params.classId}-${Date.now()}.csv"`);
    res.send(csvData);
  } catch (error) {
    console.error('Export grades CSV error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/export/class/:classId/grades.xlsx
 * Export all student grades for a class as XLSX
 * Teacher only
 */
router.get('/class/:classId/grades.xlsx', async (req, res) => {
  try {
    const buffer = await ExportService.exportClassGradesXLSX(req.params.classId);
    
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename="class-grades-${req.params.classId}-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export grades XLSX error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/export/quiz/:quizId/results.csv
 * Export quiz attempt results as CSV
 * Teacher only
 */
router.get('/quiz/:quizId/results.csv', async (req, res) => {
  try {
    const csvData = await ExportService.exportQuizResultsCSV(req.params.quizId);
    
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="quiz-results-${req.params.quizId}-${Date.now()}.csv"`);
    res.send(csvData);
  } catch (error) {
    console.error('Export quiz results CSV error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/export/student/:studentId/transcript
 * Export student transcript (all grades across all classes)
 * Student views own, teacher views enrolled students
 */
router.get('/student/:studentId/transcript', async (req, res) => {
  try {
    const buffer = await ExportService.exportStudentTranscript(req.params.studentId);
    
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename="transcript-${req.params.studentId}-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export transcript error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/export/class/:classId/analytics
 * Export comprehensive class analytics report
 * Teacher only
 */
router.get('/class/:classId/analytics', async (req, res) => {
  try {
    const buffer = await ExportService.exportClassAnalyticsReport(req.params.classId);
    
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename="class-analytics-${req.params.classId}-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
