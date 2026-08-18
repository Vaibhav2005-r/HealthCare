'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { RiskPulseBar, RiskFilterType } from '@/components/RiskPulseBar';
import { OverviewView } from '@/components/views/OverviewView';
import { HeatmapView } from '@/components/views/HeatmapView';
import { DistrictsView } from '@/components/views/DistrictsView';
import { AlertsView } from '@/components/views/AlertsView';
import { ReportsView } from '@/components/views/ReportsView';
import { 
  fetchLiveDashboard, 
  fetchDistricts, 
  LiveDashboardData, 
  DistrictData, 
  FALLBACK_DISTRICTS 
} from '@/lib/api';
import { 
  RefreshCw, 
  Bell, 
  ShieldCheck, 
  Menu, 
  X, 
  Database, 
  Package, 
  Search,
  Sparkles,
  CloudRain 
} from 'lucide-react';
import RagAdminSection from '@/components/features/RagAdminSection';
import ResourceManagementSection from '@/components/features/ResourceManagementSection';
import ImdFeedSection from '@/components/features/ImdFeedSection';
import { GuidedTour } from '@/components/GuidedTour';
import { toast } from 'sonner';
import { useLanguage, Language } from '@/lib/i18n';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm h-28 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-[#EAE8E3] rounded" />
              <div className="w-4 h-4 bg-[#EAE8E3] rounded-full" />
            </div>
            <div className="w-16 h-7 bg-[#EAE8E3] rounded" />
            <div className="w-full h-2 bg-[#F6F5F2] rounded pt-2" />
          </div>
        ))}
      </div>

      {/* Hero Forecast Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm h-96 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-2">
              <div className="w-32 h-3 bg-[#EAE8E3] rounded" />
              <div className="w-64 h-5 bg-[#EAE8E3] rounded" />
            </div>
            <div className="w-28 h-6 bg-[#F6F5F2] rounded-lg" />
          </div>
          <div className="flex-1 bg-[#F6F5F2]/60 rounded-lg flex items-end p-4 gap-4">
            {[40, 65, 80, 55, 90, 75, 85].map((h, idx) => (
              <div key={idx} className="flex-1 bg-[#EAE8E3] rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm h-96 flex flex-col justify-between">
          <div className="w-40 h-4 bg-[#EAE8E3] rounded mb-2" />
          <div className="w-32 h-32 rounded-full border-8 border-[#EAE8E3] self-center my-auto" />
          <div className="space-y-2 pt-4 border-t border-[#E2E8F0]/60">
            <div className="w-full h-3 bg-[#EAE8E3] rounded" />
            <div className="w-full h-3 bg-[#EAE8E3] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArogyaPrahariDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [activeRiskFilter, setActiveRiskFilter] = useState<RiskFilterType>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<LiveDashboardData>({
    pulse: {
      total_districts: 36,
      low_count: 12,
      moderate_count: 13,
      high_count: 7,
      critical_count: 4,
    },
    summary: {
      total_monitored_districts: 36,
      active_cases_total: 824,
      high_critical_districts: 11,
      active_asha_workers: 4620,
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
        "timestamp": "2026-08-15T22:40:00Z",
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
  });
  const [districts, setDistricts] = useState<DistrictData[]>(FALLBACK_DISTRICTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const { t, language, setLanguage } = useLanguage();

  // Load live telemetry from FastAPI backend
  const loadData = async () => {
    try {
      const [live, dists] = await Promise.all([
        fetchLiveDashboard(),
        fetchDistricts()
      ]);
      setDashboardData(live);
      setDistricts(dists);
    } catch (err) {
      console.error('Error loading dashboard telemetry:', err);
    }
  };

  useEffect(() => {
    loadData();

    // 1. WebSocket Real-time Live Stream
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket('ws://localhost:8001/ws/telemetry');
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_SOS_ALERT') {
            toast.error(`🚨 LIVE REALTIME SOS: ${data.alert.cases_count} cases in ${data.alert.district}!`, {
              duration: 6000,
            });
            setDashboardData(prev => ({
              ...prev,
              recent_alerts: [data.alert, ...prev.recent_alerts]
            }));
          } else if (data.type === 'NEW_FIELD_REPORT') {
            toast.info(`Field intake received from ${data.worker_id}: ${data.symptoms.join(', ')}`);
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };
    } catch (e) {
      console.warn('WebSocket connection not supported in this environment');
    }

    // 2. Fallback Background Polling Sync every 30s
    const interval = setInterval(loadData, 30000);

    return () => {
      clearInterval(interval);
      if (socket) socket.close();
    };
  }, []);

  const handleSelectDistrict = (district: DistrictData | null) => {
    setSelectedDistrict(district);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1D2321] flex flex-col md:flex-row">
      {/* Guided Presentation Tour Modal */}
      <GuidedTour 
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      
      {/* 1. Sidebar Navigation (Desktop & Mobile Drawer) */}
      <div className="hidden md:block">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          unacknowledgedAlertsCount={dashboardData?.recent_alerts?.filter(a => a.status === 'UNACKNOWLEDGED').length || 2}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/50 md:hidden flex">
          <div className="w-72 bg-white h-full shadow-2xl relative">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#5B6663] hover:text-[#1D2321]"
              aria-label="Close mobile menu"
            >
              <X className="w-6 h-6" />
            </button>
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              unacknowledgedAlertsCount={dashboardData?.recent_alerts?.filter(a => a.status === 'UNACKNOWLEDGED').length || 2}
            />
          </div>
        </div>
      )}

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Command Bar */}
        <header className="no-print h-16 bg-white border-b border-[#E2E8F0] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-[#5B6663] hover:text-[#1D2321] md:hidden rounded-lg"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1D2321] capitalize tracking-tight">
                  {activeTab === 'overview' && t('header.executive_overview')}
                  {activeTab === 'heatmap' && t('header.gis_heatmap')}
                  {activeTab === 'districts' && t('header.district_matrix')}
                  {activeTab === 'imd' && 'IMD Meteorological Radar & Precipitation'}
                  {activeTab === 'rag' && t('header.rag_protocols')}
                  {activeTab === 'resources' && t('header.phc_buffer')}
                  {activeTab === 'alerts' && t('header.incident_feed')}
                  {activeTab === 'reports' && t('header.gov_bulletin')}
                </span>
                <span className="text-xs text-[#5B6663] hidden sm:inline">•</span>
                <span className="text-xs font-semibold text-[#5B6663] hidden sm:inline">
                  {t('header.maharashtra_grid')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* IMD Live Radar Shortcut */}
            <button
              onClick={() => setActiveTab('imd')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeTab === 'imd' 
                  ? 'bg-[#1A5F7A] text-white border-[#1A5F7A] shadow-xs' 
                  : 'bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border-[#E2E8F0]'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>IMD Radar</span>
            </button>

            {/* Presentation Tour Button */}
            <button
              onClick={() => setIsTourOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C2255C] hover:bg-[#A61E4D] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guided Tour</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-[#F6F5F2] border border-[#E2E8F0] rounded-lg p-0.5 mr-1">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white shadow-sm text-[#1D2321]' : 'text-[#5B6663] hover:text-[#1D2321]'}`}
              >EN</button>
              <button 
                onClick={() => setLanguage('mr')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${language === 'mr' ? 'bg-white shadow-sm text-[#1D2321]' : 'text-[#5B6663] hover:text-[#1D2321]'}`}
              >MR</button>
              <button 
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${language === 'hi' ? 'bg-white shadow-sm text-[#1D2321]' : 'text-[#5B6663] hover:text-[#1D2321]'}`}
              >HI</button>
            </div>
            
            {/* RAG Query Shortcut */}
            <button
              onClick={() => setActiveTab('rag')}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeTab === 'rag' 
                  ? 'bg-[#C2255C] text-white border-[#C2255C] shadow-xs' 
                  : 'bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border-[#E2E8F0]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{t('header.rag')}</span>
            </button>

            {/* Refresh Live Telemetry */}
            <button
              onClick={() => {
                loadData();
                toast.success('Live district telemetry refreshed from ML Engine');
              }}
              disabled={isLoading}
              className="p-2 text-[#5B6663] hover:text-[#1D2321] hover:bg-[#F6F5F2] rounded-lg transition-colors"
              title="Refresh Data"
              aria-label="Refresh surveillance data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#C2255C]' : ''}`} />
            </button>

            {/* System Live Pill */}
            <div className="flex items-center gap-1.5 bg-emerald-50 text-[#146356] border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#146356]" />
              <span className="hidden sm:inline">DHO ONLINE</span>
            </div>
          </div>
        </header>

        {/* Main Work Area */}
        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Pinned Signature Component: Risk Pulse Bar */}
          {dashboardData && (
            <div className="no-print">
              <RiskPulseBar 
                pulse={dashboardData.pulse}
                activeFilter={activeRiskFilter}
                onSelectFilter={(f) => setActiveRiskFilter(f)}
              />
            </div>
          )}

          {/* Active View Module Rendering */}
          {isLoading && !dashboardData ? (
            <DashboardSkeleton />
          ) : (
            <>
              {activeTab === 'overview' && dashboardData && (
                <OverviewView 
                  data={dashboardData}
                  activeFilter={activeRiskFilter}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectDistrict={(dist) => {
                    setSelectedDistrict(dist);
                    setActiveTab('districts');
                  }}
                />
              )}

              {activeTab === 'heatmap' && (
                <HeatmapView 
                  districts={districts}
                  activeFilter={activeRiskFilter}
                  selectedDistrict={selectedDistrict}
                  onSelectDistrict={handleSelectDistrict}
                />
              )}

              {activeTab === 'districts' && (
                <DistrictsView 
                  districts={districts}
                  activeFilter={activeRiskFilter}
                  onFilterChange={(f) => setActiveRiskFilter(f)}
                  selectedDistrict={selectedDistrict}
                  onSelectDistrict={handleSelectDistrict}
                />
              )}

              {activeTab === 'imd' && (
                <ImdFeedSection />
              )}

              {activeTab === 'rag' && (
                <RagAdminSection />
              )}

              {activeTab === 'resources' && (
                <ResourceManagementSection />
              )}

              {activeTab === 'alerts' && (
                <AlertsView 
                  alerts={dashboardData?.recent_alerts || []}
                  activeFilter={activeRiskFilter}
                  onFilterChange={(f) => setActiveRiskFilter(f)}
                  onRefreshAlerts={loadData}
                />
              )}

              {activeTab === 'reports' && dashboardData && (
                <ReportsView 
                  data={dashboardData}
                  districts={districts}
                />
              )}
            </>
          )}

        </main>
      </div>

    </div>
  );
}
