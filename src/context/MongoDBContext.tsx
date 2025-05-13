import React, { createContext, useState, useContext, useEffect } from 'react';
import { mongoDBService } from '../utils/mongoDBService';

interface MongoDBContextProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connectionString: string;
  setConnectionString: (connectionString: string) => void;
  connectToMongoDB: () => Promise<boolean>;
  disconnectFromMongoDB: () => Promise<void>;
  clearAllData: () => Promise<void>;
  lastSyncDate: Date | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

const MongoDBContext = createContext<MongoDBContextProps>({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  connectionString: '',
  setConnectionString: () => {},
  connectToMongoDB: async () => false,
  disconnectFromMongoDB: async () => {},
  clearAllData: async () => {},
  lastSyncDate: null,
  syncStatus: 'idle'
});

export const useMongoDBContext = () => useContext(MongoDBContext);

interface MongoDBProviderProps {
  children: React.ReactNode;
}

export const MongoDBProvider: React.FC<MongoDBProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionString, setConnectionString] = useState('');
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  // Load connection string from localStorage on mount
  useEffect(() => {
    const savedConnectionString = localStorage.getItem('mongodb-connection-string');
    if (savedConnectionString) {
      setConnectionString(savedConnectionString);
    }
  }, []);
  
  // Save connection string to localStorage when it changes
  useEffect(() => {
    if (connectionString) {
      localStorage.setItem('mongodb-connection-string', connectionString);
    }
  }, [connectionString]);
  
  /**
   * Connect to MongoDB using the provided connection string
   */
  const connectToMongoDB = async (): Promise<boolean> => {
    if (!connectionString) {
      setConnectionError('Connection string is required');
      return false;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      await mongoDBService.connect(connectionString);
      setIsConnected(true);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to MongoDB';
      setConnectionError(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };
  
  /**
   * Disconnect from MongoDB
   */
  const disconnectFromMongoDB = async (): Promise<void> => {
    try {
      await mongoDBService.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  };
  
  /**
   * Clear all data from MongoDB
   */
  const clearAllData = async (): Promise<void> => {
    if (!isConnected) {
      setConnectionError('Not connected to MongoDB');
      return;
    }
    
    try {
      await mongoDBService.clearAllData();
      setLastSyncDate(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear data';
      setConnectionError(errorMessage);
    }
  };
  
  // Context value
  const contextValue: MongoDBContextProps = {
    isConnected,
    isConnecting,
    connectionError,
    connectionString,
    setConnectionString,
    connectToMongoDB,
    disconnectFromMongoDB,
    clearAllData,
    lastSyncDate,
    syncStatus
  };
  
  return (
    <MongoDBContext.Provider value={contextValue}>
      {children}
    </MongoDBContext.Provider>
  );
};

export default MongoDBContext;