# 🔄 Switching to AI/ML API - Quick Setup Guide

## ✅ What Changed

Your EduAI application now uses **AI/ML API** instead of Google Gemini!

### Why AI/ML API?
- ✅ **Free Tier Available** - Perfect for hackathons and MVPs
- ✅ **OpenAI-Compatible** - Uses familiar OpenAI SDK
- ✅ **200+ Models** - Access to GPT-4o-mini, Claude, DeepSeek, and more
- ✅ **Simple Integration** - Just change base URL and API key

---

## 🚀 Setup Instructions

### Step 1: Get Your Free API Key

1. Go to https://aimlapi.com/
2. Sign up for a free account
3. Navigate to your API keys section
4. Copy your API key

### Step 2: Update Your `.env` File

Edit `server/.env` and add your API key:

```env
# AI/ML API Configuration
AIML_API_KEY=your_actual_api_key_here
```

### Step 3: Restart Your Server

The server will automatically pick up the new configuration:

```bash
npm run dev
```

---

## 🎯 Available Models

You can now use any of these models by changing the `model` parameter in `aiService.js`:

### Recommended Models:
- **`gpt-4o-mini`** (default) - Fast, affordable, great quality
- **`gpt-3.5-turbo`** - Faster, more affordable
- **`gpt-4o`** - Best quality, slower
- **`claude-3-5-sonnet`** - Anthropic's Claude (alternative)
- **`deepseek-chat`** - Good open-source alternative

To change the model, edit `server/services/aiService.js` line 30:

```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini", // ← Change this to any supported model
  messages: [...]
});
```

---

## 💡 What Was Modified

### Files Changed:
1. ✅ `server/services/aiService.js` - Switched to OpenAI SDK with AI/ML API base URL
2. ✅ `server/package.json` - Added `openai`, removed `@google/generative-ai`
3. ✅ `server/.env.example` - Updated to show `AIML_API_KEY`
4. ✅ `server/server.js` - Updated startup warning message

### Files Unchanged:
- ❌ All controllers (no changes needed)
- ❌ All routes (no changes needed)
- ❌ Frontend (no changes needed)
- ❌ Database models (no changes needed)

---

## 🧪 Testing

Once you add your API key and restart, test the AI features:

1. **Grade Upload Insights**:
   - Upload `sample-grades.csv`
   - Click "Generate AI Insights"
   - Should see AI-generated recommendations

2. **Quiz Recommendations**:
   - Complete a quiz
   - View quiz results
   - Should see 3 personalized recommendations

---

## 📊 API Usage & Pricing

AI/ML API offers:
- **Free Tier**: Available for testing and small projects
- **Pay-as-you-go**: Competitive pricing
- Check current pricing at: https://aimlapi.com/pricing

---

## 🔧 Troubleshooting

### Issue: "API key not configured" warning
**Solution**: Make sure you copied `.env.example` to `.env` and added your actual API key

### Issue: API errors
**Solution**: Check your API key is valid at https://aimlapi.com/app/keys

### Issue: Rate limits
**Solution**: AI/ML API has rate limits on free tier. Upgrade if needed.

---

## 🎉 You're All Set!

Your EduAI application is now powered by AI/ML API with access to the latest AI models!
