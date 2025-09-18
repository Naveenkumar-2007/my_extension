// Background service worker for Killer extension
console.log('Killer AI Background Service Worker loaded');

// Default API endpoint and settings
const DEFAULT_SETTINGS = {
  google_api_key: 'AIzaSyAxFVRiGB9v4fltBYhSIm-WM8F2Z_SXexI',
  google_api_endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'
};

// Cache for storing Q&A mappings (max 10 entries)
let qaCache = new Map();
const MAX_CACHE_SIZE = 10;

// Rate limiting and quota management - Free tier has 50 requests per day
let requestCount = 0;
let rateLimitResetTime = Date.now() + 60000; // Reset every minute
const MAX_REQUESTS_PER_MINUTE = 10; // Reduced to preserve daily quota
const RATE_LIMIT_DELAY = 500; // 500ms delay between requests

// Daily quota tracking
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();
const MAX_DAILY_REQUESTS = 45; // Leave 5 requests as buffer before hitting the 50 limit

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Killer AI extension installed');
  
  // Set default settings if not exists
  const result = await chrome.storage.local.get(['google_api_key', 'google_api_endpoint']);
  if (!result.google_api_key) {
    await chrome.storage.local.set(DEFAULT_SETTINGS);
  }
  
  // Initialize cache from storage
  const cacheData = await chrome.storage.local.get('qaCache');
  if (cacheData.qaCache) {
    qaCache = new Map(Object.entries(cacheData.qaCache));
  }
  
  // Initialize daily quota tracking - reset for new API key
  dailyRequestCount = 0;
  lastResetDate = new Date().toDateString();
  await chrome.storage.local.set({ 
    dailyRequestCount: 0, 
    lastResetDate: lastResetDate,
    google_api_key: DEFAULT_SETTINGS.google_api_key 
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type);
  
  if (request.type === 'req') {
    handleAIRequest(request, sender.tab.id, sendResponse);
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'getSettings') {
    chrome.storage.local.get(['google_api_key', 'google_api_endpoint'])
      .then(settings => sendResponse(settings));
    return true;
  }
  
  if (request.type === 'saveSettings') {
    chrome.storage.local.set(request.settings)
      .then(() => sendResponse({ success: true }));
    return true;
  }
});

// Handle AI request with caching and rate limiting
async function handleAIRequest(request, tabId, sendResponse) {
  const { mode, text } = request;
  
  try {
    // Check if we need to reset daily quota
    const currentDate = new Date().toDateString();
    if (currentDate !== lastResetDate) {
      dailyRequestCount = 0;
      lastResetDate = currentDate;
      await chrome.storage.local.set({ dailyRequestCount: 0, lastResetDate: currentDate });
    }
    
    // Check daily quota first - provide fallback instead of error
    if (dailyRequestCount >= MAX_DAILY_REQUESTS) {
      const fallbackResponse = getFallbackResponse(mode, text);
      
      chrome.tabs.sendMessage(tabId, {
        type: 'response',
        mode,
        text,
        response: fallbackResponse,
        cached: false,
        fallback: true,
        timestamp: new Date().toISOString(),
        quotaInfo: {
          remaining: 0,
          total: MAX_DAILY_REQUESTS,
          exhausted: true
        }
      });
      
      sendResponse({ success: true, fallback: true });
      return;
    }
    
    // Check rate limit
    if (Date.now() > rateLimitResetTime) {
      requestCount = 0;
      rateLimitResetTime = Date.now() + 60000;
    }
    
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
      // Instead of throwing error, add a delay
      console.log('Rate limit approaching, adding delay...');
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
    
    // Check cache first
    const cacheKey = `${mode}:${text.substring(0, 100)}`;
    if (qaCache.has(cacheKey)) {
      console.log('Returning cached response');
      const cachedResponse = qaCache.get(cacheKey);
      
      chrome.tabs.sendMessage(tabId, {
        type: 'response',
        mode,
        text,
        response: cachedResponse.response,
        cached: true,
        timestamp: cachedResponse.timestamp
      });
      
      sendResponse({ success: true, cached: true });
      return;
    }
    
    // Get settings
    const settings = await chrome.storage.local.get(['google_api_key', 'google_api_endpoint']);
    const apiKey = settings.google_api_key || DEFAULT_SETTINGS.google_api_key;
    const endpoint = settings.google_api_endpoint || DEFAULT_SETTINGS.google_api_endpoint;
    
    if (!apiKey) {
      throw new Error('API key not configured. Please check settings.');
    }
    
    // Increment request counts
    requestCount++;
    dailyRequestCount++;
    
    // Save daily count to storage
    await chrome.storage.local.set({ dailyRequestCount });
    
    // Prepare prompt based on mode and content type
    let prompt;
    
    // Check if the text contains MCQ patterns
    const isMCQ = /[A-D]\)|[A-D]\.|\(A\)|\(B\)|\(C\)|\(D\)|choice|choose|select|option/i.test(text);
    
    if (mode === 'explain') {
      if (isMCQ) {
        prompt = `This is a multiple choice question. Identify the correct answer and explain why it's correct: ${text}`;
      } else {
        prompt = `Explain: ${text}`;
      }
    } else {
      if (isMCQ) {
        prompt = `This is a multiple choice question. Provide only the correct answer (just the letter and option text, no explanation): ${text}`;
      } else {
        prompt = `Answer: ${text}`;
      }
    }
    
    // Make API request with timeout - increased for better reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 seconds
    
    console.log('Making API request to:', endpoint);
    console.log('Request payload:', JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }, null, 2));
    
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 300, // Increased from 150 to 300 for better answers
          candidateCount: 1
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      // Handle specific error codes better
      if (response.status === 429) {
        // Parse the error response to get more details
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.message.includes('quota')) {
          throw new Error('Daily API quota exceeded (50 requests/day). Extension will reset tomorrow. Try shorter text or check cached responses.');
        } else {
          throw new Error('API rate limit exceeded. Please wait a moment and try again.');
        }
      } else if (response.status === 403) {
        throw new Error('API access denied. Please check your API key in settings.');
      } else if (response.status === 400) {
        throw new Error('Invalid request. Please try selecting different text.');
      } else {
        throw new Error(`API request failed (${response.status}). Please try again.`);
      }
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Better response parsing with error handling
    let aiResponse = "No response generated";
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        aiResponse = candidate.content.parts[0].text || "Empty response";
      } else if (candidate.finishReason === 'SAFETY') {
        aiResponse = "Response blocked by safety filters. Please try different text.";
      }
    } else if (data.error) {
      throw new Error(data.error.message || 'API returned an error');
    }
    
    console.log('Extracted AI Response:', aiResponse);
    
    // Cache the response
    const timestamp = new Date().toISOString();
    qaCache.set(cacheKey, { response: aiResponse, timestamp });
    
    // Maintain cache size limit
    if (qaCache.size > MAX_CACHE_SIZE) {
      const firstKey = qaCache.keys().next().value;
      qaCache.delete(firstKey);
    }
    
    // Save cache to storage
    const cacheObj = Object.fromEntries(qaCache);
    chrome.storage.local.set({ qaCache: cacheObj });
    
    // Send response to content script with quota info
    const remainingRequests = MAX_DAILY_REQUESTS - dailyRequestCount;
    chrome.tabs.sendMessage(tabId, {
      type: 'response',
      mode,
      text,
      response: aiResponse,
      cached: false,
      timestamp,
      quotaInfo: {
        remaining: remainingRequests,
        total: MAX_DAILY_REQUESTS,
        showWarning: remainingRequests <= 5
      }
    });
    
    sendResponse({ success: true, cached: false });
    
  } catch (error) {
    console.error('AI request error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.message.includes('429')) {
      errorMessage = 'API rate limit exceeded. Please wait a moment.';
    } else if (error.message.includes('403')) {
      errorMessage = 'API access denied. Please check API key.';
    } else if (error.message.includes('404')) {
      errorMessage = 'API endpoint not found.';
    }
    
    // Send error to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'error',
      mode,
      text,
      error: errorMessage
    });
    
    sendResponse({ success: false, error: errorMessage });
  }
}

// Fallback responses when quota is exhausted
function getFallbackResponse(mode, text) {
  // Check if it's an MCQ
  const isMCQ = /[A-D]\)|[A-D]\.|\(A\)|\(B\)|\(C\)|\(D\)|choice|choose|select|option/i.test(text);
  
  if (isMCQ) {
    return `📊 MCQ Detected - Daily API limit reached (50 requests)

⚠️ For multiple choice questions, I need the AI to analyze and provide the correct answer. 

🔄 Try again tomorrow when the quota resets, or:
• Search for this specific question online
• Check educational resources like Khan Academy, Coursera, or textbooks
• Ask a teacher or use study forums

The extension resets at midnight with fresh API calls.`;
  }
  
  const fallbackResponses = {
    explain: `I'd love to explain this for you, but we've reached the daily API limit (50 requests). Here's what I can suggest:

📚 Try searching for "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" on:
• Google or Wikipedia for general explanations
• Stack Overflow for programming questions
• MDN Web Docs for web development topics

The extension will reset tomorrow with fresh API calls. You can also check if this was already answered in cached responses.`,

    answer: `I'd like to help answer this, but we've hit the daily API limit (50 requests). Here are some alternatives:

🔍 Quick suggestions for "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}":
• Try rephrasing your question more specifically
• Check if similar questions were already cached
• Search online resources like Google, Stack Overflow, or relevant documentation

The extension resets tomorrow with fresh API quota. Thanks for understanding!`
  };

  return fallbackResponses[mode] || fallbackResponses.answer;
}

// Debounce utility for repeated requests
const debounceMap = new Map();

function debounce(key, func, delay = 300) {
  if (debounceMap.has(key)) {
    clearTimeout(debounceMap.get(key));
  }
  
  const timeoutId = setTimeout(() => {
    func();
    debounceMap.delete(key);
  }, delay);
  
  debounceMap.set(key, timeoutId);
}