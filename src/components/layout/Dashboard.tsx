import React from 'react';
import PortfolioSummary from '../dashboard/PortfolioSummary';
import AssetAllocation from '../dashboard/AssetAllocation';
import DividendProjection from '../dashboard/DividendProjection';
import MonthlyIncome from '../dashboard/MonthlyIncome';
import PerformanceMetrics from '../dashboard/PerformanceMetrics';
import TopHoldings from '../dashboard/TopHoldings';
import HoldingsTable from '../tables/HoldingsTable';
import usePortfolio from '../../hooks/usePortfolio';

const Dashboard: React.FC = () => {
  const { holdings, error, isLoading } = usePortfolio();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }
  
  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
        <strong className="font-bold">No portfolio data found! </strong>
        <span className="block sm:inline">
          Please use the Import feature to upload your portfolio data.
        </span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PortfolioSummary />
        <AssetAllocation />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DividendProjection />
        <MonthlyIncome />
        <TopHoldings />
      </div>
      
      {/* Performance metrics row */}
      <div>
        <PerformanceMetrics />
      </div>
      
      {/* Full-width table */}
      <div>
        <HoldingsTable />
      </div>
    </div>
  );
};

export default Dashboard;