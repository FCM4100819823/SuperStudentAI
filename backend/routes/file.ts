import express from 'express';
import admin, { firestore } from '../firebase';
import axios from 'axios';

const router = express.Router();

// Workaround: require multer only where used to avoid type conflicts
const multerImport = require('multer');
const upload = multerImport({ storage: multerImport.memoryStorage() });

// POST /file/upload - Upload file to Firebase Storage and parse with AI
router.post('/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    const userId = req.body.userId;
    if (!req.file || !userId) {
      return res.status(400).json({ message: 'File and userId are required.' });
    }
    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `uploads/${userId}/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);
    await file.save(req.file.buffer, { contentType: req.file.mimetype });
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });

    // Parse file content with AI (text only for MVP)
    let aiResult = null;
    if (req.file.mimetype && req.file.mimetype.startsWith('text/')) {
      const textContent = req.file.buffer.toString('utf-8');
      // Call Hugging Face NLP endpoint for parsing/summary
      const aiRes = await axios.post(
        'http://localhost:5000/ai/nlp',
        { text: textContent, user: userId },
        { timeout: 20000 }
      );
      aiResult = aiRes.data.result;
    }

    // Save file metadata and AI result to Firestore
    await firestore.collection('users').doc(userId).collection('files').add({
      fileName,
      url,
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
      aiResult,
    });

    res.status(201).json({ message: 'File uploaded and processed.', url, aiResult });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'File upload failed', error: error?.message || String(error) });
  }
});

export default router;
