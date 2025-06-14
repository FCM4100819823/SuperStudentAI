import express, { Request, Response } from 'express';
import StudyPlan, { IStudyPlan } from '../models/StudyPlan';
import {
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';
import mongoose from 'mongoose';

const router = express.Router();

interface UpcomingDeadline {
  taskTitle: string;
  studyPlanTitle: string;
  dueDate: Date;
  status: string;
}

// GET /study-plans - Get all study plans for the authenticated user
router.get(
  '/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const studyPlans = await StudyPlan.find({ user: userId }).sort({
        createdAt: -1,
      });

      // Calculate progress for each study plan
      const studyPlansWithProgress = studyPlans.map((plan) => {
        const completedTasks = plan.tasks.filter(
          (task) => task.status === 'completed',
        ).length;
        const totalTasks = plan.tasks.length;
        const progress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...plan.toObject(),
          progress,
          completedTasks,
          totalTasks,
        };
      });

      res.json(studyPlansWithProgress);
    } catch (error) {
      console.error('Error fetching study plans:', error);
      res.status(500).json({ error: 'Failed to fetch study plans' });
    }
  },
);

// GET /study-plans/:id - Get a specific study plan
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const studyPlanId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const studyPlan = await StudyPlan.findOne({
        _id: studyPlanId,
        user: userId,
      });

      if (!studyPlan) {
        return res.status(404).json({ error: 'Study plan not found' });
      }

      // Calculate progress
      const completedTasks = studyPlan.tasks.filter(
        (task) => task.status === 'completed',
      ).length;
      const totalTasks = studyPlan.tasks.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        ...studyPlan.toObject(),
        progress,
        completedTasks,
        totalTasks,
      });
    } catch (error) {
      console.error('Error fetching study plan:', error);
      res.status(500).json({ error: 'Failed to fetch study plan' });
    }
  },
);

// POST /study-plans - Create a new study plan
router.post(
  '/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { title, description, tasks, startDate, endDate } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const studyPlan = new StudyPlan({
        user: userId,
        title,
        description,
        tasks: tasks || [],
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      const savedStudyPlan = await studyPlan.save();

      // Calculate progress
      const completedTasks = savedStudyPlan.tasks.filter(
        (task) => task.status === 'completed',
      ).length;
      const totalTasks = savedStudyPlan.tasks.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.status(201).json({
        ...savedStudyPlan.toObject(),
        progress,
        completedTasks,
        totalTasks,
      });
    } catch (error) {
      console.error('Error creating study plan:', error);
      res.status(500).json({ error: 'Failed to create study plan' });
    }
  },
);

// PUT /study-plans/:id - Update a study plan
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const studyPlanId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { title, description, tasks, startDate, endDate } = req.body;

      const updatedStudyPlan = await StudyPlan.findOneAndUpdate(
        { _id: studyPlanId, user: userId },
        {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(tasks && { tasks }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
        },
        { new: true },
      );

      if (!updatedStudyPlan) {
        return res.status(404).json({ error: 'Study plan not found' });
      }

      // Calculate progress
      const completedTasks = updatedStudyPlan.tasks.filter(
        (task) => task.status === 'completed',
      ).length;
      const totalTasks = updatedStudyPlan.tasks.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        ...updatedStudyPlan.toObject(),
        progress,
        completedTasks,
        totalTasks,
      });
    } catch (error) {
      console.error('Error updating study plan:', error);
      res.status(500).json({ error: 'Failed to update study plan' });
    }
  },
);

// DELETE /study-plans/:id - Delete a study plan
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const studyPlanId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const deletedStudyPlan = await StudyPlan.findOneAndDelete({
        _id: studyPlanId,
        user: userId,
      });

      if (!deletedStudyPlan) {
        return res.status(404).json({ error: 'Study plan not found' });
      }

      res.json({ message: 'Study plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting study plan:', error);
      res.status(500).json({ error: 'Failed to delete study plan' });
    }
  },
);

// PUT /study-plans/:id/tasks/:taskId - Update a specific task
router.put(
  '/:id/tasks/:taskId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const studyPlanId = req.params.id;
      const taskId = req.params.taskId;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const {
        title,
        description,
        dueDate,
        estimatedHours,
        status,
        relatedTopic,
      } = req.body;

      const studyPlan = await StudyPlan.findOne({
        _id: studyPlanId,
        user: userId,
      });

      if (!studyPlan) {
        return res.status(404).json({ error: 'Study plan not found' });
      }

      const task = studyPlan.tasks.find(
        (t) => t._id && t._id.toString() === taskId,
      );

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Update task fields
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined)
        task.dueDate = dueDate ? new Date(dueDate) : undefined;
      if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
      if (status !== undefined) task.status = status;
      if (relatedTopic !== undefined) task.relatedTopic = relatedTopic;

      await studyPlan.save();

      // Calculate progress
      const completedTasks = studyPlan.tasks.filter(
        (task) => task.status === 'completed',
      ).length;
      const totalTasks = studyPlan.tasks.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        ...studyPlan.toObject(),
        progress,
        completedTasks,
        totalTasks,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  },
);

// POST /study-plans/:id/tasks - Add a new task to a study plan
router.post(
  '/:id/tasks',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const studyPlanId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { title, description, dueDate, estimatedHours, relatedTopic } =
        req.body;

      if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      const studyPlan = await StudyPlan.findOne({
        _id: studyPlanId,
        user: userId,
      });

      if (!studyPlan) {
        return res.status(404).json({ error: 'Study plan not found' });
      }

      const newTask = {
        _id: new mongoose.Types.ObjectId(),
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours,
        status: 'todo' as const,
        relatedTopic,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      studyPlan.tasks.push(newTask as any);
      await studyPlan.save();

      // Calculate progress
      const completedTasks = studyPlan.tasks.filter(
        (task) => task.status === 'completed',
      ).length;
      const totalTasks = studyPlan.tasks.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.status(201).json({
        ...studyPlan.toObject(),
        progress,
        completedTasks,
        totalTasks,
      });
    } catch (error) {
      console.error('Error adding task:', error);
      res.status(500).json({ error: 'Failed to add task' });
    }
  },
);

// DELETE /study-plans/:id/tasks/:taskId - Delete a specific task
router.delete(
  '/:id/tasks/:taskId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      const studyPlanId = req.params.id;
      const taskId = req.params.taskId;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const studyPlan = await StudyPlan.findOne({
        _id: studyPlanId,
        user: userId,
      });

      if (!studyPlan) {
        return res.status(404).json({ error: 'Study plan not found' });
      }

      const taskIndex = studyPlan.tasks.findIndex(
        (t) => t._id && t._id.toString() === taskId,
      );

      if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }

      studyPlan.tasks.splice(taskIndex, 1);
      await studyPlan.save();

      // Calculate progress
      const completedTasks = studyPlan.tasks.filter(
        (task) => task.status === 'completed',
      ).length;
      const totalTasks = studyPlan.tasks.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        ...studyPlan.toObject(),
        progress,
        completedTasks,
        totalTasks,
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  },
);

// GET /study-plans/stats/overview - Get study stats for dashboard
router.get(
  '/stats/overview',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const studyPlans = await StudyPlan.find({ user: userId });

      let totalTasks = 0;
      let completedTasks = 0;
      let inProgressTasks = 0;
      let upcomingDeadlines: UpcomingDeadline[] = [];

      studyPlans.forEach((plan) => {
        plan.tasks.forEach((task) => {
          totalTasks++;
          if (task.status === 'completed') {
            completedTasks++;
          } else if (task.status === 'in-progress') {
            inProgressTasks++;
          }

          // Check for upcoming deadlines (within next 7 days)
          if (task.dueDate && task.status !== 'completed') {
            const now = new Date();
            const sevenDaysFromNow = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000,
            );

            if (task.dueDate <= sevenDaysFromNow && task.dueDate >= now) {
              upcomingDeadlines.push({
                taskTitle: task.title,
                studyPlanTitle: plan.title,
                dueDate: task.dueDate,
                status: task.status,
              });
            }
          }
        });
      });

      // Sort upcoming deadlines by due date
      upcomingDeadlines.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );

      const overallProgress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        totalStudyPlans: studyPlans.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks: totalTasks - completedTasks - inProgressTasks,
        overallProgress,
        upcomingDeadlines: upcomingDeadlines.slice(0, 5), // Limit to 5 most urgent
      });
    } catch (error) {
      console.error('Error fetching study stats:', error);
      res.status(500).json({ error: 'Failed to fetch study stats' });
    }
  },
);

export default router;
