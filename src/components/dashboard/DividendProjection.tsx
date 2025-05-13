import React from 'react';
import Card from '../ui/Card';
import usePortfolio from '../../hooks/usePortfolio';
import { formatCurrency } from '../../utils/formatters';

interface MonthProjection {
  month: string;
  total: number;
}

const DividendProjection: React.FC = () => {
  const { monthlyIncome } = usePortfolio();
  // Type assertion to match the correct structure
  const dividendProjections = monthlyIncome as MonthProjection[];
  
  // Calculate total projected dividends
  const totalProjected = dividendProjections?.reduce((sum: number, month: MonthProjection) => sum + month.total, 0) || 0;
  
  // Calculate average monthly income
  const averageMonthly = dividendProjections && dividendProjections.length > 0
    ? totalProjected / dividendProjections.length
    : 0;
  
  return (
    <Card>
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Dividend Projection</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Next 12 months</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Annual Income</div>
            <div className="text-xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totalProjected)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Average</div>
            <div className="text-xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(averageMonthly)}
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Monthly Distribution
          </div>
          <div className="relative h-16 bg-gray-100 dark:bg-gray-700 rounded">
            {dividendProjections && dividendProjections.map((month: MonthProjection, index: number) => {
              const maxValue = Math.max(...dividendProjections.map((m: MonthProjection) => m.total));
              const height = (month.total / maxValue) * 100 + '%';
              const monthName = new Date(`${month.month}-01`).toLocaleString('default', { month: 'short' });
              
              return (
                <div
                  key={index}
                  className="absolute bottom-0 bg-green-500 hover:bg-green-600 transition-colors duration-200"
                  style={{
                    left: `${(index / 12) * 100}%`,
                    width: `${100 / 12}%`,
                    height: height,
                    opacity: 0.7 + (month.total / maxValue * 0.3)
                  }}
                  title={`${monthName}: ${formatCurrency(month.total)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            {dividendProjections && dividendProjections.map((month: MonthProjection, index: number) => {
              if (index % 3 === 0) {
                const monthName = new Date(`${month.month}-01`).toLocaleString('default', { month: 'short' });
                return (
                  <div key={index} className="text-center">
                    {monthName}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DividendProjection;