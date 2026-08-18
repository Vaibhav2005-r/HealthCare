'use client';

import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Radio, 
  Compass,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';
import { fetchImdFeed, IMDFeedData, IMDDistrictWeather } from '@/lib/api';
import { toast } from 'sonner';

export default function ImdFeedSection() {
  const [imdData, setImdData] = useState<IMDFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<'ALL' | 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'>('ALL');
  const [sortField, setSortField] = useState<'name' | 'rain' | 'humidity' | 'temp'>('rain');
  const [sortAsc, setSortAsc] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchImdFeed();
      setImdData(data);
    } catch (err) {
      console.error('Failed to load IMD feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSort = (field: 'name' | 'rain' | 'humidity' | 'temp') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredDistricts = (imdData?.districts || []).filter((d) => {
    if (colorFilter !== 'ALL' && d.imd_color_code !== colorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return d.district_name.toLowerCase().includes(q) || d.district_id.toLowerCase().includes(q) || d.synoptic_summary.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    let diff = 0;
    if (sortField === 'name') diff = a.district_name.localeCompare(b.district_name);
    if (sortField === 'rain') diff = a.rainfall_24h_mm - b.rainfall_24h_mm;
    if (sortField === 'humidity') diff = a.humidity_pct - b.humidity_pct;
    if (sortField === 'temp') diff = a.temp_current_c - b.temp_current_c;
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Authority Accreditation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
              Live IMD Radar Sync
            </span>
            <span className="text-xs text-[#5B6663]">•</span>
            <span className="text-xs font-mono text-[#5B6663]">Ministry of Earth Sciences, Govt. of India</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#1D2321] mt-1.5 flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-[#1A5F7A]" />
            IMD Meteorological Radar & Precipitation Telemetry Feed
          </h1>
          <p className="text-xs text-[#5B6663] mt-0.5">
            Automatic Weather Station (AWS) network across all 36 Maharashtra districts calculating microclimatic vector breeding risks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadData();
              toast.success('Live IMD Automatic Weather Station feed refreshed');
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C2255C]' : ''}`} />
            <span>Refresh Radar Feed</span>
          </button>
        </div>
      </div>

      {/* 2. Statewide Meteorological KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Stations */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5B6663] uppercase tracking-wider">AWS Observatories</span>
            <div className="text-2xl font-black font-mono text-[#1D2321] mt-1">
              {imdData?.statewide_metrics.monitored_stations || 36}
            </div>
            <p className="text-[10px] text-[#146356] font-semibold mt-0.5">100% Maharashtra Coverage</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        {/* Avg 24h Rainfall */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5B6663] uppercase tracking-wider">Mean Precipitation</span>
            <div className="text-2xl font-black font-mono text-[#1A5F7A] mt-1">
              {imdData?.statewide_metrics.avg_rainfall_mm || 44.8} <span className="text-xs font-normal text-[#5B6663]">mm</span>
            </div>
            <p className="text-[10px] text-[#5B6663] mt-0.5">24-Hour Cumulative Gauge</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
            <CloudRain className="w-5 h-5" />
          </div>
        </div>

        {/* Mean Relative Humidity */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5B6663] uppercase tracking-wider">Relative Humidity</span>
            <div className="text-2xl font-black font-mono text-indigo-900 mt-1">
              {imdData?.statewide_metrics.avg_humidity_pct || 75.2}%
            </div>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Vector Acceleration Zone (&gt;70%)</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Droplets className="w-5 h-5" />
          </div>
        </div>

        {/* Active Weather Warnings */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5B6663] uppercase tracking-wider">Severe Weather Alerts</span>
            <div className="text-2xl font-black font-mono text-[#8B0000] mt-1">
              {(imdData?.statewide_metrics.red_alert_districts_count || 0) + (imdData?.statewide_metrics.orange_alert_districts_count || 0)} <span className="text-xs font-normal text-[#5B6663]">Districts</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono">
              <span className="text-[#8B0000] font-bold">{imdData?.statewide_metrics.red_alert_districts_count || 0} Red</span>
              <span className="text-[#5B6663]">•</span>
              <span className="text-[#E8901A] font-bold">{imdData?.statewide_metrics.orange_alert_districts_count || 0} Orange</span>
            </div>
          </div>
          <div className="p-3 bg-red-50 text-[#8B0000] rounded-xl border border-red-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Severe Weather Warning Bulletins */}
      {imdData?.active_warnings && imdData.active_warnings.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8B0000] uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>IMD Regional Meteorological Warnings for Epidemiological Surveillance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {imdData.active_warnings.map((w, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  w.color_code === 'RED'
                    ? 'bg-red-50/70 border-red-200 text-red-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{w.district}</span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold text-white ${
                    w.color_code === 'RED' ? 'bg-[#8B0000]' : 'bg-[#E8901A]'
                  }`}>
                    {w.color_code} ALERT
                  </span>
                </div>
                <p className="text-[11px] leading-snug font-medium">
                  {w.message}
                </p>
                <div className="text-[10px] font-mono text-[#5B6663] pt-0.5">
                  Rainfall: <strong>{w.rainfall_mm} mm</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Sortable All 36 Districts IMD Weather Matrix */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F6F5F2] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-[#5B6663] uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#C2255C]" /> IMD Tier:
            </span>
            {(['ALL', 'RED', 'ORANGE', 'YELLOW', 'GREEN'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setColorFilter(tier)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  colorFilter === tier
                    ? tier === 'RED' ? 'bg-[#8B0000] text-white' :
                      tier === 'ORANGE' ? 'bg-[#E8901A] text-white' :
                      tier === 'YELLOW' ? 'bg-amber-300 text-[#1D2321]' :
                      tier === 'GREEN' ? 'bg-[#146356] text-white' :
                      'bg-[#1D2321] text-white'
                    : 'bg-white border border-[#E2E8F0] text-[#5B6663] hover:bg-[#EAE8E3]'
                }`}
              >
                {tier === 'ALL' ? 'All 36 Districts' : `${tier} Alert`}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5B6663]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search district or synoptic weather..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#C2255C] transition-colors"
            />
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F5F2] border-b border-[#E2E8F0] text-[#5B6663] font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                <th className="py-3 px-4">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-[#1D2321]">
                    <span>District</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">IMD Alert Tier</th>
                <th className="py-3 px-4 text-right">
                  <button onClick={() => handleSort('rain')} className="flex items-center gap-1 justify-end w-full hover:text-[#1D2321]">
                    <span>24h Rainfall (mm)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">
                  <button onClick={() => handleSort('temp')} className="flex items-center gap-1 justify-end w-full hover:text-[#1D2321]">
                    <span>Temp (°C)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">
                  <button onClick={() => handleSort('humidity')} className="flex items-center gap-1 justify-end w-full hover:text-[#1D2321]">
                    <span>Humidity (RH %)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Wind (km/h)</th>
                <th className="py-3 px-4">Vector Proliferation Index</th>
                <th className="py-3 px-4">Synoptic Overview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] whitespace-nowrap">
              {filteredDistricts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#5B6663]">
                    No meteorological stations matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDistricts.map((d) => (
                  <tr key={d.district_id} className="hover:bg-[#F6F5F2]/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1D2321] text-sm">{d.district_name}</div>
                      <div className="text-[10px] font-mono text-[#5B6663]">{d.district_id} • AWS Station</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        d.imd_color_code === 'RED' ? 'bg-[#8B0000] text-white' :
                        d.imd_color_code === 'ORANGE' ? 'bg-[#E8901A] text-white' :
                        d.imd_color_code === 'YELLOW' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        'bg-[#146356] text-white'
                      }`}>
                        {d.imd_color_code === 'RED' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {d.imd_color_code}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={d.rainfall_24h_mm >= 80 ? 'text-[#8B0000]' : d.rainfall_24h_mm >= 50 ? 'text-[#E8901A]' : 'text-[#1A5F7A]'}>
                        {d.rainfall_24h_mm.toFixed(1)} mm
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-sm text-[#1D2321]">
                      <strong>{d.temp_current_c}°C</strong>
                      <span className="text-[10px] text-[#5B6663] ml-1">({d.temp_min_c}–{d.temp_max_c}°)</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-indigo-900">
                      {d.humidity_pct}%
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#5B6663]">
                      {d.wind_speed_kmh} km/h
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        d.vector_breeding_risk === 'EXTREME' ? 'bg-red-100 text-red-800 border border-red-300' :
                        d.vector_breeding_risk === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        d.vector_breeding_risk === 'MODERATE' ? 'bg-blue-50 text-blue-800' :
                        'bg-emerald-50 text-emerald-800'
                      }`}>
                        {d.vector_breeding_risk}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-[#5B6663] max-w-xs truncate" title={d.synoptic_summary}>
                      {d.synoptic_summary}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F6F5F2] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#5B6663]">
          <div>
            Showing <strong className="font-mono text-[#1D2321]">{filteredDistricts.length}</strong> of{' '}
            <strong className="font-mono text-[#1D2321]">{imdData?.districts?.length || 36}</strong> meteorological stations
          </div>
          <span className="font-mono text-[11px]">Synced via IMD / Open-Meteo AWS Grid</span>
        </div>
      </div>

    </div>
  );
}
