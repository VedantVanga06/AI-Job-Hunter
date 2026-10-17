from typing import List

from pydantic import BaseModel
from services.ai_service import _ask_json


class ResumeImprovement(BaseModel):
    professional_summary: str
    skills_to_highlight: List[str]
    improved_bullet_points: List[str]
    missing_keywords: List[str]
    ats_improvements: List[str]
    project_improvements: List[str]
    recommendations: List[str]


def improve_resume(resume: str) -> ResumeImprovement:
    if not resume.strip():
        raise ValueError("Resume text cannot be empty.")
    prompt = f"""
You are an expert resume writer, ATS specialist, and technical recruiter.
Analyze the candidate's resume and return practical, honest improvements.

Rules:
- Never invent employers, education, skills, projects, metrics, or experience.
- Do not claim the candidate has a skill merely because it is recommended.
- Mark missing keywords as suggestions to include only if truthful.
- When the resume has no clear bullet points to rewrite, say so and offer templates clearly labelled as templates rather than factual achievements.
- Keep advice useful for students and early-career applicants.
- Return JSON with: professional_summary (string), skills_to_highlight (array), improved_bullet_points (array), missing_keywords (array), ats_improvements (array), project_improvements (array), recommendations (array).

RESUME:
{resume}
"""
    return _ask_json(prompt, ResumeImprovement)
