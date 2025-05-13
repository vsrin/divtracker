import React from 'react';
import usePortfolio from '../../hooks/usePortfolio';
// Remove unused Card import
// Remove eslint-disable-next-line comment since we've fixed the issue

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  // Remove unused holdings variable
  const { portfolioValue, portfolioIncome } = usePortfolio();
  
  // Simulate refresh action
  const handleRefresh = () => {
    // Handle refresh logic
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onToggleSidebar}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold hidden sm:block">Dividend Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-4 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-gray-500 dark:text-gray-400">Portfolio Value</span>
              <span className="font-semibold">${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500 dark:text-gray-400">Annual Income</span>
              <span className="font-semibold">${portfolioIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <button
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={handleRefresh}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
          
          <button
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={toggleDarkMode}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;