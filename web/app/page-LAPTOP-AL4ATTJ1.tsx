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
  Search 
} from 'lucide-react';
import RagAdminSection from '@/components/features/RagAdminSection';
import ResourceManagementSection from '@/components/features/ResourceManagementSection';
import { toast } from 'sonner';
import { useLanguage, Language } from '@/lib/i18n';

export default function ArogyaPrahariDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [activeRiskFilter, setActiveRiskFilter] = useState<RiskFilterType>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [dashboardData, setDashboardData] = useState<LiveDashboardData>({
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
  const [activeUtilityModal, setActiveUtilityModal] = useState<'NONE' | 'RAG' | 'RESOURCES'>('NONE');
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
            // Update live alerts stream immediately
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
            
            {/* Language Switcher */}
            <div className="flex items-center bg-[#F6F5F2] border border-[#E2E8F0] rounded-lg p-0.5 mr-2">
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
            
            {/* RAG Query Helper */}
            <button
              onClick={() => setActiveUtilityModal(activeUtilityModal === 'RAG' ? 'NONE' : 'RAG')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeUtilityModal === 'RAG' 
                  ? 'bg-[#C2255C] text-white border-[#C2255C]' 
                  : 'bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border-[#E2E8F0]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{t('header.rag')}</span>
            </button>

            {/* PHC Resource Management */}
            <button
              onClick={() => setActiveUtilityModal(activeUtilityModal === 'RESOURCES' ? 'NONE' : 'RESOURCES')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeUtilityModal === 'RESOURCES' 
                  ? 'bg-[#146356] text-white border-[#146356]' 
                  : 'bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border-[#E2E8F0]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{t('header.phc')}</span>
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
              <span className="w-2 h-2 rounded-full bg-[#146356] animate-pulse" />
              <span className="hidden sm:inline">DHO ONLINE</span>
            </div>
          </div>
        </header>

        {/* Utility Modal: RAG or Resource Management Drawer */}
        {activeUtilityModal !== 'NONE' && (
          <div className="bg-white border-b border-[#E2E8F0] p-6 shadow-md animate-in slide-in-from-top-4 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-sm text-[#1D2321] uppercase tracking-wider">
                {activeUtilityModal === 'RAG' && 'National IDSP Medical Guidelines RAG Engine (Qdrant & NVIDIA Llama 3.1)'}
                {activeUtilityModal === 'RESOURCES' && 'Primary Health Centre (PHC) Medical Supplies Buffer'}
              </h3>
              <button 
                onClick={() => setActiveUtilityModal('NONE')}
                className="text-xs font-bold text-[#5B6663] hover:text-[#1D2321] px-2 py-1 bg-[#F6F5F2] rounded"
              >
                Close Panel
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {activeUtilityModal === 'RAG' && <RagAdminSection />}
              {activeUtilityModal === 'RESOURCES' && <ResourceManagementSection />}
            </div>
          </div>
        )}

        {/* Main Work Area */}
        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Pinned Signature Component: Risk Pulse Bar (Active across all views) */}
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
            <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="w-8 h-8 border-3 border-[#C2255C] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-[#1D2321]">Loading District Outbreak Intelligence...</p>
              <p className="text-[11px] text-[#5B6663]">Aggregating ASHA case reports, Qdrant vectors & LSTM forecast</p>
            </div>
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
