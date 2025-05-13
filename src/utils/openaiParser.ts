// src/utils/openaiParser.ts
import {
    Holding,
    DividendPayment,
    Transaction
  } from '../types';
  
  // Define these types locally to avoid import errors
  type AssetClass = 'Stocks' | 'Funds' | 'Cash' | 'Commodities' | 'Other';
  
  interface ParsedHolding {
    symbol: string;
    name?: string;
    shares?: number;
    price?: number;
    value?: number;
    dividendYield?: number;
    annualIncome?: number;
    assetClass?: string;
    costPerShare?: number;
    costBasis?: number;
    currentValue?: number;
    currentPrice?: number;
    gain?: number;
    gainPercent?: number;
    dividendAmount?: number;
  }
  
  /**
   * Parse a CSV file using OpenAI's API for more accurate data extraction
   * 
   * @param file The CSV file to parse
   * @param apiKey OpenAI API key
   * @returns Parsed portfolio data
   */
  export const parseCSVWithOpenAI = async (
    file: File, 
    apiKey: string
  ): Promise<{
    holdings: Holding[];
    dividends: DividendPayment[];
    transactions: Transaction[];
    fileType?: 'positions' | 'transactions';
  }> => {
    try {
      if (!apiKey) {
        throw new Error('OpenAI API key is required');
      }
      
      const fileContent = await readFileAsText(file);
      const filename = file.name.toLowerCase();
      
      // Determine if this is a positions or transactions file
      const isTransactions = 
        filename.includes('history') || 
        filename.includes('transaction') || 
        (fileContent.toLowerCase().includes('action') && 
         fileContent.toLowerCase().includes('settlement date'));
      
      const fileType: 'positions' | 'transactions' = isTransactions ? 'transactions' : 'positions';
      console.log(`OpenAI parser detected file type: ${fileType}`);
      
      // Create the appropriate prompt based on file type
      const prompt = createOpenAIPrompt(fileContent, fileType);
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a financial data parser specialized in dividend portfolio analysis. Extract structured data from CSV files.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      // Process the JSON response
      const parsedData = parseOpenAIResponse(result, fileType);
      
      return {
        ...parsedData,
        fileType
      };
    } catch (error) {
      console.error('Error parsing with OpenAI:', error);
      throw error;
    }
  };
  
  /**
   * Read a file as text
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  };
  
  /**
   * Create a prompt for OpenAI to parse the CSV
   */
  const createOpenAIPrompt = (csvContent: string, fileType: 'positions' | 'transactions'): string => {
    if (fileType === 'positions') {
      return `Parse this portfolio positions CSV data and extract the following information:
  1. List of holdings with symbols, names, shares, current prices, and values
  2. Dividend information for each holding (yield, amount, frequency if available)
  3. Any other relevant financial data
  
  Here's the CSV content:
  
  \`\`\`
  ${csvContent}
  \`\`\`
  
  Format your response as a JSON object with the following structure:
  {
    "holdings": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "shares": 100,
        "price": 150.25,
        "value": 15025.00,
        "dividendYield": 0.65,
        "annualIncome": 97.66,
        "assetClass": "Stocks"
      },
      // More holdings...
    ],
    "portfolioValue": 150000.00,
    "dividendIncome": 2500.00,
    "dividendYield": 1.67
  }
  
  Include as much detail as you can extract from the CSV. Make educated guesses for asset classes based on names and symbols.`;
    } else {
      return `Parse this transaction history CSV data and extract the following information:
  1. List of transactions with dates, symbols, action types (buy, sell, dividend, etc.)
  2. Dividend transactions with payment amounts and dates
  3. Buy/sell transactions with share counts and prices
  
  Here's the CSV content:
  
  \`\`\`
  ${csvContent}
  \`\`\`
  
  Format your response as a JSON object with the following structure:
  {
    "transactions": [
      {
        "date": "2025-01-15",
        "type": "buy",
        "symbol": "AAPL",
        "shares": 10,
        "price": 150.25,
        "amount": 1502.50,
        "fees": 0
      },
      {
        "date": "2025-02-15",
        "type": "dividend",
        "symbol": "MSFT",
        "shares": 20,
        "amount": 36.00,
        "description": "MICROSOFT CORP DIVIDEND"
      },
      // More transactions...
    ]
  }
  
  Categorize each transaction as one of: 'buy', 'sell', 'dividend', 'split', 'transfer', or 'tax'. Ensure dates are in YYYY-MM-DD format.`;
    }
  };
  
  /**
   * Parse OpenAI's response to extract holdings, dividends, and transactions
   */
  const parseOpenAIResponse = (
    response: any,
    fileType: 'positions' | 'transactions'
  ): {
    holdings: Holding[];
    dividends: DividendPayment[];
    transactions: Transaction[];
  } => {
    try {
      console.log('Processing OpenAI response:', response);
      
      // Get the content from OpenAI's response
      const parsedContent = response.choices?.[0]?.message?.content;
      if (!parsedContent) {
        throw new Error('No valid content in OpenAI response');
      }
      
      // Parse the JSON content
      const parsedData = JSON.parse(parsedContent);
      
      const holdings: Holding[] = [];
      const dividends: DividendPayment[] = [];
      const transactions: Transaction[] = [];
      
      if (fileType === 'positions' && parsedData.holdings) {
        // Process holdings from positions file
        parsedData.holdings.forEach((h: ParsedHolding, index: number) => {
          const currentValue = h.value || (h.price && h.shares ? h.price * h.shares : 0);
          
          // Estimate cost basis if not provided (assuming current value for now)
          const costBasis = h.costBasis || currentValue;
          const costPerShare = h.costPerShare || (h.shares && h.shares > 0 ? costBasis / h.shares : 0);
          
          // Calculate annual income from yield or provided income
          const annualIncome = h.annualIncome || 
            (h.dividendYield && currentValue ? (h.dividendYield / 100) * currentValue : 0);
          
          // Map asset class to our supported types
          const assetClass = mapAssetClass(h.assetClass || '');
          
          const holding: Holding = {
            id: `holding-${h.symbol}-${index}`,
            symbol: h.symbol,
            name: h.name || h.symbol,
            shares: h.shares || 0,
            costPerShare,
            costBasis,
            currentValue,
            currentPrice: h.price || (h.shares && h.shares > 0 ? currentValue / h.shares : 0),
            gain: currentValue - costBasis,
            gainPercent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
            dividendYield: h.dividendYield || 0,
            dividendAmount: h.dividendAmount || 0,
            dividendFrequency: 'quarterly', // Default
            dividendGrowth: 0, // Default
            sector: 'Other', // Default
            assetClass,
            allocation: 0, // Will calculate later
            irr: 0, // Default
            shareInPortfolio: 0, // Will calculate later
            annualIncome
          };
          
          holdings.push(holding);
          
          // If we have dividend info, create a projected dividend payment
          if (annualIncome > 0) {
            // Create a projected payment one quarter from now
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);
            const payDate = nextDate.toISOString().split('T')[0];
            
            const dividend: DividendPayment = {
              id: `dividend-${h.symbol}-${payDate}`,
              holdingId: holding.id,
              symbol: h.symbol,
              companyName: h.name || h.symbol,
              date: payDate,
              amount: annualIncome / 4, // Assuming quarterly
              amountPerShare: (annualIncome / 4) / (h.shares || 1),
              shares: h.shares || 0,
              tax: 0,
              currency: 'USD'
            };
            
            dividends.push(dividend);
          }
        });
        
        // Calculate allocation percentages
        const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
        holdings.forEach(h => {
          h.allocation = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
          h.shareInPortfolio = h.allocation;
        });
        
      } else if (fileType === 'transactions' && parsedData.transactions) {
        // Process transactions
        parsedData.transactions.forEach((t: any, index: number) => {
          // Ensure date is in the right format
          let dateStr = t.date;
          if (!dateStr) {
            const today = new Date();
            dateStr = today.toISOString().split('T')[0];
          }
          
          // Clean up the transaction type
          const type = getTransactionType(t.type);
          
          // Create transaction object
          const transaction: Transaction = {
            id: `transaction-${t.symbol}-${dateStr}-${index}`,
            date: dateStr,
            type,
            symbol: t.symbol || 'UNKNOWN',
            companyName: t.description || t.name || t.symbol || 'Unknown',
            shares: t.shares || 0,
            price: t.price || 0,
            amount: t.amount || 0,
            fees: t.fees || 0,
            tax: t.tax || 0,
            currency: 'USD',
            notes: t.description || `${type} transaction`
          };
          
          transactions.push(transaction);
          
          // If this is a dividend, also add it to the dividends array
          if (type === 'dividend') {
            const dividend: DividendPayment = {
              id: `dividend-${t.symbol}-${dateStr}`,
              holdingId: `holding-${t.symbol}`,
              symbol: t.symbol || 'UNKNOWN',
              companyName: t.description || t.name || t.symbol || 'Unknown',
              date: dateStr,
              amount: t.amount || 0,
              amountPerShare: (t.amount && t.shares) ? t.amount / t.shares : 0,
              shares: t.shares || 0,
              tax: t.tax || 0,
              currency: 'USD'
            };
            
            dividends.push(dividend);
          }
        });
      }
      
      return { holdings, dividends, transactions };
    } catch (error) {
      console.error('Error processing OpenAI response:', error);
      return { holdings: [], dividends: [], transactions: [] };
    }
  };
  
  /**
   * Map a string asset class to our supported types
   */
  const mapAssetClass = (assetClass: string): AssetClass => {
    const normalizedClass = assetClass.toLowerCase();
    
    if (normalizedClass.includes('stock') || normalizedClass.includes('equity')) {
      return 'Stocks';
    } else if (
      normalizedClass.includes('fund') || 
      normalizedClass.includes('etf') || 
      normalizedClass.includes('index')
    ) {
      return 'Funds';
    } else if (
      normalizedClass.includes('cash') || 
      normalizedClass.includes('money market')
    ) {
      return 'Cash';
    } else if (
      normalizedClass.includes('commodity') || 
      normalizedClass.includes('gold') || 
      normalizedClass.includes('silver')
    ) {
      return 'Commodities';
    } else {
      return 'Other';
    }
  };
  
  /**
   * Map transaction type string to our supported types
   */
  const getTransactionType = (type: string): 'buy' | 'sell' | 'dividend' | 'split' | 'transfer' | 'tax' => {
    const normalizedType = (type || '').toLowerCase();
    
    if (normalizedType.includes('buy') || normalizedType.includes('purchase')) {
      return 'buy';
    } else if (normalizedType.includes('sell') || normalizedType.includes('sale')) {
      return 'sell';
    } else if (
      normalizedType.includes('div') || 
      normalizedType.includes('distribution') || 
      normalizedType.includes('income')
    ) {
      return 'dividend';
    } else if (normalizedType.includes('split')) {
      return 'split';
    } else if (
      normalizedType.includes('transfer') || 
      normalizedType.includes('deposit') || 
      normalizedType.includes('withdrawal')
    ) {
      return 'transfer';
    } else if (normalizedType.includes('tax')) {
      return 'tax';
    } else {
      // Default to buy for unrecognized types
      return 'buy';
    }
  };