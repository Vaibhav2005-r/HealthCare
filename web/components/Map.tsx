'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DistrictData } from '@/lib/api';
import { RiskFilterType } from './RiskPulseBar';
import { 
  Building2, 
  Activity, 
  Droplets, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Send,
  Navigation,
  CloudRain,
  Thermometer,
  Layers,
  Maximize2,
  Compass,
  Filter,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

export interface OutbreakNode {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  cases: number;
  disease: string;
  disease_category: 'CHOLERA' | 'DENGUE' | 'MALARIA' | 'RESPIRATORY' | 'OTHER';
  rainfall_mm: number;
  humidity_pct: number;
  temp_c: number;
  asha_workers: number;
  phc_beds: number;
  ors_stock: number;
  iv_stock: number;
}

export const MAHARASHTRA_NODES: OutbreakNode[] = [
  {
    id: 'MH-PUN-01',
    name: 'Pune City Central Hub',
    district: 'Pune',
    lat: 18.5204,
    lng: 73.8567,
    risk_level: 'CRITICAL',
    risk_score: 0.89,
    cases: 48,
    disease: 'Cholera / Acute Diarrhea',
    disease_category: 'CHOLERA',
    rainfall_mm: 88.4,
    humidity_pct: 84,
    temp_c: 26.5,
    asha_workers: 142,
    phc_beds: 45,
    ors_stock: 420,
    iv_stock: 35
  },
  {
    id: 'MH-PUN-02',
    name: 'Haveli Sub-Center Cluster',
    district: 'Pune',
    lat: 18.4600,
    lng: 73.9200,
    risk_level: 'CRITICAL',
    risk_score: 0.92,
    cases: 18,
    disease: 'Severe Diarrhea / Dehydration',
    disease_category: 'CHOLERA',
    rainfall_mm: 92.0,
    humidity_pct: 88,
    temp_c: 25.8,
    asha_workers: 38,
    phc_beds: 12,
    ors_stock: 110,
    iv_stock: 8
  },
  {
    id: 'MH-NSK-01',
    name: 'Nashik District HQ',
    district: 'Nashik',
    lat: 19.9975,
    lng: 73.7898,
    risk_level: 'HIGH',
    risk_score: 0.76,
    cases: 32,
    disease: 'Dengue Outbreak',
    disease_category: 'DENGUE',
    rainfall_mm: 112.0,
    humidity_pct: 89,
    temp_c: 27.2,
    asha_workers: 98,
    phc_beds: 35,
    ors_stock: 280,
    iv_stock: 45
  },
  {
    id: 'MH-NSK-02',
    name: 'Trimbakeshwar Vector Zone',
    district: 'Nashik',
    lat: 19.9300,
    lng: 73.5300,
    risk_level: 'HIGH',
    risk_score: 0.78,
    cases: 14,
    disease: 'Dengue / Thrombocytopenia',
    disease_category: 'DENGUE',
    rainfall_mm: 135.0,
    humidity_pct: 92,
    temp_c: 24.5,
    asha_workers: 24,
    phc_beds: 8,
    ors_stock: 95,
    iv_stock: 12
  },
  {
    id: 'MH-THA-01',
    name: 'Thane Urban Node',
    district: 'Thane',
    lat: 19.2183,
    lng: 72.9781,
    risk_level: 'HIGH',
    risk_score: 0.72,
    cases: 29,
    disease: 'Malaria (P. Vivax)',
    disease_category: 'MALARIA',
    rainfall_mm: 64.2,
    humidity_pct: 81,
    temp_c: 29.0,
    asha_workers: 184,
    phc_beds: 50,
    ors_stock: 350,
    iv_stock: 60
  },
  {
    id: 'MH-THA-02',
    name: 'Bhiwandi Sub-District Cluster',
    district: 'Thane',
    lat: 19.2967,
    lng: 73.0631,
    risk_level: 'HIGH',
    risk_score: 0.74,
    cases: 15,
    disease: 'Malaria & High Fever',
    disease_category: 'MALARIA',
    rainfall_mm: 70.5,
    humidity_pct: 85,
    temp_c: 28.6,
    asha_workers: 45,
    phc_beds: 15,
    ors_stock: 130,
    iv_stock: 20
  },
  {
    id: 'MH-KOP-01',
    name: 'Kolhapur City PHC',
    district: 'Kolhapur',
    lat: 16.7050,
    lng: 74.2433,
    risk_level: 'MODERATE',
    risk_score: 0.54,
    cases: 17,
    disease: 'Viral Fever & Joint Pain',
    disease_category: 'RESPIRATORY',
    rainfall_mm: 45.0,
    humidity_pct: 72,
    temp_c: 28.1,
    asha_workers: 76,
    phc_beds: 25,
    ors_stock: 240,
    iv_stock: 55
  },
  {
    id: 'MH-AUR-01',
    name: 'Chhatrapati Sambhajinagar Node',
    district: 'Chhatrapati Sambhajinagar',
    lat: 19.8762,
    lng: 75.3433,
    risk_level: 'MODERATE',
    risk_score: 0.48,
    cases: 14,
    disease: 'Acute Respiratory Infection (ARI)',
    disease_category: 'RESPIRATORY',
    rainfall_mm: 22.1,
    humidity_pct: 65,
    temp_c: 30.5,
    asha_workers: 82,
    phc_beds: 30,
    ors_stock: 310,
    iv_stock: 70
  },
  {
    id: 'MH-MUM-01',
    name: 'Mumbai Suburban Node',
    district: 'Mumbai Suburban',
    lat: 19.0760,
    lng: 72.8777,
    risk_level: 'LOW',
    risk_score: 0.28,
    cases: 11,
    disease: 'Seasonal Surveillance',
    disease_category: 'OTHER',
    rainfall_mm: 38.0,
    humidity_pct: 79,
    temp_c: 31.0,
    asha_workers: 230,
    phc_beds: 80,
    ors_stock: 650,
    iv_stock: 140
  },
  {
    id: 'MH-NAG-01',
    name: 'Nagpur East Health Center',
    district: 'Nagpur',
    lat: 21.1458,
    lng: 79.0882,
    risk_level: 'LOW',
    risk_score: 0.22,
    cases: 6,
    disease: 'Seasonal Baseline',
    disease_category: 'OTHER',
    rainfall_mm: 12.0,
    humidity_pct: 58,
    temp_c: 32.2,
    asha_workers: 110,
    phc_beds: 40,
    ors_stock: 480,
    iv_stock: 95
  },
  {
    id: 'MH-SAT-01',
    name: 'Satara Rural Block',
    district: 'Satara',
    lat: 17.6805,
    lng: 73.9997,
    risk_level: 'LOW',
    risk_score: 0.18,
    cases: 4,
    disease: 'Normal Baseline',
    disease_category: 'OTHER',
    rainfall_mm: 18.5,
    humidity_pct: 60,
    temp_c: 27.8,
    asha_workers: 64,
    phc_beds: 20,
    ors_stock: 220,
    iv_stock: 50
  }
];

// Helper to center and adjust map view
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

// Function to generate custom styled Leaflet icon
function createCustomPin(color: string, label: string, isCritical: boolean, isSelected: boolean) {
  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${isCritical ? `
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: ${color}; opacity: 0.35; filter: blur(3px); animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
      ` : ''}
      ${isSelected ? `
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 2px dashed ${color}; animation: spin 8s linear infinite;"></div>
      ` : ''}
      <div style="
        width: ${isSelected ? '32px' : '26px'}; 
        height: ${isSelected ? '32px' : '26px'}; 
        border-radius: 50%; 
        background: linear-gradient(135deg, ${color}ee, ${color}); 
        backdrop-filter: blur(4px); 
        border: 2px solid #ffffff; 
        box-shadow: 0 4px 14px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.4); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-weight: 800; 
        font-size: ${isSelected ? '12px' : '10px'}; 
        font-family: monospace;
        transition: transform 0.2s ease;
      ">
        ${label}
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-outbreak-pin',
    iconSize: isSelected ? [32, 32] : [26, 26],
    iconAnchor: isSelected ? [16, 16] : [13, 13],
    popupAnchor: [0, -18],
  });
}

export type DiseaseFilterType = 'ALL' | 'CHOLERA' | 'DENGUE' | 'MALARIA' | 'RESPIRATORY';

interface MapProps {
  dayOffset?: number;
  activeFilter?: RiskFilterType;
  onSelectDistrict?: (district: DistrictData) => void;
  selectedDistrictId?: string;
  districts?: DistrictData[];
}

export default function MapComponent({ 
  dayOffset = 0, 
  activeFilter = 'ALL', 
  onSelectDistrict,
  selectedDistrictId,
  districts
}: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [diseaseFilter, setDiseaseFilter] = useState<DiseaseFilterType>('ALL');
  const [showRainfallHeat, setShowRainfallHeat] = useState(true);
  const [showSupplyMarkers, setShowSupplyMarkers] = useState(true);
  const [tileStyle, setTileStyle] = useState<'voyager' | 'positron' | 'dark'>('voyager');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter clusters by risk level & disease
  const displayedClusters = MAHARASHTRA_NODES.filter(c => {
    if (activeFilter !== 'ALL' && c.risk_level !== activeFilter) return false;
    if (diseaseFilter !== 'ALL' && c.disease_category !== diseaseFilter) return false;
    return true;
  });

  // Calculate dynamic heat radius & opacity based on day offset (historical vs forecast)
  const getDynamicIntensity = (baseScore: number) => {
    if (dayOffset <= 0) {
      const decay = Math.max(0.5, 1 + dayOffset * 0.015);
      return Math.min(1.0, baseScore * decay);
    } else {
      const growth = 1 + (dayOffset / 14) * 0.25;
      return Math.min(1.0, baseScore * growth);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '#8B0000';
      case 'HIGH': return '#C6362C';
      case 'MODERATE': return '#E8901A';
      default: return '#146356';
    }
  };

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[450px] bg-[#EAE8E3]/60 flex items-center justify-center text-xs text-[#5B6663] rounded-xl border border-[#E2E8F0]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#C2255C] border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-[#1D2321]">Initializing GIS Outbreak Engine & CartoDB Muted Tiles...</p>
        </div>
      </div>
    );
  }

  // Centered on Maharashtra: Lat 19.2, Lng 75.6 (Zoom 7)
  const mapCenter: [number, number] = [19.2, 75.6];
  const defaultZoom = 7;

  const tileUrls = {
    voyager: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    positron: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  };

  return (
    <div className="w-full h-full relative z-0 flex flex-col">
      
      {/* 1. Map Floating Header Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Disease Filter Pills */}
        <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] px-2 py-1.5 rounded-xl shadow-md flex items-center gap-1 pointer-events-auto overflow-x-auto max-w-full">
          <span className="text-[10px] font-bold text-[#5B6663] uppercase tracking-wider px-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#C2255C]" /> Pathogen:
          </span>
          <button
            onClick={() => setDiseaseFilter('ALL')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
              diseaseFilter === 'ALL' ? 'bg-[#1D2321] text-white shadow-xs' : 'text-[#5B6663] hover:bg-[#F6F5F2]'
            }`}
          >
            All Outbreaks
          </button>
          <button
            onClick={() => setDiseaseFilter('CHOLERA')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
              diseaseFilter === 'CHOLERA' ? 'bg-[#8B0000] text-white shadow-xs' : 'text-[#8B0000] hover:bg-red-50'
            }`}
          >
            Cholera
          </button>
          <button
            onClick={() => setDiseaseFilter('DENGUE')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
              diseaseFilter === 'DENGUE' ? 'bg-[#C6362C] text-white shadow-xs' : 'text-[#C6362C] hover:bg-orange-50'
            }`}
          >
            Dengue
          </button>
          <button
            onClick={() => setDiseaseFilter('MALARIA')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
              diseaseFilter === 'MALARIA' ? 'bg-[#E8901A] text-white shadow-xs' : 'text-[#E8901A] hover:bg-amber-50'
            }`}
          >
            Malaria
          </button>
          <button
            onClick={() => setDiseaseFilter('RESPIRATORY')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
              diseaseFilter === 'RESPIRATORY' ? 'bg-[#146356] text-white shadow-xs' : 'text-[#146356] hover:bg-emerald-50'
            }`}
          >
            ARI / Flu
          </button>
        </div>

        {/* Tile & Overlay Toggles */}
        <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] p-1.5 rounded-xl shadow-md flex items-center gap-1.5 pointer-events-auto ml-auto">
          <button
            onClick={() => setShowRainfallHeat(!showRainfallHeat)}
            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
              showRainfallHeat ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-[#E2E8F0] text-[#5B6663]'
            }`}
            title="Toggle Environmental Heatmap"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Precip</span>
          </button>

          <button
            onClick={() => setShowSupplyMarkers(!showSupplyMarkers)}
            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
              showSupplyMarkers ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-[#E2E8F0] text-[#5B6663]'
            }`}
            title="Toggle PHC Supply Buffer"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PHC Supplies</span>
          </button>

          <div className="h-4 w-px bg-[#E2E8F0] mx-0.5" />

          {/* Base Tile Selector */}
          <select
            value={tileStyle}
            onChange={(e) => setTileStyle(e.target.value as any)}
            className="text-[10px] font-bold text-[#1D2321] bg-[#F6F5F2] border border-[#E2E8F0] rounded-lg px-2 py-1 outline-none"
            aria-label="Map Base Tile Layer"
          >
            <option value="voyager">Voyager (Clean)</option>
            <option value="positron">Positron (Light)</option>
            <option value="dark">Dark Matter</option>
          </select>
        </div>

      </div>

      {/* Main Leaflet Map Canvas */}
      <div className="flex-1 w-full h-full min-h-[500px]">
        <MapContainer 
          center={mapCenter} 
          zoom={defaultZoom} 
          style={{ height: '100%', width: '100%', minHeight: '500px' }}
          scrollWheelZoom={true}
        >
          <MapViewUpdater center={mapCenter} zoom={defaultZoom} />

          {/* CartoDB High-Contrast Desaturated Basemap */}
          <TileLayer
            url={tileUrls[tileStyle]}
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />

          {/* 1. Multi-tier Heat Gradient Outbreak Radii */}
          {showRainfallHeat && displayedClusters.map((cluster) => {
            const intensity = getDynamicIntensity(cluster.risk_score);
            const color = getRiskColor(cluster.risk_level);
            const isCritical = cluster.risk_level === 'CRITICAL';
            const isHigh = cluster.risk_level === 'HIGH';

            return (
              <React.Fragment key={`heat-${cluster.id}`}>
                {/* Outbreak Propagation Ring (Outer Glow) */}
                <Circle
                  center={[cluster.lat, cluster.lng]}
                  radius={isCritical ? 46000 * intensity : isHigh ? 34000 * intensity : 20000 * intensity}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: isCritical ? 0.28 : isHigh ? 0.20 : 0.12,
                    weight: 0,
                  }}
                />

                {/* Core Epicenter Density (Inner Glow) */}
                <Circle
                  center={[cluster.lat, cluster.lng]}
                  radius={isCritical ? 24000 * intensity : isHigh ? 16000 * intensity : 10000 * intensity}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: isCritical ? 0.60 : isHigh ? 0.45 : 0.25,
                    weight: 0,
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* 2. Interactive Centroid Outbreak Markers */}
          {displayedClusters.map((cluster) => {
            const color = getRiskColor(cluster.risk_level);
            const isCritical = cluster.risk_level === 'CRITICAL';
            const isSelected = selectedDistrictId === cluster.id || selectedDistrictId === cluster.district;
            const icon = createCustomPin(color, String(cluster.cases), isCritical, isSelected);

            return (
              <Marker
                key={`marker-${cluster.id}`}
                position={[cluster.lat, cluster.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelectDistrict && districts) {
                      const matched = districts.find(d => d.name.toLowerCase() === cluster.district.toLowerCase() || d.district_id === cluster.id);
                      if (matched) {
                        onSelectDistrict(matched);
                      }
                    }
                  }
                }}
              >
                <Popup className="custom-gov-popup">
                  <div className="p-1.5 max-w-xs text-xs font-sans">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#1D2321]">{cluster.name}</h4>
                        <p className="text-[10px] text-[#5B6663]">{cluster.district} District, Maharashtra</p>
                      </div>
                      <span 
                        style={{ backgroundColor: color }}
                        className="text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                      >
                        {cluster.risk_level}
                      </span>
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="py-2.5 space-y-2 text-[11px]">
                      <div className="flex justify-between items-center bg-[#F6F5F2] p-1.5 rounded-md">
                        <span className="text-[#5B6663] font-medium">Pathogen:</span>
                        <strong className="text-[#1D2321] font-bold">{cluster.disease}</strong>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="p-1.5 bg-white border border-[#E2E8F0] rounded-md">
                          <span className="text-[10px] text-[#5B6663]">Active Cases</span>
                          <p className="font-mono font-bold text-sm text-[#1D2321]">{cluster.cases}</p>
                        </div>
                        <div className="p-1.5 bg-white border border-[#E2E8F0] rounded-md">
                          <span className="text-[10px] text-[#5B6663]">AI Risk Score</span>
                          <p className="font-mono font-bold text-sm text-[#C6362C]">{(cluster.risk_score * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      {/* Environmental Telemetry */}
                      <div className="flex items-center justify-between text-[10px] text-[#5B6663] pt-1">
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-amber-600" /> {cluster.temp_c}°C
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-600" /> {cluster.humidity_pct}%
                        </span>
                        <span className="flex items-center gap-1 font-mono font-bold text-blue-700">
                          <CloudRain className="w-3 h-3" /> {cluster.rainfall_mm}mm
                        </span>
                      </div>

                      {/* PHC Supplies */}
                      {showSupplyMarkers && (
                        <div className="pt-1.5 border-t border-[#E2E8F0] flex justify-between text-[10px]">
                          <span className="text-[#5B6663]">PHC IV Stock:</span>
                          <strong className={cluster.iv_stock < 20 ? 'text-[#C6362C] font-mono' : 'text-[#146356] font-mono'}>
                            {cluster.iv_stock} units ({cluster.iv_stock < 20 ? 'CRITICAL LOW' : 'BUFFER OK'})
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Dispatch Alert Button */}
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <button
                        onClick={() => {
                          toast.success(`Rapid Medical Containment Protocol initiated for ${cluster.name}. District Health Officer alerted.`);
                        }}
                        className="w-full py-1.5 bg-[#C2255C] hover:bg-[#A61E4D] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Dispatch Containment Protocol</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating On-Map Risk Threshold Legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-xl rounded-xl p-3 text-xs space-y-2 pointer-events-auto max-w-[240px]">
          <div className="flex items-center justify-between border-b border-[#E2E8F0]/80 pb-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#1D2321] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C2255C]" />
              Risk Thresholds
            </span>
            <span className="font-mono text-[10px] text-[#5B6663]">IDSP v2.4</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#8B0000] ring-2 ring-[#8B0000]/20" />
                <span className="font-bold text-[#8B0000]">Critical</span>
              </div>
              <span className="text-[#5B6663]">&ge; 0.75</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#C6362C]" />
                <span className="font-bold text-[#C6362C]">High</span>
              </div>
              <span className="text-[#5B6663]">0.55 &ndash; 0.74</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E8901A]" />
                <span className="font-bold text-[#E8901A]">Moderate</span>
              </div>
              <span className="text-[#5B6663]">0.35 &ndash; 0.54</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#146356]" />
                <span className="font-bold text-[#146356]">Low / Normal</span>
              </div>
              <span className="text-[#5B6663]">&lt; 0.35</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-[#E2E8F0]/60 flex items-center justify-between text-[10px] text-[#5B6663]">
            <span>Active Outbreak Radii</span>
            <span className="font-bold text-[#1D2321]">{displayedClusters.length} Hotspots</span>
          </div>
        </div>
      </div>

    </div>
  );
}
