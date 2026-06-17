export type JobSearchExperience = "신입" | "주니어" | "경력" | "무관";

export type JobSearchCriteria = {
  experience?: JobSearchExperience;
  keyword: string;
  limit: 3;
  location?: string;
  roles: string[];
  skills: string[];
};

export type JobPostingCandidate = {
  company: string;
  experience: string | null;
  location: string | null;
  skills: string[];
  source: "saramin-api" | "fallback-rag";
  title: string;
  url: string;
};
