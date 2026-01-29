'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PDM {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PDMContextType {
  selectedPDM: PDM | null;
  setSelectedPDM: (pdm: PDM | null) => void;
}

const PDMContext = createContext<PDMContextType | undefined>(undefined);

export function PDMProvider({ children }: { children: React.ReactNode }) {
  const [selectedPDM, setSelectedPDMState] = useState<PDM | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedPDM');
      if (saved) {
        setSelectedPDMState(JSON.parse(saved));
      }
    }
  }, []);

  const setSelectedPDM = (pdm: PDM | null) => {
    setSelectedPDMState(pdm);
    if (typeof window !== 'undefined') {
      if (pdm) {
        localStorage.setItem('selectedPDM', JSON.stringify(pdm));
      } else {
        localStorage.removeItem('selectedPDM');
      }
    }
  };

  return (
    <PDMContext.Provider value={{ selectedPDM, setSelectedPDM }}>
      {children}
    </PDMContext.Provider>
  );
}

export function usePDM() {
  const context = useContext(PDMContext);
  if (context === undefined) {
    throw new Error('usePDM must be used within a PDMProvider');
  }
  return context;
}
