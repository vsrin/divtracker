// src/components/forms/ImportForm.tsx
import React, { useState, ChangeEvent, useRef } from 'react';
import usePortfolio from '../../hooks/usePortfolio';
import { v4 as uuidv4 } from 'uuid';
import { parseHistoryToTransactions } from '../../utils/transactionImporter';
import HoldingsRecalculator from '../ui/HoldingsRecalculator';
import DebugDataViewer from '../ui/DebugDataViewer';
import { Holding } from '../../types';

const ImportForm: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{name: string; size: number} | null>(null);
  const [importType, setImportType] = useState<'auto' | 'holdings' | 'transactions'>('auto');
  
  const { addHoldings, addTransactions, addDividends, recalculateAllHoldings } = usePortfolio();
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFileInfo(null);
      return;
    }
    
    const file = files[0];
    setFileInfo({
      name: file.name,
      size: file.size
    });
    
    // Clear previous messages
    setError(null);
    setSuccess(null);
  };
  
  const handleImportTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setImportType(e.target.value as 'auto' | 'holdings' | 'transactions');
  };
  
  const handleImport = async () => {
    if (!fileInputRef.current?.files?.length) {
      setError('Please select a file to import');
      return;
    }
    
    const file = fileInputRef.current.files[0];
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Parse CSV file
      const results = await new Promise<any>((resolve, reject) => {
        // Use dynamic import for papaparse
        import('papaparse').then(Papa => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: resolve,
            error: reject
          });
        }).catch(reject);
      });
      
      // Check if we have any data
      if (!results.data || results.data.length === 0) {
        throw new Error('No data found in the file');
      }
      
      console.log('Parsed CSV data:', results.data);
      
      // Determine the type of import if set to auto
      let actualImportType = importType;
      if (importType === 'auto') {
        // Try to detect type based on headers
        const headers = results.meta.fields || [];
        if (headers.includes('Symbol') && (headers.includes('Shares') || headers.includes('Quantity'))) {
          actualImportType = 'holdings';
        } else if (headers.includes('Action') || headers.includes('Type') || headers.includes('Transaction Type')) {
          actualImportType = 'transactions';
        } else {
          throw new Error('Could not automatically determine the type of data. Please select a specific import type.');
        }
      }
      
      // Process based on import type
      if (actualImportType === 'holdings') {
        // Map CSV data to holdings format
        const mappedHoldings: Holding[] = results.data.map((row: any) => ({
          id: uuidv4(),
          symbol: row.Symbol || row.Ticker || '',
          name: row.Name || row['Company Name'] || row.Description || row.Symbol || '',
          shares: parseFloat(row.Shares || row.Quantity || '0') || 0,
          costBasis: parseFloat(row['Cost Basis'] || row['Average Cost'] || '0') || 0,
          totalCost: parseFloat(row['Total Cost'] || '0') || 0,
          currentPrice: parseFloat(row.Price || row['Current Price'] || '0') || 0,
          currentValue: parseFloat(row.Value || row['Current Value'] || '0') || 0,
          gain: parseFloat(row.Gain || '0') || 0,
          gainPercent: parseFloat(row['Gain %'] || '0') || 0,
          dividendYield: parseFloat(row.Yield || row['Dividend Yield'] || '0') || 0,
          annualIncome: parseFloat(row.Income || row['Annual Income'] || '0') || 0,
          lastUpdated: new Date().toISOString(),
          // Additional properties required by parser files
          costPerShare: parseFloat(row['Cost Per Share'] || row['Cost Basis'] || '0') || 0,
          dividendAmount: parseFloat(row['Dividend Amount'] || '0') || 0,
          dividendFrequency: row['Dividend Frequency'] || 'quarterly',
          dividendGrowth: parseFloat(row['Dividend Growth'] || '0') || 0,
          sector: row.Sector || 'Other',
          irr: parseFloat(row.IRR || '0') || 0 // Add the IRR field
        }));
        
        // Filter out any rows with missing symbol or shares
        const validHoldings = mappedHoldings.filter((h: Holding) => h.symbol && h.shares > 0);
        
        if (validHoldings.length === 0) {
          throw new Error('No valid holdings found in the file');
        }
        
        // Add holdings
        addHoldings(validHoldings);
        setSuccess(`Successfully imported ${validHoldings.length} holdings`);
      } else {
        // Process transaction history
        const { transactions, dividends } = parseHistoryToTransactions(results.data);
        
        if (transactions.length === 0) {
          throw new Error('No valid transactions found in the file');
        }
        
        // Add transactions and dividends
        addTransactions(transactions);
        
        if (dividends.length > 0) {
          addDividends(dividends);
        }
        
        // Recalculate holdings
        recalculateAllHoldings();
        
        setSuccess(`Successfully imported ${transactions.length} transactions and ${dividends.length} dividends`);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFileInfo(null);
      
    } catch (err) {
      console.error('Import error:', err);
      setError(`Error importing file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Import Portfolio Data
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Import Type
            </label>
            <select
              value={importType}
              onChange={handleImportTypeChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="auto">Auto-detect</option>
              <option value="holdings">Holdings (positions)</option>
              <option value="transactions">Transaction History</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CSV File
            </label>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="flex-1 cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 text-center"
              >
                {fileInfo ? fileInfo.name : 'Select CSV file'}
              </label>
              {fileInfo && (
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    setFileInfo(null);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            {fileInfo && (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {(fileInfo.size / 1024).toFixed(2)} KB
              </div>
            )}
          </div>
          
          {importType === 'holdings' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Holdings Import:</strong> Import your current positions data. 
                The CSV should include columns for symbol, shares, cost basis, etc.
              </p>
            </div>
          )}
          
          {importType === 'transactions' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Transaction Import:</strong> Import your transaction history. 
                The CSV should include columns for date, action (buy/sell), symbol, shares, price, etc.
                This will automatically recalculate your current holdings.
              </p>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}
          
          <button
            onClick={handleImport}
            disabled={isLoading || !fileInfo}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              isLoading || !fileInfo
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        <HoldingsRecalculator />
        
        {/* Uncomment this for debugging */}
        <DebugDataViewer />
      </div>
    </div>
  );
};

export default ImportForm;