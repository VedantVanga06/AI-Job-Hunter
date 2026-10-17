import json
import os
from typing import List, Type, TypeVar

from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel

load_dotenv()

T = TypeVar("T", bound=BaseModel)


def _get_client() -> Groq:
    """Create the Groq client only when an AI request is made."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured.")
    return Groq(api_key=api_key)


def _ask_json(prompt: str, schema: Type[T]) -> T:
    """Ask Groq for JSON and validate it against the expected response model."""
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    response = _get_client().chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "Follow the user's instructions. Return only valid JSON matching the requested schema. Do not invent facts.",
            },
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Groq returned an empty response.")
    data = json.loads(content)
    return schema.model_validate(data)


class JobAnalysis(BaseModel):
    match_score: int
    summary: str
    matched_skills: List[str]
    missing_skills: List[str]
    ats_keywords: List[str]
    resume_improvements: List[str]
    suggestions: List[str]


def analyze_resume(resume: str, job_description: str) -> JobAnalysis:
    prompt = f"""
You are an expert technical recruiter and ATS resume analyzer.
Analyze the candidate's resume against the provided job description.

Rules:
- Be honest and realistic. Never invent skills, projects, education, certifications, or experience.
- Only consider a skill matched if there is evidence in the resume.
- Identify important requirements from the job description that are missing.
- Give practical advice. Never recommend lying or adding fake experience.
- Return JSON with: match_score (integer 0-100), summary (string), matched_skills (array of strings), missing_skills (array of strings), ats_keywords (array of strings), resume_improvements (array of strings), suggestions (array of strings).

RESUME:
{resume}

JOB DESCRIPTION:
{job_description}
"""
    return _ask_json(prompt, JobAnalysis)


class ResumeAnalysis(BaseModel):
    candidate_summary: str
    technical_skills: List[str]
    programming_languages: List[str]
    education: List[str]
    projects: List[str]
    certifications: List[str]
    experience: List[str]
    missing_sections: List[str]
    resume_score: int
    improvement_suggestions: List[str]


def analyze_resume_profile(resume: str) -> ResumeAnalysis:
    prompt = f"""
You are an expert resume reviewer and technical recruiter. Analyze the resume independently of any job description.
Never invent information; only report what is present. Identify missing sections and give practical, honest recommendations.
Return JSON with: candidate_summary (string), technical_skills (array), programming_languages (array), education (array), projects (array), certifications (array), experience (array), missing_sections (array), resume_score (integer 0-100), improvement_suggestions (array).

RESUME:
{resume}
"""
    return _ask_json(prompt, ResumeAnalysis)


class CoverLetter(BaseModel):
    cover_letter: str


def generate_cover_letter(
    resume: str,
    job_description: str,
    job_title: str = "",
    company_name: str = "",
) -> CoverLetter:
    prompt = f"""
Write a concise, natural, professional cover letter for an internship or entry-level software/AI/IT role using ONLY information supported by the resume. Do not invent work experience, projects, skills, achievements, education, or certifications. Do not use placeholders such as [Name], [Company], or [Your Name]. Return JSON with one string field named cover_letter.

JOB TITLE: {job_title}
COMPANY: {company_name}

RESUME:
{resume}

JOB DESCRIPTION:
{job_description}
"""
    return _ask_json(prompt, CoverLetter)


class InterviewPreparation(BaseModel):
    introduction: str
    technical_questions: List[str]
    hr_questions: List[str]
    preparation_tips: List[str]


def generate_interview_prep(
    resume: str,
    job_description: str,
    job_title: str = "",
    company_name: str = "",
) -> InterviewPreparation:
    if not resume.strip() or not job_description.strip():
        raise ValueError("Resume and job description are required.")
    prompt = f"""
Create practical interview preparation for an early-career candidate. Use the resume as the only source for candidate-specific claims; do not invent experience.
Return JSON with: introduction (a natural 45-60 second introduction), technical_questions (8 role-relevant questions, questions only), hr_questions (5 realistic HR/behavioral questions), preparation_tips (5 focused tips).

Role: {job_title}
Company: {company_name}

RESUME:
{resume}

JOB DESCRIPTION:
{job_description}
"""
    return _ask_json(prompt, InterviewPreparation)
