// src/components/forms/TransactionImport.tsx
import React, { useState } from 'react';
import { usePortfolioContext } from '../../context/PortfolioContext';
import { HistoricalDataImporter } from '../../utils/historicalDataImporter';
import { Transaction } from '../../types/portfolio';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

interface ImportResultProps {
  success: boolean;
  message: string;
  details?: string;
}

const TransactionImport: React.FC = () => {
  // Get context
  const {
    transactions,
    isLoading
  } = usePortfolioContext();

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultProps | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<{ headers: string[], rows: string[][] } | null>(null);

  // Reset the form
  const resetForm = () => {
    setFile(null);
    setFileName('');
    setPreview(null);
    setImportResult(null);
    
    // Clear the file input
    const fileInput = document.getElementById('transaction-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null);
    
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      try {
        // Generate preview
        const previewData = await generatePreview(selectedFile);
        setPreview(previewData);
      } catch (error) {
        setImportResult({
          success: false,
          message: 'Failed to preview file',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      resetForm();
    }
  };

  // Generate a preview of the CSV file
  const generatePreview = (file: File): Promise<{ headers: string[], rows: string[][] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (!e.target || typeof e.target.result !== 'string') {
            throw new Error('Failed to read file');
          }
          
          const csvData = e.target.result;
          const lines = csvData.split('\n');
          
          if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row');
          }
          
          // Parse headers
          const headers = lines[0].split(',').map(header => header.trim());
          
          // Parse a few rows for preview
          const previewRows: string[][] = [];
          for (let i = 1; i < Math.min(lines.length, 6); i++) {
            if (lines[i].trim()) {
              const row = lines[i].split(',').map(cell => cell.trim());
              previewRows.push(row);
            }
          }
          
          resolve({
            headers,
            rows: previewRows
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.readAsText(file);
    });
  };

  // Handle import
  const handleImport = async () => {
    if (!file) return;
    
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const importer = new HistoricalDataImporter();
      const result = await importer.importHistoricalData(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }
      
      // Set success result
      setImportResult({
        success: true,
        message: 'Transactions imported successfully',
        details: `Imported ${result.summary.totalTransactions} transactions`
      });
      
      // Reset the file input but keep the result message
      setFile(null);
      const fileInput = document.getElementById('transaction-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card title="Transaction History Import">
      <div className="space-y-6">
        {/* File Selection Section */}
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Import your transaction history from your brokerage's CSV export. This will add to your existing transactions.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="space-y-4">
              <div>
                <label htmlFor="transaction-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transaction CSV File
                </label>
                <input
                  id="transaction-file"
                  name="transaction-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-blue-900/20 dark:file:text-blue-300"
                />
              </div>
              
              {fileName && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected file: <span className="font-medium">{fileName}</span>
                </div>
              )}
              
              {/* Import Button */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={!file || isImporting}
                  isLoading={isImporting}
                  className="mt-2"
                >
                  Import Transactions
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={resetForm}
                  disabled={!file || isImporting}
                  className="mt-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Import Result */}
        {importResult && (
          <Alert 
            type={importResult.success ? 'success' : 'error'} 
            title={importResult.message}
          >
            {importResult.details}
          </Alert>
        )}
        
        {/* Preview Section */}
        {preview && (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">File Preview</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {preview.headers.map((header, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {preview.rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Transaction Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Transaction Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Transactions:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{isLoading ? '...' : transactions.length}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Date Range:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {isLoading ? '...' : (
                  transactions.length > 0 
                    ? `${new Date(Math.min(...transactions.map((t: Transaction) => new Date(t.date).getTime()))).toLocaleDateString()} - 
                       ${new Date(Math.max(...transactions.map((t: Transaction) => new Date(t.date).getTime()))).toLocaleDateString()}`
                    : 'No transactions'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TransactionImport;