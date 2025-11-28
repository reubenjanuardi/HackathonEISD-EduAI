import { supabase } from '../config/supabase.js';

class MaterialService {
  /**
   * Upload a material file to Supabase Storage
   * Returns null if bucket doesn't exist (file won't be stored)
   */
  static async uploadFile(classId, file, type) {
    try {
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = `materials/${classId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('materials')
        .upload(filePath, file.buffer);

      if (error) {
        console.warn('Storage upload failed (bucket may not exist):', error.message);
        return null; // Return null instead of throwing
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.warn('Storage upload error:', error.message);
      return null; // Return null instead of throwing
    }
  }

  /**
   * Create a material record
   */
  static async createMaterial(classId, { title, description, type, fileUrl, aiSummary = null }) {
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        class_id: classId,
        title,
        description,
        type,
        file_url: fileUrl,
        ai_summary: aiSummary,
      }])
      .select();

    if (error) throw new Error(`Failed to create material: ${error.message}`);
    return data?.[0];
  }

  /**
   * Get all materials for a class
   */
  static async getClassMaterials(classId) {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch materials: ${error.message}`);
    return data;
  }

  /**
   * Get material detail
   */
  static async getMaterialDetail(materialId) {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (error) throw new Error(`Failed to fetch material: ${error.message}`);
    return data;
  }

  /**
   * Update material with AI summary
   */
  static async updateMaterialSummary(materialId, aiSummary) {
    const { data, error } = await supabase
      .from('materials')
      .update({ ai_summary: aiSummary })
      .eq('id', materialId)
      .select();

    if (error) throw new Error(`Failed to update material: ${error.message}`);
    return data?.[0];
  }

  /**
   * Delete a material
   */
  static async deleteMaterial(materialId) {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (error) throw new Error(`Failed to delete material: ${error.message}`);
    return true;
  }
}

export default MaterialService;
