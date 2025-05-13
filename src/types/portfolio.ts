// src/types/portfolio.ts
// Import DividendPayment with explicit type import to fix error
import type { DividendPayment } from './dividend';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  costBasis: number;
  totalCost: number; // Required property
  currentPrice: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
  dividendYield: number;
  annualIncome: number;
  lastUpdated?: string;
  
  // Additional properties needed by existing components
  assetClass?: string;
  allocation?: number;
  shareInPortfolio?: number;
  costPerShare?: number;
  
  // Additional properties used in parser files
  dividendAmount?: number;
  dividendFrequency?: string;
  dividendGrowth?: number;
  sector?: string;
  
  // Additional property for IRR calculations
  irr?: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: string;
  symbol: string;
  companyName: string;
  shares: number;
  price: number;
  amount: number;
  fees?: number;
  tax?: number;
  currency: string;
  notes?: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  totalIncome: number;
  portfolioYield: number;
}

// Add these missing types that are referenced in index.ts
export interface AssetAllocation {
  assetClass: string;
  value: number;
  allocation: number;
  color: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  annualIncome: number;
  portfolioYield: number;
}

export interface MonthlyDividend {
  month: string;
  total: number;
}

export interface DividendProjection {
  month: string;
  total: number;
}

// This enum should replace TransactionType references
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DIVIDEND = 'DIVIDEND',
  SPLIT = 'SPLIT',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE',
  TAX = 'TAX'
}

// Re-export DividendPayment to fix index.ts imports
// Use 'export type' to fix the TS1205 error with --isolatedModules flag
export type { DividendPayment };