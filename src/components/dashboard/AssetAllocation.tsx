// src/components/dashboard/AssetAllocation.tsx
// Fixed version with proper type handling and unused import removal

import React, { useMemo } from 'react';
import { usePortfolioContext } from '../../context/PortfolioContext';
import Card from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { AssetAllocation as AssetAllocationInterface } from '../../types';

const AssetAllocation: React.FC = () => {
  const { holdings, isLoading } = usePortfolioContext();
  
  // Calculate asset allocation
  const assetAllocation = useMemo(() => {
    if (isLoading || holdings.length === 0) {
      return [];
    }
    
    // Calculate total value
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    
    // Collect unique asset classes
    const assetClasses: Record<string, AssetAllocationInterface> = {};
    
    // Group by asset class
    holdings.forEach(holding => {
      // Use a fallback value if assetClass is undefined
      const assetClass = holding.assetClass || 'Unknown';
      
      if (!assetClasses[assetClass]) {
        assetClasses[assetClass] = { 
          value: 0, 
          allocation: 0,
          assetClass,
          color: getRandomColor(assetClass)
        };
      }
      
      assetClasses[assetClass].value += holding.currentValue;
    });
    
    // Calculate allocation percentages
    const result = Object.values(assetClasses);
    result.forEach(item => {
      item.allocation = (item.value / totalValue) * 100;
    });
    
    // Sort by value (descending)
    return result.sort((a, b) => b.value - a.value);
  }, [holdings, isLoading]);
  
  // Generate a consistent color based on string
  function getRandomColor(str: string): string {
    const colors = [
      '#4299E1', // blue-500
      '#48BB78', // green-500
      '#ECC94B', // yellow-500
      '#ED8936', // orange-500
      '#F56565', // red-500
      '#9F7AEA', // purple-500
      '#667EEA', // indigo-500
      '#ED64A6', // pink-500
      '#38B2AC', // teal-500
      '#4FD1C5', // light teal
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
          <p className="font-medium text-sm">{data.assetClass}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{formatPercentage(data.allocation)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    
    return null;
  };
  
  if (isLoading) {
    return (
      <Card title="Asset Allocation">
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Loading asset allocation data...</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title="Asset Allocation">
      {assetAllocation.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No asset allocation data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="90%"
                  innerRadius="40%"
                  dataKey="value"
                  nameKey="assetClass"
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${entry.assetClass}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {assetAllocation.map((asset) => (
              <div key={asset.assetClass} className="flex items-center px-2 py-1 rounded">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: asset.color }}
                />
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {asset.assetClass}
                  </span>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {formatPercentage(asset.allocation)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AssetAllocation;