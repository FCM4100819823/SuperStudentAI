// c:\Users\USER\Desktop\SuperStudentAI\SuperStudentAI\backend\routes\spacedRepetition.ts
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import {
    addSpacedRepetitionItem,
    reviewSpacedRepetitionItem,
    getDueReviewItems,
    getSpacedRepetitionItemById,
    updateSpacedRepetitionItemContent,
    deleteSpacedRepetitionItem
} from '../services/spacedRepetitionService';

const router = express.Router();

// Middleware to get user ID (adapt to your actual auth middleware)
const getUserId = (req: AuthenticatedRequest): mongoose.Types.ObjectId => {
    if (!req.user?.uid) { // Ensure req.user and req.user.uid exist
        throw new Error('User ID not found in request. Authentication might have failed or user object is not populated correctly.');
    }
    return new mongoose.Types.ObjectId(req.user.uid);
};

// POST /api/srs/items - Add a new spaced repetition item
router.post('/items', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = getUserId(req);
        const { originalContent, answerContent, studyPlanId, taskId, source, tags } = req.body;

        if (!originalContent) {
            return res.status(400).json({ message: 'Original content is required.' });
        }

        const newItem = await addSpacedRepetitionItem(
            userId,
            originalContent,
            answerContent,
            studyPlanId ? new mongoose.Types.ObjectId(studyPlanId) : undefined,
            taskId ? new mongoose.Types.ObjectId(taskId) : undefined,
            source,
            tags
        );
        res.status(201).json(newItem);
    } catch (error) {
        next(error);
    }
});

// GET /api/srs/items/due - Get items due for review
router.get('/items/due', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = getUserId(req);
        const dueItems = await getDueReviewItems(userId);
        res.status(200).json(dueItems);
    } catch (error) {
        next(error);
    }
});

// GET /api/srs/items/:itemId - Get a specific item by ID
router.get('/items/:itemId', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = getUserId(req);
        const itemId = new mongoose.Types.ObjectId(req.params.itemId);
        const item = await getSpacedRepetitionItemById(itemId, userId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
});

// PUT /api/srs/items/:itemId/review - Review an item and update its schedule
router.put('/items/:itemId/review', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = getUserId(req);
        const itemId = new mongoose.Types.ObjectId(req.params.itemId);
        const { quality } = req.body; // User's performance rating (e.g., 0-5)

        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({ message: 'Invalid review quality. Must be a number between 0 and 5.' });
        }

        const updatedItem = await reviewSpacedRepetitionItem(itemId, userId, { quality });
        res.status(200).json(updatedItem);
    } catch (error) {
        next(error);
    }
});

// PUT /api/srs/items/:itemId - Update content of an item
router.put('/items/:itemId', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = getUserId(req);
        const itemId = new mongoose.Types.ObjectId(req.params.itemId);
        const { originalContent, answerContent, tags } = req.body;

        const updatedItem = await updateSpacedRepetitionItemContent(itemId, userId, { originalContent, answerContent, tags });
        res.status(200).json(updatedItem);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/srs/items/:itemId - Delete an item
router.delete('/items/:itemId', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = getUserId(req);
        const itemId = new mongoose.Types.ObjectId(req.params.itemId);
        await deleteSpacedRepetitionItem(itemId, userId);
        res.status(204).send(); // No content
    } catch (error) {
        next(error);
    }
});

export default router;
