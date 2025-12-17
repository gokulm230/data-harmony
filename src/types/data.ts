export interface CompanyData {
  id: string;
  name: string;
  website: string;
  domain: string;
  industry: string;
  country: string;
  size: string;
  revenue: string;
  contactEmail: string;
}

export interface PersonData {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  function: string;
  companyId: string;
}

export type IssueType = 'missing' | 'invalid' | 'duplicate' | 'inconsistent';
export type CorrectionType = 'corrected' | 'standardized' | 'unchanged';

export interface FieldIssue {
  field: string;
  type: IssueType;
  message: string;
}

export interface FieldCorrection {
  field: string;
  originalValue: string;
  correctedValue: string;
  type: CorrectionType;
  confidence: number;
  label: string;
}

export interface CompanyAnalysis {
  original: CompanyData;
  corrected: CompanyData;
  issues: FieldIssue[];
  corrections: FieldCorrection[];
  qualityScore: {
    before: number;
    after: number;
  };
}

export interface DatasetAnalysis {
  companies: CompanyAnalysis[];
  totalIssues: number;
  totalFixes: number;
  overallQualityBefore: number;
  overallQualityAfter: number;
}

export type QualityLevel = 'good' | 'review' | 'poor';

export const getQualityLevel = (score: number): QualityLevel => {
  if (score >= 80) return 'good';
  if (score >= 50) return 'review';
  return 'poor';
};
