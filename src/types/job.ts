export interface JobListing {
  id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  requirements: string;
  salary_range: string;
  contact_email: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  employer_id: string;
  job_type?: string;
  province?: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  summary: string;
  resume_url?: string;
  consent_given: boolean;
  applied_at: string;
  created_at: string;
}