'use client';

import React from 'react';
import { 
  AlertTriangle, 
  Activity, 
  Building2, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  TrendingUp, 
  MapPin, 
  Droplets, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  Send,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { LiveDashboardData, DistrictData } from '@/lib/api';
import { RiskFilterType } from '../RiskPulseBar';
import dynamic from 'next/dynamic';

const CompactMap = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => (
    <div className="h-full min-h-[260px] bg-[#EAE8E3]/60 flex items-center justify-center text-xs text-[#5B6663] rounded-lg">
      Loading GIS Map Preview...
    </div>
  ) 
});

interface OverviewViewProps {
  data: LiveDashboardData;
  activeFilter: RiskFilterType;
  onNavigateTab: (tab: any) => void;
  onSelectDistrict: (district: DistrictData) => void;
}

export function OverviewView({ data, activeFilter, onNavigateTab, onSelectDistrict }: OverviewViewProps) {
  // Filter top districts if a risk filter is active
  const filteredDistricts = activeFilter === 'ALL'
    ? data.top_at_risk
    : data.top_at_risk.filter(d => d.risk_level === activeFilter);

  const pieColors = ['#C2255C', '#C6362C', '#E8901A', '#146356'];

  return (
    <div className="space-y-6">
      {/* 1. Top KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monitored Districts */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              Monitored Districts
            </span>
            <Building2 className="w-4 h-4 text-[#5B6663]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1D2321]">
              {data.summary.total_monitored_districts}
            </span>
            <span className="text-xs text-[#5B6663] font-medium">Districts active</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>Coverage: Maharashtra State</span>
            <span className="font-mono text-[#146356] font-semibold">100% Synced</span>
          </div>
        </div>

        {/* High & Critical Outbreaks */}
        <div className="bg-white border-l-4 border-l-[#C6362C] border-[#E2E8F0] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#C6362C] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C6362C] animate-pulse" />
              High/Critical Outbreaks
            </span>
            <AlertTriangle className="w-4 h-4 text-[#C6362C]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#C6362C]">
              {data.summary.high_critical_districts}
            </span>
            <span className="text-xs font-bold text-[#C6362C] bg-red-50 px-2 py-0.5 rounded-full">
              Requires DHO Action
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>Pune & Nashik clusters</span>
            <button 
              onClick={() => onNavigateTab('alerts')}
              className="text-[#C2255C] font-semibold hover:underline"
            >
              View Feed &rarr;
            </button>
          </div>
        </div>

        {/* 7-Day Net Case Delta */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              7-Day Case Velocity
            </span>
            <Activity className="w-4 h-4 text-[#E8901A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1D2321]">
              {data.summary.case_delta_7d_pct}
            </span>
            <span className="text-xs font-bold text-[#E8901A] flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> vs prev week
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>Active Cases Total</span>
            <span className="font-mono font-bold text-[#1D2321]">{data.summary.active_cases_total} patients</span>
          </div>
        </div>

        {/* ASHA Field Workforce */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              Active ASHA Telemetry
            </span>
            <Users className="w-4 h-4 text-[#146356]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#146356]">
              {data.summary.active_asha_workers}
            </span>
            <span className="text-xs text-[#5B6663] font-medium">Workers reporting</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>Field Uploads Today</span>
            <span className="font-mono text-[#146356] font-semibold">1,248 visits</span>
          </div>
        </div>
      </div>

      {/* 2. Main Operational Grid: Map & Top At-Risk Districts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): GIS Outbreak Map Preview */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1D2321] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C2255C]" />
                Spatial Outbreak Preview
              </h2>
              <p className="text-xs text-[#5B6663]">
                Centroid risk overlay across Maharashtra districts with live cluster intensity
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('heatmap')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#C2255C] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
            >
              <span>Full Screen Heatmap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden border border-[#E2E8F0] relative">
            <CompactMap activeFilter={activeFilter} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-[#5B6663] pt-2 border-t border-[#E2E8F0]/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B0000]" /> Critical (0.8+)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6362C]" /> High (0.7+)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8901A]" /> Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#146356]" /> Low / Normal
              </span>
            </div>
            <span className="font-mono text-[11px]">Updated 5m ago</span>
          </div>
        </div>

        {/* Right Column (5 cols): Top At-Risk Districts Table */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1D2321] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C6362C]" />
                Top At-Risk Districts
              </h2>
              <p className="text-xs text-[#5B6663]">
                Immediate DHO triage priority queue
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('districts')}
              className="text-xs text-[#C2255C] font-bold hover:underline"
            >
              All {data.summary.total_monitored_districts} Districts &rarr;
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {filteredDistricts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5B6663]">
                No districts match active filter: <strong>{activeFilter}</strong>
              </div>
            ) : (
              filteredDistricts.map((dist, idx) => (
                <div
                  key={dist.district_id}
                  onClick={() => onSelectDistrict(dist)}
                  className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#C2255C]/40 hover:bg-[#F6F5F2] cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#F6F5F2] text-[#5B6663] font-mono text-xs font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1D2321]">{dist.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          dist.risk_level === 'CRITICAL' ? 'bg-[#8B0000] text-white' :
                          dist.risk_level === 'HIGH' ? 'bg-[#C6362C] text-white' :
                          dist.risk_level === 'MODERATE' ? 'bg-[#E8901A] text-[#1D2321]' :
                          'bg-[#146356] text-white'
                        }`}>
                          {dist.risk_level}
                        </span>
                      </div>
                      <p className="text-xs text-[#5B6663] mt-0.5">
                        {dist.primary_suspected} • {dist.rainfall_mm}mm rain
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-[#1D2321]">
                      {dist.active_cases} cases
                    </div>
                    <div className={`text-[11px] font-mono font-semibold flex items-center justify-end gap-0.5 ${
                      dist.trend_7d === 'UP' ? 'text-[#C6362C]' :
                      dist.trend_7d === 'DOWN' ? 'text-[#146356]' : 'text-[#5B6663]'
                    }`}>
                      {dist.trend_7d === 'UP' && <ArrowUpRight className="w-3 h-3" />}
                      {dist.trend_7d === 'DOWN' && <ArrowDownRight className="w-3 h-3" />}
                      {dist.trend_7d === 'FLAT' && <Minus className="w-3 h-3" />}
                      <span>{dist.trend_pct > 0 ? `+${dist.trend_pct}%` : `${dist.trend_pct}%`}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0]/80">
            <button
              onClick={() => onNavigateTab('alerts')}
              className="w-full py-2 bg-[#C2255C] hover:bg-[#A61E4D] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Review Urgent Outbreak Alerts</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Epidemiological Trends & Disease Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): 7-Day Incidence vs Forecast */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-bold text-[#1D2321] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#C2255C]" />
                Epidemiological Incidence & ML Forecast
              </h2>
              <p className="text-xs text-[#5B6663]">
                Daily reported cases (SOS Red), 7-Day LSTM projection (Amber dashed), and Precipitation correlation (Blue)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-[#F6F5F2] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
              <span>R² Score: <strong>0.91</strong></span>
              <span>•</span>
              <span>MAE: <strong>3.2 cases</strong></span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trend_series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5B6663' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#5B6663' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#5B6663' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '8px', 
                    border: '1px solid #E2E8F0', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    fontSize: '12px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="right" dataKey="rainfall" name="Rainfall (mm)" fill="#BAE6FD" radius={[3, 3, 0, 0]} barSize={24} />
                <Line yAxisId="left" type="monotone" dataKey="cases" name="Actual Reported Cases" stroke="#C6362C" strokeWidth={2.5} dot={{ r: 4, fill: '#C6362C' }} />
                <Line yAxisId="left" type="monotone" dataKey="forecast" name="ML Predicted Trajectory" stroke="#E8901A" strokeWidth={2.5} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (4 cols): Suspected Disease Share */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#1D2321]">Suspected Pathogen Share</h2>
            <p className="text-xs text-[#5B6663]">Proportion of active cases by category</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.disease_breakdown}
                  dataKey="cases"
                  nameKey="disease"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {data.disease_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val} cases`, name]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto space-y-2 pt-3 border-t border-[#E2E8F0]/60">
            {data.disease_breakdown.map((item, idx) => (
              <div key={item.disease} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                  <span className="font-medium text-[#1D2321]">{item.disease}</span>
                </div>
                <div className="font-mono font-bold text-[#5B6663]">
                  {item.cases} ({item.pct}%)
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
