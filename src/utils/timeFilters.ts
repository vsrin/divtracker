// src/utils/timeFilters.ts
import { Transaction, DividendPayment, Holding } from '../types';

export type TimePeriod = 'MTD' | 'QTD' | 'YTD' | 'Prior Year' | 'Custom';

/**
 * Get date range for a time period
 */
export function getDateRangeForTimePeriod(
  timePeriod: TimePeriod,
  selectedMonths?: string[]
): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let startDate: Date | null = null;
  let endDate: Date | null = now;
  
  switch (timePeriod) {
    case 'MTD':
      // Start of the current month
      startDate = new Date(currentYear, currentMonth, 1);
      break;
    case 'QTD':
      // Start of the current quarter
      const currentQuarter = Math.floor(currentMonth / 3);
      startDate = new Date(currentYear, currentQuarter * 3, 1);
      break;
    case 'YTD':
      // Start of the current year
      startDate = new Date(currentYear, 0, 1);
      break;
    case 'Prior Year':
      // Previous full year
      startDate = new Date(currentYear - 1, 0, 1);
      endDate = new Date(currentYear - 1, 11, 31);
      break;
    case 'Custom':
      // For custom, we need to handle selected months
      if (!selectedMonths || selectedMonths.length === 0) {
        // Default to no filter if no months selected
        return { startDate: null, endDate: null };
      }
      
      // For custom period, we don't set specific start/end dates, but filter by month names
      // Return nulls and handle custom filtering separately
      return { startDate: null, endDate: null };
    default:
      // Default to no filter
      return { startDate: null, endDate: null };
  }
  
  return { startDate, endDate };
}

/**
 * Filter transactions by time period
 */
export function filterTransactionsByTimePeriod(
  transactions: Transaction[],
  timePeriod?: TimePeriod,
  selectedMonths?: string[]
): Transaction[] {
  if (!transactions || transactions.length === 0 || !timePeriod) {
    return transactions;
  }
  
  // For custom time period with selected months
  if (timePeriod === 'Custom' && selectedMonths && selectedMonths.length > 0) {
    return transactions.filter(transaction => {
      const txDate = new Date(transaction.date);
      const txMonthName = txDate.toLocaleString('default', { month: 'long' });
      return selectedMonths.includes(txMonthName);
    });
  }
  
  // For other time periods, use date range
  const { startDate, endDate } = getDateRangeForTimePeriod(timePeriod);
  
  if (!startDate && !endDate) {
    return transactions;
  }
  
  return transactions.filter(transaction => {
    const txDate = new Date(transaction.date);
    
    if (startDate && endDate) {
      return txDate >= startDate && txDate <= endDate;
    } else if (startDate) {
      return txDate >= startDate;
    } else if (endDate) {
      return txDate <= endDate;
    }
    
    return true;
  });
}

/**
 * Filter dividend payments by time period
 */
export function filterDividendsByTimePeriod(
  dividends: DividendPayment[],
  timePeriod?: TimePeriod,
  selectedMonths?: string[]
): DividendPayment[] {
  if (!dividends || dividends.length === 0 || !timePeriod) {
    return dividends;
  }
  
  // For custom time period with selected months
  if (timePeriod === 'Custom' && selectedMonths && selectedMonths.length > 0) {
    return dividends.filter(dividend => {
      const divDate = new Date(dividend.date);
      const divMonthName = divDate.toLocaleString('default', { month: 'long' });
      return selectedMonths.includes(divMonthName);
    });
  }
  
  // For other time periods, use date range
  const { startDate, endDate } = getDateRangeForTimePeriod(timePeriod);
  
  if (!startDate && !endDate) {
    return dividends;
  }
  
  return dividends.filter(dividend => {
    const divDate = new Date(dividend.date);
    
    if (startDate && endDate) {
      return divDate >= startDate && divDate <= endDate;
    } else if (startDate) {
      return divDate >= startDate;
    } else if (endDate) {
      return divDate <= endDate;
    }
    
    return true;
  });
}

/**
 * Calculate time-filtered portfolio metrics based on transactions
 */
export function calculateTimeFilteredPortfolioMetrics(
  holdings: Holding[],
  transactions: Transaction[],
  dividends: DividendPayment[],
  timePeriod?: TimePeriod,
  selectedMonths?: string[]
): {
  filteredHoldings: Holding[];
  filteredTransactions: Transaction[];
  filteredDividends: DividendPayment[];
  periodIncome: number;
  periodGain: number;
} {
  // Filter transactions and dividends by time period
  const filteredTransactions = filterTransactionsByTimePeriod(transactions, timePeriod, selectedMonths);
  const filteredDividends = filterDividendsByTimePeriod(dividends, timePeriod, selectedMonths);
  
  // Calculate period income from filtered dividends
  const periodIncome = filteredDividends.reduce((sum, div) => sum + div.amount, 0);
  
  // Calculate period gain from filtered transactions
  const buys = filteredTransactions
    .filter(tx => tx.type.toUpperCase() === 'BUY')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const sells = filteredTransactions
    .filter(tx => tx.type.toUpperCase() === 'SELL')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const periodGain = sells - buys + periodIncome;
  
  // For holdings, we don't filter them by date, but we can filter their metrics
  // For now, we just return the original holdings
  const filteredHoldings = holdings;
  
  return {
    filteredHoldings,
    filteredTransactions,
    filteredDividends,
    periodIncome,
    periodGain
  };
}