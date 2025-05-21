import express from 'express';
import axios from 'axios';
import { Request, Response } from 'express'; // Import Request and Response for better typing

const router = express.Router();

// Workaround: require express-rate-limit only where used to avoid type conflicts
const rateLimitImport = require('express-rate-limit');
const limiter = rateLimitImport({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many AI requests from this IP, please try again later.'
});

// In-memory cache: { [cacheKey]: { result, timestamp } }
const aiCache: Record<string, { result: any; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

interface AISuggestedTask {
    title: string;
    description?: string;
    estimatedHours?: number;
    status?: 'todo' | 'in-progress' | 'completed';
    relatedTopic?: string;
}

// Helper function to parse AI response for task generation
// This is a simplified parser and might need to be made more robust
// based on the actual output format of the chosen AI model.
function parseAIResponseToTasks(aiResponse: any): AISuggestedTask[] {
    console.log("Raw AI Response for task generation:", JSON.stringify(aiResponse));
    if (aiResponse && Array.isArray(aiResponse) && aiResponse.length > 0 && aiResponse[0].generated_text) {
        const generatedText = aiResponse[0].generated_text;
        try {
            // Attempt to find a JSON array within the generated text
            // This relies on the model being prompted to produce a JSON string
            const jsonMatch = generatedText.match(/\[\s*{[\s\S]*?}\s*]/);
            if (jsonMatch && jsonMatch[0]) {
                const tasks = JSON.parse(jsonMatch[0]);
                // Basic validation
                if (Array.isArray(tasks) && tasks.every(task => task.title && typeof task.title === 'string')) {
                    return tasks.map(task => ({
                        title: task.title,
                        description: task.description || '',
                        estimatedHours: typeof task.estimatedHours === 'number' ? task.estimatedHours : undefined,
                        status: 'todo', // Default status
                        relatedTopic: task.relatedTopic || '',
                    }));
                }
            }
            // Fallback: if JSON parsing fails, try to parse line by line (very basic)
            // Example: "1. Task: Title, Desc: Description, Hours: 2"
            const lines = generatedText.split('\\n').filter((line: string) => line.trim() !== '');
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


// Helper function to parse AI response for task optimization
function parseAIOptimizationResponse(aiResponse: any): { tasks: AISuggestedTask[], suggestions: string } {
    console.log("Raw AI Response for optimization:", JSON.stringify(aiResponse));
     if (aiResponse && Array.isArray(aiResponse) && aiResponse.length > 0 && aiResponse[0].generated_text) {
        const generatedText = aiResponse[0].generated_text;
        try {
            // Example: Expecting AI to return a JSON object like:
            // { "optimizedTasks": [...], "suggestions": "Some suggestions..." }
            // This is highly dependent on the prompt and model capabilities.
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
        // Fallback if JSON parsing fails
        return { tasks: [], suggestions: generatedText };
    }
    console.warn("Could not parse optimization from AI response.");
    return { tasks: [], suggestions: "Could not process optimization suggestions." };
}

// POST /ai/nlp - Proxy to Hugging Face Inference API
router.post('/nlp', (req: any, res: any, next: any) => limiter(req, res, next), async (req: any, res: any) => {
  const { text, model = 'distilbert-base-uncased-finetuned-sst-2-english', user = 'anonymous' } = req.body;
  if (!text) return res.status(400).json({ message: 'Text is required.' });

  // Log the request
  console.log(`[AI] User: ${user}, Model: ${model}, Text length: ${text.length}, Time: ${new Date().toISOString()}`);

  // Caching
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
        timeout: 15000,
      }
    );
    aiCache[cacheKey] = { result: hfResponse.data, timestamp: Date.now() };
    res.json({ result: hfResponse.data, cached: false });
  } catch (error: any) {
    const msg = error.response?.data?.error || error.message || 'AI request failed.';
    res.status(500).json({ message: `Hugging Face API error: ${msg}` });
  }
});

// POST /ai/study-plan/generate - Generate tasks for a study plan
router.post('/study-plan/generate', async (req: Request, res: Response) => {
    const { syllabusText, userGoals, existingTasks = [] } = req.body;
    // @ts-ignore
    const userId = req.user?.uid || 'anonymous';

    if (!syllabusText && !userGoals) {
        return res.status(400).json({ message: 'Either syllabus text or user goals are required to generate a study plan.' });
    }

    console.log(`[AI Study Plan Generate] User: ${userId}, Time: ${new Date().toISOString()}`);

    // Choose a text generation model.
    // Using a general instruction-tuned model is a good start.
    // Ensure HF_API_TOKEN is in .env
    const model = process.env.STUDY_PLAN_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1'; // Or a smaller one like 'gpt2' if needed

    let prompt = `You are an AI assistant helping a student create a study plan.
Based on the following information, generate a list of actionable tasks.
Each task should include a title, a brief description, and an estimated number of hours to complete.
Try to order the tasks logically.
Return the tasks as a JSON array of objects, where each object has "title", "description", and "estimatedHours" keys. Example: [{"title": "Read Chapter 1", "description": "Focus on key concepts.", "estimatedHours": 2}]

Syllabus Information:
${syllabusText || "Not provided."}

User Goals:
${userGoals || "Not provided."}

Existing Tasks (if any, to avoid duplication or to build upon):
${existingTasks.length > 0 ? JSON.stringify(existingTasks) : "None."}

Generated JSON Task Array:
`;

    try {
        console.log(`[AI Study Plan Generate] Sending request to Hugging Face model: ${model}`);
        const hfResponse = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            { 
                inputs: prompt,
                parameters: {
                    max_new_tokens: 512, // Adjust as needed
                    return_full_text: false, // We only want the generated part
                    temperature: 0.7, // Adjust for creativity vs. determinism
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000, // 30 seconds timeout
            }
        );

        const generatedTasks = parseAIResponseToTasks(hfResponse.data);

        if (generatedTasks.length === 0 && hfResponse.data[0]?.generated_text) {
             // If parsing failed but we got text, return the raw text as a fallback message
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

// POST /ai/study-plan/optimize - Optimize an existing set of tasks
router.post('/study-plan/optimize', async (req: Request, res: Response) => {
    const { tasks, optimizationGoal, userContext } = req.body; // optimizationGoal: e.g., 'balance workload', 'prioritize deadlines'
    // @ts-ignore
    const userId = req.user?.uid || 'anonymous';

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ message: 'A list of tasks is required to optimize a study plan.' });
    }

    console.log(`[AI Study Plan Optimize] User: ${userId}, Goal: ${optimizationGoal}, Time: ${new Date().toISOString()}`);
    const model = process.env.STUDY_PLAN_OPTIMIZE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1';

    let prompt = `You are an AI assistant helping a student optimize their study plan.
The student has the following list of tasks:
${JSON.stringify(tasks, null, 2)}

The student's goal for optimization is: "${optimizationGoal || 'General improvement and logical ordering'}".
Additional context from the student: "${userContext || 'None'}"

Please analyze these tasks and provide:
1. An "optimizedTasks" list: This could be a re-ordered version of the tasks, tasks might be merged, split, or have their descriptions/estimatedHours adjusted.
2. A "suggestions" string: Textual advice on how to approach the study plan, potential issues, or other tips.

Return your response as a single JSON object with two keys: "optimizedTasks" (an array of task objects) and "suggestions" (a string).
Example: {"optimizedTasks": [{"title": "Review Topic B (priority)", "description": "...", "estimatedHours": 2}], "suggestions": "Consider allocating more time for X..."}

Optimized JSON Output:
`;

    try {
        console.log(`[AI Study Plan Optimize] Sending request to Hugging Face model: ${model}`);
        const hfResponse = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            { 
                inputs: prompt,
                parameters: {
                    max_new_tokens: 768, // Tasks + suggestions might be long
                    return_full_text: false,
                    temperature: 0.5,
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                timeout: 45000, // 45 seconds timeout
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

export default router;
