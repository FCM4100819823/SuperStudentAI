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
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // Parse file content with AI (text only for MVP)
    let aiResult = null;
    if (req.file.mimetype && req.file.mimetype.startsWith('text/')) {
      const textContent = req.file.buffer.toString('utf-8');
      // Call Hugging Face NLP endpoint for parsing/summary
      const aiRes = await axios.post(
        'http://localhost:3000/ai/nlp',
        { text: textContent, user: userId },
        { timeout: 20000 },
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

    res
      .status(201)
      .json({ message: 'File uploaded and processed.', url, aiResult });
  } catch (error: any) {
    console.error('File upload error:', error);
    res
      .status(500)
      .json({
        message: 'File upload failed',
        error: error?.message || String(error),
      });
  }
});

// POST /file/syllabus-ocr - Upload syllabus image/PDF, run OCR, extract key dates/topics
router.post(
  '/syllabus-ocr',
  upload.single('file'),
  async (req: any, res: any) => {
    try {
      const userId = req.body.userId;
      if (!req.file || !userId) {
        return res
          .status(400)
          .json({ message: 'File and userId are required.' });
      }
      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `syllabus/${userId}/${Date.now()}_${req.file.originalname}`;
      const file = bucket.file(fileName);
      await file.save(req.file.buffer, { contentType: req.file.mimetype });
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      // OCR with Tesseract.js (image/pdf only)
      let ocrText = '';
      if (
        req.file.mimetype &&
        (req.file.mimetype.startsWith('image/') ||
          req.file.mimetype === 'application/pdf')
      ) {
        const Tesseract = require('tesseract.js');
        // For PDFs, extract first page as image (MVP: reject multi-page PDFs)
        if (req.file.mimetype === 'application/pdf') {
          return res
            .status(415)
            .json({
              message:
                'PDF OCR not yet supported. Please upload an image file.',
            });
        }
        // OCR image buffer
        const result = await Tesseract.recognize(req.file.buffer, 'eng');
        ocrText = result.data.text;
      } else {
        return res
          .status(415)
          .json({ message: 'Only image files are supported for OCR.' });
      }

      // Extract key dates/topics using Hugging Face NLP
      let nlpResult = null;
      if (ocrText) {
        const aiRes = await axios.post(
          'http://localhost:3000/ai/nlp',
          { text: ocrText, user: userId, task: 'syllabus_extraction' },
          { timeout: 20000 },
        );
        nlpResult = aiRes.data.result;
      }

      // Save OCR and NLP result to Firestore
      await firestore
        .collection('users')
        .doc(userId)
        .collection('syllabus')
        .add({
          fileName,
          url,
          mimetype: req.file.mimetype,
          uploadedAt: new Date(),
          ocrText,
          nlpResult,
        });

      res
        .status(201)
        .json({
          message: 'Syllabus uploaded, OCR complete, NLP extracted.',
          url,
          ocrText,
          nlpResult,
        });
    } catch (error: any) {
      console.error('Syllabus OCR error:', error);
      res
        .status(500)
        .json({
          message: 'Syllabus OCR failed',
          error: error?.message || String(error),
        });
    }
  },
);

export default router;
