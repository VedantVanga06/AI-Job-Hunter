# AI Job Hunter

An AI-assisted job application workspace built with React, FastAPI, SQLAlchemy, SQLite, and Google's Gemini API. Upload a resume, compare it with a job description, generate application material, and track applications in one place.

## Features

- Upload PDF and DOCX resumes.
- Extract text from digital PDFs and Word documents; use Tesseract OCR as a fallback for scanned PDFs.
- Analyze resume-to-job fit with a match score, matched skills, missing skills, ATS keywords, and actionable suggestions.
- Review a resume profile independently of a specific role.
- Generate a tailored cover letter.
- Save job applications and track status, notes, and match scores.
- Search, filter, and sort saved applications.
- View application dashboard statistics.

> AI results are suggestions, not guarantees of ATS performance or hiring outcomes. Review generated content and never add skills or achievements you cannot substantiate.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript, CSS |
| API | Python, FastAPI, Uvicorn, Pydantic |
| Database | SQLAlchemy, SQLite |
| AI | Google Gemini API via `google-genai` |
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
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.11+ (Python 3.13 may work depending on installed package compatibility).
- Node.js 22 or another version supported by the installed Vite release.
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
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
GEMINI_API_KEY=your_gemini_api_key_here
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

The frontend expects the API at `http://127.0.0.1:8000`. If you deploy either side, configure the API base URL for that environment rather than hard-coding localhost.

## API overview

- `GET /` — API welcome message
- `GET /health` — health check
- `POST /api/upload-resume` — upload and extract PDF/DOCX resume text
- `POST /api/analyze` — compare resume with a job description
- `POST /api/analyze-resume` — profile-level resume review
- `POST /api/generate-cover-letter` — generate a tailored cover letter
- `GET /api/applications` — list saved applications
- `POST /api/applications` — create an application
- `GET /api/applications/{application_id}` — get one application
- `PUT /api/applications/{application_id}` — update status/notes
- `DELETE /api/applications/{application_id}` — delete an application

## Troubleshooting

- **Gemini quota / HTTP 429:** free-tier usage has rate limits. Wait for the quota window to reset and avoid repeatedly clicking AI actions.
- **API unavailable / Failed to fetch:** make sure Uvicorn is running and the frontend API URL and CORS origins match.
- **Scanned PDF returns little text:** install Tesseract OCR and confirm `tesseract --version` works in the same terminal.
- **Python import errors:** activate the backend virtual environment and install `requirements.txt`.

## Security notes

- Keep API keys in environment variables; never commit `.env`.
- Resume files can contain personal data. Process them only with consent and avoid logging extracted resume contents.
- Before public deployment, add request size limits, authentication/rate limiting as appropriate, HTTPS, and production database configuration.

## Current status

This is an actively developed portfolio project. Local build and API tests should be run after pulling changes; GitHub updates alone do not verify the app in your local Windows environment.
