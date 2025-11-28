import express from 'express';
import multer from 'multer';
import { uploadGrades, generateInsights } from '../controllers/gradeController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/upload', upload.single('file'), uploadGrades);
router.post('/insights', generateInsights);

export default router;
