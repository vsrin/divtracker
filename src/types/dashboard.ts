// src/types/dashboard.ts
export type TimePeriod = 'MTD' | 'QTD' | 'YTD' | 'Prior Year' | 'Custom';

export interface TimeFilterProps {
  timePeriod?: TimePeriod;
  selectedMonths?: string[];
  filteredHoldings?: any[];
  filteredTransactions?: any[];
  filteredDividends?: any[];
  periodIncome?: number;
  periodGain?: number;
}