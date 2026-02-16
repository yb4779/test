# Trading Assistant Platform

A full-stack AI-powered trading assistant with voice input, real-time market data,
sentiment analysis, and task management for US and Indian markets.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React + TS)               │
│  ┌──────────┬──────────┬────────┬─────────┬───────┐ │
│  │  Voice   │ Trading  │  Task  │Sentiment│Expand-│ │
│  │  Input   │Dashboard │Manager │  Feed   │ able  │ │
│  └──────────┴──────────┴────────┴─────────┴───────┘ │
├─────────────────────────────────────────────────────┤
│              Backend (Flask + Python)                 │
│  ┌──────────┬──────────┬────────┬─────────────────┐ │
│  │ Market   │Sentiment │Reminder│   Voice         │ │
│  │ Data API │ Service  │Service │   Processing    │ │
│  └──────────┴──────────┴────────┴─────────────────┘ │
├─────────────────────────────────────────────────────┤
│                   Data Layer                         │
│  ┌──────────────────┬──────────────────────────────┐│
│  │  PostgreSQL       │  Redis Cache               ││
│  │  (Cloud SQL)      │  (Market Data)             ││
│  └──────────────────┴──────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│              External Integrations                   │
│  Alpha Vantage │ Reddit API │ NewsAPI │ APNs        │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in your API keys
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker (Full Stack)
```bash
docker-compose up --build
```

## Google Cloud Deployment
```bash
cd docker
./deploy.sh
```

## Environment Variables

See `backend/.env.example` for required API keys:
- `ALPHA_VANTAGE_API_KEY` — Market data
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` — Sentiment scraping
- `NEWS_API_KEY` — Headlines feed
- `DATABASE_URL` — PostgreSQL connection
- `APNS_KEY_ID` / `APNS_TEAM_ID` — iPhone push notifications
