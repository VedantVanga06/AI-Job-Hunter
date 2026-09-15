from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
from typing import List
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# ==========================================
# JOB ANALYSIS
# ==========================================

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

IMPORTANT RULES:
- Be honest and realistic.
- NEVER invent skills, projects, education, certifications, or experience.
- Only consider a skill matched if there is evidence in the resume.
- Identify important requirements from the job description that are missing.
- Give practical advice.
- Never recommend lying or adding fake experience.

RESUME:
{resume}

JOB DESCRIPTION:
{job_description}

Analyze:

1. MATCH SCORE
Give an overall match score from 0 to 100.

2. SUMMARY
Give a short explanation of the candidate's match.

3. MATCHED SKILLS
Important job requirements supported by the resume.

4. MISSING SKILLS
Important requirements missing or not clearly demonstrated.

5. ATS KEYWORDS
Important keywords from the job description that the candidate
could naturally include if they genuinely have relevant experience.

6. RESUME IMPROVEMENTS
Specific improvements for this particular job.

7. SUGGESTIONS
Practical actions to improve the candidate's chances.

Return ONLY structured JSON.
"""

    interaction = client.interactions.create(
        model="gemini-3.1-flash-lite",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": JobAnalysis.model_json_schema()
        }
    )

    return JobAnalysis.model_validate_json(
        interaction.output_text
    )


# ==========================================
# RESUME ANALYSIS
# ==========================================

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
You are an expert resume reviewer and technical recruiter.

Analyze the following resume independently of any job description.

IMPORTANT RULES:
- NEVER invent information.
- Only report information actually present in the resume.
- If a section is not present, identify it as missing.
- Do not assume experience from skills alone.
- Give practical and honest recommendations.

RESUME:
{resume}

Analyze the resume and return:

1. CANDIDATE SUMMARY
A concise professional summary of the candidate based only on the resume.

2. TECHNICAL SKILLS
List the technical skills found.

3. PROGRAMMING LANGUAGES
List programming languages explicitly mentioned.

4. EDUCATION
List degrees, institutions, and relevant education information.

5. PROJECTS
List important projects mentioned in the resume.

6. CERTIFICATIONS
List certifications if present.

7. EXPERIENCE
List internships, jobs, or other professional experience if present.

8. MISSING SECTIONS
Identify useful resume sections that appear to be missing.

9. RESUME SCORE
Give the resume an overall quality score from 0 to 100.

10. IMPROVEMENT SUGGESTIONS
Give practical improvements that would make this resume stronger.

Return ONLY structured JSON.
"""

    interaction = client.interactions.create(
        model="gemini-3.1-flash-lite",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": ResumeAnalysis.model_json_schema()
        }
    )

    return ResumeAnalysis.model_validate_json(
        interaction.output_text
    )
class CoverLetter(BaseModel):
    cover_letter: str


def generate_cover_letter(
    resume: str,
    job_description: str,
    job_title: str = "",
    company_name: str = ""
) -> CoverLetter:

    prompt = f"""
You are an expert job application writer.

Write a professional, personalized cover letter for the candidate
using ONLY information supported by the resume.

Do NOT invent:
- work experience
- projects
- skills
- achievements
- education
- certifications

Keep it concise, natural, and suitable for an internship or entry-level
software/AI/IT position.

JOB TITLE:
{job_title}

COMPANY:
{company_name}

RESUME:
{resume}

JOB DESCRIPTION:
{job_description}

Write a strong cover letter that:
1. Opens with genuine interest in the role.
2. Connects the candidate's real skills/projects to the job.
3. Explains why the candidate could contribute.
4. Ends with a professional call to action.

Do not use placeholders such as [Name], [Company], or [Your Name].
Return only the cover letter.
"""

    interaction = client.interactions.create(
        model="gemini-3.8-flash",
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": CoverLetter.model_json_schema()
        }
    )

    return CoverLetter.model_validate_json(interaction.output_text)