import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://orjszwyrfluvvkqlkvzq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface SupabaseRealtimeHandlers {
  onDistrictChange?: (payload: any) => void;
  onAlertChange?: (payload: any) => void;
  onCaseReportChange?: (payload: any) => void;
  onInventoryChange?: (payload: any) => void;
  onAuditLogChange?: (payload: any) => void;
}

/**
 * Hook to subscribe to live Supabase Postgres CDC (Change Data Capture) changes in real-time.
 */
export function useSupabaseRealtime(handlers?: SupabaseRealtimeHandlers) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [lastEventSummary, setLastEventSummary] = useState<string>('Listening for live Supabase changes...');

  useEffect(() => {
    // Single consolidated channel for all core epidemiological tables
    const channel = supabase
      .channel('schema-db-changes')
      
      // 1. Listen to District Telemetry & LSTM Risk Updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'districts' },
        (payload: any) => {
          setLastEventTime(new Date());
          const newRow = payload.new || {};
          const oldRow = payload.old || {};
          const name = newRow.name || oldRow.name || 'District';
          const riskLevel = newRow.risk_level;
          const riskScore = newRow.risk_score;
          
          setLastEventSummary(`District ${name} updated (Risk: ${riskLevel || 'N/A'}, Score: ${riskScore ?? 'N/A'})`);
          
          if (payload.eventType === 'UPDATE' && riskLevel === 'CRITICAL' && oldRow.risk_level !== 'CRITICAL') {
            toast.error(`⚠️ Outbreak Escalation: ${name} escalated to CRITICAL!`, {
              description: `Risk Score: ${riskScore} | Active Cases: ${newRow.active_cases}`,
            });
          }
          handlers?.onDistrictChange?.(payload);
        }
      )
      
      // 2. Listen to Outbreak Alert Lifecycle Changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload: any) => {
          setLastEventTime(new Date());
          const newRow = payload.new || {};
          const village = newRow.target_village || newRow.district || 'Region';
          const status = newRow.status;
          
          if (payload.eventType === 'INSERT') {
            toast.warning(`🚨 New Outbreak Alert: ${village}`, {
              description: `${newRow.disease} • Severity: ${newRow.severity}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            toast.info(`Alert ${newRow.alert_id || ''} Status: ${status}`, {
              description: `Target: ${village} (${newRow.district})`,
            });
          }
          handlers?.onAlertChange?.(payload);
        }
      )

      // 3. Listen to Frontline ASHA Case Intake Reports
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'case_reports' },
        (payload: any) => {
          setLastEventTime(new Date());
          const newRow = payload.new || {};
          const village = newRow.village_name || 'Village';
          const district = newRow.district || 'District';
          const risk = newRow.risk_level || 'ASSESSED';
          
          toast.success(`📍 New ASHA Case Report: ${village}, ${district}`, {
            description: `Symptoms: ${Array.isArray(newRow.symptoms) ? newRow.symptoms.join(', ') : 'Reported'} • Triage: ${risk}`,
          });
          handlers?.onCaseReportChange?.(payload);
        }
      )

      // 4. Listen to Health Center Buffer Stock Inventory
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'health_center_inventory' },
        (payload: any) => {
          setLastEventTime(new Date());
          const newRow = payload.new || {};
          const center = newRow.center_name || 'PHC';
          const item = newRow.item || 'Medical Supply';
          const stock = newRow.stock;
          const status = newRow.status;
          
          if (status === 'CRITICAL') {
            toast.error(`📦 Critical Deficit: ${center}`, {
              description: `${item} stock depleted to ${stock} units!`,
            });
          }
          handlers?.onInventoryChange?.(payload);
        }
      )

      // 5. Listen to CMO / DHO Audit Trail Logs
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alert_audit_logs' },
        (payload: any) => {
          setLastEventTime(new Date());
          const newRow = payload.new || {};
          const action = newRow.action || 'Intervention';
          const officer = newRow.officer_name || 'Officer';
          toast.info(`🛡️ Officer Action Logged: ${action}`, {
            description: `By: ${officer} (${newRow.officer_role || 'CMO'})`,
          });
          handlers?.onAuditLogChange?.(payload);
        }
      )

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('⚡ Connected to live Supabase Postgres Realtime CDC stream');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isConnected, lastEventTime, lastEventSummary };
}
