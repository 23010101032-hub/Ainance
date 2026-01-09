
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar
} from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  onFilteredExport?: (transactions: Transaction[], filenameSuffix: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

const DashboardCharts: React.FC<Props> = ({ transactions, onFilteredExport }) => {
  const [distributionType, setDistributionType] = useState<'pie' | 'bar'>('pie');
  const [filterType, setFilterType] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [filterValue, setFilterValue] = useState<string>('');

  // Helper to get week of month (1-7 = 1, 8-14 = 2, etc.)
  const getWeekOfMonth = (dateString: string) => {
    const day = new Date(dateString).getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };

  // Helper for Month/Year string
  const getMonthYear = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Generate unique filter options based on data
  const filterOptions = useMemo(() => {
    if (filterType === 'all') return [];
    
    const uniqueOptions = new Set<string>();
    transactions.forEach(t => {
      if (filterType === 'monthly') {
        uniqueOptions.add(getMonthYear(t.date));
      } else if (filterType === 'weekly') {
        const my = getMonthYear(t.date);
        const w = getWeekOfMonth(t.date);
        uniqueOptions.add(`Week ${w} of ${my}`);
      }
    });
    
    return Array.from(uniqueOptions).sort((a, b) => {
      // Basic reverse chronological sort
      return new Date(b.split(' of ')[1] || b).getTime() - new Date(a.split(' of ')[1] || a).getTime();
    });
  }, [transactions, filterType]);

  // Handle filter type change
  const handleFilterTypeToggle = (type: 'all' | 'weekly' | 'monthly') => {
    setFilterType(type);
    setFilterValue(''); // Reset selection
  };

  // Filtered transactions for the charts
  const filteredTransactions = useMemo(() => {
    if (filterType === 'all' || !filterValue) return transactions;
    
    return transactions.filter(t => {
      if (filterType === 'monthly') {
        return getMonthYear(t.date) === filterValue;
      }
      if (filterType === 'weekly') {
        const my = getMonthYear(t.date);
        const w = getWeekOfMonth(t.date);
        return `Week ${w} of ${my}` === filterValue;
      }
      return true;
    });
  }, [transactions, filterType, filterValue]);

  const expenseData = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc: any[], t) => {
        const existing = acc.find(i => i.name === t.category);
        if (existing) existing.value += t.amount;
        else acc.push({ name: t.category, value: t.amount });
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const trendData = useMemo(() => {
    return filteredTransactions
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc: any[], t) => {
        const date = t.date;
        const existing = acc.find(i => i.date === date);
        if (existing) {
          if (t.type === 'income') existing.income += t.amount;
          else existing.expense += t.amount;
        } else {
          acc.push({
            date,
            income: t.type === 'income' ? t.amount : 0,
            expense: t.type === 'expense' ? t.amount : 0
          });
        }
        return acc;
      }, [])
      .slice(-7); // Last 7 unique days in range
  }, [filteredTransactions]);

  const handleMonthlyExport = () => {
    if (filterType !== 'monthly' || !filterValue) {
      alert("Please select a specific month from the filter above first.");
      return;
    }
    onFilteredExport?.(filteredTransactions, filterValue.replace(/\s/g, '_'));
  };

  return (
    <div className="space-y-8 mb-8">
      {/* Dynamic Filter Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">View Perspective</h4>
            <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl">
              {(['all', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterTypeToggle(type)}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all capitalize ${
                    filterType === type 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {filterType !== 'all' && (
            <div className="flex-1 max-w-sm space-y-3">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Select {filterType}</h4>
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none text-slate-900 font-black transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">Choose a {filterType}...</option>
                {filterOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'monthly' && filterValue && (
            <div className="flex items-end">
              <button 
                onClick={handleMonthlyExport}
                className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl border-2 border-emerald-100 hover:bg-emerald-100 transition-all font-black text-xs group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Monthly Excel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Chart Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Expense Distribution</h3>
              {filterValue && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{filterValue}</p>}
            </div>
            
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setDistributionType('pie')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  distributionType === 'pie' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pie
              </button>
              <button
                onClick={() => setDistributionType('bar')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  distributionType === 'bar' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Bar
              </button>
            </div>
          </div>

          <div className="h-[300px]">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {distributionType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={expenseData}
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {expenseData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                ) : (
                  <BarChart data={expenseData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      fontSize={11} 
                      fontWeight={700}
                      width={80}
                      stroke="#64748b"
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value.toLocaleString(), 'Amount']}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                      {expenseData.map((_, index) => (
                        <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic gap-2">
                <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                <span>No expense data in this range</span>
              </div>
            )}
          </div>
        </div>

        {/* Trend Chart Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-black text-slate-900 mb-6">Cash Flow (Selected Range)</h3>
          <div className="h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={700}
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 7, strokeWidth: 0 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ef4444" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 7, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 italic gap-2">
                <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
                <span>No cash flow data in this range</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
