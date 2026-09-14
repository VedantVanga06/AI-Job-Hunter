from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.ai_service import analyze_resume, JobAnalysis
app = FastAPI(
    title="AI Job Hunter API",
    description="AI-powered resume and job matching API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobAnalysisRequest(BaseModel):
    resume: str
    job_description: str


@app.get("/")
def home():
    return {
        "message": "AI Job Hunter API is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/api/analyze", response_model=JobAnalysis)
def analyze_job(request: JobAnalysisRequest):

    result = analyze_resume(
        request.resume,
        request.job_description
    )

    return result