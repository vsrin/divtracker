// src/types/dividend.ts
export interface DividendPayment {
    id: string;
    holdingId?: string; // Made optional to fix type error
    date: string;
    symbol: string;
    companyName: string;
    amount: number;
    shares: number;
    amountPerShare: number;
    tax: number;
    currency: string;
  }
  
  export interface DividendMetrics {
    annualIncome: number;
    monthlyAverage: number;
    quarterlyTotal: number;
    annualYield: number;
    averageYield: number;
  }
  
  export interface MonthlyDividends {
    month: string; // Format: YYYY-MM
    total: number;
    payments: DividendPayment[];
  }