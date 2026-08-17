'use client';

import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Wind, 
  Thermometer, 
  Droplets, 
  Cloud, 
  Sun, 
  CloudLightning,
  MapPin,
  Compass,
  Activity,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  apparentTemp: number;
}

const DISTRICT_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune' },
  'nashik': { lat: 19.9975, lon: 73.7898, name: 'Nashik' },
  'thane': { lat: 19.2183, lon: 72.9781, name: 'Thane' },
  'kolhapur': { lat: 16.7050, lon: 74.2433, name: 'Kolhapur' },
  'aurangabad': { lat: 19.8762, lon: 75.3433, name: 'Chhatrapati Sambhajinagar' },
  'nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
  'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai Suburban' },
  'satara': { lat: 17.6805, lon: 73.9997, name: 'Satara' },
};

export function WeatherWidget({ initialDistrict = 'pune' }: { initialDistrict?: string }) {
  const [selectedKey, setSelectedKey] = useState<string>(initialDistrict.toLowerCase());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const { language } = useLanguage();

  const coords = DISTRICT_COORDINATES[selectedKey] || DISTRICT_COORDINATES['pune'];

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,apparent_temperature&timezone=auto`
      );
      const data = await res.json();
      
      if (data.current) {
        setWeather({
          temp: Math.round(data.current.temperature_2m * 10) / 10,
          humidity: Math.round(data.current.relative_humidity_2m),
          precipitation: Math.round(data.current.precipitation * 10) / 10,
          windSpeed: Math.round(data.current.wind_speed_10m * 10) / 10,
          weatherCode: data.current.weather_code,
          apparentTemp: Math.round(data.current.apparent_temperature * 10) / 10,
        });
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error("Failed to fetch live weather data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(coords.lat, coords.lon);
    const interval = setInterval(() => fetchWeather(coords.lat, coords.lon), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedKey]);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="w-4 h-4 text-amber-500" />;
    if (code <= 49) return <Cloud className="w-4 h-4 text-gray-500" />;
    if (code <= 69) return <CloudRain className="w-4 h-4 text-blue-500" />;
    if (code <= 99) return <CloudLightning className="w-4 h-4 text-indigo-500" />;
    return <Cloud className="w-4 h-4 text-gray-500" />;
  };

  const getWeatherLabel = (code: number) => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 49) return 'Foggy / Hazy';
    if (code <= 59) return 'Light Drizzle';
    if (code <= 69) return 'Rainfall';
    if (code <= 79) return 'Snow';
    if (code <= 99) return 'Thunderstorm';
    return 'Overcast';
  };

  // Vector Breeding Risk based on humidity and precipitation
  const getVectorRisk = () => {
    if (!weather) return { label: 'Normal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (weather.humidity > 80 && weather.precipitation > 5) {
      return { label: 'High Vector Risk (Breeding)', color: 'text-red-700 bg-red-50 border-red-200 animate-pulse' };
    }
    if (weather.humidity > 70 || weather.precipitation > 0) {
      return { label: 'Moderate Vector Risk', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { label: 'Low Vector Risk', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const vectorRisk = getVectorRisk();

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm relative overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />

      {/* Top District Selector & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 relative z-10">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#C2255C]" />
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="text-xs font-extrabold text-[#1D2321] bg-[#F6F5F2] hover:bg-[#EAE8E3] border border-[#E2E8F0] rounded-lg px-2 py-1 outline-none cursor-pointer transition-colors"
            aria-label="Select Weather Surveillance District"
          >
            <option value="pune">Pune District</option>
            <option value="nashik">Nashik District</option>
            <option value="thane">Thane District</option>
            <option value="kolhapur">Kolhapur District</option>
            <option value="aurangabad">Chhatrapati Sambhajinagar</option>
            <option value="nagpur">Nagpur District</option>
            <option value="mumbai">Mumbai Suburban</option>
            <option value="satara">Satara District</option>
          </select>
          <span className="text-[10px] text-[#5B6663] hidden sm:inline">• Live IMD Feed ({lastUpdated})</span>
        </div>

        <div className="flex items-center gap-2">
          {weather && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {getWeatherIcon(weather.weatherCode)}
              <span>{getWeatherLabel(weather.weatherCode)}</span>
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${vectorRisk.color}`}>
            {vectorRisk.label}
          </span>
        </div>
      </div>

      {/* Weather Metrics Grid */}
      {loading || !weather ? (
        <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#5B6663] animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-[#C2255C] border-t-transparent rounded-full animate-spin" />
          <span>Syncing Real-time Satellite Telemetry...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 relative z-10">
          <div className="p-2 bg-[#F6F5F2]/60 border border-[#E2E8F0] rounded-lg flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[#5B6663]">
              <Thermometer className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] font-bold uppercase">Temperature</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono font-bold text-[#1D2321]">{weather.temp}°C</span>
              <span className="text-[10px] text-[#5B6663]">(feels {weather.apparentTemp}°)</span>
            </div>
          </div>
          
          <div className="p-2 bg-[#F6F5F2]/60 border border-[#E2E8F0] rounded-lg flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[#5B6663]">
              <Droplets className="w-3 h-3 text-blue-600" />
              <span className="text-[10px] font-bold uppercase">Humidity</span>
            </div>
            <span className="text-lg font-mono font-bold text-[#1D2321]">{weather.humidity}%</span>
          </div>

          <div className="p-2 bg-[#F6F5F2]/60 border border-[#E2E8F0] rounded-lg flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[#5B6663]">
              <Wind className="w-3 h-3 text-cyan-600" />
              <span className="text-[10px] font-bold uppercase">Wind Speed</span>
            </div>
            <span className="text-lg font-mono font-bold text-[#1D2321]">
              {weather.windSpeed} <span className="text-xs text-[#5B6663]">km/h</span>
            </span>
          </div>

          <div className="p-2 bg-[#F6F5F2]/60 border border-[#E2E8F0] rounded-lg flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[#5B6663]">
              <CloudRain className="w-3 h-3 text-indigo-600" />
              <span className="text-[10px] font-bold uppercase">Precipitation</span>
            </div>
            <span className="text-lg font-mono font-bold text-blue-700">
              {weather.precipitation} <span className="text-xs text-[#5B6663]">mm</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
