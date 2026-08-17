'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, Box, Send, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchInventory } from '@/lib/api';
import { toast } from 'sonner';

interface SupplyItem {
  center_name: string;
  district: string;
  item: string;
  stock: number;
  status: 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL';
  bed_capacity?: number;
  on_duty_doctors?: number;
}

interface CenterGroup {
  center_name: string;
  district: string;
  status: 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL';
  bed_capacity: number;
  on_duty_doctors: number;
  supplies: SupplyItem[];
}

export default function ResourceManagementPage() {
  const [centers, setCenters] = useState<CenterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastingTo, setBroadcastingTo] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const items: SupplyItem[] = await fetchInventory();
      
      // Group supplies by health center
      const groupMap = new Map<string, CenterGroup>();
      for (const item of items) {
        const key = `${item.center_name}-${item.district}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            center_name: item.center_name,
            district: item.district,
            status: item.status,
            bed_capacity: item.bed_capacity || 25,
            on_duty_doctors: item.on_duty_doctors || 2,
            supplies: []
          });
        }
        const group = groupMap.get(key)!;
        group.supplies.push(item);
        if (item.status === 'CRITICAL') group.status = 'CRITICAL';
        else if (item.status === 'LOW_STOCK' && group.status !== 'CRITICAL') group.status = 'LOW_STOCK';
      }

      setCenters(Array.from(groupMap.values()));
    } catch (err) {
      console.error('Failed to load PHC inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = async (centerName: string, district: string) => {
    setBroadcastingTo(centerName);
    try {
      const res = await fetch('http://localhost:8001/api/v1/resources/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_village: `${centerName} (${district})`,
          message: 'CRITICAL SUPPLY DEFICIT: Emergency supply kits and medical team dispatched.'
        })
      });
      const data = await res.json();
      toast.success(`Emergency alert dispatched to ${centerName} medical staff!`, {
        description: data.detail || 'WhatsApp / SMS broadcast queued via Twilio.',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });
    } catch (err) {
      toast.error('Failed to trigger broadcast');
    } finally {
      setBroadcastingTo(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">PHC Buffer Stock & Resource Dispatch</h1>
          <p className="text-sm text-slate-500 mt-1">Live tracking of essential medical inventory across Primary Health Centers in Maharashtra.</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stock
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map(center => {
            const isCritical = center.status === 'CRITICAL';
            const isLow = center.status === 'LOW_STOCK';
            const badgeBg = isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-600';
            const cardHeaderBg = isCritical ? 'bg-red-50' : isLow ? 'bg-amber-50' : 'bg-emerald-50';

            return (
              <div key={`${center.center_name}-${center.district}`} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${cardHeaderBg}`}>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{center.center_name}</h3>
                    <span className="text-xs text-slate-500 font-medium">{center.district} District</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${badgeBg}`}>
                    {center.status}
                  </span>
                </div>
                
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold pb-2 border-b border-slate-100">
                    <span>Beds: <strong className="text-slate-900 font-mono">{center.bed_capacity}</strong></span>
                    <span>Doctors on Duty: <strong className="text-slate-900 font-mono">{center.on_duty_doctors}</strong></span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {center.supplies.map(sup => {
                      const itemCritical = sup.status === 'CRITICAL' || sup.stock < 40;
                      return (
                        <div key={sup.item} className={`p-2.5 rounded-lg border flex items-center justify-between ${itemCritical ? 'bg-red-50/60 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-2">
                            <Box className={`w-3.5 h-3.5 ${itemCritical ? 'text-red-500' : 'text-slate-400'}`} />
                            <span className="text-xs font-semibold text-slate-700">{sup.item}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold text-sm ${itemCritical ? 'text-red-700' : 'text-slate-800'}`}>{sup.stock} units</span>
                            {itemCritical && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => handleBroadcast(center.center_name, center.district)}
                    disabled={broadcastingTo === center.center_name}
                    className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isCritical || isLow
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm' 
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {broadcastingTo === center.center_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Broadcasting Warning...
                      </div>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {isCritical ? 'Dispatch Emergency Restock Alert' : 'Send PHC Broadcast Alert'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
