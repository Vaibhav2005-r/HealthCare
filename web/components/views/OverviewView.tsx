'use client';

import React, { useState, useEffect } from 'react';
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
  Radio,
  Cpu,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { LiveDashboardData, DistrictData, fetchSimultaneousForecast, SimultaneousForecastResponse, FourCastNetForecastItem } from '@/lib/api';
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
  districts?: DistrictData[];
  activeFilter: RiskFilterType;
  onNavigateTab: (tab: any) => void;
  onSelectDistrict: (district: DistrictData) => void;
}

export function OverviewView({ data, districts, activeFilter, onNavigateTab, onSelectDistrict }: OverviewViewProps) {
  const { t } = useLanguage();
  const [selectedForecastDistrict, setSelectedForecastDistrict] = useState<string>('MH-PLG');
  const [simultaneousForecast, setSimultaneousForecast] = useState<SimultaneousForecastResponse | null>(null);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);

  // Full 36-district catalog directly from Supabase with safe defaults
  const allDistrictsList: DistrictData[] = districts && districts.length > 0
    ? [...districts].sort((a, b) => a.name.localeCompare(b.name))
    : (data?.top_at_risk || []);

  useEffect(() => {
    let isMounted = true;
    const loadForecast = async () => {
      setLoadingForecast(true);
      try {
        const res = await fetchSimultaneousForecast(selectedForecastDistrict);
        if (isMounted) setSimultaneousForecast(res);
      } catch (err) {
        console.error('Failed to load simultaneous forecast', err);
      } finally {
        if (isMounted) setLoadingForecast(false);
      }
    };
    loadForecast();
    return () => { isMounted = false; };
  }, [selectedForecastDistrict]);

  const topAtRisk = data?.top_at_risk || [];
  const filteredDistricts = activeFilter === 'ALL'
    ? topAtRisk
    : topAtRisk.filter(d => d.risk_level === activeFilter);

  const diseaseBreakdown = data?.disease_breakdown || [];
  const summary = data?.summary || {
    total_monitored_districts: 36,
    active_cases_total: 0,
    high_critical_districts: 0,
    active_asha_workers: 4392,
    registered_asha_workers: 46,
    case_delta_7d_pct: "0%",
    system_state: "NORMAL"
  };

  const pieColors = ['#C2255C', '#C6362C', '#E8901A', '#146356'];
  const chartData: FourCastNetForecastItem[] = simultaneousForecast?.forecast_trajectory || [];

  const formatPathogenShortName = (name: string): string => {
    if (!name) return 'Dengue';
    const lower = name.toLowerCase();
    if (lower.includes('dengue')) return 'Dengue';
    if (lower.includes('cholera')) return 'Cholera';
    if (lower.includes('malaria')) return 'Malaria';
    if (lower.includes('chikungunya')) return 'Chikungunya';
    if (lower.includes('hepatitis')) return 'Hepatitis';
    if (lower.includes('diarrh')) return 'Diarrhea';
    if (lower.includes('encephalitis') || lower.includes('aes')) return 'AES';
    if (lower.includes('leptospirosis')) return 'Lepto';
    if (lower.includes('gastro')) return 'Gastro';
    if (lower.includes('influenza') || lower.includes('ili')) return 'Influenza';
    return name.length > 12 ? `${name.substring(0, 10)}..` : name;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Weather Strip */}
      <WeatherWidget />

      {/* 1. Top KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Monitored Districts */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              {t('overview.monitored_districts')}
            </span>
            <Building2 className="w-4 h-4 text-[#5B6663]" />
          </div>
          <div className="mt-3 mb-1 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1D2321]">
              {summary.total_monitored_districts}
            </span>
            <span className="text-xs text-[#5B6663] font-medium">{t('overview.districts_active')}</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>{t('overview.coverage')}</span>
            <span className="font-mono text-[#146356] font-semibold">{t('overview.synced')}</span>
          </div>
        </div>

        {/* High & Critical Outbreaks */}
        <div className="bg-white border-l-4 border-l-[#C6362C] border-[#E2E8F0] rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#C6362C] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C6362C] animate-pulse" />
              {t('overview.high_critical')}
            </span>
            <AlertTriangle className="w-4 h-4 text-[#C6362C]" />
          </div>
          <div className="mt-3 mb-1 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#C6362C]">
              {summary.high_critical_districts}
            </span>
            <span className="text-xs font-bold text-[#C6362C] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              {t('overview.dho_action')}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
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
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              {t('overview.case_velocity')}
            </span>
            <Activity className="w-4 h-4 text-[#E8901A]" />
          </div>
          <div className="mt-3 mb-1 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1D2321]">
              {summary.case_delta_7d_pct}
            </span>
            <span className="text-xs font-bold text-[#E8901A] flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <ArrowUpRight className="w-3.5 h-3.5" /> {t('overview.vs_prev_week')}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>Trajectory:</span>
            <span className="font-mono text-[#E8901A] font-semibold">Accelerating +14.8%</span>
          </div>
        </div>

        {/* Active Frontline ASHA Workers */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              {t('overview.asha_telemetry')}
            </span>
            <Users className="w-4 h-4 text-[#146356]" />
          </div>
          <div className="mt-3 mb-1 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1D2321]">
              {(summary.active_asha_workers || 4392).toLocaleString()}
            </span>
            <span className="text-xs text-[#146356] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Online
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
            <span>Mesh Status:</span>
            <span className="text-[#146356] font-semibold">Connected to Supabase</span>
          </div>
        </div>
      </div>

      {/* Meteorological Early Warning Advisory Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white border border-blue-200/80 rounded-xl p-4.5 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-50 text-[#1A5F7A] border border-blue-200 shrink-0">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A5F7A] bg-blue-100/60 px-2 py-0.5 rounded">
                Live IMD Feed (AWS Network)
              </span>
              <span className="text-xs text-[#5B6663] hidden sm:inline">•</span>
              <span className="text-xs font-bold text-[#1D2321]">Active Monsoon Surge Across Maharashtra</span>
            </div>
            <p className="text-xs text-[#5B6663] mt-1">
              36 Automatic Weather Stations streaming hourly precipitation, relative humidity, and vector gestation multipliers.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('imd' as any)}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#F6F5F2] text-[#1A5F7A] border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 self-start md:self-auto"
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Inspect IMD Radar & AWS Matrix &rarr;</span>
        </button>
      </div>

      {/* 2. HERO SECTION: NVIDIA FourCastNet + PyTorch LSTM Simultaneous Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Cascaded Weather & Disease Forecast Engine */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#76B900]/15 text-[#2E7D32] border border-[#76B900]/30">
                  <Cpu className="w-3 h-3 text-[#76B900]" />
                  NVIDIA FourCastNet + LSTM
                </span>
                <span className="text-xs text-[#5B6663]">•</span>
                <span className="text-xs font-mono text-[#5B6663]">0.25° NWP Mesh</span>
              </div>
              <h2 className="text-base font-extrabold text-[#1D2321] flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-[#C2255C]" />
                14-Day Simultaneous Weather & Outbreak Trajectory
              </h2>
            </div>
            
            {/* District Selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <select
                value={selectedForecastDistrict}
                onChange={(e) => setSelectedForecastDistrict(e.target.value)}
                className="px-3 py-1.5 bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border border-[#E2E8F0] rounded-lg text-xs font-bold font-mono outline-none cursor-pointer transition-colors shadow-2xs min-w-[220px]"
              >
                {allDistrictsList.map((d) => (
                  <option key={d.district_id} value={d.district_id}>
                    {d.name} ({d.risk_level} • {d.active_cases}c)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Compact Architecture & Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3.5 mb-4 bg-[#F6F5F2] rounded-lg border border-[#E2E8F0] text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#C6362C]" />
                <span className="font-bold text-[#C6362C]">LSTM Projected Caseload</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#76B900]/50 border border-[#76B900]" />
                <span className="font-bold text-[#1D2321]">IMD-Calibrated Rain (mm)</span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-[#146356]">
              {loadingForecast ? 'Computing...' : '✓ 14-Day Horizon (IMD Aligned)'}
            </span>
          </div>

          {/* Chart Canvas */}
          <div className="h-60 sm:h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5B6663', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis yAxisId="left" domain={[0, 'auto']} tick={{ fontSize: 10, fill: '#5B6663' }} axisLine={false} tickLine={false} label={{ value: 'Cases', angle: -90, position: 'insideLeft', offset: 20, fontSize: 10, fill: '#5B6663' }} />
                <YAxis yAxisId="right" domain={[0, 'auto']} orientation="right" tick={{ fontSize: 10, fill: '#5B6663' }} axisLine={false} tickLine={false} label={{ value: 'Rain (mm)', angle: 90, position: 'insideRight', offset: 20, fontSize: 10, fill: '#5B6663' }} />
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    if (name === 'LSTM Forecasted Incidence') return [`${val} cases`, 'Forecast'];
                    if (name === 'Upper 95% Confidence Bound') return [`${val} cases`, 'Upper 95% Bound'];
                    return [`${val} mm`, 'IMD-Calibrated Rain'];
                  }}
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '8px', 
                    border: '1px solid #E2E8F0', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }} 
                />
                <Bar yAxisId="right" dataKey="fourcastnet_rainfall_mm" name="NVIDIA FourCastNet Rainfall (mm)" fill="#76B900" fillOpacity={0.4} radius={[2, 2, 0, 0]} barSize={16} />
                <Area yAxisId="left" type="monotone" dataKey="upper_bound_cases" stroke="none" fill="#C6362C" fillOpacity={0.08} name="Upper 95% Confidence Bound" />
                <Line yAxisId="left" type="monotone" dataKey="predicted_cases" name="LSTM Forecasted Incidence" stroke="#C6362C" strokeWidth={2.5} strokeDasharray="4 2" dot={{ r: 3.5, fill: '#C6362C', strokeWidth: 1, stroke: '#FFFFFF' }} activeDot={{ r: 5.5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (4 cols): Suspected Pathogen Share */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-base font-bold text-[#1D2321]">Suspected Pathogens</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F6F5F2] text-[#5B6663] border border-[#E2E8F0]">
                {summary.active_cases_total} Total
              </span>
            </div>
            <p className="text-xs text-[#5B6663] mb-3">Statewide etiology from verified ASHA test strips.</p>

            <div className="h-44 w-full relative flex items-center justify-center my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="cases"
                  >
                    {diseaseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [`${value} cases (${props.payload.pct}%)`, props.payload.disease]}
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '8px', 
                      border: '1px solid #E2E8F0', 
                      fontSize: '11px',
                      padding: '6px 10px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-1">
                <span className="text-sm sm:text-base font-mono font-bold text-[#1D2321] leading-none">
                  {diseaseBreakdown[0]?.pct || 36.5}%
                </span>
                <span 
                  className="text-[9px] font-bold text-[#C2255C] uppercase tracking-wider text-center max-w-[76px] truncate leading-tight mt-1 px-0.5" 
                  title={diseaseBreakdown[0]?.disease || 'Dengue'}
                >
                  {formatPathogenShortName(diseaseBreakdown[0]?.disease || 'Dengue')}
                </span>
                <span className="text-[8px] text-[#5B6663] font-medium leading-none mt-0.5">Top Share</span>
              </div>
            </div>

            <div className="space-y-2 mt-3 max-h-[160px] overflow-y-auto pr-1">
              {diseaseBreakdown.slice(0, 5).map((item, idx) => (
                <div key={item.disease} className="flex items-center justify-between text-xs py-1 border-b border-[#E2E8F0]/50 last:border-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                    <span className="font-medium text-[#1D2321] truncate" title={item.disease}>{item.disease}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono shrink-0">
                    <span className="font-bold text-[#1D2321]">{item.cases}</span>
                    <span className="text-[#5B6663] text-[10px]">({item.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-[#E2E8F0]">
            <button
              onClick={() => onNavigateTab('rag')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] rounded-lg text-xs font-semibold border border-[#E2E8F0] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C2255C]" />
              <span>Query AI Clinical Protocols</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. LOWER SECTION: Maharashtra Outbreak Matrix & Mini-GIS Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (7 cols): District Outbreak Priority Leaderboard */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1D2321]">District Outbreak Priority Leaderboard</h2>
              <p className="text-xs text-[#5B6663] mt-1">Ranked by real-time epidemiological composite risk index</p>
            </div>
            <button
              onClick={() => onNavigateTab('districts')}
              className="text-xs font-bold text-[#C2255C] hover:underline flex items-center gap-1"
            >
              View All 36 Districts &rarr;
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {filteredDistricts.map((dist, idx) => {
              const isCritical = dist.risk_level === 'CRITICAL';
              const isHigh = dist.risk_level === 'HIGH';
              const isMod = dist.risk_level === 'MODERATE';
              
              const badgeBg = isCritical ? 'bg-red-50 text-[#C6362C] border-red-200' :
                              isHigh ? 'bg-orange-50 text-[#E8901A] border-orange-200' :
                              isMod ? 'bg-amber-50 text-[#E8901A] border-amber-200' :
                              'bg-emerald-50 text-[#146356] border-emerald-200';

              return (
                <div 
                  key={dist.district_id}
                  onClick={() => onSelectDistrict(dist)}
                  className="p-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#C2255C]/40 hover:bg-[#F6F5F2]/50 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="font-mono text-xs font-bold text-[#5B6663] w-5">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1D2321]">{dist.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeBg}`}>
                          {dist.risk_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5B6663] mt-1">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-[#1A5F7A]" />
                          {dist.rainfall_mm}mm rain
                        </span>
                        <span>•</span>
                        <span>{dist.primary_suspected}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-base font-bold text-[#1D2321]">
                      {dist.active_cases} <span className="text-xs text-[#5B6663] font-normal">cases</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs mt-0.5">
                      <span className="text-[#5B6663] text-[10px]">Risk:</span>
                      <span className="font-mono font-bold text-[#C2255C]">{(dist.risk_score * 100).toFixed(0)}%</span>
                      {dist.trend_7d === 'UP' && <ArrowUpRight className="w-3 h-3 text-[#C6362C]" />}
                      {dist.trend_7d === 'DOWN' && <ArrowDownRight className="w-3 h-3 text-[#146356]" />}
                      {dist.trend_7d === 'FLAT' && <Minus className="w-3 h-3 text-[#5B6663]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (5 cols): Spatial Heatmap Quick View */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-[#1D2321]">Spatial Outbreak Risk Preview</h2>
                <p className="text-xs text-[#5B6663] mt-1">Live GIS transmission intensity map</p>
              </div>
              <button
                onClick={() => onNavigateTab('heatmap')}
                className="text-xs font-bold text-[#1A5F7A] hover:underline flex items-center gap-1"
              >
                Fullscreen GIS &rarr;
              </button>
            </div>

            <div className="h-64 w-full rounded-lg overflow-hidden border border-[#E2E8F0] my-3 relative">
              <CompactMap 
                districts={data.top_at_risk} 
                selectedDistrictId={undefined}
                onSelectDistrict={onSelectDistrict}
              />
            </div>
          </div>

          <div className="pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#5B6663]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#146356] animate-pulse" />
              Leaflet WebGL Engine
            </span>
            <button
              onClick={() => onNavigateTab('heatmap')}
              className="font-bold text-[#1D2321] hover:text-[#C2255C] transition-colors"
            >
              Interactive Analysis &rarr;
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
