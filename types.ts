
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface UserSettings {
  name: string;
  currency: string;
}

export interface FinanceData {
  transactions: Transaction[];
  settings: UserSettings;
  categories: {
    income: string[];
    expense: string[];
  };
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
