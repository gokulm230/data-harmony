import React, { createContext, useContext, useState, useCallback } from 'react';
import { DatasetAnalysis, CompanyAnalysis } from '@/types/data';

interface DataContextType {
  datasetAnalysis: DatasetAnalysis | null;
  setDatasetAnalysis: (analysis: DatasetAnalysis) => void;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  getCompanyById: (id: string) => CompanyAnalysis | undefined;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasetAnalysis, setDatasetAnalysis] = useState<DatasetAnalysis | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getCompanyById = useCallback((id: string) => {
    return datasetAnalysis?.companies.find(c => c.original.id === id);
  }, [datasetAnalysis]);

  const clearData = useCallback(() => {
    setDatasetAnalysis(null);
    setSelectedCompanyId(null);
    setIsProcessing(false);
  }, []);

  return (
    <DataContext.Provider value={{
      datasetAnalysis,
      setDatasetAnalysis,
      selectedCompanyId,
      setSelectedCompanyId,
      getCompanyById,
      isProcessing,
      setIsProcessing,
      clearData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
