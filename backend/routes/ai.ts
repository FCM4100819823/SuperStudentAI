import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler as ExpressRequestHandler,
} from 'express';
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
  message: 'Too many AI requests from this IP, please try again later.',
});

const aiCache: Record<string, { result: any; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

// Define a new interface for the NLP request body
interface NlpRequest {
  text: string;
  model?: string; // Optional: specify a model
  user?: string; // Optional: user identifier for logging
}

// Commenting out unused constants, as the specific Hugging Face endpoint will be used directly
// const EXTERNAL_AI_SERVICE_URL = process.env.EXTERNAL_AI_NLP_URL || \'https://api.example.com/nlp\';
// const EXTERNAL_AI_API_KEY = process.env.EXTERNAL_AI_API_KEY || \'your-api-key\';


// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
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
  console.log(
    'Raw AI Response for task generation:',
    JSON.stringify(aiResponse),
  );
  if (
    aiResponse &&
    Array.isArray(aiResponse) &&
    aiResponse.length > 0 &&
    aiResponse[0].generated_text
  ) {
    const generatedText = aiResponse[0].generated_text;
    try {
      const jsonMatch = generatedText.match(/\[\s*{[\s\S]*?}\s*]/);
      if (jsonMatch && jsonMatch[0]) {
        const tasks = JSON.parse(jsonMatch[0]);
        if (
          Array.isArray(tasks) &&
          tasks.every(
            (task: any) => task.title && typeof task.title === 'string',
          )
        ) {
          return tasks.map((task: any) => ({
            title: task.title,
            description: task.description || '',
            estimatedHours:
              typeof task.estimatedHours === 'number'
                ? task.estimatedHours
                : undefined,
            status: 'todo',
            relatedTopic: task.relatedTopic || '',
          }));
        }
      }
      const lines = generatedText
        .split('\n')
        .filter((line: string) => line.trim() !== '');
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
      console.error('Failed to parse AI generated tasks:', e);
    }
  }
  console.warn(
    'Could not parse tasks from AI response. Returning empty array.',
  );
  return [];
}

function parseAIOptimizationResponse(aiResponse: any): {
  tasks: AISuggestedTask[];
  suggestions: string;
} {
  console.log('Raw AI Response for optimization:', JSON.stringify(aiResponse));
  if (
    aiResponse &&
    Array.isArray(aiResponse) &&
    aiResponse.length > 0 &&
    aiResponse[0].generated_text
  ) {
    const generatedText = aiResponse[0].generated_text;
    try {
      const jsonMatch = generatedText.match(
        /{\s*"optimizedTasks":\s*\[[\s\S]*?],\s*"suggestions":\s*"[\s\S]*?"\s*}/,
      );
      if (jsonMatch && jsonMatch[0]) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.optimizedTasks && parsed.suggestions) {
          return {
            tasks: parsed.optimizedTasks.map((task: any) => ({
              title: task.title,
              description: task.description || '',
              estimatedHours:
                typeof task.estimatedHours === 'number'
                  ? task.estimatedHours
                  : undefined,
              status: task.status || 'todo',
              relatedTopic: task.relatedTopic || '',
            })),
            suggestions: parsed.suggestions,
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse AI optimization response:', e);
    }
    // If parsing fails or structure is not as expected, return generatedText as suggestion
    return { tasks: [], suggestions: generatedText }; 
  }
  console.warn('Could not parse optimization from AI response.');
  return {
    tasks: [],
    suggestions: 'Could not process optimization suggestions.',
  };
}

router.post('/nlp', limiter, async (req: Request, res: Response) => {
  const {
    text,
    // model: requestedModel, // Keep this if you want to allow model selection from frontend
    user,
  }: NlpRequest = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const cacheKey = `nlp-${text}`;
  if (aiCache[cacheKey] && Date.now() - aiCache[cacheKey].timestamp < CACHE_TTL) {
    console.log('Returning cached NLP result for:', text);
    return res.json(aiCache[cacheKey].result);
  }

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterApiKey) {
    console.error('OpenRouter API key not configured.');
    return res.status(500).json({ error: 'AI service not configured.' });
  }

  const modelsToTry = [
    'mistralai/mistral-7b-instruct', // Preferred
    'openai/gpt-3.5-turbo',
    'google/gemini-flash-1.5',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', // Free model
    // 'huggingfaceh4/zephyr-7b-beta', // Removed as per user preference
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Attempting AI NLP request with model: ${model} for text: "${text}"`);
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: text }],
        },
        {
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            // 'HTTP-Referer': 'YOUR_SITE_URL', // Optional: Replace with your actual site URL
            // 'X-Title': 'YOUR_SITE_NAME', // Optional: Replace with your actual site name
          },
        },
      );

      if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message && response.data.choices[0].message.content) {
        const result = { generated_text: response.data.choices[0].message.content };
        aiCache[cacheKey] = { result, timestamp: Date.now() };
        console.log(`AI NLP request successful with model: ${model}. Response:`, result);
        return res.json(result);
      } else {
        console.warn(`Received unexpected response structure from OpenRouter with model ${model}:\n`, response.data);
        lastError = {
          status: 500,
          message: 'AI service returned an unexpected response structure.',
          details: response.data,
        };
      }
    } catch (error: any) {
      lastError = error;
      console.error(
        `Error calling OpenRouter API with model ${model}:`,
        error.response ? JSON.stringify(error.response.data, null, 2) : error.message,
      );
    }
  }

  // If all models failed
  console.error(
    'All AI models failed. Last error:',
    lastError.response ? JSON.stringify(lastError.response.data, null, 2) : lastError.message,
  );
  
  const status = lastError.response?.status || 500;
  const message = lastError.response?.data?.error?.message || 'AI service request failed after multiple attempts.';
  const details = lastError.response?.data || lastError.message;

  return res.status(status).json({
    error: message,
    details: details,
    message: `AI request failed for text: "${text}" after trying models: ${modelsToTry.join(', ')}. Last model tried: ${modelsToTry[modelsToTry.length -1]}.`,
  });
});

router.post('/study-plan/generate', async (req: Request, res: Response) => {
  const { syllabusText, userGoals, existingTasks = [] } = req.body;
  // @ts-ignore
  const userId = req.user?.uid || 'anonymous';
  if (!syllabusText && !userGoals) {
    return res
      .status(400)
      .json({
        message:
          'Either syllabus text or user goals are required to generate a study plan.',
      });
  }
  console.log(
    `[AI Study Plan Generate] User: ${userId}, Time: ${new Date().toISOString()}`,
  );

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    console.error('[AI Study Plan Generate] OpenRouter API key not configured.');
    return res.status(500).json({ error: 'AI service not configured (key missing).' });
  }

  // Define models to try with OpenRouter for study plan generation
  const preferredModel = process.env.STUDY_PLAN_MODEL || 'mistralai/mistral-7b-instruct';
  const fallbackModels = [
    'openai/gpt-3.5-turbo',
    'google/gemini-flash-1.5',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', // Free model
    // 'huggingfaceh4/zephyr-7b-beta', // Removed as per user preference
  ];
  const modelsToTry = [preferredModel, ...fallbackModels.filter(m => m !== preferredModel)];

  let prompt = `You are an AI assistant helping a student create a study plan. Based on the following information, generate a list of actionable tasks. Each task should include a title, a brief description, and an estimated number of hours to complete. Try to order the tasks logically. Return the tasks as a JSON array of objects, where each object has "title", "description", and "estimatedHours" keys. Example: [{"title": "Read Chapter 1", "description": "Focus on key concepts.", "estimatedHours": 2}] Syllabus Information: ${syllabusText || 'Not provided.'} User Goals: ${userGoals || 'Not provided.'} Existing Tasks (if any, to avoid duplication or to build upon): ${existingTasks.length > 0 ? JSON.stringify(existingTasks) : 'None.'} Generated JSON Task Array:`;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(
        `[AI Study Plan Generate] Attempting with OpenRouter model: ${model}`,
      );
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          // Consider response_format for models that support it, e.g., response_format: { type: "json_object" }
          // For now, relying on prompt engineering for JSON output.
          max_tokens: 1024, // Increased max_tokens for potentially long study plans
          temperature: 0.5, // Adjusted temperature for more deterministic JSON output
        },
        {
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 45000, // Increased timeout for study plan generation
        },
      );

      if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message && response.data.choices[0].message.content) {
        const generatedText = response.data.choices[0].message.content;
        // Adapt the response to what parseAIResponseToTasks expects
        const generatedTasks = parseAIResponseToTasks([{ generated_text: generatedText }]);
        
        if (generatedTasks.length === 0 && generatedText) {
          console.warn(`[AI Study Plan Generate] Model ${model} generated text, but it couldn't be parsed into tasks. Raw output: ${generatedText.substring(0, 200)}...`);
          // Fallback or specific handling if parsing fails but text is present
        }

        // Even if parsing fails, if we have some text, we might want to return it or log it.
        // For now, we prioritize successfully parsed tasks.
        return res.json({
          tasks: generatedTasks,
          message:
            generatedTasks.length > 0
              ? 'Study plan tasks generated successfully.'
              : 'AI could not generate structured tasks based on the input, though it may have provided text.',
          modelUsed: model,
          rawOutput: generatedTasks.length === 0 ? generatedText : undefined, // Include raw output if parsing failed
        });
      } else {
        console.warn(
          `[AI Study Plan Generate] Received unexpected response structure from OpenRouter with model ${model}:\n`,
          JSON.stringify(response.data, null, 2)
        );
        lastError = {
          message: 'AI service returned an unexpected response structure.',
          details: response.data,
          modelAttempted: model,
        };
      }
    } catch (error: any) {
      lastError = error;
      console.error(
        `[AI Study Plan Generate] Error with OpenRouter model ${model}:`,
        error.response ? JSON.stringify(error.response.data, null, 2) : error.message,
      );
      if (error.code === 'ECONNABORTED') {
        console.warn(`[AI Study Plan Generate] Request to OpenRouter model ${model} timed out.`);
      }
      // Continue to the next model
    }
  }

  // If all models failed
  console.error('[AI Study Plan Generate] All OpenRouter models failed.');
  const statusCode = lastError?.response?.status || 500;
  let errorMessage = 'Failed to generate study plan tasks with AI after multiple attempts.';
  if (lastError?.response?.data?.error?.message) {
    errorMessage = lastError.response.data.error.message;
  } else if (lastError?.message) {
    errorMessage = lastError.message;
  }

  return res.status(statusCode).json({ 
    message: errorMessage, 
    error: lastError?.response?.data || lastError?.message, 
    modelAttempted: lastError?.modelAttempted || modelsToTry[modelsToTry.length -1]
  });
});

router.post('/study-plan/optimize', async (req: Request, res: Response) => {
  const { tasks, optimizationGoal, userContext } = req.body;
  // @ts-ignore
  const userId = req.user?.uid || 'anonymous';
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res
      .status(400)
      .json({
        message: 'A list of tasks is required to optimize a study plan.',
      });
  }
  console.log(
    `[AI Study Plan Optimize] User: ${userId}, Goal: ${optimizationGoal}, Time: ${new Date().toISOString()}`
  );

  const preferredModel = process.env.STUDY_PLAN_OPTIMIZE_MODEL || 'mistralai/mistral-7b-instruct';
  const fallbackModels = [
    'openai/gpt-3.5-turbo',
    'google/gemini-flash-1.5',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', // Free model
    // 'huggingfaceh4/zephyr-7b-beta', // Removed as per user preference
  ];
  const allModels = [preferredModel, ...fallbackModels.filter(m => m !== preferredModel)]; // Ensures preferred is first and no duplicates

  let prompt = `You are an AI assistant helping a student optimize their study plan.
The student has the following list of tasks:
${JSON.stringify(tasks, null, 2)}

The student's goal for optimization is: "${optimizationGoal || 'General improvement and logical ordering'}"
Additional context from the student: "${userContext || 'None'}"

Please analyze these tasks and provide:
1.  An "optimizedTasks" list: This could be a re-ordered version of the tasks, tasks might be merged, split, or have their descriptions/estimatedHours adjusted. Each task in the list should be an object with "title", "description", and "estimatedHours".
2.  A "suggestions" string: Textual advice on how to approach the study plan, potential issues, or other tips.

Return your response as a single well-formed JSON object with two keys: "optimizedTasks" (an array of task objects) and "suggestions" (a string).
Ensure the JSON is valid. Example:
{
  "optimizedTasks": [
    {"title": "Review Topic B (priority)", "description": "Focus on key concepts and examples.", "estimatedHours": 2},
    {"title": "Practice exercises for Topic A", "description": "Complete all exercises from chapter 3.", "estimatedHours": 3}
  ],
  "suggestions": "Consider allocating more time for Topic B as it is a prerequisite for Topic C. Break down larger tasks into smaller, manageable chunks."
}

Optimized JSON Output:`;

  let lastError: any = null;

  for (const model of allModels) {
    try {
      console.log(
        `[AI Study Plan Optimize] Sending request to OpenRouter model: ${model}`
      );
      const openRouterResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3, // Lower temperature for more deterministic JSON output
          max_tokens: 1024, // Increased max_tokens for potentially larger study plans
          response_format: { type: "json_object" } // Request JSON output
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL, // Replace with your actual app URL
            'X-Title': process.env.APP_NAME, // Replace with your actual app name
          },
          timeout: 60000, // Increased timeout to 60 seconds
        }
      );

      let aiResponseContent = openRouterResponse.data.choices[0]?.message?.content;
      if (!aiResponseContent) {
        throw new Error('No content in AI response');
      }

      // Attempt to parse the JSON response
      // The response might be a stringified JSON or a JSON object within a string.
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponseContent);
      } catch (parseError: any) {
        // If direct parsing fails, try to extract JSON from a code block if present
        const jsonMatch = aiResponseContent.match(/```json\\n([\\s\\S]*?)\\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedResponse = JSON.parse(jsonMatch[1]);
          } catch (e) {
            console.error('[AI Study Plan Optimize] Failed to parse extracted JSON from model:', model, e);
            throw new Error(`Failed to parse JSON from AI response (model: ${model}). Raw content: ${aiResponseContent}`);
          }
        } else {
          console.error('[AI Study Plan Optimize] Failed to parse JSON from model:', model, parseError);
          throw new Error(`Failed to parse JSON from AI response (model: ${model}). Raw content: ${aiResponseContent}`);
        }
      }
      
      const { optimizedTasks, suggestions } = parsedResponse;

      if (!optimizedTasks || !suggestions) {
         console.warn('[AI Study Plan Optimize] Parsed response missing optimizedTasks or suggestions from model:', model, 'Parsed:', parsedResponse);
         throw new Error('AI response was parsed but did not contain the expected "optimizedTasks" or "suggestions" fields.');
      }
      
      // Basic validation of optimizedTasks structure
      if (!Array.isArray(optimizedTasks) || !optimizedTasks.every(task => typeof task.title === 'string' && typeof task.description === 'string' && typeof task.estimatedHours === 'number')) {
        console.warn('[AI Study Plan Optimize] optimizedTasks has incorrect structure from model:', model, 'Tasks:', optimizedTasks);
        throw new Error('AI response field "optimizedTasks" has an invalid structure.');
      }


      return res.json({
        tasks: optimizedTasks,
        suggestions,
        message: 'Study plan optimization processed successfully.',
        modelUsed: model,
      });
    } catch (error: any) {
      lastError = error;
      console.error(
        `[AI Study Plan Optimize] Error with model ${model}:`,
        error.response ? error.response.data : error.message
      );
      if (error.code === 'ECONNABORTED') {
        console.warn(`[AI Study Plan Optimize] Request to ${model} timed out.`);
      }
      // If it's the last model in the list and it failed, then return the error
      if (allModels.indexOf(model) === allModels.length - 1) {
        let errorMessage = 'Failed to optimize study plan tasks with AI after trying all available models.';
        if (lastError.response && lastError.response.data && lastError.response.data.error) {
          errorMessage += ` Last Model Error (${model}): ${JSON.stringify(lastError.response.data.error)}`;
        } else if (lastError.message) {
          errorMessage += ` Last Error (${model}): ${lastError.message}`;
        }
        return res.status(500).json({ message: errorMessage, error: lastError.message, modelUsed: model });
      }
      // Otherwise, try the next model
    }
  }
  // Should not be reached if at least one model is tried, but as a fallback:
  if (lastError) {
     return res.status(500).json({ message: 'Failed to optimize study plan tasks with AI.', error: lastError.message });
  }
});

// New route for /api/ai/nlp
router.post('/nlp', limiter, async (req: Request, res: Response, next: NextFunction) => {
  const { text, user = 'anonymous' } = req.body as NlpRequest; // Removed requestedModel

  if (!text) {
    return res.status(400).json({ message: 'Text is required for NLP processing.' });
  }

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    console.error('[AI NLP] OpenRouter API key not configured.');
    return res.status(500).json({ error: 'AI service not configured (key missing).' });
  }

  // Define models to try with OpenRouter
  const modelsToTry = [
    'mistralai/mistral-7b-instruct', // Preferred
    'openai/gpt-3.5-turbo',
    'google/gemini-flash-1.5',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', // Free model
    // 'huggingfaceh4/zephyr-7b-beta', // Removed as per user preference
  ];

  let lastError: any = null;
  const cacheKey = `nlp-openrouter-${text.substring(0,100).replace(/\s+/g, '_')}`;

  if (aiCache[cacheKey] && (Date.now() - aiCache[cacheKey].timestamp < CACHE_TTL)) {
    console.log(`[AI NLP] Returning cached OpenRouter result for text snippet: "${text.substring(0,30)}..."`);
    return res.json({ generated_text: aiCache[cacheKey].result.generated_text, cached: true, modelUsed: aiCache[cacheKey].result.modelUsed });
  }

  for (const model of modelsToTry) {
    console.log(
      `[AI NLP] Attempting with OpenRouter model: ${model}. User: ${user}, Text length: ${text.length}, Time: ${new Date().toISOString()}`
    );
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: text }],
          // You can add other parameters like max_tokens, temperature here if needed
          // stream: false, // Explicitly set stream to false if not streaming
        },
        {
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            // Recommended headers by OpenRouter, though not strictly necessary for all requests
            // 'HTTP-Referer': 'YOUR_SITE_URL', // Replace with your actual site URL or a generic one
            // 'X-Title': 'YOUR_SITE_NAME', // Replace with your actual site name or a generic one
          },
          timeout: 25000, // Timeout for the API call
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message && response.data.choices[0].message.content) {
        const result = { 
          generated_text: response.data.choices[0].message.content,
          modelUsed: model 
        };
        aiCache[cacheKey] = { result, timestamp: Date.now() };
        console.log(`[AI NLP] OpenRouter request successful with model: ${model}.`);
        return res.json({ generated_text: result.generated_text, cached: false, modelUsed: result.modelUsed });
      } else {
        console.warn(
          `[AI NLP] Received unexpected response structure from OpenRouter with model ${model}:\n`,
          JSON.stringify(response.data, null, 2)
        );
        lastError = {
          status: 500,
          message: 'AI service returned an unexpected response structure.',
          details: response.data,
          modelAttempted: model,
        };
        // Continue to next model if structure is not as expected
      }
    } catch (error: any) {
      lastError = error; // Store the error and try the next model
      console.error(
        `[AI NLP] Error calling OpenRouter API with model ${model}:`,
        error.response ? JSON.stringify(error.response.data, null, 2) : error.message,
      );
      // If a model specifically is not found (e.g. 404 from OpenRouter for a model name)
      // or if there's a specific error related to the model, we should definitely continue.
      // for other errors (like auth, rate limits), retrying with a different model might not help,
      // but the loop structure handles this by trying all specified models.
      if (error.response && error.response.status === 429) {
        // Specific handling for rate limits - maybe break and return this error immediately
        console.warn(`[AI NLP] Rate limited by OpenRouter with model ${model}.`);
        // For now, we'll let it try other models, though if one is rate-limited, others might be too.
      }
    }
  }

  // If all models failed
  console.error(`[AI NLP] All OpenRouter models failed for text: "${text.substring(0,30)}..."`);
  if (lastError) {
    const statusCode = lastError.response?.status || 500;
    let message = 'AI service request failed after multiple attempts.';
    if (lastError.response?.data?.error?.message) {
      message = lastError.response.data.error.message;
    } else if (lastError.message) {
      message = lastError.message;
    }
    
    return res.status(statusCode).json({
      error: 'AI Service Error',
      message: message,
      details: lastError.response?.data || lastError.message,
      modelAttempted: lastError.modelAttempted || modelsToTry[modelsToTry.length -1],
      messageFromCopilot: `AI request failed for text: "${text.substring(0,30)}..." after trying models: ${modelsToTry.join(', ')}.`
    });
  } else {
    // This case should ideally not be reached if lastError is always set in catch blocks
    return res.status(500).json({ 
      error: 'AI Service Error',
      message: 'AI request failed after trying all fallbacks and no specific error was caught.',
      messageFromCopilot: `AI request failed for text: "${text.substring(0,30)}..." after trying models: ${modelsToTry.join(', ')}.`
    });
  }
});

// Extracted NER calling function - now using OpenRouter
async function callOpenRouterNER(
  text: string,
  preferredModel: string = 'mistralai/mistral-7b-instruct',
  fallbackModels: string[] = [
    'openai/gpt-3.5-turbo',
    'google/gemini-flash-1.5',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', // Free model
    // 'huggingfaceh4/zephyr-7b-beta', // Removed as per user preference
  ]
): Promise<any[]> { // Define a more specific return type based on expected NER output
  const allModels = [preferredModel, ...fallbackModels.filter(m => m !== preferredModel)];
  let lastError: any = null;

  // Updated prompt for NER to be more specific for syllabus content
  const prompt = `You are an expert syllabus analyzer. From the following text, extract key academic entities.
Focus on identifying:
- "ASSIGNMENT": Specific tasks, homework, projects, quizzes, exams (e.g., "Midterm Exam", "Research Paper Due", "Quiz 1").
- "TOPIC": Main subjects, chapters, themes, or concepts to be covered (e.g., "Chapter 3: Cell Division", "Introduction to Quantum Mechanics").
- "EVENT": Important academic events or deadlines that are not assignments (e.g., "Spring Break", "Add/Drop Deadline", "Final Exam Period").
- "DATE": Specific dates or date-related phrases (e.g., "October 26th", "next Tuesday", "Week 5").
- "PERSON": Names of people (e.g., "Professor Smith").
- "LOCATION": Places relevant to the course (e.g., "Room 301", "Online via Zoom").
- "ORGANIZATION": Institutions or groups (e.g., "University Name", "Study Group B").

Return the entities as a single, well-formed JSON array of objects. Each object in the array must have the following keys:
- "text": The exact text of the extracted entity.
- "entity_group": One of the predefined types: "ASSIGNMENT", "TOPIC", "EVENT", "DATE", "PERSON", "LOCATION", "ORGANIZATION".
- "start": The starting character index of the entity in the original text.
- "end": The ending character index of the entity in the original text.

Example of a valid JSON array response:
[
  {"text": "Midterm Exam", "entity_group": "ASSIGNMENT", "start": 25, "end": 37},
  {"text": "Chapter 1", "entity_group": "TOPIC", "start": 50, "end": 59},
  {"text": "October 26th", "entity_group": "DATE", "start": 70, "end": 82}
]

Syllabus Text to Analyze:
"${text}"

JSON Output:`;

  for (const model of allModels) {
    try {
      console.log(`[OpenRouter NER] Sending request to model: ${model}`);
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2, // Lower temperature for more factual extraction
          max_tokens: 512, // Adjust as needed
          response_format: { type: "json_object" } // Request JSON output, if model supports it
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL, 
            'X-Title': process.env.APP_NAME, 
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      let aiResponseContent = response.data.choices[0]?.message?.content;
      if (!aiResponseContent) {
        throw new Error('No content in AI response for NER');
      }
      
      let parsedResponse;
      try {
        // Assuming the model returns a JSON string that needs to be parsed.
        // The top-level response might be an object with a key containing the array, e.g. { "entities": [...] }
        // Or it might be the array directly.
        const rawJson = JSON.parse(aiResponseContent);
        if (Array.isArray(rawJson)) {
            parsedResponse = rawJson;
        } else if (rawJson.entities && Array.isArray(rawJson.entities)) {
            parsedResponse = rawJson.entities;
        } else {
            // Try to find an array in the response object if the structure is unknown
            const arrayKey = Object.keys(rawJson).find(key => Array.isArray(rawJson[key]));
            if (arrayKey) {
                parsedResponse = rawJson[arrayKey];
            } else {
                 throw new Error('NER response is not a JSON array and does not contain an \'entities\' array key.');
            }
        }

      } catch (parseError: any) {
        const jsonMatch = aiResponseContent.match(/```json\\n([\\s\\S]*?)\\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const extractedJson = JSON.parse(jsonMatch[1]);
            if (Array.isArray(extractedJson)) {
                parsedResponse = extractedJson;
            } else if (extractedJson.entities && Array.isArray(extractedJson.entities)) {
                parsedResponse = extractedJson.entities;
            } else {
                const arrayKey = Object.keys(extractedJson).find(key => Array.isArray(extractedJson[key]));
                if (arrayKey) {
                    parsedResponse = extractedJson[arrayKey];
                } else {
                    throw new Error('Extracted NER response is not a JSON array and does not contain an \'entities\' array key.');
                }
            }
          } catch (e) {
            console.error('[OpenRouter NER] Failed to parse extracted JSON from model:', model, e);
            throw new Error(`Failed to parse extracted JSON for NER from AI response (model: ${model}). Raw content: ${aiResponseContent}`);
          }
        } else {
          console.error('[OpenRouter NER] Failed to parse JSON from model:', model, parseError);
          throw new Error(`Failed to parse JSON for NER from AI response (model: ${model}). Raw content: ${aiResponseContent}`);
        }
      }

      // Validate structure of parsedResponse (array of objects with expected keys)
      if (!Array.isArray(parsedResponse) || !parsedResponse.every(item => 
          typeof item === 'object' &&
          item !== null &&
          'text' in item &&
          'entity_group' in item &&
          'start' in item &&
          'end' in item )) {
            console.warn('[OpenRouter NER] NER response has incorrect structure from model:', model, 'Response:', parsedResponse);
            throw new Error('AI NER response has an invalid structure.');
      }

      console.log(`[OpenRouter NER] Successfully received and parsed NER data from model: ${model}`);
      return parsedResponse; // Return the array of entities

    } catch (error: any) {
      lastError = error;
      console.error(
        `[OpenRouter NER] Error with model ${model}:`,
        error.response ? error.response.data : error.message
      );
      if (allModels.indexOf(model) === allModels.length - 1) {
        let errorMessage = `Failed to perform NER with OpenRouter after trying all models.`;
        if (lastError.response && lastError.response.data && lastError.response.data.error) {
          errorMessage += ` Last Model Error (${model}): ${JSON.stringify(lastError.response.data.error)}`;
        } else if (lastError.message) {
          errorMessage += ` Last Error (${model}): ${lastError.message}`;
        }
        throw new Error(errorMessage);
      }
    }
  }
  // Fallback if all models fail, though the loop should throw before this.
  throw new Error('Failed to get NER data from OpenRouter. Last error: ' + (lastError?.message || 'Unknown error'));
}

// Update the call site for NER in /api/ai/syllabus/process route
router.post('/syllabus/process', async (req: Request, res: Response) => {
  const { syllabusText, userGoals } = req.body;

  // @ts-ignore
  const userId = req.user?.uid || 'anonymous';

  if (!syllabusText) {
    return res.status(400).json({ message: 'Syllabus text is required.' });
  }

  console.log(
    `[API AI Syllabus Process] User: ${userId}, Time: ${new Date().toISOString()}`,
  );

  try {
    // Call OpenRouter NER instead of Hugging Face
    const nerResults = await callOpenRouterNER(syllabusText);
    
    // ... existing processing logic for nerResults ...

  } catch (error: any) {
    console.error(
      '[API AI Syllabus Process] Error processing syllabus with AI:',
      error.response ? error.response.data : error.message,
    );
    return res.status(500).json({
      message: 'Failed to process syllabus with AI.',
      error: error.response?.data || error.message,
    });
  }
});

// Comment out or remove the old callHuggingFaceNER function
/*
async function callHuggingFaceNER(
  text: string,
  model: string = \'dbmdz/bert-large-cased-finetuned-conll03-english\',
) {
  try {
    const hfResponse = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: text, options: { waitForModel: true } },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
          \'Content-Type\': \'application/json\',
        },
        timeout: 20000,
      },
    );
    return hfResponse.data;
  } catch (error: any) {
    console.error(
      `Error calling Hugging Face NER model (${model}):`,
      error.response ? error.response.data : error.message,
    );
    if (
      error.response &&
      error.response.data &&
      error.response.data.error ===
        \'Model dbmdz/bert-large-cased-finetuned-conll03-english is currently loading\'
    ) {
      throw new Error(
        `NER model is loading, please try again shortly. Details: ${error.response.data.error}`,
      );
    }
    throw new Error(
      `Hugging Face NER API error: ${error.response?.data?.error || error.message}`,
    );
  }
}
*/

export default router;
