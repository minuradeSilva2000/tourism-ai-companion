const express = require('express');
const router = express.Router();
const { streamChatResponse } = require('../services/geminiService');
const ChatSession = require('../models/ChatSession');

// POST /api/chat/stream - Stream AI chat response
router.post('/stream', async (req, res) => {
  const { messages, sessionId } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content || lastMessage.content.trim() === '') {
    return res.status(400).json({ error: 'Please enter a question' });
  }

  try {
    await streamChatResponse(messages, res);

    // Save session to DB after streaming
    if (sessionId) {
      try {
        await ChatSession.findOneAndUpdate(
          { sessionId },
          {
            $set: { messages, updatedAt: new Date() }
          },
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.error('DB save error:', dbError);
      }
    }
  } catch (error) {
    console.error('Chat stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to get AI response' });
    }
  }
});

// GET /api/chat/session/:sessionId - Get chat session history
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.json({ messages: [] });
    }
    res.json({ messages: session.messages });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

module.exports = router;
