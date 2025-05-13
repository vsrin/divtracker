// src/components/ui/DebugDataViewer.tsx
import React from 'react';
import { usePortfolioContext } from '../../context/PortfolioContext';
import usePortfolio from '../../hooks/usePortfolio';
import Card from './Card';

const DebugDataViewer: React.FC = () => {
  // Get data from both sources to debug
  const contextData = usePortfolioContext();
  const hookData = usePortfolio();
  
  // Check localStorage
  const getLocalStorageData = () => {
    try {
      return {
        'holdings': localStorage.getItem('holdings') ? 
          JSON.parse(localStorage.getItem('holdings') || '[]').length : 0,
        'transactions': localStorage.getItem('transactions') ? 
          JSON.parse(localStorage.getItem('transactions') || '[]').length : 0,
        'portfolio-holdings': localStorage.getItem('portfolio-holdings') ? 
          JSON.parse(localStorage.getItem('portfolio-holdings') || '[]').length : 0,
        'portfolio-dividends': localStorage.getItem('portfolio-dividends') ? 
          JSON.parse(localStorage.getItem('portfolio-dividends') || '[]').length : 0,
        'portfolio-transactions': localStorage.getItem('portfolio-transactions') ? 
          JSON.parse(localStorage.getItem('portfolio-transactions') || '[]').length : 0
      };
    } catch (error) {
      console.error('Error parsing localStorage', error);
      return {
        'holdings': 'Error',
        'transactions': 'Error',
        'portfolio-holdings': 'Error',
        'portfolio-dividends': 'Error',
        'portfolio-transactions': 'Error'
      };
    }
  };
  
  const localStorageData = getLocalStorageData();
  
  return (
    <Card>
      <h2 className="text-lg font-medium mb-4">Portfolio Data Debug</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Context Data:</h3>
          <div className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
            <p>Holdings: {contextData.holdings.length} items</p>
            <p>Transactions: {contextData.transactions.length} items</p>
            <p>Loading: {contextData.isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {contextData.error || 'None'}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium">Hook Data:</h3>
          <div className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
            <p>Holdings: {hookData.holdings.length} items</p>
            <p>Transactions: {hookData.transactions.length} items</p>
            <p>Dividends: {hookData.dividends.length} items</p>
            <p>Loading: {hookData.isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {hookData.error || 'None'}</p>
            <p>Portfolio Value: {hookData.portfolioValue.toFixed(2)}</p>
            <p>Portfolio Income: {hookData.portfolioIncome.toFixed(2)}</p>
            <p>Portfolio Yield: {hookData.portfolioYield.toFixed(2)}%</p>
            <p>Monthly Income Projections: {hookData.monthlyIncome.length} months</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium">LocalStorage Keys:</h3>
          <div className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {Object.entries(localStorageData).map(([key, value]) => (
              <p key={key}>
                {key}: {value ? `${value} items` : 'Not found'}
              </p>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              // Clear all data and reload
              localStorage.clear();
              window.location.reload();
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear All Data
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    </Card>
  );
};

export default DebugDataViewer;