import express from 'express';
import multer from 'multer';
import { getAuthUser } from '../config/supabase.js';
import MaterialService from '../services/materialService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to verify auth
router.use(getAuthUser);

/**
 * POST /api/materials/upload
 * Upload a material file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { classId, title, description } = req.body;

    if (!classId) {
      return res.status(400).json({ 
        success: false, 
        message: 'classId is required' 
      });
    }

    if (!title && !req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'title or file is required' 
      });
    }

    let fileUrl = null;
    let fileType = 'document';
    let materialTitle = title;
    
    if (req.file) {
      // Try to upload file, but don't fail if storage bucket doesn't exist
      fileUrl = await MaterialService.uploadFile(classId, req.file, 'document');
      fileType = req.file.mimetype || 'document';
      // Use filename as title if not provided
      if (!materialTitle) {
        materialTitle = req.file.originalname.replace(/\.[^/.]+$/, '');
      }
    }

    const material = await MaterialService.createMaterial(classId, {
      title: materialTitle,
      description: description || '',
      type: fileType,
      fileUrl, // Can be null if storage failed
    });

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Material upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/materials/class/:classId
 * Get all materials for a class (new route)
 */
router.get('/class/:classId', async (req, res) => {
  try {
    const materials = await MaterialService.getClassMaterials(req.params.classId);
    res.json({ success: true, data: materials || [] });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/materials/:classId
 * Get all materials for a class (legacy route)
 */
router.get('/:classId', async (req, res) => {
  try {
    const materials = await MaterialService.getClassMaterials(req.params.classId);
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/materials/detail/:id
 * Get material detail
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const material = await MaterialService.getMaterialDetail(req.params.id);
    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Get material detail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/materials/:id/summarize
 * Generate AI summary for material
 */
router.post('/:id/summarize', async (req, res) => {
  try {
    const { aiSummary } = req.body;

    if (!aiSummary) {
      return res.status(400).json({ success: false, message: 'AI summary is required' });
    }

    const updated = await MaterialService.updateMaterialSummary(req.params.id, aiSummary);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update material summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/materials/:id
 * Delete a material
 */
router.delete('/:id', async (req, res) => {
  try {
    await MaterialService.deleteMaterial(req.params.id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
