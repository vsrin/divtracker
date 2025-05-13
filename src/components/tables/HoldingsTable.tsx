import React from 'react';
import usePortfolio from '../../hooks/usePortfolio';
import Card from '../ui/Card';
// Remove the unused formatDate import
import { formatCurrency } from '../../utils/formatters';

// Create a HoldingsTable component that uses usePortfolio hook instead of props
const HoldingsTable: React.FC = () => {
  const { holdings } = usePortfolio();
  
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white">Holdings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {holdings.length} holdings in portfolio
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Symbol</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-right">Shares</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Value</th>
              <th className="px-4 py-2 text-right">Cost Basis</th>
              <th className="px-4 py-2 text-right">Gain/Loss</th>
              <th className="px-4 py-2 text-right">Gain %</th>
              <th className="px-4 py-2 text-right">Yield</th>
              <th className="px-4 py-2 text-right">Income</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {holdings.map((holding: any) => (
              <tr 
                key={holding.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-2 whitespace-nowrap font-medium">
                  {holding.symbol}
                </td>
                <td className="px-4 py-2 max-w-xs truncate">
                  {holding.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  {holding.shares.toFixed(2)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  {formatCurrency(holding.currentPrice)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right font-medium">
                  {formatCurrency(holding.currentValue)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  {formatCurrency(holding.costBasis)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  <span className={holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(holding.gain)}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  <span className={holding.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {holding.gainPercent.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  {holding.dividendYield.toFixed(2)}%
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  {formatCurrency(holding.annualIncome)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default HoldingsTable;