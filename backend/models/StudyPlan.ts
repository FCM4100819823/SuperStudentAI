import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface for a single task within a study plan
export interface IStudyTask extends Document {
  title: string;
  description?: string;
  dueDate?: Date;
  estimatedHours?: number;
  status: 'todo' | 'in-progress' | 'completed';
  relatedTopic?: string; // e.g., from syllabus
  createdAt: Date;
  updatedAt: Date;
}

const StudyTaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date },
    estimatedHours: { type: Number },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed'],
      default: 'todo',
      required: true,
    },
    relatedTopic: { type: String },
  },
  { timestamps: true }
);

// Interface for the StudyPlan document
export interface IStudyPlan extends Document {
  user: Types.ObjectId; // Reference to the User model
  title: string;
  description?: string;
  syllabusAnalysisId?: string; // Optional: if linked to a Firestore syllabus analysis document
  tasks: IStudyTask[];
  aiSuggestions?: string; // To store suggestions from AI optimization or generation
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    syllabusAnalysisId: { type: String }, // Could be a Firestore document ID
    tasks: [StudyTaskSchema], // Array of embedded tasks
    aiSuggestions: { type: String }, // To store suggestions from AI
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

const StudyPlan = mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);

export default StudyPlan;
