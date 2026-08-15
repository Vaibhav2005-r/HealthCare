'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { getReports, getForecast } from '@smarthealth/api-client';
import { getRiskTier } from '@/lib/utils';
import { SymptomReport, Forecast } from '@smarthealth/types';

// Fix for default marker icons in Leaflet with webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock Villages with coordinates (since api-client doesn't export coordinates directly)
const VILLAGES = [
  { id: 'v-101', name: 'Kipeto', lat: -1.2921, lng: 36.8219, beds: 15, ors: 120, doctors: 2 },
  { id: 'v-102', name: 'Shika', lat: -1.2821, lng: 36.8119, beds: 8, ors: 45, doctors: 1 },
  { id: 'v-103', name: 'Mlima', lat: -1.3021, lng: 36.8319, beds: 20, ors: 300, doctors: 4 },
  { id: 'v-104', name: 'Ziwa', lat: -1.2721, lng: 36.8419, beds: 5, ors: 20, doctors: 0 },
  { id: 'v-105', name: 'Bonde', lat: -1.3121, lng: 36.8019, beds: 12, ors: 80, doctors: 2 },
];

function HeatmapLayer({ data }: { data: [number, number, number][] }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    
    layerRef.current = (L as any).heatLayer(data, {
      radius: 35,
      blur: 20,
      maxZoom: 12,
      gradient: { 0.4: 'green', 0.65: 'yellow', 1.0: 'red' }
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, data]);

  return null;
}

export default function MapComponent() {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, -30 = 30 days ago, +14 = 14 days future

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [fetchedReports, f1, f2, f3, f4, f5] = await Promise.all([
        getReports(),
        getForecast('v-101'),
        getForecast('v-102'),
        getForecast('v-103'),
        getForecast('v-104'),
        getForecast('v-105'),
      ]);
      setReports(fetchedReports as SymptomReport[]);
      setForecasts([...f1, ...f2, ...f3, ...f4, ...f5]);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Calculate heatmap points based on the current dayOffset
  const heatmapData = VILLAGES.map((v) => {
    // If offset <= 0, we look at historical reports
    if (dayOffset <= 0) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const dayStr = targetDate.toISOString().split('T')[0];
      
      const villageReports = reports.filter(r => r.villageId === v.id && r.timestamp.startsWith(dayStr));
      
      const redCount = villageReports.filter(r => r.outcome === 'RED').length;
      const intensity = Math.min(1.0, redCount * 0.3); // Fake intensity logic
      return [v.lat, v.lng, intensity] as [number, number, number];
    } else {
      // If offset > 0, we look at forecasts
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const dayStr = targetDate.toISOString().split('T')[0];
      
      const villageForecast = forecasts.find(f => f.villageId === v.id && f.date === dayStr);
      let intensity = 0;
      if (villageForecast) {
        if (villageForecast.riskLevel === 'RED') intensity = 0.9;
        else if (villageForecast.riskLevel === 'AMBER') intensity = 0.6;
        else intensity = 0.2;
      }
      return [v.lat, v.lng, intensity] as [number, number, number];
    }
  }).filter(d => d[2] > 0);

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
          <div className="font-semibold text-slate-600 bg-white px-4 py-2 rounded shadow-sm">Loading telemetry...</div>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <label className="text-sm font-semibold text-slate-700 block mb-2">
          Temporal Time-Scrubber: {dayOffset === 0 ? 'Today' : dayOffset < 0 ? `${Math.abs(dayOffset)} days ago` : `${dayOffset} days forecast`}
        </label>
        <input 
          type="range" 
          min="-30" 
          max="14" 
          value={dayOffset} 
          onChange={(e) => setDayOffset(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>-30 Days (History)</span>
          <span>Today</span>
          <span>+14 Days (Forecast)</span>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
        <MapContainer center={[-1.2921, 36.8219]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <HeatmapLayer data={heatmapData} />
          
          {VILLAGES.map((v) => (
            <Marker key={v.id} position={[v.lat, v.lng]}>
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold text-base mb-1">{v.name} PHC</h3>
                  <p className="flex justify-between w-32 border-b border-slate-100 py-1">
                    <span className="text-slate-500">Beds:</span> 
                    <span className="font-medium">{v.beds}</span>
                  </p>
                  <p className="flex justify-between w-32 border-b border-slate-100 py-1">
                    <span className="text-slate-500">ORS Stock:</span> 
                    <span className={`font-medium ${v.ors < 50 ? 'text-red-600' : ''}`}>{v.ors} units</span>
                  </p>
                  <p className="flex justify-between w-32 py-1">
                    <span className="text-slate-500">Doctors:</span> 
                    <span className="font-medium">{v.doctors}</span>
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
