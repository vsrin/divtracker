import React from 'react';
import Card from '../ui/Card';

const MongoDBSettings: React.FC = () => {
  return (
    <Card title="MongoDB Integration">
      <div className="space-y-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
          <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-300 mb-2">
            MongoDB Integration Coming Soon
          </h3>
          <p className="text-indigo-700 dark:text-indigo-400">
            We're currently focusing on transaction history import and local data management.
            MongoDB integration will be available in a future update.
          </p>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 className="font-medium mb-2">Current Data Storage</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All portfolio data is currently stored in your browser's localStorage. This data
            persists between sessions but is limited to your current browser and device.
          </p>
          
          <div className="mt-4">
            <h5 className="font-medium text-sm mb-1">Data Being Stored Locally:</h5>
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Portfolio Holdings (stocks, ETFs, and other securities)</li>
              <li>Dividend Payment History</li>
              <li>Transaction History</li>
              <li>Import Settings and Preferences</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 className="font-medium mb-2">Upcoming Features</h4>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200 mr-2 flex-shrink-0">1</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>MongoDB Database Integration</strong> - Store your portfolio data securely in the cloud
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200 mr-2 flex-shrink-0">2</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Multi-device Synchronization</strong> - Access your portfolio from any device
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200 mr-2 flex-shrink-0">3</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Data Backup and Recovery</strong> - Protect against data loss
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default MongoDBSettings;