// src/components/tables/TransactionTable.tsx 
// Add the correct type imports and fix the type annotations

import React, { useState, useEffect } from 'react';
import usePortfolio from '../../hooks/usePortfolio';
import Card from '../ui/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { filterTransactionsByDate } from '../../utils/calculations';
import { Transaction } from '../../types';

interface SortableHeaderProps {
  field: string;
  currentSort: string;
  currentDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  children: React.ReactNode;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  field, 
  currentSort, 
  currentDirection, 
  onSort, 
  children 
}) => {
  return (
    <th
      className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {children}
        {currentSort === field && (
          <span className="ml-1">
            {currentDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
};

const TransactionTable: React.FC = () => {
  const { transactions } = usePortfolio();
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState<{start?: string; end?: string}>({});
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [summaryStats, setSummaryStats] = useState<{
    totalBuy: number;
    totalSell: number;
    totalDividends: number;
    totalFees: number;
    totalTaxes: number;
  }>({
    totalBuy: 0,
    totalSell: 0,
    totalDividends: 0,
    totalFees: 0,
    totalTaxes: 0
  });
  
  // Filter and sort transactions
  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setFilteredTransactions([]);
      return;
    }
    
    // Filter by date range
    let filtered = filterTransactionsByDate(
      transactions as Transaction[], 
      dateFilter.start, 
      dateFilter.end
    );
    
    // Filter by transaction type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t: Transaction) => t.type.toLowerCase() === typeFilter.toLowerCase());
    }
    
    // Sort transactions
    filtered.sort((a: Transaction, b: Transaction) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'shares':
          comparison = a.shares - b.shares;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredTransactions(filtered);
    
    // Calculate summary statistics
    const stats = {
      totalBuy: filtered.filter((t: Transaction) => t.type === 'BUY').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
      totalSell: filtered.filter((t: Transaction) => t.type === 'SELL').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
      totalDividends: filtered.filter((t: Transaction) => t.type === 'DIVIDEND').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
      totalFees: filtered.reduce((sum: number, t: Transaction) => sum + (t.fees || 0), 0),
      totalTaxes: filtered.reduce((sum: number, t: Transaction) => sum + (t.tax || 0), 0)
    };
    
    setSummaryStats(stats);
  }, [transactions, sortField, sortDirection, dateFilter, typeFilter]);
  
  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Transaction type badge
  const getTypeBadge = (type: string) => {
    let color = '';
    
    switch (type.toLowerCase()) {
      case 'buy':
        color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        break;
      case 'sell':
        color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        break;
      case 'dividend':
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        break;
      case 'split':
        color = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        break;
      case 'transfer':
        color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        break;
      case 'tax':
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        break;
      default:
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
    
    return (
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${color}`}>
        {type}
      </span>
    );
  };
  
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white">Transactions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTransactions.length} transactions
        </p>
      </div>
      
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={dateFilter.start || ''}
            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={dateFilter.end || ''}
            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transaction Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md p-2 w-full"
          >
            <option value="all">All Types</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="dividend">Dividend</option>
            <option value="split">Split</option>
            <option value="transfer">Transfer</option>
            <option value="tax">Tax</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reset Filters
          </label>
          <button
            onClick={() => {
              setDateFilter({});
              setTypeFilter('all');
            }}
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md w-full hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">Buys / Sells</div>
          <div className="text-lg font-semibold text-gray-800 dark:text-white">
            {formatCurrency(summaryStats.totalBuy)} / {formatCurrency(summaryStats.totalSell)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">Dividends</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(summaryStats.totalDividends)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-500 dark:text-gray-400">Fees & Taxes</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(summaryStats.totalFees + summaryStats.totalTaxes)}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <SortableHeader
                field="date"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Date
              </SortableHeader>
              <SortableHeader
                field="type"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Type
              </SortableHeader>
              <SortableHeader
                field="symbol"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Symbol
              </SortableHeader>
              <th className="px-4 py-2 text-left">Description</th>
              <SortableHeader
                field="shares"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Shares
              </SortableHeader>
              <SortableHeader
                field="price"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Price
              </SortableHeader>
              <SortableHeader
                field="amount"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Amount
              </SortableHeader>
              <th className="px-4 py-2 text-left">Fees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {getTypeBadge(transaction.type)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-medium">
                    {transaction.symbol}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">
                    {transaction.companyName}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {transaction.shares > 0 ? transaction.shares.toFixed(2) : ''}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {transaction.price > 0 ? formatCurrency(transaction.price) : ''}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right font-medium">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-gray-500">
                    {transaction.fees ? formatCurrency(transaction.fees) : ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No transactions found. Try adjusting your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TransactionTable;