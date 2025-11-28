# 🚀 EduAI Deployment Guide for Netlify & Backend

This guide will help you deploy EduAI to production on Netlify (frontend) and a backend service like Render or Railway.

---

## 📋 Prerequisites

Before deploying, you'll need:
- GitHub account with the repo pushed
- MongoDB Atlas account with a cluster
- AI/ML API key from https://aimlapi.com/
- Netlify account
- Backend hosting service (Render, Railway, or Heroku)

---

## 🔧 Step 1: Setup MongoDB Atlas (Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new cluster (free tier available)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database user's password
8. Save this string - you'll need it later

Example connection string:
```
mongodb+srv://username:password@cluster0.xmp5b30.mongodb.net/eduai?retryWrites=true&w=majority
```

---

## 🔑 Step 2: Get AI/ML API Key

1. Go to https://aimlapi.com/
2. Sign up for a free account
3. Go to your API keys dashboard
4. Create a new API key
5. Copy and save it securely

---

## 📱 Step 3: Deploy Frontend to Netlify

### Option A: Using GitHub (Recommended)

1. Push your code to GitHub
2. Go to https://netlify.com and sign in
3. Click "New site from Git"
4. Select GitHub and authorize
5. Select your repository
6. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
7. Add environment variables:
   - Click "Environment" → "Environment variables"
   - Add: `VITE_API_URL=<your-backend-url>` (e.g., `https://eduai-api.onrender.com`)
8. Click "Deploy site"

### Option B: Manual Deploy

```bash
# Build the client
cd client
npm run build

# Deploy the dist folder to Netlify
# You can drag & drop the dist folder into Netlify
```

---

## 🔗 Step 4: Deploy Backend

### Using Render (Recommended for simplicity)

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Select "Deploy an existing Git repository"
4. Authorize GitHub and select your repo
5. Configure:
   - **Name**: `eduai-api`
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
6. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `AIML_API_KEY`: Your AI/ML API key
   - `CLIENT_URL`: Your Netlify frontend URL (e.g., `https://your-app.netlify.app`)
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render default)
7. Click "Create Web Service"
8. Copy your service URL (e.g., `https://eduai-api.onrender.com`)

### Using Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables (same as above)
5. Railway will auto-detect and deploy

---

## 🔄 Step 5: Connect Frontend to Backend

1. After backend is deployed, copy its URL
2. Go back to Netlify settings for your frontend
3. Go to "Environment" → "Environment variables"
4. Update `VITE_API_URL` to your backend URL
5. Trigger a redeploy by pushing a change or manually rebuilding

---

## ✅ Step 6: Test Your Deployment

1. Open your Netlify URL in browser
2. Login with: `teacher` / `password123`
3. Test features:
   - Dashboard loads data
   - Upload sample grades
   - Generate AI insights
   - Start and complete a quiz

---

## 🐛 Troubleshooting

### Frontend not connecting to backend
- Check `VITE_API_URL` environment variable
- Ensure backend server is running
- Check browser console for CORS errors

### Database connection fails
- Verify MongoDB Atlas connection string
- Check IP whitelist in MongoDB (allow all IPs for now)
- Ensure database user has correct password

### AI insights not working
- Check `AIML_API_KEY` is set correctly
- Verify API key is active on AI/ML API dashboard
- Check server logs for API errors

### Build fails on Netlify
- Check build logs in Netlify dashboard
- Ensure all dependencies are installed
- Verify `package.json` scripts are correct

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore` and NOT pushed to GitHub
- [ ] API keys are stored as environment variables, not in code
- [ ] MongoDB password is not visible in connection string URL
- [ ] CORS is configured with your frontend URL only
- [ ] Backend is deployed with `NODE_ENV=production`

---

## 📚 Environment Variables Summary

### Frontend (Netlify)
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Backend (Render/Railway)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduai
AIML_API_KEY=your_aiml_api_key_here
CLIENT_URL=https://your-app.netlify.app
NODE_ENV=production
PORT=10000 (or whatever your service provides)
```

---

## 🎉 You're Done!

Your EduAI application is now live! Share your Netlify URL with users to access the platform.

**Frontend**: https://your-app.netlify.app
**Backend API**: https://your-backend.onrender.com/api

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service-specific documentation:
   - Netlify: https://docs.netlify.com/
   - Render: https://render.com/docs
   - MongoDB: https://docs.atlas.mongodb.com/
   - AI/ML API: https://docs.aimlapi.com/
