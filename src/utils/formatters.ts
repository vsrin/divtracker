/**
 * Format a number as currency
 */
interface FormatCurrencyOptions {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  }
  
  export function formatCurrency(
    value: number,
    options: FormatCurrencyOptions = {}
  ): string {
    const {
      locale = 'en-US',
      currency = 'USD',
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      showSymbol = true
    } = options;
  
    try {
      return new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: showSymbol ? currency : undefined,
        minimumFractionDigits,
        maximumFractionDigits
      }).format(value);
    } catch (error) {
      // Fallback in case of errors
      return showSymbol
        ? `$${value.toFixed(minimumFractionDigits)}`
        : value.toFixed(minimumFractionDigits);
    }
  }
  
  /**
   * Format a number as percentage
   */
  export function formatPercentage(
    value: number,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  ): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits,
        maximumFractionDigits
      }).format(value / 100);
    } catch (error) {
      // Fallback in case of errors
      return `${value.toFixed(minimumFractionDigits)}%`;
    }
  }
  
  /**
   * Format a date
   */
  export function formatDate(
    dateString: string,
    options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  ): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      // Fallback in case of errors
      return dateString;
    }
  }
  
  /**
   * Format a number
   */
  export function formatNumber(
    value: number,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  ): string {
    try {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits,
        maximumFractionDigits
      }).format(value);
    } catch (error) {
      // Fallback in case of errors
      return value.toFixed(minimumFractionDigits);
    }
  }