'use client';

import React, { useState, useEffect } from 'react';
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
  FileCheck,
  ShieldCheck,
  History,
  UserCheck,
  X,
  FileText,
  Search
} from 'lucide-react';
import { AlertItem, AlertAuditLogItem, triggerSOS, updateAlertStatus, fetchAlertAuditLogs } from '@/lib/api';
import { RiskFilterType } from '../RiskPulseBar';
import { useSupabaseRealtime } from '@/lib/supabase';
import { toast } from 'sonner';

interface AlertsViewProps {
  alerts: AlertItem[];
  activeFilter: RiskFilterType;
  onFilterChange: (filter: RiskFilterType) => void;
  onRefreshAlerts: () => void;
}

function AlertLifecycleStepper({ status }: { status: string }) {
  const steps = [
    { key: 'UNACKNOWLEDGED', label: '1. Detected' },
    { key: 'ACKNOWLEDGED', label: '2. Acknowledged' },
    { key: 'INVESTIGATING', label: '3. Response' },
    { key: 'RESOLVED', label: '4. Resolved' }
  ];

  const getStepIndex = (st: string) => {
    if (st === 'RESOLVED') return 3;
    if (st === 'INVESTIGATING' || st === 'BUFFER_DISPATCHED') return 2;
    if (st === 'ACKNOWLEDGED') return 1;
    return 0;
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="py-2 px-3 bg-[#F6F5F2] border border-[#E2E8F0] rounded-lg my-1">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#5B6663] mb-1.5">
        <span>Incident State Machine</span>
        <span className="font-mono text-[#1D2321]">Stage {currentIndex + 1} of 4: <strong>{status}</strong></span>
      </div>
      <div className="flex items-center gap-1.5">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={step.key}>
              <div className={`flex-1 flex items-center gap-1.5 py-1 px-2 rounded text-[10px] font-bold transition-all ${
                isDone ? 'bg-emerald-100 text-emerald-800' :
                isCurrent ? (status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-[#C2255C] text-white shadow-xs') :
                'bg-white text-[#5B6663] border border-[#E2E8F0]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isDone ? 'bg-emerald-600' :
                  isCurrent ? 'bg-white' :
                  'bg-[#CBD5E1]'
                }`} />
                <span className="truncate">{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <span className={`text-[10px] font-bold ${idx < currentIndex ? 'text-emerald-600' : 'text-[#CBD5E1]'}`}>
                  &rarr;
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function AlertsView({ alerts, activeFilter, onFilterChange, onRefreshAlerts }: AlertsViewProps) {
  const [selectedType, setSelectedType] = useState<'ALL' | 'SOS_TRIGGER' | 'ML_SPIKE_PREDICTION'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'UNACKNOWLEDGED' | 'INVESTIGATING' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [localAlerts, setLocalAlerts] = useState<AlertItem[]>(alerts);

  // Resolution Modal State
  const [resolvingAlert, setResolvingAlert] = useState<AlertItem | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED'>('RESOLVED');
  const [officerName, setOfficerName] = useState('Dr. S. Kulkarni');
  const [officerRole, setOfficerRole] = useState('District Health Officer (DHO) / CMO');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  // Audit Trail History Drawer State
  const [viewingAuditAlert, setViewingAuditAlert] = useState<AlertItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<AlertAuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  // Realtime Supabase CDC Alert Sync
  useSupabaseRealtime({
    onAlertChange: () => {
      onRefreshAlerts();
    },
    onAuditLogChange: () => {
      if (viewingAuditAlert) {
        fetchAlertAuditLogs(viewingAuditAlert.id).then(setAuditLogs).catch(console.error);
      }
    }
  });

  // Filter alerts
  const filteredAlerts = localAlerts.filter((alt) => {
    if (activeFilter !== 'ALL' && alt.severity !== activeFilter) return false;
    if (selectedType !== 'ALL' && alt.type !== selectedType) return false;
    if (selectedStatus !== 'ALL' && alt.status !== selectedStatus) return false;
    return true;
  });

  const handleQuickAcknowledge = async (alert: AlertItem) => {
    try {
      const res = await updateAlertStatus(
        alert.id,
        'ACKNOWLEDGED',
        officerName,
        officerRole,
        `Alert acknowledged by ${officerName} on duty.`
      );
      if (res.alert) {
        setLocalAlerts(prev => prev.map(a => a.id === alert.id ? res.alert! : a));
      } else {
        setLocalAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'ACKNOWLEDGED', acknowledged_by: officerName, acknowledged_at: new Date().toISOString() } : a));
      }
      toast.success(`Alert for ${alert.district} acknowledged with audit log saved.`, {
        description: `Logged by ${officerName} (${officerRole})`
      });
      onRefreshAlerts();
    } catch (e) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleOpenResolveModal = (alert: AlertItem, targetStatus: 'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED' = 'RESOLVED') => {
    setResolvingAlert(alert);
    setResolutionStatus(targetStatus);
    setResolutionNotes(
      targetStatus === 'RESOLVED' 
        ? `Emergency containment verified for ${alert.district}. Deployed IV fluid buffer and rapid response medical team.` 
        : `Active field investigation initiated in ${alert.district} sub-center.`
    );
  };

  const handleConfirmResolution = async () => {
    if (!resolvingAlert) return;
    setIsSubmittingResolution(true);
    try {
      const res = await updateAlertStatus(
        resolvingAlert.id,
        resolutionStatus,
        officerName,
        officerRole,
        resolutionNotes
      );
      
      if (res.alert) {
        setLocalAlerts(prev => prev.map(a => a.id === resolvingAlert.id ? res.alert! : a));
      } else {
        setLocalAlerts(prev => prev.map(a => a.id === resolvingAlert.id ? {
          ...a,
          status: resolutionStatus,
          resolved_at: resolutionStatus === 'RESOLVED' ? new Date().toISOString() : a.resolved_at,
          resolved_by: resolutionStatus === 'RESOLVED' ? officerName : a.resolved_by,
          resolved_by_role: resolutionStatus === 'RESOLVED' ? officerRole : a.resolved_by_role,
          resolution_notes: resolutionStatus === 'RESOLVED' ? resolutionNotes : a.resolution_notes
        } : a));
      }

      toast.success(`Alert ${resolvingAlert.id} marked as ${resolutionStatus}!`, {
        description: `Audit trail saved to Supabase (By: ${officerName}, Role: ${officerRole})`,
        icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />
      });
      
      setResolvingAlert(null);
      onRefreshAlerts();
    } catch (e) {
      toast.error('Failed to record alert status in database');
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleOpenAuditHistory = async (alert: AlertItem) => {
    setViewingAuditAlert(alert);
    setLoadingAudit(true);
    try {
      const logs = await fetchAlertAuditLogs(alert.id);
      setAuditLogs(logs);
    } catch (e) {
      toast.error('Failed to load audit history');
    } finally {
      setLoadingAudit(false);
    }
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

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return 'N/A';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Simulation Trigger */}
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
              <p className="text-xs text-[#5B6663] mt-0.5">
                Verified State Surveillance Incident Queue with Immutable Officer Audit Trails
              </p>
            </div>
          </div>
        </div>

        {/* Live Simulation Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateSOS}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 bg-[#C6362C] hover:bg-[#A82A22] text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
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
            <option value="INVESTIGATING">Investigating Only</option>
            <option value="ACKNOWLEDGED">Acknowledged Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>
        </div>
      </div>

      {/* Chronological Alerts Stream */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center text-[#5B6663]">
            <CheckCircle2 className="w-8 h-8 text-[#146356] mx-auto mb-2 opacity-80" />
            <p className="font-bold text-sm text-[#1D2321]">No Active Alerts</p>
            <p className="text-xs text-[#5B6663] mt-1">No alerts match the selected risk or source criteria.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'RESOLVED';
            const isInvestigating = alert.status === 'INVESTIGATING';
            const isAcknowledged = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
                  isResolved
                    ? 'border-l-4 border-l-emerald-600 border-[#E2E8F0]'
                    : alert.severity === 'CRITICAL'
                    ? 'border-l-4 border-l-[#8B0000] border-[#E2E8F0]'
                    : alert.severity === 'HIGH'
                    ? 'border-l-4 border-l-[#C6362C] border-[#E2E8F0]'
                    : 'border-l-4 border-l-[#E8901A] border-[#E2E8F0]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  
                  {/* Alert Body */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#F6F5F2] text-[#5B6663] border border-[#E2E8F0]">
                        {alert.id}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        isResolved ? 'bg-emerald-600 text-white' :
                        alert.severity === 'CRITICAL' ? 'bg-[#8B0000] text-white animate-pulse' :
                        alert.severity === 'HIGH' ? 'bg-[#C6362C] text-white' :
                        alert.severity === 'MODERATE' ? 'bg-[#E8901A] text-[#1D2321]' :
                        'bg-[#146356] text-white'
                      }`}>
                        {isResolved ? 'RESOLVED' : `${alert.severity} RISK`}
                      </span>

                      <span className="text-sm font-bold text-[#1D2321] flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#5B6663]" />
                        {alert.district}, {alert.state}
                      </span>

                      <span className="text-xs text-[#5B6663]">•</span>

                      <span className="text-xs text-[#5B6663] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>

                    {/* Incident Lifecycle Stepper */}
                    <AlertLifecycleStepper status={alert.status} />

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

                    {/* Worker Role Context */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#5B6663]">
                      <span>Source Role: <strong>{alert.worker_role}</strong></span>
                      <span>Cases Involved: <strong className="font-mono">{alert.cases_count} patients</strong></span>
                      <span>AI Risk Score: <strong className="font-mono">{(alert.risk_score * 100).toFixed(0)}%</strong></span>
                      <span>Status: <strong className={isResolved ? 'text-emerald-700' : isAcknowledged || isInvestigating ? 'text-blue-700' : 'text-[#C6362C]'}>{alert.status}</strong></span>
                    </div>

                    {/* AUDIT TRAIL BADGE: Displayed when resolved or acknowledged */}
                    {isResolved && alert.resolved_at && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>RESOLVED & SIGNED OFF</span>
                          </div>
                          <span className="text-[11px] text-emerald-700 font-mono">
                            {formatTimestamp(alert.resolved_at)}
                          </span>
                        </div>
                        <p className="text-emerald-900 font-medium">
                          Officer: <strong>{alert.resolved_by || 'Dr. S. Kulkarni (CMO)'}</strong>
                          {alert.resolved_by_role && <span className="text-emerald-700 ml-1">({alert.resolved_by_role})</span>}
                        </p>
                        {alert.resolution_notes && (
                          <p className="text-slate-700 text-[11px] bg-white/70 p-2 rounded border border-emerald-100 italic mt-1">
                            &ldquo;{alert.resolution_notes}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {isAcknowledged && alert.acknowledged_at && !isResolved && (
                      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Acknowledged by {alert.acknowledged_by || 'State DHO Command'}</span>
                        </div>
                        <span className="text-[11px] text-blue-700 font-mono">
                          {formatTimestamp(alert.acknowledged_at)}
                        </span>
                      </div>
                    )}

                    {/* Audit History Link */}
                    <div className="pt-1">
                      <button
                        onClick={() => handleOpenAuditHistory(alert)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <History className="w-3 h-3 text-slate-400" />
                        <span>View Immutable Audit History & State Changes</span>
                      </button>
                    </div>
                  </div>

                  {/* Operations Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 min-w-[210px] self-end md:self-start">
                    {alert.status === 'UNACKNOWLEDGED' && (
                      <button
                        onClick={() => handleQuickAcknowledge(alert)}
                        className="w-full py-2 bg-[#1D2321] hover:bg-[#333D3A] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {!isResolved && (
                      <button
                        onClick={() => handleOpenResolveModal(alert, 'RESOLVED')}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Mark as Resolved</span>
                      </button>
                    )}

                    {alert.status === 'UNACKNOWLEDGED' && (
                      <button
                        onClick={() => handleOpenResolveModal(alert, 'INVESTIGATING')}
                        className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Start Investigation</span>
                      </button>
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
            );
          })
        )}
      </div>

      {/* RESOLUTION & AUDIT SIGN-OFF MODAL */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Official Alert Resolution & Audit Sign-Off</h3>
                  <p className="text-xs text-slate-500">Alert #{resolvingAlert.id} — {resolvingAlert.district}, {resolvingAlert.state}</p>
                </div>
              </div>
              <button 
                onClick={() => setResolvingAlert(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">State Target Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="RESOLVED">RESOLVED (Contained / Outbreak Controlled)</option>
                  <option value="INVESTIGATING">INVESTIGATING (Active Field Medical Team Deployed)</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED (DHO Incident Logged)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Officer Name</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none"
                    placeholder="e.g. Dr. S. Kulkarni"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Designation</label>
                  <input
                    type="text"
                    value={officerRole}
                    onChange={(e) => setOfficerRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none"
                    placeholder="e.g. DHO / Chief Medical Officer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Containment Notes / Audit Summary</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  placeholder="Detail the medical intervention, supply deployment, or cluster verification..."
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This action will generate an immutable, timestamped record in Supabase (<code>public.alert_audit_logs</code>) associated with your officer credential.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setResolvingAlert(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                disabled={isSubmittingResolution}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSubmittingResolution ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Sign & Save Audit Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL HISTORY DRAWER / MODAL */}
      {viewingAuditAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">State Audit Trail History</h3>
                  <p className="text-xs text-slate-500">Alert #{viewingAuditAlert.id} — {viewingAuditAlert.district}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingAuditAlert(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingAudit ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Querying Supabase Audit Logs...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <p className="font-bold text-slate-700">Initial Ingestion State</p>
                  <p className="mt-1">No subsequent officer state transitions logged for this alert yet.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        log.new_status === 'RESOLVED' ? 'bg-emerald-600' :
                        log.new_status === 'INVESTIGATING' ? 'bg-amber-500' : 'bg-blue-600'
                      }`} />
                      
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.new_status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                            log.new_status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.previous_status} ➔ {log.new_status}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {formatTimestamp(log.created_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          <span>{log.action_by}</span>
                          <span className="text-slate-500 font-normal">({log.action_role})</span>
                        </div>

                        {log.action_notes && (
                          <p className="text-slate-600 italic text-[11px] bg-white p-2 rounded border border-slate-100">
                            &ldquo;{log.action_notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingAuditAlert(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors"
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
