# 🤖 AI Job Hunter

An AI-powered job application assistant that analyzes your resume against job descriptions and helps you understand how well you match a role.

## 🚀 Features

- 📄 Upload PDF or DOCX resumes
- 🔍 Extract text from resumes
- 👁️ OCR support for scanned PDF resumes
- 🤖 AI-powered resume analysis
- 📊 Resume-to-job match score
- 💪 Identify matching skills
- ⚠️ Identify missing skills
- 💡 Personalized improvement suggestions
- ✍️ AI-generated cover letters
- 📋 Application tracker
- 📈 Application dashboard and statistics
- 🔎 Search and filter saved applications

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite

### AI
- Google Gemini API

### Resume Processing
- PyPDF
- python-docx
- PyMuPDF
- Tesseract OCR

## 🏗️ Project Structure

```text
AI-Job-Hunter/
│
├── backend/
│   ├── services/
│   │   ├── ai_service.py
│   │   └── resume_parser.py
│   ├── database.py
│   ├── main.py
│   └── venv/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
├── .gitignore
└── README.md