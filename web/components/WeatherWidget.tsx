'use client';

import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Thermometer, Droplets, Cloud, Sun, CloudLightning } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  // Pune coordinates as default center of our surveillance
  const LAT = 18.5204;
  const LON = 73.8567;

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`);
        const data = await res.json();
        
        if (data.current) {
          setWeather({
            temp: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m,
            precipitation: data.current.precipitation,
            windSpeed: data.current.wind_speed_10m,
            weatherCode: data.current.weather_code,
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    // Basic WMO weather code mapping
    if (code <= 3) return <Sun className="w-5 h-5 text-amber-500" />;
    if (code <= 49) return <Cloud className="w-5 h-5 text-gray-500" />;
    if (code <= 69) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (code <= 99) return <CloudLightning className="w-5 h-5 text-indigo-500" />;
    return <Cloud className="w-5 h-5 text-gray-500" />;
  };

  const getWeatherLabel = (code: number) => {
    if (code === 0) return 'Clear sky';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 49) return 'Foggy';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
  };

  if (loading || !weather) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm animate-pulse flex items-center justify-center min-w-[200px] h-[90px]">
        <div className="text-xs text-[#5B6663] font-semibold">Syncing Satellites...</div>
      </div>
    );
  }

  const titleText = language === 'mr' ? 'हवामान (Pune)' : language === 'hi' ? 'मौसम (Pune)' : 'Pune Weather (Live)';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-xs font-bold text-[#5B6663] uppercase tracking-wider flex items-center gap-1.5">
          {titleText}
        </span>
        <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {getWeatherIcon(weather.weatherCode)}
          {getWeatherLabel(weather.weatherCode)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#5B6663]">
            <Thermometer className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Temp</span>
          </div>
          <span className="text-xl font-mono font-bold text-[#1D2321]">{weather.temp}°C</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#5B6663]">
            <Droplets className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Humidity</span>
          </div>
          <span className="text-xl font-mono font-bold text-[#1D2321]">{weather.humidity}%</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#5B6663]">
            <Wind className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Wind</span>
          </div>
          <span className="text-xl font-mono font-bold text-[#1D2321]">{weather.windSpeed} <span className="text-sm">km/h</span></span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#5B6663]">
            <CloudRain className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Precip</span>
          </div>
          <span className="text-xl font-mono font-bold text-[#1D2321]">{weather.precipitation} <span className="text-sm">mm</span></span>
        </div>
      </div>
    </div>
  );
}
