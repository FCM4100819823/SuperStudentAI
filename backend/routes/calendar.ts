import express, { Response } from 'express'; // Removed Request as AuthenticatedRequest will be used
import mongoose from 'mongoose';
import CalendarEvent, { ICalendarEvent } from '../models/CalendarEvent';
import {
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';

const router = express.Router();

// Create a new calendar event
router.post(
  '/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        eventType,
        sourceSyllabusAnalysisId,
        allDay,
        location,
        courseId,
      } = req.body;

      const actualUserId = req.user?.uid; // Use uid from Firebase DecodedIdToken

      if (!actualUserId || !title || !startDate || !eventType) {
        return res
          .status(400)
          .json({
            message: 'UserId, title, startDate, and eventType are required.',
          });
      }

      const newEventData: Partial<ICalendarEvent> = {
        userId: actualUserId, // Now a string
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        eventType,
        allDay,
        location,
      };
      if (sourceSyllabusAnalysisId) {
        newEventData.sourceSyllabusAnalysisId = sourceSyllabusAnalysisId;
      }
      if (courseId) {
        newEventData.courseId = courseId;
      }

      const newEvent: ICalendarEvent = new CalendarEvent(newEventData);
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error: any) {
      res
        .status(500)
        .json({
          message: 'Error creating calendar event',
          error: error.message,
        });
    }
  },
);

// Get all calendar events for a user
router.get(
  '/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid; // Use uid from Firebase DecodedIdToken
      if (!userId) {
        return res
          .status(400)
          .json({ message: 'User ID is required to fetch events.' });
      }
      // Ensure find query uses string for userId if your schema defines it as String
      const events = await CalendarEvent.find({ userId: userId }).sort({
        startDate: 'asc',
      });
      res.status(200).json(events);
    } catch (error: any) {
      res
        .status(500)
        .json({
          message: 'Error fetching calendar events',
          error: error.message,
        });
    }
  },
);

// Get a specific calendar event by ID
router.get(
  '/:eventId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const event = await CalendarEvent.findById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (req.user && event.userId.toString() !== req.user.uid) {
        return res
          .status(403)
          .json({ message: 'User not authorized to view this event' });
      }
      res.status(200).json(event);
    } catch (error: any) {
      res
        .status(500)
        .json({
          message: 'Error fetching calendar event',
          error: error.message,
        });
    }
  },
);

// Update a calendar event
router.put(
  '/:eventId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        eventType,
        allDay,
        location,
        courseId,
      } = req.body;
      const eventId = req.params.eventId;

      const eventToUpdate = await CalendarEvent.findById(eventId);
      if (!eventToUpdate) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (req.user && eventToUpdate.userId.toString() !== req.user.uid) {
        return res
          .status(403)
          .json({ message: 'User not authorized to update this event' });
      }

      eventToUpdate.userId = eventToUpdate.userId; // No change, but keep type consistent
      eventToUpdate.title = title !== undefined ? title : eventToUpdate.title;
      eventToUpdate.description =
        description !== undefined ? description : eventToUpdate.description;
      eventToUpdate.startDate = startDate
        ? new Date(startDate)
        : eventToUpdate.startDate;
      eventToUpdate.endDate = endDate
        ? new Date(endDate)
        : eventToUpdate.endDate;
      eventToUpdate.eventType =
        eventType !== undefined ? eventType : eventToUpdate.eventType;
      eventToUpdate.allDay =
        typeof allDay === 'boolean' ? allDay : eventToUpdate.allDay;
      eventToUpdate.location =
        location !== undefined ? location : eventToUpdate.location;
      if (courseId) {
        eventToUpdate.courseId = courseId;
      }

      const updatedEvent = await eventToUpdate.save();
      res.status(200).json(updatedEvent);
    } catch (error: any) {
      res
        .status(500)
        .json({
          message: 'Error updating calendar event',
          error: error.message,
        });
    }
  },
);

// Delete a calendar event
router.delete(
  '/:eventId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const eventId = req.params.eventId;
      const eventToDelete = await CalendarEvent.findById(eventId);

      if (!eventToDelete) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (req.user && eventToDelete.userId.toString() !== req.user.uid) {
        return res
          .status(403)
          .json({ message: 'User not authorized to delete this event' });
      }

      await CalendarEvent.findByIdAndDelete(eventId);
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error: any) {
      res
        .status(500)
        .json({
          message: 'Error deleting calendar event',
          error: error.message,
        });
    }
  },
);

export default router;
