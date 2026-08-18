'use client';

import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Box, 
  Send, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Filter, 
  Building2, 
  Users, 
  BedDouble,
  Radio
} from 'lucide-react';
import { fetchInventory } from '@/lib/api';
import { useSupabaseRealtime } from '@/lib/supabase';
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
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'LOW_STOCK' | 'HEALTHY'>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

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

  // Realtime Supabase CDC Inventory Sync
  useSupabaseRealtime({
    onInventoryChange: () => {
      loadData();
    }
  });

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

  const filteredCenters = centers.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (selectedDistrict !== 'ALL' && c.district !== selectedDistrict) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.center_name.toLowerCase().includes(q);
      const matchDistrict = c.district.toLowerCase().includes(q);
      const matchItem = c.supplies.some(s => s.item.toLowerCase().includes(q));
      if (!matchName && !matchDistrict && !matchItem) return false;
    }
    return true;
  });

  const criticalCount = centers.filter(c => c.status === 'CRITICAL').length;
  const lowStockCount = centers.filter(c => c.status === 'LOW_STOCK').length;
  const healthyCount = centers.filter(c => c.status === 'HEALTHY').length;
  const uniqueDistricts = Array.from(new Set(centers.map(c => c.district))).sort();

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              Live Supabase Inventory Stream
            </span>
            <span className="text-xs text-[#5B6663]">•</span>
            <span className="text-xs font-mono text-[#5B6663]">Directorate of Health Services, Maharashtra</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#1D2321] mt-1.5 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#146356]" />
            PHC Buffer Stock & Medical Resource Logistics
          </h1>
          <p className="text-xs text-[#5B6663] mt-0.5">
            Real-time tracking of essential oral rehydration, antimalarials, test kits, and bed capacities across all 36 Maharashtra districts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              loadData();
              toast.success('Live PHC inventory refreshed from Supabase');
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#F6F5F2] hover:bg-[#EAE8E3] text-[#1D2321] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C2255C]' : ''}`} />
            <span>Refresh Inventory</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5B6663] uppercase tracking-wider">Monitored Facilities</span>
            <div className="text-2xl font-black font-mono text-[#1D2321] mt-1">
              {centers.length || 36} <span className="text-xs font-normal text-[#5B6663]">PHCs/CHCs</span>
            </div>
            <p className="text-[10px] text-[#146356] font-semibold mt-0.5">36 Districts Covered</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5B6663] uppercase tracking-wider">Critical Buffer Deficits</span>
            <div className="text-2xl font-black font-mono text-[#8B0000] mt-1">
              {criticalCount} <span className="text-xs font-normal text-[#5B6663]">Facilities</span>
            </div>
            <p className="text-[10px] text-[#8B0000] font-semibold mt-0.5">Immediate Restock Required</p>
          </div>
          <div className="p-3 bg-red-50 text-[#8B0000] rounded-xl border border-red-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5B6663] uppercase tracking-wider">Low Stock Watchlist</span>
            <div className="text-2xl font-black font-mono text-[#E8901A] mt-1">
              {lowStockCount} <span className="text-xs font-normal text-[#5B6663]">Facilities</span>
            </div>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Under 48h Safe Threshold</p>
          </div>
          <div className="p-3 bg-amber-50 text-[#E8901A] rounded-xl border border-amber-200">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#5B6663] uppercase tracking-wider">Adequate Buffer Stock</span>
            <div className="text-2xl font-black font-mono text-[#146356] mt-1">
              {healthyCount} <span className="text-xs font-normal text-[#5B6663]">Facilities</span>
            </div>
            <p className="text-[10px] text-[#146356] font-semibold mt-0.5">Full Contingency Active</p>
          </div>
          <div className="p-3 bg-emerald-50 text-[#146356] rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-[#5B6663] uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#C2255C]" /> Status:
          </span>
          {(['ALL', 'CRITICAL', 'LOW_STOCK', 'HEALTHY'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                statusFilter === st
                  ? st === 'CRITICAL' ? 'bg-[#8B0000] text-white' :
                    st === 'LOW_STOCK' ? 'bg-[#E8901A] text-white' :
                    st === 'HEALTHY' ? 'bg-[#146356] text-white' :
                    'bg-[#1D2321] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#5B6663] hover:bg-[#EAE8E3]'
              }`}
            >
              {st === 'ALL' ? 'All 36 Facilities' : st.replace('_', ' ')}
            </button>
          ))}

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="ml-2 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#1D2321] outline-none"
          >
            <option value="ALL">All 36 Districts</option>
            {uniqueDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5B6663]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility, medicine, or district..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F6F5F2] border border-[#E2E8F0] rounded-lg text-xs outline-none focus:border-[#C2255C] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Facilities Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-6 h-64 animate-pulse"></div>
          ))}
        </div>
      ) : filteredCenters.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center text-[#5B6663]">
          No health centers match the selected filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCenters.map(center => {
            const isCritical = center.status === 'CRITICAL';
            const isLow = center.status === 'LOW_STOCK';
            const badgeBg = isCritical ? 'bg-[#8B0000]' : isLow ? 'bg-[#E8901A]' : 'bg-[#146356]';
            const cardHeaderBg = isCritical ? 'bg-red-50/70 border-red-200' : isLow ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/50 border-emerald-200';

            return (
              <div key={`${center.center_name}-${center.district}`} className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className={`p-4 border-b flex items-center justify-between ${cardHeaderBg}`}>
                  <div>
                    <h3 className="font-bold text-[#1D2321] text-base leading-snug">{center.center_name}</h3>
                    <span className="text-xs text-[#5B6663] font-medium">{center.district} District</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-white ${badgeBg}`}>
                    {center.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-[#5B6663] font-semibold pb-2 border-b border-[#E2E8F0]">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-[#146356]" />
                      Beds: <strong className="text-[#1D2321] font-mono">{center.bed_capacity}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#1A5F7A]" />
                      Doctors: <strong className="text-[#1D2321] font-mono">{center.on_duty_doctors}</strong>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {center.supplies.map(sup => {
                      const itemCritical = sup.status === 'CRITICAL' || sup.stock < 40;
                      const itemLow = sup.status === 'LOW_STOCK';
                      return (
                        <div key={sup.item} className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                          itemCritical 
                            ? 'bg-red-50/60 border-red-200 text-red-950' 
                            : itemLow 
                              ? 'bg-amber-50/50 border-amber-200 text-amber-950' 
                              : 'bg-[#F6F5F2] border-[#E2E8F0] text-[#1D2321]'
                        }`}>
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Box className={`w-3.5 h-3.5 shrink-0 ${itemCritical ? 'text-[#8B0000]' : itemLow ? 'text-[#E8901A]' : 'text-[#5B6663]'}`} />
                            <span className="font-medium truncate">{sup.item}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`font-mono font-bold ${itemCritical ? 'text-[#8B0000]' : itemLow ? 'text-[#E8901A]' : 'text-[#1D2321]'}`}>
                              {sup.stock} units
                            </span>
                            {itemCritical && <AlertTriangle className="w-3.5 h-3.5 text-[#8B0000]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-[#F6F5F2] border-t border-[#E2E8F0]">
                  <button
                    onClick={() => handleBroadcast(center.center_name, center.district)}
                    disabled={broadcastingTo === center.center_name}
                    className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                      isCritical || isLow
                        ? 'bg-[#C2255C] hover:bg-[#A61E4D] text-white' 
                        : 'bg-[#146356] hover:bg-[#0E4B41] text-white'
                    }`}
                  >
                    {broadcastingTo === center.center_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Broadcasting Restock Order...
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
