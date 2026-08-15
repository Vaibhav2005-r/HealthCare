'use client';

import { useEffect, useState } from 'react';
import { getReports } from '@smarthealth/api-client';
import { SymptomReport } from '@smarthealth/types';
import { getRiskTier } from '@/lib/utils';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export default function FieldTelemetryPage() {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [diseaseFilter, setDiseaseFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getReports();
      setReports(data as SymptomReport[]);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredReports = reports.filter(r => {
    if (diseaseFilter !== 'ALL' && r.diseaseType !== diseaseFilter) return false;
    if (riskFilter !== 'ALL' && r.outcome !== riskFilter) return false;
    return true;
  });

  const paginatedReports = filteredReports.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ASHA Field Telemetry</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time symptom logs from frontline health workers.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Search ID or village..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50">
          <select value={diseaseFilter} onChange={(e) => setDiseaseFilter(e.target.value)} className="border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 text-slate-700">
            <option value="ALL">All Diseases</option>
            <option value="CHOLERA">Cholera</option>
            <option value="MALARIA">Malaria</option>
            <option value="DENGUE">Dengue</option>
          </select>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 text-slate-700">
            <option value="ALL">All Risk Levels</option>
            <option value="GREEN">Green</option>
            <option value="AMBER">Amber</option>
            <option value="RED">Red</option>
          </select>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50"><div className="flex items-center gap-1">Log ID <ArrowUpDown className="w-3 h-3"/></div></th>
                <th className="px-6 py-4">Village</th>
                <th className="px-6 py-4">Patient Profile</th>
                <th className="px-6 py-4">Symptoms</th>
                <th className="px-6 py-4">Risk Status</th>
                <th className="px-6 py-4">Sync Audit</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium animate-pulse">
                    Loading telemetry data...
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
                  const riskScore = report.outcome === 'RED' ? 0.8 : report.outcome === 'AMBER' ? 0.5 : 0.2;
                  const tier = getRiskTier(riskScore);
                  
                  // Mock random sync status for realism
                  const isOfflineBatched = Math.random() > 0.7;
                  
                  return (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{report.id.substring(0, 10)}...</td>
                      <td className="px-6 py-4 font-medium">{report.villageId}</td>
                      <td className="px-6 py-4">
                        {report.patientAge}y, {report.patientGender}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {report.symptoms.map(sym => (
                            <span key={sym} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">{sym}</span>
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
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Instant Online
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(report.timestamp).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900">{(page - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(page * itemsPerPage, filteredReports.length)}</span> of <span className="text-slate-900">{filteredReports.length}</span> entries
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
