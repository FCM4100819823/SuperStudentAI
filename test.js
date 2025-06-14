fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization:
      "Bearer <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>",
    "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o",
    messages: [
      {
        role: "user",
        content: "What is the meaning of life?",
      },
    ],
  }),
});
