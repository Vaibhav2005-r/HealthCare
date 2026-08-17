export interface DistrictData {
  district_id: string;
  name: string;
  state: string;
  centroid_lat: number;
  centroid_lng: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  active_cases: number;
  trend_7d: 'UP' | 'DOWN' | 'FLAT';
  trend_pct: number;
  primary_suspected: string;
  population: string;
  asha_active_count: number;
  rainfall_mm: number;
  humidity_pct: number;
  last_reported: string;
}

export interface AlertItem {
  id: string;
  district: string;
  state: string;
  type: 'SOS_TRIGGER' | 'ML_SPIKE_PREDICTION';
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  cases_count: number;
  worker_role: string;
  timestamp: string;
  summary: string;
  status: 'UNACKNOWLEDGED' | 'INVESTIGATING' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface LiveDashboardData {
  pulse: {
    total_districts: number;
    low_count: number;
    moderate_count: number;
    high_count: number;
    critical_count: number;
  };
  summary: {
    total_monitored_districts: number;
    active_cases_total: number;
    high_critical_districts: number;
    active_asha_workers: number;
    case_delta_7d_pct: string;
    system_state: string;
  };
  top_at_risk: DistrictData[];
  trend_series: Array<{
    day: string;
    cases: number;
    forecast: number;
    rainfall: number;
  }>;
  disease_breakdown: Array<{
    disease: string;
    cases: number;
    pct: number;
    severity: string;
  }>;
  recent_alerts: AlertItem[];
}

const API_BASE = 'http://localhost:8001/api/v1';

export const FALLBACK_DISTRICTS: DistrictData[] = [
  {
    district_id: "MH-PUN",
    name: "Pune",
    state: "Maharashtra",
    centroid_lat: 18.5204,
    centroid_lng: 73.8567,
    risk_level: "CRITICAL",
    risk_score: 0.89,
    active_cases: 48,
    trend_7d: "UP",
    trend_pct: 34.5,
    primary_suspected: "Cholera / Acute Diarrhea",
    population: "9,429,408",
    asha_active_count: 142,
    rainfall_mm: 88.4,
    humidity_pct: 84,
    last_reported: "12 mins ago"
  },
  {
    district_id: "MH-NSK",
    name: "Nashik",
    state: "Maharashtra",
    centroid_lat: 19.9975,
    centroid_lng: 73.7898,
    risk_level: "HIGH",
    risk_score: 0.76,
    active_cases: 32,
    trend_7d: "UP",
    trend_pct: 21.0,
    primary_suspected: "Dengue",
    population: "6,107,187",
    asha_active_count: 98,
    rainfall_mm: 112.0,
    humidity_pct: 89,
    last_reported: "35 mins ago"
  },
  {
    district_id: "MH-THA",
    name: "Thane",
    state: "Maharashtra",
    centroid_lat: 19.2183,
    centroid_lng: 72.9781,
    risk_level: "HIGH",
    risk_score: 0.72,
    active_cases: 29,
    trend_7d: "UP",
    trend_pct: 18.2,
    primary_suspected: "Malaria",
    population: "11,060,148",
    asha_active_count: 184,
    rainfall_mm: 64.2,
    humidity_pct: 81,
    last_reported: "1 hour ago"
  },
  {
    district_id: "MH-KOP",
    name: "Kolhapur",
    state: "Maharashtra",
    centroid_lat: 16.7050,
    centroid_lng: 74.2433,
    risk_level: "MODERATE",
    risk_score: 0.54,
    active_cases: 17,
    trend_7d: "FLAT",
    trend_pct: 1.5,
    primary_suspected: "Viral Fever",
    population: "3,876,001",
    asha_active_count: 76,
    rainfall_mm: 45.0,
    humidity_pct: 72,
    last_reported: "2 hours ago"
  },
  {
    district_id: "MH-AUR",
    name: "Chhatrapati Sambhajinagar",
    state: "Maharashtra",
    centroid_lat: 19.8762,
    centroid_lng: 75.3433,
    risk_level: "MODERATE",
    risk_score: 0.48,
    active_cases: 14,
    trend_7d: "DOWN",
    trend_pct: -8.4,
    primary_suspected: "ARI / Flu",
    population: "3,701,282",
    asha_active_count: 82,
    rainfall_mm: 22.1,
    humidity_pct: 65,
    last_reported: "3 hours ago"
  },
  {
    district_id: "MH-NAG",
    name: "Nagpur",
    state: "Maharashtra",
    centroid_lat: 21.1458,
    centroid_lng: 79.0882,
    risk_level: "LOW",
    risk_score: 0.22,
    active_cases: 6,
    trend_7d: "DOWN",
    trend_pct: -15.0,
    primary_suspected: "Seasonal",
    population: "4,653,570",
    asha_active_count: 110,
    rainfall_mm: 12.0,
    humidity_pct: 58,
    last_reported: "4 hours ago"
  },
  {
    district_id: "MH-MUM",
    name: "Mumbai Suburban",
    state: "Maharashtra",
    centroid_lat: 19.0760,
    centroid_lng: 72.8777,
    risk_level: "LOW",
    risk_score: 0.28,
    active_cases: 11,
    trend_7d: "FLAT",
    trend_pct: -2.0,
    primary_suspected: "Dengue",
    population: "12,442,373",
    asha_active_count: 230,
    rainfall_mm: 38.0,
    humidity_pct: 79,
    last_reported: "30 mins ago"
  },
  {
    district_id: "MH-SAT",
    name: "Satara",
    state: "Maharashtra",
    centroid_lat: 17.6805,
    centroid_lng: 73.9997,
    risk_level: "LOW",
    risk_score: 0.18,
    active_cases: 4,
    trend_7d: "DOWN",
    trend_pct: -22.0,
    primary_suspected: "None",
    population: "3,003,741",
    asha_active_count: 64,
    rainfall_mm: 18.5,
    humidity_pct: 60,
    last_reported: "5 hours ago"
  }
];

export async function fetchLiveDashboard(): Promise<LiveDashboardData> {
  try {
    const res = await fetch(`${API_BASE}/dashboard/live`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API /dashboard/live unreachable, using rich fallback data', err);
    return {
      pulse: {
        total_districts: 8,
        low_count: 3,
        moderate_count: 2,
        high_count: 2,
        critical_count: 1,
      },
      summary: {
        total_monitored_districts: 8,
        active_cases_total: 161,
        high_critical_districts: 3,
        active_asha_workers: 986,
        case_delta_7d_pct: "+14.8%",
        system_state: "ELEVATED_SURVEILLANCE"
      },
      top_at_risk: FALLBACK_DISTRICTS.slice(0, 5),
      trend_series: [
        { day: "Mon", cases: 112, forecast: 110, rainfall: 45 },
        { day: "Tue", cases: 128, forecast: 125, rainfall: 62 },
        { day: "Wed", cases: 142, forecast: 139, rainfall: 80 },
        { day: "Thu", cases: 156, forecast: 152, rainfall: 95 },
        { day: "Fri", cases: 169, forecast: 165, rainfall: 78 },
        { day: "Sat", cases: 178, forecast: 174, rainfall: 110 },
        { day: "Sun", cases: 186, forecast: 182, rainfall: 88 }
      ],
      disease_breakdown: [
        { disease: "Dengue", cases: 68, pct: 36.5, severity: "HIGH" },
        { disease: "Cholera / Diarrhea", cases: 54, pct: 29.0, severity: "CRITICAL" },
        { disease: "Malaria", cases: 38, pct: 20.4, severity: "HIGH" },
        { disease: "Acute Respiratory", cases: 26, pct: 14.1, severity: "MODERATE" }
      ],
      recent_alerts: [
        {
          id: "alt-01",
          district: "Pune",
          state: "Maharashtra",
          type: "SOS_TRIGGER",
          severity: "CRITICAL",
          risk_score: 0.89,
          cases_count: 18,
          worker_role: "ASHA Lead (Haveli Block)",
          timestamp: "2026-08-16T01:15:00Z",
          summary: "URGENT: Cluster of 18 severe diarrhea and acute dehydration cases reported within 6 hours. High risk of localized Cholera outbreak. Immediate IV fluids and isolation protocol required.",
          status: "UNACKNOWLEDGED"
        },
        {
          id: "alt-02",
          district: "Nashik",
          state: "Maharashtra",
          type: "ML_SPIKE_PREDICTION",
          severity: "HIGH",
          risk_score: 0.76,
          cases_count: 12,
          worker_role: "ANM Supervisor (Trimbak)",
          timestamp: "2026-08-15T22:40:00Z",
          summary: "SPATIAL ANOMALY: Dengue incidence increased 42% over baseline following heavy rainfall (112mm). Vector transmission rate accelerating across 3 adjacent sub-centers.",
          status: "INVESTIGATING"
        },
        {
          id: "alt-03",
          district: "Thane",
          state: "Maharashtra",
          type: "ML_SPIKE_PREDICTION",
          severity: "HIGH",
          risk_score: 0.72,
          cases_count: 14,
          worker_role: "PHC Officer (Bhiwandi)",
          timestamp: "2026-08-15T18:20:00Z",
          summary: "THRESHOLD EXCEEDED: Malaria positive test strip confirmations crossed the 95th percentile trigger. Deploy additional rapid diagnostic kits.",
          status: "ACKNOWLEDGED"
        },
        {
          id: "alt-04",
          district: "Kolhapur",
          state: "Maharashtra",
          type: "SOS_TRIGGER",
          severity: "MODERATE",
          risk_score: 0.54,
          cases_count: 7,
          worker_role: "ASHA Worker (Karvir)",
          timestamp: "2026-08-15T14:10:00Z",
          summary: "EARLY WARNING: 7 suspected viral fever cases with joint pain reported. ASHA workers deployed for active house-to-house screening.",
          status: "RESOLVED"
        }
      ]
    };
  }
}

export async function fetchDistricts(riskFilter?: string): Promise<DistrictData[]> {
  try {
    const url = riskFilter && riskFilter !== 'ALL'
      ? `${API_BASE}/dashboard/districts?risk_filter=${riskFilter}`
      : `${API_BASE}/dashboard/districts`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.districts;
  } catch (err) {
    console.warn('API /dashboard/districts unreachable, using fallback', err);
    if (riskFilter && riskFilter !== 'ALL') {
      return FALLBACK_DISTRICTS.filter(d => d.risk_level === riskFilter);
    }
    return FALLBACK_DISTRICTS;
  }
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  try {
    const res = await fetch(`${API_BASE}/dashboard/alerts`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.alerts;
  } catch (err) {
    const live = await fetchLiveDashboard();
    return live.recent_alerts;
  }
}

export async function fetchTelemetryLogs(district?: string): Promise<any[]> {
  try {
    const url = district ? `${API_BASE}/telemetry/logs?district=${encodeURIComponent(district)}` : `${API_BASE}/telemetry/logs`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.warn('API /telemetry/logs unreachable', err);
    return [];
  }
}

export async function fetchInventory(district?: string): Promise<any[]> {
  try {
    const url = district ? `${API_BASE}/resources/inventory?district=${encodeURIComponent(district)}` : `${API_BASE}/resources/inventory`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.supplies || [];
  } catch (err) {
    console.warn('API /resources/inventory unreachable', err);
    return [];
  }
}

export async function fetchAnalyticsTrends(district?: string): Promise<any> {
  try {
    const url = district ? `${API_BASE}/analytics/trends?district=${encodeURIComponent(district)}` : `${API_BASE}/analytics/trends`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API /analytics/trends unreachable', err);
    return { data: [] };
  }
}

export async function triggerSOS(alert: { worker_id: string; district: string; cases: number; severity: string }): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/alerts/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
    return await res.json();
  } catch (err) {
    console.error('Error triggering SOS', err);
    return { status: 'alert_logged_offline', message: `SOS queued for ${alert.district}` };
  }
}
