export interface Transaction {
    id: string;
    date: string;
    type: 'buy' | 'sell' | 'dividend' | 'split' | 'transfer' | 'tax';
    symbol: string;
    companyName: string;
    shares: number;
    price: number;
    amount: number;
    fees: number;
    tax: number;
    currency: string;
    notes: string;
  }
  
  export interface TransactionHistory {
    transactions: Transaction[];
    totalBuys: number;
    totalSells: number;
    totalDividends: number;
    totalFees: number;
    totalTaxes: number;
  }