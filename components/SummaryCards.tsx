
import React from 'react';
import { SummaryData } from '../types';
import { CURRENCIES } from '../constants';

interface Props {
  summary: SummaryData;
  currencyCode: string;
}

const SummaryCards: React.FC<Props> = ({ summary, currencyCode }) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const format = (val: number) => `${currency.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Total Balance Card */}
      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col justify-center min-h-[140px] transition-all hover:translate-y-[-4px] active:scale-[0.98]">
        <span className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3">Net Worth</span>
        <span className={`text-4xl font-black tracking-tight ${summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
          {format(summary.balance)}
        </span>
      </div>
      
      {/* Income Card */}
      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col justify-center min-h-[140px] transition-all hover:translate-y-[-4px] active:scale-[0.98]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
          <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Earnings</span>
        </div>
        <span className="text-4xl font-black tracking-tight text-emerald-600">
          {format(summary.totalIncome)}
        </span>
      </div>

      {/* Expenses Card */}
      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col justify-center min-h-[140px] transition-all hover:translate-y-[-4px] active:scale-[0.98] sm:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-200" />
          <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Outflow</span>
        </div>
        <span className="text-4xl font-black tracking-tight text-rose-600">
          {format(summary.totalExpense)}
        </span>
      </div>
    </div>
  );
};

export default SummaryCards;
