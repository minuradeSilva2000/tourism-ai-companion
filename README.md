# tourism-ai-companion
An intelligent AI-powered travel companion built with Gemini 2.5 Flash. Generates personalized day-by-day itineraries, provides real-time destination insights, and answers travel-related queries with smart grounding.
# Tourism AI Agent 🌍✈️

An AI-powered travel companion web application built with the MERN stack (MongoDB, Express, React, Node.js), powered by Google Gemini 2.5 Flash AI.

## Project Structure

```
├── backend/          # Node.js + Express API
│   ├── models/       # MongoDB Mongoose models
│   ├── routes/       # API route handlers
│   ├── services/     # Gemini AI service
│   └── server.js     # Entry point
│
└── frontend/         # React application
    └── src/
        ├── components/  # Navbar
        └── pages/       # HomePage, ChatPage, DestinationsPage, TripPlannerPage
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Gemini API key

## Setup & Run

### Backend

```bash
cd backend
npm install
# Edit .env with your MongoDB URI and Gemini API key
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tourism-ai
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Features

- **Homepage** — Hero section, destinations carousel, stats counter, features overview, testimonials, newsletter signup
- **AI Chat Page** — Real-time streaming chat with Gemini AI for travel Q&A
- **Destinations Explorer** — Browse & filter 12 destinations by continent and category
- **Trip Planner** — Generate AI-powered day-by-day itineraries
- **Responsive Navigation** — Sticky header with mobile hamburger menu
