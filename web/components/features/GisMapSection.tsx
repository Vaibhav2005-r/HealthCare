import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200">
      <div className="flex flex-col items-center text-slate-500">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm animate-pulse">Initializing GIS Spatial Engine...</p>
      </div>
    </div>
  )
});

export default function GISMapPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">GIS Spatial Map</h1>
        <p className="text-sm text-slate-500 mt-1">
          Predictive outbreak heatmap and real-time health infrastructure monitoring.
        </p>
      </div>
      
      <div className="flex-1 min-h-[600px]">
        <DynamicMap />
      </div>
    </div>
  );
}
