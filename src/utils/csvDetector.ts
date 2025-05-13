/**
 * Helper function to merge arrays by ID and avoid duplicates
 * Used for merging holdings, dividends, and transactions
 */
export function mergeArraysById<T extends { id: string }>(
    existingArray: T[],
    newArray: T[]
  ): T[] {
    const merged: Record<string, T> = {};
    
    // Add existing items to the map
    existingArray.forEach(item => {
      merged[item.id] = item;
    });
    
    // Add new items, overwriting existing ones with same ID
    newArray.forEach(item => {
      merged[item.id] = item;
    });
    
    // Convert back to array
    return Object.values(merged);
  }
  
  /**
   * Detect CSV type and parse accordingly
   * This function detects whether the CSV is a positions file or a transaction history file
   * and then parses it with the appropriate parser
   * 
   * @param file The CSV file to parse
   * @param aiEnhanced Whether to use AI-enhanced parsing
   * @param aiProvider Which AI provider to use ('claude' or 'openai')
   * @param apiKey API key for the AI provider
   */
  export const detectAndParseCSV = async (
    file: File,
    aiEnhanced: boolean = false,
    aiProvider: 'claude' | 'openai' = 'claude',
    apiKey: string = ''
  ): Promise<{
    holdings: any[];
    dividends: any[];
    transactions: any[];
    fileType: 'positions' | 'transactions';
  }> => {
    try {
      console.log(`Detecting and parsing CSV: ${file.name}`);
      console.log(`AI Enhanced: ${aiEnhanced}, Provider: ${aiProvider}`);
      
      // Import the required modules dynamically to avoid circular dependencies
      const { parseCSV } = await import('./csvParser');
      const { parseTransactionHistoryCSV } = await import('./transactionParser');
      const { parseCSVWithClaude } = await import('./claudeParser');
      const { parseCSVWithOpenAI } = await import('./openaiParser');
      
      // Get file contents for detection
      const fileTextPreview = await getFilePreview(file);
      const fileName = file.name.toLowerCase();
      
      // Detect file type based on filename and content
      const isTransactionHistory = 
        fileName.includes('history') || 
        fileName.includes('transaction') ||
        (fileTextPreview.toLowerCase().includes('action') && 
         fileTextPreview.toLowerCase().includes('settlement date'));
      
      console.log(`Detected file type: ${isTransactionHistory ? 'Transaction History' : 'Portfolio Positions'}`);
      
      let result;
      
      // If AI-enhanced parsing is enabled and we have an API key
      if (aiEnhanced && apiKey) {
        console.log(`Using AI-enhanced parsing with ${aiProvider}`);
        if (aiProvider === 'claude') {
          result = await parseCSVWithClaude(file, apiKey);
        } else if (aiProvider === 'openai') {
          result = await parseCSVWithOpenAI(file, apiKey);
        } else {
          throw new Error(`Unsupported AI provider: ${aiProvider}`);
        }
      } else {
        // Otherwise use regular parsing
        if (isTransactionHistory) {
          result = await parseTransactionHistoryCSV(file);
        } else {
          result = await parseCSV(file);
        }
      }
      
      return {
        ...result,
        fileType: isTransactionHistory ? 'transactions' : 'positions'
      };
    } catch (error) {
      console.error('Error detecting and parsing CSV:', error);
      throw error;
    }
  };
  
  /**
   * Get a preview of the file contents for detection
   */
  const getFilePreview = async (file: File, maxLength: number = 1000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target || !event.target.result) {
            throw new Error('Failed to read file');
          }
          
          const text = event.target.result as string;
          resolve(text.slice(0, maxLength));
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };