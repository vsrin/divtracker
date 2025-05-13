// Define types for dividend data

export interface DividendPayment {
    id: string;
    holdingId: string;
    symbol: string;
    companyName: string;
    date: string;
    amount: number;
    amountPerShare: number;
    shares: number;
    tax: number;
    currency: string;
  }
  
  export interface MonthlyDividend {
    month: string;
    year: number;
    total: number;
    payments: DividendPayment[];
  }
  
  export interface YearlyDividend {
    year: number;
    total: number;
    monthly: {
      [month: string]: number;
    };
    byHolding: {
      [symbol: string]: number;
    };
  }
  
  export interface DividendProjection {
    annual: number;
    monthly: number;
    nextPayments: {
      date: string;
      symbol: string;
      estimatedAmount: number;
    }[];
    monthlyProjections: {
      month: string;
      amount: number;
    }[];
  }
  
  export interface DividendGrowth {
    year: number;
    month: string;
    amount: number;
  }
  
  export interface DividendSummary {
    annualIncome: number;
    monthlyAverage: number;
    yield: number;
    yieldOnCost: number;
    payoutRatio: number;
    growthRate: number; // average annual growth rate
    topContributors: {
      symbol: string;
      contribution: number;
      percentage: number;
    }[];
  }