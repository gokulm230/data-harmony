import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ArrowLeft, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useData } from '@/context/DataContext';
import { QualityBadge } from '@/components/QualityBadge';
import { getQualityLevel } from '@/types/data';
import { cn } from '@/lib/utils';

const CompanyListingPage = () => {
  const navigate = useNavigate();
  const { datasetAnalysis, setSelectedCompanyId, clearData } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompanies = useMemo(() => {
    if (!datasetAnalysis) return [];
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return datasetAnalysis.companies;
    
    return datasetAnalysis.companies.filter(c => 
      c.original.name.toLowerCase().includes(query) ||
      c.original.domain.toLowerCase().includes(query)
    );
  }, [datasetAnalysis, searchQuery]);

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanyId(companyId);
    navigate(`/company/${companyId}`);
  };

  const handleBack = () => {
    clearData();
    navigate('/');
  };

  if (!datasetAnalysis) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Companies Detected</h1>
                  <p className="text-sm text-muted-foreground">
                    {datasetAnalysis.companies.length} companies analyzed
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Quality Score</p>
                  <p className="text-lg font-semibold text-foreground">
                    {datasetAnalysis.overallQualityBefore}%
                    <span className="text-primary mx-1">→</span>
                    {datasetAnalysis.overallQualityAfter}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 gradient-card">
            <p className="text-sm text-muted-foreground">Total Companies</p>
            <p className="text-2xl font-bold text-foreground">{datasetAnalysis.companies.length}</p>
          </Card>
          <Card className="p-4 gradient-card">
            <p className="text-sm text-muted-foreground">Issues Detected</p>
            <p className="text-2xl font-bold text-destructive">{datasetAnalysis.totalIssues}</p>
          </Card>
          <Card className="p-4 gradient-card">
            <p className="text-sm text-muted-foreground">Fixes Applied</p>
            <p className="text-2xl font-bold text-success">{datasetAnalysis.totalFixes}</p>
          </Card>
          <Card className="p-4 gradient-card">
            <p className="text-sm text-muted-foreground">Quality Improvement</p>
            <p className="text-2xl font-bold text-primary">
              +{datasetAnalysis.overallQualityAfter - datasetAnalysis.overallQualityBefore}%
            </p>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by company name or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Company Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company, index) => {
            const qualityLevel = getQualityLevel(company.qualityScore.before);
            const initials = company.original.name
              .split(' ')
              .map(w => w[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();
            
            return (
              <Card
                key={company.original.id}
                onClick={() => handleCompanyClick(company.original.id)}
                className={cn(
                  'p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 gradient-card animate-fade-in',
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-secondary-foreground">{initials}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{company.original.name}</h3>
                      <QualityBadge level={qualityLevel} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {company.corrected.domain || 'No domain'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 bg-secondary rounded">{company.corrected.industry || 'Unknown'}</span>
                      <span>{company.corrected.country || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Issues/Fixes Summary */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {company.issues.length} issues • {company.corrections.length} fixes
                  </span>
                  <span className="text-primary font-medium">
                    {company.qualityScore.before}% → {company.qualityScore.after}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No companies found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyListingPage;
