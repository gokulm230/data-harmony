import { CompanyData, CompanyAnalysis, FieldIssue, FieldCorrection, DatasetAnalysis, IssueType, CorrectionType } from '@/types/data';

// Industry standardization map
const industryStandardization: Record<string, string> = {
  'tech': 'Technology',
  'technology': 'Technology',
  'it': 'Technology',
  'software': 'Technology',
  'saas': 'Technology',
  'finance': 'Financial Services',
  'financial': 'Financial Services',
  'banking': 'Financial Services',
  'healthcare': 'Healthcare',
  'health': 'Healthcare',
  'medical': 'Healthcare',
  'retail': 'Retail',
  'ecommerce': 'Retail',
  'e-commerce': 'Retail',
  'manufacturing': 'Manufacturing',
  'mfg': 'Manufacturing',
  'consulting': 'Professional Services',
  'professional services': 'Professional Services',
  'marketing': 'Marketing & Advertising',
  'advertising': 'Marketing & Advertising',
};

// Company size standardization
const sizeStandardization: Record<string, string> = {
  'small': '1-50 employees',
  'medium': '51-200 employees',
  'large': '201-1000 employees',
  'enterprise': '1000+ employees',
  'startup': '1-50 employees',
  'smb': '51-200 employees',
};

// Country standardization
const countryStandardization: Record<string, string> = {
  'us': 'United States',
  'usa': 'United States',
  'united states of america': 'United States',
  'uk': 'United Kingdom',
  'gb': 'United Kingdom',
  'great britain': 'United Kingdom',
  'de': 'Germany',
  'deutschland': 'Germany',
  'fr': 'France',
  'ca': 'Canada',
  'au': 'Australia',
};

const generateId = () => Math.random().toString(36).substring(2, 11);

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidDomain = (domain: string): boolean => {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(domain);
};

const extractDomainFromWebsite = (website: string): string => {
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return website.replace('www.', '').split('/')[0];
  }
};

const extractDomainFromEmail = (email: string): string => {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : '';
};

const inferCompanySize = (revenue: string): string => {
  const numericRevenue = parseFloat(revenue.replace(/[^0-9.]/g, ''));
  if (isNaN(numericRevenue)) return '51-200 employees';
  if (numericRevenue < 1) return '1-50 employees';
  if (numericRevenue < 10) return '51-200 employees';
  if (numericRevenue < 100) return '201-1000 employees';
  return '1000+ employees';
};

const formatRevenue = (revenue: string): string => {
  const numericRevenue = parseFloat(revenue.replace(/[^0-9.]/g, ''));
  if (isNaN(numericRevenue)) return revenue;
  if (numericRevenue >= 1000) return `$${(numericRevenue / 1000).toFixed(1)}B`;
  if (numericRevenue >= 1) return `$${numericRevenue.toFixed(0)}M`;
  return `$${(numericRevenue * 1000).toFixed(0)}K`;
};

export const analyzeCompany = (original: CompanyData): CompanyAnalysis => {
  const issues: FieldIssue[] = [];
  const corrections: FieldCorrection[] = [];
  const corrected: CompanyData = { ...original };

  // Analyze and correct each field
  // Name
  if (!original.name || original.name.trim() === '') {
    issues.push({ field: 'name', type: 'missing', message: 'Missing company name' });
  }

  // Website & Domain
  if (!original.website || original.website.trim() === '') {
    issues.push({ field: 'website', type: 'missing', message: 'Missing website' });
    if (original.contactEmail && isValidEmail(original.contactEmail)) {
      const inferredDomain = extractDomainFromEmail(original.contactEmail);
      corrected.website = `https://${inferredDomain}`;
      corrected.domain = inferredDomain;
      corrections.push({
        field: 'website',
        originalValue: '',
        correctedValue: corrected.website,
        type: 'corrected',
        confidence: 85,
        label: 'Inferred from email',
      });
    }
  } else {
    const extractedDomain = extractDomainFromWebsite(original.website);
    if (original.domain !== extractedDomain) {
      issues.push({ field: 'domain', type: 'inconsistent', message: 'Domain mismatch with website' });
      corrected.domain = extractedDomain;
      corrections.push({
        field: 'domain',
        originalValue: original.domain,
        correctedValue: extractedDomain,
        type: 'corrected',
        confidence: 95,
        label: 'Fixed domain',
      });
    }
  }

  // Industry standardization
  const lowerIndustry = original.industry?.toLowerCase().trim() || '';
  if (industryStandardization[lowerIndustry]) {
    const standardized = industryStandardization[lowerIndustry];
    if (original.industry !== standardized) {
      corrections.push({
        field: 'industry',
        originalValue: original.industry,
        correctedValue: standardized,
        type: 'standardized',
        confidence: 92,
        label: 'Standardized industry',
      });
      corrected.industry = standardized;
    }
  } else if (!original.industry) {
    issues.push({ field: 'industry', type: 'missing', message: 'Missing industry' });
  }

  // Country standardization
  const lowerCountry = original.country?.toLowerCase().trim() || '';
  if (countryStandardization[lowerCountry]) {
    const standardized = countryStandardization[lowerCountry];
    if (original.country !== standardized) {
      corrections.push({
        field: 'country',
        originalValue: original.country,
        correctedValue: standardized,
        type: 'standardized',
        confidence: 98,
        label: 'Standardized country',
      });
      corrected.country = standardized;
    }
  } else if (!original.country) {
    issues.push({ field: 'country', type: 'missing', message: 'Missing country' });
  }

  // Size standardization
  const lowerSize = original.size?.toLowerCase().trim() || '';
  if (sizeStandardization[lowerSize]) {
    const standardized = sizeStandardization[lowerSize];
    corrections.push({
      field: 'size',
      originalValue: original.size,
      correctedValue: standardized,
      type: 'standardized',
      confidence: 88,
      label: 'Standardized size',
    });
    corrected.size = standardized;
  } else if (!original.size || original.size.trim() === '') {
    issues.push({ field: 'size', type: 'missing', message: 'Missing company size' });
    if (original.revenue) {
      const inferred = inferCompanySize(original.revenue);
      corrected.size = inferred;
      corrections.push({
        field: 'size',
        originalValue: '',
        correctedValue: inferred,
        type: 'corrected',
        confidence: 75,
        label: 'Inferred company size',
      });
    }
  }

  // Revenue formatting
  if (original.revenue && !original.revenue.startsWith('$')) {
    const formatted = formatRevenue(original.revenue);
    if (formatted !== original.revenue) {
      corrections.push({
        field: 'revenue',
        originalValue: original.revenue,
        correctedValue: formatted,
        type: 'standardized',
        confidence: 90,
        label: 'Formatted revenue',
      });
      corrected.revenue = formatted;
    }
  } else if (!original.revenue) {
    issues.push({ field: 'revenue', type: 'missing', message: 'Missing revenue' });
  }

  // Email validation
  if (!original.contactEmail || !isValidEmail(original.contactEmail)) {
    issues.push({ field: 'contactEmail', type: original.contactEmail ? 'invalid' : 'missing', message: original.contactEmail ? 'Invalid email format' : 'Missing contact email' });
  }

  // Calculate quality scores
  const totalFields = 8;
  const issueCount = issues.length;
  const qualityBefore = Math.round(((totalFields - issueCount) / totalFields) * 100);
  const qualityAfter = Math.round(((totalFields - issueCount + corrections.length) / totalFields) * 100);

  return {
    original,
    corrected,
    issues,
    corrections,
    qualityScore: {
      before: Math.min(qualityBefore, 100),
      after: Math.min(qualityAfter, 100),
    },
  };
};

export const parseCSVToCompanies = (data: Record<string, string>[]): CompanyData[] => {
  return data.map((row, index) => ({
    id: generateId(),
    name: row.name || row.company_name || row.companyName || row['Company Name'] || '',
    website: row.website || row.url || row.site || row['Website'] || '',
    domain: row.domain || row['Domain'] || '',
    industry: row.industry || row.sector || row['Industry'] || '',
    country: row.country || row.location || row['Country'] || '',
    size: row.size || row.company_size || row.employees || row['Company Size'] || '',
    revenue: row.revenue || row.annual_revenue || row['Revenue'] || '',
    contactEmail: row.email || row.contact_email || row.contactEmail || row['Email'] || '',
  }));
};

export const analyzeDataset = (companies: CompanyData[]): DatasetAnalysis => {
  const analyzedCompanies = companies.map(analyzeCompany);
  
  const totalIssues = analyzedCompanies.reduce((sum, c) => sum + c.issues.length, 0);
  const totalFixes = analyzedCompanies.reduce((sum, c) => sum + c.corrections.length, 0);
  
  const avgBefore = analyzedCompanies.reduce((sum, c) => sum + c.qualityScore.before, 0) / analyzedCompanies.length;
  const avgAfter = analyzedCompanies.reduce((sum, c) => sum + c.qualityScore.after, 0) / analyzedCompanies.length;

  return {
    companies: analyzedCompanies,
    totalIssues,
    totalFixes,
    overallQualityBefore: Math.round(avgBefore),
    overallQualityAfter: Math.round(avgAfter),
  };
};

// Demo data for testing
export const generateDemoData = (): CompanyData[] => [
  {
    id: generateId(),
    name: 'Acme Corp',
    website: 'https://www.acme.com',
    domain: 'acme.io', // Intentional mismatch
    industry: 'tech',
    country: 'US',
    size: 'medium',
    revenue: '25',
    contactEmail: 'contact@acme.com',
  },
  {
    id: generateId(),
    name: 'Global Finance Inc',
    website: '',
    domain: '',
    industry: 'banking',
    country: 'uk',
    size: '',
    revenue: '150M',
    contactEmail: 'info@globalfinance.co.uk',
  },
  {
    id: generateId(),
    name: 'HealthPlus',
    website: 'healthplus.io',
    domain: 'healthplus.io',
    industry: 'healthcare',
    country: 'United States',
    size: 'startup',
    revenue: '2.5',
    contactEmail: 'hello@healthplus.io',
  },
  {
    id: generateId(),
    name: 'RetailMax',
    website: 'https://retailmax.com/',
    domain: 'www.retailmax.com', // Inconsistent
    industry: 'ecommerce',
    country: 'CA',
    size: 'large',
    revenue: '$50M',
    contactEmail: 'sales@retailmax.com',
  },
  {
    id: generateId(),
    name: 'TechVentures',
    website: 'techventures.ai',
    domain: 'techventures.ai',
    industry: 'SaaS',
    country: 'germany',
    size: 'enterprise',
    revenue: '500',
    contactEmail: 'contact@techventures.ai',
  },
];
