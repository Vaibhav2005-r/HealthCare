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

export interface AlertAuditLogItem {
  id: string;
  alert_id: string;
  previous_status: string;
  new_status: string;
  action_by: string;
  action_role: string;
  action_notes?: string;
  created_at: string;
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
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolved_by_role?: string | null;
  resolution_notes?: string | null;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  created_at?: string;
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
    registered_asha_workers?: number;
    case_delta_7d_pct: string;
    system_state: string;
  };
  top_at_risk: DistrictData[];
  trend_series: Array<{
    day: string;
    cases: number;
    forecast: number | null;
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

const rawApiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
const normalizedApiBase = rawApiBase?.replace(/\/+$/, '');
const API_BASE = normalizedApiBase
  ? (normalizedApiBase.endsWith('/api/v1') ? normalizedApiBase : `${normalizedApiBase}/api/v1`)
  : 'http://localhost:8001/api/v1';

export async function fetchLiveDashboard(): Promise<LiveDashboardData> {
  const res = await fetch(`${API_BASE}/dashboard/live`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch live dashboard from Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchDistricts(riskFilter?: string): Promise<DistrictData[]> {
  const url = riskFilter && riskFilter !== 'ALL'
    ? `${API_BASE}/dashboard/districts?risk_filter=${encodeURIComponent(riskFilter)}`
    : `${API_BASE}/dashboard/districts`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch districts from Supabase: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.districts || [];
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const res = await fetch(`${API_BASE}/dashboard/alerts`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts from Supabase: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.alerts || [];
}

export async function triggerSOS(alert: { worker_id: string; district: string; cases: number; severity: string }): Promise<any> {
  const res = await fetch(`${API_BASE}/alerts/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert)
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger SOS alert: HTTP ${res.status}`);
  }
  return await res.json();
}

export interface IngestResponse {
  status: 'success' | 'error';
  doc_id?: string;
  filename?: string;
  pages_processed?: number;
  chunks_processed: number;
  time_seconds?: number;
  uploaded_at?: string;
  message: string;
}

export interface RagDocItem {
  id: string;
  name: string;
  chunks_count: number;
  pages_count: number;
  uploaded_at: string;
  status: 'SUCCESS' | 'INGESTING';
  progress: number;
}

export interface AskRagResponse {
  answer: string;
  citations: string[];
  retrieved_excerpts?: Array<{
    source: string;
    text: string;
    score: number;
  }>;
  top_source?: string;
  error?: string;
}

export async function ingestDocument(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/rag/ingest`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Server returned ${res.status}`);
  }

  return await res.json();
}

export async function fetchRagDocuments(): Promise<RagDocItem[]> {
  const res = await fetch(`${API_BASE}/rag/documents`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch RAG documents: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.documents || [];
}

export async function deleteRagDocument(docId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/rag/documents/${encodeURIComponent(docId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to delete document ${docId}`);
  }
  return await res.json();
}

export async function askRAG(query: string): Promise<AskRagResponse> {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`RAG query failed: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchInventory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/resources/inventory`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch health center inventory: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.supplies || [];
}

export async function fetchTelemetryLogs(district?: string): Promise<any[]> {
  const url = district 
    ? `${API_BASE}/telemetry/logs?district=${encodeURIComponent(district)}` 
    : `${API_BASE}/telemetry/logs`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch telemetry logs: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.logs || [];
}

export async function updateAlertStatus(
  alertId: string, 
  status: 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'UNACKNOWLEDGED',
  actionBy: string = "Dr. S. Kulkarni (CMO)",
  actionRole: string = "Chief Medical Officer / DHO",
  actionNotes?: string
): Promise<{ status: string; alert?: AlertItem; audit_trail?: AlertAuditLogItem[]; message?: string }> {
  const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(alertId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      action_by: actionBy,
      action_role: actionRole,
      action_notes: actionNotes
    })
  });
  if (!res.ok) {
    throw new Error(`Failed to update alert status in Supabase: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchAlertAuditLogs(alertId?: string): Promise<AlertAuditLogItem[]> {
  const url = alertId 
    ? `${API_BASE}/alerts/${encodeURIComponent(alertId)}/audit` 
    : `${API_BASE}/alerts/audit/all`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch alert audit logs: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.audit_trail || [];
}

export interface IMDDistrictWeather {
  district_id: string;
  district_name: string;
  division: string;
  lat: number;
  lng: number;
  rainfall_24h_mm: number;
  temp_current_c: number;
  temp_max_c: number;
  temp_min_c: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  imd_color_code: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  vector_breeding_risk: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  synoptic_summary: string;
  last_synced: string;
}

export interface IMDWarningItem {
  district: string;
  color_code: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  rainfall_mm: number;
  warning_type: string;
  message: string;
}

export interface IMDFeedData {
  status: string;
  station_authority: string;
  state: string;
  timestamp: string;
  synoptic_monsoon_status: string;
  statewide_metrics: {
    monitored_stations: number;
    avg_rainfall_mm: number;
    avg_humidity_pct: number;
    red_alert_districts_count: number;
    orange_alert_districts_count: number;
    yellow_alert_districts_count: number;
    green_alert_districts_count: number;
  };
  active_warnings: IMDWarningItem[];
  districts: IMDDistrictWeather[];
}

export async function fetchImdFeed(): Promise<IMDFeedData> {
  const res = await fetch(`${API_BASE}/dashboard/imd-feed`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch IMD meteorological radar feed: HTTP ${res.status}`);
  }
  return await res.json();
}

export interface FourCastNetForecastItem {
  day: string;
  date: string;
  predicted_cases: number;
  lower_bound_cases: number;
  upper_bound_cases: number;
  fourcastnet_rainfall_mm: number;
  temp_c: number;
  humidity_pct: number;
  vector_breeding_risk: number;
  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface SimultaneousForecastResponse {
  district_id: string;
  district_name: string;
  coordinates: { lat: number; lng: number };
  baseline_active_cases: number;
  forecast_horizon_days: number;
  model_architecture: {
    nwp_weather_engine: string;
    spatial_resolution: string;
    nwp_lead_time: string;
    epidemiological_engine: string;
    calibration_weighting: string;
  };
  forecast_trajectory: FourCastNetForecastItem[];
}

export async function fetchSimultaneousForecast(districtId: string = 'MH-PLG'): Promise<SimultaneousForecastResponse> {
  const res = await fetch(`${API_BASE}/forecast/simultaneous/${encodeURIComponent(districtId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch simultaneous FourCastNet forecast: HTTP ${res.status}`);
  }
  return await res.json();
}

export interface AnalyticsTrendItem {
  date: string;
  actual_cases: number | null;
  predicted_cases: number | null;
  lower_bound?: number;
  upper_bound?: number;
  precip_mm: number;
  temp_c?: number;
  humidity?: number;
  vector_breeding_risk?: number;
  risk_score?: number;
  risk_level?: string;
  is_forecast: boolean;
}

export interface AnalyticsTrendResponse {
  district_id: string;
  district_name: string;
  source: string;
  data: AnalyticsTrendItem[];
  summary?: {
    baseline_active_cases: number;
    peak_predicted_cases: number;
    max_rain_forecast: number;
  };
}

export interface DemographicsResponse {
  source: string;
  total_intake_records: number;
  age_brackets: Record<string, number>;
  symptom_clusters: Record<string, number>;
}

export async function fetchAnalyticsTrends(districtId?: string): Promise<AnalyticsTrendResponse> {
  const url = districtId 
    ? `${API_BASE}/analytics/trends?district_id=${encodeURIComponent(districtId)}` 
    : `${API_BASE}/analytics/trends`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics trends: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchAnalyticsDemographics(): Promise<DemographicsResponse> {
  const res = await fetch(`${API_BASE}/analytics/demographics`);
  if (!res.ok) {
    throw new Error(`Failed to fetch clinical demographics: HTTP ${res.status}`);
  }
  return await res.json();
}
