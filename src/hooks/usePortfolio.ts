// src/hooks/usePortfolio.ts

import { useEffect, useState } from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';
import { DividendPayment, Holding, Transaction } from '../types';
import { calculateDividendProjections, recalculateHoldings } from '../utils/calculations';

/**
 * Custom hook for accessing portfolio data from the PortfolioContext
 * and calculating derived state
 */
const usePortfolio = () => {
  const { 
    holdings, 
    transactions, 
    isLoading, 
    error, 
    setHoldings, 
    setTransactions, 
    clearData 
  } = usePortfolioContext();
  
  // Dividend state
  const [dividends, setDividends] = useState<DividendPayment[]>([]);
  
  // Portfolio summary data
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioIncome, setPortfolioIncome] = useState(0);
  const [portfolioYield, setPortfolioYield] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState<{month: string; total: number}[]>([]);
  
  // Load dividend data from localStorage
  useEffect(() => {
    try {
      const dividendsStr = localStorage.getItem('portfolio-dividends');
      
      if (dividendsStr) {
        setDividends(JSON.parse(dividendsStr));
      }
    } catch (err) {
      console.error('Dividend data loading error:', err);
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
  
  // Auto-recalculate holdings when transactions or dividends change
  useEffect(() => {
    if (transactions.length > 0) {
      const calculatedHoldings = recalculateHoldings(transactions, dividends);
      
      // Only update holdings if we have calculated values and they're different
      if (calculatedHoldings.length > 0 && 
          (holdings.length === 0 || 
           JSON.stringify(calculatedHoldings) !== JSON.stringify(holdings))) {
        console.log('Recalculated holdings from transactions:', calculatedHoldings.length);
        setHoldings(calculatedHoldings);
      }
    }
  }, [transactions, dividends, setHoldings, holdings]);
  
  // Add new dividends
  const addDividends = (newDividends: DividendPayment[]) => {
    setDividends(prevDividends => {
      // Merge by ID
      const dividendMap = new Map();
      [...prevDividends, ...newDividends].forEach(item => {
        dividendMap.set(item.id, item);
      });
      
      const merged = Array.from(dividendMap.values());
      localStorage.setItem('portfolio-dividends', JSON.stringify(merged));
      return merged;
    });
  };
  
  // Add new holdings (update the PortfolioContext)
  const addHoldings = (newHoldings: Holding[]) => {
    // Merge by ID
    const holdingMap = new Map();
    [...holdings, ...newHoldings].forEach(item => {
      holdingMap.set(item.id, item);
    });
    
    const merged = Array.from(holdingMap.values());
    setHoldings(merged);
  };
  
  // Add new transactions (update the PortfolioContext and recalculate holdings)
  const addTransactions = (newTransactions: Transaction[]) => {
    // Merge by ID
    const transactionMap = new Map();
    [...transactions, ...newTransactions].forEach(item => {
      transactionMap.set(item.id, item);
    });
    
    const merged = Array.from(transactionMap.values());
    setTransactions(merged);
    
    // The holdings will be recalculated by the useEffect above
  };
  
  // Clear all portfolio data
  const clearPortfolioData = () => {
    clearData(); // Clear context data
    localStorage.removeItem('portfolio-dividends');
    setDividends([]);
  };
  
  // Force recalculation of holdings
  const recalculateAllHoldings = () => {
    if (transactions.length > 0) {
      const calculatedHoldings = recalculateHoldings(transactions, dividends);
      if (calculatedHoldings.length > 0) {
        setHoldings(calculatedHoldings);
        return true;
      }
    }
    return false;
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
    clearPortfolioData,
    recalculateAllHoldings
  };
};

export default usePortfolio;