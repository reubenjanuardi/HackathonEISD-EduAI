import fs from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';

/**
 * Parse CSV file and extract grade data
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} - Parsed grade data
 */
export const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Normalize the data structure
        const grade = {
          name: data.name || data.Name || data.student || data.Student || '',
          subject: data.subject || data.Subject || '',
          grade: parseFloat(data.grade || data.Grade || data.score || data.Score || 0),
          date: data.date || data.Date || new Date().toISOString().split('T')[0],
        };
        results.push(grade);
      })
      .on('end', () => {
        if (results.length === 0) {
          reject(new Error('CSV file is empty or has no valid data rows'));
        } else {
          resolve(results);
        }
      })
      .on('error', (error) => {
        reject(new Error(`Failed to parse CSV file: ${error.message}`));
      });
  });
};

/**
 * Parse Excel file and extract grade data
 * @param {string} filePath - Path to Excel file
 * @returns {Array} - Parsed grade data
 */
export const parseExcel = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw new Error('Excel file has no sheets');
    }
    
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    if (!data || data.length === 0) {
      throw new Error('Excel sheet is empty or has no data rows');
    }
    
    // Normalize the data structure
    const results = data.map(row => ({
      name: row.name || row.Name || row.student || row.Student || '',
      subject: row.subject || row.Subject || '',
      grade: parseFloat(row.grade || row.Grade || row.score || row.Score || 0),
      date: row.date || row.Date || new Date().toISOString().split('T')[0],
    }));
    
    return results;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

/**
 * Validate grade data
 * @param {Array} data - Grade data to validate
 * @returns {boolean} - True if valid
 */
export const validateGradeData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  
  return data.every(row => {
    // Check required fields
    if (!row.name || !row.subject) {
      return false;
    }
    
    // Validate grade is a number between 0-100
    const gradeNum = typeof row.grade === 'string' 
      ? parseFloat(row.grade) 
      : row.grade;
    
    if (typeof gradeNum !== 'number' || isNaN(gradeNum)) {
      return false;
    }
    
    if (gradeNum < 0 || gradeNum > 100) {
      return false;
    }
    
    return true;
  });
};
