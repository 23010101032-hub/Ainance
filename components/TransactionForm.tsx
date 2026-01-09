
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';

interface Props {
  type: TransactionType;
  categories: string[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  onAddCategory: (category: string) => void;
}

const TransactionForm: React.FC<Props> = ({ type, categories, onAdd, onClose, onAddCategory }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    onAdd({
      type,
      amount: Number(amount),
      category,
      date,
      note
    });
    onClose();
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setCategory(newCategory.trim());
      setNewCategory('');
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
        <div className={`p-6 ${type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'} border-b border-slate-100`}>
          <h2 className={`text-xl font-bold ${type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
            Add {type === 'income' ? 'Income' : 'Expense'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">Amount</label>
            <input
              type="number"
              required
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-none transition-all text-slate-900 font-semibold text-lg"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">Category</label>
            {!isAddingCategory ? (
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all text-slate-900 font-medium"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-4 py-2 text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors font-bold text-sm border border-indigo-100"
                >
                  + New
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none text-slate-900 font-medium"
                  placeholder="Category name"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none text-slate-900 font-medium"
              placeholder="What was this for?"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}
            >
              Add {type === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
