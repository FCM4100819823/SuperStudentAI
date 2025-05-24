import { Request, Response, NextFunction } from 'express';
import admin from '../firebase'; // Your Firebase admin initialized instance

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res
      .status(403)
      .json({ message: 'Invalid or expired token.', error: errorMessage });
  }
};
