import { MongoClient, Collection, Db } from 'mongodb';
import {
  Holding,
  DividendPayment,
  Transaction
} from '../types';

/**
 * MongoDB service for the Dividend Dashboard
 * This will handle all database operations
 */
export class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private holdings: Collection<Holding> | null = null;
  private dividends: Collection<DividendPayment> | null = null;
  private transactions: Collection<Transaction> | null = null;
  
  /**
   * Initialize the MongoDB connection
   */
  async connect(connectionString: string, dbName: string = 'dividend-dashboard'): Promise<void> {
    try {
      this.client = new MongoClient(connectionString);
      await this.client.connect();
      console.log('Connected to MongoDB successfully');
      
      this.db = this.client.db(dbName);
      
      // Initialize collections
      this.holdings = this.db.collection<Holding>('holdings');
      this.dividends = this.db.collection<DividendPayment>('dividends');
      this.transactions = this.db.collection<Transaction>('transactions');
      
      // Create indexes for better query performance
      await this.createIndexes();
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }
  
  /**
   * Create indexes for better query performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.holdings || !this.dividends || !this.transactions) {
      throw new Error('Collections not initialized');
    }
    
    // Indexes for holdings collection
    await this.holdings.createIndex({ symbol: 1 });
    
    // Indexes for dividends collection
    await this.dividends.createIndex({ symbol: 1 });
    await this.dividends.createIndex({ date: 1 });
    await this.dividends.createIndex({ holdingId: 1 });
    
    // Indexes for transactions collection
    await this.transactions.createIndex({ symbol: 1 });
    await this.transactions.createIndex({ date: 1 });
    await this.transactions.createIndex({ type: 1 });
    
    console.log('MongoDB indexes created successfully');
  }
  
  /**
   * Close the MongoDB connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }
  
  /**
   * Get all holdings
   */
  async getAllHoldings(): Promise<Holding[]> {
    if (!this.holdings) {
      throw new Error('Holdings collection not initialized');
    }
    
    return this.holdings.find().toArray();
  }
  
  /**
   * Get all dividends
   */
  async getAllDividends(): Promise<DividendPayment[]> {
    if (!this.dividends) {
      throw new Error('Dividends collection not initialized');
    }
    
    return this.dividends.find().toArray();
  }
  
  /**
   * Get all transactions
   */
  async getAllTransactions(): Promise<Transaction[]> {
    if (!this.transactions) {
      throw new Error('Transactions collection not initialized');
    }
    
    return this.transactions.find().toArray();
  }
  
  /**
   * Get transactions within a date range
   */
  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    if (!this.transactions) {
      throw new Error('Transactions collection not initialized');
    }
    
    return this.transactions.find({
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      }
    }).toArray();
  }
  
  /**
   * Get dividends within a date range
   */
  async getDividendsByDateRange(startDate: Date, endDate: Date): Promise<DividendPayment[]> {
    if (!this.dividends) {
      throw new Error('Dividends collection not initialized');
    }
    
    return this.dividends.find({
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      }
    }).toArray();
  }
  
  /**
   * Save holdings to the database
   * This will use bulk operations for efficiency
   */
  async saveHoldings(holdings: Holding[]): Promise<void> {
    if (!this.holdings) {
      throw new Error('Holdings collection not initialized');
    }
    
    if (holdings.length === 0) {
      return;
    }
    
    // Prepare bulk operations
    const operations = holdings.map(holding => ({
      replaceOne: {
        filter: { id: holding.id },
        replacement: holding,
        upsert: true
      }
    }));
    
    await this.holdings.bulkWrite(operations);
    console.log(`Saved ${holdings.length} holdings to MongoDB`);
  }
  
  /**
   * Save dividends to the database
   * This will use bulk operations for efficiency
   */
  async saveDividends(dividends: DividendPayment[]): Promise<void> {
    if (!this.dividends) {
      throw new Error('Dividends collection not initialized');
    }
    
    if (dividends.length === 0) {
      return;
    }
    
    // Prepare bulk operations
    const operations = dividends.map(dividend => ({
      replaceOne: {
        filter: { id: dividend.id },
        replacement: dividend,
        upsert: true
      }
    }));
    
    await this.dividends.bulkWrite(operations);
    console.log(`Saved ${dividends.length} dividends to MongoDB`);
  }
  
  /**
   * Save transactions to the database
   * This will use bulk operations for efficiency
   */
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    if (!this.transactions) {
      throw new Error('Transactions collection not initialized');
    }
    
    if (transactions.length === 0) {
      return;
    }
    
    // Prepare bulk operations
    const operations = transactions.map(transaction => ({
      replaceOne: {
        filter: { id: transaction.id },
        replacement: transaction,
        upsert: true
      }
    }));
    
    await this.transactions.bulkWrite(operations);
    console.log(`Saved ${transactions.length} transactions to MongoDB`);
  }
  
  /**
   * Get holdings by symbol
   */
  async getHoldingsBySymbol(symbol: string): Promise<Holding[]> {
    if (!this.holdings) {
      throw new Error('Holdings collection not initialized');
    }
    
    return this.holdings.find({ symbol }).toArray();
  }
  
  /**
   * Get dividends by symbol
   */
  async getDividendsBySymbol(symbol: string): Promise<DividendPayment[]> {
    if (!this.dividends) {
      throw new Error('Dividends collection not initialized');
    }
    
    return this.dividends.find({ symbol }).toArray();
  }
  
  /**
   * Get transactions by symbol
   */
  async getTransactionsBySymbol(symbol: string): Promise<Transaction[]> {
    if (!this.transactions) {
      throw new Error('Transactions collection not initialized');
    }
    
    return this.transactions.find({ symbol }).toArray();
  }
  
  /**
   * Delete all data for testing purposes
   */
  async clearAllData(): Promise<void> {
    if (!this.holdings || !this.dividends || !this.transactions) {
      throw new Error('Collections not initialized');
    }
    
    await this.holdings.deleteMany({});
    await this.dividends.deleteMany({});
    await this.transactions.deleteMany({});
    
    console.log('All data cleared from MongoDB');
  }
}

// Export a singleton instance
export const mongoDBService = new MongoDBService();