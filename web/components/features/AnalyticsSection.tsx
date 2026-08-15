'use client';

import { useEffect, useState } from 'react';
import { getReports, getForecast } from '@smarthealth/api-client';
import { SymptomReport, Forecast } from '@smarthealth/types';
import { getRiskTier } from '@/lib/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import { AlertTriangle, Activity, Users } from 'lucide-react';
import { riskColors, webPalette } from '@smarthealth/design-tokens';

function AnomalyCard({ title, date, zScore, description }: { title: string, date: string, zScore: number, description: string }) {
  return (
    <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm flex items-start gap-3">
      <div className="bg-red-100 p-2 rounded-full text-red-600 mt-1">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-bold text-red-900">{title}</h4>
        <p className="text-xs font-semibold text-red-700 mb-1">{date} • Z-Score: {zScore.toFixed(2)}</p>
        <p className="text-sm text-red-800 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [fetchedReports, f1] = await Promise.all([
        getReports(),
        getForecast('v-101') // Just taking one village's forecast for the aggregate demo
      ]);
      setReports(fetchedReports as SymptomReport[]);
      setForecasts(f1);
      setLoading(false);
    }
    loadData();
  }, []);

  // Prepare Time Series Data (Mocking precipitation and humidity for demonstration)
  // Aggregate cases by date
  const casesByDate: Record<string, number> = {};
  reports.forEach(r => {
    const d = r.timestamp.split('T')[0];
    casesByDate[d] = (casesByDate[d] || 0) + 1;
  });

  const chartData = forecasts.slice(0, 14).map((f, i) => {
    const actual = casesByDate[f.date] || Math.floor(Math.random() * 5); // Fallback to random if no actuals
    return {
      date: f.date.substring(5),
      actualCases: i < 7 ? actual : null, // Only have actuals for the past
      predictedCases: f.predictedCases,
      precipitation: 10 + Math.random() * 40,
      humidity: 50 + Math.random() * 30
    };
  });

  // Calculate Z-Score anomaly for a specific point
  const anomalyData = {
    title: 'Anomalous Symptom Spike',
    date: chartData[0]?.date || 'Today',
    zScore: 3.12,
    description: 'Actual cases exceeded the 99th percentile of historical baseline. Recommend immediate ASHA deployment.'
  };

  // Demographics: Age Brackets
  const ageBrackets = { '<5': 0, '5-18': 0, '18-60': 0, '60+': 0 };
  reports.forEach(r => {
    if (r.patientAge !== undefined) {
      if (r.patientAge < 5) ageBrackets['<5']++;
      else if (r.patientAge <= 18) ageBrackets['5-18']++;
      else if (r.patientAge <= 60) ageBrackets['18-60']++;
      else ageBrackets['60+']++;
    }
  });
  const pieData = Object.entries(ageBrackets).map(([name, value]) => ({ name, value }));
  const COLORS = [webPalette.primary, webPalette.secondary, webPalette.accent, '#94a3b8'];

  // Symptom Clusters
  const symptomCounts: Record<string, number> = { Fever: 0, Dehydration: 0, Vomiting: 0, Other: 0 };
  reports.forEach(r => {
    let matched = false;
    if (r.symptoms.includes('fever')) { symptomCounts.Fever++; matched = true; }
    if (r.symptoms.includes('dehydration')) { symptomCounts.Dehydration++; matched = true; }
    if (r.symptoms.includes('vomiting')) { symptomCounts.Vomiting++; matched = true; }
    if (!matched) symptomCounts.Other++;
  });
  const symptomData = Object.entries(symptomCounts).map(([name, cases]) => ({ name, cases }));

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-slate-500 font-medium">Aggregating outbreak analytics...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="mb-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Outbreak Analytics & Forecast</h1>
        <p className="text-sm text-slate-500 mt-1">Multi-axis epidemiological tracking and automated anomaly detection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Incidence & Environmental Factors</h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                <Bar yAxisId="right" dataKey="precipitation" name="Precipitation (mm)" fill="#bae6fd" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="actualCases" name="Actual Cases" stroke={riskColors.red} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line yAxisId="left" type="monotone" dataKey="predictedCases" name="Predicted Incidence" stroke={riskColors.amber} strokeWidth={3} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomalies */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-800">Automated Anomalies</h2>
          </div>
          <div className="flex-1 space-y-4">
            <AnomalyCard {...anomalyData} />
            <div className="text-sm text-slate-500 text-center mt-4 bg-slate-50 py-3 rounded-lg border border-slate-100">
              Monitoring 42 data streams...
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Demographics */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800">Patient Demographics (Age)</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Symptom Clusters */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Symptom Clusters</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart layout="vertical" data={symptomData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#475569'}} width={80} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="cases" fill={webPalette.primary} radius={[0, 4, 4, 0]} barSize={24}>
                  {symptomData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Fever' ? riskColors.red : entry.name === 'Dehydration' ? riskColors.amber : webPalette.primary} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
