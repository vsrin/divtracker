import React, { useState, useRef, useEffect } from 'react';
import { detectAndParseCSV } from '../../utils/csvDetector';

// Updated ImportForm component with OpenAI integration
const ImportForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [aiProvider, setAIProvider] = useState<'claude' | 'openai'>('claude');
  const [apiKey, setApiKey] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load saved API key when component mounts or AI provider changes
  useEffect(() => {
    const savedKey = localStorage.getItem(`${aiProvider}-api-key`);
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKey('');
    }
  }, [aiProvider]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileInputRef.current?.files?.length) {
      setError('Please select a CSV file to import');
      return;
    }
    
    const file = fileInputRef.current.files[0];
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    // If AI is enabled but no API key provided
    if (useAI && !apiKey) {
      setError(`Please enter a valid ${aiProvider === 'claude' ? 'Claude' : 'OpenAI'} API key`);
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    setError('');
    
    try {
      // Save API key to localStorage if provided
      if (useAI && apiKey) {
        localStorage.setItem(`${aiProvider}-api-key`, apiKey);
      }
      
      // Parse the CSV file
      const result = await detectAndParseCSV(file, useAI, aiProvider, apiKey);
      const { holdings, dividends, transactions, fileType } = result;
      
      // Store data in localStorage
      if (fileType === 'positions') {
        localStorage.setItem('portfolio-holdings', JSON.stringify(holdings));
      }
      
      localStorage.setItem('portfolio-dividends', JSON.stringify([
        ...JSON.parse(localStorage.getItem('portfolio-dividends') || '[]'),
        ...dividends
      ]));
      
      localStorage.setItem('portfolio-transactions', JSON.stringify([
        ...JSON.parse(localStorage.getItem('portfolio-transactions') || '[]'),
        ...transactions
      ]));
      
      // Update success message
      setMessage(
        `Successfully imported data from ${file.name}\n` +
        `Found: ${holdings.length} holdings, ${dividends.length} dividends, ${transactions.length} transactions`
      );
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(`Error importing data: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Import Portfolio Data</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload your portfolio positions or transaction history CSV file
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="use-ai"
            checked={useAI}
            onChange={() => setUseAI(!useAI)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="use-ai" className="ml-2 block text-sm text-gray-700">
            Enable AI-Enhanced Parsing
          </label>
        </div>
        
        {useAI && (
          <div className="ml-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                AI Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAIProvider(e.target.value as 'claude' | 'openai')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI (GPT-4)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Choose which AI model to use for enhanced CSV parsing
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {aiProvider === 'claude' ? 'Claude' : 'OpenAI'} API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${aiProvider === 'claude' ? 'Claude' : 'OpenAI'} API key`}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                {aiProvider === 'claude' 
                  ? 'Claude API keys start with "sk-ant-api..."' 
                  : 'OpenAI API keys start with "sk-..."'}
              </p>
            </div>
          </div>
        )}
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </form>
      
      {message && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded">
          <p className="font-medium">Success!</p>
          <p className="whitespace-pre-line">{message}</p>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-medium">Import Instructions</h3>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li>For portfolio positions, upload your "Portfolio_Positions_*.csv" file</li>
          <li>For transaction history, upload your "History_for_Account_*.csv" file</li>
          <li>Enable AI-Enhanced Parsing for better handling of complex CSV formats</li>
          <li>Your API key is stored locally in your browser for convenience</li>
          <li>Monthly dividend view can be imported from either file type</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportForm;