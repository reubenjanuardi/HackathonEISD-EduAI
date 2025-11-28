# #️⃣ 1. BACKEND PLAN (Express + Supabase + AIML)

## 1.1 API Architecture Overview

Create or update the following API route groups:

### **Classes**

* `POST /classes` — create class
* `GET /classes` — list classes
* `GET /classes/:id` — class detail + members
* `PUT /classes/:id` — update class
* `DELETE /classes/:id` — delete class
* `POST /classes/:id/enroll` — enroll student
* `DELETE /classes/:id/unenroll/:userId` — remove student

### **Materials**

* `POST /materials/upload` — upload material file or link
* `GET /materials/:classId` — list materials
* `GET /materials/detail/:id` — view material
* `POST /materials/:id/summarize` — AIML summary

### **Quiz Generation (AIML)**

* `POST /quiz/generate`
  * Input: classId, materialId or raw text
  * Output: MCQ questions + difficulty metadata

### **Quizzes**

* `POST /quizzes` — create quiz
* `PUT /quizzes/:id` — update quiz
* `DELETE /quizzes/:id` — delete quiz
* `POST /quizzes/:id/publish` — assign to class

### **Student Attempts**

* `POST /attempts/start`
* `POST /attempts/submit`
* `GET /attempts/:quizId/:studentId`
* `DELETE /attempts/:id`

### **Analytics**

* `GET /analytics/class/:id`
* `GET /analytics/quiz/:id`

### **AI Insights (AIML)**

* `POST /insights/generate`
  * Input: quiz results
  * Output: teacher performance insights

### **Exporting Grades**

* `GET /export/grades/:classId` (CSV/XLS/XLSX)

---

## 1.2 Supabase Database Schema

### **Tables**

<pre class="overflow-visible!" data-start="1913" data-end="2655"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>users
</span><span>- id (uuid, PK)</span><span>
</span><span>- name</span><span>
</span><span>- email</span><span>
</span><span>- role (teacher/student)</span><span>
</span><span>- created_at</span><span>

classes
</span><span>- id (uuid)</span><span>
</span><span>- name</span><span>
</span><span>- description</span><span>
</span><span>- teacher_id (FK → users.id)</span><span>
</span><span>- created_at</span><span>

class_members
</span><span>- id (uuid)</span><span>
</span><span>- class_id (FK)</span><span>
</span><span>- student_id (FK)</span><span>
</span><span>- status (active/inactive)</span><span>

materials
</span><span>- id</span><span>
</span><span>- class_id (FK)</span><span>
</span><span>- title</span><span>
</span><span>- type (pdf, video, link)</span><span>
</span><span>- file_url</span><span>
</span><span>- ai_summary (text)</span><span>

quizzes
</span><span>- id</span><span>
</span><span>- class_id (FK)</span><span>
</span><span>- title</span><span>
</span><span>- description</span><span>
</span><span>- published (bool)</span><span>

quiz_questions
</span><span>- id</span><span>
</span><span>- quiz_id (FK)</span><span>
</span><span>- question</span><span>
</span><span>- options (json)</span><span>
</span><span>- answer</span><span>
</span><span>- difficulty</span><span>

quiz_attempts
</span><span>- id</span><span>
</span><span>- quiz_id (FK)</span><span>
</span><span>- student_id (FK)</span><span>
</span><span>- score</span><span>
</span><span>- created_at</span><span>

attempt_answers
</span><span>- id</span><span>
</span><span>- attempt_id (FK)</span><span>
</span><span>- question_id (FK)</span><span>
</span><span>- student_answer</span><span>
</span><span>- correct (bool)</span><span>

ai_insights
</span><span>- id</span><span>
</span><span>- class_id</span><span>
</span><span>- quiz_id</span><span>
</span><span>- summary</span><span>
</span><span>- recommendations</span><span>
</span></span></code></div></div></pre>

### **RLS Policies**

* Teachers can manage classes they own
* Students can only read materials/quizzes of enrolled classes
* Attempts belong only to the student who created them

---

## 1.3 Backend Services

### **ClassService**

* CRUD classes
* Manage membership
* Validate teacher ownership

### **MaterialService**

* File upload via Supabase Storage
* Generate summary via AIML

### **QuizService**

* CRUD quizzes
* Validate class relationships
* Handle question pools

### **AIService (AIML)**

* Prompt builder for quiz generation
* Material summarization
* Insights generation

### **AnalyticsService**

* Compute class-level performance
* Identify at-risk students
* Calculate difficulty heatmap

### **ExportService**

* Convert Supabase rows → CSV/XLSX

---

## 1.4 AIML Integration Plan

Keep current AIML client. Add methods:

### **Prompt: Quiz Generation**

<pre class="overflow-visible!" data-start="3560" data-end="3723"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>Generate </span><span>10</span><span> multiple-choice questions based </span><span>on</span><span></span><span>this</span><span> material:
{{content}}

Return JSON: question, </span><span>4</span><span> options, correct answer, difficulty (easy/medium/hard).
</span></span></code></div></div></pre>

### **Prompt: Material Summary**

<pre class="overflow-visible!" data-start="3758" data-end="3844"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>Summarize the following educational material </span><span>into</span><span></span><span>5</span><span> bullet points.
{{content}}
</span></span></code></div></div></pre>

### **Prompt: Teacher Insight**

<pre class="overflow-visible!" data-start="3878" data-end="3988"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>Analyze </span><span>class</span><span></span><span>quiz</span><span></span><span>results</span><span></span><span>and</span><span></span><span>highlight</span><span></span><span>weak</span><span></span><span>areas</span><span>, </span><span>strong</span><span></span><span>areas</span><span>, </span><span>and</span><span></span><span>recommendations</span><span>.
Data: {{json}}
</span></span></code></div></div></pre>

### **Prompt: Student Recommendation**

<pre class="overflow-visible!" data-start="4029" data-end="4131"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>Based</span><span></span><span>on</span><span> this student's performance, suggest 3 personalized learning recommendations.
{{json}}
</span></span></code></div></div></pre>

---

# #️⃣ 2. FRONTEND PLAN (React + Tailwind)

## 2.1 Pages (Teacher)

### **Class Management**

* Class list
* Class detail
* Add/edit class
* Manage students

### **Materials**

* Upload material page
* Material viewer
* AI summary panel

### **Quiz Generator**

* Select material
* Generate quiz (AIML)
* Edit questions
* Save

### **Quiz CRUD**

* List quizzes
* Edit quiz
* Assign to class

### **Teacher Dashboard**

* Average score card
* At-risk students
* Difficulty heatmap
* Performance charts

### **AI Insights Page**

* AI-generated insights
* Recommended actions

---

## 2.2 Pages (Student)

### **Enrollment**

* Enter class code
* View enrolled classes

### **Materials**

* Material list
* View content
* Progress tracker

### **Adaptive Quiz**

* Question UI
* Difficulty adjustments
* Results breakdown

### **Student Dashboard**

* Scores
* Topic mastery
* AI recommendations

---

## 2.3 UI Components

* `Button`
* `Card`
* `Modal`
* `Toast`
* `ProgressIndicator`
* `StatusChip`
* `FileUpload`
* `Table`
* `ChartWrapper`

---

## 2.4 State Management

Recommended: **Zustand**
Reason:

* Lightweight
* Simple global state
* Works well with async API patterns

---

# #️⃣ 3. SUPABASE PLAN

## 3.1 Auth Model

Use Supabase Auth:

* Teacher role
* Student role

Store role in `users.role`.

## 3.2 Storage

Use Supabase Storage bucket:

* `/materials/{classId}/{file}`

## 3.3 RLS

Example RLS:

* Teachers: access only their classes
* Students: access only enrolled classes

## 3.4 Real-Time Subscriptions (optional)

* Real-time quiz results
* Real-time class updates

---

# #️⃣ 4. AIML WORKFLOW PLAN

### 4.1 Validation Before Sending to AI

* Ensure material content size limit
* Ensure quiz has enough content
* Clean inputs

### 4.2 Error Fallbacks

* If AIML fails, use:
  * cached insights
  * manual fallback

### 4.3 AIML Response Normalization

* Standardize JSON before inserting into Supabase

---

# #️⃣ 5. IMPLEMENTATION ROADMAP

## **Phase 1 — Supabase Setup**

* Create schema
* Add RLS policies
* Configure storage
* Test connections

## **Phase 2 — Backend Expansion**

* Create new routes & services
* Connect Supabase queries
* Add AIML endpoints
* Implement validation middleware

## **Phase 3 — Frontend Pages**

* Build class management
* Build materials UI
* Build quiz builder & generator
* Build analytics dashboard

## **Phase 4 — AIML Integration**

* Implement prompt templates
* Connect backend routes to AIML
* Handle all edge cases

## **Phase 5 — Testing**

* Test API flows
* Simulate teacher & student journeys
* Validate adaptive quiz logic

## **Phase 6 — Final Polish**

* Improve UX
* Optimize loading states
* Add empty/error states
* Final cleanup

---

# 📌 END OF PLAN

**No code should be generated yet.**
AI Agent should now ask:

> “Do you confirm I should proceed with implementation according to this plan?”
>
