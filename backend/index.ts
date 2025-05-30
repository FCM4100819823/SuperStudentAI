import express from 'express';
import dotenv from 'dotenv';
import mongoose, { ConnectOptions } from 'mongoose';
import { Request, Response, NextFunction } from 'express'; // Added NextFunction
import cors from 'cors'; // Import cors

// Initialize Firebase Admin (must be done before importing routes)
import './firebase';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import fileRoutes from './routes/file';
import calendarRoutes from './routes/calendar'; // Added calendar routes
import spacedRepetitionRoutes from './routes/spacedRepetition'; // Import spaced repetition routes
import studyPlansRoutes from './routes/studyPlans'; // Import study plans routes

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces for LAN access
const MONGO_URI = process.env.MONGO_URI; // Added

// Middleware
// Option 1: Basic CORS setup (allow all origins)
app.use(cors());

// Option 2: More specific CORS configuration (if needed later)
// const corsOptions = {
//   origin: 'http://localhost:8081', // Or your frontend's origin
//   optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
// };
// app.use(cors(corsOptions));

// Add a simple request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[GLOBAL REQUEST LOGGER] Method: ${req.method}, URL: ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('SuperStudent AI Backend is running!');
});

// Connect to MongoDB
if (!MONGO_URI) {
  // Added check
  console.error(
    'MongoDB connection URI not found. Please set MONGO_URI in your .env file.',
  );
  process.exit(1); // Exit if URI is not found
}
mongoose
  .connect(MONGO_URI, {
    // Changed to use MONGO_URI variable
  } as ConnectOptions)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Use authentication routes
app.use('/api/auth', authRoutes); // Changed from /api/auth to /auth to match mobile app
app.use('/api/ai', aiRoutes); // Changed from /api/ai to /ai
app.use('/api/file', fileRoutes); // Changed from /api/file to /file
app.use('/api/calendar', calendarRoutes); // Added calendar routes
app.use('/api/srs', spacedRepetitionRoutes); // Add spaced repetition routes
app.use('/api/study-plans', studyPlansRoutes); // Add study plans routes

// Global Error Handling Middleware (should be defined AFTER all other app.use() and routes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[GLOBAL ERROR HANDLER] Error caught:', err);
  
  // If headers have already been sent, delegate to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message: message,
      type: err.name || 'Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Include stack in dev
      ...(err.details && { details: err.details }), // Include custom details if any
    },
  });
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
