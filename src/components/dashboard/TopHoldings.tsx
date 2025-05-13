import React from 'react';
import Card from '../ui/Card';
import usePortfolio from '../../hooks/usePortfolio';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

// Update TopHoldings to use the usePortfolio hook instead of props
const TopHoldings: React.FC = () => {
  const { holdings } = usePortfolio();
  
  // Sort holdings by value (descending)
  const sortedByValue = [...holdings]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5);
  
  // Sort holdings by yield (descending)
  const sortedByYield = [...holdings]
    .filter(h => h.dividendYield > 0)
    .sort((a, b) => b.dividendYield - a.dividendYield)
    .slice(0, 5);
  
  // Sort holdings by income (descending)
  const sortedByIncome = [...holdings]
    .sort((a, b) => b.annualIncome - a.annualIncome)
    .slice(0, 5);
  
  return (
    <Card>
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Top Holdings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">By value, yield, and income</p>
        </div>
        
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top by Value</h3>
            <ul className="space-y-2">
              {sortedByValue.map(holding => (
                <li key={`value-${holding.id}`} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium">{holding.symbol}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                      {holding.name}
                    </span>
                  </div>
                  <span>{formatCurrency(holding.currentValue)}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top by Yield</h3>
            <ul className="space-y-2">
              {sortedByYield.map(holding => (
                <li key={`yield-${holding.id}`} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium">{holding.symbol}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                      {holding.name}
                    </span>
                  </div>
                  <span className="text-green-600 dark:text-green-400">
                    {formatPercentage(holding.dividendYield)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top by Income</h3>
            <ul className="space-y-2">
              {sortedByIncome.map(holding => (
                <li key={`income-${holding.id}`} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium">{holding.symbol}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                      {holding.name}
                    </span>
                  </div>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(holding.annualIncome)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TopHoldings;