import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, Building2, Users, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import { DatasetAnalysis } from '@/types/data';
import { cn } from '@/lib/utils';

// Transform API response to match DatasetAnalysis type
const transformApiResponse = (apiData: any): DatasetAnalysis => {
  const rowSummaries = apiData.row_summaries || [];
  const stats = apiData.summary_statistics || {};
  
  const companies = rowSummaries.map((row: any) => {
    const id = `row-${row.row}`;
    const rowValues = row.row_values || {};
    
    // Build issues array
    const issues = [];
    if (row.name_suggestion === 'yes' && row.llm_suggested_name) {
      issues.push({
        field: 'name',
        type: 'invalid' as const,
        message: 'Name contains special characters or formatting issues',
      });
    }
    if (row.is_duplicate) {
      issues.push({
        field: 'name',
        type: 'duplicate' as const,
        message: `Duplicate entry (rows: ${row.duplicate_group_rows?.join(', ')})`,
      });
    }
    
    // Build corrections array
    const corrections = [];
    if (row.name_suggestion === 'yes' && row.llm_suggested_name) {
      corrections.push({
        field: 'name',
        originalValue: row.original_name,
        correctedValue: row.llm_suggested_name,
        type: 'corrected' as const,
        confidence: 95,
        label: 'AI-corrected company name',
      });
    }
    
    // Calculate quality score (before = with issues, after = after fixes)
    const totalFields = 8;
    const issueCount = issues.length;
    const qualityBefore = Math.round(((totalFields - issueCount) / totalFields) * 100);
    const qualityAfter = Math.round(((totalFields - Math.max(0, issueCount - corrections.length)) / totalFields) * 100);
    
    return {
      original: {
        id,
        name: row.original_name || '',
        website: rowValues.website || '',
        domain: rowValues.domain || '',
        industry: rowValues.industry || '',
        country: rowValues.country || '',
        size: rowValues.size || '',
        revenue: rowValues.revenue || '',
        contactEmail: rowValues.contactEmail || '',
      },
      corrected: {
        id,
        name: row.llm_suggested_name || row.original_name || '',
        website: rowValues.website || '',
        domain: rowValues.domain || '',
        industry: rowValues.industry || '',
        country: rowValues.country || '',
        size: rowValues.size || '',
        revenue: rowValues.revenue || '',
        contactEmail: rowValues.contactEmail || '',
      },
      issues,
      corrections,
      qualityScore: {
        before: qualityBefore,
        after: qualityAfter,
      },
    };
  });

  // Remove duplicates - only keep the first occurrence
  const uniqueCompanies = companies.filter((company: any, index: number) => {
    const row = rowSummaries[index];
    if (row.is_duplicate && row.duplicate_group_rows) {
      // Keep only if this is the first row in the duplicate group
      return row.row === Math.min(...row.duplicate_group_rows);
    }
    return true;
  });

  const totalIssues = stats.issue_counts?.duplicate_rows + 
                      stats.issue_counts?.llm_name_corrections || 0;
  const totalFixes = stats.issue_counts?.llm_name_corrections || 0;
  
  // Calculate overall quality (use API's score if available)
  const qualityScore = stats.data_quality?.score || 0;
  const overallQualityBefore = Math.round(qualityScore * 100);
  const overallQualityAfter = Math.round((stats.data_quality?.clean_rows / stats.total_rows) * 100) || overallQualityBefore;

  return {
    companies: uniqueCompanies,
    totalIssues,
    totalFixes,
    overallQualityBefore,
    overallQualityAfter,
  };
};

const UploadPage = () => {
  const navigate = useNavigate();
  const { setDatasetAnalysis, setIsProcessing, isProcessing } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [response, setResponse] = useState(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file); 

    try {
      const res = await fetch(
        "/api/analyze-csv",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("File upload failed");
      }

      const data = await res.json();
      console.log('API Response:', data);
      
      // Transform API response to DatasetAnalysis format
      const transformedData = transformApiResponse(data);
      setDatasetAnalysis(transformedData);
      
      setIsProcessing(false);
      navigate('/companies');
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleUpload(file);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, []);




  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Data Quality Guardian</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-3xl animate-fade-in">
          {/* Hero Text */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              AI-Powered Data Quality Guardian
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Upload your B2B company & people dataset to detect errors, duplicates, and get AI-driven corrections.
            </p>
          </div>

          {/* Upload Card */}
          <Card className={cn(
            'p-8 border-2 border-dashed transition-all duration-300 gradient-card',
            isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50',
            isProcessing && 'pointer-events-none'
          )}>
            {isProcessing ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-6 flex items-center justify-center animate-pulse-slow">
                  <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">AI is analyzing your data...</h3>
                <p className="text-muted-foreground">
                  {fileName && <span className="font-medium">{fileName}</span>}
                </p>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Drag & drop your CSV file here
                </h3>
                <p className="text-muted-foreground mb-6">or click to browse</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <Button asChild size="lg" className="gradient-primary border-0 shadow-glow cursor-pointer">
                      <span>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Upload CSV
                      </span>
                    </Button>
                  </label>
                </div>

                {error && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
