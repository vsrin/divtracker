import React from 'react';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  return (
    <div className={`
      fixed inset-y-0 left-0 z-30
      w-64 bg-white dark:bg-gray-800 shadow-lg transform 
      ${open ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 md:static md:inset-auto
      transition-transform duration-300 ease-in-out
    `}>
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/logo192.png" alt="Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold">Dividend Dashboard</h1>
        </div>
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={onToggle}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav className="mt-4 px-2">
        <ul className="space-y-1">
          <li>
            <a 
              href="/" 
              className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Dashboard
            </a>
          </li>
          <li>
            <a 
              href="/holdings" 
              className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Holdings
            </a>
          </li>
          <li>
            <a 
              href="/dividends" 
              className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Dividends
            </a>
          </li>
          <li>
            <a 
              href="/transactions" 
              className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Transactions
            </a>
          </li>
          <li>
            <a 
              href="/import" 
              className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Import Data
            </a>
          </li>
          <li>
            <a 
              href="/settings" 
              className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;