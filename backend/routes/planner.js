const express = require('express');
const router = express.Router();
const { streamItinerary } = require('../services/geminiService');

// POST /api/planner/generate - Generate trip itinerary with streaming
router.post('/generate', async (req, res) => {
  const { destination, startDate, endDate, budget, interests } = req.body;

  // Validation
  if (!destination || !destination.trim()) {
    return res.status(400).json({ error: 'Destination is required' });
  }
  if (!startDate) {
    return res.status(400).json({ error: 'Start date is required' });
  }
  if (!endDate) {
    return res.status(400).json({ error: 'End date is required' });
  }
  if (!budget || !budget.trim()) {
    return res.status(400).json({ error: 'Budget is required' });
  }
  if (!interests || !interests.trim()) {
    return res.status(400).json({ error: 'Interests are required' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  try {
    await streamItinerary(destination, startDate, endDate, budget, interests, res);
  } catch (error) {
    console.error('Planner route error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate itinerary' });
    }
  }
});

module.exports = router;
