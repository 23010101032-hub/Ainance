import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FinanceData, SummaryData, Transaction, UserSettings, TransactionType } from './types';
import { loadData, saveData } from './utils/storage';
import { getDailySavingTip } from './services/geminiService';
import SummaryCards from './components/SummaryCards';
import DashboardCharts from './components/DashboardCharts';
import TransactionForm from './components/TransactionForm';
import SettingsModal from './components/SettingsModal';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from './constants';

const App: React.FC = () => {
  const [data, setData] = useState<FinanceData>(loadData());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFormType, setActiveFormType] = useState<TransactionType>('expense');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dailyTip, setDailyTip] = useState<string>('Loading financial insight...');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);

  // Persistence to LocalStorage
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Daily Notification Logic
  useEffect(() => {
    const setupNotifications = async () => {
      if (typeof window === 'undefined' || !("Notification" in window)) return;
      
      try {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }

        if (Notification.permission === "granted") {
          const today = new Date().toISOString().split('T')[0];
          const lastNotified = localStorage.getItem('fintrack_last_notified');
          const hasEntryToday = data.transactions.some(t => t.date === today);

          if (!hasEntryToday && lastNotified !== today) {
            new Notification("FinTrack Reminder", {
              body: "Don't forget to log your expenses and income for today! 📊",
              icon: "https://cdn-icons-png.flaticon.com/512/2845/2845814.png"
            });
            localStorage.setItem('fintrack_last_notified', today);
          }
        }
      } catch (e) {
        console.warn("Notification system not accessible in this environment.");
      }
    };

    setupNotifications();
    const interval = setInterval(setupNotifications, 1000 * 60 * 60 * 4);
    return () => clearInterval(interval);
  }, [data.transactions]);

  // AI Tip Generation
  useEffect(() => {
    const fetchTip = async () => {
      const expenses = data.transactions.filter(t => t.type === 'expense');
      const tip = await getDailySavingTip(expenses);
      setDailyTip(tip);
    };
    fetchTip();
  }, [data.transactions.length]);

  const handleExportCSV = (transactionsToExport: Transaction[] = data.transactions, filenameSuffix: string = '') => {
    if (transactionsToExport.length === 0) {
      alert("No data to export!");
      return;
    }
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = transactionsToExport.map(t => [
      t.date,
      t.type.toUpperCase(),
      t.category,
      t.amount.toString(),
      `"${t.note.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const suffix = filenameSuffix ? `_${filenameSuffix}` : `_${new Date().toISOString().split('T')[0]}`;
    link.setAttribute("href", url);
    link.setAttribute("download", `FinTrack_Report${suffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return alert("Invalid CSV file.");

      const transactions: Transaction[] = [];
      const newIncomeCategories = new Set(data.categories.income);
      const newExpenseCategories = new Set(data.categories.expense);

      const parseCSVLine = (line: string) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && line[i+1] === '"') {
            current += '"'; i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      };

      try {
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const fields = parseCSVLine(line);
          const [date, type, category, amount, note] = fields;
          const tType = type?.toLowerCase() as TransactionType;
          
          if (tType === 'income') newIncomeCategories.add(category);
          else if (tType === 'expense') newExpenseCategories.add(category);

          transactions.push({
            id: Math.random().toString(36).substr(2, 9),
            date: date || new Date().toISOString().split('T')[0],
            type: tType || 'expense',
            category: category || 'Other',
            amount: parseFloat(amount) || 0,
            note: note || ''
          });
        }

        const mode = window.confirm(`Detected ${transactions.length} records. REPLACE all current data (OK) or MERGE with current data (Cancel)?`) ? 'replace' : 'merge';

        setData(prev => ({
          ...prev,
          transactions: mode === 'replace' ? transactions : [...transactions, ...prev.transactions],
          categories: {
            income: Array.from(newIncomeCategories),
            expense: Array.from(newExpenseCategories)
          }
        }));

        setSuccessPulse(true);
        setTimeout(() => setSuccessPulse(false), 2000);
        alert(`Successfully ${mode === 'replace' ? 'restored' : 'merged'} ${transactions.length} transactions!`);
      } catch (err) {
        alert("Recovery failed. Please ensure the file is a valid FinTrack CSV export.");
      }
    };
    reader.readAsText(file);
  };

  const handleBackupJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FinTrack_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.transactions && importedData.settings) {
          setData(importedData);
          setSuccessPulse(true);
          setTimeout(() => setSuccessPulse(false), 2000);
          alert("Full backup restored successfully!");
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        alert("Failed to restore data. Please ensure the file is a valid FinTrack backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (!window.confirm('WARNING: This will delete ALL local data. Continue?')) return;
    const resetData: FinanceData = {
      transactions: [],
      settings: { name: 'Guest User', currency: 'USD' },
      categories: { income: DEFAULT_INCOME_CATEGORIES, expense: DEFAULT_EXPENSE_CATEGORIES }
    };
    setData(resetData);
    setIsSettingsOpen(false);
    setIsDrawerOpen(false);
  };

  const summary: SummaryData = useMemo(() => {
    const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [data.transactions]);

  const handleAddTransaction = useCallback((newT: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = { ...newT, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({ ...prev, transactions: [transaction, ...prev.transactions] }));
  }, []);

  const handleAddCategory = useCallback((cat: string) => {
    setData(prev => {
      const targetList = activeFormType === 'income' ? 'income' : 'expense';
      if (prev.categories[targetList].includes(cat)) return prev;
      return { ...prev, categories: { ...prev.categories, [targetList]: [...prev.categories[targetList], cat] } };
    });
  }, [activeFormType]);

  const handleUpdateSettings = useCallback((settings: UserSettings) => {
    setData(prev => ({ ...prev, settings }));
  }, []);

  const openForm = (type: TransactionType) => {
    setActiveFormType(type);
    setIsFormOpen(true);
    setIsDrawerOpen(false);
  };

  return (
    <div className={`min-h-[100dvh] bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden selection:bg-indigo-100 transition-colors duration-500 ${successPulse ? 'animate-success' : ''}`}>
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-5 safe-pt pb-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <button onClick={() => setIsDrawerOpen(true)} className="p-2.5 -ml-2 text-slate-800 hover:bg-slate-100 rounded-2xl transition-all active:scale-90" aria-label="Open Menu">
          <MenuIcon />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">F</div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">FinTrack</h1>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 -mr-2 text-slate-400 hover:text-slate-800 active:scale-90 transition-all">
          <ProfileIcon />
        </button>
      </div>

      {/* Slide Sidebar */}
      <>
        <div 
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
          onClick={() => setIsDrawerOpen(false)} 
        />

        <aside className={`
          fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white border-r border-slate-200 flex flex-col z-[70] shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:sticky lg:h-screen lg:w-72 flex-shrink-0
        `}>
          <div className="p-8 bg-slate-50 border-b border-slate-100 relative group">
            <div className="absolute top-4 right-4 lg:hidden">
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><CloseIcon /></button>
            </div>
            
            <div className="flex flex-col gap-4 items-center text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-xl border-4 border-white transform transition-transform group-hover:rotate-3">
                  {data.settings.name.charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={() => { setIsSettingsOpen(true); setIsDrawerOpen(false); }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center text-indigo-600 hover:text-indigo-800 transition-colors border border-indigo-50"
                >
                  <EditIcon />
                </button>
              </div>
              <div className="w-full px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active User</p>
                <p className="text-xl font-black text-slate-900 truncate">{data.settings.name}</p>
              </div>
            </div>
          </div>

          <nav className="p-5 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
            <button 
              onClick={() => setIsDrawerOpen(false)} 
              className={`w-full flex items-center gap-4 px-5 py-4.5 text-indigo-700 bg-indigo-50 rounded-[1.5rem] font-black text-sm transition-all border border-indigo-100 shadow-sm ${isDrawerOpen ? 'drawer-stagger' : ''}`}
              style={{ animationDelay: '0.1s' }}
            >
              <DashboardIcon /> Dashboard
            </button>
            <button 
              onClick={() => { setIsSettingsOpen(true); setIsDrawerOpen(false); }} 
              className={`w-full flex items-center gap-4 px-5 py-4.5 text-slate-700 hover:bg-slate-50 rounded-[1.5rem] transition-all font-bold text-sm ${isDrawerOpen ? 'drawer-stagger' : ''}`}
              style={{ animationDelay: '0.2s' }}
            >
              <SettingsIcon /> App Settings
            </button>
            
            <div className={`pt-8 mt-4 border-t border-slate-100 px-2 ${isDrawerOpen ? 'drawer-stagger' : ''}`} style={{ animationDelay: '0.3s' }}>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Export Tools</p>
               <button onClick={() => handleExportCSV()} className="w-full flex items-center gap-4 px-5 py-4 text-slate-800 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-200 transition-all font-black text-sm active:scale-95 mb-2">
                 <FileIcon /> Export to Excel
               </button>
               <button onClick={handleBackupJSON} className="w-full flex items-center gap-4 px-5 py-4 text-indigo-700 bg-indigo-50/30 border-2 border-indigo-50 rounded-2xl hover:border-indigo-200 transition-all font-black text-sm active:scale-95">
                 <BackupIcon /> Full State Backup
               </button>
            </div>
          </nav>

          <div className="p-6 safe-pb" />
        </aside>
      </>

      {/* Main Dashboard */}
      <main className="flex-1 overflow-x-hidden p-5 md:p-10 lg:p-14 max-w-7xl mx-auto w-full transition-all duration-300">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8">
          <div className="animate-fade-in flex-1 w-full">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">Hello, {data.settings.name}!</h2>
            
            {/* Top Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-2 sticky top-0 z-30 py-2 bg-slate-50/80 backdrop-blur-md -mx-1 px-1">
              <button 
                onClick={() => openForm('income')} 
                className="flex-1 min-w-[140px] px-6 py-4.5 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-lg">+</span> Add Income
              </button>
              <button 
                onClick={() => openForm('expense')} 
                className="flex-1 min-w-[140px] px-6 py-4.5 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-lg">−</span> Add Expense
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-slate-500 font-bold text-xs sm:text-sm tracking-tight">Sync Active • Secure Local Storage</p>
            </div>
          </div>

          <div className="bg-white border-2 border-indigo-50 rounded-[2.5rem] px-8 py-6 flex items-center gap-5 max-w-lg shadow-sm w-full md:w-auto transform transition-transform hover:scale-[1.02]">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl transform transition-transform hover:rotate-6 select-none">💡</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em] mb-1.5">Intelligent Insight</p>
              <p className="text-sm text-slate-900 font-bold leading-relaxed italic opacity-90">"{dailyTip}"</p>
            </div>
          </div>
        </header>

        <SummaryCards summary={summary} currencyCode={data.settings.currency} />
        
        <div className="my-10">
          <DashboardCharts transactions={data.transactions} onFilteredExport={handleExportCSV} />
        </div>

        <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-16">
          <div className="px-8 py-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
            <span className="text-indigo-700 bg-white px-5 py-2 rounded-2xl text-[10px] font-black ring-2 ring-indigo-50 shadow-sm">{data.transactions.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center text-slate-400 font-bold italic">No records yet. Use the top buttons to begin.</td>
                  </tr>
                ) : (
                  data.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-10 py-7">
                        <div className="font-black text-slate-900 text-base">{t.date}</div>
                        {t.note && <div className="text-xs text-slate-500 font-bold mt-1 truncate max-w-[200px]">{t.note}</div>}
                      </td>
                      <td className="px-10 py-7">
                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-10 py-7 text-xl font-black text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '−'} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-10 py-7 text-center">
                        <button onClick={() => { if(confirm('Permanently delete this entry?')) setData(prev => ({...prev, transactions: prev.transactions.filter(item => item.id !== t.id)})) }} className="text-slate-200 hover:text-rose-600 p-3.5 hover:bg-rose-50 rounded-2xl transition-all active:scale-90 lg:opacity-100 opacity-0 group-hover:opacity-100">
                          <DeleteIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        
        <div className="p-4 text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Build 1.0.4 • Optimized for Native Wrappers</p>
        </div>
      </main>

      {isFormOpen && (
        <TransactionForm
          type={activeFormType}
          categories={activeFormType === 'income' ? data.categories.income : data.categories.expense}
          onAdd={handleAddTransaction}
          onClose={() => setIsFormOpen(false)}
          onAddCategory={handleAddCategory}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={data.settings}
          onSave={handleUpdateSettings}
          onClearData={handleClearAllData}
          onImport={handleImportData}
          onImportCSV={handleImportCSV}
          onExportCSV={() => handleExportCSV()}
          onExportJSON={handleBackupJSON}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

const MenuIcon = () => ( <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 8h16M4 16h10"/></svg> );
const CloseIcon = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg> );
const ProfileIcon = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> );
const EditIcon = () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg> );
const DashboardIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zM14 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z"/></svg> );
const SettingsIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> );
const FileIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> );
const BackupIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg> );
const DeleteIcon = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> );

export default App;