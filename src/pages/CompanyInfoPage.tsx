import React, { useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  ArrowLeft, Download, FileSpreadsheet, FileText, Check, AlertTriangle, 
  Sparkles, Building2, Globe, Briefcase, MapPin, Users, DollarSign, Mail, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { QualityBadge } from '@/components/QualityBadge';
import { getQualityLevel, FieldCorrection, CorrectionType } from '@/types/data';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const fieldIcons: Record<string, React.ReactNode> = {
  name: <Building2 className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  domain: <Globe className="w-4 h-4" />,
  industry: <Briefcase className="w-4 h-4" />,
  country: <MapPin className="w-4 h-4" />,
  size: <Users className="w-4 h-4" />,
  revenue: <DollarSign className="w-4 h-4" />,
  contactEmail: <Mail className="w-4 h-4" />,
};

const fieldLabels: Record<string, string> = {
  name: 'Company Name',
  website: 'Website',
  domain: 'Domain',
  industry: 'Industry',
  country: 'Location',
  size: 'Company Size',
  revenue: 'Revenue',
  contactEmail: 'Contact Email',
};

const CompanyInfoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getCompanyById, datasetAnalysis } = useData();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const company = id ? getCompanyById(id) : undefined;

  // Synchronized scrolling
  useEffect(() => {
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    
    if (!leftPanel || !rightPanel) return;

    let isSyncing = false;

    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
      if (isSyncing) return;
      isSyncing = true;
      target.scrollTop = source.scrollTop;
      requestAnimationFrame(() => { isSyncing = false; });
    };

    const handleLeftScroll = () => syncScroll(leftPanel, rightPanel);
    const handleRightScroll = () => syncScroll(rightPanel, leftPanel);

    leftPanel.addEventListener('scroll', handleLeftScroll);
    rightPanel.addEventListener('scroll', handleRightScroll);

    return () => {
      leftPanel.removeEventListener('scroll', handleLeftScroll);
      rightPanel.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  if (!company) {
    navigate('/companies');
    return null;
  }

  const fields = ['name', 'website', 'domain', 'industry', 'size', 'revenue', 'country', 'contactEmail'] as const;
  
  const getIssueForField = (field: string) => company.issues.find(i => i.field === field);
  const getCorrectionForField = (field: string) => company.corrections.find(c => c.field === field);

  const getCorrectionStyle = (type: CorrectionType): string => {
    switch (type) {
      case 'corrected': return 'bg-success/10 border-success/30 text-foreground';
      case 'standardized': return 'bg-warning/10 border-warning/30 text-foreground';
      default: return 'bg-card border-border';
    }
  };

  // CSV Download
  const downloadCSV = (type: 'original' | 'corrected') => {
    const data = type === 'original' ? company.original : company.corrected;
    const headers = Object.keys(data).filter(k => k !== 'id');
    const values = headers.map(h => data[h as keyof typeof data]);
    
    const csvContent = [headers.join(','), values.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${company.original.name.replace(/\s+/g, '_')}_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF Download
  const downloadPDF = (type: 'original' | 'corrected') => {
    const data = type === 'original' ? company.original : company.corrected;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`${data.name} - ${type === 'original' ? 'Original' : 'Corrected'} Data`, 20, 20);
    
    doc.setFontSize(12);
    let y = 40;
    
    fields.forEach(field => {
      const value = data[field as keyof typeof data] || 'N/A';
      doc.text(`${fieldLabels[field]}: ${value}`, 20, y);
      y += 10;
    });
    
    if (type === 'corrected') {
      y += 10;
      doc.setFontSize(14);
      doc.text('Corrections Applied:', 20, y);
      y += 10;
      doc.setFontSize(10);
      company.corrections.forEach(c => {
        doc.text(`• ${fieldLabels[c.field]}: ${c.label} (${c.confidence}% confidence)`, 25, y);
        y += 8;
      });
    }
    
    doc.save(`${company.original.name.replace(/\s+/g, '_')}_${type}.pdf`);
  };

  const initials = company.original.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/companies')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Company Data Review</h1>
                <p className="text-sm text-muted-foreground">
                  Original dataset compared with AI-corrected output
                </p>
              </div>
            </div>
            <QualityBadge 
              level={getQualityLevel(company.qualityScore.after)} 
              score={company.qualityScore.after}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mirror Panels */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Left Panel - Original Data */}
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Original Data</h2>
            </div>
            <Card className="overflow-hidden">
              <div ref={leftPanelRef} className="max-h-[600px] overflow-y-auto">
                {/* Company Header */}
                <div className="p-6 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                      <span className="text-xl font-bold text-secondary-foreground">{initials}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{company.original.name || 'Unknown'}</h3>
                      <p className="text-muted-foreground">{company.original.domain || 'No domain'}</p>
                    </div>
                  </div>
                </div>

                {/* Fields */}
                <div className="p-6 space-y-4">
                  {fields.map(field => {
                    const issue = getIssueForField(field);
                    const value = company.original[field as keyof typeof company.original] || '';
                    
                    return (
                      <div key={field} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          {fieldIcons[field]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">{fieldLabels[field]}</p>
                          <div className={cn(
                            'p-3 rounded-lg border',
                            issue ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border'
                          )}>
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                'text-sm truncate',
                                value ? 'text-foreground' : 'text-muted-foreground italic'
                              )}>
                                {value || 'Empty'}
                              </p>
                              {issue && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">{issue.message}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Corrected Data */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-success" />
              <h2 className="text-lg font-semibold text-foreground">AI-Corrected Data</h2>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <Card className="overflow-hidden border-primary/20">
              <div ref={rightPanelRef} className="max-h-[600px] overflow-y-auto">
                {/* Company Header */}
                <div className="p-6 bg-primary/5 border-b border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                      <span className="text-xl font-bold text-primary-foreground">{initials}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{company.corrected.name || 'Unknown'}</h3>
                      <p className="text-primary">{company.corrected.domain || 'No domain'}</p>
                    </div>
                  </div>
                </div>

                {/* Fields */}
                <div className="p-6 space-y-4">
                  {fields.map(field => {
                    const correction = getCorrectionForField(field);
                    const value = company.corrected[field as keyof typeof company.corrected] || '';
                    
                    return (
                      <div key={field} className="flex items-start gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                          correction ? 'bg-success/20' : 'bg-secondary'
                        )}>
                          {correction ? <Check className="w-4 h-4 text-success" /> : fieldIcons[field]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">{fieldLabels[field]}</p>
                          <div className={cn(
                            'p-3 rounded-lg border',
                            correction ? getCorrectionStyle(correction.type) : 'bg-card border-border'
                          )}>
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                'text-sm truncate',
                                value ? 'text-foreground' : 'text-muted-foreground italic'
                              )}>
                                {value || 'Empty'}
                              </p>
                              {correction && (
                                <ConfidenceBadge 
                                  confidence={correction.confidence}
                                  label={correction.label}
                                  type={correction.type}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Download Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-5 gradient-card">
            <h3 className="font-semibold text-foreground mb-4">Download Original Data</h3>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => downloadCSV('original')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
              <Button variant="outline" onClick={() => downloadPDF('original')}>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </Card>
          
          <Card className="p-5 gradient-card border-primary/20">
            <h3 className="font-semibold text-foreground mb-4">Download Corrected Data</h3>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => downloadCSV('corrected')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
              <Button variant="outline" onClick={() => downloadPDF('corrected')}>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </Card>
        </div>

        {/* QA Summary */}
        <Card className="p-6 gradient-card animate-slide-up">
          <h3 className="text-lg font-semibold text-foreground mb-6">QA Summary</h3>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-3xl font-bold text-destructive">{company.issues.length}</p>
              <p className="text-sm text-muted-foreground">Issues Detected</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
              <p className="text-3xl font-bold text-success">{company.corrections.length}</p>
              <p className="text-sm text-muted-foreground">Fixes Applied</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-muted-foreground">{company.qualityScore.before}%</span>
                <span className="text-primary">→</span>
                <span className="text-3xl font-bold text-primary">{company.qualityScore.after}%</span>
              </div>
              <p className="text-sm text-muted-foreground">Quality Score</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={() => navigate('/companies')}>
              Back to Companies
            </Button>
            <Button className="gradient-primary border-0 shadow-glow">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Corrections
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default CompanyInfoPage;
