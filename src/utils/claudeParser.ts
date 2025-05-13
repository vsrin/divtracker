import {
    Holding,
    DividendPayment,
    Transaction
  } from '../types';
  
  /**
   * Claude API integration for CSV parsing
   */
  export interface ClaudeResponse {
    content: {
      type: string;
      text: string;
    }[];
  }
  
  export interface ParsedHolding {
    symbol: string;
    name?: string;
    shares?: number;
    price?: number;
    value?: number;
    dividendYield?: number;
    annualIncome?: number;
    assetClass?: string;
    // Adding missing properties that are being used in the code
    costPerShare?: number;
    costBasis?: number;
    currentValue?: number;
    currentPrice?: number;
    gain?: number;
    gainPercent?: number;
    dividendAmount?: number;
    dividendFrequency?: string;
    dividendGrowth?: number;
    sector?: string;
  }
  
  /**
   * Process a CSV file using Claude's API for more accurate parsing
   */
  export const parseCSVWithClaude = async (
    file: File, 
    apiKey: string
  ): Promise<{
    holdings: Holding[];
    dividends: DividendPayment[];
    transactions: Transaction[];
  }> => {
    try {
      if (!apiKey) {
        throw new Error('Claude API key is required');
      }
      
      // Read the file content
      const fileContent = await readFileAsText(file);
      if (!fileContent) {
        throw new Error('Failed to read file content');
      }
      
      // Create a prompt for Claude
      const prompt = createClaudePrompt(fileContent);
      
      // Call Claude API
      const response = await callClaudeAPI(prompt, apiKey);
      
      // Parse Claude's response
      const result = parseClaudeResponse(response);
      
      return result;
    } catch (error) {
      console.error('Error parsing CSV with Claude:', error);
      // Fall back to regular CSV parsing
      throw error;
    }
  };
  
  /**
   * Read a file as text
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  };
  
  /**
   * Create a prompt for Claude to parse the CSV
   */
  const createClaudePrompt = (csvContent: string): string => {
    return `I have a CSV file containing portfolio data. Please parse it and extract the following information:
  1. List of all holdings with their symbols, names, quantities, prices, and current values
  2. Dividend information (if available) for each holding
  3. Any other relevant financial data
  
  Here's the CSV content:
  
  \`\`\`
  ${csvContent}
  \`\`\`
  
  Please format your response as a JSON object with the following structure:
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
  
  Include as much detail as you can extract from the CSV, and use your judgment to categorize assets appropriately.`;
  };
  
  /**
   * Call Claude API
   */
  const callClaudeAPI = async (prompt: string, apiKey: string): Promise<ClaudeResponse> => {
    const API_URL = 'https://api.anthropic.com/v1/messages';
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${await response.text()}`);
    }
    
    return await response.json();
  };
  
  /**
   * Parse Claude's response to extract holdings, dividends, and transactions
   */
  const parseClaudeResponse = (
    response: ClaudeResponse
  ): {
    holdings: Holding[];
    dividends: DividendPayment[];
    transactions: Transaction[];
  } => {
    try {
      // Extract text from Claude's response
      const responseText = response.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('');
      
      // Find and parse JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Extract holdings
      const holdings: Holding[] = [];
      const dividends: DividendPayment[] = [];
      const transactions: Transaction[] = [];
      
      if (parsedData.holdings && Array.isArray(parsedData.holdings)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const totalValue = parsedData.portfolioValue || 
          parsedData.holdings.reduce((sum: number, h: ParsedHolding) => sum + (h.value || 0), 0);
        
        parsedData.holdings.forEach((h: ParsedHolding, index: number) => {
          // Create a holding
          const holding: Holding = {
            id: `holding-${h.symbol}-${index}`,
            symbol: h.symbol || 'UNKNOWN',
            name: h.name || h.symbol || 'Unknown Holding',
            shares: h.shares || 0,
            costPerShare: h.costPerShare || 0,
            costBasis: h.costBasis || 0,
            currentValue: h.currentValue || 0,
            currentPrice: h.currentPrice || 0,
            gain: h.gain || 0,
            gainPercent: h.gainPercent || 0,
            dividendYield: h.dividendYield || 0,
            dividendAmount: h.dividendAmount || 0,
            annualIncome: (h.dividendYield && h.currentValue) ? (h.dividendYield * h.currentValue / 100) : 0, // Calculate annual income from yield
            dividendFrequency: 'quarterly', // Default
            dividendGrowth: 0, // Default
            sector: 'Other', // Default
            assetClass: mapAssetClass(h.assetClass || 'Other'),
            allocation: 0, // Will be calculated later
            irr: 0, // Default
            shareInPortfolio: 0 // Will be calculated later
          };
          
          // Calculate gain/loss (placeholder since we don't have cost basis)
          holding.gain = holding.currentValue - holding.costBasis;
          holding.gainPercent = holding.costBasis > 0 ? (holding.gain / holding.costBasis) * 100 : 0;
          
          holdings.push(holding);
          
          // Create a dividend payment if we have annual income
          if (h.annualIncome && h.annualIncome > 0) {
            // Create placeholder for the next dividend date (quarter from now)
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);
            const payDate = nextDate.toISOString().split('T')[0];
            
            const dividend: DividendPayment = {
              id: `dividend-${h.symbol}-${payDate}`,
              holdingId: holding.id,
              symbol: h.symbol,
              companyName: h.name || h.symbol,
              date: payDate,
              amount: h.annualIncome / 4, // Assuming quarterly payments
              amountPerShare: (h.annualIncome / 4) / (h.shares || 1),
              shares: h.shares || 0,
              tax: 0,
              currency: 'USD'
            };
            
            dividends.push(dividend);
            
            // Add as transaction
            const transaction: Transaction = {
              id: `transaction-${h.symbol}-${payDate}`,
              date: payDate,
              type: 'dividend',
              symbol: h.symbol,
              companyName: h.name || h.symbol,
              shares: 0,
              price: 0,
              amount: dividend.amount,
              fees: 0,
              tax: 0,
              currency: 'USD',
              notes: 'Projected dividend payment'
            };
            
            transactions.push(transaction);
          }
        });
      }
      
      return {
        holdings,
        dividends,
        transactions
      };
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return {
        holdings: [],
        dividends: [],
        transactions: []
      };
    }
  };
  
  /**
   * Map asset class string to our supported types
   */
  const mapAssetClass = (assetClass: string): 'Stocks' | 'Funds' | 'Cash' | 'Commodities' | 'Other' => {
    const normalizedClass = (assetClass || '').toLowerCase();
    
    if (['stock', 'stocks', 'equity', 'equities'].includes(normalizedClass)) {
      return 'Stocks';
    } else if (['fund', 'funds', 'etf', 'etfs', 'index', 'mutual fund'].includes(normalizedClass)) {
      return 'Funds';
    } else if (['cash', 'money market', 'savings'].includes(normalizedClass)) {
      return 'Cash';
    } else if (['commodity', 'commodities', 'gold', 'silver', 'metals'].includes(normalizedClass)) {
      return 'Commodities';
    } else {
      return 'Other';
    }
  };