import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarEvent extends Document {
  userId: string; // Firebase UID is a string
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date; // Optional, for events that span multiple days or have a duration
  eventType: 'assignment' | 'exam' | 'lecture' | 'meeting' | 'personal' | 'other';
  sourceSyllabusAnalysisId?: mongoose.Schema.Types.ObjectId | string; // Optional: to link to a specific syllabus analysis
  allDay?: boolean; // Optional: for all-day events
  location?: string; // Optional
  courseId?: mongoose.Schema.Types.ObjectId | string; // Optional: to link to a specific course if you have a Course model
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema: Schema = new Schema(
  {
    userId: {
      type: String, // Store Firebase UID as string
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    eventType: {
      type: String,
      enum: ['assignment', 'exam', 'lecture', 'meeting', 'personal', 'other'],
      required: true,
      default: 'other',
    },
    sourceSyllabusAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SyllabusAnalysis', // You might need to create this model later or adjust
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    location: {
        type: String,
        trim: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course', // Assuming you might have a Course model
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

export default mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
