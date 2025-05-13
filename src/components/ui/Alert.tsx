// src/components/ui/Alert.tsx
import React, { ReactNode } from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  children?: ReactNode;
}

const Alert: React.FC<AlertProps> = ({ type, title, children }) => {
  // Define styles based on alert type
  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800',
      title: 'text-green-800 dark:text-green-300',
      text: 'text-green-700 dark:text-green-300'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-100 dark:border-red-800',
      title: 'text-red-800 dark:text-red-300',
      text: 'text-red-700 dark:text-red-300'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-100 dark:border-yellow-800',
      title: 'text-yellow-800 dark:text-yellow-300',
      text: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-800',
      title: 'text-blue-800 dark:text-blue-300',
      text: 'text-blue-700 dark:text-blue-300'
    }
  };

  const style = styles[type];

  return (
    <div className={`p-4 rounded-lg border ${style.bg} ${style.border}`}>
      <h3 className={`text-sm font-medium mb-1 ${style.title}`}>{title}</h3>
      {children && <div className={`text-sm ${style.text}`}>{children}</div>}
    </div>
  );
};

export default Alert;