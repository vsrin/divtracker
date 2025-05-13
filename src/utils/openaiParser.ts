// src/utils/openaiParser.ts
// Fixed version with totalCost property and resolved costPerShare error

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { v4 as uuidv4 } from 'uuid';
import { Holding } from '../types';

interface ParsedHolding {
  symbol: string;
  name?: string;
  shares: number;
  costPerShare?: number;
  costBasis?: number;
  currentValue?: number;
  currentPrice?: number;
  price?: number;
  gain?: number;
  gainPercent?: number;
  dividendYield?: number;
  dividendAmount?: number;
  assetClass?: string;
  [key: string]: any;
}

interface ParsedTransaction {
  date: string;
  type: string;
  symbol: string;
  shares: number;
  price: number;
  amount: number;
  fees?: number;
  tax?: number;
  description?: string;
  [key: string]: any;
}

interface ParsedData {
  holdings?: ParsedHolding[];
  transactions?: ParsedTransaction[];
  fileType?: string;
  [key: string]: any;
}

export const parseCSVWithOpenAI = async (
  csvContent: string,
  apiKey?: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // In a real implementation, you would send this to OpenAI
    // For now, we'll just simulate a response
    
    // Mock parsed data response
    const mockData: ParsedData = {
      fileType: 'holdings',
      holdings: [
        {
          symbol: "VTI",
          name: "Vanguard Total Stock Market ETF",
          shares: 50,
          costPerShare: 200,
          costBasis: 10000,
          currentPrice: 220,
          currentValue: 11000,
          gain: 1000,
          gainPercent: 10,
          dividendYield: 1.5,
          dividendAmount: 165,
          assetClass: "ETFs"
        },
        {
          symbol: "SCHD",
          name: "Schwab US Dividend Equity ETF",
          shares: 100,
          costPerShare: 75,
          costBasis: 7500,
          currentPrice: 80,
          currentValue: 8000,
          gain: 500,
          gainPercent: 6.67,
          dividendYield: 3.2,
          dividendAmount: 256,
          assetClass: "ETFs"
        }
      ]
    };
    
    return processStructuredData(mockData);
  } catch (error) {
    console.error("Error in OpenAI CSV parser:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error in OpenAI parser" 
    };
  }
};

const processStructuredData = (parsedData: ParsedData): Promise<{ success: boolean; data?: any; error?: string }> => {
  return new Promise((resolve, reject) => {
    try {
      if (!parsedData) {
        reject({ success: false, error: "No structured data received from AI" });
        return;
      }

      if (parsedData.fileType === 'holdings' && parsedData.holdings) {
        // Process holdings
        const holdings: Holding[] = [];
        
        parsedData.holdings.forEach((h: ParsedHolding, index: number) => {
          // Calculate derived values if not present
          const costBasis = h.costBasis || (h.costPerShare ? h.costPerShare * h.shares : 0);
          const costPerShareValue = h.costPerShare || (h.shares > 0 ? costBasis / h.shares : 0);
          const currentPrice = h.currentPrice || h.price || 0;
          const currentValue = h.currentValue || (currentPrice * h.shares);
          const gain = h.gain || (currentValue - costBasis);
          const gainPercent = h.gainPercent || (costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0);
          const dividendYield = h.dividendYield || 0;
          const assetClass = mapAssetClass(h.assetClass || '');
          
          // Calculate annual income from dividend yield
          const annualIncome = dividendYield && currentValue ? (dividendYield * currentValue / 100) : 0;
          
          const holding: Holding = {
            id: `holding-${h.symbol}-${index}`,
            symbol: h.symbol,
            name: h.name || h.symbol,
            shares: h.shares || 0,
            costPerShare: costPerShareValue,
            costBasis,
            totalCost: costBasis, // Set totalCost equal to costBasis
            currentValue,
            currentPrice: h.price || (h.shares && h.shares > 0 ? currentValue / h.shares : 0),
            gain,
            gainPercent,
            dividendYield: h.dividendYield || 0,
            dividendAmount: h.dividendAmount || 0,
            dividendFrequency: 'quarterly', // Default
            dividendGrowth: 0, // Default
            sector: 'Other', // Default
            assetClass,
            allocation: 0, // Will calculate later
            irr: 0, // Default
            shareInPortfolio: 0, // Will calculate later
            annualIncome
          };
          
          holdings.push(holding);
        });

        // Calculate allocation percentages
        if (holdings.length > 0) {
          const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
          holdings.forEach(h => {
            h.allocation = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
            h.shareInPortfolio = h.allocation;
          });
        }

        resolve({
          success: true,
          data: {
            holdings,
            fileType: 'holdings'
          }
        });
      } else if (parsedData.fileType === 'transactions' && parsedData.transactions) {
        // Process transactions
        const transactions = parsedData.transactions.map((t: ParsedTransaction, index: number) => ({
          id: `transaction-${index}`,
          date: t.date,
          type: t.type.toUpperCase(),
          symbol: t.symbol,
          companyName: t.description || t.symbol,
          shares: t.shares,
          price: t.price,
          amount: t.amount,
          fees: t.fees || 0,
          tax: t.tax || 0,
          currency: 'USD', // Default
          notes: t.description || ''
        }));

        resolve({
          success: true,
          data: {
            transactions,
            fileType: 'transactions'
          }
        });
      } else {
        reject({ 
          success: false, 
          error: `Unsupported file type or missing data: ${parsedData.fileType}` 
        });
      }
    } catch (error) {
      console.error("Error processing structured data:", error);
      reject({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error processing data" 
      });
    }
  });
};

// Map asset class to standardized categories
const mapAssetClass = (assetClass: string): string => {
  const lowercase = assetClass.toLowerCase();
  
  if (lowercase.includes('stock') || lowercase.includes('equity')) {
    return 'Stocks';
  } else if (lowercase.includes('bond') || lowercase.includes('fixed income')) {
    return 'Bonds';
  } else if (lowercase.includes('etf') || lowercase.includes('fund')) {
    return 'ETFs';
  } else if (lowercase.includes('reit') || lowercase.includes('real estate')) {
    return 'Real Estate';
  } else if (lowercase.includes('cash') || lowercase.includes('money market')) {
    return 'Cash';
  } else if (lowercase.includes('crypto') || lowercase.includes('bitcoin')) {
    return 'Crypto';
  } else if (lowercase.includes('commodity') || lowercase.includes('gold')) {
    return 'Commodities';
  } else {
    return 'Other';
  }
};

export default parseCSVWithOpenAI;