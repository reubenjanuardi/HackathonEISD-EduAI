import { supabase } from '../config/supabase.js';

class ExportService {
  /**
   * Export class grades as CSV
   */
  static async exportClassGradesCSV(classId) {
    try {
      // Get class members and their quiz attempts
      const { data: classMembers, error: cmError } = await supabase
        .from('class_members')
        .select('user_id')
        .eq('class_id', classId);

      if (cmError) throw new Error(`Class members query error: ${cmError.message}`);

      // Get all quizzes in class
      const { data: quizzes, error: qError } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('class_id', classId);

      if (qError) throw new Error(`Quizzes query error: ${qError.message}`);

      const quizIds = quizzes.map(q => q.id);

      // Get all attempts
      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .in('quiz_id', quizIds);

      if (aError) throw new Error(`Attempts query error: ${aError.message}`);

      // Build CSV
      let csv = 'Student ID,Student Name';
      quizzes.forEach(q => {
        csv += `,${q.title.replace(/,/g, '')}`;
      });
      csv += ',Average\n';

      for (const member of classMembers) {
        const { data: user } = await supabase
          .from('users')
          .select('name')
          .eq('id', member.user_id)
          .single();

        csv += `${member.user_id},"${user?.name || 'Unknown'}"`;

        let total = 0;
        let count = 0;

        for (const quiz of quizzes) {
          const attempt = attempts.find(a => a.student_id === member.user_id && a.quiz_id === quiz.id);
          const score = attempt ? attempt.score : '-';
          csv += `,${score}`;
          if (attempt) {
            total += attempt.score;
            count++;
          }
        }

        const average = count > 0 ? (total / count).toFixed(2) : '-';
        csv += `,${average}\n`;
      }

      return csv;
    } catch (error) {
      console.error('Export grades CSV error:', error);
      throw error;
    }
  }

  /**
   * Export class grades as XLSX
   */
  static async exportClassGradesXLSX(classId) {
    try {
      const csv = await this.exportClassGradesCSV(classId);
      
      // Convert CSV to XLSX using a simple implementation
      // For production, use xlsx library
      const { default: XLSX } = await import('xlsx');

      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const row = lines[i].split(',');
          const obj = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx];
          });
          data.push(obj);
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Grades');

      return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    } catch (error) {
      console.error('Export grades XLSX error:', error);
      throw error;
    }
  }

  /**
   * Export quiz results as CSV
   */
  static async exportQuizResultsCSV(quizId) {
    try {
      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId);

      if (aError) throw new Error(`Attempts query error: ${aError.message}`);

      let csv = 'Student ID,Student Name,Score,Submitted At,Time Spent (mins)\n';

      for (const attempt of attempts) {
        const { data: user } = await supabase
          .from('users')
          .select('name')
          .eq('id', attempt.student_id)
          .single();

        const timeSpent = attempt.submitted_at 
          ? Math.round((new Date(attempt.submitted_at) - new Date(attempt.started_at)) / 60000)
          : '-';

        csv += `${attempt.student_id},"${user?.name || 'Unknown'}",${attempt.score},"${attempt.submitted_at || '-'}",${timeSpent}\n`;
      }

      return csv;
    } catch (error) {
      console.error('Export quiz results CSV error:', error);
      throw error;
    }
  }

  /**
   * Export student transcript
   */
  static async exportStudentTranscript(studentId) {
    try {
      // Get student info
      const { data: student, error: sError } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .single();

      if (sError) throw new Error(`Student not found: ${sError.message}`);

      // Get all classes for student
      const { data: classMembers, error: cmError } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', studentId);

      if (cmError) throw new Error(`Class members query error: ${cmError.message}`);

      const classIds = classMembers.map(cm => cm.class_id);

      // Get all attempts across classes
      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quiz_id (
            id,
            title,
            class_id,
            class:class_id (id, name)
          )
        `)
        .eq('student_id', studentId)
        .in('quiz:quiz_id.class_id', classIds);

      if (aError) throw new Error(`Attempts query error: ${aError.message}`);

      // Use xlsx library
      const { default: XLSX } = await import('xlsx');

      const data = attempts.map(a => ({
        Class: a.quiz.class.name,
        Quiz: a.quiz.title,
        Score: a.score,
        'Submitted At': a.submitted_at ? new Date(a.submitted_at).toLocaleString() : 'Not submitted',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transcript');

      // Add summary sheet
      const totalAttempts = attempts.length;
      const avgScore = totalAttempts > 0 
        ? (attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts).toFixed(2)
        : 0;

      const summary = XLSX.utils.json_to_sheet([
        { Field: 'Student Name', Value: student.name },
        { Field: 'Student ID', Value: student.id },
        { Field: 'Email', Value: student.email },
        { Field: 'Total Quiz Attempts', Value: totalAttempts },
        { Field: 'Average Score', Value: avgScore },
      ]);

      XLSX.utils.book_append_sheet(workbook, summary, 'Summary');

      return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    } catch (error) {
      console.error('Export transcript error:', error);
      throw error;
    }
  }

  /**
   * Export comprehensive class analytics report
   */
  static async exportClassAnalyticsReport(classId) {
    try {
      // Get class info
      const { data: classInfo, error: cError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (cError) throw new Error(`Class not found: ${cError.message}`);

      // Get all quizzes and attempts
      const { data: quizzes, error: qError } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('class_id', classId);

      if (qError) throw new Error(`Quizzes query error: ${qError.message}`);

      const quizIds = quizzes.map(q => q.id);

      const { data: attempts, error: aError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .in('quiz_id', quizIds);

      if (aError) throw new Error(`Attempts query error: ${aError.message}`);

      // Use xlsx library
      const { default: XLSX } = await import('xlsx');

      // Create summary sheet
      const totalAttempts = attempts.length;
      const avgScore = totalAttempts > 0
        ? (attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts).toFixed(2)
        : 0;

      const summary = XLSX.utils.json_to_sheet([
        { Metric: 'Class Name', Value: classInfo.name },
        { Metric: 'Total Quizzes', Value: quizzes.length },
        { Metric: 'Total Attempts', Value: totalAttempts },
        { Metric: 'Average Score', Value: avgScore },
        { Metric: 'Pass Rate (>60%)', Value: `${((attempts.filter(a => a.score >= 60).length / totalAttempts) * 100).toFixed(1)}%` },
      ]);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summary, 'Summary');

      // Create quiz breakdown sheet
      const quizData = quizzes.map(q => {
        const quizAttempts = attempts.filter(a => a.quiz_id === q.id);
        const avgQScore = quizAttempts.length > 0
          ? (quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length).toFixed(2)
          : 0;

        return {
          'Quiz Title': q.title,
          'Attempts': quizAttempts.length,
          'Average Score': avgQScore,
          'Min Score': quizAttempts.length > 0 ? Math.min(...quizAttempts.map(a => a.score)) : '-',
          'Max Score': quizAttempts.length > 0 ? Math.max(...quizAttempts.map(a => a.score)) : '-',
        };
      });

      const quizSheet = XLSX.utils.json_to_sheet(quizData);
      XLSX.utils.book_append_sheet(workbook, quizSheet, 'Quiz Breakdown');

      // Create all attempts sheet
      const attemptsData = attempts.map(a => ({
        'Quiz ID': a.quiz_id,
        'Student ID': a.student_id,
        'Score': a.score,
        'Submitted': a.submitted_at ? new Date(a.submitted_at).toLocaleString() : 'Incomplete',
      }));

      const attemptsSheet = XLSX.utils.json_to_sheet(attemptsData);
      XLSX.utils.book_append_sheet(workbook, attemptsSheet, 'All Attempts');

      return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    } catch (error) {
      console.error('Export analytics error:', error);
      throw error;
    }
  }
}

export default ExportService;
