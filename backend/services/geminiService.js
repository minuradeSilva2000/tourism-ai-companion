const { GoogleGenerativeAI } = require('@google/generative-ai');

if (process.env.GEMINI_SKIP_TLS_VERIFY === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite')
  .split(',')[0]
  .trim();

const TRAVEL_SYSTEM_PROMPT = `You are an expert AI travel companion and travel agent. You help users with:
- Destination recommendations and information
- Visa requirements and travel documents
- Weather and best time to visit
- Travel costs and budgeting
- Local culture, customs, and tips
- Transportation options
- Accommodation recommendations
- Must-see attractions and hidden gems
- Food and restaurant recommendations
- Safety tips for travelers
- Day-by-day itinerary planning

Always provide helpful, accurate, and detailed travel information. Format your responses clearly with sections when appropriate. When providing information about specific places, include practical details travelers need to know.`;

/**
 * Stream a chat response using Gemini
 */
async function streamChatResponse(messages, res) {
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: TRAVEL_SYSTEM_PROMPT
    });

    // Build chat history (all but last message)
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');

    const result = await chat.sendMessageStream(lastMessage);
    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ type: 'done', fullContent: fullText })}\n\n`);
    res.end();

    return fullText;
  } catch (error) {
    console.error('Gemini streaming error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI service error. Please try again.' })}\n\n`);
    res.end();
    throw error;
  }
}

/**
 * Generate a trip itinerary (non-streaming, returns full text)
 */
async function generateItinerary(destination, startDate, endDate, budget, interests) {
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: TRAVEL_SYSTEM_PROMPT
    });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const prompt = `Create a detailed ${days}-day travel itinerary for ${destination}.

Travel Details:
- Start Date: ${startDate}
- End Date: ${endDate}
- Total Days: ${days}
- Budget: ${budget}
- Interests: ${interests}

Please provide a comprehensive day-by-day itinerary with:
1. For each day: date, morning activities, afternoon activities, evening activities
2. Specific locations, attractions, and restaurants with brief descriptions
3. Transportation tips between locations
4. Estimated costs for key activities
5. Practical tips relevant to the destination and interests
6. Accommodation recommendations

Format the itinerary clearly with Day 1, Day 2, etc. as headers. Make it detailed, practical, and exciting!`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini itinerary generation error:', error);
    throw error;
  }
}

/**
 * Stream itinerary generation
 */
async function streamItinerary(destination, startDate, endDate, budget, interests, res) {
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: TRAVEL_SYSTEM_PROMPT
    });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const prompt = `Create a detailed ${days}-day travel itinerary for ${destination}.

Travel Details:
- Start Date: ${startDate}
- End Date: ${endDate}
- Total Days: ${days}
- Budget: ${budget}
- Interests: ${interests}

Please provide a comprehensive day-by-day itinerary with:
1. For each day: date, morning activities, afternoon activities, evening activities
2. Specific locations, attractions, and restaurants with brief descriptions
3. Transportation tips between locations
4. Estimated costs for key activities
5. Practical tips relevant to the destination and interests
6. Accommodation recommendations

Format the itinerary clearly with Day 1, Day 2, etc. as headers. Make it detailed, practical, and exciting!`;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');

    const result = await model.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done', fullContent: fullText })}\n\n`);
    res.end();

    return fullText;
  } catch (error) {
    console.error('Gemini itinerary streaming error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate itinerary. Please try again.' })}\n\n`);
    res.end();
    throw error;
  }
}

module.exports = { streamChatResponse, generateItinerary, streamItinerary };
