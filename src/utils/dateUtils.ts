// Date utility functions
import { format, parse, isAfter, isBefore, addDays, addMonths, addYears } from 'date-fns';

export const formatDateString = (date: string, formatStr: string = 'MMM dd, yyyy'): string => {
  try {
    return format(new Date(date), formatStr);
  } catch (e) {
    return date;
  }
};

export {};
