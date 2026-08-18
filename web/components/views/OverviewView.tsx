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
  Sparkles,
  CloudRain,
  Radio
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
import { useLanguage } from '@/lib/i18n';
import { WeatherWidget } from '../WeatherWidget';

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
  const { t } = useLanguage();

  // Filter top districts if a risk filter is active
  const filteredDistricts = activeFilter === 'ALL'
    ? data.top_at_risk
    : data.top_at_risk.filter(d => d.risk_level === activeFilter);

  const pieColors = ['#C2255C', '#C6362C', '#E8901A', '#146356'];

  return (
    <div className="space-y-6">
      {/* Real-time Weather Strip */}
      <WeatherWidget />

      {/* 1. Top KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monitored Districts */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              {t('overview.monitored_districts')}
            </span>
            <Building2 className="w-4 h-4 text-[#5B6663]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1D2321]">
              {data.summary.total_monitored_districts}
            </span>
            <span className="text-xs text-[#5B6663] font-medium">{t('overview.districts_active')}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>{t('overview.coverage')}</span>
            <span className="font-mono text-[#146356] font-semibold">{t('overview.synced')}</span>
          </div>
        </div>

        {/* High & Critical Outbreaks */}
        <div className="bg-white border-l-4 border-l-[#C6362C] border-[#E2E8F0] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#C6362C] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C6362C] animate-pulse" />
              {t('overview.high_critical')}
            </span>
            <AlertTriangle className="w-4 h-4 text-[#C6362C]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#C6362C]">
              {data.summary.high_critical_districts}
            </span>
            <span className="text-xs font-bold text-[#C6362C] bg-red-50 px-2 py-0.5 rounded-full">
              {t('overview.dho_action')}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>{t('overview.clusters')}</span>
            <button 
              onClick={() => onNavigateTab('alerts')}
              className="text-[#C2255C] font-semibold hover:underline"
            >
              {t('overview.view_feed')} &rarr;
            </button>
          </div>
        </div>

        {/* 7-Day Net Case Delta */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              {t('overview.case_velocity')}
            </span>
            <Activity className="w-4 h-4 text-[#E8901A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1D2321]">
              {data.summary.case_delta_7d_pct}
            </span>
            <span className="text-xs font-bold text-[#E8901A] flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> {t('overview.vs_prev_week')}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>{t('overview.active_cases_total')}</span>
            <span className="font-mono font-bold text-[#1D2321]">{data.summary.active_cases_total} {t('overview.patients')}</span>
          </div>
        </div>

        {/* ASHA Field Workforce */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              {t('overview.asha_telemetry')}
            </span>
            <Users className="w-4 h-4 text-[#146356]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#146356]">
              {data.summary.active_asha_workers}
            </span>
            <span className="text-xs text-[#5B6663] font-medium">{t('overview.workers_reporting')}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>{t('overview.field_uploads')}</span>
            <span className="font-mono text-[#146356] font-semibold">{data.summary.registered_asha_workers ?? 46} {t('overview.pilot_registered')}</span>
          </div>
        </div>
      </div>

      {/* Live IMD Meteorological Telemetry Advisory Strip */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/40 via-white to-sky-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-[#1A5F7A] border border-blue-200">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A5F7A] bg-blue-100/60 px-1.5 py-0.5 rounded">
                Live IMD Feed (AWS Network)
              </span>
              <span className="text-xs text-[#5B6663]">•</span>
              <span className="text-xs font-bold text-[#1D2321]">Active Monsoon Surge Across Maharashtra</span>
            </div>
            <p className="text-[11px] text-[#5B6663] mt-0.5">
              36 Automatic Weather Stations streaming hourly precipitation, relative humidity, and vector gestation multipliers.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('imd' as any)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F6F5F2] text-[#1A5F7A] border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 self-start md:self-auto"
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Inspect IMD Radar & AWS Matrix &rarr;</span>
        </button>
      </div>

      {/* 2. HERO SECTION: Epidemiological Incidence & 14-Day ML Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Primary ML Forecast Focal Point */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C2255C]/10 text-[#C2255C] border border-[#C2255C]/20">
                  Primary Surveillance Model
                </span>
                <span className="text-xs text-[#5B6663]">•</span>
                <span className="text-xs font-mono text-[#5B6663]">LSTM + Spatiotemporal Graph NN</span>
              </div>
              <h2 className="text-lg font-extrabold text-[#1D2321] mt-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#C2255C]" />
                14-Day Epidemiological Incidence & Outbreak Projection
              </h2>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-mono bg-[#F6F5F2] px-3 py-1.5 rounded-lg border border-[#E2E8F0] self-start sm:self-auto">
              <span>Model R²: <strong className="text-[#146356]">0.91</strong></span>
              <span className="text-[#5B6663]">•</span>
              <span>MAE: <strong>3.2 cases/day</strong></span>
            </div>
          </div>

          {/* Explicit Inline Series Disambiguation Legend */}
          <div className="flex flex-wrap items-center gap-4 py-2 px-3 mb-4 bg-[#F6F5F2]/80 rounded-lg border border-[#E2E8F0] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#C6362C] ring-2 ring-[#C6362C]/20" />
              <span className="font-bold text-[#1D2321]">Observed Cases</span>
              <span className="text-[10px] text-[#5B6663] font-mono">(Ground Truth)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-[#E8901A]" />
              <span className="font-bold text-[#1D2321]">LSTM Forecast</span>
              <span className="text-[10px] text-[#5B6663] font-mono">(7-Day Neural Projection)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#BAE6FD]" />
              <span className="font-medium text-[#5B6663]">Precipitation</span>
              <span className="text-[10px] text-[#5B6663] font-mono">(IMD mm)</span>
            </div>
          </div>

          {/* Main Chart Canvas */}
          <div className="h-80 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trend_series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#5B6663', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#5B6663' }} axisLine={false} tickLine={false} label={{ value: 'Cases / Day', angle: -90, position: 'insideLeft', offset: 25, fontSize: 10, fill: '#5B6663' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#5B6663' }} axisLine={false} tickLine={false} label={{ value: 'Rain (mm)', angle: 90, position: 'insideRight', offset: 25, fontSize: 10, fill: '#5B6663' }} />
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    if (name === 'Actual Reported Cases') return [`${val} cases`, 'Ground Truth (Observed)'];
                    if (name === 'ML Predicted Trajectory') return [`${val} cases`, 'LSTM Neural Forecast'];
                    return [`${val} mm`, 'Rainfall (IMD)'];
                  }}
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '10px', 
                    border: '1px solid #E2E8F0', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    padding: '10px 14px'
                  }} 
                />
                <Bar yAxisId="right" dataKey="rainfall" name="Rainfall (mm)" fill="#BAE6FD" fillOpacity={0.65} radius={[3, 3, 0, 0]} barSize={26} />
                <Line yAxisId="left" type="monotone" dataKey="cases" name="Actual Reported Cases" stroke="#C6362C" strokeWidth={3} dot={{ r: 4.5, fill: '#C6362C', strokeWidth: 1.5, stroke: '#FFFFFF' }} activeDot={{ r: 6.5 }} />
                <Line yAxisId="left" type="monotone" dataKey="forecast" name="ML Predicted Trajectory" stroke="#E8901A" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 5, fill: '#E8901A' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (4 cols): Suspected Pathogen Share */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-[#1D2321]">Suspected Pathogen Share</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F6F5F2] text-[#5B6663]">
                {data.summary.active_cases_total} Total
              </span>
            </div>
            <p className="text-xs text-[#5B6663]">Proportion of active cases by category</p>

            <div className="h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.disease_breakdown}
                    dataKey="cases"
                    nameKey="disease"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
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
          </div>

          <div className="space-y-2 pt-3 border-t border-[#E2E8F0]/60">
            {data.disease_breakdown.map((item, idx) => (
              <div key={item.disease} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                  <span className="font-medium text-[#1D2321]">{item.disease}</span>
                </div>
                <div className="font-mono font-bold text-[#5B6663]">
                  {item.cases} <span className="text-[10px] font-normal text-[#5B6663]">({item.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. SECONDARY OPERATIONAL ROW: Spatial Map & Top At-Risk Districts */}
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
            <CompactMap 
              activeFilter={activeFilter} 
              districts={data.top_at_risk} 
              onSelectDistrict={onSelectDistrict} 
            />
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
            <span className="font-mono text-[11px] text-[#146356] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#146356] animate-pulse" /> Live Telemetry
            </span>
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
    </div>
  );
}
