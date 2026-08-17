'use client';

import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Sparkles, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Send, 
  Plus, 
  Filter, 
  Building2, 
  ShieldAlert,
  Bot,
  Truck,
  FileCheck
} from 'lucide-react';
import { AlertItem, triggerSOS } from '@/lib/api';
import { RiskFilterType } from '../RiskPulseBar';
import { toast } from 'sonner';

interface AlertsViewProps {
  alerts: AlertItem[];
  activeFilter: RiskFilterType;
  onFilterChange: (filter: RiskFilterType) => void;
  onRefreshAlerts: () => void;
}

export function AlertsView({ alerts, activeFilter, onFilterChange, onRefreshAlerts }: AlertsViewProps) {
  const [selectedType, setSelectedType] = useState<'ALL' | 'SOS_TRIGGER' | 'ML_SPIKE_PREDICTION'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'UNACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [localAlerts, setLocalAlerts] = useState<AlertItem[]>(alerts);

  // Filter alerts
  const filteredAlerts = localAlerts.filter((alt) => {
    if (activeFilter !== 'ALL' && alt.severity !== activeFilter) return false;
    if (selectedType !== 'ALL' && alt.type !== selectedType) return false;
    if (selectedStatus !== 'ALL' && alt.status !== selectedStatus) return false;
    return true;
  });

  const handleAcknowledge = (id: string, district: string) => {
    setLocalAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
    toast.success(`Alert for ${district} marked as Acknowledged.`);
  };

  const handleDispatchKit = (district: string) => {
    toast.success(`Hydration & Containment Kit dispatched to ${district} PHC.`);
  };

  const handleSimulateSOS = async () => {
    setIsSimulating(true);
    try {
      const res = await triggerSOS({
        worker_id: 'ASHA-Haveli-42',
        district: 'Pune',
        cases: 6,
        severity: 'CRITICAL'
      });
      toast.error('LIVE SOS RECEIVED: 6 severe diarrhea cases flagged in Pune!', {
        duration: 5000,
        icon: '🚨'
      });
      if (res.alert) {
        setLocalAlerts(prev => [res.alert, ...prev]);
      }
      onRefreshAlerts();
    } catch (e) {
      toast.error('Simulation error');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Emergency Queue & Live Action */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C6362C]/10 text-[#C6362C] flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1D2321] flex items-center gap-2">
                Emergency Alert & Outbreak Trigger Feed
              </h2>
              <p className="text-xs text-[#5B6663]">
                Aggregated LLM natural-language briefs (NVIDIA Llama 3.1) and field SOS cluster triggers
              </p>
            </div>
          </div>
        </div>

        {/* Live Simulation Action (for demonstration & verification) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateSOS}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C6362C] hover:bg-[#A82A22] text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            {isSimulating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            )}
            <span>Simulate Mobile App SOS Trigger</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#5B6663] uppercase text-[10px] mr-1">Alert Source:</span>
          
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedType === 'ALL'
                ? 'bg-[#1D2321] text-white'
                : 'bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#5B6663]'
            }`}
          >
            All Sources ({localAlerts.length})
          </button>

          <button
            onClick={() => setSelectedType('SOS_TRIGGER')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedType === 'SOS_TRIGGER'
                ? 'bg-[#C6362C] text-white'
                : 'bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#C6362C]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Field Worker SOS ({localAlerts.filter(a => a.type === 'SOS_TRIGGER').length})</span>
          </button>

          <button
            onClick={() => setSelectedType('ML_SPIKE_PREDICTION')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedType === 'ML_SPIKE_PREDICTION'
                ? 'bg-[#E8901A] text-[#1D2321]'
                : 'bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#E8901A]" />
            <span>AI Spatiotemporal Spike ({localAlerts.filter(a => a.type === 'ML_SPIKE_PREDICTION').length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[#5B6663] uppercase text-[10px]">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-[#F6F5F2] border border-[#E2E8F0] text-xs font-semibold px-3 py-1.5 rounded-lg text-[#1D2321] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNACKNOWLEDGED">Unacknowledged Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>
        </div>
      </div>

      {/* Chronological Alerts Stream */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center text-[#5B6663]">
            <CheckCircle2 className="w-8 h-8 text-[#146356] mx-auto mb-2 opacity-80" />
            <p className="font-bold text-sm text-[#1D2321]">No Active Alerts</p>
            <p className="text-xs text-[#5B6663] mt-1">No alerts match the selected risk or source criteria.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'border-l-4 border-l-[#8B0000] border-[#E2E8F0]'
                  : alert.severity === 'HIGH'
                  ? 'border-l-4 border-l-[#C6362C] border-[#E2E8F0]'
                  : 'border-l-4 border-l-[#E8901A] border-[#E2E8F0]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Alert Body */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#F6F5F2] text-[#5B6663] border border-[#E2E8F0]">
                      {alert.id}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      alert.severity === 'CRITICAL' ? 'bg-[#8B0000] text-white animate-pulse' :
                      alert.severity === 'HIGH' ? 'bg-[#C6362C] text-white' :
                      alert.severity === 'MODERATE' ? 'bg-[#E8901A] text-[#1D2321]' :
                      'bg-[#146356] text-white'
                    }`}>
                      {alert.severity} RISK
                    </span>

                    <span className="text-sm font-bold text-[#1D2321] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#5B6663]" />
                      {alert.district}, {alert.state}
                    </span>

                    <span className="text-xs text-[#5B6663]">•</span>

                    <span className="text-xs text-[#5B6663] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {alert.timestamp}
                    </span>
                  </div>

                  {/* Plain Language Summary / LLM Brief */}
                  <div className="p-3.5 bg-[#F6F5F2] rounded-lg border border-[#E2E8F0] text-xs text-[#1D2321] leading-relaxed">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C2255C] uppercase tracking-wider mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{alert.type === 'SOS_TRIGGER' ? 'FIELD SOS OBSERVATION' : 'NVIDIA LLAMA 3.1 EPIDEMIOLOGICAL BRIEF'}</span>
                    </div>
                    <p className="font-medium text-[#1D2321]">
                      {alert.summary}
                    </p>
                  </div>

                  {/* Worker Role Context (No PII) */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#5B6663]">
                    <span>Source Role: <strong>{alert.worker_role}</strong></span>
                    <span>Cases Involved: <strong className="font-mono">{alert.cases_count} patients</strong></span>
                    <span>AI Risk Score: <strong className="font-mono">{(alert.risk_score * 100).toFixed(0)}%</strong></span>
                    <span>Status: <strong className={alert.status === 'UNACKNOWLEDGED' ? 'text-[#C6362C]' : 'text-[#146356]'}>{alert.status}</strong></span>
                  </div>
                </div>

                {/* Operations Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 min-w-[190px] self-end md:self-start">
                  {alert.status === 'UNACKNOWLEDGED' ? (
                    <button
                      onClick={() => handleAcknowledge(alert.id, alert.district)}
                      className="w-full py-2 bg-[#1D2321] hover:bg-[#333D3A] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-emerald-50 border border-emerald-200 text-[#146356] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleDispatchKit(alert.district)}
                    className="w-full py-2 bg-white hover:bg-[#F6F5F2] text-[#C2255C] border border-[#E2E8F0] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-[#C2255C]" />
                    <span>Dispatch Response Kit</span>
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
