'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, AlertOctagon, Filter, X } from 'lucide-react';

export type RiskFilterType = 'ALL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

interface RiskPulseBarProps {
  pulse: {
    total_districts: number;
    low_count: number;
    moderate_count: number;
    high_count: number;
    critical_count: number;
  };
  activeFilter: RiskFilterType;
  onSelectFilter: (filter: RiskFilterType) => void;
}

export function RiskPulseBar({ pulse, activeFilter, onSelectFilter }: RiskPulseBarProps) {
  const total = pulse.total_districts || 1;
  const lowPct = ((pulse.low_count / total) * 100).toFixed(1);
  const modPct = ((pulse.moderate_count / total) * 100).toFixed(1);
  const highPct = ((pulse.high_count / total) * 100).toFixed(1);
  const critPct = ((pulse.critical_count / total) * 100).toFixed(1);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
      {/* Header with Title and Current Filter state */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5B6663]">
            Signature Surveillance Element
          </span>
          <span className="text-xs text-[#5B6663]">•</span>
          <h2 className="text-sm font-bold text-[#1D2321] flex items-center gap-1.5">
            Risk Pulse Bar <span className="text-xs font-normal text-[#5B6663]">(Live District Distribution & Global Filter)</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {activeFilter !== 'ALL' ? (
            <div className="flex items-center gap-1.5 bg-[#F6F5F2] border border-[#C2255C]/30 text-[#C2255C] px-2.5 py-1 rounded-full text-xs font-semibold">
              <Filter className="w-3 h-3" />
              <span>Filtered by: <strong>{activeFilter} RISK</strong></span>
              <button 
                onClick={() => onSelectFilter('ALL')}
                className="hover:bg-[#C2255C]/10 rounded-full p-0.5 ml-1 transition-colors"
                title="Clear filter"
                aria-label="Clear active risk filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#5B6663] font-medium hidden sm:inline">
              Click any risk segment to filter entire dashboard
            </span>
          )}
        </div>
      </div>

      {/* Stacked Interactive Bar */}
      <div 
        className="w-full h-7 rounded-lg overflow-hidden flex bg-[#EAE8E3] cursor-pointer shadow-inner p-0.5 gap-0.5 border border-[#E2E8F0]"
        role="group"
        aria-label="Filter districts by risk level"
      >
        {/* Critical Segment */}
        {pulse.critical_count > 0 && (
          <button
            onClick={() => onSelectFilter(activeFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            style={{ width: `${critPct}%` }}
            className={`h-full bg-[#8B0000] text-white flex items-center justify-center transition-all relative overflow-hidden group ${
              activeFilter === 'CRITICAL' ? 'ring-2 ring-white scale-[1.02] z-10 shadow-lg' : 'opacity-90 hover:opacity-100'
            }`}
            title={`Critical Risk: ${pulse.critical_count} districts (${critPct}%)`}
            aria-pressed={activeFilter === 'CRITICAL'}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:12px_12px] opacity-40 animate-[pulse_2s_infinite]" />
            <span className="relative z-10 text-[11px] font-mono font-bold tracking-tight px-1 truncate">
              {pulse.critical_count} CRITICAL
            </span>
          </button>
        )}

        {/* High Segment */}
        {pulse.high_count > 0 && (
          <button
            onClick={() => onSelectFilter(activeFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            style={{ width: `${highPct}%` }}
            className={`h-full bg-[#C6362C] text-white flex items-center justify-center transition-all group ${
              activeFilter === 'HIGH' ? 'ring-2 ring-white scale-[1.02] z-10 shadow-lg' : 'opacity-90 hover:opacity-100'
            }`}
            title={`High Risk: ${pulse.high_count} districts (${highPct}%)`}
            aria-pressed={activeFilter === 'HIGH'}
          >
            <span className="text-[11px] font-mono font-bold tracking-tight px-1 truncate">
              {pulse.high_count} HIGH
            </span>
          </button>
        )}

        {/* Moderate Segment */}
        {pulse.moderate_count > 0 && (
          <button
            onClick={() => onSelectFilter(activeFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
            style={{ width: `${modPct}%` }}
            className={`h-full bg-[#E8901A] text-white flex items-center justify-center transition-all group ${
              activeFilter === 'MODERATE' ? 'ring-2 ring-white scale-[1.02] z-10 shadow-lg' : 'opacity-90 hover:opacity-100'
            }`}
            title={`Moderate Risk: ${pulse.moderate_count} districts (${modPct}%)`}
            aria-pressed={activeFilter === 'MODERATE'}
          >
            <span className="text-[11px] font-mono font-bold tracking-tight px-1 truncate text-[#1D2321]">
              {pulse.moderate_count} MODERATE
            </span>
          </button>
        )}

        {/* Low Segment */}
        {pulse.low_count > 0 && (
          <button
            onClick={() => onSelectFilter(activeFilter === 'LOW' ? 'ALL' : 'LOW')}
            style={{ width: `${lowPct}%` }}
            className={`h-full bg-[#146356] text-white flex items-center justify-center transition-all group ${
              activeFilter === 'LOW' ? 'ring-2 ring-white scale-[1.02] z-10 shadow-lg' : 'opacity-90 hover:opacity-100'
            }`}
            title={`Low Risk: ${pulse.low_count} districts (${lowPct}%)`}
            aria-pressed={activeFilter === 'LOW'}
          >
            <span className="text-[11px] font-mono font-bold tracking-tight px-1 truncate">
              {pulse.low_count} LOW
            </span>
          </button>
        )}
      </div>

      {/* Summary Stat Pills Under Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-[#E2E8F0]/60">
        {/* All Filter Pill */}
        <button
          onClick={() => onSelectFilter('ALL')}
          className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
            activeFilter === 'ALL'
              ? 'bg-[#F6F5F2] border-[#C2255C] shadow-sm ring-1 ring-[#C2255C]'
              : 'bg-white border-[#E2E8F0] hover:bg-[#F6F5F2]'
          }`}
        >
          <div>
            <div className="text-[10px] font-bold text-[#5B6663] uppercase">All Districts</div>
            <div className="text-sm font-mono font-bold text-[#1D2321]">{pulse.total_districts} Total</div>
          </div>
          <span className="text-[10px] font-mono text-[#5B6663] font-medium">100%</span>
        </button>

        {/* Critical Filter Pill */}
        <button
          onClick={() => onSelectFilter(activeFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
            activeFilter === 'CRITICAL'
              ? 'bg-red-50 border-[#8B0000] shadow-sm ring-1 ring-[#8B0000]'
              : 'bg-white border-[#E2E8F0] hover:bg-red-50/40'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8B0000] animate-pulse" />
            <div>
              <div className="text-[10px] font-bold text-[#8B0000] uppercase">Critical</div>
              <div className="text-sm font-mono font-bold text-[#8B0000]">{pulse.critical_count} Districts</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#8B0000] font-bold">{critPct}%</span>
        </button>

        {/* High Filter Pill */}
        <button
          onClick={() => onSelectFilter(activeFilter === 'HIGH' ? 'ALL' : 'HIGH')}
          className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
            activeFilter === 'HIGH'
              ? 'bg-red-50/60 border-[#C6362C] shadow-sm ring-1 ring-[#C6362C]'
              : 'bg-white border-[#E2E8F0] hover:bg-red-50/30'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C6362C]" />
            <div>
              <div className="text-[10px] font-bold text-[#C6362C] uppercase">High</div>
              <div className="text-sm font-mono font-bold text-[#C6362C]">{pulse.high_count} Districts</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#C6362C] font-bold">{highPct}%</span>
        </button>

        {/* Moderate Filter Pill */}
        <button
          onClick={() => onSelectFilter(activeFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
          className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
            activeFilter === 'MODERATE'
              ? 'bg-amber-50 border-[#E8901A] shadow-sm ring-1 ring-[#E8901A]'
              : 'bg-white border-[#E2E8F0] hover:bg-amber-50/40'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E8901A]" />
            <div>
              <div className="text-[10px] font-bold text-[#E8901A] uppercase">Moderate</div>
              <div className="text-sm font-mono font-bold text-[#1D2321]">{pulse.moderate_count} Districts</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#5B6663] font-bold">{modPct}%</span>
        </button>

        {/* Low Filter Pill */}
        <button
          onClick={() => onSelectFilter(activeFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
            activeFilter === 'LOW'
              ? 'bg-emerald-50 border-[#146356] shadow-sm ring-1 ring-[#146356]'
              : 'bg-white border-[#E2E8F0] hover:bg-emerald-50/40'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#146356]" />
            <div>
              <div className="text-[10px] font-bold text-[#146356] uppercase">Low / Normal</div>
              <div className="text-sm font-mono font-bold text-[#146356]">{pulse.low_count} Districts</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#146356] font-bold">{lowPct}%</span>
        </button>
      </div>
    </div>
  );
}
