// src/components/layout/Dashboard.tsx
import React, { useState } from 'react';
import PortfolioSummary from '../dashboard/PortfolioSummary';
import DividendContributorDistribution from '../dashboard/DividendContributorDistribution';
import DividendProjection from '../dashboard/DividendProjection';
import MonthlyIncome from '../dashboard/MonthlyIncome';
import PerformanceMetrics from '../dashboard/PerformanceMetrics';
import TopHoldings from '../dashboard/TopHoldings';
import HoldingsTable from '../tables/HoldingsTable';
import usePortfolio from '../../hooks/usePortfolio';
import { TimePeriod } from '../../types/dashboard';
import { calculateTimeFilteredPortfolioMetrics } from '../../utils/timeFilters';

const Dashboard: React.FC = () => {
  const { holdings, transactions, dividendHistory, error, isLoading } = usePortfolio();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('YTD');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  
  // Calculate filtered data based on time period
  const {
    filteredHoldings,
    filteredTransactions,
    filteredDividends,
    periodIncome,
    periodGain
  } = calculateTimeFilteredPortfolioMetrics(
    holdings,
    transactions,
    dividendHistory,
    selectedTimePeriod,
    selectedMonths
  );
  
  // Available months for selection
  const availableMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Handle time period selection
  const handleTimePeriodChange = (period: TimePeriod) => {
    setSelectedTimePeriod(period);
    if (period === 'Custom') {
      setShowMonthSelector(true);
    } else {
      setShowMonthSelector(false);
    }
  };
  
  // Handle month selection/deselection
  const toggleMonthSelection = (month: string) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }
  
  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded relative">
        <strong className="font-bold">No portfolio data found! </strong>
        <span className="block sm:inline">
          Please use the Import feature to upload your portfolio data.
        </span>
      </div>
    );
  }
  
  const timeFilterProps = {
    timePeriod: selectedTimePeriod,
    selectedMonths: selectedMonths,
    filteredHoldings,
    filteredTransactions,
    filteredDividends,
    periodIncome,
    periodGain
  };
  
  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard View</h2>
          
          <div className="flex flex-wrap gap-2">
            {['MTD', 'QTD', 'YTD', 'Prior Year', 'Custom'].map((period) => (
              <button
                key={period}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedTimePeriod === period
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleTimePeriodChange(period as TimePeriod)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        {/* Month Selector (shown only when Custom is selected) */}
        {showMonthSelector && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-sm font-medium mb-2 text-gray-700 dark:text-white">Select Months:</p>
            <div className="flex flex-wrap gap-2">
              {availableMonths.map((month) => (
                <button
                  key={month}
                  className={`px-2 py-1 rounded-md text-xs ${
                    selectedMonths.includes(month)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => toggleMonthSelection(month)}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Top Row: PortfolioSummary and MonthlyIncome (moved to top right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4">
          <PortfolioSummary {...timeFilterProps} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4">
          <MonthlyIncome {...timeFilterProps} />
        </div>
      </div>
      
      {/* Middle Row: DividendProjection, DividendContribution, and TopHoldings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4">
          <DividendProjection {...timeFilterProps} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4">
          <DividendContributorDistribution {...timeFilterProps} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4">
          <TopHoldings {...timeFilterProps} />
        </div>
      </div>
      
      {/* Performance metrics row */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4">
        <PerformanceMetrics {...timeFilterProps} />
      </div>
      
      {/* Full-width table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-4">
        <HoldingsTable {...timeFilterProps} />
      </div>
    </div>
  );
};

export default Dashboard;