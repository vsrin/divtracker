// src/components/dashboard/TopHoldings.tsx
import React from 'react';
import Card from '../ui/Card';
import usePortfolio from '../../hooks/usePortfolio';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { TimeFilterProps } from '../../types/dashboard';

const TopHoldings: React.FC<TimeFilterProps> = ({
  filteredHoldings
}) => {
  const { holdings } = usePortfolio();
  
  // Use filtered holdings if available
  const displayHoldings = filteredHoldings || holdings;
  
  // Sort holdings by value (descending)
  const sortedByValue = [...displayHoldings]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5);
  
  // Sort holdings by yield (descending)
  const sortedByYield = [...displayHoldings]
    .filter(h => h.dividendYield > 0)
    .sort((a, b) => b.dividendYield - a.dividendYield)
    .slice(0, 5);
  
  // Sort holdings by income (descending)
  const sortedByIncome = [...displayHoldings]
    .sort((a, b) => b.annualIncome - a.annualIncome)
    .slice(0, 5);
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-white mb-1">Top Holdings</h2>
        <p className="text-sm text-white">By value, yield, and income</p>
      </div>
      
      <div className="space-y-5 flex-1">
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Top by Value</h3>
          <ul className="space-y-3">
            {sortedByValue.map(holding => (
              <li key={`value-${holding.id}`} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-medium text-white">{holding.symbol}</span>
                  <span className="ml-2 text-sm text-gray-300 truncate max-w-[150px]">
                    {holding.name}
                  </span>
                </div>
                <span className="text-white">{formatCurrency(holding.currentValue)}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Top by Yield</h3>
          <ul className="space-y-3">
            {sortedByYield.map(holding => (
              <li key={`yield-${holding.id}`} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-medium text-white">{holding.symbol}</span>
                  <span className="ml-2 text-sm text-gray-300 truncate max-w-[150px]">
                    {holding.name}
                  </span>
                </div>
                <span className="text-green-400">
                  {formatPercentage(holding.dividendYield)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Top by Income</h3>
          <ul className="space-y-3">
            {sortedByIncome.map(holding => (
              <li key={`income-${holding.id}`} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-medium text-white">{holding.symbol}</span>
                  <span className="ml-2 text-sm text-gray-300 truncate max-w-[150px]">
                    {holding.name}
                  </span>
                </div>
                <span className="text-blue-400">
                  {formatCurrency(holding.annualIncome)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TopHoldings;