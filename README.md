# What Did I Do?

**What Did I Do?** is an AI-powered personal memory assistant that helps users record, recall, and reflect on their daily lives through natural conversations. Users simply describe their day, and the system extracts key events, activities, and experiences, storing them in a structured database for future reference.

The application can answer questions such as "What did I do today?" by generating a concise summary of the day's events. It also provides weekly and monthly summaries that highlight routines, achievements, and recurring patterns while suggesting areas for improvement.

By analyzing historical data, the AI offers personalized recommendations to promote a healthier work-life balance, improve productivity, and encourage better habits. Rather than acting as a traditional journal, the system serves as a second memory, helping users understand how they spend their time and supporting continuous personal growth through meaningful insights and conversational interaction.

## Project Structure

```
what-do-i-do/
├── frontend/    # Client application
├── backend/     # FastAPI + MongoDB API
└── README.md
```

## Backend

Tech stack: **Python FastAPI** + **MongoDB**

### Setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then edit SMTP / Mongo settings
```

Start MongoDB locally, then run:

```bash
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

### Auth flow

1. `POST /api/auth/register` — username, email, password  
2. `POST /api/auth/send-otp` — user_id  
3. `POST /api/auth/verify-otp` — user_id, otp  
4. `POST /api/auth/login` — identifier (username or email), password → JWT  

Protected routes use `Authorization: Bearer <token>` via shared JWT middleware (`get_current_user` / `get_current_verified_user`).

### Profile

- `GET /api/profile` — current user profile  
- `PUT /api/profile` — update `tell_me_about_your_life`