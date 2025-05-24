// c:\Users\USER\Desktop\SuperStudentAI\SuperStudentAI\backend\services\spacedRepetitionService.ts
import SpacedRepetitionItem, {
  ISpacedRepetitionItem,
} from '../models/SpacedRepetitionItem';
import mongoose from 'mongoose';

// Constants for the SM-2 algorithm (can be tuned)
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const INITIAL_INTERVAL_DAYS = 1;
const NEXT_INTERVAL_FIRST_REPETITION_DAYS = 6;

interface ReviewPerformance {
  quality: number; // User's assessment of recall quality (0-5 scale)
}

export const calculateNextReview = (
  item: ISpacedRepetitionItem,
  performance: ReviewPerformance,
) => {
  let { repetitions, currentInterval, easeFactor, lapses } = item;
  const { quality } = performance;

  if (quality < 3) {
    // Failed to recall or recalled with significant difficulty
    repetitions = 0; // Reset repetitions count
    currentInterval = INITIAL_INTERVAL_DAYS; // Reset interval to the first interval
    lapses += 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      currentInterval = INITIAL_INTERVAL_DAYS;
    } else if (repetitions === 2) {
      currentInterval = NEXT_INTERVAL_FIRST_REPETITION_DAYS;
    } else {
      currentInterval = Math.round(currentInterval * easeFactor);
    }
  }

  // Update ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < MIN_EASE_FACTOR) {
    easeFactor = MIN_EASE_FACTOR;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + currentInterval);

  return {
    nextReviewAt: nextReviewDate,
    currentInterval,
    easeFactor,
    repetitions,
    lapses,
    lastReviewedAt: new Date(),
  };
};

export const addSpacedRepetitionItem = async (
  userId: mongoose.Types.ObjectId,
  originalContent: string,
  answerContent?: string,
  studyPlanId?: mongoose.Types.ObjectId,
  taskId?: mongoose.Types.ObjectId,
  source: 'manual' | 'syllabus' | 'task' | 'note' = 'manual',
  tags?: string[],
): Promise<ISpacedRepetitionItem> => {
  const initialNextReviewDate = new Date();
  initialNextReviewDate.setDate(
    initialNextReviewDate.getDate() + INITIAL_INTERVAL_DAYS,
  );

  const newItem = new SpacedRepetitionItem({
    userId,
    originalContent,
    answerContent,
    studyPlanId,
    taskId,
    nextReviewAt: initialNextReviewDate,
    currentInterval: INITIAL_INTERVAL_DAYS,
    easeFactor: INITIAL_EASE_FACTOR,
    repetitions: 0,
    lapses: 0,
    source,
    tags: tags || [],
  });
  await newItem.save();
  return newItem;
};

export const reviewSpacedRepetitionItem = async (
  itemId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId, // Ensure the item belongs to the user
  performance: ReviewPerformance,
): Promise<ISpacedRepetitionItem | null> => {
  const item = await SpacedRepetitionItem.findOne({ _id: itemId, userId });
  if (!item) {
    throw new Error('Spaced repetition item not found or access denied.');
  }

  const reviewUpdate = calculateNextReview(item, performance);

  Object.assign(item, reviewUpdate);
  await item.save();
  return item;
};

export const getDueReviewItems = async (
  userId: mongoose.Types.ObjectId,
): Promise<ISpacedRepetitionItem[]> => {
  return SpacedRepetitionItem.find({
    userId,
    nextReviewAt: { $lte: new Date() },
  }).sort({ nextReviewAt: 'asc' }); // Oldest due items first
};

export const getSpacedRepetitionItemById = async (
  itemId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
): Promise<ISpacedRepetitionItem | null> => {
  return SpacedRepetitionItem.findOne({ _id: itemId, userId });
};

export const updateSpacedRepetitionItemContent = async (
  itemId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  updates: {
    originalContent?: string;
    answerContent?: string;
    tags?: string[];
  },
): Promise<ISpacedRepetitionItem | null> => {
  const item = await SpacedRepetitionItem.findOne({ _id: itemId, userId });
  if (!item) {
    throw new Error('Spaced repetition item not found or access denied.');
  }
  if (updates.originalContent) item.originalContent = updates.originalContent;
  if (updates.answerContent) item.answerContent = updates.answerContent;
  if (updates.tags) item.tags = updates.tags;

  await item.save();
  return item;
};

export const deleteSpacedRepetitionItem = async (
  itemId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
): Promise<boolean> => {
  const result = await SpacedRepetitionItem.deleteOne({ _id: itemId, userId });
  if (result.deletedCount === 0) {
    throw new Error('Spaced repetition item not found or access denied.');
  }
  return true;
};
