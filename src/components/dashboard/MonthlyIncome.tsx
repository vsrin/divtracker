import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import usePortfolio from '../../hooks/usePortfolio';
import { formatCurrency } from '../../utils/formatters';

interface ChartData {
  name: string;
  actual: number;
  projected: number;
  month: string;
}

interface MonthProjection {
  month: string;
  total: number;
}

const MonthlyIncome: React.FC = () => {
  const { monthlyIncome, dividendHistory } = usePortfolio();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [annualTotal, setAnnualTotal] = useState<number>(0);
  const [monthlyAverage, setMonthlyAverage] = useState<number>(0);
  
  // Helper function to get month name from date string (YYYY-MM)
  const getMonthNameFromDateString = (dateStr: string): string => {
    const [year, month] = dateStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
  };
  
  useEffect(() => {
    if (monthlyIncome && monthlyIncome.length > 0) {
      // Create chart data from projections
      const projections = monthlyIncome as MonthProjection[];
      const data: ChartData[] = projections.map((item: MonthProjection) => ({
        name: getMonthNameFromDateString(item.month),
        actual: 0, // Will be populated below if we have historical data
        projected: item.total,
        month: item.month
      }));
      
      // Calculate annual total and monthly average
      const total = projections.reduce((sum: number, item: MonthProjection) => sum + item.total, 0);
      setAnnualTotal(total);
      setMonthlyAverage(total / 12);
      
      // Populate with actual data if available
      if (dividendHistory && dividendHistory.length > 0) {
        // Group dividends by month
        const dividendsByMonth: { [key: string]: number } = {};
        
        dividendHistory.forEach((dividend: any) => {
          const date = new Date(dividend.date);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!dividendsByMonth[monthYear]) {
            dividendsByMonth[monthYear] = 0;
          }
          
          dividendsByMonth[monthYear] += dividend.amount;
        });
        
        // Add historical data to chart data
        data.forEach(item => {
          if (dividendsByMonth[item.month]) {
            item.actual = dividendsByMonth[item.month];
          }
        });
      }
      
      setChartData(data);
    }
  }, [monthlyIncome, dividendHistory]);
  
  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 shadow-sm rounded">
          <p className="font-medium">{payload[0].payload.name}</p>
          {payload[0].payload.actual > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Actual: {formatCurrency(payload[0].payload.actual)}
            </p>
          )}
          <p className="text-sm text-green-600 dark:text-green-400">
            Projected: {formatCurrency(payload[0].payload.projected)}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Monthly Dividend Income</h2>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Actual</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Projected</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">Annual Income</div>
          <div className="text-xl font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(annualTotal)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Average</div>
          <div className="text-xl font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(monthlyAverage)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">Next Month</div>
          <div className="text-xl font-semibold text-green-600 dark:text-green-400">
            {chartData.length > 0 ? formatCurrency(chartData[0].projected) : '$0.00'}
          </div>
        </div>
      </div>
      
      <div style={{ width: '100%', height: 300 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value}`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="actual" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
                stackId="a"
                barSize={20}
              />
              <Bar 
                dataKey="projected" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
                stackId="a"
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">
              No dividend data available
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyIncome;