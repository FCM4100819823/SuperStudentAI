import express, { Request, Response, NextFunction, RequestHandler as ExpressRequestHandler } from 'express';
import axios from 'axios';
import { parse, isValid, format } from 'date-fns';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import mongoose from 'mongoose'; // Added mongoose
import CalendarEvent from '../models/CalendarEvent'; // Added CalendarEvent model

const router = express.Router();

const rateLimitImport = require('express-rate-limit');
const limiter: ExpressRequestHandler = rateLimitImport({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many AI requests from this IP, please try again later.'
});

const aiCache: Record<string, { result: any; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

interface SyllabusEntity {
  entity_group: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

// Corrected Interface Definitions
interface ExtractedDate {
  dateString: string;
  parsedDate: Date | null;
  context: string;
}

interface ExtractedAssignment {
  name: string;
  dueDate?: ExtractedDate;
  description?: string;
  context: string;
}

interface ExtractedTopic {
  name: string;
  description?: string;
  context: string;
}

interface SyllabusAnalysisResult {
  assignments: ExtractedAssignment[];
  topics: ExtractedTopic[];
  dates: ExtractedDate[];
  entities: SyllabusEntity[];
  rawText: string;
}
// End Corrected Interface Definitions

interface AISuggestedTask {
    title: string;
    description?: string;
    estimatedHours?: number;
    status?: 'todo' | 'in-progress' | 'completed';
    relatedTopic?: string;
}

function parseAIResponseToTasks(aiResponse: any): AISuggestedTask[] {
    console.log("Raw AI Response for task generation:", JSON.stringify(aiResponse));
    if (aiResponse && Array.isArray(aiResponse) && aiResponse.length > 0 && aiResponse[0].generated_text) {
        const generatedText = aiResponse[0].generated_text;
        try {
            const jsonMatch = generatedText.match(/\[\s*{[\s\S]*?}\s*]/);
            if (jsonMatch && jsonMatch[0]) {
                const tasks = JSON.parse(jsonMatch[0]);
                if (Array.isArray(tasks) && tasks.every((task: any) => task.title && typeof task.title === 'string')) {
                    return tasks.map((task: any) => ({
                        title: task.title,
                        description: task.description || '',
                        estimatedHours: typeof task.estimatedHours === 'number' ? task.estimatedHours : undefined,
                        status: 'todo', 
                        relatedTopic: task.relatedTopic || '',
                    }));
                }
            }
            const lines = generatedText.split('\n').filter((line: string) => line.trim() !== '');
            const parsedTasks: AISuggestedTask[] = [];
            for (const line of lines) {
                const titleMatch = line.match(/Task:\s*([^,]+)/i);
                const descMatch = line.match(/Desc:\s*([^,]+)/i);
                const hoursMatch = line.match(/Hours:\s*(\d+(\.\d+)?)/i);
                if (titleMatch && titleMatch[1]) {
                    parsedTasks.push({
                        title: titleMatch[1].trim(),
                        description: descMatch ? descMatch[1].trim() : undefined,
                        estimatedHours: hoursMatch ? parseFloat(hoursMatch[1]) : undefined,
                        status: 'todo',
                    });
                }
            }
            if (parsedTasks.length > 0) return parsedTasks;
        } catch (e) {
            console.error("Failed to parse AI generated tasks:", e);
        }
    }
    console.warn("Could not parse tasks from AI response. Returning empty array.");
    return [];
}

function parseAIOptimizationResponse(aiResponse: any): { tasks: AISuggestedTask[], suggestions: string } {
    console.log("Raw AI Response for optimization:", JSON.stringify(aiResponse));
     if (aiResponse && Array.isArray(aiResponse) && aiResponse.length > 0 && aiResponse[0].generated_text) {
        const generatedText = aiResponse[0].generated_text;
        try {
            const jsonMatch = generatedText.match(/{\s*"optimizedTasks":\s*\[[\s\S]*?],\s*"suggestions":\s*"[\s\S]*?"\s*}/);
            if (jsonMatch && jsonMatch[0]) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.optimizedTasks && parsed.suggestions) {
                    return {
                        tasks: parsed.optimizedTasks.map((task: any) => ({
                            title: task.title,
                            description: task.description || '',
                            estimatedHours: typeof task.estimatedHours === 'number' ? task.estimatedHours : undefined,
                            status: task.status || 'todo',
                            relatedTopic: task.relatedTopic || '',
                        })),
                        suggestions: parsed.suggestions
                    };
                }
            }
        } catch (e) {
            console.error("Failed to parse AI optimization response:", e);
        }
        return { tasks: [], suggestions: generatedText };
    }
    console.warn("Could not parse optimization from AI response.");
    return { tasks: [], suggestions: "Could not process optimization suggestions." };
}

router.post('/nlp', limiter, async (req: Request, res: Response) => {
  const { text, model = 'distilbert-base-uncased-finetuned-sst-2-english', user = 'anonymous' } = req.body;
  if (!text) return res.status(400).json({ message: 'Text is required.' });
  console.log(`[AI] User: ${user}, Model: ${model}, Text length: ${text.length}, Time: ${new Date().toISOString()}`);
  const cacheKey = `${model}:${text}`;
  const cached = aiCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ result: cached.result, cached: true });
  }
  try {
    const hfResponse = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 13000,
      }
    );
    aiCache[cacheKey] = { result: hfResponse.data, timestamp: Date.now() };
    res.json({ result: hfResponse.data, cached: false });
  } catch (error: any) {
    const msg = error.response?.data?.error || error.message || 'AI request failed.';
    res.status(500).json({ message: `Hugging Face API error: ${msg}` });
  }
});

router.post('/study-plan/generate', async (req: Request, res: Response) => {
    const { syllabusText, userGoals, existingTasks = [] } = req.body;
    // @ts-ignore
    const userId = req.user?.uid || 'anonymous';
    if (!syllabusText && !userGoals) {
        return res.status(400).json({ message: 'Either syllabus text or user goals are required to generate a study plan.' });
    }
    console.log(`[AI Study Plan Generate] User: ${userId}, Time: ${new Date().toISOString()}`);
    const model = process.env.STUDY_PLAN_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1';
    let prompt = `You are an AI assistant helping a student create a study plan. Based on the following information, generate a list of actionable tasks. Each task should include a title, a brief description, and an estimated number of hours to complete. Try to order the tasks logically. Return the tasks as a JSON array of objects, where each object has "title", "description", and "estimatedHours" keys. Example: [{"title": "Read Chapter 1", "description": "Focus on key concepts.", "estimatedHours": 2}] Syllabus Information: ${syllabusText || "Not provided."} User Goals: ${userGoals || "Not provided."} Existing Tasks (if any, to avoid duplication or to build upon): ${existingTasks.length > 0 ? JSON.stringify(existingTasks) : "None."} Generated JSON Task Array:`;
    try {
        console.log(`[AI Study Plan Generate] Sending request to Hugging Face model: ${model}`);
        const hfResponse = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            { 
                inputs: prompt,
                parameters: {
                    max_new_tokens: 512, 
                    return_full_text: false, 
                    temperature: 0.7, 
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000, 
            }
        );
        const generatedTasks = parseAIResponseToTasks(hfResponse.data);
        if (generatedTasks.length === 0 && hfResponse.data[0]?.generated_text) {
            return res.status(200).json({ tasks: [], message: "AI generated some text, but it couldn't be parsed into tasks. Raw output: " + hfResponse.data[0].generated_text });
        }
        res.json({ tasks: generatedTasks, message: generatedTasks.length > 0 ? "Study plan tasks generated successfully." : "AI could not generate tasks based on the input." });
    } catch (error: any) {
        console.error('Error generating study plan tasks with AI:', error.response ? error.response.data : error.message);
        let errorMessage = 'Failed to generate study plan tasks with AI.';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage += ` Model Error: ${error.response.data.error}`;
            if (error.response.data.error_type === "Overloaded") {
                 errorMessage += " The model is currently overloaded. Please try again later."
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage += " The request to the AI model timed out.";
        }
        res.status(500).json({ message: errorMessage, error: error.message });
    }
});

router.post('/study-plan/optimize', async (req: Request, res: Response) => {
    const { tasks, optimizationGoal, userContext } = req.body;
    // @ts-ignore
    const userId = req.user?.uid || 'anonymous';
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ message: 'A list of tasks is required to optimize a study plan.' });
    }
    console.log(`[AI Study Plan Optimize] User: ${userId}, Goal: ${optimizationGoal}, Time: ${new Date().toISOString()}`);
    const model = process.env.STUDY_PLAN_OPTIMIZE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1';
    let prompt = `You are an AI assistant helping a student optimize their study plan. The student has the following list of tasks: ${JSON.stringify(tasks, null, 2)} The student's goal for optimization is: "${optimizationGoal || 'General improvement and logical ordering'}". Additional context from the student: "${userContext || 'None'}" Please analyze these tasks and provide: 1. An "optimizedTasks" list: This could be a re-ordered version of the tasks, tasks might be merged, split, or have their descriptions/estimatedHours adjusted. 2. A "suggestions" string: Textual advice on how to approach the study plan, potential issues, or other tips. Return your response as a single JSON object with two keys: "optimizedTasks" (an array of task objects) and "suggestions" (a string). Example: {"optimizedTasks": [{"title": "Review Topic B (priority)", "description": "...", "estimatedHours": 2}], "suggestions": "Consider allocating more time for X..."} Optimized JSON Output:`;
    try {
        console.log(`[AI Study Plan Optimize] Sending request to Hugging Face model: ${model}`);
        const hfResponse = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            { 
                inputs: prompt,
                parameters: {
                    max_new_tokens: 768, 
                    return_full_text: false,
                    temperature: 0.5,
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                timeout: 43000, 
            }
        );
        const { tasks: optimizedTasks, suggestions } = parseAIOptimizationResponse(hfResponse.data);
        if (optimizedTasks.length === 0 && !suggestions && hfResponse.data[0]?.generated_text) {
            return res.status(200).json({ tasks: [], suggestions: "AI generated some text, but it couldn't be parsed. Raw output: " + hfResponse.data[0].generated_text });
        }
        res.json({ tasks: optimizedTasks, suggestions, message: "Study plan optimization processed." });
    } catch (error: any) {
        console.error('Error optimizing study plan tasks with AI:', error.response ? error.response.data : error.message);
        let errorMessage = 'Failed to optimize study plan tasks with AI.';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage += ` Model Error: ${error.response.data.error}`;
             if (error.response.data.error_type === "Overloaded") {
                 errorMessage += " The model is currently overloaded. Please try again later."
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage += " The request to the AI model timed out.";
        }
        res.status(500).json({ message: errorMessage, error: error.message });
    }
});

async function callHuggingFaceNER(text: string, model: string = 'dbmdz/bert-large-cased-finetuned-conll03-english') {
    try {
        const hfResponse = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            { inputs: text, options: { waitForModel: true } }, 
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                timeout: 20000, 
            }
        );
        return hfResponse.data;
    } catch (error: any) {
        console.error(`Error calling Hugging Face NER model (${model}):`, error.response ? error.response.data : error.message);
        if (error.response && error.response.data && error.response.data.error === "Model dbmdz/bert-large-cased-finetuned-conll03-english is currently loading") {
            throw new Error(`NER model is loading, please try again shortly. Details: ${error.response.data.error}`);
        }
        throw new Error(`Hugging Face NER API error: ${error.response?.data?.error || error.message}`);
    }
}

function extractDatesWithContext(text: string, contextWindow = 30): ExtractedDate[] {
    const dates: ExtractedDate[] = [];
    const dateRegex = /\b(?:(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4})|(?:\d{1,2}[\/-]\d{1,2}[\/-](?:\d{2}|\d{4}))|(?:due(?:\s+on|\s+by)?\s+((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+\d{4}|\d{1,2}[\/-]\d{1,2}[\/-](?:\d{2}|\d{4})))|next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(tomorrow|today|yesterday))\b/gi;
    let match;
    const dateFormats = [
        'MM/dd/yyyy', 'M/d/yyyy', 'MM-dd-yyyy', 'M-d-yyyy',
        'MM/dd/yy', 'M/d/yy', 'MM-dd-yy', 'M-d-yy',
        'yyyy-MM-dd', 'yyyy/MM/dd',
        'MMMM d, yyyy', 'MMM d, yyyy', 'MMMM d yyyy', 'MMM d yyyy',
        'd MMMM yyyy', 'd MMM yyyy',
        'do MMMM yyyy' 
    ];
    while ((match = dateRegex.exec(text)) !== null) {
        const dateString = match[0];
        let parsedDate: Date | null = null;
        let dateToParse = dateString;
        if (match[1]) { 
            dateToParse = match[1];
        } else if (match[2]) { 
            // Skip precise parsing of "next weekday"
        } else if (match[3]) { 
            const today = new Date();
            if (match[3].toLowerCase() === 'today') parsedDate = today;
            else if (match[3].toLowerCase() === 'tomorrow') parsedDate = new Date(new Date().setDate(today.getDate() + 1)); // Corrected: Use new Date() for tomorrow
            else if (match[3].toLowerCase() === 'yesterday') parsedDate = new Date(new Date().setDate(today.getDate() - 1)); // Corrected: Use new Date() for yesterday
        }
        if (!parsedDate) {
            for (const fmt of dateFormats) {
                const d = parse(dateToParse, fmt, new Date());
                if (isValid(d)) {
                    parsedDate = d;
                    break;
                }
            }
            if (!parsedDate) {
                const d = new Date(dateToParse);
                if (isValid(d) && d.getFullYear() > 1900) { 
                    parsedDate = d;
                }
            }
        }
        const startIndex = Math.max(0, match.index - contextWindow);
        const endIndex = Math.min(text.length, match.index + dateString.length + contextWindow);
        const context = text.substring(startIndex, endIndex);
        dates.push({ dateString, parsedDate, context });
    }
    return dates;
}

function extractAssignmentsAndTopics(text: string, nerEntities: SyllabusEntity[], contextWindow = 50) {
    const assignments: ExtractedAssignment[] = [];
    const topics: ExtractedTopic[] = [];
    const assignmentKeywords = ['assignment', 'homework', 'project', 'paper', 'essay', 'exam', 'quiz', 'test', 'midterm', 'final'];
    const topicKeywords = ['topic', 'module', 'unit', 'chapter', 'lecture', 'week', 'section', 'theme'];
    const sentences = text.split(/[\.\n]+/);
    for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        for (const keyword of assignmentKeywords) {
            if (lowerSentence.includes(keyword)) {
                let assignmentName = keyword;
                const potentialNameMatch = sentence.match(new RegExp(`${keyword}[\\s:]*([^\\.,\\(]+)`, 'i'));
                if (potentialNameMatch && potentialNameMatch[1] && potentialNameMatch[1].trim().length > 3) {
                    assignmentName = potentialNameMatch[1].trim();
                } else {
                    nerEntities.forEach(entity => {
                        if ((entity.entity_group === 'MISC' || entity.entity_group === 'ORG') && sentence.includes(entity.word) && Math.abs(sentence.indexOf(entity.word) - lowerSentence.indexOf(keyword)) < 30) {
                           assignmentName = entity.word;
                        }
                    });
                }
                const startIndex = Math.max(0, text.indexOf(sentence) - contextWindow);
                const endIndex = Math.min(text.length, text.indexOf(sentence) + sentence.length + contextWindow);
                const context = text.substring(startIndex, endIndex); // This context is broader
                if (!assignments.find(a => a.name.toLowerCase() === assignmentName.toLowerCase() && a.context.includes(sentence))) {
                     assignments.push({ name: assignmentName, context: sentence.trim() });
                }
                break; 
            }
        }
        for (const keyword of topicKeywords) {
            if (lowerSentence.includes(keyword)) {
                let topicName = keyword;
                const potentialNameMatch = sentence.match(new RegExp(`${keyword}[\\s:]*([^\\.,\\(]+)`, 'i'));
                 if (potentialNameMatch && potentialNameMatch[1] && potentialNameMatch[1].trim().length > 3) {
                    topicName = potentialNameMatch[1].trim();
                } else {
                    nerEntities.forEach(entity => {
                        if ((entity.entity_group === 'MISC' || entity.entity_group === 'ORG' || entity.entity_group === 'WORK_OF_ART') && sentence.includes(entity.word) && Math.abs(sentence.indexOf(entity.word) - lowerSentence.indexOf(keyword)) < 30) {
                           topicName = entity.word;
                        }
                    });
                }
                const startIndex = Math.max(0, text.indexOf(sentence) - contextWindow);
                const endIndex = Math.min(text.length, text.indexOf(sentence) + sentence.length + contextWindow);
                const context = text.substring(startIndex, endIndex); // Broader context
                if (!topics.find(t => t.name.toLowerCase() === topicName.toLowerCase() && t.context.includes(sentence))) {
                    topics.push({ name: topicName, context: sentence.trim() });
                }
                break; 
            }
        }
    }
    return { assignments, topics };
}

async function parseSyllabusText(syllabusText: string, userId?: string, sourceAnalysisId?: string): Promise<SyllabusAnalysisResult> { // Added userId and sourceAnalysisId
    if (!syllabusText || syllabusText.trim().length === 0) {
        throw new Error("Syllabus text cannot be empty.");
    }
    let nerEntities: SyllabusEntity[] = [];
    try {
        const nerResults = await callHuggingFaceNER(syllabusText);
        if (Array.isArray(nerResults)) {
            nerEntities = nerResults.map((entity: any) => ({
                entity_group: entity.entity_group,
                score: entity.score,
                word: entity.word,
                start: entity.start,
                end: entity.end,
            }));
        }
    } catch (error) {
        console.warn("NER processing failed, proceeding with keyword extraction only:", error);
    }
    const extractedDates = extractDatesWithContext(syllabusText);
    const { assignments: keywordAssignments, topics: keywordTopics } = extractAssignmentsAndTopics(syllabusText, nerEntities);

    // Link due dates to assignments (this part was already here, ensuring it remains)
    keywordAssignments.forEach(assignment => {
        if (assignment.dueDate) return; // Already has a date from initial extraction if any
        const assignmentContextLower = assignment.context.toLowerCase();
        let closestDate: ExtractedDate | null = null;
        let minDistance = Infinity;

        extractedDates.forEach(date => {
            const dateMentionIndex = assignmentContextLower.indexOf(date.dateString.toLowerCase());
            if (dateMentionIndex !== -1) {
                // Basic proximity check, can be improved
                if (!closestDate || dateMentionIndex < minDistance) {
                    closestDate = date;
                    minDistance = dateMentionIndex;
                }
            }
        });
        if (closestDate) {
            assignment.dueDate = closestDate;
        }
    });

    // Create calendar events for assignments with due dates
    if (userId) { // Only create events if userId is provided
        for (const assignment of keywordAssignments) {
            if (assignment.dueDate && assignment.dueDate.parsedDate) {
                try {
                    const newEvent = new CalendarEvent({
                        userId: new mongoose.Types.ObjectId(userId),
                        title: `Assignment: ${assignment.name}`,
                        description: assignment.context, // Use the sentence/context as description
                        startDate: assignment.dueDate.parsedDate,
                        eventType: 'assignment',
                        sourceSyllabusAnalysisId: sourceAnalysisId ? new mongoose.Types.ObjectId(sourceAnalysisId) : undefined,
                        allDay: true, // Assume assignments are all-day events unless specified otherwise
                    });
                    await newEvent.save();
                    console.log(`[AI Syllabus Parse] Created calendar event for assignment: ${assignment.name}`);
                } catch (err: any) {
                    console.error(`[AI Syllabus Parse] Error creating calendar event for assignment ${assignment.name}:`, err.message);
                }
            }
        }
    }

    return {
        assignments: keywordAssignments,
        topics: keywordTopics,
        dates: extractedDates,
        entities: nerEntities,
        rawText: syllabusText,
    };
}

// New route for text-based syllabus analysis
router.post('/ai/syllabus/analyze-text', async (req: Request, res: Response) => {
    const { syllabusText, createCalendarEvents = false } = req.body; // Added createCalendarEvents flag
    // @ts-ignore
    const userId = req.user?.uid || req.body.userId; // Allow passing userId for now, replace with actual auth

    if (!syllabusText) {
        return res.status(400).json({ message: 'Syllabus text is required.' });
    }
    console.log(`[AI Syllabus Analyze Text] User: ${userId}, Text length: ${syllabusText.length}, Create Calendar Events: ${createCalendarEvents}, Time: ${new Date().toISOString()}`);

    // Placeholder for a sourceAnalysisId if you were to save the analysis itself
    const sourceAnalysisId = new mongoose.Types.ObjectId().toString(); // Example ID

    try {
        const analysisResult = await parseSyllabusText(syllabusText, createCalendarEvents && userId ? userId : undefined, sourceAnalysisId);
        res.json({
            message: 'Syllabus text analyzed successfully.',
            analysis: analysisResult,
            calendarEventsCreated: createCalendarEvents && userId ? 'Attempted to create calendar events based on analysis.' : 'Calendar event creation not requested or user ID missing.'
        });
    } catch (error: any) {
        console.error('Error analyzing syllabus text:', error);
        res.status(500).json({ message: `Failed to analyze syllabus text. ${error.message}` });
    }
});

// Define the handler for OCR and analysis
const analyzeFileHandler: ExpressRequestHandler = async (req, res) => {
    // @ts-ignore
    const userId = req.user?.uid || req.body.userId; // Allow passing userId for now, replace with actual auth
    // @ts-ignore
    const file = req.file;
    const createCalendarEvents = req.body.createCalendarEvents === 'true' || req.body.createCalendarEvents === true;

    // @ts-ignore
    console.log(`[AI Syllabus Analyze File] User: ${userId}, File received: ${file ? file.originalname : 'No file'}, Create Calendar Events: ${createCalendarEvents}, Time: ${new Date().toISOString()}`);

    // @ts-ignore
    if (!file) {
        return res.status(400).json({ message: 'Syllabus file is required.' });
    }
    // Placeholder for a sourceAnalysisId
    const sourceAnalysisId = new mongoose.Types.ObjectId().toString(); // Example ID

    try {
        // @ts-ignore
        console.log(`[AI Syllabus Analyze File] Starting OCR for file: ${file.originalname}, size: ${file.size} bytes`);
        const { data: { text: ocrText } } = await Tesseract.recognize(
            // @ts-ignore
            file.buffer,
            'eng',
            { 
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`[Tesseract OCR Progress] status: ${m.status}, progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );
        // @ts-ignore
        console.log(`[AI Syllabus Analyze File] OCR finished for file: ${file.originalname}`);

        if (!ocrText || ocrText.trim().length === 0) {
            // @ts-ignore
            console.warn(`[AI Syllabus Analyze File] OCR processing for ${file.originalname} yielded no text.`);
            return res.status(500).json({ message: 'OCR processing failed to extract text or extracted text was empty.' });
        }
        
        console.log(`[AI Syllabus Analyze File] OCR Extracted Text length: ${ocrText.length}, (first 100 chars): ${ocrText.substring(0,100)}...`);

        const analysisResult = await parseSyllabusText(ocrText, createCalendarEvents && userId ? userId : undefined, sourceAnalysisId);

        res.json({
            message: 'Syllabus file analyzed successfully.',
            ocrText: ocrText,
            analysis: analysisResult,
            calendarEventsCreated: createCalendarEvents && userId ? 'Attempted to create calendar events based on analysis.' : 'Calendar event creation not requested or user ID missing.'
        });
    } catch (error: any) {
        // @ts-ignore
        console.error(`[AI Syllabus Analyze File] Error processing file ${file?.originalname}:`, error);
        let errorMessage = `Failed to analyze syllabus file.`;
        if (error.message) {
            errorMessage += ` ${error.message}`;
        }
        if (error.name === 'TesseractError' || (error.message && error.message.toLowerCase().includes('tesseract'))) {
             errorMessage = `OCR processing error: ${error.message}`;
        }
        res.status(500).json({ message: errorMessage });
    }
};

// New route for file-based syllabus analysis (OCR)
// The type assertion `as any` is used here as a workaround for potential type conflicts
// between multer's RequestHandler and Express's RequestHandler.
// This is a common issue when integrating middleware with differing @types versions or specifics.
router.post('/ai/syllabus/analyze-file', upload.single('syllabusFile') as any, analyzeFileHandler);

export default router;
