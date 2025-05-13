import {
    Holding,
    DividendPayment,
    Transaction
  } from '../types';
  
  /**
   * Parse a transaction history CSV file 
   * Expected format:
   * - Run Date: String
   * - Action: String
   * - Symbol: String
   * - Description: String
   * - Type: String
   * - Quantity: Float
   * - Price ($): Float
   * - Commission ($): String
   * - Fees ($): String
   * - Accrued Interest ($): String
   * - Amount ($): Float
   * - Cash Balance ($): Float
   * - Settlement Date: String
   */
  export const parseTransactionHistoryCSV = async (file: File): Promise<{
    holdings: Holding[];
    dividends: DividendPayment[];
    transactions: Transaction[];
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target || !event.target.result) {
            throw new Error('Failed to read file');
          }
          
          const csvText = event.target.result as string;
          const lines = csvText.split('\n');
          
          console.log("Transaction History CSV loaded, total lines:", lines.length);
          
          // Find the header row - it should contain columns like 'Action', 'Symbol', etc.
          let headerIndex = -1;
          for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].toLowerCase();
            if (
              line.includes('action') && 
              line.includes('symbol') && 
              line.includes('amount')
            ) {
              headerIndex = i;
              break;
            }
          }
          
          if (headerIndex === -1) {
            console.log("Could not find header row with expected columns. Using line 0 as header.");
            headerIndex = 0;
          }
          
          console.log("Using header at index:", headerIndex);
          console.log("Header line:", lines[headerIndex]);
          
          // Parse the header to identify column positions
          const headers = lines[headerIndex].split(',').map(h => h.trim().toLowerCase());
          console.log("Parsed headers:", headers);
          
          // Map column indices to our expected format
          const columnMap = {
            runDate: headers.findIndex(h => h.includes('run') && h.includes('date')),
            action: headers.findIndex(h => h === 'action'),
            symbol: headers.findIndex(h => h === 'symbol'),
            description: headers.findIndex(h => h === 'description'),
            type: headers.findIndex(h => h === 'type'),
            quantity: headers.findIndex(h => h === 'quantity'),
            price: headers.findIndex(h => h.includes('price')),
            commission: headers.findIndex(h => h.includes('commission')),
            fees: headers.findIndex(h => h.includes('fees')),
            accruedInterest: headers.findIndex(h => h.includes('accrued') && h.includes('interest')),
            amount: headers.findIndex(h => h.includes('amount')),
            cashBalance: headers.findIndex(h => h.includes('cash') && h.includes('balance')),
            settlementDate: headers.findIndex(h => h.includes('settlement') && h.includes('date'))
          };
          
          console.log("Column mapping:", columnMap);
          
          // Validate we found essential columns
          const essentialColumns = ['action', 'symbol', 'amount'];
          const missingColumns = essentialColumns.filter(col => 
            columnMap[col as keyof typeof columnMap] === -1
          );
          
          if (missingColumns.length > 0) {
            console.warn(`Missing essential columns: ${missingColumns.join(', ')}. 
              Will attempt to continue with best guess.`);
          }
          
          // Process data rows
          const transactions: Transaction[] = [];
          const holdings: Holding[] = new Array<Holding>();
          const dividends: DividendPayment[] = [];
          
          // Keep track of current positions built from transactions
          const positionTracker: Record<string, {
            symbol: string,
            name: string,
            quantity: number,
            costBasis: number,
            lastPrice: number
          }> = {};
          
          for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Handle CSV fields that might contain commas within quotes
            const values: string[] = [];
            let parsedValue = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              
              if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(parsedValue.trim());
                parsedValue = '';
              } else {
                parsedValue += char;
              }
            }
            
            // Add the last value
            values.push(parsedValue.trim());
            
            // Skip rows that don't have enough fields
            if (values.length < Math.min(5, headers.length)) {
              console.log(`Skipping row ${i}: insufficient data`);
              continue;
            }
            
            // Extract action and symbol
            const action = columnMap.action >= 0 && columnMap.action < values.length 
              ? values[columnMap.action].replace(/"/g, '').trim() 
              : '';
              
            const symbol = columnMap.symbol >= 0 && columnMap.symbol < values.length 
              ? values[columnMap.symbol].replace(/"/g, '').trim() 
              : '';
              
            // Skip rows without valid action or symbol
            if (!action || !symbol) {
              console.log(`Skipping row ${i}: missing action or symbol`);
              continue;
            }
            
            // Extract description
            const description = columnMap.description >= 0 && columnMap.description < values.length 
              ? values[columnMap.description].replace(/"/g, '').trim() 
              : '';
              
            // Extract settlement date
            const settlementDate = columnMap.settlementDate >= 0 && columnMap.settlementDate < values.length 
              ? values[columnMap.settlementDate].replace(/"/g, '').trim() 
              : '';
              
            // Use settlement date or run date, with fallback to current date
            const date = settlementDate || 
              (columnMap.runDate >= 0 && columnMap.runDate < values.length 
                ? values[columnMap.runDate].replace(/"/g, '').trim() 
                : new Date().toISOString().split('T')[0]);
                
            // Parse quantity
            let quantity = 0;
            if (columnMap.quantity >= 0 && columnMap.quantity < values.length) {
              const quantityStr = values[columnMap.quantity].replace(/[$,"\s]/g, '');
              quantity = parseFloat(quantityStr) || 0;
            }
            
            // Parse price
            let price = 0;
            if (columnMap.price >= 0 && columnMap.price < values.length) {
              const priceStr = values[columnMap.price].replace(/[$,"\s]/g, '');
              price = parseFloat(priceStr) || 0;
            }
            
            // Parse amount
            let amount = 0;
            if (columnMap.amount >= 0 && columnMap.amount < values.length) {
              const amountStr = values[columnMap.amount].replace(/[$,"\s]/g, '');
              amount = parseFloat(amountStr) || 0;
            }
            
            // Parse fees
            let fees = 0;
            if (columnMap.fees >= 0 && columnMap.fees < values.length) {
              const feesStr = values[columnMap.fees].replace(/[$,"\s]/g, '');
              fees = parseFloat(feesStr) || 0;
            }
            
            // Parse commission
            let commission = 0;
            if (columnMap.commission >= 0 && columnMap.commission < values.length) {
              const commissionStr = values[columnMap.commission].replace(/[$,"\s]/g, '');
              commission = parseFloat(commissionStr) || 0;
            }
            
            // Combine all fees
            const totalFees = fees + commission;
            
            // Determine transaction type based on action and description
            let transactionType: 'buy' | 'sell' | 'dividend' | 'split' | 'transfer' | 'tax' = 'buy';
            
            const actionLower = action.toLowerCase();
            const descLower = description.toLowerCase();
            
            if (actionLower.includes('buy') || actionLower.includes('purchase')) {
              transactionType = 'buy';
            } else if (actionLower.includes('sell') || actionLower.includes('sale')) {
              transactionType = 'sell';
            } else if (
              actionLower.includes('dividend') || 
              descLower.includes('dividend') || 
              descLower.includes('dist') || 
              descLower.includes('income')
            ) {
              transactionType = 'dividend';
            } else if (actionLower.includes('split') || descLower.includes('split')) {
              transactionType = 'split';
            } else if (
              actionLower.includes('transfer') || 
              actionLower.includes('deposit') || 
              actionLower.includes('withdrawal')
            ) {
              transactionType = 'transfer';
            } else if (actionLower.includes('tax') || descLower.includes('tax')) {
              transactionType = 'tax';
            }
            
            // Create transaction object
            const transaction: Transaction = {
              id: `transaction-${symbol}-${date}-${i}`,
              date,
              type: transactionType,
              symbol,
              companyName: description || symbol,
              shares: quantity,
              price,
              amount: Math.abs(amount), // Make amount positive for consistency
              fees: totalFees,
              tax: 0, // Tax amount not available in this format
              currency: 'USD',
              notes: `${action}: ${description}`
            };
            
            transactions.push(transaction);
            console.log(`Added transaction: ${transactionType} ${symbol} ${date}`);
            
            // If this is a dividend, also add it to dividends array
            if (transactionType === 'dividend') {
              const dividend: DividendPayment = {
                id: `dividend-${symbol}-${date}`,
                holdingId: `holding-${symbol}`,
                symbol,
                companyName: description || symbol,
                date,
                amount: Math.abs(amount),
                amountPerShare: quantity > 0 ? Math.abs(amount) / quantity : 0,
                shares: quantity,
                tax: 0, // Tax amount not available
                currency: 'USD'
              };
              
              dividends.push(dividend);
              console.log(`Added dividend: ${symbol} ${date} $${Math.abs(amount)}`);
            }
            
            // Update position tracker for buys and sells
            if (transactionType === 'buy' || transactionType === 'sell') {
              if (!positionTracker[symbol]) {
                positionTracker[symbol] = {
                  symbol,
                  name: description || symbol,
                  quantity: 0,
                  costBasis: 0,
                  lastPrice: price
                };
              }
              
              // Update quantity and cost basis
              if (transactionType === 'buy') {
                const currentCostBasis = positionTracker[symbol].costBasis;
                const currentQuantity = positionTracker[symbol].quantity;
                
                // Calculate new average cost basis
                if (currentQuantity + quantity > 0) {
                  positionTracker[symbol].costBasis = 
                    (currentCostBasis * currentQuantity + price * quantity) / 
                    (currentQuantity + quantity);
                }
                
                positionTracker[symbol].quantity += quantity;
              } else if (transactionType === 'sell') {
                positionTracker[symbol].quantity -= quantity;
                // We maintain the same cost basis when selling
              }
              
              // Update last price
              if (price > 0) {
                positionTracker[symbol].lastPrice = price;
              }
            }
          }
          
          // Convert position tracker to holdings
          for (const [symbol, position] of Object.entries(positionTracker)) {
            // Only include positions that still have shares
            if (position.quantity > 0) {
              const currentValue = position.quantity * position.lastPrice;
              const costBasis = position.quantity * position.costBasis;
              const gain = currentValue - costBasis;
              const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
              
              // Calculate dividend yield based on dividend transactions for this symbol
              const annualDividends = calculateAnnualDividends(dividends, symbol);
              const dividendYield = currentValue > 0 ? (annualDividends / currentValue) * 100 : 0;
              
              const holding: Holding = {
                id: `holding-${symbol}`,
                symbol,
                name: position.name,
                shares: position.quantity,
                costPerShare: position.costBasis,
                costBasis,
                currentValue,
                currentPrice: position.lastPrice,
                gain,
                gainPercent,
                dividendYield,
                dividendAmount: annualDividends,
                dividendFrequency: determineDividendFrequency(dividends, symbol),
                dividendGrowth: calculateDividendGrowth(dividends, symbol),
                sector: 'Other', // Would need additional data
                assetClass: determineAssetClass(symbol, position.name),
                allocation: 0, // Will calculate after all positions are processed
                irr: 0, // Would need a more complex calculation
                shareInPortfolio: 0, // Will calculate after all positions are processed
                annualIncome: annualDividends // Use annualDividends as annualIncome
              };
              
              holdings.push(holding);
              console.log(`Added holding: ${symbol} ${position.quantity} shares`);
            }
          }
          
          // Calculate allocation percentages
          const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
          
          holdings.forEach(holding => {
            holding.allocation = (holding.currentValue / totalValue) * 100;
            holding.shareInPortfolio = (holding.currentValue / totalValue) * 100;
          });
          
          console.log("Transaction processing complete:", {
            transactions: transactions.length,
            dividends: dividends.length,
            holdings: holdings.length
          });
          
          resolve({
            holdings,
            dividends,
            transactions
          });
        } catch (error) {
          console.error("Transaction CSV parsing error:", error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  /**
   * Determine asset class based on symbol and name
   */
  function determineAssetClass(
    symbol: string, 
    name: string
  ): 'Stocks' | 'Funds' | 'Cash' | 'Commodities' | 'Other' {
    const symbolLower = symbol.toLowerCase();
    const nameLower = name.toLowerCase();
    
    if (
      symbolLower.includes('etf') || 
      symbolLower.includes('voo') || 
      symbolLower.includes('spy') || 
      symbolLower.includes('vti') || 
      nameLower.includes('fund') || 
      nameLower.includes('etf') || 
      nameLower.includes('index')
    ) {
      return 'Funds';
    } else if (
      symbolLower.includes('gold') || 
      symbolLower.includes('slv') || 
      symbolLower.includes('gld') || 
      nameLower.includes('gold') || 
      nameLower.includes('silver') || 
      nameLower.includes('metal')
    ) {
      return 'Commodities';
    } else if (
      symbolLower.includes('cash') || 
      symbolLower.includes('mmf') || 
      nameLower.includes('cash') || 
      nameLower.includes('money market')
    ) {
      return 'Cash';
    } else {
      return 'Stocks'; // Default to stocks
    }
  }
  
  /**
   * Calculate annual dividends for a symbol based on historical payments
   */
  function calculateAnnualDividends(dividends: DividendPayment[], symbol: string): number {
    const symbolDividends = dividends.filter(d => d.symbol === symbol);
    
    if (symbolDividends.length === 0) {
      return 0;
    }
    
    // Get unique years in the dividend history
    const years = new Set<number>();
    symbolDividends.forEach(d => {
      const year = new Date(d.date).getFullYear();
      years.add(year);
    });
    
    if (years.size === 0) {
      return 0;
    }
    
    // Calculate total dividends per year
    const dividendsByYear: Record<number, number> = {};
    
    symbolDividends.forEach(d => {
      const year = new Date(d.date).getFullYear();
      if (!dividendsByYear[year]) {
        dividendsByYear[year] = 0;
      }
      dividendsByYear[year] += d.amount;
    });
    
    // Get the most recent complete year with dividends
    const currentYear = new Date().getFullYear();
    let mostRecentYear = Math.max(...Array.from(years).filter(y => y < currentYear));
    
    // If no complete years are available, use the current year's dividends
    if (!mostRecentYear || mostRecentYear < 2000) {
      mostRecentYear = currentYear;
    }
    
    // Return the dividend amount for the most recent year, or average if not available
    if (dividendsByYear[mostRecentYear]) {
      return dividendsByYear[mostRecentYear];
    } else {
      // Calculate average across all years
      const totalDividends = Object.values(dividendsByYear).reduce((sum, amount) => sum + amount, 0);
      return totalDividends / Object.keys(dividendsByYear).length;
    }
  }
  
  /**
   * Determine dividend frequency based on historical payments
   */
  function determineDividendFrequency(
    dividends: DividendPayment[], 
    symbol: string
  ): 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'irregular' {
    const symbolDividends = dividends.filter(d => d.symbol === symbol);
    
    if (symbolDividends.length <= 1) {
      return 'quarterly'; // Default to quarterly if insufficient data
    }
    
    // Sort dividends by date
    const sortedDividends = [...symbolDividends].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate intervals between payments in months
    const intervals: number[] = [];
    
    for (let i = 1; i < sortedDividends.length; i++) {
      const prevDate = new Date(sortedDividends[i - 1].date);
      const currDate = new Date(sortedDividends[i].date);
      
      const monthsDiff = 
        (currDate.getFullYear() - prevDate.getFullYear()) * 12 + 
        (currDate.getMonth() - prevDate.getMonth());
        
      intervals.push(monthsDiff);
    }
    
    if (intervals.length === 0) {
      return 'quarterly'; // Default
    }
    
    // Calculate average interval
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    // Determine frequency based on average interval
    if (avgInterval <= 1.5) {
      return 'monthly';
    } else if (avgInterval <= 4) {
      return 'quarterly';
    } else if (avgInterval <= 8) {
      return 'semi-annual';
    } else {
      return 'annual';
    }
  }
  
  /**
   * Calculate dividend growth rate based on historical payments
   */
  function calculateDividendGrowth(dividends: DividendPayment[], symbol: string): number {
    const symbolDividends = dividends.filter(d => d.symbol === symbol);
    
    if (symbolDividends.length < 2) {
      return 0; // Not enough data to calculate growth
    }
    
    // Group dividends by year
    const dividendsByYear: Record<number, { total: number, count: number }> = {};
    
    symbolDividends.forEach(d => {
      const year = new Date(d.date).getFullYear();
      if (!dividendsByYear[year]) {
        dividendsByYear[year] = { total: 0, count: 0 };
      }
      dividendsByYear[year].total += d.amount;
      dividendsByYear[year].count++;
    });
    
    // Get years with complete dividend data
    const years = Object.keys(dividendsByYear)
      .map(Number)
      .filter(year => {
        // Assume a year is complete if it has at least as many payments as the most frequent year
        const maxCount = Math.max(...Object.values(dividendsByYear).map(d => d.count));
        return dividendsByYear[year].count >= maxCount;
      })
      .sort();
    
    if (years.length < 2) {
      return 0; // Not enough complete years to calculate growth
    }
    
    // Calculate annual dividend amount for oldest and newest years
    const oldestYear = years[0];
    const newestYear = years[years.length - 1];
    
    const oldestAmount = dividendsByYear[oldestYear].total;
    const newestAmount = dividendsByYear[newestYear].total;
    
    // Calculate compound annual growth rate (CAGR)
    const years_held = newestYear - oldestYear;
    
    if (years_held <= 0 || oldestAmount <= 0) {
      return 0;
    }
    
    const cagr = (Math.pow(newestAmount / oldestAmount, 1 / years_held) - 1) * 100;
    return cagr;
  }