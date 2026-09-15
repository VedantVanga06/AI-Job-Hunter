from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

import os
import tempfile

from services.ai_service import analyze_resume, analyze_resume_profile, generate_cover_letter

from services.resume_parser import extract_resume_text

from database import (
    Base,
    engine,
    get_db,
    JobApplication,
)


# ==========================================
# DATABASE
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="AI Job Hunter API",
    description="AI-powered resume and job matching API",
    version="1.0.0",
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REQUEST MODELS
# ==========================================

class JobAnalysisRequest(BaseModel):
    resume: str
    job_description: str


class ResumeAnalysisRequest(BaseModel):
    resume: str


class JobApplicationCreate(BaseModel):
    company: str
    job_title: str
    job_url: str | None = None
    match_score: int | None = None
    status: str = "Saved"
    notes: str | None = None


class JobApplicationUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None


# ==========================================
# BASIC ROUTES
# ==========================================

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


# ==========================================
# RESUME UPLOAD
# ==========================================

@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    filename = file.filename.lower()

    if not (
        filename.endswith(".pdf")
        or filename.endswith(".docx")
    ):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    file_extension = (
        ".pdf"
        if filename.endswith(".pdf")
        else ".docx"
    )

    temp_path = None

    try:

        file_content = await file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=file_extension
        ) as temp_file:

            temp_file.write(file_content)
            temp_path = temp_file.name

        text = extract_resume_text(temp_path)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the resume."
            )

        return {
            "filename": file.filename,
            "text": text,
            "characters": len(text),
        }

    except HTTPException:
        raise

    except Exception as e:

        print("Resume upload error:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to process the resume."
        )

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


# ==========================================
# JOB MATCH ANALYSIS
# ==========================================
@app.post("/api/analyze")
def analyze_job(request: JobAnalysisRequest):
    try:
        result = analyze_resume(
            request.resume,
            request.job_description
        )
        return result

    except Exception as e:
        error_message = str(e)

        if "429" in error_message or "quota" in error_message.lower():
            raise HTTPException(
                status_code=429,
                detail="Gemini free-tier quota has been reached. Please wait and try again later."
            )

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed. Please try again."
        )
# ==========================================
# RESUME PROFILE ANALYSIS
# ==========================================

@app.post("/api/analyze-resume")
def analyze_resume_endpoint(
    request: ResumeAnalysisRequest
):

    try:

        result = analyze_resume_profile(
            request.resume
        )

        return result

    except Exception as e:

        error_message = str(e)

        print("Resume analysis error:", error_message)

        if (
            "429" in error_message
            or "quota" in error_message.lower()
        ):
            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini free-tier quota has been reached. "
                    "Please wait and try again later."
                )
            )

        raise HTTPException(
            status_code=500,
            detail="Resume analysis failed. Please try again."
        )


# ==========================================
# CREATE JOB APPLICATION
# ==========================================

@app.post("/api/applications")
def create_application(
    application: JobApplicationCreate,
    db: Session = Depends(get_db)
):

    new_application = JobApplication(
        company=application.company,
        job_title=application.job_title,
        job_url=application.job_url,
        match_score=application.match_score,
        status=application.status,
        notes=application.notes,
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application


# ==========================================
# GET ALL APPLICATIONS
# ==========================================

@app.get("/api/applications")
def get_applications(
    db: Session = Depends(get_db)
):

    applications = (
        db.query(JobApplication)
        .order_by(JobApplication.id.desc())
        .all()
    )

    return applications


# ==========================================
# GET ONE APPLICATION
# ==========================================

@app.get("/api/applications/{application_id}")
def get_application(
    application_id: int,
    db: Session = Depends(get_db)
):

    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found."
        )

    return application


# ==========================================
# UPDATE APPLICATION
# ==========================================

@app.put("/api/applications/{application_id}")
def update_application(
    application_id: int,
    update: JobApplicationUpdate,
    db: Session = Depends(get_db)
):

    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found."
        )

    if update.status is not None:
        application.status = update.status

    if update.notes is not None:
        application.notes = update.notes

    db.commit()
    db.refresh(application)

    return application


# ==========================================
# DELETE APPLICATION
# ==========================================

@app.delete("/api/applications/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db)
):

    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found."
        )

    db.delete(application)
    db.commit()

    return {
        "message": "Application deleted successfully."
    }
class CoverLetterRequest(BaseModel):
    resume: str
    job_description: str
    job_title: str = ""
    company_name: str = ""


@app.post("/api/generate-cover-letter")
def generate_cover_letter_endpoint(request: CoverLetterRequest):
    result = generate_cover_letter(
        request.resume,
        request.job_description,
        request.job_title,
        request.company_name
    )

    return result