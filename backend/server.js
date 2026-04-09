require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const emailRoutes   = require('./routes/email');
const contactRoutes = require('./routes/contacts');
const resumeRoutes  = require('./routes/resume');
const messageRoutes = require('./routes/message');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', emailRoutes);
app.use('/api', contactRoutes);
app.use('/api', resumeRoutes);
app.use('/api', messageRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ReachAI Backend is running 🚀' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Global Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'UNKNOWN_ERROR'
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ReachAI Backend running on http://localhost:${PORT}`);
  console.log(`📧 SES From:    ${process.env.SES_FROM_EMAIL || 'NOT SET'}`);
  console.log(`🔥 Firebase:    ${process.env.FIREBASE_PROJECT_ID || 'NOT SET'}`);
});
