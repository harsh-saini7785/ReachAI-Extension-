const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const pdfParse = require('pdf-parse');
const path     = require('path');
const fs       = require('fs');

// ─── File Storage ─────────────────────────────────────────────────────────────
// Saves the file as backend/uploads/resume.pdf (single-user, always overwritten)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, _file, cb) => cb(null, 'resume.pdf'),
});

const upload = multer({
  storage,
  limits:    { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed.'));
  },
});

// ─── POST /api/resume ─────────────────────────────────────────────────────────
// Receives PDF, saves it, extracts text with pdf-parse, returns summary
router.post('/resume', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const dataBuffer  = fs.readFileSync(req.file.path);
    const parsed      = await pdfParse(dataBuffer);
    const extractedText = parsed.text?.trim() || '';

    // Save extracted text alongside the PDF for quick reads
    const textPath = path.join(UPLOAD_DIR, 'resume_text.txt');
    fs.writeFileSync(textPath, extractedText, 'utf8');

    console.log(`📄 Resume uploaded (${req.file.size} bytes, ${parsed.numpages} pages)`);
    return res.json({
      success: true,
      filename: req.file.originalname,
      pages:    parsed.numpages,
      preview:  extractedText.slice(0, 300), // first 300 chars as preview
    });
  } catch (err) {
    console.error('PDF parse error:', err);
    return res.status(500).json({ error: 'Failed to parse PDF', detail: err.message });
  }
});

// ─── GET /api/resume/status ───────────────────────────────────────────────────
// Returns whether a resume exists + its text
router.get('/resume/status', (req, res) => {
  const pdfPath  = path.join(UPLOAD_DIR, 'resume.pdf');
  const textPath = path.join(UPLOAD_DIR, 'resume_text.txt');

  if (!fs.existsSync(pdfPath)) {
    return res.json({ exists: false });
  }

  const stat = fs.statSync(pdfPath);
  const text = fs.existsSync(textPath) ? fs.readFileSync(textPath, 'utf8') : '';

  return res.json({
    exists:    true,
    sizeBytes: stat.size,
    text,
    preview:   text.slice(0, 300),
  });
});

// ─── DELETE /api/resume ───────────────────────────────────────────────────────
router.delete('/resume', (req, res) => {
  const pdfPath  = path.join(UPLOAD_DIR, 'resume.pdf');
  const textPath = path.join(UPLOAD_DIR, 'resume_text.txt');
  if (fs.existsSync(pdfPath))  fs.unlinkSync(pdfPath);
  if (fs.existsSync(textPath)) fs.unlinkSync(textPath);
  return res.json({ success: true });
});

module.exports = router;
