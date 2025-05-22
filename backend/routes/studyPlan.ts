import express, { Request, Response, Router } from 'express';
import StudyPlan, { IStudyPlan, IStudyTask } from '../models/StudyPlan';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/authMiddleware';
import axios from 'axios'; // For calling AI service
import admin from '../firebase'; // For fetching syllabus text from Firestore if needed

const router: Router = express.Router();

// Middleware to authenticate and add user to request
router.use(authenticateToken);

interface AISuggestedTask {
    title: string;
    description?: string;
    estimatedHours?: number;
    status?: 'todo' | 'in-progress' | 'completed';
    relatedTopic?: string;
}

// CREATE a new Study Plan (with AI Task Generation)
router.post('/', async (req: Request, res: Response) => {
    try {
        const { title, description, syllabusAnalysisId, userGoals, tasks, startDate, endDate } = req.body;
        // @ts-ignore
        const userId = req.user.uid;

        if (!title) {
            return res.status(400).json({ message: 'Title is required for a study plan.' });
        }

        let generatedTasks: IStudyTask[] = tasks || [];
        let aiSuggestionsFromGeneration: string | undefined = undefined;

        // If syllabusAnalysisId or userGoals are provided, try to generate tasks with AI
        if (syllabusAnalysisId || userGoals) {
            let syllabusTextContent: string | undefined;
            if (syllabusAnalysisId) {
                try {
                    const doc = await admin.firestore().collection('syllabusAnalyses').doc(syllabusAnalysisId).get();
                    if (doc.exists) {
                        syllabusTextContent = doc.data()?.extractedText || doc.data()?.fullText; // Or however you store it
                    }
                } catch (err) {
                    console.warn(`Could not fetch syllabus content for ID ${syllabusAnalysisId}:`, err);
                }
            }

            if (syllabusTextContent || userGoals) {
                try {
                    console.log('Calling AI to generate tasks for new study plan...');
                    const aiApiResponse = await axios.post(`http://localhost:${process.env.PORT || 3001}/api/ai/study-plan/generate`, {
                        syllabusText: syllabusTextContent,
                        userGoals: userGoals,
                        existingTasks: tasks || [] // Pass any manually added tasks
                    }, {
                        headers: { 'Authorization': req.headers.authorization } // Forward auth token
                    });

                    if (aiApiResponse.data && Array.isArray(aiApiResponse.data.tasks)) {
                        generatedTasks = [...generatedTasks, ...aiApiResponse.data.tasks.map((task: AISuggestedTask) => ({
                            ...task,
                            status: task.status || 'todo',
                        }))];
                        aiSuggestionsFromGeneration = aiApiResponse.data.message; // Capture any message from AI generation
                    }
                } catch (aiError: any) {
                    console.error('AI task generation failed:', aiError.response ? aiError.response.data : aiError.message);
                    // Proceed without AI tasks if generation fails, or return an error
                    // For now, we'll just log and proceed with any manually provided tasks
                    aiSuggestionsFromGeneration = "AI task generation was attempted but failed. " + (aiError.response?.data?.message || aiError.message);
                }
            }
        }

        const newStudyPlanData: Partial<IStudyPlan> = {
            user: new mongoose.Types.ObjectId(userId),
            title,
            description,
            tasks: generatedTasks,
            syllabusAnalysisId: syllabusAnalysisId,
            aiSuggestions: aiSuggestionsFromGeneration,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };
        
        const newStudyPlan = new StudyPlan(newStudyPlanData);
        await newStudyPlan.save();
        res.status(201).json(newStudyPlan);
    } catch (error: any) {
        console.error('Error creating study plan:', error);
        res.status(500).json({ message: 'Failed to create study plan', error: error.message });
    }
});

// POST route to optimize tasks for a specific study plan
router.post('/:planId/optimize', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const { planId } = req.params;
        const { optimizationGoal, userContext } = req.body; // User can provide a goal for optimization

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ message: 'Invalid Study Plan ID format.' });
        }

        const studyPlan = await StudyPlan.findOne({ _id: planId, user: new mongoose.Types.ObjectId(userId) });

        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found or access denied.' });
        }

        if (!studyPlan.tasks || studyPlan.tasks.length === 0) {
            return res.status(400).json({ message: 'No tasks in the study plan to optimize.' });
        }

        try {
            console.log(`Calling AI to optimize tasks for study plan ID: ${planId}`);
            const aiApiResponse = await axios.post(`http://localhost:${process.env.PORT || 3001}/api/ai/study-plan/optimize`, {
                tasks: studyPlan.tasks.map(t => t.toObject()), // Send plain task objects
                optimizationGoal,
                userContext
            }, {
                headers: { 'Authorization': req.headers.authorization } // Forward auth token
            });

            if (aiApiResponse.data) {
                const { tasks: optimizedTasks, suggestions } = aiApiResponse.data;
                if (Array.isArray(optimizedTasks) && optimizedTasks.length > 0) {
                    studyPlan.tasks = optimizedTasks.map((task: AISuggestedTask) => ({
                        ...task,
                        status: task.status || 'todo',
                        // Mongoose subdocuments might need specific handling for updates if _id is not preserved
                        // For simplicity, assuming AI returns tasks that can replace existing ones.
                        // More robust: merge based on title or a unique ID if AI provides one.
                    })) as [IStudyTask]; // Cast needed if replacing whole array
                }
                studyPlan.aiSuggestions = suggestions || studyPlan.aiSuggestions; // Append or replace suggestions
                studyPlan.markModified('tasks'); // Important if tasks array is replaced or deeply modified
                await studyPlan.save();
                res.status(200).json(studyPlan);
            } else {
                res.status(500).json({ message: 'AI optimization returned no data.'});
            }
        } catch (aiError: any) {
            console.error('AI task optimization failed:', aiError.response ? aiError.response.data : aiError.message);
            res.status(500).json({ message: 'Failed to optimize tasks with AI', error: aiError.response?.data?.message || aiError.message });
        }

    } catch (error: any) {
        console.error('Error in optimize study plan route:', error);
        res.status(500).json({ message: 'Failed to optimize study plan', error: error.message });
    }
});

// GET all Study Plans for the authenticated user
router.get('/', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const studyPlans = await StudyPlan.find({ user: new mongoose.Types.ObjectId(userId) }).populate('tasks');
        res.status(200).json(studyPlans);
    } catch (error) {
        console.error('Error fetching study plans:', error);
        // @ts-ignore
        res.status(500).json({ message: 'Failed to fetch study plans', error: error.message });
    }
});

// GET a single Study Plan by ID
router.get('/:planId', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const { planId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ message: 'Invalid Study Plan ID format.' });
        }

        const studyPlan = await StudyPlan.findOne({ _id: planId, user: new mongoose.Types.ObjectId(userId) }).populate('tasks');
        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found or access denied.' });
        }
        res.status(200).json(studyPlan);
    } catch (error) {
        console.error('Error fetching single study plan:', error);
        // @ts-ignore
        res.status(500).json({ message: 'Failed to fetch study plan', error: error.message });
    }
});

// UPDATE a Study Plan by ID
router.put('/:planId', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const { planId } = req.params;
        const { title, description, syllabusAnalysisId, tasks } = req.body;

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ message: 'Invalid Study Plan ID format.' });
        }
        
        const updateData: Partial<IStudyPlan> = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (syllabusAnalysisId) updateData.syllabusAnalysisId = syllabusAnalysisId;
        if (tasks) updateData.tasks = tasks;


        const updatedStudyPlan = await StudyPlan.findOneAndUpdate(
            { _id: planId, user: new mongoose.Types.ObjectId(userId) },
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('tasks');

        if (!updatedStudyPlan) {
            return res.status(404).json({ message: 'Study plan not found or access denied.' });
        }
        res.status(200).json(updatedStudyPlan);
    } catch (error) {
        console.error('Error updating study plan:', error);
        // @ts-ignore
        res.status(500).json({ message: 'Failed to update study plan', error: error.message });
    }
});

// DELETE a Study Plan by ID
router.delete('/:planId', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const { planId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ message: 'Invalid Study Plan ID format.' });
        }

        const deletedStudyPlan = await StudyPlan.findOneAndDelete({ _id: planId, user: new mongoose.Types.ObjectId(userId) });

        if (!deletedStudyPlan) {
            return res.status(404).json({ message: 'Study plan not found or access denied.' });
        }
        res.status(200).json({ message: 'Study plan deleted successfully.' });
    } catch (error) {
        console.error('Error deleting study plan:', error);
        // @ts-ignore
        res.status(500).json({ message: 'Failed to delete study plan', error: error.message });
    }
});

// --- Task specific routes within a Study Plan ---

// ADD a Task to a Study Plan
router.post('/:planId/tasks', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const { planId } = req.params;
        const { title, description, dueDate, estimatedHours, status, relatedTopic } = req.body;

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ message: 'Invalid Study Plan ID format.' });
        }
        if (!title) {
            return res.status(400).json({ message: 'Title is required for a task.' });
        }

        const studyPlan = await StudyPlan.findOne({ _id: planId, user: new mongoose.Types.ObjectId(userId) });
        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found or access denied.' });
        }

        const newTask: IStudyTask = {
            title,
            description,
            dueDate,
            estimatedHours,
            status: status || 'todo',
            relatedTopic,
        } as IStudyTask; // Cast to IStudyTask, _id and timestamps will be added by Mongoose

        studyPlan.tasks.push(newTask);
        await studyPlan.save();
        // @ts-ignore
        res.status(201).json(studyPlan.tasks[studyPlan.tasks.length - 1]); // Return the newly added task
    } catch (error) {
        console.error('Error adding task to study plan:', error);
        // @ts-ignore
        res.status(500).json({ message: 'Failed to add task', error: error.message });
    }
});

// GET all tasks for a specific Study Plan
router.get('/:planId/tasks', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const { planId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ message: 'Invalid Study Plan ID format.' });
        }

        const studyPlan = await StudyPlan.findOne({ _id: planId, user: new mongoose.Types.ObjectId(userId) }).select('tasks');
        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found or access denied.' });
        }
        res.status(200).json(studyPlan.tasks);
    } catch (error) {
        console.error('Error fetching tasks for study plan:', error);
        // @ts-ignore
        res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
    }
});


// UPDATE a Task within a Study Plan
router.put('/:planId/tasks/:taskId', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const { planId, taskId } = req.params;
        const { title, description, dueDate, estimatedHours, status, relatedTopic } = req.body;

        if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid Study Plan or Task ID format.' });
        }

        const studyPlan = await StudyPlan.findOne({ _id: planId, user: new mongoose.Types.ObjectId(userId) });
        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found or access denied.' });
        }

        // @ts-ignore
        const task = studyPlan.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found in this study plan.' });
        }

        if (title) task.title = title;
        if (description) task.description = description;
        if (dueDate) task.dueDate = dueDate;
        if (estimatedHours) task.estimatedHours = estimatedHours;
        if (status) task.status = status;
        if (relatedTopic) task.relatedTopic = relatedTopic;
        // @ts-ignore
        task.updatedAt = new Date();

        await studyPlan.save();
        res.status(200).json(task);
    } catch (error) {
        console.error('Error updating task in study plan:', error);
        // @ts-ignore
        res.status(500).json({ message: 'Failed to update task', error: error.message });
    }
});

// DELETE a Task from a Study Plan
router.delete('/:planId/tasks/:taskId', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.uid;
        const { planId, taskId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid Study Plan or Task ID format.' });
        }

        const studyPlan = await StudyPlan.findOne({ _id: planId, user: new mongoose.Types.ObjectId(userId) });

        if (!studyPlan) {
            return res.status(404).json({ message: 'Study plan not found or access denied.' });
        }

        // @ts-ignore
        const taskIndex = studyPlan.tasks.findIndex(task => task._id.equals(taskId));

        if (taskIndex === -1) {
            return res.status(404).json({ message: 'Task not found in this study plan.' });
        }

        studyPlan.tasks.splice(taskIndex, 1);
        await studyPlan.save();

        res.status(200).json({ message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Error deleting task from study plan:', error);
        // @ts-ignore
        res.status(500).json({ message: 'Failed to delete task', error: error.message });
    }
});


export default router;
