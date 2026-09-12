from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
from typing import List
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class JobAnalysis(BaseModel):
    match_score: int
    summary: str
    strengths: List[str]
    missing_skills: List[str]
    suggestions: List[str]


def analyze_resume(resume: str, job_description: str) -> JobAnalysis:

    prompt = f"""
You are an expert technical recruiter.

Analyze the candidate's resume against the job description.

Give an honest assessment. Do not invent skills or experience that
are not present in the resume.

RESUME:
{resume}

JOB DESCRIPTION:
{job_description}

Evaluate:
1. Overall match from 0 to 100.
2. A short explanation of the match.
3. The candidate's strongest matching skills.
4. Important skills from the job description that are missing from
   the resume.
5. Practical suggestions for improving the candidate's chances.
"""

    interaction = client.interactions.create(
        model="gemini-3.8-flash",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": JobAnalysis.model_json_schema()
        }
    )

    return JobAnalysis.model_validate_json(interaction.output_text)