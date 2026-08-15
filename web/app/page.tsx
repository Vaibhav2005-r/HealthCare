'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Users, Package, FileText, Database, Box } from 'lucide-react';

// Primary Modules
import GisMapSection from '@/components/features/GisMapSection';
import AnalyticsSection from '@/components/features/AnalyticsSection';
import TelemetrySection from '@/components/features/TelemetrySection';

// Secondary Modules
import ResourceManagementSection from '@/components/features/ResourceManagementSection';
import RagAdminSection from '@/components/features/RagAdminSection';
import ReportsSection from '@/components/features/ReportsSection';

type Tab = 'NONE' | 'RESOURCE' | 'RAG' | 'REPORTS';

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('NONE');

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* 1. Header / KPI Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Active Outbreak Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">3</div>
            <p className="text-xs text-slate-500 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Cases This Week</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">+12%</div>
            <p className="text-xs text-slate-500 mt-1">Compared to last week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">High-Risk Districts</CardTitle>
            <Users className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">2</div>
            <p className="text-xs text-slate-500 mt-1">North & Central Districts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Low Stock Alerts</CardTitle>
            <Package className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">14</div>
            <p className="text-xs text-slate-500 mt-1">Essential meds below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Modules Navigation */}
      <div className="flex flex-wrap gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <span className="text-sm font-semibold text-slate-500 self-center mr-2">Admin Modules:</span>
        <Button 
          variant={activeTab === 'RESOURCE' ? 'default' : 'outline'}
          onClick={() => setActiveTab(activeTab === 'RESOURCE' ? 'NONE' : 'RESOURCE')}
          className="gap-2"
        >
          <Box className="w-4 h-4" /> Resource Management
        </Button>
        <Button 
          variant={activeTab === 'RAG' ? 'default' : 'outline'}
          onClick={() => setActiveTab(activeTab === 'RAG' ? 'NONE' : 'RAG')}
          className="gap-2"
        >
          <Database className="w-4 h-4" /> RAG Knowledge Base
        </Button>
        <Button 
          variant={activeTab === 'REPORTS' ? 'default' : 'outline'}
          onClick={() => setActiveTab(activeTab === 'REPORTS' ? 'NONE' : 'REPORTS')}
          className="gap-2"
        >
          <FileText className="w-4 h-4" /> Governance Reports
        </Button>
      </div>

      {/* Secondary Modules Content Area */}
      {activeTab !== 'NONE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'RESOURCE' && 'Resource Management'}
              {activeTab === 'RAG' && 'RAG Knowledge Base'}
              {activeTab === 'REPORTS' && 'Governance Reports'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('NONE')}>Close</Button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {activeTab === 'RESOURCE' && <ResourceManagementSection />}
            {activeTab === 'RAG' && <RagAdminSection />}
            {activeTab === 'REPORTS' && <ReportsSection />}
          </div>
        </div>
      )}

      {/* 2. Primary Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: GIS Map (Takes 2 columns on XL screens) */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200 overflow-hidden h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {/* Note: Map components usually render full height relative to their parent */}
              <div className="h-full scale-[0.98] origin-top">
                <GisMapSection />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Outbreak Analytics */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-200 h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 scale-[0.95] origin-top">
              <AnalyticsSection />
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Telemetry */}
      <div className="w-full">
        <Card className="shadow-sm border-slate-200 min-h-[400px]">
          <div className="p-4 scale-[0.98] origin-top">
            <TelemetrySection />
          </div>
        </Card>
      </div>
      
    </div>
  );
}
