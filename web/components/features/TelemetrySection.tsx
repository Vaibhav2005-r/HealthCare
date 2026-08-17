'use client';

import { useEffect, useState } from 'react';
import { fetchTelemetryLogs } from '@/lib/api';
import { getRiskTier } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, RefreshCw } from 'lucide-react';

interface TelemetryRecord {
  id: string;
  worker_id: string;
  patient_name?: string;
  patient_age?: number;
  symptoms: string[];
  status: string;
  sync_method: string;
  reported_at: string;
  village?: string;
  district?: string;
}

export default function FieldTelemetryPage() {
  const [reports, setReports] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTelemetryLogs(districtFilter !== 'ALL' ? districtFilter : undefined);
      setReports(data as TelemetryRecord[]);
    } catch (err) {
      console.error('Failed to load telemetry logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [districtFilter]);

  const filteredReports = reports.filter(r => {
    if (riskFilter !== 'ALL' && r.status?.toUpperCase() !== riskFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchWorker = r.worker_id?.toLowerCase().includes(q);
      const matchVillage = r.village?.toLowerCase().includes(q);
      const matchPatient = r.patient_name?.toLowerCase().includes(q);
      const matchSymptoms = r.symptoms?.some(s => s.toLowerCase().includes(q));
      if (!matchWorker && !matchVillage && !matchPatient && !matchSymptoms) return false;
    }
    return true;
  });

  const paginatedReports = filteredReports.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ASHA Field Telemetry</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time symptom logs streamed directly from frontline health workers into Supabase.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search patient, worker, village..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
            />
          </div>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50">
          <select value={districtFilter} onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }} className="border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 text-slate-700 bg-white">
            <option value="ALL">All Districts</option>
            <option value="Pune">Pune</option>
            <option value="Nashik">Nashik</option>
            <option value="Thane">Thane</option>
            <option value="Kolhapur">Kolhapur</option>
            <option value="Nagpur">Nagpur</option>
          </select>
          <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }} className="border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 text-slate-700 bg-white">
            <option value="ALL">All Risk Levels</option>
            <option value="GREEN">Green (Low Risk)</option>
            <option value="AMBER">Amber (Moderate)</option>
            <option value="RED">Red (Critical Alert)</option>
          </select>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50"><div className="flex items-center gap-1">Log ID <ArrowUpDown className="w-3 h-3"/></div></th>
                <th className="px-6 py-4">Village & District</th>
                <th className="px-6 py-4">Patient Profile</th>
                <th className="px-6 py-4">Logged Symptoms</th>
                <th className="px-6 py-4">Risk Status</th>
                <th className="px-6 py-4">Sync Audit</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium animate-pulse">
                    Loading live Supabase telemetry records...
                  </td>
                </tr>
              ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No records found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report) => {
                  const isRed = report.status?.toUpperCase() === 'RED' || report.status?.toUpperCase() === 'SEVERE';
                  const isAmber = report.status?.toUpperCase() === 'AMBER' || report.status?.toUpperCase() === 'MODERATE';
                  const riskScore = isRed ? 0.85 : isAmber ? 0.55 : 0.20;
                  const tier = getRiskTier(riskScore);
                  const isOfflineBatched = report.sync_method === 'BATCH_SQLITE' || report.sync_method === 'OFFLINE';
                  
                  return (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {report.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <div>{report.village || 'Primary Health Center'}</div>
                        <div className="text-xs text-slate-400 font-normal">{report.district || 'Maharashtra'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{report.patient_name || 'Patient'}</div>
                        <div className="text-xs text-slate-400">{report.patient_age ? `${report.patient_age} yrs` : 'Age N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {report.symptoms && report.symptoms.map(sym => (
                            <span key={sym} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{sym}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold border" 
                              style={{ 
                                backgroundColor: `${tier.color}15`, 
                                color: tier.color,
                                borderColor: `${tier.color}30` 
                              }}>
                          {tier.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isOfflineBatched ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Batched (SQLite)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Supabase Synced
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {report.reported_at ? new Date(report.reported_at).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        }) : 'Just now'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900">{filteredReports.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}</span> to <span className="text-slate-900">{Math.min(page * itemsPerPage, filteredReports.length)}</span> of <span className="text-slate-900">{filteredReports.length}</span> entries
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
