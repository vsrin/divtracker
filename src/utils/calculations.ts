// src/utils/calculations.ts

import { Holding, DividendPayment } from '../types';

/**
 * Calculate dividend metrics for the portfolio
 */
export const calculateDividendMetrics = (
  holdings: Holding[],
  dividendHistory: DividendPayment[] = []
) => {
  // Calculate total portfolio value
  const portfolioValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  
  // Calculate total annual income
  const annualIncome = holdings.reduce((sum, holding) => sum + holding.annualIncome, 0);
  
  // Calculate overall portfolio yield
  const portfolioYield = portfolioValue > 0 ? (annualIncome / portfolioValue) * 100 : 0;
  
  // Calculate income breakdown by sector
  const incomeByAssetClass: Record<string, number> = {};
  const valueByAssetClass: Record<string, number> = {};
  
  holdings.forEach(holding => {
    const assetClass = holding.assetClass || 'Other';
    if (!incomeByAssetClass[assetClass]) {
      incomeByAssetClass[assetClass] = 0;
      valueByAssetClass[assetClass] = 0;
    }
    incomeByAssetClass[assetClass] += holding.annualIncome;
    valueByAssetClass[assetClass] += holding.currentValue;
  });
  
  // Calculate asset allocation (unused but keeping for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _assetAllocation = Object.keys(valueByAssetClass).map(assetClass => ({
    name: assetClass,
    value: valueByAssetClass[assetClass],
    percentage: (valueByAssetClass[assetClass] / portfolioValue) * 100
  }));
  
  // Group dividends by month for historical analysis
  const dividendsByMonth: Record<string, number> = {};
  
  dividendHistory.forEach(dividend => {
    const date = new Date(dividend.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!dividendsByMonth[monthYear]) {
      dividendsByMonth[monthYear] = 0;
    }
    
    dividendsByMonth[monthYear] += dividend.amount;
  });
  
  // Calculate IRR for holdings (simplified - unused but keeping for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _currentHoldingsIrr = holdings.length > 0 
    ? holdings.reduce((sum, holding) => {
        const holdingIrr = holding.costBasis > 0 
          ? (holding.currentValue / holding.costBasis - 1) * 100 
          : 0;
        return sum + (holdingIrr * (holding.currentValue / portfolioValue));
      }, 0)
    : 0;
    
  return {
    portfolioValue,
    annualIncome,
    portfolioYield,
    incomeByAssetClass,
    valueByAssetClass,
    dividendsByMonth
  };
};

/**
 * Group dividend history by month 
 */
export const groupDividendsByMonth = (dividends: DividendPayment[]): Record<string, number> => {
  const byMonth: Record<string, number> = {};
  
  dividends.forEach(dividend => {
    const date = new Date(dividend.date);
    // Format: YYYY-MM
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = 0;
    }
    
    byMonth[monthKey] += dividend.amount;
  });
  
  return byMonth;
};

/**
 * Filter transactions by date range
 */
export const filterTransactionsByDate = (
  transactions: Transaction[], 
  startDate?: string, 
  endDate?: string
): Transaction[] => {
  if (!startDate && !endDate) {
    return transactions;
  }
  
  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();
  
  return transactions.filter(transaction => {
    const date = new Date(transaction.date);
    return date >= start && date <= end;
  });
};

/**
 * Calculate monthly dividend projections based on current holdings 
 * and dividend frequencies
 */
export const calculateDividendProjections = (
  holdings: Holding[],
  dividendHistory: DividendPayment[] = []
): Array<{ month: string; total: number }> => {
  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Initialize 12 months of projections
  const projections: Array<{ 
    month: string;
    total: number;
    holdings: Array<{ 
      symbol: string;
      name: string;
      amount: number;
    }>;
  }> = [];
  
  // Initialize 12 months
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const year = currentYear + Math.floor((currentMonth + i) / 12);
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    projections.push({
      month: monthKey,
      total: 0,
      holdings: []
    });
  }

  // Process each holding based on dividend frequency
  holdings.forEach(holding => {
    if (holding.dividendAmount <= 0 || holding.shares <= 0) {
      return; // Skip if no dividend or no shares
    }
    
    const annualAmount = holding.annualIncome;
    
    // Distribute annual amount based on frequency
    switch (holding.dividendFrequency) {
      case 'monthly':
        // Distribute evenly across all 12 months
        for (let i = 0; i < 12; i++) {
          const amount = annualAmount / 12;
          projections[i].total += amount;
          projections[i].holdings.push({
            symbol: holding.symbol,
            name: holding.name,
            amount
          });
        }
        break;
        
      case 'quarterly':
        // Distribute across 4 quarters
        // Try to detect which months based on dividend history
        const quarterMonths = detectQuarterlyMonths(holding.symbol, dividendHistory);
        
        if (quarterMonths.length === 4) {
          // Use detected months
          quarterMonths.forEach(payMonth => {
            // Find the projection month that matches
            for (let i = 0; i < 12; i++) {
              const monthIndex = (currentMonth + i) % 12;
              if (monthIndex === payMonth) {
                const amount = annualAmount / 4;
                projections[i].total += amount;
                projections[i].holdings.push({
                  symbol: holding.symbol,
                  name: holding.name,
                  amount
                });
              }
            }
          });
        } else {
          // Use standard quarters if detection failed
          for (let i = 0; i < 12; i++) {
            const monthIndex = (currentMonth + i) % 12;
            if (monthIndex % 3 === 0) {
              const amount = annualAmount / 4;
              projections[i].total += amount;
              projections[i].holdings.push({
                symbol: holding.symbol,
                name: holding.name,
                amount
              });
            }
          }
        }
        break;
        
      case 'semi-annual':
        // Distribute across 2 semi-annual periods
        for (let i = 0; i < 12; i++) {
          const monthIndex = (currentMonth + i) % 12;
          if (monthIndex === 0 || monthIndex === 6) {
            const amount = annualAmount / 2;
            projections[i].total += amount;
            projections[i].holdings.push({
              symbol: holding.symbol,
              name: holding.name,
              amount
            });
          }
        }
        break;
        
      case 'annual':
        // Distribute once per year
        for (let i = 0; i < 12; i++) {
          const monthIndex = (currentMonth + i) % 12;
          if (monthIndex === 11) { // December by default
            projections[i].total += annualAmount;
            projections[i].holdings.push({
              symbol: holding.symbol,
              name: holding.name,
              amount: annualAmount
            });
          }
        }
        break;
        
      default: // 'irregular' or unspecified
        // Distribute quarterly as a default approach
        for (let i = 0; i < 12; i++) {
          const monthIndex = (currentMonth + i) % 12;
          if (monthIndex % 3 === 0) {
            const amount = annualAmount / 4;
            projections[i].total += amount;
            projections[i].holdings.push({
              symbol: holding.symbol,
              name: holding.name,
              amount
            });
          }
        }
    }
  });
  
  return projections;
};

/**
 * Detect which months a holding pays dividends
 * based on dividend history
 */
function detectQuarterlyMonths(symbol: string, dividendHistory: DividendPayment[]): number[] {
  // Filter dividends for this symbol
  const dividends = dividendHistory.filter(d => d.symbol === symbol);
  
  if (dividends.length < 2) {
    return []; // Not enough history
  }
  
  // Extract months from dividend dates
  const months = dividends.map(d => new Date(d.date).getMonth());
  
  // Get unique months
  const uniqueMonths = Array.from(new Set(months)).sort();
  
  // If we have exactly 4 unique months and they're approximately quarterly
  if (uniqueMonths.length === 4 && 
      (uniqueMonths[1] - uniqueMonths[0] >= 2) &&
      (uniqueMonths[2] - uniqueMonths[1] >= 2) &&
      (uniqueMonths[3] - uniqueMonths[2] >= 2)) {
    return uniqueMonths;
  }
  
  // Default to standard quarters if detection fails
  return [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
}

// Define the Transaction interface that was missing
interface Transaction {
  id: string;
  date: string;
  type: string;
  symbol: string;
  companyName: string;
  shares: number;
  price: number;
  amount: number;
  fees?: number;
  tax?: number;
  currency: string;
  notes?: string;
}