// src/utils/dataMigration.ts

/**
 * Utility to consolidate portfolio data across different localStorage keys
 * This helps migrate data between the two different storage patterns
 */
export const migratePortfolioData = () => {
    try {
      // Check all possible storage locations
      const holdingsOld = localStorage.getItem('holdings');
      const holdingsNew = localStorage.getItem('portfolio-holdings');
      const transactionsOld = localStorage.getItem('transactions');
      const transactionsNew = localStorage.getItem('portfolio-transactions');
      const dividends = localStorage.getItem('portfolio-dividends');
      
      // Migrate holdings
      if (holdingsOld || holdingsNew) {
        const parsedHoldings = JSON.parse(holdingsOld || holdingsNew || '[]');
        localStorage.setItem('holdings', JSON.stringify(parsedHoldings));
        localStorage.setItem('portfolio-holdings', JSON.stringify(parsedHoldings));
        console.log(`Migrated ${parsedHoldings.length} holdings`);
      }
      
      // Migrate transactions
      if (transactionsOld || transactionsNew) {
        const parsedTransactions = JSON.parse(transactionsOld || transactionsNew || '[]');
        localStorage.setItem('transactions', JSON.stringify(parsedTransactions));
        localStorage.setItem('portfolio-transactions', JSON.stringify(parsedTransactions));
        console.log(`Migrated ${parsedTransactions.length} transactions`);
      }
      
      // Just preserve dividends
      if (dividends) {
        const parsedDividends = JSON.parse(dividends);
        localStorage.setItem('portfolio-dividends', JSON.stringify(parsedDividends));
        console.log(`Preserved ${parsedDividends.length} dividends`);
      }
      
      console.log('Data migration completed successfully');
      return true;
    } catch (error) {
      console.error('Data migration failed:', error);
      return false;
    }
  };
  
  /**
   * Quick check to see if there is any portfolio data in any format
   */
  export const hasAnyPortfolioData = () => {
    return !!(
      localStorage.getItem('holdings') ||
      localStorage.getItem('portfolio-holdings') ||
      localStorage.getItem('transactions') ||
      localStorage.getItem('portfolio-transactions') ||
      localStorage.getItem('portfolio-dividends')
    );
  };
  
  /**
   * Run the migration on application startup
   */
  export const runStartupDataMigration = () => {
    if (hasAnyPortfolioData()) {
      return migratePortfolioData();
    }
    return false;
  };