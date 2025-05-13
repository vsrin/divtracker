// src/utils/transactionParser.ts
// Fixed version with totalCost property and removed unused variables

import { v4 as uuidv4 } from 'uuid';
import { Holding, Transaction } from '../types';

export interface BrokerTransaction {
  id: string;
  date: string;
  actionType: string;
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  amount: number;
  fees?: number;
  tax?: number;
}

export interface ParsedData {
  positions?: any[];
  dividends?: any[];
  transactions?: any[];
}

export const parseTransactionHistory = (data: any[]): Promise<{
  success: boolean;
  holdings?: Holding[];
  transactions?: Transaction[];
  dividends?: any[];
  error?: string;
}> => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || data.length === 0) {
        reject({ success: false, error: "No transaction data provided" });
        return;
      }
      
      // Convert the raw data into a standardized format
      const transactions: Transaction[] = [];
      const positions: Record<string, {
        symbol: string;
        name: string;
        quantity: number;
        costBasis: number;
        lastPrice: number;
        dividends: any[];
      }> = {};
      const dividends: any[] = [];
      
      // Process each transaction
      data.forEach((item, index) => {
        // Try to identify key fields in the transaction data
        const date = determineDate(item);
        const actionType = determineActionType(item);
        const symbol = determineSymbol(item);
        const description = determineDescription(item);
        const quantity = determineQuantity(item);
        const price = determinePrice(item);
        const amount = determineAmount(item);
        const fees = determineFees(item);
        
        if (!date || !actionType || !symbol) {
          console.log(`Skipping row ${index + 1}: Missing required fields`);
          return; // Skip this row
        }
        
        // Convert to our internal transaction format
        const transaction: Transaction = {
          id: uuidv4(),
          date,
          type: actionType,
          symbol,
          companyName: description || symbol,
          shares: Math.abs(quantity),
          price,
          amount: Math.abs(amount),
          fees: fees || 0,
          tax: 0, // Not parsed from this format
          currency: 'USD', // Default assumption
          notes: description
        };
        
        transactions.push(transaction);
        
        // Update position tracking
        if (!positions[symbol]) {
          positions[symbol] = {
            symbol,
            name: description || symbol,
            quantity: 0,
            costBasis: 0,
            lastPrice: 0,
            dividends: []
          };
        }
        
        const position = positions[symbol];
        
        // Update position based on transaction type
        if (actionType === 'BUY') {
          // Add to position
          position.quantity += quantity;
          position.costBasis += amount + (fees || 0);
          
          // Update last price
          if (price > 0) {
            position.lastPrice = price;
          }
        } else if (actionType === 'SELL') {
          // Reduce position
          // Adjust cost basis proportionally to shares sold
          if (position.quantity > 0) {
            const costBasisPerShare = position.costBasis / position.quantity;
            position.costBasis -= costBasisPerShare * quantity;
          }
          
          position.quantity -= quantity;
          
          // Update last price
          if (price > 0) {
            position.lastPrice = price;
          }
        } else if (actionType === 'DIVIDEND') {
          // Track dividend payment
          dividends.push({
            id: uuidv4(),
            symbol,
            companyName: description || symbol,
            date,
            amount,
            shares: position.quantity
          });
          
          position.dividends.push({
            date,
            amount
          });
        }
      });
      
      // Convert positions to holdings
      const holdings: Holding[] = [];
      const symbols = Object.keys(positions);
      
      if (symbols.length > 0) {
        // Calculate total value for allocation
        let totalValue = 0;
        
        symbols.forEach(symbol => {
          const position = positions[symbol];
          
          // Skip positions with no shares
          if (position.quantity <= 0) {
            return;
          }
          
          // Calculate dividend metrics if available
          const dividendsForSymbol = dividends.filter(d => d.symbol === symbol);
          let annualDividends = 0;
          
          if (dividendsForSymbol.length > 0) {
            // Group by year and quarter to estimate annual dividend
            const dividendsByYearQuarter: Record<string, number> = {};
            
            dividendsForSymbol.forEach(div => {
              const date = new Date(div.date);
              const year = date.getFullYear();
              const quarter = Math.floor(date.getMonth() / 3) + 1;
              const key = `${year}-Q${quarter}`;
              
              if (!dividendsByYearQuarter[key]) {
                dividendsByYearQuarter[key] = 0;
              }
              
              dividendsByYearQuarter[key] += div.amount;
            });
            
            // Average quarterly dividends and annualize
            const quarters = Object.keys(dividendsByYearQuarter);
            if (quarters.length > 0) {
              const totalDividends = Object.values(dividendsByYearQuarter).reduce((sum, val) => sum + val, 0);
              const avgQuarterlyDividend = totalDividends / quarters.length;
              annualDividends = avgQuarterlyDividend * 4; // Assume quarterly dividends
            }
          }
          
          // Calculate current value and gain
          const currentValue = position.quantity * position.lastPrice;
          const costBasis = position.costBasis;
          const gain = currentValue - costBasis;
          const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
          const dividendYield = currentValue > 0 ? (annualDividends / currentValue) * 100 : 0;
          
          totalValue += currentValue;
          
          // Create a holding from the position data
          const holding: Holding = {
            id: `holding-${symbol}`,
            symbol,
            name: position.name,
            shares: position.quantity,
            costPerShare: position.quantity > 0 ? position.costBasis / position.quantity : 0,
            costBasis: position.costBasis,
            totalCost: position.costBasis, // Set totalCost equal to costBasis
            currentPrice: position.lastPrice,
            currentValue,
            gain,
            gainPercent,
            dividendYield,
            dividendAmount: annualDividends,
            dividendFrequency: determineDividendFrequency(dividends, symbol),
            dividendGrowth: calculateDividendGrowth(dividends, symbol),
            sector: 'Other', // Would need additional data
            assetClass: determineAssetClass(symbol, position.name),
            allocation: 0, // Will calculate after all positions are processed
            irr: 0, // Would need a more complex calculation
            shareInPortfolio: 0, // Will calculate after all positions are processed
            annualIncome: annualDividends // Use annualDividends as annualIncome
          };
          
          holdings.push(holding);
        });
        
        // Calculate allocation percentages
        if (totalValue > 0) {
          holdings.forEach(holding => {
            holding.allocation = (holding.currentValue / totalValue) * 100;
            holding.shareInPortfolio = holding.allocation;
          });
        }
        
        // Sort by value (descending)
        holdings.sort((a, b) => b.currentValue - a.currentValue);
      }
      
      console.log("Transaction processing complete:", {
        transactions: transactions.length,
        holdings: holdings.length,
        dividends: dividends.length
      });
      
      resolve({
        success: true,
        transactions,
        holdings,
        dividends
      });
    } catch (error) {
      console.error("Error parsing transaction data:", error);
      reject({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error parsing transaction data" 
      });
    }
  });
};

// Helper functions to extract data from various transaction formats

function determineDate(item: any): string {
  // Possible field names for date
  const dateFields = ['date', 'transactionDate', 'Date', 'Transaction Date', 'trade_date', 'settleDate', 'Settle Date'];
  
  for (const field of dateFields) {
    if (item[field] && typeof item[field] === 'string') {
      const date = new Date(item[field]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
    }
  }
  
  return '';
}

function determineActionType(item: any): string {
  // Possible field names for action type
  const actionFields = ['action', 'type', 'Action', 'Type', 'transaction_type', 'Description'];
  
  for (const field of actionFields) {
    if (item[field] && typeof item[field] === 'string') {
      const action = item[field].toUpperCase();
      
      // Map to standardized action types
      if (action.includes('BUY') || action.includes('PURCHASE')) {
        return 'BUY';
      } else if (action.includes('SELL') || action.includes('SALE')) {
        return 'SELL';
      } else if (action.includes('DIV') || action.includes('DIVIDEND')) {
        return 'DIVIDEND';
      } else if (action.includes('SPLIT')) {
        return 'SPLIT';
      } else if (action.includes('TRANSFER')) {
        return 'TRANSFER';
      } else if (action.includes('FEE')) {
        return 'FEE';
      } else if (action.includes('INTEREST')) {
        return 'INTEREST';
      }
    }
  }
  
  // Try to infer from other fields
  if (item.dividend && item.dividend > 0) {
    return 'DIVIDEND';
  } else if (item.quantity || item.shares) {
    const quantity = parseFloat(item.quantity || item.shares);
    if (quantity > 0) {
      return 'BUY';
    } else if (quantity < 0) {
      return 'SELL';
    }
  }
  
  return '';
}

function determineSymbol(item: any): string {
  // Possible field names for symbol
  const symbolFields = ['symbol', 'ticker', 'Symbol', 'Ticker', 'security', 'Security', 'cusip', 'CUSIP'];
  
  for (const field of symbolFields) {
    if (item[field] && typeof item[field] === 'string') {
      return item[field].toUpperCase().trim();
    }
  }
  
  return '';
}

function determineDescription(item: any): string {
  // Possible field names for description
  const descFields = ['description', 'desc', 'Description', 'name', 'Name', 'security_description', 'memo'];
  
  for (const field of descFields) {
    if (item[field] && typeof item[field] === 'string') {
      return item[field].trim();
    }
  }
  
  return '';
}

function determineQuantity(item: any): number {
  // Possible field names for quantity/shares
  const quantityFields = ['quantity', 'shares', 'Quantity', 'Shares', 'Amount', 'units'];
  
  for (const field of quantityFields) {
    if (item[field] !== undefined) {
      const quantity = parseFloat(item[field]);
      if (!isNaN(quantity)) {
        return quantity;
      }
    }
  }
  
  return 0;
}

function determinePrice(item: any): number {
  // Possible field names for price
  const priceFields = ['price', 'Price', 'price_per_share', 'pricePerShare', 'unit_price'];
  
  for (const field of priceFields) {
    if (item[field] !== undefined) {
      const price = parseFloat(item[field]);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  
  // Try to calculate price from amount and quantity
  if (item.amount !== undefined && item.quantity !== undefined) {
    const amount = Math.abs(parseFloat(item.amount));
    const quantity = Math.abs(parseFloat(item.quantity));
    
    if (!isNaN(amount) && !isNaN(quantity) && quantity > 0) {
      return amount / quantity;
    }
  }
  
  return 0;
}

function determineAmount(item: any): number {
  // Possible field names for amount
  const amountFields = ['amount', 'Amount', 'total', 'Total', 'net_amount', 'value'];
  
  for (const field of amountFields) {
    if (item[field] !== undefined) {
      const amount = parseFloat(item[field]);
      if (!isNaN(amount)) {
        return amount;
      }
    }
  }
  
  // Try to calculate amount from price and quantity
  if (item.price !== undefined && item.quantity !== undefined) {
    const price = parseFloat(item.price);
    const quantity = Math.abs(parseFloat(item.quantity));
    
    if (!isNaN(price) && !isNaN(quantity)) {
      return price * quantity;
    }
  }
  
  return 0;
}

function determineFees(item: any): number | undefined {
  // Possible field names for fees
  const feeFields = ['fees', 'fee', 'commission', 'Fees', 'Commission', 'expense'];
  
  for (const field of feeFields) {
    if (item[field] !== undefined) {
      const fee = parseFloat(item[field]);
      if (!isNaN(fee) && fee > 0) {
        return fee;
      }
    }
  }
  
  return undefined;
}

function determineDividendFrequency(dividends: any[], symbol: string): string {
  // Find dividends for this symbol
  const symbolDividends = dividends.filter(d => d.symbol === symbol);
  
  if (symbolDividends.length <= 1) {
    return 'quarterly'; // Default assumption
  }
  
  // Group by year
  const dividendsByYear: Record<string, Date[]> = {};
  
  symbolDividends.forEach(div => {
    const date = new Date(div.date);
    const year = date.getFullYear().toString();
    
    if (!dividendsByYear[year]) {
      dividendsByYear[year] = [];
    }
    
    dividendsByYear[year].push(date);
  });
  
  // Check frequency in years with multiple dividends
  let frequency = 'quarterly'; // Default
  
  Object.values(dividendsByYear).forEach(dates => {
    if (dates.length >= 10) {
      frequency = 'monthly';
    } else if (dates.length >= 3 && frequency !== 'monthly') {
      frequency = 'quarterly';
    } else if (dates.length === 2 && frequency !== 'monthly' && frequency !== 'quarterly') {
      frequency = 'semi-annual';
    } else if (dates.length === 1 && frequency === 'quarterly') {
      // Don't change from quarterly based on a single year with 1 payment
    }
  });
  
  return frequency;
}

function calculateDividendGrowth(dividends: any[], symbol: string): number {
  // Find dividends for this symbol
  const symbolDividends = dividends.filter(d => d.symbol === symbol);
  
  if (symbolDividends.length <= 1) {
    return 0; // Not enough data
  }
  
  // Group by year and sum
  const dividendsByYear: Record<string, number> = {};
  
  symbolDividends.forEach(div => {
    const year = new Date(div.date).getFullYear().toString();
    
    if (!dividendsByYear[year]) {
      dividendsByYear[year] = 0;
    }
    
    dividendsByYear[year] += div.amount;
  });
  
  const years = Object.keys(dividendsByYear).sort();
  
  if (years.length < 2) {
    return 0; // Not enough years
  }
  
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  
  const firstAmount = dividendsByYear[firstYear];
  const lastAmount = dividendsByYear[lastYear];
  
  if (firstAmount <= 0) {
    return 0; // Avoid division by zero
  }
  
  const yearDiff = parseInt(lastYear) - parseInt(firstYear);
  
  if (yearDiff <= 0) {
    return 0; // Same year
  }
  
  // Calculate compound annual growth rate (CAGR)
  const cagr = Math.pow(lastAmount / firstAmount, 1 / yearDiff) - 1;
  
  return cagr * 100; // Convert to percentage
}

function determineAssetClass(symbol: string, name: string): string {
  const combinedText = `${symbol} ${name}`.toLowerCase();
  
  if (combinedText.includes(' etf') || 
      combinedText.includes('index') || 
      combinedText.includes('fund') ||
      /\b[a-z]{3,4}x\b/.test(symbol)) { // Three or four letter ticker ending with X (common for ETFs)
    return 'ETFs';
  } else if (combinedText.includes('reit') || 
             combinedText.includes('real estate') || 
             combinedText.includes('property')) {
    return 'Real Estate';
  } else if (combinedText.includes('bond') || 
             combinedText.includes('treasury') || 
             combinedText.includes('notes')) {
    return 'Bonds';
  } else if (combinedText.includes('cash') || 
             combinedText.includes('money market') || 
             combinedText.includes('savings')) {
    return 'Cash';
  } else if (combinedText.includes('gold') || 
             combinedText.includes('silver') || 
             combinedText.includes('commodity')) {
    return 'Commodities';
  } else if (combinedText.includes('bitcoin') || 
             combinedText.includes('crypto') || 
             combinedText.includes('ethereum')) {
    return 'Crypto';
  } else {
    return 'Stocks'; // Default
  }
}

export default parseTransactionHistory;