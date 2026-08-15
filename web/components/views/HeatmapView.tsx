'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Layers, 
  Calendar, 
  CloudRain, 
  Users, 
  Activity, 
  X, 
  AlertTriangle, 
  Package, 
  PhoneCall, 
  Send,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { DistrictData } from '@/lib/api';
import { RiskFilterType } from '../RiskPulseBar';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

// Dynamic Map import to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full min-h-[600px] bg-[#EAE8E3]/60 flex items-center justify-center text-sm text-[#5B6663] rounded-xl border border-[#E2E8F0]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#C2255C] border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-xs text-[#1D2321]">Loading GIS Outbreak Engine & Desaturated Base Tiles...</p>
      </div>
    </div>
  )
});

interface HeatmapViewProps {
  districts: DistrictData[];
  activeFilter: RiskFilterType;
  selectedDistrict: DistrictData | null;
  onSelectDistrict: (district: DistrictData | null) => void;
}

export function HeatmapView({ districts, activeFilter, selectedDistrict, onSelectDistrict }: HeatmapViewProps) {
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [showRainfallLayer, setShowRainfallLayer] = useState<boolean>(true);
  const [showPHCLayer, setShowPHCLayer] = useState<boolean>(true);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Filter districts based on global RiskPulseBar filter
  const filteredDistricts = activeFilter === 'ALL'
    ? districts
    : districts.filter(d => d.risk_level === activeFilter);

  const handleQuickDispatch = (districtName: string) => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      toast.success(`Rapid Containment Protocol dispatched for ${districtName}. ANM supervisor alerted.`);
    }, 900);
  };

  return (
    <div className="space-y-4">
      {/* Top Map Controls Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Temporal Time-Scrubber */}
        <div className="flex-1 max-w-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1D2321] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C2255C]" />
              Temporal Time-Scrubber:
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F6F5F2] border border-[#E2E8F0] text-[#C2255C]">
              {dayOffset === 0 ? 'Today (Live Observations)' : dayOffset < 0 ? `${Math.abs(dayOffset)} Days Ago (Historical)` : `+${dayOffset} Days (ML Forecast)`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="14"
            step="1"
            value={dayOffset}
            onChange={(e) => setDayOffset(parseInt(e.target.value))}
            className="w-full h-2 bg-[#EAE8E3] rounded-lg appearance-none cursor-pointer accent-[#C2255C]"
            aria-label="Temporal time scrubber slider"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#5B6663] mt-1">
            <span>-30d History</span>
            <span className="font-bold text-[#1D2321]">Today (0)</span>
            <span>+14d Spatiotemporal Forecast</span>
          </div>
        </div>

        {/* GIS Layer Toggles */}
        <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
          <span className="text-xs font-bold text-[#5B6663] flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Layers:
          </span>
          <button
            onClick={() => setShowRainfallLayer(!showRainfallLayer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showRainfallLayer
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-white border-[#E2E8F0] text-[#5B6663] opacity-60'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rainfall Overlay</span>
          </button>

          <button
            onClick={() => setShowPHCLayer(!showPHCLayer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showPHCLayer
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-[#E2E8F0] text-[#5B6663] opacity-60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>PHC Supplies</span>
          </button>
        </div>
      </div>

      {/* Main Map Container with Slide-over Detail Drawer */}
      <div className="relative rounded-xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm h-[680px]">
        {/* Leaflet GIS Map Canvas */}
        <div className="w-full h-full">
          <LeafletMap 
            dayOffset={dayOffset} 
            activeFilter={activeFilter} 
            onSelectDistrict={(dist: any) => onSelectDistrict(dist)}
            selectedDistrictId={selectedDistrict?.district_id}
          />
        </div>

        {/* Map Legend Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-sm border border-[#E2E8F0] p-3.5 rounded-xl shadow-lg text-xs space-y-2">
          <div className="font-bold text-[#1D2321] text-[11px] uppercase tracking-wider">
            Risk Classification Scale
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#8B0000] border border-white shadow-sm animate-pulse" />
              <span className="font-medium text-[#1D2321]">Critical Outbreak (&gt;0.80)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#C6362C] border border-white shadow-sm" />
              <span className="font-medium text-[#1D2321]">High Risk (&gt;0.70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E8901A] border border-white shadow-sm" />
              <span className="font-medium text-[#1D2321]">Moderate Risk (0.40 - 0.70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#146356] border border-white shadow-sm" />
              <span className="font-medium text-[#1D2321]">Low / Normal (&lt;0.40)</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#E2E8F0] text-[10px] text-[#5B6663]">
            Desaturated CartoDB base tiles for optical clarity
          </div>
        </div>

        {/* District Quick Selection Tray (Top Right) */}
        <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-sm border border-[#E2E8F0] p-2.5 rounded-xl shadow-md max-w-xs hidden sm:block">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6663] mb-1.5 px-1">
            Focus District ({filteredDistricts.length} shown)
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {filteredDistricts.map((d) => (
              <button
                key={d.district_id}
                onClick={() => onSelectDistrict(d)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                  selectedDistrict?.district_id === d.district_id
                    ? 'bg-[#C2255C] text-white border-[#C2255C]'
                    : 'bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border-[#E2E8F0]'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* District Detail Drawer (Slide-over when district is clicked/selected) */}
        {selectedDistrict && (
          <div className="absolute top-4 right-4 bottom-4 z-[500] w-96 bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-5 flex flex-col animate-in slide-in-from-right-4 duration-300">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#1D2321]">{selectedDistrict.name}</h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    selectedDistrict.risk_level === 'CRITICAL' ? 'bg-[#8B0000] text-white' :
                    selectedDistrict.risk_level === 'HIGH' ? 'bg-[#C6362C] text-white' :
                    selectedDistrict.risk_level === 'MODERATE' ? 'bg-[#E8901A] text-[#1D2321]' :
                    'bg-[#146356] text-white'
                  }`}>
                    {selectedDistrict.risk_level} RISK
                  </span>
                </div>
                <p className="text-xs text-[#5B6663] mt-0.5">
                  State: {selectedDistrict.state} • ID: {selectedDistrict.district_id}
                </p>
              </div>

              <button
                onClick={() => onSelectDistrict(null)}
                className="p-1 text-[#5B6663] hover:text-[#1D2321] hover:bg-[#F6F5F2] rounded-lg transition-colors"
                aria-label="Close district detail panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              
              {/* Risk Score Highlight */}
              <div className="p-3 bg-[#F6F5F2] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#5B6663] uppercase">AI Outbreak Score</div>
                  <div className="text-2xl font-mono font-bold text-[#C6362C]">
                    {(selectedDistrict.risk_score * 100).toFixed(0)} / 100
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-[#5B6663] uppercase">7-Day Trajectory</div>
                  <div className="font-mono font-bold text-[#1D2321] text-sm">
                    {selectedDistrict.trend_pct > 0 ? `+${selectedDistrict.trend_pct}%` : `${selectedDistrict.trend_pct}%`}
                  </div>
                </div>
              </div>

              {/* Epidemiological Summary */}
              <div>
                <h4 className="font-bold text-[#1D2321] uppercase text-[11px] mb-2 tracking-wider">
                  Field Epidemiological Parameters
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] text-[#5B6663]">Active Cases</span>
                    <p className="font-mono font-bold text-sm text-[#1D2321]">{selectedDistrict.active_cases}</p>
                  </div>
                  <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] text-[#5B6663]">Primary Suspected</span>
                    <p className="font-bold text-xs text-[#1D2321] truncate">{selectedDistrict.primary_suspected}</p>
                  </div>
                  <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] text-[#5B6663]">Population At Risk</span>
                    <p className="font-mono font-bold text-sm text-[#1D2321]">{selectedDistrict.population}</p>
                  </div>
                  <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] text-[#5B6663]">Active ASHA Workers</span>
                    <p className="font-mono font-bold text-sm text-[#146356]">{selectedDistrict.asha_active_count}</p>
                  </div>
                </div>
              </div>

              {/* Environmental Correlation */}
              <div>
                <h4 className="font-bold text-[#1D2321] uppercase text-[11px] mb-2 tracking-wider">
                  Environmental Drivers
                </h4>
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-blue-900">Precipitation (IMD API):</span>
                    <span className="font-mono font-bold text-blue-950">{selectedDistrict.rainfall_mm} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-900">Relative Humidity:</span>
                    <span className="font-mono font-bold text-blue-950">{selectedDistrict.humidity_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-900">Vector Risk Index:</span>
                    <span className="font-bold text-red-700">Accelerated Breeding</span>
                  </div>
                </div>
              </div>

              {/* Hospital Resources & Supplies */}
              <div>
                <h4 className="font-bold text-[#1D2321] uppercase text-[11px] mb-2 tracking-wider">
                  PHC Medical Buffer
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center p-2 bg-white border border-[#E2E8F0] rounded-lg">
                    <span className="text-[#5B6663]">Isolation Beds Available</span>
                    <span className="font-mono font-bold text-[#1D2321]">24 / 40</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white border border-[#E2E8F0] rounded-lg">
                    <span className="text-[#5B6663]">ORS Solution Stock</span>
                    <span className="font-mono font-bold text-[#146356]">320 packets (Normal)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white border border-[#E2E8F0] rounded-lg">
                    <span className="text-[#5B6663]">Ringer's Lactate (IV Fluid)</span>
                    <span className="font-mono font-bold text-[#C6362C]">42 units (Low Buffer)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
              <button
                onClick={() => handleQuickDispatch(selectedDistrict.name)}
                disabled={isDispatching}
                className="w-full py-2.5 bg-[#C2255C] hover:bg-[#A61E4D] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isDispatching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Dispatch Containment Protocol</span>
              </button>

              <button
                onClick={() => toast.info(`Connecting to ${selectedDistrict.name} PHC Medical Officer...`)}
                className="w-full py-2 bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border border-[#E2E8F0] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#5B6663]" />
                <span>Contact PHC Officer</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
