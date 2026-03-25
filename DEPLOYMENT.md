# Baqala - Deployment Guide

## Prerequisites
- **Node.js** v18+ (LTS recommended)
- **MongoDB** v6+ (local or Atlas cloud)
- **Git**

---

## Local Development

### 1. Clone & Configure
```bash
cd "d:\baqala project"

# Backend config
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

### 2. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Start MongoDB
```bash
# If using local MongoDB:
mongod --dbdir="C:\data\db"
# Or use MongoDB Atlas (update MONGODB_URI in .env)
```

### 4. Seed Admin Account (optional)
Open a Node REPL in the server directory:
```js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.create({
    name: 'Admin', email: 'admin@baqala.com',
    password: 'admin123', role: 'admin'
  });
  console.log('Admin created');
  process.exit();
});
```

### 5. Run Servers
```bash
# Terminal 1 - Backend (port 5000)
cd server && npm run dev

# Terminal 2 - Frontend (port 5173)
cd client && npm run dev
```

Visit **http://localhost:5173**

---

## Production Deployment

### Backend (Railway / Render / VPS)
1. Set environment variables (MONGODB_URI, JWT_SECRET, CLIENT_URL)
2. `npm start` runs `node server.js`
3. Configure reverse proxy (nginx) if on VPS

### Frontend (Vercel / Netlify)
1. Build: `npm run build` (outputs to `dist/`)
2. Set `VITE_API_URL` environment variable to backend URL
3. Update `vite.config.js` proxy or use env-based API URL

### MongoDB (Atlas)
1. Create free M0 cluster at mongodb.com/atlas
2. Whitelist IPs and create database user
3. Use connection string in server `.env`

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/profile | Yes | Profile |
| GET | /api/apps | No | List apps |
| GET | /api/apps/:id | No | App detail |
| POST | /api/apps | Dev | Upload app |
| POST | /api/reviews/:appId | User | Add review |
| POST | /api/downloads/:appId | No | Download |
| GET | /api/admin/stats | Admin | Stats |
| PUT | /api/admin/apps/:id/status | Admin | Approve/reject |
