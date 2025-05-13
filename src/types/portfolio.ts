// src/types/portfolio.ts
export interface Holding {
    // Add id property that was missing
    id: string; 
    symbol: string;
    name: string;
    shares: number;
    costPerShare: number;
    costBasis: number;
    currentValue: number;
    currentPrice: number;
    gain: number;
    gainPercent: number;
    dividendYield: number;
    dividendAmount: number;
    annualIncome: number;
    assetClass?: string;
    sector?: string;
    industry?: string;
    country?: string;
    currency?: string;
    // Add additional fields that were referenced
    allocation?: number;
    shareInPortfolio?: number;
    dividendFrequency?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'irregular';
    dividendGrowth?: number;
    irr?: number;
    notes?: string;
  }
  
  export interface DividendPayment {
    id: string;
    holdingId: string; // Add holdingId property
    symbol: string;
    date: string;
    amount: number;
    shares?: number;
    // Add missing properties
    companyName: string;
    amountPerShare: number;
    tax: number;
    currency: string;
  }
  
  export enum TransactionType {
    BUY = 'BUY',
    SELL = 'SELL',
    DIVIDEND = 'DIVIDEND',
    SPLIT = 'SPLIT',
    TRANSFER = 'TRANSFER',
    OTHER = 'OTHER'
  }
  
  export interface Transaction {
    id: string;
    date: string;
    type: TransactionType | string; // Allow string to handle lowercase values
    symbol: string;
    description?: string;
    shares: number;
    price?: number;
    amount: number;
    fees?: number;
    // Add missing properties
    tax?: number;
    companyName?: string;
    // Additional fields from errors
    currency?: string;
    notes?: string;
    quantity?: number; // Sometimes used instead of shares
  }
  
  export interface AssetAllocation {
    assetClass: string;
    value: number;
    invested: number;
    gain: number;
    gainPercent: number;
    count: number;
    allocation: number;
    targetAllocation: number;
    // Add missing properties from error
    name: string;
    percentage: number;
  }
  
  export interface PortfolioSummary {
    totalValue: number;
    totalCost: number;
    totalGain: number;
    totalGainPercent: number;
    totalIncome: number;
    totalYield: number;
    totalHoldings: number;
    averageYield: number;
    annualIncome: number;
    monthlyIncome: number;
    irr?: number;
  }
  
  export interface MonthlyDividend {
    month: string;
    year: number;
    total: number;
    payments: DividendPayment[];
  }
  
  export interface DividendProjection {
    month: string;
    total: number;
  }