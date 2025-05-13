# Dividend Dashboard - Implementation Guide

## Project Overview

The Dividend Dashboard is a responsive React application designed to help you track and analyze your dividend portfolio. Key features include:

- **Portfolio Overview**: Track total value, profit/loss, and dividend yield
- **Asset Allocation**: Visualize your portfolio distribution across asset classes
- **Dividend Income**: Monitor monthly income and annual projections
- **Holdings Analysis**: View performance metrics for each holding
- **Mobile Responsiveness**: Fully optimized for both iPhone and MacBook use

## Project Structure

```
dividend-dashboard/
├── public/               # Static files
├── src/
│   ├── api/              # API integration
│   ├── components/
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── charts/       # Data visualization components
│   │   ├── forms/        # Form components
│   │   ├── layout/       # Layout components
│   │   ├── tables/       # Table components
│   │   └── ui/           # Reusable UI components
│   ├── context/          # React context for state management
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # CSS and Tailwind styles
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
└── server/               # Backend server files
```

## Installation Instructions

1. Clone the repository or use the setup script provided
2. Install dependencies:
   ```bash
   cd dividend-dashboard
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. For backend functionality, ensure MongoDB is running locally and start the server:
   ```bash
   npm run server
   ```

## How to Use

1. **Initial Setup**: On first launch, use the "Import" form to upload your portfolio CSV from your brokerage
2. **Dashboard View**: View your portfolio summary, asset allocation, and income projections
3. **Holdings Table**: Analyze individual positions and sort by various metrics
4. **Dividend Calendar**: Track upcoming dividend payments
5. **Updates**: Periodically import fresh CSV data to keep your dashboard current

## CSV Format

The application is designed to parse CSV files from common brokerages. It looks for the following columns:
- Symbol
- Name/Holding
- Shares
- Cost per share
- Cost basis
- Current value
- Current price
- Dividend yield
- Dividend amount

## Customization

The dashboard is built with customization in mind:
- **Theme**: Toggle between light and dark mode
- **Layout**: Responsive design that adapts to your device
- **Data**: Filter and sort holdings by various criteria

## Future Enhancements

Potential features for future versions:
- **Dividend Reinvestment Calculator**: Project growth with dividend reinvestment
- **Stock Screener**: Find new dividend investments
- **Tax Reporting**: Generate tax summaries for dividend income
- **Portfolio Optimization**: Suggestions for rebalancing

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Data Visualization**: Recharts
- **Backend**: Node.js, Express
- **Database**: MongoDB



EXECUTION:

# Dividend Dashboard Project Summary

## Project Objectives

We've created a comprehensive Dividend Dashboard web application to help you track and analyze your dividend portfolio. The key objectives are:

1. **Track portfolio performance** - Monitor holdings, gains/losses, and allocation
2. **Analyze dividend income** - Track income streams, yields, and projections
3. **Visualize data** - Provide charts and tables for portfolio analysis
4. **Import brokerage data** - Parse CSV files from your brokerage
5. **AI-enhanced parsing** - Use Claude or OpenAI to improve CSV parsing accuracy
6. **Mobile responsiveness** - Ensure the app works well on both iPhone and MacBook

## Technical Approach

The application is built as a React single-page application using:
- TypeScript for type safety
- Tailwind CSS for responsive styling
- Recharts for data visualization
- React Router for navigation
- Context API for state management
- AI integration for improved data parsing

## Project Structure

### File/Folder Organization

```
dividend-dashboard/
├── public/               # Static files
│   └── darkMode.js       # Dark mode initialization script
├── src/
│   ├── api/              # API integration
│   │   ├── dividends.ts
│   │   ├── fileUpload.ts
│   │   ├── portfolio.ts
│   │   └── transactions.ts
│   ├── components/
│   │   ├── dashboard/    # Dashboard widgets
│   │   │   ├── AssetAllocation.tsx
│   │   │   ├── DividendProjection.tsx
│   │   │   ├── MonthlyIncome.tsx
│   │   │   ├── PerformanceMetrics.tsx
│   │   │   ├── PortfolioSummary.tsx
│   │   │   └── TopHoldings.tsx
│   │   ├── forms/        # Form components
│   │   │   ├── FilterForm.tsx
│   │   │   ├── ImportForm.tsx     # CSV import with AI integration
│   │   │   └── SettingsForm.tsx
│   │   ├── layout/       # Layout components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Main.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── tables/       # Table components
│   │   │   ├── DividendTable.tsx
│   │   │   ├── HoldingsTable.tsx
│   │   │   └── TransactionTable.tsx
│   │   └── ui/           # Reusable UI components
│   │       ├── Alert.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Dropdown.tsx
│   │       └── Modal.tsx
│   ├── context/          # React context for state management
│   │   ├── FiltersContext.tsx
│   │   ├── PortfolioContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useDividends.ts
│   │   ├── useFileUpload.ts
│   │   ├── useMongoDB.ts
│   │   └── usePortfolio.ts
│   ├── styles/           # CSS styles
│   │   └── tailwind.css
│   ├── types/            # TypeScript type definitions
│   │   ├── dividend.ts
│   │   ├── index.ts
│   │   ├── portfolio.ts
│   │   └── transaction.ts
│   ├── utils/            # Utility functions
│   │   ├── calculations.ts
│   │   ├── claudeParser.ts    # Claude AI CSV parsing
│   │   ├── csvParser.ts       # Standard CSV parsing
│   │   ├── dateUtils.ts
│   │   ├── formatters.ts
│   │   └── openaiParser.ts    # OpenAI CSV parsing (to be implemented)
│   ├── App.tsx
│   └── index.tsx
├── server/               # Optional backend server
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Key Files and Components

### Core Application Files
- **src/App.tsx** - Main application with routing
- **src/context/PortfolioContext.tsx** - Global state management
- **src/utils/csvParser.ts** - CSV parsing logic
- **src/utils/claudeParser.ts** - AI-enhanced parsing with Claude

### Dashboard Components
- **src/components/layout/Dashboard.tsx** - Main dashboard layout
- **src/components/dashboard/PortfolioSummary.tsx** - Portfolio value and performance
- **src/components/dashboard/AssetAllocation.tsx** - Asset allocation pie chart
- **src/components/dashboard/MonthlyIncome.tsx** - Monthly dividend income chart
- **src/components/dashboard/TopHoldings.tsx** - Top holdings by value/yield/income

### Data Import and Tables
- **src/components/forms/ImportForm.tsx** - CSV import with AI integration
- **src/components/tables/HoldingsTable.tsx** - Portfolio holdings table
- **src/components/tables/DividendTable.tsx** - Dividend payment history table
- **src/components/tables/TransactionTable.tsx** - Transaction history table

## CSV Parsing Implementation

The application can parse two types of CSV files:
1. **Portfolio Positions CSV** (Portfolio_Positions_May132025.csv)
   - Shows current holdings, values, and yields
   - Format: Account Number, Account Name, Symbol, Description, Quantity, etc.

2. **Transaction History CSV** (History_for_Account_X41464457.csv)
   - Shows all transaction history
   - Format: Run Date, Action, Symbol, Description, Type, Quantity, etc.

We've implemented two parsing methods:
1. **Standard Parsing** - Direct CSV parsing with defined column mapping
2. **AI-Enhanced Parsing** - Uses Claude or OpenAI to interpret and extract data

## Next Steps

1. **Import Transaction History**
   - Import your History_for_Account_X41464457.csv file 
   - This will populate the Transactions view and enhance portfolio analytics

2. **Set Up Regular Updates**
   - Re-import position data monthly/quarterly
   - Import transaction history after significant portfolio changes

3. **Potential Enhancements**
   - Implement the OpenAI parser integration
   - Add benchmark comparisons
   - Implement tax reporting features
   - Add dividend reinvestment simulation
   - Create mobile app version

4. **Data Integration Improvements**
   - Connect to brokerage APIs for automatic updates
   - Integrate with financial data providers for real-time quotes
   - Add MongoDB for persistent data storage beyond localStorage

## How to Use the Application

1. **Dashboard** - View portfolio overview and summary statistics
2. **Holdings** - View and sort individual positions
3. **Dividends** - Analyze dividend income and projections
4. **Transactions** - View transaction history
5. **Import** - Import new data from CSV files
6. **Settings** - Configure app preferences and manage data

## AI Integration Setup

To use AI-enhanced CSV parsing:
1. Enable "AI-Enhanced Parsing" in the Import form
2. Choose between Claude or OpenAI
3. Enter your API key:
   - Claude: Key starts with `sk-ant-api...`
   - OpenAI: Key starts with `sk-...`
4. Import your CSV file

The application will store your API key in localStorage for convenience. The key is only used locally for CSV parsing and is never sent to any servers other than the respective AI provider.

