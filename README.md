# 🏏 IPL Prediction App

A full-stack sports prediction web application for IPL cricket. Make predictions on matches, earn points for correct calls, and compete on the global leaderboard.

## Tech Stack

- **Frontend**: React 18 + Vite, React Router v6, Axios (inline styles, dark theme)
- **Backend**: Node.js + Express, MongoDB + Mongoose, JWT authentication, bcryptjs

## Project Structure

```
├── client/     # React frontend (Vite)
└── server/     # Express API backend
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)

### Server Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run seed    # Seed 12 IPL matches
npm run dev     # Start on port 5000
```

### Client Setup

```bash
cd client
npm install
cp .env.example .env
# Edit .env if your API is not at http://localhost:5000
npm run dev     # Start on port 5173
```

## Environment Variables

**server/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ipl_prediction
JWT_SECRET=your_secure_secret_here
JWT_EXPIRES_IN=7d
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/matches` | No | List matches (filter: `?status=upcoming\|live\|completed`) |
| GET | `/api/matches/:id` | No | Match details |
| POST | `/api/predictions` | Yes | Create prediction |
| GET | `/api/predictions/my` | Yes | My predictions |
| GET | `/api/predictions/match/:matchId` | No | Predictions for a match |
| GET | `/api/leaderboard` | No | Global leaderboard |
| GET | `/api/dashboard` | Yes | User dashboard data |

## Features

- 🔐 JWT-based authentication (register/login)
- 📅 Browse IPL matches by status (upcoming/live/completed)
- 🎯 Submit predictions for upcoming and live matches
- 🏆 Global leaderboard ranked by points and accuracy
- 📊 Personal dashboard with stats and recent activity
- 🌑 Dark theme UI with blue accents
A full-stack sports prediction web applications built using modern web technologies, featuring real time match data, user authentication, leaderboards, and interactive dashboards.
