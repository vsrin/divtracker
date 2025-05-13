// src/components/ui/HoldingsRecalculator.tsx
import React, { useState } from 'react';
import usePortfolio from '../../hooks/usePortfolio';
import Card from './Card';

const HoldingsRecalculator: React.FC = () => {
  const { 
    holdings, 
    transactions, 
    dividends, 
    recalculateAllHoldings 
  } = usePortfolio();
  
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const handleRecalculate = () => {
    setIsRecalculating(true);
    setResult(null);
    
    try {
      // Force recalculation of holdings
      const success = recalculateAllHoldings();
      
      if (success) {
        setResult('Holdings recalculated successfully!');
      } else {
        setResult('No transactions found to recalculate holdings.');
      }
    } catch (error) {
      setResult(`Error recalculating holdings: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRecalculating(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-lg font-medium mb-4">Holdings Recalculator</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">Transactions</div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white">
              {transactions.length}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">Dividends</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {dividends.length}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-500 dark:text-gray-400">Holdings</div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {holdings.length}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            If your holdings are not showing up correctly after importing transactions or dividends,
            you can force a recalculation of your holdings based on your transaction history.
          </p>
          
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating || transactions.length === 0}
            className={`w-full py-2 px-4 rounded font-medium ${
              isRecalculating || transactions.length === 0
                ? 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
            }`}
          >
            {isRecalculating ? 'Recalculating...' : 'Recalculate Holdings'}
          </button>
          
          {result && (
            <div className={`text-sm p-2 rounded ${
              result.includes('Error')
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            }`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default HoldingsRecalculator;