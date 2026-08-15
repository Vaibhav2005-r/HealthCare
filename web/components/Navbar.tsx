'use client';

import { Bell, ShieldCheck } from 'lucide-react';

export function Navbar() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 uppercase">District</label>
          <select className="text-sm font-medium border-none bg-transparent outline-none cursor-pointer">
            <option>All Districts</option>
            <option>Central District</option>
            <option>North District</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">System Operational</span>
        </div>
        
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>
      </div>
    </header>
  );
}
