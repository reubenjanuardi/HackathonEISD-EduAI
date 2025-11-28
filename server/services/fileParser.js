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
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
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
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Normalize the data structure
    const results = data.map(row => ({
      name: row.name || row.Name || row.student || row.Student || '',
      subject: row.subject || row.Subject || '',
      grade: parseFloat(row.grade || row.Grade || row.score || row.Score || 0),
      date: row.date || row.Date || new Date().toISOString().split('T')[0],
    }));
    
    return results;
  } catch (error) {
    throw new Error('Failed to parse Excel file');
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
  
  return data.every(row => 
    row.name && 
    row.subject && 
    typeof row.grade === 'number' && 
    row.grade >= 0 && 
    row.grade <= 100
  );
};
