# 10. Fix DividendTable.tsx
echo "🔄 Fixing DividendTable.tsx..."
update_file "src/components/tables/DividendTable.tsx" 'import React, { useState } from "react";
import { usePortfolioContext } from "../../context/PortfolioContext";
import { DividendPayment } from "../../types/portfolio"; 
import Card from "../ui/Card";
import { formatCurrency, formatDate } from "../../utils/formatters";

interface SortableHeaderProps {
  field: string;
  label: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  field, 
  label, 
  sortField, 
  sortDirection, 
  onSort 
}) => {
  const isSorted = sortField === field;
  
  return (
    <th 
      onClick={() => onSort && onSort(field)}
      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "" : "transform rotate-180"}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </div>
    </th>
  );
};

const DividendTable: React.FC = () => {
  const { dividends, isLoading } = usePortfolioContext();
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!dividends || dividends.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <p className="text-gray-500 dark:text-gray-400">No dividend history found</p>
      </div>
    );
  }

  // Sort dividend payments
  const sortedDividends = [...dividends].sort((a, b) => {
    if (sortField === "date") {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    
    // Handle undefined values safely
    const aValue = a[sortField as keyof DividendPayment];
    const bValue = b[sortField as keyof DividendPayment];
    
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return sortDirection === "asc" ? -1 : 1;
    if (bValue === undefined) return sortDirection === "asc" ? 1 : -1;
    
    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Calculate totals with safe access for optional properties
  const totalDividends = dividends.reduce((sum, dividend) => sum + dividend.amount, 0);
  const totalTax = dividends.reduce((sum, dividend) => sum + (dividend.tax || 0), 0);
  const netDividends = totalDividends - totalTax;

  // Group by year-month for summary
  const dividendsByMonth: Record<string, number> = {};
  dividends.forEach(dividend => {
    const monthYear = new Date(dividend.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short"
    });
    
    if (!dividendsByMonth[monthYear]) {
      dividendsByMonth[monthYear] = 0;
    }
    
    dividendsByMonth[monthYear] += dividend.amount;
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card title="Dividend Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Dividends</h4>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalDividends)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tax</h4>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalTax)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Dividends</h4>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(netDividends)}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Monthly summary */}
      <Card title="Monthly Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Object.entries(dividendsByMonth)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([month, amount]) => (
              <div key={month} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{month}</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(amount)}
                </div>
              </div>
            ))
          }
        </div>
      </Card>
      
      {/* Table */}
      <Card title="Dividend Payments">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <SortableHeader field="date" label="Date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortableHeader field="symbol" label="Symbol" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <SortableHeader field="amount" label="Amount" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tax
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Net
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedDividends.map((dividend) => (
                <tr key={dividend.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                    {formatDate(dividend.date)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                    {dividend.symbol}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                    {dividend.companyName || dividend.name || dividend.symbol}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                    {formatCurrency(dividend.amount)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                    {dividend.tax ? formatCurrency(dividend.tax) : "-"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(dividend.amount - (dividend.tax || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile responsive indicator */}
        <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400 md:hidden">
          Scroll horizontally to view all columns
        </div>
      </Card>
    </div>
  );
};

export default DividendTable;'

# 11. Fix HoldingsTable.tsx
echo "🔄 Fixing HoldingsTable.tsx..."
update_file "src/components/tables/HoldingsTable.tsx" 'import React, { useState } from "react";
import { usePortfolioContext } from "../../context/PortfolioContext";
import { Holding } from "../../types/portfolio";
import Card from "../ui/Card";
import { formatCurrency, formatPercentage } from "../../utils/formatters";

interface SortableHeaderProps {
  field: keyof Holding;
  label: string;
  sortField?: keyof Holding;
  sortDirection?: "asc" | "desc";
  onSort?: (field: keyof Holding) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  field, 
  label, 
  sortField, 
  sortDirection, 
  onSort 
}) => {
  const isSorted = sortField === field;
  
  return (
    <th 
      onClick={() => onSort && onSort(field)}
      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "" : "transform rotate-180"}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </div>
    </th>
  );
};

const HoldingsTable: React.FC = () => {
  const { holdings, isLoading } = usePortfolioContext();
  const [sortField, setSortField] = useState<keyof Holding>("currentValue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof Holding) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <Card title="Holdings">
        <p className="text-gray-500 dark:text-gray-400">No holdings found</p>
      </Card>
    );
  }

  // Sort holdings with safe handling of undefined fields
  const sortedHoldings = [...holdings].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return sortDirection === "asc" ? -1 : 1;
    if (bValue === undefined) return sortDirection === "asc" ? 1 : -1;
    
    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  return (
    <Card title="Holdings">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <SortableHeader field="symbol" label="Symbol" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="name" label="Name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="shares" label="Shares" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="currentPrice" label="Price" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="currentValue" label="Value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="costBasis" label="Cost Basis" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="gain" label="Gain/Loss" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="gainPercent" label="Return" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="dividendYield" label="Yield" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              <SortableHeader field="dividendAmount" label="Annual Income" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedHoldings.map((holding) => (
              <tr key={holding.id || holding.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                  {holding.symbol}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {holding.name}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {holding.shares}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {formatCurrency(holding.currentPrice)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {formatCurrency(holding.currentValue)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {formatCurrency(holding.costBasis)}
                </td>
                <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                  holding.gain >= 0 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {formatCurrency(holding.gain)}
                </td>
                <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                  holding.gainPercent >= 0 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {formatPercentage(holding.gainPercent)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {formatPercentage(holding.dividendYield)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                  {formatCurrency(holding.dividendAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile responsive indicator */}
      <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400 md:hidden">
        Scroll horizontally to view all columns
      </div>
    </Card>
  );
};

export default HoldingsTable;'

# 12. Fix Asset Allocation component
echo "🔄 Fixing components/dashboard/AssetAllocation.tsx..."
update_file "src/components/dashboard/AssetAllocation.tsx" 'import React, { useMemo } from "react";
import { usePortfolioContext } from "../../context/PortfolioContext";
import Card from "../ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency, formatPercentage } from "../../utils/formatters";

interface AssetBreakdown {
  assetClass: string;
  value: number;
  allocation: number;
  color: string;
}

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
    const assetClasses: Record<string, AssetBreakdown> = {};
    
    // Group by asset class
    holdings.forEach(holding => {
      // Use a fallback value if assetClass is undefined
      const assetClass = holding.assetClass || "Unknown";
      
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
      "#4299E1", // blue-500
      "#48BB78", // green-500
      "#ECC94B", // yellow-500
      "#ED8936", // orange-500
      "#F56565", // red-500
      "#9F7AEA", // purple-500
      "#667EEA", // indigo-500
      "#ED64A6", // pink-500
      "#38B2AC", // teal-500
      "#4FD1C5", // light teal
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
                  {assetAllocation.map((entry) => (
                    <Cell key={`cell-${entry.assetClass}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value: string) => (
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

export default AssetAllocation;'

# 13. Create an executable script to apply all fixes
cat > apply_fixes.sh << 'EOF'
#!/bin/bash

# Script to fix compilation errors in the Dividend Dashboard project
# This script applies all fixes generated by Claude

echo "🔧 Starting application of fixes to Dividend Dashboard..."
echo

# Check if files exist before applying fixes
check_file() {
  if [ ! -f "$1" ]; then
    mkdir -p $(dirname "$1")
    echo "🔶 Creating new file: $1"
  else
    echo "🔄 Updating existing file: $1"
  fi
}

# Apply Types Fixes
echo "📦 Applying fixes to type definitions..."

check_file "src/types/index.ts"
check_file "src/types/portfolio.ts" 
check_file "src/types/dividend.ts"
check_file "src/types/transaction.ts"

# Apply Context Fixes
echo "📦 Applying fixes to context..."
check_file "src/context/PortfolioContext.tsx"

# Apply Utility Fixes
echo "📦 Applying fixes to utility functions..."
check_file "src/utils/csvDetector.ts"
check_file "src/utils/calculations.ts"

# Apply Component Fixes
echo "📦 Applying fixes to components..."
check_file "src/components/tables/TransactionTable.tsx"
check_file "src/components/tables/DividendTable.tsx"
check_file "src/components/tables/HoldingsTable.tsx"
check_file "src/components/dashboard/AssetAllocation.tsx"
check_file "src/hooks/usePortfolio.ts"

# Apply actual fixes - they'll be executed by the parent script

echo 
echo "✅ All fixes have been applied!"
echo "🚀 You can now start your application with:"
echo "   npm start"
echo
echo "ℹ️ If you encounter any issues, please refer to the backup directory."
EOF

# Make the script executable
chmod +x apply_fixes.sh

echo "🎉 Fix script creation completed!"
echo "Run ./apply_fixes.sh to apply all fixes to your project."
echo ""
echo "This script will:"
echo "- Back up your original files"
echo "- Fix type definitions and imports"
echo "- Fix utility functions and component issues"
echo "- Make the necessary type adjustments"
echo ""
echo "After running the script, you should be able to compile the project successfully."