import React, { createContext, useContext, useState, useEffect } from 'react';

type DemoContextType = {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check sessionStorage on mount to persist demo mode across navigation
    return sessionStorage.getItem('demoMode') === 'true';
  });

  // Update sessionStorage whenever demo mode changes
  useEffect(() => {
    if (isDemoMode) {
      sessionStorage.setItem('demoMode', 'true');
    } else {
      sessionStorage.removeItem('demoMode');
    }
  }, [isDemoMode]);

  const enterDemoMode = () => {
    setIsDemoMode(true);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
}
