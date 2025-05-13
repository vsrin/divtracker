// src/utils/transactionImporter.ts
import { v4 as uuidv4 } from 'uuid';
import { Transaction, DividendPayment } from '../types';

/**
 * Parse a transaction history CSV from a broker into app-compatible formats
 * @param historyData Array of transaction data from CSV
 * @returns An object containing transformed transactions and dividends
 */
export const parseHistoryToTransactions = (
  historyData: any[]
): { transactions: Transaction[], dividends: DividendPayment[] } => {
  if (!historyData || historyData.length === 0) {
    return { transactions: [], dividends: [] };
  }
  
  const transactions: Transaction[] = [];
  const dividends: DividendPayment[] = [];
  
  historyData.forEach(entry => {
    // Extract and normalize fields
    const action = entry.Action || '';
    const type = determineTransactionType(action);
    const date = parseDate(entry['Run Date'] || entry.Date || '');
    const symbol = entry.Symbol || '';
    const description = entry.Description || '';
    const quantity = parseFloat(entry.Quantity || '0') || 0;
    const price = parseFloat(entry['Price ($)'] || entry.Price || '0') || 0;
    const amount = Math.abs(parseFloat(entry['Amount ($)'] || entry.Amount || '0')) || 0;
    const fees = parseFloat(entry['Fees ($)'] || entry.Fees || '0') || 0;
    const tax = parseFloat(entry['Tax ($)'] || entry.Tax || '0') || 0;
    
    // Extract company name from description if possible
    const companyName = extractCompanyName(description, symbol);
    
    // Skip entries with no action or symbol
    if (!type || !date) {
      return;
    }
    
    // Process dividends separately
    if (type === 'DIVIDEND') {
      const dividend: DividendPayment = {
        id: uuidv4(),
        date,
        symbol,
        companyName,
        amount,
        shares: quantity,
        amountPerShare: quantity > 0 ? amount / quantity : 0,
        tax: tax || 0,
        currency: 'USD'
      };
      
      dividends.push(dividend);
    }
    
    // Create transaction object
    const transaction: Transaction = {
      id: uuidv4(),
      date,
      type,
      symbol,
      companyName,
      shares: quantity,
      price,
      amount,
      fees,
      tax,
      currency: 'USD',
      notes: description
    };
    
    transactions.push(transaction);
  });
  
  return { transactions, dividends };
};

/**
 * Determine transaction type from broker action
 */
const determineTransactionType = (action: string): string => {
  action = action.toUpperCase();
  
  if (!action) return '';
  
  if (action.includes('BUY') || action === 'PURCHASED') {
    return 'BUY';
  } else if (action.includes('SELL') || action === 'SOLD') {
    return 'SELL';
  } else if (action.includes('DIV') || action.includes('DIVIDEND')) {
    return 'DIVIDEND';
  } else if (action.includes('SPLIT')) {
    return 'SPLIT';
  } else if (action.includes('DEPOSIT') || action.includes('TRANSFER IN')) {
    return 'TRANSFER';
  } else if (action.includes('WITHDRAW') || action.includes('TRANSFER OUT')) {
    return 'TRANSFER';
  } else if (action.includes('FEE') || action.includes('INTEREST')) {
    return 'FEE';
  } else if (action.includes('TAX')) {
    return 'TAX';
  } else {
    return action; // Use the original action if we can't determine
  }
};

/**
 * Parse date string into YYYY-MM-DD format
 */
const parseDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    // Try parsing with Date constructor first
    const date = new Date(dateStr);
    
    // Check if the date is valid
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    // Fallback for MM/DD/YYYY format
    // eslint-disable-next-line no-useless-escape
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      // Check if the first part is month or day
      let year, month, day;
      
      // Try to determine based on the year value
      if (parts[2].length === 4) {
        // MM/DD/YYYY format
        month = parts[0].padStart(2, '0');
        day = parts[1].padStart(2, '0');
        year = parts[2];
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD format
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
      } else {
        // DD/MM/YYYY format (default assumption)
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
      }
      
      return `${year}-${month}-${day}`;
    }
  } catch (err) {
    console.error('Error parsing date:', dateStr, err);
  }
  
  return '';
};

/**
 * Extract company name from description and symbol
 */
const extractCompanyName = (description: string, symbol: string): string => {
  if (!description) return symbol;
  
  // Try to extract company name from common patterns
  // Most descriptions follow patterns like "ACME INC (ACM)" or "DIV ON ACM ACME INC"
  
  // Pattern 1: Symbol in parentheses
  const pattern1 = new RegExp(`(.*?)\\(${symbol}\\)`, 'i');
  const match1 = description.match(pattern1);
  if (match1 && match1[1]) {
    return match1[1].trim();
  }
  
  // Pattern 2: Symbol followed by name
  const pattern2 = new RegExp(`${symbol}\\s+(.*?)(?:\\s+|$)`, 'i');
  const match2 = description.match(pattern2);
  if (match2 && match2[1]) {
    return match2[1].trim();
  }
  
  // Pattern 3: Name at the beginning
  if (description.includes(symbol)) {
    const parts = description.split(symbol);
    if (parts[0].trim()) {
      return parts[0].trim();
    }
    if (parts[1] && parts[1].trim()) {
      return parts[1].trim();
    }
  }
  
  // For dividend descriptions
  if (description.toLowerCase().includes('div on')) {
    const divMatch = description.match(/DIV ON\s+(?:[\w\d]+\s+)?(.*?)(?:\s+|$)/i);
    if (divMatch && divMatch[1]) {
      return divMatch[1].trim();
    }
  }
  
  // Return the description if we can't extract a name
  return description;
};

/**
 * Import a transaction history CSV directly
 * This is a standalone utility function that doesn't use React hooks
 */
export const importTransactionHistory = async (
  historyData: any[],
  callbacks: {
    addTransactions: (transactions: Transaction[]) => void;
    addDividends: (dividends: DividendPayment[]) => void;
    recalculateAllHoldings: () => boolean;
  }
) => {
  try {
    // Parse the history data
    const { transactions, dividends } = parseHistoryToTransactions(historyData);
    
    // Add transactions and dividends using the provided callbacks
    if (transactions.length > 0) {
      callbacks.addTransactions(transactions);
    }
    
    if (dividends.length > 0) {
      callbacks.addDividends(dividends);
    }
    
    // Force recalculation of holdings
    callbacks.recalculateAllHoldings();
    
    return {
      success: true,
      transactionCount: transactions.length,
      dividendCount: dividends.length
    };
  } catch (error) {
    console.error('Error importing transaction history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};