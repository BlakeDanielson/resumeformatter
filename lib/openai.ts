import OpenAI from "openai";
import { ResumeData } from "./types";

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

const RESUME_PARSE_PROMPT = `You are an expert resume parser. Your task is to extract structured information from resume text and return it as JSON.

IMPORTANT RULES:
1. Extract information EXACTLY as it appears - do NOT rewrite, improve, or embellish any content
2. Preserve the original wording of job descriptions and bullet points
3. If a field is not present in the resume, omit it or use an empty array as appropriate
4. Dates should be formatted consistently (e.g., "Jan 2020", "2020", "January 2020")
5. For ongoing positions, set endDate to null or omit it

Return a JSON object with this exact structure:
{
  "name": "Full Name or null if not present",
  "contact": {
    "email": "email@example.com",
    "phone": "+1-234-567-8900",
    "location": "City, State",
    "linkedin": "linkedin.com/in/username",
    "website": "website.com"
  },
  "summary": "Professional summary if present",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State",
      "startDate": "Month Year",
      "endDate": "Month Year or null if current",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "additionalExperience": [
    {
      "company": "Organization or Project Name",
      "title": "Role or Title",
      "location": "City, State",
      "startDate": "Month Year",
      "endDate": "Month Year or null if current",
      "bullets": ["Description 1", "Description 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "graduationDate": "May 2020",
      "gpa": "3.8",
      "honors": "Magna Cum Laude"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "certifications": ["Certification 1", "Certification 2"],
  "languages": ["English", "Spanish"]
}

NOTES:
- "experience" is for primary professional/work experience
- "additionalExperience" is for secondary experience like volunteer work, freelance, internships, side projects, or anything listed under "Additional Experience", "Other Experience", "Volunteer Experience", etc.

Parse the following resume text and return ONLY valid JSON (no markdown, no explanation):`;

export async function parseResumeWithAI(resumeText: string): Promise<ResumeData> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: RESUME_PARSE_PROMPT,
      },
      {
        role: "user",
        content: resumeText,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1, // Low temperature for consistent extraction
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    const parsed = JSON.parse(content) as ResumeData;
    
    // Ensure required arrays exist
    if (!parsed.experience) parsed.experience = [];
    if (!parsed.education) parsed.education = [];
    if (!parsed.skills) parsed.skills = [];
    if (!parsed.contact) parsed.contact = {};
    
    return parsed;
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}
