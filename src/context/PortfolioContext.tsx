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
      const storedHoldings = localStorage.getItem('holdings');
      const storedTransactions = localStorage.getItem('transactions');
      
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
    }
    
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [holdings, transactions]);

  // Clear all data
  const clearData = () => {
    setHoldings([]);
    setTransactions([]);
    
    localStorage.removeItem('holdings');
    localStorage.removeItem('transactions');
  };

  const value = {
    holdings,
    transactions,
    isLoading,
    error,
    setHoldings,
    setTransactions,
    clearData
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};