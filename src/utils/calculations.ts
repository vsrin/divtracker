// src/utils/calculations.ts

import { v4 as uuidv4 } from 'uuid';
import { Holding, Transaction } from '../types';

/**
 * Filter transactions by date range
 */
export const filterTransactionsByDate = (
  transactions: any[],
  startDate?: string,
  endDate?: string
): any[] => {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  if (!startDate && !endDate) {
    return transactions;
  }
  
  return transactions.filter(transaction => {
    const txDate = new Date(transaction.date);
    
    if (startDate && endDate) {
      return txDate >= new Date(startDate) && txDate <= new Date(endDate);
    } else if (startDate) {
      return txDate >= new Date(startDate);
    } else if (endDate) {
      return txDate <= new Date(endDate);
    }
    
    return true;
  });
};

/**
 * Calculate dividend projections for the next 12 months
 */
export const calculateDividendProjections = (
  holdings: any[],
  dividendHistory: any[]
): Array<{ month: string; total: number }> => {
  // Current date
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Initialize projections for next 12 months
  const projections: Array<{ month: string; total: number }> = [];
  
  for (let i = 0; i < 12; i++) {
    const month = (currentMonth + i) % 12;
    const year = currentYear + Math.floor((currentMonth + i) / 12);
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    projections.push({
      month: monthStr,
      total: 0
    });
  }
  
  // No data to process
  if (!holdings || !dividendHistory || holdings.length === 0 || dividendHistory.length === 0) {
    return projections;
  }
  
  // Group dividend history by symbol and month
  const dividendsBySymbolMonth: Record<string, Record<number, number[]>> = {};
  
  dividendHistory.forEach(dividend => {
    const date = new Date(dividend.date);
    const month = date.getMonth();
    const symbol = dividend.symbol;
    
    if (!dividendsBySymbolMonth[symbol]) {
      dividendsBySymbolMonth[symbol] = {};
    }
    
    if (!dividendsBySymbolMonth[symbol][month]) {
      dividendsBySymbolMonth[symbol][month] = [];
    }
    
    dividendsBySymbolMonth[symbol][month].push(dividend.amount);
  });
  
  // Calculate projections based on historical patterns
  holdings.forEach(holding => {
    const { symbol } = holding; // Remove 'shares' to fix unused variable warning
    
    if (!dividendsBySymbolMonth[symbol]) {
      return; // No dividend history for this symbol
    }
    
    // Calculate average dividend per share by month
    Object.entries(dividendsBySymbolMonth[symbol]).forEach(([monthStr, amounts]) => {
      const month = parseInt(monthStr);
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      
      // Find the matching projection month
      for (let i = 0; i < 12; i++) {
        const projMonth = (currentMonth + i) % 12;
        
        if (projMonth === month) {
          // Add projected amount to that month
          projections[i].total += avgAmount;
          break;
        }
      }
    });
  });
  
  return projections;
};

/**
 * Calculate holdings from transaction history
 * This processes the transaction history and builds up the current holdings
 */
export const calculateHoldingsFromTransactions = (transactions: Transaction[]): Holding[] => {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  // Sort transactions by date (oldest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Use a map to track holdings by symbol
  const holdingsMap: Record<string, Holding> = {};
  
  // Process each transaction
  sortedTransactions.forEach(transaction => {
    const { symbol, type, shares, price, amount, companyName, date } = transaction;
    
    // Skip if no symbol (like cash deposits)
    if (!symbol) return;
    
    // Initialize holding if it doesn't exist
    if (!holdingsMap[symbol]) {
      holdingsMap[symbol] = {
        id: uuidv4(),
        symbol,
        name: companyName || symbol,
        shares: 0,
        costBasis: 0,
        totalCost: 0,
        currentPrice: 0,
        currentValue: 0,
        gain: 0,
        gainPercent: 0,
        dividendYield: 0,
        annualIncome: 0,
        lastUpdated: date,
        assetClass: 'Stocks', // Default asset class
        allocation: 0,
        shareInPortfolio: 0,
        costPerShare: 0,
        dividendAmount: 0,
        dividendFrequency: 'quarterly',
        dividendGrowth: 0,
        sector: 'Other',
        irr: 0 // Add default IRR value
      };
    }
    
    const holding = holdingsMap[symbol];
    
    // Update holdings based on transaction type
    switch (type.toUpperCase()) {
      case 'BUY':
        // Add shares and update cost basis
        holding.totalCost += amount;
        holding.shares += shares;
        // Recalculate average cost basis
        holding.costBasis = holding.shares > 0 ? holding.totalCost / holding.shares : 0;
        holding.costPerShare = holding.costBasis;
        break;
        
      case 'SELL':
        // Remove shares and update cost basis
        holding.totalCost = holding.totalCost * (1 - (shares / holding.shares));
        holding.shares -= shares;
        // Recalculate cost basis if shares > 0
        holding.costBasis = holding.shares > 0 ? holding.totalCost / holding.shares : 0;
        holding.costPerShare = holding.costBasis;
        break;
        
      case 'DIVIDEND':
        // Update dividend info but don't change shares
        // Note: This assumes a separate process calculates yield and annual income
        break;
        
      case 'SPLIT':
        // Handle stock splits by adjusting cost basis
        if (price && price > 0) {
          const splitRatio = price;
          holding.shares = holding.shares * splitRatio;
          holding.costBasis = holding.costBasis / splitRatio;
          holding.costPerShare = holding.costBasis;
        }
        break;
        
      default:
        // Other transaction types may not affect holdings
        break;
    }
    
    // Update the current price (most recent price)
    if (price && price > 0) {
      holding.currentPrice = price;
    }
    
    // Update last update date
    holding.lastUpdated = date;
  });
  
  // Calculate current values and gains for holdings that still have shares
  const holdings = Object.values(holdingsMap)
    .filter(holding => holding.shares > 0)
    .map(holding => {
      // Calculate current value
      holding.currentValue = holding.shares * holding.currentPrice;
      
      // Calculate gain/loss
      holding.gain = holding.currentValue - holding.totalCost;
      holding.gainPercent = holding.totalCost > 0 
        ? (holding.gain / holding.totalCost) * 100 
        : 0;
        
      return holding;
    });
  
  // Calculate allocation percentages
  const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  holdings.forEach(holding => {
    holding.allocation = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0;
    holding.shareInPortfolio = holding.allocation;
  });
  
  return holdings;
};

/**
 * Calculate dividend metrics for holdings
 * This updates holdings with dividend yield and annual income based on dividend history
 */
export const calculateDividendMetrics = (
  holdings: Holding[], 
  dividends: any[]
): Holding[] => {
  if (!holdings || !dividends || holdings.length === 0 || dividends.length === 0) {
    return holdings;
  }
  
  // Group dividends by symbol and calculate annual rate
  const dividendsBySymbol: Record<string, { 
    totalAmount: number; 
    payments: any[]; 
    annualRate: number; 
  }> = {};
  
  // Group and calculate
  dividends.forEach(dividend => {
    if (!dividend.symbol) return;
    
    if (!dividendsBySymbol[dividend.symbol]) {
      dividendsBySymbol[dividend.symbol] = {
        totalAmount: 0,
        payments: [],
        annualRate: 0
      };
    }
    
    dividendsBySymbol[dividend.symbol].totalAmount += dividend.amount;
    dividendsBySymbol[dividend.symbol].payments.push(dividend);
  });
  
  // Calculate annual rates based on payment frequency
  Object.keys(dividendsBySymbol).forEach(symbol => {
    const { payments, totalAmount } = dividendsBySymbol[symbol];
    
    // Get unique payment dates by month (to estimate frequency)
    const paymentDates = payments.map(p => {
      const date = new Date(p.date);
      return `${date.getFullYear()}-${date.getMonth() + 1}`;
    });
    const uniqueDates = new Set(paymentDates);
    
    // Estimate annual rate based on payment frequency
    const paymentCount = uniqueDates.size;
    
    if (paymentCount > 0) {
      // If we have at least 12 months of data, use the total
      if (paymentCount >= 12) {
        dividendsBySymbol[symbol].annualRate = totalAmount;
      } else {
        // Otherwise extrapolate to a year
        const avgPerPayment = totalAmount / paymentCount;
        
        // Estimate frequency (monthly, quarterly, semi-annual, annual)
        let frequency = 1; // Default to annual
        
        if (paymentCount > 9) {
          frequency = 12; // Monthly
        } else if (paymentCount > 3) {
          frequency = 4; // Quarterly
        } else if (paymentCount > 1) {
          frequency = 2; // Semi-annual
        }
        
        dividendsBySymbol[symbol].annualRate = avgPerPayment * frequency;
      }
    }
  });
  
  // Update holdings with dividend information
  return holdings.map(holding => {
    const dividendInfo = dividendsBySymbol[holding.symbol];
    
    if (dividendInfo) {
      holding.annualIncome = dividendInfo.annualRate;
      holding.dividendYield = holding.currentValue > 0 
        ? (holding.annualIncome / holding.currentValue) * 100 
        : 0;
      holding.dividendAmount = dividendInfo.annualRate;
    }
    
    return holding;
  });
};

/**
 * Recalculate holdings based on transactions and dividends
 * This combines the two functions above into a single utility
 */
export const recalculateHoldings = (
  transactions: Transaction[], 
  dividends: any[]
): Holding[] => {
  // First calculate holdings from transactions
  const calculatedHoldings = calculateHoldingsFromTransactions(transactions);
  
  // Then update with dividend metrics
  return calculateDividendMetrics(calculatedHoldings, dividends);
};