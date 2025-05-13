import React, { useState } from 'react';
import usePortfolio from '../../hooks/usePortfolio';
import Card from '../ui/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Create a DividendTable component that uses usePortfolio hook instead of props
const DividendTable: React.FC = () => {
  const { dividendHistory } = usePortfolio();
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Sort dividends
  const sortedDividends = [...dividendHistory].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Group by year and month for display
  const dividendsByYearMonth: Record<string, typeof dividendHistory> = {};
  
  sortedDividends.forEach(dividend => {
    const date = new Date(dividend.date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!dividendsByYearMonth[yearMonth]) {
      dividendsByYearMonth[yearMonth] = [];
    }
    
    dividendsByYearMonth[yearMonth].push(dividend);
  });
  
  // Calculate totals by year and month
  const totalsByYearMonth: Record<string, number> = {};
  
  Object.entries(dividendsByYearMonth).forEach(([yearMonth, dividends]) => {
    totalsByYearMonth[yearMonth] = dividends.reduce((sum, div) => sum + div.amount, 0);
  });
  
  // Sort years and months
  const sortedYearMonths = Object.keys(dividendsByYearMonth).sort().reverse();
  
  // Calculate grand total
  const grandTotal = sortedDividends.reduce((sum, div) => sum + div.amount, 0);
  
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white">Dividend History</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {sortedDividends.length} dividend payments, {formatCurrency(grandTotal)} total
        </p>
      </div>
      
      <div>
        {sortedYearMonths.map(yearMonth => {
          const [year, month] = yearMonth.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
          const dividends = dividendsByYearMonth[yearMonth];
          const total = totalsByYearMonth[yearMonth];
          
          return (
            <div key={yearMonth} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">{monthName} {year}</h3>
                <span className="text-green-600 font-medium">{formatCurrency(total)}</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th 
                        className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          Date
                          {sortField === 'date' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('symbol')}
                      >
                        <div className="flex items-center">
                          Symbol
                          {sortField === 'symbol' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left">Company</th>
                      <th className="px-4 py-2 text-right">Shares</th>
                      <th className="px-4 py-2 text-right">Per Share</th>
                      <th 
                        className="px-4 py-2 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center justify-end">
                          Amount
                          {sortField === 'amount' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dividends.map(dividend => (
                      <tr 
                        key={dividend.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-4 py-2 whitespace-nowrap">
                          {formatDate(dividend.date)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap font-medium">
                          {dividend.symbol}
                        </td>
                        <td className="px-4 py-2 max-w-xs truncate">
                          {dividend.companyName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                          {/* Handle possibly undefined shares */}
                          {dividend.shares ? dividend.shares.toFixed(2) : '0.00'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                          {formatCurrency(dividend.amountPerShare)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-green-600">
                          {formatCurrency(dividend.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <td colSpan={5} className="px-4 py-2 text-right font-medium">
                        Monthly Total:
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-green-600">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DividendTable;