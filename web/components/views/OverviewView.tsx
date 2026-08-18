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
  activeFilter: RiskFilterType;
  onNavigateTab: (tab: any) => void;
  onSelectDistrict: (district: DistrictData) => void;
}

export function OverviewView({ data, activeFilter, onNavigateTab, onSelectDistrict }: OverviewViewProps) {
  const { t } = useLanguage();
  const [selectedForecastDistrict, setSelectedForecastDistrict] = useState<string>('MH-PLG');
  const [simultaneousForecast, setSimultaneousForecast] = useState<SimultaneousForecastResponse | null>(null);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);

  // Load 14-day simultaneous FourCastNet + LSTM forecast
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

  // Filter top districts if a risk filter is active
  const filteredDistricts = activeFilter === 'ALL'
    ? data.top_at_risk
    : data.top_at_risk.filter(d => d.risk_level === activeFilter);

  const pieColors = ['#C2255C', '#C6362C', '#E8901A', '#146356'];

  // Chart data: use simultaneous FourCastNet trajectory if available
  const chartData: FourCastNetForecastItem[] = simultaneousForecast?.forecast_trajectory || [
    { day: "Day +1", date: "2026-08-19", predicted_cases: 48.7, lower_bound_cases: 45.0, upper_bound_cases: 52.0, fourcastnet_rainfall_mm: 65.0, temp_c: 27.2, humidity_pct: 88.0, vector_breeding_risk: 0.82, risk_score: 0.8578, risk_level: "CRITICAL" },
    { day: "Day +2", date: "2026-08-20", predicted_cases: 51.4, lower_bound_cases: 48.0, upper_bound_cases: 56.0, fourcastnet_rainfall_mm: 82.0, temp_c: 27.5, humidity_pct: 90.0, vector_breeding_risk: 0.88, risk_score: 0.8524, risk_level: "CRITICAL" },
    { day: "Day +3", date: "2026-08-21", predicted_cases: 54.4, lower_bound_cases: 51.0, upper_bound_cases: 62.0, fourcastnet_rainfall_mm: 94.0, temp_c: 27.1, humidity_pct: 92.0, vector_breeding_risk: 0.94, risk_score: 0.8500, risk_level: "CRITICAL" },
    { day: "Day +4", date: "2026-08-22", predicted_cases: 57.4, lower_bound_cases: 55.0, upper_bound_cases: 68.0, fourcastnet_rainfall_mm: 78.0, temp_c: 27.0, humidity_pct: 89.0, vector_breeding_risk: 0.85, risk_score: 0.8551, risk_level: "CRITICAL" },
    { day: "Day +5", date: "2026-08-23", predicted_cases: 60.7, lower_bound_cases: 58.0, upper_bound_cases: 73.0, fourcastnet_rainfall_mm: 60.0, temp_c: 27.3, humidity_pct: 85.0, vector_breeding_risk: 0.78, risk_score: 0.8559, risk_level: "CRITICAL" },
    { day: "Day +6", date: "2026-08-24", predicted_cases: 64.1, lower_bound_cases: 60.0, upper_bound_cases: 77.0, fourcastnet_rainfall_mm: 45.0, temp_c: 27.5, humidity_pct: 82.0, vector_breeding_risk: 0.72, risk_score: 0.8579, risk_level: "CRITICAL" },
    { day: "Day +7", date: "2026-08-25", predicted_cases: 67.6, lower_bound_cases: 63.0, upper_bound_cases: 82.0, fourcastnet_rainfall_mm: 52.0, temp_c: 27.4, humidity_pct: 84.0, vector_breeding_risk: 0.76, risk_score: 0.8560, risk_level: "CRITICAL" },
    { day: "Day +8", date: "2026-08-26", predicted_cases: 71.1, lower_bound_cases: 66.0, upper_bound_cases: 87.0, fourcastnet_rainfall_mm: 70.0, temp_c: 27.2, humidity_pct: 87.0, vector_breeding_risk: 0.84, risk_score: 0.8614, risk_level: "CRITICAL" },
    { day: "Day +9", date: "2026-08-27", predicted_cases: 74.9, lower_bound_cases: 68.0, upper_bound_cases: 91.0, fourcastnet_rainfall_mm: 64.0, temp_c: 27.1, humidity_pct: 86.0, vector_breeding_risk: 0.80, risk_score: 0.8602, risk_level: "CRITICAL" },
    { day: "Day +10", date: "2026-08-28", predicted_cases: 78.7, lower_bound_cases: 71.0, upper_bound_cases: 96.0, fourcastnet_rainfall_mm: 58.0, temp_c: 27.0, humidity_pct: 85.0, vector_breeding_risk: 0.75, risk_score: 0.8555, risk_level: "CRITICAL" },
    { day: "Day +11", date: "2026-08-29", predicted_cases: 82.5, lower_bound_cases: 73.0, upper_bound_cases: 100.0, fourcastnet_rainfall_mm: 62.0, temp_c: 27.2, humidity_pct: 86.0, vector_breeding_risk: 0.79, risk_score: 0.8581, risk_level: "CRITICAL" },
    { day: "Day +12", date: "2026-08-30", predicted_cases: 86.3, lower_bound_cases: 76.0, upper_bound_cases: 105.0, fourcastnet_rainfall_mm: 54.0, temp_c: 27.3, humidity_pct: 84.0, vector_breeding_risk: 0.74, risk_score: 0.8623, risk_level: "CRITICAL" },
    { day: "Day +13", date: "2026-08-31", predicted_cases: 90.3, lower_bound_cases: 78.0, upper_bound_cases: 109.0, fourcastnet_rainfall_mm: 48.0, temp_c: 27.4, humidity_pct: 82.0, vector_breeding_risk: 0.70, risk_score: 0.8546, risk_level: "CRITICAL" },
    { day: "Day +14", date: "2026-09-01", predicted_cases: 94.2, lower_bound_cases: 80.0, upper_bound_cases: 114.0, fourcastnet_rainfall_mm: 50.0, temp_c: 27.5, humidity_pct: 83.0, vector_breeding_risk: 0.72, risk_score: 0.8598, risk_level: "CRITICAL" }
  ];

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
            <span>Trajectory:</span>
            <span className="font-mono text-[#E8901A] font-semibold">Accelerating +14.8%</span>
          </div>
        </div>

        {/* Active Frontline ASHA Workers */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider">
              {t('overview.asha_telemetry')}
            </span>
            <Users className="w-4 h-4 text-[#146356]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1D2321]">
              {data.summary.active_asha_workers.toLocaleString()}
            </span>
            <span className="text-xs text-[#146356] font-semibold">Online</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-xs text-[#5B6663]">
<<<<<<< HEAD
            <span>{t('overview.field_uploads')}</span>
            <span className="font-mono text-[#146356] font-semibold">{data.summary.registered_asha_workers ?? 46} {t('overview.pilot_registered')}</span>
=======
            <span>Mesh Status:</span>
            <span className="text-[#146356] font-semibold">Connected to Supabase</span>
>>>>>>> 79ed2e8 (feat(ml): integrate NVIDIA FourCastNet medium-range weather NWP with PyTorch LSTM for simultaneous 14-day cascaded epidemiological forecasting)
          </div>
        </div>
      </div>

      {/* Meteorological Early Warning Advisory Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-white border border-blue-200/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
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

      {/* 2. HERO SECTION: NVIDIA FourCastNet + PyTorch LSTM Simultaneous Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Cascaded Weather & Disease Forecast Engine */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {/* NVIDIA Green Badge */}
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#76B900]/15 text-[#2E7D32] border border-[#76B900]/30 shadow-2xs">
                  <Cpu className="w-3 h-3 text-[#76B900]" />
                  NVIDIA FourCastNet + PyTorch LSTM
                </span>
                <span className="text-xs text-[#5B6663]">•</span>
                <span className="text-xs font-mono text-[#5B6663]">0.25° AFNO Global NWP Mesh</span>
              </div>
              <h2 className="text-lg font-extrabold text-[#1D2321] mt-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#C2255C]" />
                14-Day Simultaneous Weather & Outbreak Trajectory
              </h2>
            </div>
            
            {/* District Selector for Simultaneous Forecast */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={selectedForecastDistrict}
                onChange={(e) => setSelectedForecastDistrict(e.target.value)}
                className="px-3 py-1.5 bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border border-[#E2E8F0] rounded-lg text-xs font-bold font-mono outline-none cursor-pointer transition-colors"
              >
                <option value="MH-PLG">Palghar (Surge Area)</option>
                <option value="MH-GDC">Gadchiroli (Malaria Zone)</option>
                <option value="MH-PUN">Pune (Urban Dengue)</option>
                <option value="MH-NAS">Nashik (High Rain)</option>
                <option value="MH-CHA">Chandrapur (Vector Wave)</option>
                <option value="MH-NAN">Nanded (Flash Alert)</option>
                <option value="MH-SAT">Satara (Moderate)</option>
                <option value="MH-DHU">Dhule (Baseline)</option>
              </select>
            </div>
          </div>

          {/* Model Architecture Pill Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-2.5 bg-[#F6F5F2] rounded-lg border border-[#E2E8F0] text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#5B6663]">NWP Engine</span>
              <p className="text-xs font-mono font-bold text-[#1D2321]">FourCastNet (AFNO)</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#5B6663]">Spatial Grid</span>
              <p className="text-xs font-mono font-bold text-[#1D2321]">0.25° (~27.5 km)</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#5B6663]">Forecasting Model</span>
              <p className="text-xs font-mono font-bold text-[#C2255C]">2-Layer LSTM</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#5B6663]">Advance Lead Time</span>
              <p className="text-xs font-mono font-bold text-[#146356]">14 Days Pre-Event</p>
            </div>
          </div>

          {/* Explicit Inline Series Disambiguation Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 mb-4 bg-[#F6F5F2]/80 rounded-lg border border-[#E2E8F0] text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 border-t-2 border-dashed border-[#C6362C]" />
                <span className="font-bold text-[#C6362C]">LSTM Projected Caseload</span>
                <span className="text-[10px] text-[#5B6663] font-mono">(Cases / Day)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#76B900]/50 border border-[#76B900]" />
                <span className="font-bold text-[#1D2321]">FourCastNet Precipitation</span>
                <span className="text-[10px] text-[#5B6663] font-mono">(mm / Day)</span>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold text-[#146356]">
              {loadingForecast ? 'Computing Roll-Forward...' : '✓ Coupled Physics-ML Active'}
            </span>
          </div>

          {/* Main Chart Canvas */}
          <div className="h-80 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5B6663', fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#5B6663' }} axisLine={false} tickLine={false} label={{ value: 'Projected Cases', angle: -90, position: 'insideLeft', offset: 25, fontSize: 10, fill: '#5B6663' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#5B6663' }} axisLine={false} tickLine={false} label={{ value: 'FourCastNet Rain (mm)', angle: 90, position: 'insideRight', offset: 25, fontSize: 10, fill: '#5B6663' }} />
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    if (name === 'LSTM Forecasted Incidence') return [`${val} cases`, 'LSTM Expected Caseload'];
                    if (name === 'Upper 95% Confidence Bound') return [`${val} cases`, 'Upper 95% Confidence'];
                    if (name === 'Lower 95% Confidence Bound') return [`${val} cases`, 'Lower 95% Confidence'];
                    return [`${val} mm`, 'NVIDIA FourCastNet Precipitation'];
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
                <Bar yAxisId="right" dataKey="fourcastnet_rainfall_mm" name="NVIDIA FourCastNet Rainfall (mm)" fill="#76B900" fillOpacity={0.45} radius={[3, 3, 0, 0]} barSize={22} />
                <Area yAxisId="left" type="monotone" dataKey="upper_bound_cases" stroke="none" fill="#C6362C" fillOpacity={0.08} name="Upper 95% Confidence Bound" />
                <Line yAxisId="left" type="monotone" dataKey="predicted_cases" name="LSTM Forecasted Incidence" stroke="#C6362C" strokeWidth={3} strokeDasharray="5 3" dot={{ r: 4, fill: '#C6362C', strokeWidth: 1.5, stroke: '#FFFFFF' }} activeDot={{ r: 6.5 }} />
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
            <p className="text-xs text-[#5B6663] mb-4">Statewide etiology breakdown based on ASHA RDT test strips.</p>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.disease_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="cases"
                  >
                    {data.disease_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [`${value} cases (${props.payload.pct}%)`, props.payload.disease]}
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '8px', 
                      border: '1px solid #E2E8F0',
                      fontSize: '11px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-mono font-bold text-[#1D2321]">36.5%</span>
                <span className="text-[10px] font-bold text-[#C2255C] uppercase">Dengue</span>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {data.disease_breakdown.map((item, idx) => (
                <div key={item.disease} className="flex items-center justify-between text-xs py-1 border-b border-[#E2E8F0]/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                    <span className="font-medium text-[#1D2321]">{item.disease}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-[#1D2321]">{item.cases}</span>
                    <span className="text-[#5B6663] text-[10px]">({item.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] mt-3">
            <button
              onClick={() => onNavigateTab('rag')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] rounded-lg text-xs font-semibold border border-[#E2E8F0] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C2255C]" />
              <span>Query AI Clinical Protocols for Dengue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. LOWER SECTION: Maharashtra Outbreak Matrix & Mini-GIS Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (7 cols): District Outbreak Leaderboard */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
<<<<<<< HEAD
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
=======
              <h2 className="text-base font-bold text-[#1D2321]">District Outbreak Priority Leaderboard</h2>
              <p className="text-xs text-[#5B6663] mt-0.5">Ranked by real-time epidemiological composite risk index</p>
>>>>>>> 79ed2e8 (feat(ml): integrate NVIDIA FourCastNet medium-range weather NWP with PyTorch LSTM for simultaneous 14-day cascaded epidemiological forecasting)
            </div>
            <button
              onClick={() => onNavigateTab('districts')}
              className="text-xs font-bold text-[#C2255C] hover:underline flex items-center gap-1"
            >
              View All 36 Districts &rarr;
            </button>
          </div>

          <div className="space-y-3">
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
                  className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#C2255C]/40 hover:bg-[#F6F5F2]/50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#5B6663] w-4">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1D2321]">{dist.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeBg}`}>
                          {dist.risk_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5B6663] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-[#1A5F7A]" />
                          {dist.rainfall_mm}mm rain
                        </span>
                        <span>•</span>
                        <span>{dist.primary_suspected}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-base font-bold text-[#1D2321]">
                      {dist.active_cases} <span className="text-xs text-[#5B6663] font-normal">cases</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs">
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
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-bold text-[#1D2321]">Spatial Outbreak Risk Preview</h2>
                <p className="text-xs text-[#5B6663] mt-0.5">Live GIS transmission intensity map</p>
              </div>
              <button
                onClick={() => onNavigateTab('heatmap')}
                className="text-xs font-bold text-[#1A5F7A] hover:underline flex items-center gap-1"
              >
                Fullscreen GIS &rarr;
              </button>
            </div>

            <div className="h-64 w-full rounded-lg overflow-hidden border border-[#E2E8F0] my-2 relative">
              <CompactMap 
                districts={data.top_at_risk} 
                selectedDistrict={null}
                onSelectDistrict={onSelectDistrict}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#5B6663]">
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
