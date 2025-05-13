// src/context/PortfolioContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Holding, Transaction } from '../types';

// Define the shape of our context
interface PortfolioContextType {
  holdings: Holding[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  setHoldings: (holdings: Holding[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  clearData: () => void;
}

// Create the context with default values
const PortfolioContext = createContext<PortfolioContextType>({
  holdings: [],
  transactions: [],
  isLoading: false,
  error: null,
  setHoldings: () => {},
  setTransactions: () => {},
  clearData: () => {}
});

// Custom hook to use the context
export const usePortfolioContext = () => useContext(PortfolioContext);

// Provider component that wraps the app
interface PortfolioProviderProps {
  children: ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      setIsLoading(true);
      
      // Check for data in both storage key formats
      const storedHoldings = localStorage.getItem('holdings') || localStorage.getItem('portfolio-holdings');
      const storedTransactions = localStorage.getItem('transactions') || localStorage.getItem('portfolio-transactions');
      
      if (storedHoldings) {
        setHoldings(JSON.parse(storedHoldings));
      }
      
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading portfolio data:', err);
      setError('Failed to load portfolio data');
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (holdings.length > 0) {
      localStorage.setItem('holdings', JSON.stringify(holdings));
      localStorage.setItem('portfolio-holdings', JSON.stringify(holdings));
    }
    
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
      localStorage.setItem('portfolio-transactions', JSON.stringify(transactions));
    }
  }, [holdings, transactions]);

  // Handle setting holdings with proper state update
  const updateHoldings = (newHoldings: Holding[]) => {
    setHoldings(newHoldings);
  };
  
  // Handle setting transactions with proper state update
  const updateTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
  };

  // Clear all data
  const clearData = () => {
    setHoldings([]);
    setTransactions([]);
    
    // Clear all possible storage keys to avoid confusion
    localStorage.removeItem('holdings');
    localStorage.removeItem('transactions');
    localStorage.removeItem('portfolio-holdings');
    localStorage.removeItem('portfolio-transactions');
  };

  const value = {
    holdings,
    transactions,
    isLoading,
    error,
    setHoldings: updateHoldings,
    setTransactions: updateTransactions,
    clearData
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};