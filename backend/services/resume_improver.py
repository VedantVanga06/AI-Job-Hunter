import os
from typing import List

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=_api_key) if _api_key else None


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
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured in backend/.env.")

    prompt = f"""
You are an expert resume writer, ATS specialist, and technical recruiter.
Analyze the candidate's resume and return practical, honest improvements.

Rules:
- Never invent employers, education, skills, projects, metrics, or experience.
- Do not claim the candidate has a skill merely because it is recommended.
- Mark missing keywords as suggestions to include only if truthful.
- When the resume has no clear bullet points to rewrite, say so and offer
  templates clearly labelled as templates rather than factual achievements.
- Keep advice useful for students and early-career applicants.

RESUME:
{resume}

Return:
1. professional_summary: concise summary supported by the resume.
2. skills_to_highlight: relevant skills already evidenced in the resume.
3. improved_bullet_points: stronger versions of existing bullets, or clearly
   labelled templates if there are no bullets to rewrite.
4. missing_keywords: relevant terms to consider only if the candidate has them.
5. ats_improvements: formatting, headings, readability and keyword advice.
6. project_improvements: specific ways to better present existing projects.
7. recommendations: prioritized practical next steps.
"""
    interaction = client.interactions.create(
        model="gemini-3.1-flash-lite",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": ResumeImprovement.model_json_schema(),
        },
    )
    return ResumeImprovement.model_validate_json(interaction.output_text)
