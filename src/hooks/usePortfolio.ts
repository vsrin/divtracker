// src/hooks/usePortfolio.ts

import { useState, useEffect } from 'react';
import { 
  Holding, 
  DividendPayment, 
  Transaction 
} from '../types';
import { calculateDividendProjections } from '../utils/calculations';

/**
 * Helper function to merge arrays by ID while avoiding duplicates
 */
function mergeArraysById<T extends { id: string }>(
  existingArray: T[],
  newArray: T[]
): T[] {
  const merged: Record<string, T> = {};
  
  // Add existing items to the map
  existingArray.forEach(item => {
    merged[item.id] = item;
  });
  
  // Add new items, overwriting existing ones with same ID
  newArray.forEach(item => {
    merged[item.id] = item;
  });
  
  // Convert back to array
  return Object.values(merged);
}

/**
 * Custom hook for managing portfolio data
 */
const usePortfolio = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [dividends, setDividends] = useState<DividendPayment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Portfolio summary data
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioIncome, setPortfolioIncome] = useState(0);
  const [portfolioYield, setPortfolioYield] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState<{month: string; total: number}[]>([]);
  
  // Load portfolio data from localStorage
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load data from localStorage
      const holdingsStr = localStorage.getItem('portfolio-holdings');
      const dividendsStr = localStorage.getItem('portfolio-dividends');
      const transactionsStr = localStorage.getItem('portfolio-transactions');
      
      if (holdingsStr) {
        setHoldings(JSON.parse(holdingsStr));
      }
      
      if (dividendsStr) {
        setDividends(JSON.parse(dividendsStr));
      }
      
      if (transactionsStr) {
        setTransactions(JSON.parse(transactionsStr));
      }
    } catch (err) {
      setError(`Error loading portfolio data: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Portfolio data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Calculate portfolio summary when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      // Calculate total portfolio value
      const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
      setPortfolioValue(totalValue);
      
      // Calculate total dividend income
      const totalIncome = holdings.reduce((sum, holding) => sum + holding.annualIncome, 0);
      setPortfolioIncome(totalIncome);
      
      // Calculate overall portfolio yield
      const portfolioYieldValue = totalValue > 0 ? (totalIncome / totalValue) * 100 : 0;
      setPortfolioYield(portfolioYieldValue);
      
      // Calculate projected monthly income
      const projections = calculateDividendProjections(holdings, dividends);
      setMonthlyIncome(projections);
    } else {
      // Reset values if no holdings
      setPortfolioValue(0);
      setPortfolioIncome(0);
      setPortfolioYield(0);
      setMonthlyIncome([]);
    }
  }, [holdings, dividends]);
  
  // Add new holdings
  const addHoldings = (newHoldings: Holding[]) => {
    setHoldings(prevHoldings => {
      const merged = mergeArraysById(prevHoldings, newHoldings);
      localStorage.setItem('portfolio-holdings', JSON.stringify(merged));
      return merged;
    });
  };
  
  // Add new dividends
  const addDividends = (newDividends: DividendPayment[]) => {
    setDividends(prevDividends => {
      const merged = mergeArraysById(prevDividends, newDividends);
      localStorage.setItem('portfolio-dividends', JSON.stringify(merged));
      return merged;
    });
  };
  
  // Add new transactions
  const addTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prevTransactions => {
      const merged = mergeArraysById(prevTransactions, newTransactions);
      localStorage.setItem('portfolio-transactions', JSON.stringify(merged));
      return merged;
    });
  };
  
  // Clear all portfolio data
  const clearPortfolioData = () => {
    localStorage.removeItem('portfolio-holdings');
    localStorage.removeItem('portfolio-dividends');
    localStorage.removeItem('portfolio-transactions');
    setHoldings([]);
    setDividends([]);
    setTransactions([]);
  };
  
  return {
    holdings,
    dividends,
    dividendHistory: dividends, // Alias for backward compatibility
    transactions,
    isLoading,
    error,
    portfolioValue,
    portfolioIncome,
    portfolioYield,
    monthlyIncome,
    addHoldings,
    addDividends,
    addTransactions,
    clearPortfolioData
  };
};

export default usePortfolio;