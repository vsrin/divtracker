import {
    Holding,
    DividendPayment,
    Transaction
  } from '../types';
  
  /**
   * Parse a CSV file from the brokerage, specifically optimized for the user's
   * Portfolio_Positions_May132025.csv format which has the following columns:
   * - Account Number
   * - Account Name
   * - Symbol
   * - Description
   * - Quantity
   * - Last Price
   * - Last Price Change
   * - Current Value
   * - Percent Of Account
   * - Ex-Date
   * - Amount Per Share
   * - Pay Date
   * - Dist. Yield
   * - Distribution yield as of
   * - SEC Yield
   * - SEC yield as of
   * - Est. Annual Income
   * - Type
   */
  export const parseCSV = async (file: File): Promise<{
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
          
          console.log("CSV loaded, total lines:", lines.length);
          console.log("First line preview:", lines[0]);
          
          // Find the header row - looking for the specific headers in this CSV format
          let headerIndex = -1;
          for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].toLowerCase();
            if (
              line.includes('symbol') && 
              line.includes('description') && 
              line.includes('quantity') &&
              line.includes('current value')
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
            accountNumber: headers.findIndex(h => h.includes('account') && h.includes('number')),
            accountName: headers.findIndex(h => h.includes('account') && h.includes('name')),
            symbol: headers.findIndex(h => h === 'symbol'),
            description: headers.findIndex(h => h === 'description'),
            quantity: headers.findIndex(h => h === 'quantity'),
            lastPrice: headers.findIndex(h => h.includes('last') && h.includes('price') && !h.includes('change')),
            priceChange: headers.findIndex(h => h.includes('price') && h.includes('change')),
            currentValue: headers.findIndex(h => h.includes('current') && h.includes('value')),
            percentOfAccount: headers.findIndex(h => h.includes('percent') && h.includes('account')),
            exDate: headers.findIndex(h => h.includes('ex-date')),
            amountPerShare: headers.findIndex(h => h.includes('amount') && h.includes('per') && h.includes('share')),
            payDate: headers.findIndex(h => h.includes('pay') && h.includes('date')),
            distYield: headers.findIndex(h => h.includes('dist') && h.includes('yield')),
            yieldAsOf: headers.findIndex(h => h.includes('yield') && h.includes('as of')),
            secYield: headers.findIndex(h => h.includes('sec') && h.includes('yield') && !h.includes('as of')),
            secYieldAsOf: headers.findIndex(h => h.includes('sec') && h.includes('yield') && h.includes('as of')),
            estAnnualIncome: headers.findIndex(h => h.includes('est') && h.includes('annual') && h.includes('income')),
            type: headers.findIndex(h => h === 'type')
          };
          
          console.log("Column mapping:", columnMap);
          
          // Validate we found essential columns
          const essentialColumns = ['symbol', 'quantity', 'lastPrice', 'currentValue'];
          const missingColumns = essentialColumns.filter(col => 
            columnMap[col as keyof typeof columnMap] === -1
          );
          
          if (missingColumns.length > 0) {
            console.warn(`Missing essential columns: ${missingColumns.join(', ')}. 
              Will attempt to continue with best guess.`);
          }
          
          // Process data rows
          const holdings: Holding[] = [];
          const dividends: DividendPayment[] = [];
          const transactions: Transaction[] = [];
          
          let totalPortfolioValue = 0;
          
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
            
            console.log(`Row ${i} has ${values.length} values vs ${headers.length} headers`);
            
            // Skip rows that don't have enough fields or appear to be headers/footers
            if (values.length < Math.min(10, headers.length) || 
                values.some(v => v.toLowerCase().includes('total')) ||
                !values[columnMap.symbol] ||
                values[columnMap.symbol].toLowerCase() === 'symbol') {
              console.log(`Skipping row ${i}: appears to be a header, footer, or has insufficient data`);
              continue;
            }
            
            // Extract key data
            const symbol = columnMap.symbol >= 0 && columnMap.symbol < values.length 
              ? values[columnMap.symbol].replace(/"/g, '') 
              : '';
            
            // Skip rows without a valid symbol
            if (!symbol || symbol.toLowerCase() === 'symbol') {
              console.log(`Skipping row ${i}: no valid symbol`);
              continue;
            }
            
            // Extract the description/name
            const name = columnMap.description >= 0 && columnMap.description < values.length 
              ? values[columnMap.description].replace(/"/g, '') 
              : symbol;
              
            // Parse quantity/shares
            let shares = 0;
            if (columnMap.quantity >= 0 && columnMap.quantity < values.length) {
              const sharesStr = values[columnMap.quantity].replace(/[$,"\s]/g, '');
              shares = parseFloat(sharesStr) || 0;
            }
            
            // Skip if no shares (likely a header or summary row)
            if (shares <= 0) {
              console.log(`Skipping row ${i}: no shares for ${symbol}`);
              continue;
            }
            
            // Parse price
            let currentPrice = 0;
            if (columnMap.lastPrice >= 0 && columnMap.lastPrice < values.length) {
              const priceStr = values[columnMap.lastPrice].replace(/[$,"\s]/g, '');
              currentPrice = parseFloat(priceStr) || 0;
            }
            
            // Parse current value
            let currentValue = 0;
            if (columnMap.currentValue >= 0 && columnMap.currentValue < values.length) {
              const valueStr = values[columnMap.currentValue].replace(/[$,"\s]/g, '');
              currentValue = parseFloat(valueStr) || 0;
            } else if (currentPrice > 0 && shares > 0) {
              currentValue = currentPrice * shares;
            }
            
            // Add to the total portfolio value
            totalPortfolioValue += currentValue;
            
            // Calculate cost basis (we don't have this directly, so estimate from current value)
            // In a real scenario, we'd want actual cost basis data
            let costBasis = currentValue; // Default for now
            let costPerShare = currentPrice; // Default for now
            
            // Parse dividend yield
            let dividendYield = 0;
            if (columnMap.distYield >= 0 && columnMap.distYield < values.length) {
              const yieldStr = values[columnMap.distYield].replace(/[%,"\s]/g, '');
              dividendYield = parseFloat(yieldStr) || 0;
            }
            
            // Parse estimated annual income
            let dividendAmount = 0;
            if (columnMap.estAnnualIncome >= 0 && columnMap.estAnnualIncome < values.length) {
              const incomeStr = values[columnMap.estAnnualIncome].replace(/[$,"\s]/g, '');
              dividendAmount = parseFloat(incomeStr) || 0;
            } else if (dividendYield > 0) {
              // Calculate from yield if we have it
              dividendAmount = (dividendYield / 100) * currentValue;
            }
            
            // Determine asset class based on description or symbol
            let assetClass: 'Stocks' | 'Funds' | 'Cash' | 'Commodities' | 'Other' = 'Stocks';
            const desc = name.toLowerCase();
            
            if (desc.includes('etf') || 
                desc.includes('fund') || 
                desc.includes('index') || 
                symbol.includes('voo') || 
                symbol.includes('spy') || 
                symbol.includes('vti')) {
              assetClass = 'Funds';
            } else if (desc.includes('gold') || 
                      desc.includes('silver') || 
                      desc.includes('platinum') || 
                      symbol === 'gld' || 
                      symbol === 'slv') {
              assetClass = 'Commodities';
            } else if (desc.includes('cash') || 
                      desc.includes('money market') || 
                      symbol.includes('cash')) {
              assetClass = 'Cash';
            }
            
            // Calculate annual income from dividend yield
            const annualIncome = dividendYield > 0 ? (dividendYield / 100) * currentValue : dividendAmount;
            
            // Create holding object
            const holding: Holding = {
              id: `holding-${symbol}-${i}`,
              symbol,
              name,
              shares,
              costPerShare,
              costBasis,
              currentValue,
              currentPrice,
              gain: currentValue - costBasis,
              gainPercent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
              dividendYield,
              dividendAmount,
              dividendFrequency: 'quarterly', // Default assumption
              dividendGrowth: 0, // Would need historical data
              sector: 'Other', // Would need sector data
              assetClass,
              allocation: 0, // Calculate after processing all holdings
              irr: 0, // Would need transaction history
              shareInPortfolio: 0, // Calculate after processing all holdings
              annualIncome // Add the calculated annual income
            };
            
            holdings.push(holding);
            console.log(`Added holding ${symbol} with value ${currentValue}`);
            
            // Check if we have dividend details
            if (columnMap.amountPerShare >= 0 && columnMap.amountPerShare < values.length &&
                columnMap.payDate >= 0 && columnMap.payDate < values.length) {
                
              const amountPerShareStr = values[columnMap.amountPerShare].replace(/[$,"\s]/g, '');
              const amountPerShare = parseFloat(amountPerShareStr) || 0;
              
              if (amountPerShare > 0) {
                const payDateStr = values[columnMap.payDate].trim();
                let payDate = new Date().toISOString().split('T')[0]; // Default to today
                
                // Try to parse the pay date
                if (payDateStr && payDateStr !== "N/A" && payDateStr !== "--") {
                  try {
                    // Try different date formats
                    let dateObj: Date | null = null;
                    
                    // Try MM/DD/YYYY
                    if (payDateStr.includes('/')) {
                      const parts = payDateStr.split('/');
                      if (parts.length === 3) {
                        dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                      }
                    } 
                    // Try YYYY-MM-DD
                    else if (payDateStr.includes('-')) {
                      dateObj = new Date(payDateStr);
                    }
                    
                    if (dateObj && !isNaN(dateObj.getTime())) {
                      payDate = dateObj.toISOString().split('T')[0];
                    }
                  } catch (e) {
                    console.warn(`Could not parse pay date: ${payDateStr}`);
                  }
                }
                
                // Calculate dividend amount
                const amount = amountPerShare * shares;
                
                const dividend: DividendPayment = {
                  id: `dividend-${symbol}-${payDate}`,
                  holdingId: holding.id,
                  symbol,
                  companyName: name,
                  date: payDate,
                  amount,
                  amountPerShare,
                  shares,
                  tax: 0, // No tax info in the CSV
                  currency: 'USD'
                };
                
                dividends.push(dividend);
                console.log(`Added dividend for ${symbol} on ${payDate}: $${amount}`);
                
                // Add as transaction too
                const transaction: Transaction = {
                  id: `transaction-${symbol}-${payDate}`,
                  date: payDate,
                  type: 'dividend',
                  symbol,
                  companyName: name,
                  shares: 0,
                  price: 0,
                  amount,
                  fees: 0,
                  tax: 0,
                  currency: 'USD',
                  notes: 'Dividend payment'
                };
                
                transactions.push(transaction);
              }
            }
          }
          
          // If portfolio value is 0, use a default value
          if (totalPortfolioValue <= 0) {
            totalPortfolioValue = 1; // To avoid division by zero
          }
          
          // Calculate allocation percentages
          holdings.forEach(holding => {
            holding.allocation = (holding.currentValue / totalPortfolioValue) * 100;
            holding.shareInPortfolio = (holding.currentValue / totalPortfolioValue) * 100;
          });
          
          console.log("Parsing complete:", {
            holdings: holdings.length,
            dividends: dividends.length,
            transactions: transactions.length,
            totalPortfolioValue
          });
          
          if (holdings.length === 0) {
            console.warn("No holdings found in the CSV. Creating a placeholder.");
            // Create a placeholder holding if none were found
            holdings.push({
              id: 'placeholder',
              symbol: 'PLACEHOLDER',
              name: 'CSV could not be properly parsed',
              shares: 1,
              costPerShare: 100,
              costBasis: 100,
              currentValue: 100,
              currentPrice: 100,
              gain: 0,
              gainPercent: 0,
              dividendYield: 0,
              dividendAmount: 0,
              dividendFrequency: 'quarterly',
              dividendGrowth: 0,
              sector: 'Other',
              assetClass: 'Other',
              allocation: 100,
              irr: 0,
              shareInPortfolio: 100,
              annualIncome: 0 // Add annual income to the placeholder
            });
          }
          
          resolve({
            holdings,
            dividends,
            transactions
          });
        } catch (error) {
          console.error("CSV parsing error:", error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // For compatibility
  export const parsePortfolioCSV = parseCSV;
  
  /**
   * Parse a CSV using Claude API for more robust handling
   * This is a stub - we'll implement this with Claude API integration
   */
  export const parseCSVWithClaude = async (file: File, apiKey: string): Promise<{
    holdings: Holding[];
    dividends: DividendPayment[];
    transactions: Transaction[];
  }> => {
    // This would be implemented with Claude API integration
    // For now, fall back to the standard parser
    console.log("Claude API parsing not yet implemented, using standard parser");
    return parseCSV(file);
  };