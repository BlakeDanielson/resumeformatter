export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: string;
  gpa?: string;
  honors?: string;
}

export interface ResumeData {
  name?: string;
  contact: ContactInfo;
  summary?: string;
  experience: WorkExperience[];
  additionalExperience?: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications?: string[];
  languages?: string[];
}

// API Response types
export interface ParseResponse {
  success: boolean;
  data?: ResumeData;
  error?: string;
}

export interface GenerateResponse {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}
