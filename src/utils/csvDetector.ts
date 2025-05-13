// src/utils/csvDetector.ts
// Fixed missing import and file type issues

import { DividendPayment, Holding, Transaction } from '../types';

interface CSVDetectorResult {
  success: boolean;
  fileType?: string;
  holdings?: Holding[];
  transactions?: Transaction[];
  dividends?: DividendPayment[];
  error?: string;
}

// Add dummy implementation of missing functions
// This allows the code to compile while you implement the actual functions
const dummyParser = async (content: string, apiKey?: string) => ({
  success: false,
  error: "Parser not implemented",
  holdings: [],
  transactions: [],
  dividends: []
});

/**
 * Detect the type of CSV file and use the appropriate parser
 * 
 * @param file The CSV file to analyze
 * @param aiProvider Optional AI provider to use for enhanced parsing (claude or openai)
 * @param apiKey Optional API key for the AI provider
 * @returns Promise with the parsed results
 */
export const detectAndParseCSV = async (
  file: File,
  aiProvider?: string,
  apiKey?: string
): Promise<CSVDetectorResult> => {
  try {
    // First, read the file content
    const fileContent = await readFileAsText(file);
    
    if (!fileContent) {
      return { 
        success: false, 
        error: "Could not read file content" 
      };
    }
    
    let result: any;
    
    // Try to detect the file type by examining the headers
    const firstLine = fileContent.split('\n')[0];
    const headers = firstLine.split(',').map(h => h.trim().toLowerCase());
    
    // Check for transaction history format
    const isTransactionHistory = hasTransactionHeaders(headers);
    
    // Check for positions/holdings format
    const isHoldings = hasHoldingHeaders(headers);
    
    // Import the required modules dynamically to avoid circular dependencies
    const { parseCSV } = await import('./csvParser');
    const { parseTransactionHistory } = await import('./transactionParser');
    
    // Use dummy implementations until the actual functions are created
    const parseCSVWithClaude = dummyParser;
    const parseCSVWithOpenAI = dummyParser;
    
    // Determine parser to use
    if (aiProvider) {
      // Use AI-enhanced parsing if requested
      console.log(`Using AI-enhanced parsing with ${aiProvider}`);
      if (aiProvider === 'claude') {
        result = await parseCSVWithClaude(fileContent, apiKey);
      } else if (aiProvider === 'openai') {
        result = await parseCSVWithOpenAI(fileContent, apiKey);
      } else {
        throw new Error(`Unsupported AI provider: ${aiProvider}`);
      }
    } else {
      // Use standard parsing based on detected type
      console.log(`Using standard parsing, detected type: ${isTransactionHistory ? 'transactions' : isHoldings ? 'holdings' : 'unknown'}`);
      
      if (isTransactionHistory) {
        // Parse as transaction history
        const parsedData = await parseCSV(fileContent);
        if (parsedData.transactions) {
          result = await parseTransactionHistory(parsedData.transactions);
        } else {
          // If no transactions were parsed, try direct parsing
          result = await parseTransactionHistory(JSON.parse(fileContent));
        }
      } else {
        result = await parseCSV(fileContent);
      }
    }
    
    if (!result.success) {
      return result;
    }
    
    return {
      success: true,
      fileType: result.fileType || (isTransactionHistory ? 'transactions' : 'holdings'),
      holdings: result.holdings || [],
      transactions: result.transactions || [],
      dividends: result.dividends || []
    };
  } catch (error) {
    console.error("Error in CSV detector:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error detecting CSV format" 
    };
  }
};

/**
 * Read a file as text
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("File read resulted in undefined content"));
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
}

/**
 * Check if headers suggest a transaction history format
 */
function hasTransactionHeaders(headers: string[]): boolean {
  const transactionKeywords = [
    'date', 'transaction', 'action', 'type', 'buy', 'sell', 'symbol', 'price', 'amount', 'quantity'
  ];
  
  let keywordCount = 0;
  const requiredKeywords = ['date', 'symbol'];
  let hasRequired = false;
  
  // Check if the required keywords are present
  hasRequired = requiredKeywords.every(keyword => 
    headers.some(h => h.includes(keyword))
  );
  
  // Count how many transaction-related keywords are present
  keywordCount = transactionKeywords.filter(keyword => 
    headers.some(h => h.includes(keyword))
  ).length;
  
  // Require at least 4 keywords including the required ones
  return hasRequired && keywordCount >= 4;
}

/**
 * Check if headers suggest a holdings/positions format
 */
function hasHoldingHeaders(headers: string[]): boolean {
  const holdingsKeywords = [
    'symbol', 'ticker', 'share', 'position', 'value', 'price', 'cost'
  ];
  
  let keywordCount = 0;
  const requiredKeywords = ['symbol', 'share'];
  let hasRequired = false;
  
  // Check if the required keywords are present
  hasRequired = requiredKeywords.some(keyword => 
    headers.some(h => h.includes(keyword))
  );
  
  // Count how many holdings-related keywords are present
  keywordCount = holdingsKeywords.filter(keyword => 
    headers.some(h => h.includes(keyword))
  ).length;
  
  // Require at least 3 keywords including at least one of the required ones
  return hasRequired && keywordCount >= 3;
}

export default detectAndParseCSV;