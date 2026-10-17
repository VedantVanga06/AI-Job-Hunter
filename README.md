# AI Job Hunter

An AI-assisted job application workspace built with React, FastAPI, SQLAlchemy, SQLite for local development (or PostgreSQL for hosted use), and Google's Groq API. Upload a resume, compare it with a job description, generate application material, and track applications in one place.

## Features

- Upload PDF and DOCX resumes.
- Extract text from digital PDFs and Word documents; use Tesseract OCR as a fallback for scanned PDFs.
- Analyze resume-to-job fit with a match score, matched skills, missing skills, ATS keywords, and actionable suggestions.
- Review a resume profile independently of a specific role.
- Generate a tailored cover letter.
- Generate role-specific interview preparation with a candidate introduction, technical and HR practice questions, and preparation tips.
- Save job applications and track status, notes, and match scores.
- Search, filter, and sort saved applications.
- View application dashboard statistics.

> AI results are suggestions, not guarantees of ATS performance or hiring outcomes. Review generated content and never add skills or achievements you cannot substantiate.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript, CSS |
| API | Python, FastAPI, Uvicorn, Pydantic |
| Database | SQLAlchemy, SQLite locally; PostgreSQL supported for hosting |
| AI | Google Groq API via `groq` |
| Resume parsing | pypdf, python-docx, PyMuPDF, pytesseract, Tesseract OCR |

## Project structure

```text
AI-Job-Hunter/
├── backend/
│   ├── services/
│   │   ├── ai_service.py
│   │   └── resume_parser.py
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env                 # local only; never commit
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example\n│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.11+ (Python 3.13 may work depending on installed package compatibility).
- Node.js 22 or another version supported by the installed Vite release.
- A Google Groq API key from [Groq Console](https://console.groq.com/keys).
- Tesseract OCR installed and available on PATH if you need scanned-PDF OCR.

## Run locally (Windows CMD)

### 1. Configure the backend

From the repository root:

```bat
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create `backend/.env` and add your own key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Do not share this file or commit the key.

### 2. Start the API

In the activated backend terminal:

```bat
uvicorn main:app --reload
```

API: http://127.0.0.1:8000  
Interactive API docs: http://127.0.0.1:8000/docs  
Health check: http://127.0.0.1:8000/health

### 3. Start the frontend

Open a second terminal:

```bat
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite, normally http://localhost:5173.

The frontend defaults to `http://127.0.0.1:8000` locally. Copy `frontend/.env.example` to `frontend/.env` if you need to override `VITE_API_BASE_URL`. Vite environment values are embedded at build time, so set `VITE_API_BASE_URL=https://your-api-host` in the frontend hosting dashboard before building a hosted version. Never put the Groq API key in the frontend.

## API overview

- `GET /` — API welcome message
- `GET /health` — health check including database connectivity
- `POST /api/upload-resume` — upload and extract PDF/DOCX resume text
- `POST /api/analyze` — compare resume with a job description
- `POST /api/analyze-resume` — profile-level resume review
- `POST /api/generate-cover-letter` — generate a tailored cover letter\n- `POST /api/improve-resume` — suggest resume improvements\n- `POST /api/interview-prep` — generate interview preparation
- `GET /api/applications` — list saved applications
- `POST /api/applications` — create an application
- `GET /api/applications/{application_id}` — get one application
- `PUT /api/applications/{application_id}` — update status/notes
- `DELETE /api/applications/{application_id}` — delete an application

## Hosted deployment configuration\n\n### Backend (Render)\n\n- Build command: `cd backend && pip install -r requirements.txt`\n- Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`\n- Set `GROQ_API_KEY` as a private environment variable in the backend service.\n- For durable hosted application data, provision a managed PostgreSQL database and set its internal connection URL as `DATABASE_URL`. The backend normalizes Render-style `postgres://` URLs and uses PostgreSQL when configured; without it, SQLite is used and may not survive ephemeral filesystem changes.\n- Set `FRONTEND_ORIGINS` to a comma-separated list of trusted frontend origins.\n- Configure the health-check path as `/health`.\n\n### Frontend (Render static site or Netlify)\n\n- Base directory: `frontend` (or run commands from repository root with the `frontend/` prefix).\n- Build command: `npm ci && npm run build` from the frontend directory.\n- Publish directory: `frontend/dist`.\n- Set `VITE_API_BASE_URL` to the deployed backend origin, without a trailing slash.\n\n### Tests\n\nRun backend tests from the `backend` directory after installing `requirements.txt`: `pytest -q`. Run frontend checks from `frontend`: `npm ci`, `npm run build`, and `npm run lint`. GitHub Actions runs these checks for the project branch and pull requests.\n\n## Troubleshooting

- **Groq quota / HTTP 429:** free-tier usage has rate limits. Wait for the quota window to reset and avoid repeatedly clicking AI actions.
- **API unavailable / Failed to fetch:** make sure Uvicorn is running and the frontend API URL and CORS origins match.
- **Scanned PDF returns little text:** install Tesseract OCR and confirm `tesseract --version` works in the same terminal.
- **Python import errors:** activate the backend virtual environment and install `requirements.txt`.

## Security notes

- Keep API keys in environment variables; never commit `.env`.
- Resume files can contain personal data. Process them only with consent and avoid logging extracted resume contents.
- The API enforces a 10 MB resume upload limit, validates tracker statuses and field lengths, and checks database connectivity through `/health`. Before handling real users or private applications, add authentication/authorization and rate limiting; the current tracker is not user-isolated, so do not treat it as a multi-user private service yet.

## Current status

This is an actively developed portfolio project. Local build and API tests should be run after pulling changes; GitHub updates alone do not verify the app in your local Windows environment.
