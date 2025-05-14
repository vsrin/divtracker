// src/components/dashboard/DividendContributorDistribution.tsx
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import usePortfolio from '../../hooks/usePortfolio';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { TimeFilterProps } from '../../types/dashboard';

const DividendContributorDistribution: React.FC<TimeFilterProps> = ({
  filteredHoldings
}) => {
  const { holdings } = usePortfolio();
  
  // Use filtered holdings if available
  const displayHoldings = filteredHoldings || holdings;
  
  // Calculate dividend distribution
  const distributionData = useMemo(() => {
    if (!displayHoldings || displayHoldings.length === 0) {
      return [];
    }
    
    // Filter holdings with dividend income
    const dividendHoldings = displayHoldings.filter(h => h.annualIncome > 0);
    
    // Calculate total dividend income
    const totalIncome = dividendHoldings.reduce((sum, h) => sum + h.annualIncome, 0);
    
    // Create distribution data
    let result = dividendHoldings.map(holding => ({
      name: holding.name,
      symbol: holding.symbol,
      value: holding.annualIncome,
      percentage: (holding.annualIncome / totalIncome) * 100,
      color: getRandomColor(holding.symbol)
    }));
    
    // Sort by value (descending)
    result = result.sort((a, b) => b.value - a.value);
    
    // If more than 10 holdings, group the smallest ones as "Others"
    if (result.length > 10) {
      const topItems = result.slice(0, 9);
      const otherItems = result.slice(9);
      
      const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);
      const otherPercentage = (otherValue / totalIncome) * 100;
      
      topItems.push({
        name: 'Others',
        symbol: 'OTHERS',
        value: otherValue,
        percentage: otherPercentage,
        color: '#CBD5E0' // Gray color for Others
      });
      
      return topItems;
    }
    
    return result;
  }, [displayHoldings]);
  
  // Generate a consistent color based on string
  function getRandomColor(str: string): string {
    const colors = [
      '#4FD1C5', // teal-400 (lighter)
      '#F6AD55', // orange-400 (lighter)
      '#F6E05E', // yellow-400 (lighter)
      '#FC8181', // red-400 (lighter)
      '#B794F4', // purple-400 (lighter)
      '#7F9CF5', // indigo-400 (lighter)
      '#F687B3', // pink-400 (lighter)
      '#68D391', // green-400 (lighter)
      '#63B3ED', // blue-400 (lighter)
      '#A3BFFA', // light indigo
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
          <p className="font-medium text-sm text-gray-900 dark:text-white">{data.symbol}</p>
          <p className="text-xs text-gray-600 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-white">{formatPercentage(data.percentage)}</p>
          <p className="text-sm text-gray-600 dark:text-white">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    
    return null;
  };
  
  const customizedLegend = ({ payload }: any) => {
    // Create custom legend rendering
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
        {distributionData.map((item) => (
          <div key={item.symbol} className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex justify-between items-center w-full overflow-hidden">
              <span className="font-medium text-base text-white mr-2">
                {item.symbol}
              </span>
              <span className="text-base font-semibold text-white flex-shrink-0">
                {formatPercentage(item.percentage)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  if (!displayHoldings || displayHoldings.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-2 text-white">Dividend Contributors</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-300">No dividend data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-white">Dividend Contributors</h3>
      
      {distributionData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-300">No dividend contributors found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="90%"
                  innerRadius="40%"
                  dataKey="value"
                  nameKey="symbol"
                >
                  {distributionData.map((entry) => (
                    <Cell key={`cell-${entry.symbol}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  content={customizedLegend}
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Additional legend with ticker symbols at the bottom */}
          <div className="grid grid-cols-5 gap-4 mt-4">
            {distributionData.map((item) => (
              <div key={`bottom-${item.symbol}`} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-base text-white">
                  {item.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DividendContributorDistribution;