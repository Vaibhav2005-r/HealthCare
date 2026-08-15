'use client';

import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Box, Send, AlertTriangle } from 'lucide-react';
import { riskColors } from '@smarthealth/design-tokens';
import { toast } from 'sonner';

// Mock resource data per PHC
const PHC_DATA = [
  { id: 'phc-1', name: 'Kipeto PHC', status: 'RED', ors: 20, iv: 15, paracetamol: 400 },
  { id: 'phc-2', name: 'Shika PHC', status: 'AMBER', ors: 80, iv: 40, paracetamol: 200 },
  { id: 'phc-3', name: 'Mlima PHC', status: 'GREEN', ors: 300, iv: 150, paracetamol: 1000 },
  { id: 'phc-4', name: 'Ziwa PHC', status: 'GREEN', ors: 250, iv: 120, paracetamol: 850 },
  { id: 'phc-5', name: 'Bonde PHC', status: 'RED', ors: 10, iv: 5, paracetamol: 100 },
];

function StockIndicator({ value, label }: { value: number, label: string }) {
  const isLow = value < 50;
  return (
    <div className={`p-3 rounded-lg border ${isLow ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} flex flex-col`}>
      <span className="text-xs text-slate-500 font-medium mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xl font-bold ${isLow ? 'text-red-700' : 'text-slate-800'}`}>{value}</span>
        {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>
      {isLow && <span className="text-[10px] font-bold text-red-600 mt-1 uppercase">Critically Low</span>}
    </div>
  );
}

export default function ResourceManagementPage() {
  const [broadcastingTo, setBroadcastingTo] = useState<string | null>(null);

  const handleBroadcast = (phcName: string) => {
    setBroadcastingTo(phcName);
    // Simulate network delay
    setTimeout(() => {
      toast.success(`Emergency warning broadcasted successfully to ${phcName} community networks (SMS/WhatsApp).`, {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });
      setBroadcastingTo(null);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="mb-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Resource Allocation & Dispatch</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor critical supplies and dispatch emergency alerts to high-risk zones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {PHC_DATA.map(phc => {
          const isRed = phc.status === 'RED';
          return (
            <div key={phc.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between" 
                   style={{ backgroundColor: isRed ? `${riskColors.red}10` : phc.status === 'AMBER' ? `${riskColors.amber}10` : `${riskColors.green}10` }}>
                <h3 className="font-bold text-slate-800 text-lg">{phc.name}</h3>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: isRed ? riskColors.red : phc.status === 'AMBER' ? riskColors.amber : riskColors.green }}>
                  {phc.status} RISK
                </span>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
                  <Box className="w-4 h-4" />
                  Medical Inventory
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <StockIndicator value={phc.ors} label="ORS Packets" />
                  <StockIndicator value={phc.iv} label="IV Ringer's" />
                  <div className="col-span-2">
                    <StockIndicator value={phc.paracetamol} label="Paracetamol 500mg" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => handleBroadcast(phc.name)}
                  disabled={!isRed || broadcastingTo === phc.name}
                  className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isRed 
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {broadcastingTo === phc.name ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Broadcasting...
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Emergency Warning
                    </>
                  )}
                </button>
                {!isRed && (
                  <p className="text-center text-[10px] text-slate-500 mt-2 font-medium">
                    Broadcast requires RED risk status
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
