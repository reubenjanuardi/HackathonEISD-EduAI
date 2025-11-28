# 🔧 Troubleshooting Upload & Quiz Features

Based on testing, here's what I found and how to fix the issues:

## 🧪 Quiz Feature

### Status: ✅ **Backend API is working**

**Test Results:**
- ✅ `/api/quiz/start` - Working perfectly
- ✅ `/api/quiz/answer` - Working (requires valid session)
- ⚠️ Quiz sessions are stored **in-memory** (lost on server restart)

### Common Issues & Solutions:

#### Issue 1: "Failed to submit answer" after server restart
**Cause**: Quiz sessions are stored in RAM, not database.

**Solution**:
1. Don't restart the server mid-quiz
2. If you must restart, start a new quiz from the beginning

#### Issue 2: Quiz not loading
**Check**:
1. F12 → Console tab → Check for errors
2. F12 → Network tab →  Look for failed API calls
3. Make sure you're logged in first

### How to Test Successfully:
```
1. Login with teacher/password123
2. Click "Start Quiz"
3. Answer question → Click "Next Question"
4. Complete all 10 questions
5. View results with AI recommendations
```

---

## 📤 Grade Upload Feature

### Common Issues & Solutions:

#### Issue 1: "Failed to upload grades"

**Possible Causes:**
1. **File format issue** - Only CSV and Excel (.xlsx, .xls) supported
2. **Missing columns** - File must have: name, subject, grade, date
3. **CORS error** - Frontend can't reach backend
4. **Server not running** - Backend must be on port 5000

**Solutions:**

**✅ Use the sample file**:
```bash
# Upload this file from project root:
sample-grades.csv
```

**✅ Check file format**:
Your CSV/Excel must have these columns:
```, name
subject,grade,date
Alice Johnson,Mathematics,92,2025-11-20
```

**✅ Check console errors**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Upload file
4. Note any error messages

**✅ Verify backend is running**:
Open: http://localhost:5000/api/health
Should show: `{"status":"OK"...}`

#### Issue 2: Upload works but no AI insights

**Cause**: AI/ML API key not configured

**Solution**:
1. Get free API key: https://aimlapi.com/
2. Add to `server/.env`:
   ```
   AIML_API_KEY=your_key_here
   ```
3. Restart server: `npm run dev`

---

## 🐛 General Debugging Steps

### Step 1: Check Browser Console
```
1. Press F12 (Dev Tools)
2. Click Console tab
3. Try the action that fails
4. Look for red error messages
```

### Step 2: Check Network Tab
```
1. Press F12
2. Click Network tab
3. Try the action
4. Look for failed requests (red)
5. Click on failed request
6. Check "Response" tab for error message
```

### Step 3: Check Server Terminal
```
Look for error messages in the terminal where you ran `npm run dev`
```

### Step 4: Restart Everything
```bash
# Kill all processes
Ctrl+C in all terminals

# Restart
npm run dev
```

---

## ✅ Quick Test Checklist

### Upload Grades:
- [ ] Server running on port 5000
- [ ] Logged in to frontend
- [ ] Using `sample-grades.csv` file
- [ ] File has correct columns (name, subject, grade, date)
- [ ] Browser console shows no CORS errors

### Quiz:
- [ ] Server running (quiz sessions are in-memory)
- [ ] Logged in to frontend
- [ ] Started quiz from dashboard
- [ ] Haven't restarted server mid-quiz
- [ ] Answering questions one by one

---

## 🚨 If Still Not Working

**Share these details:**
1. Screenshot of browser console errors (F12 → Console)
2. Screenshot of network tab errors (F12 → Network)
3. Copy exact error message from terminal
4. Which feature: Upload or Quiz?
5. What step fails exactly?

---

## 💡 Tips

**Upload:**
- Start with `sample-grades.csv` - guaranteed to work
- AI insights require API key (optional)
- File must match format exactly

**Quiz:**
- Complete in one session (don't restart server)
- AI recommendations require API key (optional)
- Sessions reset on server restart

**Both:**
- Check F12 console for errors
- Verify backend health: http://localhost:5000/api/health
- Make sure you're logged in

---

*Servers must be running: Frontend (5174) + Backend (5000)*
