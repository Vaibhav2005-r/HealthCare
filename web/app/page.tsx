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
  FALLBACK_DISTRICTS,
  FALLBACK_DASHBOARD 
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
import { useSupabaseRealtime } from '@/lib/supabase';
import { Zap } from 'lucide-react';

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
  const [dashboardData, setDashboardData] = useState<LiveDashboardData>(FALLBACK_DASHBOARD);
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

  // Direct Supabase Postgres CDC Realtime Subscription
  const { isConnected: isSupabaseRealtimeConnected } = useSupabaseRealtime({
    onDistrictChange: () => {
      loadData();
    },
    onAlertChange: () => {
      loadData();
    },
    onCaseReportChange: () => {
      loadData();
    },
    onInventoryChange: () => {
      loadData();
    }
  });

  useEffect(() => {
    loadData();

    // 1. WebSocket Real-time Live Stream (FastAPI)
    let socket: WebSocket | null = null;
    try {
      const rawApiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
      const wsUrl = rawApiBase
        ? `${rawApiBase.replace(/^http/, 'ws').replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/ws/telemetry`
        : 'ws://localhost:8001/ws/telemetry';
      socket = new WebSocket(wsUrl);
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
            
            {/* Supabase Realtime Live Indicator */}
            <div 
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                isSupabaseRealtimeConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={isSupabaseRealtimeConnected ? 'Connected to live Supabase Postgres CDC stream' : 'Connecting to Supabase...'}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseRealtimeConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
              <Zap className={`w-3.5 h-3.5 ${isSupabaseRealtimeConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>{isSupabaseRealtimeConnected ? 'Supabase Realtime' : 'Syncing DB...'}</span>
            </div>

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
