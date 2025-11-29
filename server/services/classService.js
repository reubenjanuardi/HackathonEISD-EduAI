import { supabase } from '../config/supabase.js';

class ClassService {
  /**
   * Generate random enrollment code
   */
  static generateEnrollmentCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new class
   * Note: subject and color are stored in description as JSON metadata until DB is updated
   */
  static async createClass(teacherId, { name, description, subject, color }) {
    const class_code = this.generateEnrollmentCode();
    
    // Store metadata in description as JSON for now
    const metadata = JSON.stringify({ subject: subject || 'General', color: color || '#6366f1', description: description || '' });
    
    const { data, error } = await supabase
      .from('classes')
      .insert([{ 
        name, 
        description: metadata,
        class_code,
        teacher_id: teacherId 
      }])
      .select();

    if (error) throw new Error(`Failed to create class: ${error.message}`);
    
    // Parse metadata back for response
    const classData = data?.[0];
    if (classData) {
      try {
        const meta = JSON.parse(classData.description);
        classData.subject = meta.subject;
        classData.color = meta.color;
        classData.description = meta.description;
        classData.enrollment_code = classData.class_code;
      } catch (e) {
        classData.subject = 'General';
        classData.color = '#6366f1';
        classData.enrollment_code = classData.class_code;
      }
    }
    return classData;
  }

  /**
   * Get all classes for a teacher
   */
  static async getTeacherClasses(teacherId) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) throw new Error(`Failed to fetch classes: ${error.message}`);
    
    // Parse metadata from description
    return (data || []).map(cls => {
      try {
        const meta = JSON.parse(cls.description);
        return {
          ...cls,
          subject: meta.subject || 'General',
          color: meta.color || '#6366f1',
          description: meta.description || '',
          enrollment_code: cls.class_code
        };
      } catch (e) {
        return {
          ...cls,
          subject: 'General',
          color: '#6366f1',
          enrollment_code: cls.class_code
        };
      }
    });
  }

  /**
   * Get a specific class with members
   */
  static async getClassDetail(classId) {
    // First, get the class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError) throw new Error(`Failed to fetch class: ${classError.message}`);
    
    // Then, get class members with their user info separately
    const { data: members, error: membersError } = await supabase
      .from('class_members')
      .select('id, student_id, status, joined_at')
      .eq('class_id', classId)
      .eq('status', 'active');

    if (membersError) {
      console.error('Failed to fetch class members:', membersError.message);
    }

    // Get user details for each member
    const enrollments = [];
    if (members && members.length > 0) {
      const studentIds = members.map(m => m.student_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', studentIds);

      if (usersError) {
        console.error('Failed to fetch user details:', usersError.message);
      }

      // Create a map for quick lookup
      const userMap = new Map((users || []).map(u => [u.id, u]));

      // Build enrollments array
      for (const member of members) {
        const user = userMap.get(member.student_id);
        enrollments.push({
          id: member.id,
          student_id: member.student_id,
          enrolled_at: member.joined_at,
          status: member.status,
          profiles: user || { id: member.student_id, name: 'User Not Found', email: '' }
        });
      }
    }
    
    // Parse metadata from description
    let subject = 'General';
    let color = '#6366f1';
    let description = classData.description || '';
    
    try {
      const meta = JSON.parse(classData.description);
      subject = meta.subject || 'General';
      color = meta.color || '#6366f1';
      description = meta.description || '';
    } catch (e) {
      // description is not JSON, use as-is
    }
    
    return {
      ...classData,
      subject,
      color,
      description,
      enrollment_code: classData.class_code,
      enrollments
    };
  }

  /**
   * Update a class
   */
  static async updateClass(classId, updates) {
    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', classId)
      .select();

    if (error) throw new Error(`Failed to update class: ${error.message}`);
    return data?.[0];
  }

  /**
   * Delete a class
   */
  static async deleteClass(classId) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) throw new Error(`Failed to delete class: ${error.message}`);
    return true;
  }

  /**
   * Enroll a student to a class
   */
  static async enrollStudent(classId, studentId) {
    const { data, error } = await supabase
      .from('class_members')
      .insert([{ class_id: classId, student_id: studentId, status: 'active' }])
      .select();

    if (error) throw new Error(`Failed to enroll student: ${error.message}`);
    return data?.[0];
  }

  /**
   * Remove a student from a class
   */
  static async unenrollStudent(classId, studentId) {
    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (error) throw new Error(`Failed to unenroll student: ${error.message}`);
    return true;
  }

  /**
   * Get a class by class code (for student enrollment)
   */
  static async getClassByCode(classCode) {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, teacher_id, class_code')
      .eq('class_code', classCode)
      .single();

    if (error) throw new Error(`Class not found: ${error.message}`);
    return { ...data, enrollment_code: data.class_code };
  }

  /**
   * Get student's enrolled classes
   */
  static async getStudentClasses(studentId) {
    const { data, error } = await supabase
      .from('class_members')
      .select(`
        class_id,
        enrolled_at:joined_at,
        classes (id, name, description, class_code, created_at)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) throw new Error(`Failed to fetch student classes: ${error.message}`);
    
    // Parse metadata and restructure for frontend
    return (data || []).map(enrollment => {
      const cls = enrollment.classes;
      if (!cls) return null;
      
      let subject = 'General';
      let color = '#6366f1';
      let description = cls.description || '';
      
      try {
        const meta = JSON.parse(cls.description);
        subject = meta.subject || 'General';
        color = meta.color || '#6366f1';
        description = meta.description || '';
      } catch (e) {
        // description is not JSON, use as-is
      }
      
      return {
        id: enrollment.class_id,
        enrolled_at: enrollment.enrolled_at,
        classes: {
          ...cls,
          subject,
          color,
          description,
          enrollment_code: cls.class_code
        }
      };
    }).filter(Boolean);
  }
}

export default ClassService;
