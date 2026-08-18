'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  ArrowUpDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Filter, 
  Eye, 
  X, 
  Activity, 
  Users, 
  Droplets, 
  FileSpreadsheet, 
  CheckCircle2, 
  FileText,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { DistrictData } from '@/lib/api';
import { RiskFilterType } from '../RiskPulseBar';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface DistrictsViewProps {
  districts: DistrictData[];
  activeFilter: RiskFilterType;
  onFilterChange: (filter: RiskFilterType) => void;
  selectedDistrict: DistrictData | null;
  onSelectDistrict: (district: DistrictData | null) => void;
}

type SortField = 'name' | 'risk_score' | 'active_cases' | 'trend_pct' | 'rainfall_mm';
type SortOrder = 'asc' | 'desc';

export function DistrictsView({ 
  districts, 
  activeFilter, 
  onFilterChange, 
  selectedDistrict, 
  onSelectDistrict 
}: DistrictsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isExporting, setIsExporting] = useState(false);

  // Sorting & Filtering
  const filteredAndSortedDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        // Risk Filter
        if (activeFilter !== 'ALL' && d.risk_level !== activeFilter) return false;
        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            d.name.toLowerCase().includes(q) ||
            d.district_id.toLowerCase().includes(q) ||
            d.primary_suspected.toLowerCase().includes(q) ||
            d.state.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' 
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [districts, activeFilter, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const rows = filteredAndSortedDistricts.map(d => ({
        'District ID': d.district_id,
        'District Name': d.name,
        'State': d.state,
        'Risk Band': d.risk_level,
        'AI Risk Score': (d.risk_score * 100).toFixed(1),
        'Active Cases': d.active_cases,
        '7-Day Trend (%)': d.trend_pct,
        'Primary Suspected Disease': d.primary_suspected,
        'Active ASHA Staff': d.asha_active_count,
        'Rainfall (mm)': d.rainfall_mm,
        'Humidity (%)': d.humidity_pct,
        'Population': d.population,
        'Last Logged': d.last_reported
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Arogya_Prahari_Districts_Surveillance_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExporting(false);
      toast.success('Districts surveillance data exported to CSV');
    }, 600);
  };

  const exportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      const rows = filteredAndSortedDistricts.map(d => ({
        'District ID': d.district_id,
        'District Name': d.name,
        'State': d.state,
        'Risk Band': d.risk_level,
        'AI Risk Score': (d.risk_score * 100).toFixed(1),
        'Active Cases': d.active_cases,
        '7-Day Trend (%)': d.trend_pct,
        'Primary Suspected Disease': d.primary_suspected,
        'Active ASHA Staff': d.asha_active_count,
        'Rainfall (mm)': d.rainfall_mm,
        'Humidity (%)': d.humidity_pct,
        'Population': d.population
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Districts Matrix");
      XLSX.writeFile(workbook, `Arogya_Prahari_Districts_${new Date().toISOString().split('T')[0]}.xlsx`);
      setIsExporting(false);
      toast.success('Districts surveillance workbook exported to Excel');
    }, 800);
  };

  // Mock timeline data for drilldown modal
  const districtTimelineData = [
    { day: 'Day 1', cases: 8, threshold: 12 },
    { day: 'Day 3', cases: 14, threshold: 12 },
    { day: 'Day 5', cases: 19, threshold: 15 },
    { day: 'Day 7', cases: 24, threshold: 18 },
    { day: 'Day 9', cases: 31, threshold: 20 },
    { day: 'Day 11', cases: 38, threshold: 22 },
    { day: 'Day 14', cases: selectedDistrict?.active_cases || 42, threshold: 25 },
  ];

  const demographicData = [
    { name: '0-10 Years', value: 24, color: '#C2255C' },
    { name: '11-30 Years', value: 42, color: '#E8901A' },
    { name: '31-60 Years', value: 28, color: '#146356' },
    { name: '60+ Years', value: 16, color: '#5B6663' },
  ];

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters & Export */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5B6663] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search district name, state, or disease..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F6F5F2] border border-[#E2E8F0] rounded-lg text-xs text-[#1D2321] focus:outline-none focus:ring-2 focus:ring-[#C2255C]/30"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B6663] hover:text-[#1D2321]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter buttons & Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F6F5F2] text-[#1D2321] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#5B6663]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F6F5F2] text-[#146356] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#146356]" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Sortable Data Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F5F2] border-b border-[#E2E8F0] text-[#5B6663] font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                <th className="py-3.5 px-4">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-[#1D2321]"
                  >
                    <span>District / State</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">Risk Classification</th>
                <th className="py-3.5 px-4 text-right">
                  <button 
                    onClick={() => handleSort('risk_score')}
                    className="flex items-center gap-1 justify-end w-full hover:text-[#1D2321]"
                  >
                    <span>AI Risk Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <button 
                    onClick={() => handleSort('active_cases')}
                    className="flex items-center gap-1 justify-end w-full hover:text-[#1D2321]"
                  >
                    <span>Active Cases</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <button 
                    onClick={() => handleSort('trend_pct')}
                    className="flex items-center gap-1 justify-end w-full hover:text-[#1D2321]"
                  >
                    <span>7-Day Velocity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">Primary Pathogen</th>
                <th className="py-3.5 px-4 text-right">
                  <button 
                    onClick={() => handleSort('rainfall_mm')}
                    className="flex items-center gap-1 justify-end w-full hover:text-[#1D2321]"
                  >
                    <span>Weather (Rain & RH)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">Field ASHA Staff</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] whitespace-nowrap">
              {filteredAndSortedDistricts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#5B6663]">
                    No districts found matching filter parameters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedDistricts.map((d) => (
                  <tr 
                    key={d.district_id}
                    className="hover:bg-[#F6F5F2]/80 transition-colors cursor-pointer group"
                    onClick={() => onSelectDistrict(d)}
                  >
                    {/* District & State */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1D2321] text-sm">{d.name}</div>
                      <div className="text-[10px] text-[#5B6663] font-mono">{d.state} • {d.district_id}</div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold ${
                        d.risk_level === 'CRITICAL' ? 'bg-[#8B0000] text-white' :
                        d.risk_level === 'HIGH' ? 'bg-[#C6362C] text-white' :
                        d.risk_level === 'MODERATE' ? 'bg-[#E8901A] text-[#1D2321]' :
                        'bg-[#146356] text-white'
                      }`}>
                        {d.risk_level === 'CRITICAL' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {d.risk_level}
                      </span>
                    </td>

                    {/* AI Risk Score (IBM Plex Mono Tabular) */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={
                        d.risk_score >= 0.8 ? 'text-[#8B0000]' :
                        d.risk_score >= 0.7 ? 'text-[#C6362C]' :
                        d.risk_score >= 0.4 ? 'text-[#E8901A]' :
                        'text-[#146356]'
                      }>
                        {(d.risk_score * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* Active Cases */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#1D2321]">
                      {d.active_cases.toLocaleString()}
                    </td>

                    {/* 7-Day Trend */}
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span className={`inline-flex items-center justify-end gap-0.5 ${
                        d.trend_7d === 'UP' ? 'text-[#C6362C]' :
                        d.trend_7d === 'DOWN' ? 'text-[#146356]' :
                        'text-[#5B6663]'
                      }`}>
                        {d.trend_7d === 'UP' && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {d.trend_7d === 'DOWN' && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {d.trend_7d === 'FLAT' && <Minus className="w-3.5 h-3.5" />}
                        <span>{d.trend_pct > 0 ? `+${d.trend_pct.toFixed(1)}%` : `${d.trend_pct.toFixed(1)}%`}</span>
                      </span>
                    </td>

                    {/* Primary Pathogen */}
                    <td className="py-3 px-4 font-medium text-[#1D2321]">
                      {d.primary_suspected}
                    </td>

                    {/* Consolidated Weather */}
                    <td className="py-3 px-4 text-right font-mono text-[#5B6663]">
                      <span className="font-bold text-[#1D2321]">{d.rainfall_mm.toFixed(1)} mm</span>
                      <span className="text-[10px] text-[#5B6663] ml-1.5">({d.humidity_pct}% RH)</span>
                    </td>

                    {/* Active ASHA Staff */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#146356]">
                      {d.asha_active_count} <span className="text-[10px] font-normal text-[#5B6663]">workers</span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDistrict(d);
                        }}
                        className="p-1.5 text-[#5B6663] hover:text-[#C2255C] hover:bg-[#F6F5F2] rounded-md transition-colors"
                        title="View District Breakdown"
                        aria-label={`Inspect ${d.name} telemetry`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-3 bg-[#F6F5F2] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#5B6663]">
          <div>
            Showing <strong className="font-mono text-[#1D2321]">{filteredAndSortedDistricts.length}</strong> of{' '}
            <strong className="font-mono text-[#1D2321]">{districts.length}</strong> districts
          </div>
          <div className="font-mono text-[11px]">
            Data aligned with National IDSP Health Standards
          </div>
        </div>
      </div>

      {/* District Drill-down Inspection Modal */}
      {selectedDistrict && (
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-[#1D2321]">{selectedDistrict.name} District</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    selectedDistrict.risk_level === 'CRITICAL' ? 'bg-[#8B0000] text-white' :
                    selectedDistrict.risk_level === 'HIGH' ? 'bg-[#C6362C] text-white' :
                    selectedDistrict.risk_level === 'MODERATE' ? 'bg-[#E8901A] text-[#1D2321]' :
                    'bg-[#146356] text-white'
                  }`}>
                    {selectedDistrict.risk_level} RISK
                  </span>
                </div>
                <p className="text-xs text-[#5B6663] mt-1">
                  Jurisdiction ID: {selectedDistrict.district_id} • State: {selectedDistrict.state} • Population: {selectedDistrict.population}
                </p>
              </div>

              <button
                onClick={() => onSelectDistrict(null)}
                className="p-1.5 text-[#5B6663] hover:text-[#1D2321] hover:bg-[#F6F5F2] rounded-lg transition-colors"
                aria-label="Close district inspection dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#F6F5F2] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#5B6663] uppercase">AI Risk Score</span>
                <p className="text-xl font-mono font-bold text-[#C6362C]">
                  {(selectedDistrict.risk_score * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-[#F6F5F2] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#5B6663] uppercase">Active Cases</span>
                <p className="text-xl font-mono font-bold text-[#1D2321]">
                  {selectedDistrict.active_cases}
                </p>
              </div>
              <div className="p-3 bg-[#F6F5F2] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#5B6663] uppercase">7-Day Delta</span>
                <p className="text-xl font-mono font-bold text-[#C6362C]">
                  {selectedDistrict.trend_pct > 0 ? `+${selectedDistrict.trend_pct}%` : `${selectedDistrict.trend_pct}%`}
                </p>
              </div>
              <div className="p-3 bg-[#F6F5F2] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#5B6663] uppercase">Active ASHA Staff</span>
                <p className="text-xl font-mono font-bold text-[#146356]">
                  {selectedDistrict.asha_active_count}
                </p>
              </div>
            </div>

            {/* 14-Day Epidemiological Trend Chart */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-[#1D2321] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#C2255C]" />
                  14-Day Incidence Trajectory vs Outbreak Baseline
                </h4>
                <span className="text-[10px] font-mono text-[#5B6663]">ASHA Verified Logs</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={districtTimelineData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5B6663' }} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#5B6663' }} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="cases" name="Actual Cases" stroke="#C6362C" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="threshold" name="Outbreak Warning Trigger" stroke="#E8901A" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demographics & Clinical Factors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Demographics */}
              <div className="p-4 bg-[#F6F5F2] rounded-xl border border-[#E2E8F0]">
                <h4 className="text-xs font-bold text-[#1D2321] uppercase tracking-wider mb-2">
                  Patient Age Cohorts
                </h4>
                <div className="space-y-1.5">
                  {demographicData.map((d) => (
                    <div key={d.name} className="flex justify-between text-xs">
                      <span className="text-[#5B6663]">{d.name}</span>
                      <span className="font-mono font-bold text-[#1D2321]">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environmental Drivers */}
              <div className="p-4 bg-[#F6F5F2] rounded-xl border border-[#E2E8F0]">
                <h4 className="text-xs font-bold text-[#1D2321] uppercase tracking-wider mb-2">
                  Micro-Climate Drivers
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#5B6663]">Rainfall Index:</span>
                    <span className="font-mono font-bold text-[#1D2321]">{selectedDistrict.rainfall_mm} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6663]">Relative Humidity:</span>
                    <span className="font-mono font-bold text-[#1D2321]">{selectedDistrict.humidity_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6663]">Vector Breeding:</span>
                    <span className="font-bold text-[#C6362C]">High Risk Zone</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => onSelectDistrict(null)}
                className="px-4 py-2 bg-white hover:bg-[#F6F5F2] text-[#1D2321] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
              >
                Close Window
              </button>

              <button
                onClick={() => {
                  toast.success(`District ${selectedDistrict.name} flagged for immediate DHO field audit.`);
                  onSelectDistrict(null);
                }}
                className="px-4 py-2 bg-[#C2255C] hover:bg-[#A61E4D] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Schedule Field Audit
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
