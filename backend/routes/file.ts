import express from 'express';
import admin from 'firebase-admin'; // Assuming admin is initialized elsewhere
import axios from 'axios';

// Remove the specific firestore import if admin.firestore() is used directly or firestore is already available globally
// import { firestore } from '../firebase'; // Assuming this was the previous import

const router = express.Router();

const multerImport = require('multer');
const upload = multerImport({ storage: multerImport.memoryStorage() });

// Get Firestore instance from admin SDK
const firestore = admin.firestore();

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
      // Add a general analysisId or keep it specific to syllabus if preferred
      // analysisId: new Date().getTime().toString() // Example, can be more sophisticated
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
    console.log('[Syllabus OCR] Request received for /syllabus-ocr'); // Log entry
    try {
      const userId = req.body.userId;
      console.log(`[Syllabus OCR] User ID: ${userId}, File received: ${req.file ? req.file.originalname : 'No file'}`); // Log userId and file

      if (!req.file || !userId) {
        console.error('[Syllabus OCR] Validation failed: File or userId missing.');
        return res
          .status(400)
          .json({ message: 'File and userId are required.' });
      }
      // Upload to Firebase Storage
      console.log('[Syllabus OCR] Attempting to upload to Firebase Storage...');
      const bucket = admin.storage().bucket();
      const fileName = `syllabus/${userId}/${Date.now()}_${req.file.originalname}`;
      const file = bucket.file(fileName);
      await file.save(req.file.buffer, { contentType: req.file.mimetype });
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      console.log('[Syllabus OCR] File uploaded to Firebase Storage. URL:', url);

      // OCR with Tesseract.js (image/pdf only)
      let ocrText = '';
      console.log(`[Syllabus OCR] File mimetype: ${req.file.mimetype}`);
      if (
        req.file.mimetype &&
        (req.file.mimetype.startsWith('image/') ||
          req.file.mimetype === 'application/pdf')
      ) {
        console.log('[Syllabus OCR] Starting Tesseract OCR processing...');
        const Tesseract = require('tesseract.js');
        // For PDFs, extract first page as image (MVP: reject multi-page PDFs)
        // This part needs robust implementation if PDF handling is complex
        if (req.file.mimetype === 'application/pdf') {
          // Basic placeholder: Tesseract.js can handle PDF paths or buffers directly
          // but might need GraphicsMagick/ImageMagick for multi-page or complex PDFs.
          // For simplicity, we assume Tesseract.js handles the buffer directly.
          console.log('[Syllabus OCR] Processing PDF file directly with Tesseract.');
        }
        const result = await Tesseract.recognize(req.file.buffer, 'eng', {
          // logger: m => console.log(m) // Optional: for detailed Tesseract logs
        });
        ocrText = result.data.text;
        console.log(`[Syllabus OCR] Tesseract OCR completed. Text length: ${ocrText.length}`);
      } else {
        // If not an image or PDF, try to read as plain text if applicable
        if (req.file.mimetype && req.file.mimetype.startsWith('text/')) {
          console.log('[Syllabus OCR] Reading file as plain text.');
          ocrText = req.file.buffer.toString('utf-8');
        } else {
          console.warn(`[Syllabus OCR] Unsupported file type: ${req.file.mimetype}`);
          return res
          .status(415)
          .json({ message: 'Unsupported file type for syllabus processing. Please use PDF, image, or text files.' });
        }
      }

      let extractedEntities = null;
      if (ocrText && ocrText.trim() !== '') {
        try {
          console.log(`[Syllabus OCR] Sending OCR text to /api/ai/syllabus/process. Length: ${ocrText.length}`);
          const aiRes = await axios.post(
            'http://localhost:3000/api/ai/syllabus/process', // CORRECTED ENDPOINT
            { text: ocrText }, // CORRECTED PAYLOAD
            { timeout: 45000 }, // Increased timeout for potentially long NER processing
          );
          // The /api/ai/syllabus/process endpoint returns { message: '...', entities: nerResults }
          if (aiRes.data && aiRes.data.entities) {
            extractedEntities = aiRes.data.entities;
            console.log('[Syllabus OCR] Successfully extracted entities from AI service.');
          } else {
            console.warn('[Syllabus OCR] AI response missing entities:', aiRes.data);
            // Keep extractedEntities as null or an empty array if preferred
          }
        } catch (aiError: any) {
          console.error('[Syllabus OCR] Error calling AI service:', aiError.response ? JSON.stringify(aiError.response.data) : aiError.message); // Log more details
          // Do not let this error stop the process if we want to save OCR text anyway
          // Or, rethrow if AI processing is critical: throw new Error('AI processing failed');
        }
        
      } else {
        console.log('[Syllabus OCR] No OCR text generated or text is empty. Skipping AI entity extraction.');
      }

      // Save OCR and NLP result to Firestore
      console.log('[Syllabus OCR] Attempting to save data to Firestore...');
      const syllabusDocRef = firestore
        .collection('users')
        .doc(userId)
        .collection('syllabus')
        .doc(); // Create a new document with an auto-generated ID

      await syllabusDocRef.set({
        fileName,
        originalFileName: req.file.originalname,
        url,
        mimetype: req.file.mimetype,
        uploadedAt: new Date(),
        ocrText,
        entities: extractedEntities, // Store the extracted entities
        analysisStatus: extractedEntities ? 'completed' : (ocrText ? 'ocr_done_ner_failed' : 'ocr_failed'),
        userId: userId,
      });

      const analysisId = syllabusDocRef.id; // This is the ID the frontend needs
      console.log(`[Syllabus OCR] Data saved to Firestore. Analysis ID: ${analysisId}`);

      res
        .status(201)
        .json({
          message: 'Syllabus uploaded and processed.',
          url,
          ocrTextLength: ocrText ? ocrText.length : 0,
          entities: extractedEntities,
          analysisId: analysisId, // Return the analysisId
          fileName: req.file.originalname, // Also return original file name for frontend use
        });
    } catch (error: any) {
      console.error('[Syllabus OCR] Overall error in /syllabus-ocr route:', error); // Log the full error
      // Ensure a JSON response is sent on error
      if (!res.headersSent) { // Check if headers have already been sent
        res
          .status(500)
          .json({
            message: 'Syllabus processing failed due to an internal server error.',
            error: error?.message || String(error),
            detail: error?.stack // Optionally include stack trace for debugging (remove in production)
          });
      } else {
        console.error('[Syllabus OCR] Headers already sent, cannot send error JSON response.');
      }
    }
  },
);

export default router;
