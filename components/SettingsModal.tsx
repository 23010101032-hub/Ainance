import React, { useState, useRef } from 'react';
import { UserSettings } from '../types';
import { CURRENCIES } from '../constants';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
  onClearData: () => void;
  onImport: (file: File) => void;
  onImportCSV: (file: File) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ settings, onSave, onClearData, onImport, onImportCSV, onExportCSV, onExportJSON, onClose }) => {
  const [name, setName] = useState(settings.name);
  const [currency, setCurrency] = useState(settings.currency);
  const [showConfirm, setShowConfirm] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave({ name: name.trim() || 'Guest User', currency });
    onClose();
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      onClose();
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      onClose();
    }
  };

  const requestNotifPermission = async () => {
    if ("Notification" in window) {
      try {
        const res = await Notification.requestPermission();
        alert(`Notifications status: ${res}`);
        if (res === 'granted') {
          new Notification("FinTrack Pro", { body: "Daily reminders enabled successfully! ✅" });
        }
      } catch (e) {
        alert("System notifications are restricted in this app environment.");
      }
    } else {
      alert("System notifications are not supported on this device/browser.");
    }
  };

  const notifStatus = ("Notification" in window) ? Notification.permission : "Not Supported";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden transform animate-fade-in-scale max-h-[90vh] flex flex-col">
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">App Settings</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors active:scale-90">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1">
          {/* Profile Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Your Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none text-slate-900 font-black transition-all text-lg"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none text-slate-900 font-black transition-all appearance-none cursor-pointer"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>
                ))}
              </select>
            </div>
            
            {/* Notification Control */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Daily Reminders</label>
              <div className="bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900 capitalize">{notifStatus}</p>
                  <p className="text-[10px] font-bold text-slate-500 italic">Push alerts for data entry</p>
                </div>
                <button onClick={requestNotifPermission} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs hover:bg-indigo-100 transition-colors">
                  {notifStatus === 'granted' ? 'Test' : 'Enable'}
                </button>
              </div>
            </div>
          </div>

          {/* Data Tools */}
          <div className="pt-8 border-t border-slate-100 space-y-5">
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Portability / Export</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onExportCSV} className="px-4 py-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-100 transition-all font-black text-[10px] flex flex-col items-center gap-2 group active:scale-95">
                  <svg className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  XLSX / CSV
                </button>
                <button onClick={onExportJSON} className="px-4 py-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-100 transition-all font-black text-[10px] flex flex-col items-center gap-2 group active:scale-95">
                  <svg className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                  JSON FILE
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Recovery / Import</h3>
              <div className="space-y-3">
                <input type="file" ref={csvInputRef} onChange={handleCsvChange} accept=".csv" className="hidden" />
                <button 
                  onClick={() => csvInputRef.current?.click()}
                  className="w-full px-6 py-4 bg-emerald-50 text-emerald-700 font-black rounded-2xl hover:bg-emerald-100 transition-all text-xs flex items-center justify-center gap-2 border-2 border-emerald-100 active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  RECOVER FROM CSV
                </button>

                <input type="file" ref={jsonInputRef} onChange={handleJsonChange} accept=".json" className="hidden" />
                <button 
                  onClick={() => jsonInputRef.current?.click()}
                  className="w-full px-6 py-4 bg-indigo-50 text-indigo-700 font-black rounded-2xl hover:bg-indigo-100 transition-all text-xs flex items-center justify-center gap-2 border-2 border-indigo-100 active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  RESTORE FROM JSON
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-2 text-center">
             {!showConfirm ? (
                <button onClick={() => setShowConfirm(true)} className="text-rose-400 text-[10px] font-black tracking-widest uppercase hover:text-rose-600 transition-colors">
                  Reset App & Delete Data
                </button>
             ) : (
                <div className="bg-rose-50 p-6 rounded-[1.5rem] border-2 border-rose-100 space-y-4 animate-shake">
                  <p className="text-sm text-rose-900 font-black">Wipe everything?</p>
                  <p className="text-[10px] text-rose-700 font-bold leading-relaxed">This will erase all locally stored data. Ensure you have exported a CSV/JSON file first.</p>
                  <div className="flex gap-3">
                    <button onClick={onClearData} className="flex-1 px-4 py-3 bg-rose-600 text-white text-[10px] font-black rounded-xl active:scale-95">WIPE NOW</button>
                    <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-3 bg-white text-slate-700 text-[10px] font-black border-2 border-slate-200 rounded-xl active:scale-95">CANCEL</button>
                  </div>
                </div>
             )}
          </div>
        </div>

        <div className="p-8 sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4.5 text-slate-700 font-black hover:bg-slate-50 rounded-[1.25rem] border-2 border-slate-100 transition-all active:scale-95"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-4.5 bg-indigo-600 text-white font-black rounded-[1.25rem] hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;