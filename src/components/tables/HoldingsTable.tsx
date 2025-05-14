// src/components/tables/HoldingsTable.tsx
import React, { useState, useMemo } from 'react';
import usePortfolio from '../../hooks/usePortfolio';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { TimeFilterProps } from '../../types/dashboard';

interface SortableHeaderProps {
  field: string;
  currentSort: string;
  currentDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  field, 
  currentSort, 
  currentDirection, 
  onSort, 
  children,
  align = 'left'
}) => {
  return (
    <th
      scope="col"
      className={`px-6 py-3 text-${align} text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : ''}`}>
        <span className="text-gray-500 dark:text-white">{children}</span>
        {currentSort === field && (
          <span className="ml-1 text-blue-500 dark:text-blue-400">
            {currentDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
};

const HoldingsTable: React.FC<TimeFilterProps> = ({
  filteredHoldings
}) => {
  const { holdings } = usePortfolio();
  const [sortField, setSortField] = useState<string>('currentValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Use filteredHoldings if provided, otherwise use the default holdings
  const displayHoldings = filteredHoldings || holdings;
  
  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new field
    }
  };
  
  // Sort holdings based on the current sort field and direction
  const sortedHoldings = useMemo(() => {
    if (!displayHoldings || displayHoldings.length === 0) return [];
    
    return [...displayHoldings].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'shares':
          comparison = a.shares - b.shares;
          break;
        case 'costBasis':
          comparison = a.costBasis - b.costBasis;
          break;
        case 'currentValue':
          comparison = a.currentValue - b.currentValue;
          break;
        case 'gain':
          comparison = a.gain - b.gain;
          break;
        case 'gainPercent':
          comparison = a.gainPercent - b.gainPercent;
          break;
        case 'dividendYield':
          comparison = a.dividendYield - b.dividendYield;
          break;
        case 'annualIncome':
          comparison = a.annualIncome - b.annualIncome;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [displayHoldings, sortField, sortDirection]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white">Holdings</h2>
        <p className="text-sm text-gray-500 dark:text-white">
          {sortedHoldings.length} holdings
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <SortableHeader
                field="symbol"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Symbol
              </SortableHeader>
              <SortableHeader
                field="name"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Name
              </SortableHeader>
              <SortableHeader
                field="shares"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Shares
              </SortableHeader>
              <SortableHeader
                field="costBasis"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
              >
                Cost Basis
              </SortableHeader>
              <SortableHeader
                field="currentValue"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
              >
                Market Value
              </SortableHeader>
              <SortableHeader
                field="gainPercent"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
              >
                Gain/Loss
              </SortableHeader>
              <SortableHeader
                field="dividendYield"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
              >
                Yield
              </SortableHeader>
              <SortableHeader
                field="annualIncome"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
              >
                Annual Income
              </SortableHeader>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedHoldings.map(holding => (
              <tr key={holding.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {holding.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {holding.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {holding.shares.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                  {formatCurrency(holding.costBasis)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right">
                  {formatCurrency(holding.currentValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm ${holding.gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(holding.gain)}
                    <span className="ml-1">
                      ({formatPercentage(holding.gainPercent)})
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 text-right">
                  {formatPercentage(holding.dividendYield)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 text-right">
                  {formatCurrency(holding.annualIncome)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;