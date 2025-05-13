import React from 'react';
import Card from '../ui/Card';
import usePortfolio from '../../hooks/usePortfolio';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

// Define local interfaces for our metrics
interface MetricsResult {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  totalIncome: number;
  totalYield: number;
  highestYield: { symbol: string; dividendYield: number };
  lowestYield: { symbol: string; dividendYield: number };
  topGainer: { symbol: string; gainPercent: number };
  topLoser: { symbol: string; gainPercent: number };
}

const PortfolioSummary: React.FC = () => {
  const { holdings, portfolioValue, portfolioIncome, portfolioYield } = usePortfolio();
  
  // Calculate portfolio metrics
  const calculateMetrics = (): MetricsResult => {
    if (!holdings || holdings.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        totalIncome: 0,
        totalYield: 0,
        highestYield: { symbol: '', dividendYield: 0 },
        lowestYield: { symbol: '', dividendYield: 0 },
        topGainer: { symbol: '', gainPercent: 0 },
        topLoser: { symbol: '', gainPercent: 0 }
      };
    }
    
    // Cast the holdings to any to avoid the type mismatch
    const typedHoldings = holdings as any[];
    
    const totalValue = typedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = typedHoldings.reduce((sum, h) => sum + h.costBasis, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = (totalCost > 0) ? (totalGain / totalCost) * 100 : 0;
    const totalIncome = typedHoldings.reduce((sum, h) => sum + h.annualIncome, 0);
    const totalYield = (totalValue > 0) ? (totalIncome / totalValue) * 100 : 0;
    
    // Find top and bottom performers
    const holdingsWithYield = typedHoldings.filter(h => h.dividendYield > 0);
    
    // Default values in case of empty arrays
    let highestYield = { symbol: 'N/A', dividendYield: 0 };
    let lowestYield = { symbol: 'N/A', dividendYield: 0 };
    let topGainer = { symbol: 'N/A', gainPercent: 0 };
    let topLoser = { symbol: 'N/A', gainPercent: 0 };
    
    if (holdingsWithYield.length > 0) {
      const highYieldHolding = holdingsWithYield.reduce((prev, current) => 
        prev.dividendYield > current.dividendYield ? prev : current
      );
      
      const lowYieldHolding = holdingsWithYield.reduce((prev, current) => 
        prev.dividendYield < current.dividendYield ? prev : current
      );
      
      highestYield = { 
        symbol: highYieldHolding.symbol, 
        dividendYield: highYieldHolding.dividendYield 
      };
      
      lowestYield = { 
        symbol: lowYieldHolding.symbol, 
        dividendYield: lowYieldHolding.dividendYield 
      };
    }
    
    if (typedHoldings.length > 0) {
      const topGainHolding = typedHoldings.reduce((prev, current) => 
        prev.gainPercent > current.gainPercent ? prev : current
      );
      
      const topLossHolding = typedHoldings.reduce((prev, current) => 
        prev.gainPercent < current.gainPercent ? prev : current
      );
      
      topGainer = { 
        symbol: topGainHolding.symbol, 
        gainPercent: topGainHolding.gainPercent 
      };
      
      topLoser = { 
        symbol: topLossHolding.symbol, 
        gainPercent: topLossHolding.gainPercent 
      };
    }
    
    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      totalIncome,
      totalYield,
      highestYield,
      lowestYield,
      topGainer,
      topLoser
    };
  };
  
  const metrics = calculateMetrics();
  
  return (
    <Card>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Portfolio Overview</h2>
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
            metrics.totalGain >= 0
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          }`}>
            {formatPercentage(metrics.totalGainPercent)}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Value</div>
            <div className="text-xl font-semibold text-gray-800 dark:text-white">
              {formatCurrency(portfolioValue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Annual Income</div>
            <div className="text-xl font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(portfolioIncome)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Gain/Loss</div>
            <div className={`text-xl font-semibold ${
              metrics.totalGain >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(metrics.totalGain)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Portfolio Yield</div>
            <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              {formatPercentage(portfolioYield)}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Performers</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Highest Yield</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {metrics.highestYield.symbol} ({formatPercentage(metrics.highestYield.dividendYield)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Best Gainer</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {metrics.topGainer.symbol} ({formatPercentage(metrics.topGainer.gainPercent)})
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bottom Performers</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Lowest Yield</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {metrics.lowestYield.symbol} ({formatPercentage(metrics.lowestYield.dividendYield)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Worst Performer</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {metrics.topLoser.symbol} ({formatPercentage(metrics.topLoser.gainPercent)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PortfolioSummary;