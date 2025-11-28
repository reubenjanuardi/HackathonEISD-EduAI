-- RLS Policies for EduAI

-- USERS TABLE POLICIES
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- CLASSES TABLE POLICIES
CREATE POLICY "Teachers can view their own classes" ON classes
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Students can view enrolled classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_members.class_id = classes.id 
      AND class_members.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert their own classes" ON classes
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own classes" ON classes
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own classes" ON classes
  FOR DELETE USING (teacher_id = auth.uid());

-- CLASS_MEMBERS TABLE POLICIES
CREATE POLICY "Teachers can manage their class members" ON class_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_members.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own enrollment" ON class_members
  FOR SELECT USING (student_id = auth.uid());

-- MATERIALS TABLE POLICIES
CREATE POLICY "Teachers can manage their class materials" ON materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = materials.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view materials of enrolled classes" ON materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_members.class_id = materials.class_id 
      AND class_members.student_id = auth.uid()
    )
  );

-- QUIZZES TABLE POLICIES
CREATE POLICY "Teachers can manage their quizzes" ON quizzes
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Students can view published quizzes in enrolled classes" ON quizzes
  FOR SELECT USING (
    published = TRUE AND
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_members.class_id = quizzes.class_id 
      AND class_members.student_id = auth.uid()
    )
  );

-- QUIZ_QUESTIONS TABLE POLICIES
CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND quizzes.created_by = auth.uid()
    )
  );

CREATE POLICY "Students can view questions of enrolled quiz" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      JOIN class_members ON quizzes.class_id = class_members.class_id
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND class_members.student_id = auth.uid()
    )
  );

-- QUIZ_ATTEMPTS TABLE POLICIES
CREATE POLICY "Students can create their own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own attempts" ON quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts in their quizzes" ON quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_attempts.quiz_id 
      AND quizzes.created_by = auth.uid()
    )
  );

-- ATTEMPT_ANSWERS TABLE POLICIES
CREATE POLICY "Students can create their own answers" ON attempt_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts 
      WHERE quiz_attempts.id = attempt_answers.attempt_id 
      AND quiz_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own answers" ON attempt_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts 
      WHERE quiz_attempts.id = attempt_answers.attempt_id 
      AND quiz_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers in their quiz attempts" ON attempt_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      JOIN quizzes ON quiz_attempts.quiz_id = quizzes.id
      WHERE attempt_answers.attempt_id = quiz_attempts.id
      AND quizzes.created_by = auth.uid()
    )
  );

-- AI_INSIGHTS TABLE POLICIES
CREATE POLICY "Teachers can create insights for their classes" ON ai_insights
  FOR INSERT WITH CHECK (
    (insight_type = 'teacher' AND 
     EXISTS (SELECT 1 FROM classes WHERE classes.id = ai_insights.class_id AND classes.teacher_id = auth.uid()))
    OR
    (insight_type = 'student' AND user_id = auth.uid())
  );

CREATE POLICY "Teachers can view insights for their classes" ON ai_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = ai_insights.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own insights" ON ai_insights
  FOR SELECT USING (insight_type = 'student' AND user_id = auth.uid());

-- STUDENT_PROGRESS TABLE POLICIES
CREATE POLICY "Students can view their own progress" ON student_progress
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view progress in their classes" ON student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = student_progress.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );
