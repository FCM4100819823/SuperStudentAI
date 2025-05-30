import express from 'express';
import admin from 'firebase-admin';
import axios from 'axios';

const router = express.Router();

console.log('[File Router] Initializing multer...');
const multerImport = require('multer');
const upload = multerImport({
  storage: multerImport.memoryStorage(),
  onError: function(err: any, next: express.NextFunction) { // Corrected type for next
    console.error('[Multer Error] Error during file processing:', err);
    // Ensure a JSON response is sent if multer errors
    if (err && !err.status) err.status = 500; 
    if (err && !err.message) err.message = 'Error during file upload processing by multer.';
    next(err); // Pass to global error handler
  }
});
console.log('[File Router] Multer initialized.');

const firestore = admin.firestore();

// POST /file/upload - Upload file to Firebase Storage and parse with AI
router.post('/upload', upload.single('file'), async (req: any, res: any, next: express.NextFunction) => { // Added next
  try {
    const userId = req.body.userId;
    if (!req.file || !userId) {
      const err: any = new Error('File and userId are required.');
      err.status = 400;
      return next(err);
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
        'http://localhost:3000/ai/nlp', // Ensure this is /api/ai/nlp if you changed base paths
        { text: textContent, user: userId },
        { timeout: 20000 },
      );
      aiResult = aiRes.data.result; // Assuming result is the key, adjust if OpenRouter returns differently
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
    console.error('File upload error in /upload route:', error);
    next(error); // Pass to global error handler
  }
});

// POST /file/syllabus-ocr - Upload syllabus image/PDF, run OCR, extract key dates/topics
router.post(
  '/syllabus-ocr',
  (req: express.Request, res: express.Response, next: express.NextFunction) => { 
    // TEMPORARY TEST: Uncomment the next two lines to test route reachability before multer
    // console.log('[Syllabus OCR] TEMPORARY TEST: Route hit. Sending immediate JSON response.');
    // return res.status(200).json({ temporaryTestMessage: "Route /syllabus-ocr was reached successfully before multer." }); 

    console.log('[Syllabus OCR Pre-Multer] Request received. Headers:', JSON.stringify(req.headers));
    console.log('[Syllabus OCR Pre-Multer] Body (keys):', req.body ? Object.keys(req.body) : 'No body yet (expected for multipart)');
    next(); // Proceed to multer
  },
  upload.single('file'),
  async (req: any, res: express.Response, next: express.NextFunction) => { 
    console.log('[Syllabus OCR Post-Multer] Request received, file processing by multer supposedly complete.');
    try {
      const userId = req.body.userId;
      console.log(`[Syllabus OCR] User ID: ${userId}, File received: ${req.file ? req.file.originalname : 'No file'}`);

      if (!req.file || !userId) {
        console.error('[Syllabus OCR] Validation failed: File or userId missing.');
        const err: any = new Error('File and userId are required.');
        err.status = 400;
        return next(err);
      }
      
      console.log('[Syllabus OCR] Attempting to upload to Firebase Storage...');
      const bucket = admin.storage().bucket();
      const storageFileName = `syllabus/${userId}/${Date.now()}_${req.file.originalname}`;
      const file = bucket.file(storageFileName);
      await file.save(req.file.buffer, { contentType: req.file.mimetype });
      const [fileUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, 
      });
      console.log('[Syllabus OCR] File uploaded to Firebase Storage. URL:', fileUrl);

      let ocrText = '';
      console.log(`[Syllabus OCR] File mimetype: ${req.file.mimetype}`);
      if (
        req.file.mimetype &&
        (req.file.mimetype.startsWith('image/') ||
          req.file.mimetype === 'application/pdf')
      ) {
        console.log('[Syllabus OCR] Starting Tesseract OCR processing...');
        try {
          const Tesseract = require('tesseract.js');
          if (req.file.mimetype === 'application/pdf') {
            console.log('[Syllabus OCR] Processing PDF file directly with Tesseract.');
          }
          const result = await Tesseract.recognize(req.file.buffer, 'eng', {});
          ocrText = result.data.text;
          console.log(`[Syllabus OCR] Tesseract OCR completed. Text length: ${ocrText.length}`);
        } catch (tesseractError: any) {
          console.error('[Syllabus OCR] Tesseract OCR processing error:', tesseractError);
          const err: any = new Error('OCR processing failed.');
          err.status = 500;
          err.details = tesseractError.message;
          return next(err); 
        }
      } else {
        if (req.file.mimetype && req.file.mimetype.startsWith('text/')) {
          console.log('[Syllabus OCR] Reading file as plain text.');
          ocrText = req.file.buffer.toString('utf-8');
        } else {
          console.warn(`[Syllabus OCR] Unsupported file type: ${req.file.mimetype}`);
          const err: any = new Error('Unsupported file type for syllabus processing. Please use PDF, image, or text files.');
          err.status = 415;
          return next(err); 
        }
      }

      let extractedEntities = null;
      if (ocrText && ocrText.trim() !== '') {
        try {
          console.log(`[Syllabus OCR] Sending OCR text to /api/ai/syllabus/process. Length: ${ocrText.length}`);
          const aiRes = await axios.post(
            'http://localhost:3000/api/ai/syllabus/process',
            { text: ocrText }, 
            { timeout: 45000 }, 
          );
          if (aiRes.data && aiRes.data.entities) {
            extractedEntities = aiRes.data.entities;
            console.log('[Syllabus OCR] Successfully extracted entities from AI service.');
          } else {
            console.warn('[Syllabus OCR] AI response missing entities:', aiRes.data);
            // Consider if this should be an error passed to next(err)
          }
        } catch (aiError: any) {
          console.error('[Syllabus OCR] Error calling AI service for NER:');
          if (aiError.response) {
            console.error('  Status:', aiError.response.status);
            console.error('  Headers:', JSON.stringify(aiError.response.headers));
            console.error('  Data:', JSON.stringify(aiError.response.data)); 
          } else if (aiError.request) {
            console.error('  No response received:', aiError.request);
          } else {
            console.error('  Error message:', aiError.message);
          }
          const err: any = new Error('AI processing (NER) failed.');
          err.status = aiError.response?.status || 500;
          err.details = aiError.response?.data || aiError.message;
          return next(err); 
        }
      } else {
        console.log('[Syllabus OCR] No OCR text generated or text is empty. Skipping AI entity extraction.');
      }

      console.log('[Syllabus OCR] Attempting to save data to Firestore...');
      const syllabusDocRef = firestore
        .collection('users')
        .doc(userId)
        .collection('syllabus')
        .doc(); 

      await syllabusDocRef.set({
        fileName: storageFileName, // Use the name used for storage
        originalFileName: req.file.originalname,
        url: fileUrl, // Use the obtained file URL
        mimetype: req.file.mimetype,
        uploadedAt: new Date(),
        ocrText,
        entities: extractedEntities, 
        analysisStatus: extractedEntities ? 'completed' : (ocrText ? 'ocr_done_ner_failed' : 'ocr_failed'),
        userId: userId,
      });

      const analysisId = syllabusDocRef.id; 
      console.log(`[Syllabus OCR] Data saved to Firestore. Analysis ID: ${analysisId}`);

      res
        .status(201)
        .json({
          message: 'Syllabus uploaded and processed.',
          url: fileUrl,
          ocrTextLength: ocrText ? ocrText.length : 0,
          entities: extractedEntities,
          analysisId: analysisId, 
          fileName: req.file.originalname, 
        });
    } catch (error: any) {
      console.error('[Syllabus OCR] Overall error in /syllabus-ocr route (before next(error)):', error);
      next(error); 
    }
  },
);

export default router;
