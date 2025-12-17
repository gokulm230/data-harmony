import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Building2, Users, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import { parseCSVToCompanies, analyzeDataset, generateDemoData } from '@/lib/mockAiEngine';
import { cn } from '@/lib/utils';

const UploadPage = () => {
  const navigate = useNavigate();
  const { setDatasetAnalysis, setIsProcessing, isProcessing } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processCSV = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const companies = parseCSVToCompanies(results.data as Record<string, string>[]);
          if (companies.length === 0) {
            setError('No valid company data found in CSV');
            setIsProcessing(false);
            return;
          }
          
          const analysis = analyzeDataset(companies);
          setDatasetAnalysis(analysis);
          navigate('/companies');
        } catch (err) {
          setError('Failed to process CSV file');
          setIsProcessing(false);
        }
      },
      error: () => {
        setError('Failed to parse CSV file');
        setIsProcessing(false);
      },
    });
  }, [setDatasetAnalysis, setIsProcessing, navigate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      processCSV(file);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, [processCSV]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSV(file);
    }
  }, [processCSV]);

  const handleDemoData = useCallback(async () => {
    setIsProcessing(true);
    setFileName('demo-dataset.csv');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const companies = generateDemoData();
    const analysis = analyzeDataset(companies);
    setDatasetAnalysis(analysis);
    navigate('/companies');
  }, [setDatasetAnalysis, setIsProcessing, navigate]);

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
                  <Button variant="outline" size="lg" onClick={handleDemoData}>
                    Try Demo Data
                  </Button>
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

          {/* Supported Fields */}
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <Card className="p-5 gradient-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Company Fields</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Name', 'Website', 'Domain', 'Industry', 'Country', 'Size', 'Revenue'].map(field => (
                  <span key={field} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                    {field}
                  </span>
                ))}
              </div>
            </Card>
            
            <Card className="p-5 gradient-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">People Fields</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Name', 'Title', 'Email', 'Phone', 'Function'].map(field => (
                  <span key={field} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                    {field}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
