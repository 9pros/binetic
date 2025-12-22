import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, HeartPulse, Download, Upload, Search, Activity, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';
interface DiscoveryToolbarProps {
  onRefreshAll: () => void;
}
export function DiscoveryToolbar({ onRefreshAll }: DiscoveryToolbarProps) {
  const [isScanning, setIsScanning] = useState(false);
  const handleGlobalDiscovery = () => {
    setIsScanning(true);
    toast.promise(new Promise(r => setTimeout(r, 2500)), {
      loading: 'Sweeping infrastructure for new capabilities...',
      success: 'Discovery Complete: 3 new nodes identified.',
      error: 'Discovery Fault: Connection loss in Cluster C',
      finally: () => setIsScanning(false)
    });
    onRefreshAll();
  };
  const handleHealthCheck = () => {
    toast.info('Initiating bulk health check...');
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="mr-4 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
        <div className={`h-2 w-2 rounded-full ${isScanning ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'}`} />
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
          {isScanning ? 'Scanning Cluster...' : 'Systems Optimal'}
        </span>
      </div>
      <Button 
        onClick={handleGlobalDiscovery} 
        disabled={isScanning}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-600/20"
      >
        <Sparkles className={`mr-2 h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
        Discover All
      </Button>
      <Button variant="outline" className="h-11 border-white/10 bg-white/5 text-slate-400 hover:text-white" onClick={handleHealthCheck}>
        <HeartPulse className="mr-2 h-4 w-4" /> Validate
      </Button>
      <div className="h-6 w-[1px] bg-white/10 mx-2" />
      <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-500 hover:text-white">
        <Download size={18} />
      </Button>
      <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-500 hover:text-white">
        <Upload size={18} />
      </Button>
    </div>
  );
}