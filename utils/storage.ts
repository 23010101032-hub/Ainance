
import { FinanceData, Transaction, UserSettings } from '../types';
import { STORAGE_KEY, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../constants';

const initialData: FinanceData = {
  transactions: [],
  settings: {
    name: 'Guest User',
    currency: 'USD'
  },
  categories: {
    income: DEFAULT_INCOME_CATEGORIES,
    expense: DEFAULT_EXPENSE_CATEGORIES
  }
};

export const loadData = (): FinanceData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialData;
  try {
    return JSON.parse(stored);
  } catch {
    return initialData;
  }
};

export const saveData = (data: FinanceData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
