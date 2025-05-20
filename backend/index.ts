import express from 'express';
import dotenv from 'dotenv';
import mongoose, { ConnectOptions } from 'mongoose';
import { Request, Response } from 'express';

// Initialize Firebase Admin (must be done before importing routes)
import './firebase';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import fileRoutes from './routes/file';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0'; // Listen on all interfaces for LAN access

// Middleware
app.use(express.json());

// CORS middleware to allow requests from the mobile app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('SuperStudent AI Backend is running!');
});

// Connect to MongoDB
mongoose
  .connect('mongodb+srv://SuperStudentAI:1234@superstudentai.2cbr81q.mongodb.net/?retryWrites=true&w=majority&appName=SuperStudentAI', {
    useUnifiedTopology: true,
  } as ConnectOptions)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Use authentication routes
app.use('/auth', authRoutes);
app.use('/ai', aiRoutes);
app.use('/file', fileRoutes);

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
