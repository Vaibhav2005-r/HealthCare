'use client';

import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle, 
  CircleMarker, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DistrictData, FALLBACK_DISTRICTS } from '@/lib/api';
import { RiskFilterType } from './RiskPulseBar';
import { 
  Building2, 
  Activity, 
  Droplets, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Send,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';

// Geographic Centroids & Sub-Centers in Maharashtra Surveillance Grid
export interface ClusterPoint {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  cases: number;
  disease: string;
  rainfall_mm: number;
  humidity_pct: number;
  asha_workers: number;
  phc_beds: number;
  ors_stock: number;
  iv_stock: number;
}

export const SURVEILLANCE_DISTRICTS: ClusterPoint[] = [
  {
    id: 'MH-PUN-01',
    name: 'Pune City Central',
    district: 'Pune',
    lat: 18.5204,
    lng: 73.8567,
    risk_level: 'CRITICAL',
    risk_score: 0.89,
    cases: 48,
    disease: 'Cholera / Acute Diarrhea',
    rainfall_mm: 88.4,
    humidity_pct: 84,
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
    rainfall_mm: 92.0,
    humidity_pct: 88,
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
    rainfall_mm: 112.0,
    humidity_pct: 89,
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
    rainfall_mm: 135.0,
    humidity_pct: 92,
    asha_workers: 24,
    phc_beds: 8,
    ors_stock: 95,
    iv_stock: 12
  },
  {
    id: 'MH-THA-01',
    name: 'Thane Central Urban Node',
    district: 'Thane',
    lat: 19.2183,
    lng: 72.9781,
    risk_level: 'HIGH',
    risk_score: 0.72,
    cases: 29,
    disease: 'Malaria (P. Vivax)',
    rainfall_mm: 64.2,
    humidity_pct: 81,
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
    rainfall_mm: 70.5,
    humidity_pct: 85,
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
    rainfall_mm: 45.0,
    humidity_pct: 72,
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
    rainfall_mm: 22.1,
    humidity_pct: 65,
    asha_workers: 82,
    phc_beds: 30,
    ors_stock: 310,
    iv_stock: 70
  },
  {
    id: 'MH-MUM-01',
    name: 'Mumbai Suburban Surveillance',
    district: 'Mumbai Suburban',
    lat: 19.0760,
    lng: 72.8777,
    risk_level: 'LOW',
    risk_score: 0.28,
    cases: 11,
    disease: 'Seasonal Surveillance',
    rainfall_mm: 38.0,
    humidity_pct: 79,
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
    rainfall_mm: 12.0,
    humidity_pct: 58,
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
    rainfall_mm: 18.5,
    humidity_pct: 60,
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
function createCustomPin(color: string, label: string, isCritical = false) {
  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      ${isCritical ? `<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background-color: ${color}; opacity: 0.3; filter: blur(4px); animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
      <div style="width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, ${color}dd, ${color}); backdrop-filter: blur(4px); border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 11px; font-family: monospace;">
        ${label}
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-outbreak-pin',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  });
}

interface MapProps {
  dayOffset?: number;
  activeFilter?: RiskFilterType;
  onSelectDistrict?: (district: DistrictData) => void;
  selectedDistrictId?: string;
}

export default function MapComponent({ 
  dayOffset = 0, 
  activeFilter = 'ALL', 
  onSelectDistrict,
  selectedDistrictId 
}: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter clusters by risk level
  const displayedClusters = SURVEILLANCE_DISTRICTS.filter(c => {
    if (activeFilter !== 'ALL' && c.risk_level !== activeFilter) return false;
    return true;
  });

  // Calculate dynamic heat radius & opacity based on day offset (historical vs forecast)
  const getDynamicIntensity = (baseScore: number) => {
    if (dayOffset <= 0) {
      // Historical: slightly dampen past intensity
      const decay = Math.max(0.5, 1 + dayOffset * 0.015);
      return Math.min(1.0, baseScore * decay);
    } else {
      // Forecast: increase high risk propagation
      const growth = 1 + (dayOffset / 14) * 0.2;
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
      <div className="w-full h-full min-h-[400px] bg-[#EAE8E3]/60 flex items-center justify-center text-xs text-[#5B6663] rounded-xl border border-[#E2E8F0]">
        Initializing GIS Map & CartoDB Muted Base Tiles...
      </div>
    );
  }

  // Centered on Maharashtra, India: Lat 19.2, Lng 75.8 (Zoom 7 covers Pune, Nashik, Mumbai, Thane, Kolhapur, Nagpur, Satara)
  const mapCenter: [number, number] = [19.2, 75.6];
  const defaultZoom = 7;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', minHeight: '350px' }}
        scrollWheelZoom={true}
      >
        <MapViewUpdater center={mapCenter} zoom={defaultZoom} />

        {/* Desaturated, Muted CartoDB Base Tiles for Maximum Risk Overlay Contrast */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {/* 1. Heatmap Intensity Gradients & Density Heat Circles */}
        {displayedClusters.map((cluster) => {
          const intensity = getDynamicIntensity(cluster.risk_score);
          const color = getRiskColor(cluster.risk_level);
          const isHighRisk = cluster.risk_level === 'CRITICAL' || cluster.risk_level === 'HIGH';

          return (
            <React.Fragment key={`heat-${cluster.id}`}>
              {/* Outer Spread Ring */}
              <Circle
                center={[cluster.lat, cluster.lng]}
                radius={isHighRisk ? 42000 * intensity : 28000 * intensity}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isHighRisk ? 0.35 : 0.20,
                  weight: 0,
                  className: 'heatmap-circle'
                }}
              />

              {/* Core Outbreak Density Heat Circle */}
              <Circle
                center={[cluster.lat, cluster.lng]}
                radius={isHighRisk ? 22000 * intensity : 14000 * intensity}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isHighRisk ? 0.65 : 0.40,
                  weight: 0,
                  className: 'heatmap-core'
                }}
              />
            </React.Fragment>
          );
        })}

        {/* 2. Interactive Centroid District Nodes & Popups */}
        {displayedClusters.map((cluster) => {
          const color = getRiskColor(cluster.risk_level);
          const isCritical = cluster.risk_level === 'CRITICAL';
          const icon = createCustomPin(color, String(cluster.cases), isCritical);

          return (
            <Marker
              key={`marker-${cluster.id}`}
              position={[cluster.lat, cluster.lng]}
              icon={icon}
            >
              <Popup className="custom-gov-popup">
                <div className="p-1 max-w-xs text-xs font-sans">
                  {/* Popup Header */}
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E2E8F0]">
                    <div>
                      <h4 className="font-bold text-sm text-[#1D2321]">{cluster.name}</h4>
                      <p className="text-[10px] text-[#5B6663]">{cluster.district} District, Maharashtra</p>
                    </div>
                    <span 
                      style={{ backgroundColor: color }}
                      className="text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                    >
                      {cluster.risk_level}
                    </span>
                  </div>

                  {/* Clinical & Environmental Telemetry */}
                  <div className="py-2 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#5B6663]">Primary Pathogen:</span>
                      <strong className="text-[#1D2321]">{cluster.disease}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6663]">Active Cases:</span>
                      <strong className="font-mono text-[#1D2321]">{cluster.cases} patients</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6663]">AI Risk Probability:</span>
                      <strong className="font-mono text-[#C6362C]">{(cluster.risk_score * 100).toFixed(0)}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6663]">Precipitation (IMD):</span>
                      <strong className="font-mono text-blue-700">{cluster.rainfall_mm} mm</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6663]">PHC Medical Buffer:</span>
                      <span className={cluster.iv_stock < 20 ? 'font-bold text-[#C6362C]' : 'text-[#146356]'}>
                        {cluster.iv_stock} IV units ({cluster.iv_stock < 20 ? 'LOW' : 'OK'})
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#E2E8F0] flex gap-2">
                    <button
                      onClick={() => {
                        toast.success(`Emergency Containment Unit dispatched to ${cluster.name}.`);
                      }}
                      className="flex-1 py-1.5 bg-[#C2255C] hover:bg-[#A61E4D] text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Alert</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
