// src/utils/csvParser.ts
// Fixed version with totalCost property

import { v4 as uuidv4 } from 'uuid';
import { Holding } from '../types';

interface CSVParseResult {
  success: boolean;
  fileType?: string;
  holdings?: any[];
  transactions?: any[];
  error?: string;
}

export const parseCSV = (csvText: string): Promise<CSVParseResult> => {
  return new Promise((resolve, reject) => {
    if (!csvText) {
      reject({ success: false, error: "No CSV data provided" });
      return;
    }

    try {
      // Split CSV into lines
      const lines = csvText.split(/\r?\n/);
      
      // Extract headers (first line)
      const headers = lines[0].split(',').map(header => header.trim());
      
      // Determine if this is a holdings or transactions file
      const isHoldings = detectHoldingsCSV(headers);
      const isTransactions = detectTransactionsCSV(headers);
      
      if (!isHoldings && !isTransactions) {
        reject({ 
          success: false, 
          error: "Could not determine CSV type. Expected headers for holdings or transactions not found."
        });
        return;
      }
      
      const fileType = isHoldings ? 'holdings' : 'transactions';
      
      // Skip header row and empty lines
      const dataLines = lines.slice(1).filter(line => line.trim() !== '');
      
      if (dataLines.length === 0) {
        reject({ success: false, error: "No data rows found in CSV" });
        return;
      }
      
      if (isHoldings) {
        // Parse as holdings
        const holdings: Holding[] = [];
        
        // Map headers to standard field names
        const symbolIndex = findHeaderIndex(headers, ['symbol', 'ticker', 'stock']);
        const nameIndex = findHeaderIndex(headers, ['name', 'description', 'company', 'security']);
        const sharesIndex = findHeaderIndex(headers, ['shares', 'quantity', 'position']);
        const costBasisIndex = findHeaderIndex(headers, ['cost basis', 'basis', 'total cost']);
        const costPerShareIndex = findHeaderIndex(headers, ['cost per share', 'price paid', 'avg price', 'average price']);
        const currentPriceIndex = findHeaderIndex(headers, ['price', 'current price', 'last price']);
        const currentValueIndex = findHeaderIndex(headers, ['value', 'current value', 'market value']);
        const gainIndex = findHeaderIndex(headers, ['gain', 'profit', 'gain/loss', 'p/l']);
        const gainPercentIndex = findHeaderIndex(headers, ['gain %', 'profit %', 'return', 'return %', 'roi']);
        const dividendYieldIndex = findHeaderIndex(headers, ['yield', 'dividend yield', 'div yield', 'yield %']);
        const dividendAmountIndex = findHeaderIndex(headers, ['dividend', 'annual dividend', 'div amount']);
        const sectorIndex = findHeaderIndex(headers, ['sector', 'industry']);
        const assetClassIndex = findHeaderIndex(headers, ['asset class', 'asset type', 'security type', 'type']);
        
        if (symbolIndex === -1) {
          reject({ success: false, error: "Required column 'Symbol' not found" });
          return;
        }
        
        // Process each data line
        for (let i = 0; i < dataLines.length; i++) {
          const cells = parseCsvLine(dataLines[i]);
          
          // Skip rows with incorrect number of columns
          if (cells.length !== headers.length) {
            console.warn(`Skipping row ${i + 2} due to column count mismatch`);
            continue;
          }
          
          // Get values from cells
          const symbol = symbolIndex >= 0 ? cells[symbolIndex].trim() : '';
          
          // Skip rows without a symbol
          if (!symbol) {
            continue;
          }
          
          const name = nameIndex >= 0 ? cells[nameIndex].trim() : symbol;
          const shares = sharesIndex >= 0 ? parseFloat(cells[sharesIndex]) : 0;
          
          // Skip positions with zero shares
          if (shares <= 0) {
            continue;
          }
          
          // Parse financial values
          const costBasis = costBasisIndex >= 0 ? parseFloat(cells[costBasisIndex]) : 0;
          const costPerShare = costPerShareIndex >= 0 ? 
            parseFloat(cells[costPerShareIndex]) : 
            (shares > 0 ? costBasis / shares : 0);
          
          const currentPrice = currentPriceIndex >= 0 ? 
            parseFloat(cells[currentPriceIndex]) : 
            0;
          
          const currentValue = currentValueIndex >= 0 ? 
            parseFloat(cells[currentValueIndex]) : 
            (currentPrice * shares);
          
          const gain = gainIndex >= 0 ? 
            parseFloat(cells[gainIndex]) : 
            (currentValue - costBasis);
          
          const gainPercent = gainPercentIndex >= 0 ? 
            parseFloat(cells[gainPercentIndex]) : 
            (costBasis > 0 ? (gain / costBasis) * 100 : 0);
          
          const dividendYield = dividendYieldIndex >= 0 ? 
            parseFloat(cells[dividendYieldIndex]) : 
            0;
          
          const dividendAmount = dividendAmountIndex >= 0 ? 
            parseFloat(cells[dividendAmountIndex]) : 
            (dividendYield > 0 && currentValue > 0 ? (dividendYield * currentValue / 100) : 0);
          
          const sector = sectorIndex >= 0 ? cells[sectorIndex].trim() : '';
          const assetClass = assetClassIndex >= 0 ? 
            mapAssetClass(cells[assetClassIndex].trim()) : 
            'Stocks';
          
          // Calculate annual income from dividend yield
          const annualIncome = dividendYield > 0 && currentValue > 0 ? 
            (dividendYield * currentValue / 100) : 
            dividendAmount;
          
          // Create holding object
          const holding: Holding = {
            id: `holding-${symbol}-${i}`,
            symbol,
            name,
            shares,
            costPerShare,
            costBasis,
            totalCost: costBasis || (costPerShare * shares), // Calculate totalCost from available data
            currentValue,
            currentPrice,
            gain,
            gainPercent,
            dividendYield,
            dividendAmount,
            dividendFrequency: 'quarterly', // Default assumption
            dividendGrowth: 0, // Would need historical data
            sector,
            assetClass,
            allocation: 0, // Calculate after processing all holdings
            irr: 0, // Would need transaction history
            shareInPortfolio: 0, // Calculate after processing all holdings
            annualIncome // Add the calculated annual income
          };
          
          holdings.push(holding);
        }
        
        // Calculate allocation percentages if any holdings were found
        if (holdings.length > 0) {
          const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
          
          if (totalValue > 0) {
            holdings.forEach(holding => {
              holding.allocation = (holding.currentValue / totalValue) * 100;
              holding.shareInPortfolio = (holding.currentValue / totalValue) * 100;
            });
          }
          
          // Sort by value (descending)
          holdings.sort((a, b) => b.currentValue - a.currentValue);
          
          resolve({
            success: true,
            fileType: 'holdings',
            holdings
          });
        } else {
          console.warn("No holdings found in the CSV. Creating a placeholder.");
          // Create a placeholder holding if none were found
          holdings.push({
            id: 'placeholder',
            symbol: 'PLACEHOLDER',
            name: 'CSV could not be properly parsed',
            shares: 1,
            costPerShare: 100,
            costBasis: 100,
            totalCost: 100, // Add the missing totalCost property
            currentValue: 100,
            currentPrice: 100,
            gain: 0,
            gainPercent: 0,
            dividendYield: 0,
            dividendAmount: 0,
            dividendFrequency: 'quarterly',
            dividendGrowth: 0,
            sector: 'Other',
            assetClass: 'Other',
            allocation: 100,
            irr: 0,
            shareInPortfolio: 100,
            annualIncome: 0 // Add annual income to the placeholder
          });
          
          resolve({
            success: true,
            fileType: 'holdings',
            holdings,
            error: "No valid holdings found in CSV. Created a placeholder."
          });
        }
      } else {
        // Is a transactions file - this is just a placeholder for transaction parsing
        resolve({
          success: true,
          fileType: 'transactions',
          transactions: []
        });
      }
    } catch (error) {
      console.error("Error parsing CSV:", error);
      reject({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error parsing CSV" 
      });
    }
  });
};

// Function to detect if CSV contains holdings data
function detectHoldingsCSV(headers: string[]): boolean {
  const holdingsKeywords = ['symbol', 'ticker', 'shares', 'quantity', 'price', 'value', 'cost'];
  return containsKeywords(headers, holdingsKeywords);
}

// Function to detect if CSV contains transaction data
function detectTransactionsCSV(headers: string[]): boolean {
  const transactionKeywords = ['date', 'transaction', 'type', 'action', 'buy', 'sell'];
  return containsKeywords(headers, transactionKeywords);
}

// Check if headers contain any of the keywords
function containsKeywords(headers: string[], keywords: string[]): boolean {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  return lowerHeaders.some(header => 
    keywords.some(keyword => header.includes(keyword))
  );
}

// Find index of column that matches any of the possible names
function findHeaderIndex(headers: string[], possibleNames: string[]): number {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  return lowerHeaders.findIndex(header => 
    possibleNames.some(name => header.includes(name))
  );
}

// Parse a CSV line respecting quoted values
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of cell
      result.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  result.push(currentValue);
  
  return result;
}

// Map asset class to standardized categories
function mapAssetClass(assetClass: string): string {
  const lowercase = assetClass.toLowerCase();
  
  if (lowercase.includes('stock') || lowercase.includes('equity')) {
    return 'Stocks';
  } else if (lowercase.includes('bond')) {
    return 'Bonds';
  } else if (lowercase.includes('etf') || lowercase.includes('fund')) {
    return 'ETFs';
  } else if (lowercase.includes('reit') || lowercase.includes('real estate')) {
    return 'Real Estate';
  } else if (lowercase.includes('cash') || lowercase.includes('money market')) {
    return 'Cash';
  } else if (lowercase.includes('crypto')) {
    return 'Crypto';
  } else if (lowercase.includes('commodity') || lowercase.includes('gold')) {
    return 'Commodities';
  } else {
    return 'Other';
  }
}

export default parseCSV;