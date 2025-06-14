// This file contains type declarations for API responses
declare module 'axios' {
  export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
    request?: any;
  }
}

// OpenAI/OpenRouter API response type
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Declare the OpenAI response for use in axios responses
declare module 'axios' {
  export interface AxiosResponse<T = any> {
    data: T extends object ? T : OpenAIResponse;
  }
}
