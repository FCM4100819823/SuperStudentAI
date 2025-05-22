// c:\Users\USER\Desktop\SuperStudentAI\SuperStudentAI\backend\models\SpacedRepetitionItem.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISpacedRepetitionItem extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  studyPlanId?: mongoose.Schema.Types.ObjectId; // Optional: link to a specific study plan
  taskId?: mongoose.Schema.Types.ObjectId; // Optional: link to a specific task
  originalContent: string; // The core content/question to review
  answerContent?: string; // The answer or details for the content
  lastReviewedAt?: Date;
  nextReviewAt: Date;
  currentInterval: number; // in days
  easeFactor: number; // SuperMemo 2 algorithm's E-Factor
  repetitions: number; // Number of times this item has been reviewed
  lapses: number; // Number of times the user failed to recall
  source: 'manual' | 'syllabus' | 'task' | 'note'; // Where did this item originate?
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SpacedRepetitionItemSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan.tasks', index: true }, // Assuming tasks are sub-documents or have their own collection
  originalContent: { type: String, required: true, trim: true },
  answerContent: { type: String, trim: true },
  lastReviewedAt: { type: Date },
  nextReviewAt: { type: Date, required: true, index: true },
  currentInterval: { type: Number, required: true, default: 1 }, // Initial interval (e.g., 1 day)
  easeFactor: { type: Number, required: true, default: 2.5 }, // Standard initial E-Factor
  repetitions: { type: Number, required: true, default: 0 },
  lapses: { type: Number, required: true, default: 0 },
  source: { type: String, enum: ['manual', 'syllabus', 'task', 'note'], default: 'manual' },
  tags: [{ type: String, trim: true }],
}, { timestamps: true });

// Index to efficiently query items due for review for a user
SpacedRepetitionItemSchema.index({ userId: 1, nextReviewAt: 1 });

export default mongoose.model<ISpacedRepetitionItem>('SpacedRepetitionItem', SpacedRepetitionItemSchema);
