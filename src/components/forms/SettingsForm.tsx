import React, { useState } from 'react';
import usePortfolio from '../../hooks/usePortfolio';

const SettingsForm: React.FC = () => {
  const { clearPortfolioData } = usePortfolio();
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [isMongoEnabled, setIsMongoEnabled] = useState(
    localStorage.getItem('mongoDBEnabled') === 'true'
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Handle dark mode toggle
  const handleDarkModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsDarkMode(newValue);
    localStorage.setItem('darkMode', newValue.toString());
    
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Handle MongoDB toggle
  const handleMongoDBToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsMongoEnabled(newValue);
    localStorage.setItem('mongoDBEnabled', newValue.toString());
  };
  
  // Handle clear all data
  const handleClearData = () => {
    clearPortfolioData();
    setShowClearConfirm(false);
    
    // Show success message
    alert('All portfolio data has been cleared.');
  };
  
  // Handle reset all settings
  const handleResetSettings = () => {
    // Reset dark mode
    localStorage.removeItem('darkMode');
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Reset MongoDB setting
    localStorage.removeItem('mongoDBEnabled');
    setIsMongoEnabled(false);
    
    // Reset other settings...
    
    setShowResetConfirm(false);
    
    // Show success message
    alert('All settings have been reset to defaults.');
  };
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Dark Mode</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable dark mode for a better viewing experience in low light.
              </p>
            </div>
            <div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  checked={isDarkMode}
                  onChange={handleDarkModeToggle}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Storage</h3>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">MongoDB Integration</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable MongoDB for cloud storage of your portfolio data.
              </p>
            </div>
            <div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  checked={isMongoEnabled}
                  onChange={handleMongoDBToggle}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {isMongoEnabled && (
            <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  MongoDB Connection String
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your MongoDB connection string is stored only in your browser.
                </p>
              </div>
              
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Save Connection
                </button>
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Data Management</h4>
            
            <div className="space-y-2">
              {!showClearConfirm ? (
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={() => setShowClearConfirm(true)}
                >
                  Clear All Portfolio Data
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-500">Are you sure? This cannot be undone.</span>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={handleClearData}
                  >
                    Yes, Clear
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reset Settings</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Reset all settings to their default values. This will not affect your portfolio data.
          </p>
          
          {!showResetConfirm ? (
            <button
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset All Settings
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-yellow-500">Are you sure you want to reset all settings?</span>
              <button
                className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                onClick={handleResetSettings}
              >
                Yes, Reset
              </button>
              <button
                className="px-3 py-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsForm;