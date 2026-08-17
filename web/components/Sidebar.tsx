'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Building2, 
  AlertOctagon, 
  FileText, 
  Shield, 
  Activity, 
  Radio, 
  CheckCircle2, 
  ChevronRight,
  Database,
  Cpu,
  UserCheck,
  Sparkles,
  Package
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export type NavTab = 'overview' | 'heatmap' | 'districts' | 'rag' | 'resources' | 'alerts' | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unacknowledgedAlertsCount?: number;
}

export function Sidebar({ activeTab, onTabChange, unacknowledgedAlertsCount = 2 }: SidebarProps) {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: t('nav.overview'),
      labelHi: '', // Handled dynamically in translations
      icon: LayoutDashboard,
      desc: t('nav.overview.desc')
    },
    {
      id: 'heatmap' as NavTab,
      label: t('nav.heatmap'),
      labelHi: '',
      icon: MapIcon,
      desc: t('nav.heatmap.desc')
    },
    {
      id: 'districts' as NavTab,
      label: t('nav.districts'),
      labelHi: '',
      icon: Building2,
      desc: t('nav.districts.desc')
    },
    {
      id: 'rag' as NavTab,
      label: t('nav.rag'),
      labelHi: '',
      icon: Sparkles,
      desc: t('nav.rag.desc')
    },
    {
      id: 'resources' as NavTab,
      label: t('nav.resources'),
      labelHi: '',
      icon: Package,
      desc: t('nav.resources.desc')
    },
    {
      id: 'alerts' as NavTab,
      label: t('nav.alerts'),
      labelHi: '',
      icon: AlertOctagon,
      desc: t('nav.alerts.desc'),
      badge: unacknowledgedAlertsCount
    },
    {
      id: 'reports' as NavTab,
      label: t('nav.reports'),
      labelHi: '',
      icon: FileText,
      desc: t('nav.reports.desc')
    }
  ];

  return (
    <aside className="w-72 bg-white border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E2E8F0] bg-[#F6F5F2]/60">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#C2255C] text-white flex items-center justify-center shadow-md shadow-[#C2255C]/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1D2321] tracking-tight flex items-center gap-1.5">
              {t('brand.title')}
            </h1>
            <p className="text-[11px] font-bold text-[#C2255C] tracking-wide uppercase">
              {t('brand.subtitle')}
            </p>
          </div>
        </div>

        {/* Dual Language Tagline */}
        <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]/80">
          <p className="text-[11px] font-semibold text-[#1D2321] leading-tight">
            &ldquo;{t('brand.tagline')}&rdquo;
          </p>
          <p className="text-[11px] font-medium text-[#5B6663] mt-0.5 font-sans leading-tight">
            &ldquo;{t('brand.tagline2')}&rdquo;
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Command center navigation">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#5B6663]">
          Surveillance Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all group ${
                isActive
                  ? 'bg-[#F6F5F2] text-[#C2255C] font-bold border border-[#C2255C]/20 shadow-sm'
                  : 'text-[#1D2321] hover:bg-[#F6F5F2]/80 hover:text-[#1D2321]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-[#C2255C] text-white' : 'bg-[#EAE8E3] text-[#5B6663] group-hover:text-[#1D2321]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <div className="text-[10px] font-normal text-[#5B6663]">{item.desc}</div>
                </div>
              </div>

              {item.badge ? (
                <span className="bg-[#C6362C] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 text-[#5B6663] transition-transform ${isActive ? 'translate-x-0.5 text-[#C2255C]' : 'opacity-0 group-hover:opacity-100'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Jurisdiction & Officer Context */}
      <div className="p-3 mx-3 mb-3 bg-[#F6F5F2] rounded-xl border border-[#E2E8F0]">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#5B6663] uppercase tracking-wider mb-1.5">
          <span>Active Command Context</span>
          <span className="text-[#146356] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#146356] animate-ping" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1D2321] text-white flex items-center justify-center text-xs font-bold font-mono">
            DHO
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1D2321] truncate">Dr. S. Kulkarni, CMO</p>
            <p className="text-[10px] text-[#5B6663] truncate">Maharashtra State HQ</p>
          </div>
        </div>
      </div>

      {/* Live System Telemetry Status Bar */}
      <div className="p-3 border-t border-[#E2E8F0] bg-white text-[11px] space-y-1.5">
        <div className="text-[10px] font-bold text-[#5B6663] uppercase tracking-wider">
          System Infrastructure
        </div>
        <div className="flex items-center justify-between text-[#5B6663]">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-[#146356]" /> DL Spatial Engine
          </span>
          <span className="text-[10px] font-mono font-bold text-[#146356]">ONLINE</span>
        </div>
        <div className="flex items-center justify-between text-[#5B6663]">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#146356]" /> Qdrant & Supabase
          </span>
          <span className="text-[10px] font-mono font-bold text-[#146356]">SYNCED</span>
        </div>
      </div>
    </aside>
  );
}
