// src/types/index.ts
// Re-export types explicitly to resolve ambiguity
// Import from portfolio first
import { 
    Holding as PortfolioHolding,
    DividendPayment as PortfolioDividendPayment,
    Transaction as PortfolioTransaction,
    AssetAllocation as PortfolioAssetAllocation,
    PortfolioSummary as PortfolioSummaryType,
    MonthlyDividend as PortfolioMonthlyDividend,
    DividendProjection as PortfolioDividendProjection,
    TransactionType as PortfolioTransactionType
  } from './portfolio';
  
  // Import from dividend and transaction but rename to avoid conflicts
  import {
    DividendPayment as DividendModuleDividendPayment
  } from './dividend';
  
  import {
    Transaction as TransactionModuleTransaction
  } from './transaction';
  
  // Export portfolio types first (these will be the primary types)
  export type Holding = PortfolioHolding;
  export type AssetAllocation = PortfolioAssetAllocation;
  export type PortfolioSummary = PortfolioSummaryType;
  export type MonthlyDividend = PortfolioMonthlyDividend;
  export type DividendProjection = PortfolioDividendProjection;
  export type TransactionType = PortfolioTransactionType;
  
  // Explicitly export the types that had conflicts
  export type DividendPayment = PortfolioDividendPayment;
  export type Transaction = PortfolioTransaction;