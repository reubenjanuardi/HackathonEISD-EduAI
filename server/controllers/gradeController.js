import Grade from '../models/Grade.js';
import { parseCSV, parseExcel, validateGradeData } from '../services/fileParser.js';
import { generateInsights as generateAIInsights } from '../services/aiService.js';
import fs from 'fs';

/**
 * Upload and parse grade file (CSV or Excel)
 */
export const uploadGrades = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }
    
    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    
    let gradeData;
    
    // Parse based on file type
    if (fileExt === 'csv') {
      gradeData = await parseCSV(filePath);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      gradeData = parseExcel(filePath);
    } else {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Please upload CSV or Excel file.',
      });
    }
    
    // Validate data
    if (!validateGradeData(gradeData)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Please ensure your file has columns: name, subject, grade',
      });
    }
    
    // Save to database
    const savedGrades = await Grade.insertMany(gradeData);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Grades uploaded successfully',
      grades: gradeData,
      count: gradeData.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload grades',
      error: error.message,
    });
  }
};

/**
 * Generate AI insights from grade data
 */
export const generateInsights = async (req, res) => {
  try {
    const { gradeData } = req.body;
    
    if (!gradeData || !Array.isArray(gradeData) || gradeData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid grade data provided',
      });
    }
    
    // Generate insights using Gemini AI
    const insights = await generateAIInsights(gradeData);
    
    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message,
    });
  }
};
