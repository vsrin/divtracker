import {
    Holding,
    DividendPayment,
    Transaction
  } from '../types';
  import { detectAndParseCSV } from './csvDetector';
  
  /**
   * Interface for database storage options
   */
  interface StorageOptions {
    useLocalStorage: boolean;
    useMongoDb: boolean; // This will be ignored for now
    mongoConnectionString?: string; // This will be ignored for now
  }
  
  /**
   * Import result interface
   */
  interface ImportResult {
    success: boolean;
    fileType: 'positions' | 'transactions';
    summary: {
      totalTransactions: number;
      totalDividends: number;
      totalHoldings: number;
      dateRange: {
        start: string;
        end: string;
      };
    };
    error?: string;
  }
  
  /**
   * Function to merge new portfolio data with existing data
   * Extracted from csvDetector.ts to resolve the missing reference
   */
  function mergePortfolioData(
    existingData: {
      holdings: Holding[];
      dividends: DividendPayment[];
      transactions: Transaction[];
    },
    newData: {
      holdings: Holding[];
      dividends: DividendPayment[];
      transactions: Transaction[];
      fileType: 'positions' | 'transactions';
    }
  ): {
    holdings: Holding[];
    dividends: DividendPayment[];
    transactions: Transaction[];
  } {
    const { fileType } = newData;
    
    // Handle positions file: replace holdings, keep transactions
    if (fileType === 'positions') {
      return {
        holdings: newData.holdings,
        dividends: [...existingData.dividends, ...newData.dividends],
        transactions: existingData.transactions
      };
    }
    
    // Handle transactions file: keep holdings, add new transactions and dividends
    if (fileType === 'transactions') {
      // Get unique transactions by ID (if available) or by constructing a composite key
      const allTransactions = [...existingData.transactions, ...newData.transactions];
      const uniqueTransactions = removeDuplicateTransactions(allTransactions);
      
      // Get unique dividends
      const allDividends = [...existingData.dividends, ...newData.dividends];
      const uniqueDividends = removeDuplicateDividends(allDividends);
      
      return {
        holdings: existingData.holdings,
        dividends: uniqueDividends,
        transactions: uniqueTransactions
      };
    }
    
    // Default fallback - just return the existing data
    return existingData;
  }
  
  /**
   * Helper function to remove duplicate transactions
   */
  function removeDuplicateTransactions(transactions: Transaction[]): Transaction[] {
    const seen = new Set<string>();
    return transactions.filter(transaction => {
      // Create a unique key from transaction properties
      const key = `${transaction.date}-${transaction.symbol}-${transaction.type}-${transaction.price}-${transaction.shares}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Helper function to remove duplicate dividends
   */
  function removeDuplicateDividends(dividends: DividendPayment[]): DividendPayment[] {
    const seen = new Set<string>();
    return dividends.filter(dividend => {
      // Create a unique key from dividend properties
      const key = `${dividend.date}-${dividend.symbol}-${dividend.amount}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Class that handles importing historical data (Modified to use only localStorage)
   */
  export class HistoricalDataImporter {
    private storageOptions: StorageOptions;
    
    constructor(options: StorageOptions = { useLocalStorage: true, useMongoDb: false }) {
      // Always use localStorage, ignore MongoDB setting for now
      this.storageOptions = { ...options, useMongoDb: false };
    }
    
    /**
     * Imports historical data from a CSV file
     * Can handle both positions and transactions
     * Supports date filtering for historical data
     */
    async importHistoricalData(
      file: File, 
      dateRange?: { start?: string; end?: string }
    ): Promise<ImportResult> {
      try {
        console.log(`Importing historical data from ${file.name}`);
        
        // Parse the CSV file
        const parseResult = await detectAndParseCSV(file);
        const { success, error } = parseResult;
        
        if (!success || error) {
          throw new Error(error || "Failed to parse CSV file");
        }
        
        // Initialize with empty arrays to prevent undefined errors
        const holdings = parseResult.holdings || [];
        const dividends = parseResult.dividends || [];
        const transactions = parseResult.transactions || [];
        const fileType = parseResult.fileType;
        
        // Ensure fileType is valid
        const validFileType: 'positions' | 'transactions' = 
          fileType === 'positions' || fileType === 'transactions' 
            ? fileType 
            : 'positions'; // Default to positions if undefined or invalid
        
        console.log(`Parsed data: ${transactions.length} transactions, ${dividends.length} dividends, ${holdings.length} holdings`);
        
        // Apply date filters if provided
        const filteredData = this.filterByDateRange(
          { holdings, dividends, transactions },
          dateRange
        );
        
        console.log(`After date filtering: ${filteredData.transactions.length} transactions, ${filteredData.dividends.length} dividends`);
        
        // Load existing data
        const existingData = await this.loadExistingData();
        
        // Merge with existing data
        const mergedData = mergePortfolioData(
          existingData,
          { ...filteredData, fileType: validFileType }
        );
        
        // Prepare result summary
        const dateRangeResult = this.calculateDateRange(filteredData.transactions);
        
        const summary = {
          totalTransactions: filteredData.transactions.length,
          totalDividends: filteredData.dividends.length,
          totalHoldings: filteredData.holdings.length,
          dateRange: dateRangeResult
        };
        
        // Save the merged data
        await this.saveData(mergedData);
        
        console.log("Import completed successfully", summary);
        
        return {
          success: true,
          fileType: validFileType,
          summary
        };
      } catch (error) {
        console.error("Import failed:", error);
        return {
          success: false,
          fileType: 'transactions', // Default
          summary: {
            totalTransactions: 0,
            totalDividends: 0,
            totalHoldings: 0,
            dateRange: {
              start: '',
              end: ''
            }
          },
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    /**
     * Filter data by date range
     */
    private filterByDateRange(
      data: {
        holdings: Holding[];
        dividends: DividendPayment[];
        transactions: Transaction[];
      },
      dateRange?: { start?: string; end?: string }
    ): {
      holdings: Holding[];
      dividends: DividendPayment[];
      transactions: Transaction[];
    } {
      // If no date range is provided, return all data
      if (!dateRange || (!dateRange.start && !dateRange.end)) {
        return data;
      }
      
      const { start, end } = dateRange;
      const startDate = start ? new Date(start) : new Date(0);
      const endDate = end ? new Date(end) : new Date();
      
      console.log(`Filtering data by date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Filter transactions by date
      const filteredTransactions = data.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      
      // Filter dividends by date
      const filteredDividends = data.dividends.filter(dividend => {
        const dividendDate = new Date(dividend.date);
        return dividendDate >= startDate && dividendDate <= endDate;
      });
      
      // Holdings are not filtered by date since they represent current state
      
      return {
        holdings: data.holdings,
        dividends: filteredDividends,
        transactions: filteredTransactions
      };
    }
    
    /**
     * Calculate the date range of the imported transactions
     */
    private calculateDateRange(transactions: Transaction[]): { start: string; end: string } {
      if (transactions.length === 0) {
        return {
          start: '',
          end: ''
        };
      }
      
      // Find earliest and latest dates
      let earliestDate = new Date(transactions[0].date);
      let latestDate = new Date(transactions[0].date);
      
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate < earliestDate) {
          earliestDate = transactionDate;
        }
        if (transactionDate > latestDate) {
          latestDate = transactionDate;
        }
      });
      
      return {
        start: earliestDate.toISOString().split('T')[0],
        end: latestDate.toISOString().split('T')[0]
      };
    }
    
    /**
     * Load existing data from localStorage only
     */
    private async loadExistingData(): Promise<{
      holdings: Holding[];
      dividends: DividendPayment[];
      transactions: Transaction[];
    }> {
      // Initialize with empty data
      const emptyData = {
        holdings: [],
        dividends: [],
        transactions: []
      };
      
      try {
        // Always use localStorage
        const holdingsStr = localStorage.getItem('portfolio-holdings');
        const dividendsStr = localStorage.getItem('portfolio-dividends');
        const transactionsStr = localStorage.getItem('portfolio-transactions');
        
        return {
          holdings: holdingsStr ? JSON.parse(holdingsStr) : [],
          dividends: dividendsStr ? JSON.parse(dividendsStr) : [],
          transactions: transactionsStr ? JSON.parse(transactionsStr) : []
        };
      } catch (error) {
        console.error("Error loading existing data:", error);
        return emptyData;
      }
    }
    
    /**
     * Save data to localStorage only
     */
    private async saveData(data: {
      holdings: Holding[];
      dividends: DividendPayment[];
      transactions: Transaction[];
    }): Promise<void> {
      try {
        // Always use localStorage
        localStorage.setItem('portfolio-holdings', JSON.stringify(data.holdings));
        localStorage.setItem('portfolio-dividends', JSON.stringify(data.dividends));
        localStorage.setItem('portfolio-transactions', JSON.stringify(data.transactions));
        console.log("Data saved to localStorage");
      } catch (error) {
        console.error("Error saving data:", error);
        throw error;
      }
    }
  }