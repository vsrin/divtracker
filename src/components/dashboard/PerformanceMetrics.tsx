// src/components/dashboard/PerformanceMetrics.tsx
import React from 'react';
import { TimeFilterProps } from '../../types/dashboard';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const PerformanceMetrics: React.FC<TimeFilterProps> = ({
  timePeriod,
  periodGain,
  periodIncome
}) => {
  // Calculate metrics based on filtered data
  const totalIncome = periodIncome || 0;
  const totalGain = periodGain || 0;
  
  const periodLabel = timePeriod ? timePeriod : 'All Time';
  
  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-4">
        Performance Metrics - {periodLabel}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700 p-4 rounded">
          <h4 className="text-md font-medium text-white mb-2">Total Gain/Loss</h4>
          <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totalGain)}
          </p>
        </div>
        
        <div className="bg-gray-700 p-4 rounded">
          <h4 className="text-md font-medium text-white mb-2">Dividend Income</h4>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        
        <div className="bg-gray-700 p-4 rounded">
          <h4 className="text-md font-medium text-white mb-2">Return Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Dividend Income:</span>
              <span className="text-green-400">
                {totalIncome > 0 && totalGain !== 0 
                  ? formatPercentage((totalIncome / Math.abs(totalGain)) * 100) 
                  : '0.00%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Capital Gains:</span>
              <span className={`${(totalGain - totalIncome) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalGain !== 0 
                  ? formatPercentage(((totalGain - totalIncome) / Math.abs(totalGain)) * 100) 
                  : '0.00%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;