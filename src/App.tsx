import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Link } from 'react-router-dom';
import './App.css';

// Import Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/layout/Dashboard';

// Import pages/components
import PortfolioSummary from './components/dashboard/PortfolioSummary';
import HoldingsTable from './components/tables/HoldingsTable';
import DividendTable from './components/tables/DividendTable';
import TransactionTable from './components/tables/TransactionTable';
import ImportForm from './components/forms/ImportForm';
import TransactionImport from './components/forms/TransactionImport';
import SettingsForm from './components/forms/SettingsForm';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header onToggleSidebar={toggleSidebar} />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4">
            <div className="container mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/summary" element={<PortfolioSummary />} />
                <Route path="/holdings" element={<HoldingsTable />} />
                <Route path="/dividends" element={<DividendTable />} />
                <Route path="/transactions" element={<TransactionTable />} />
                <Route path="/import" element={<ImportForm />} />
                <Route path="/import/transactions" element={<TransactionImport />} />
                <Route path="/settings" element={<SettingsForm />} />
              </Routes>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 p-4 shadow-inner">
            <div className="container mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
              Dividend Dashboard &copy; 2025
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;