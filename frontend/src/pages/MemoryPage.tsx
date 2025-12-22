import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, HealthGauge } from '@/components/dashboard/StatsWidgets';
import { Database, Zap, RefreshCw, Layers, HardDrive, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MemoryCluster } from '@shared/types';
import { toast } from 'sonner';
import { useMemoryClusters, useDefragMemory } from '@/hooks/use-nexus-api';

export default function MemoryPage() {
  const { data: clusters = [], isLoading } = useMemoryClusters();
  const defragMemory = useDefragMemory();
  const [search, setSearch] = useState('');

  const handleDefrag = () => {
    defragMemory.mutate();
  };

  const filteredClusters = clusters.filter(c => 
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black text-white tracking-tight">Cognitive Memory</h1>
            <p className="text-slate-400 mt-2 text-lg">Managing the AGI's distributed semantic and episodic storage clusters.</p>
          </div>
          <Button
            onClick={handleDefrag}
            disabled={defragMemory.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${defragMemory.isPending ? 'animate-spin' : ''}`} />
            Defragment Clusters
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard 
            label="Total Patterns" 
            value={clusters.length > 0 ? `${(clusters.length * 1.05).toFixed(1)}M` : '0'} 
            subValue={`Across ${clusters.length} nodes`} 
            icon={Layers} 
            color="indigo" 
          />
          <StatsCard label="Compression" value="14.1:1" subValue="LZO-Neural Optimized" icon={HardDrive} color="emerald" trend="up" trendValue="+0.4" />
          <StatsCard label="Retrieval" value="12ms" subValue="Global Average Latency" icon={Zap} color="amber" trend="down" trendValue="-2ms" />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <Input
            placeholder="Filter by memory label or tag..."
            className="bg-white/5 border-white/10 text-white pl-10 h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 glass-dark border border-white/5 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredClusters.map(cluster => (
              <Card key={cluster.id} className="glass-dark border-white/5 hover:border-indigo-500/30 transition-all group overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-mono font-bold text-indigo-400">{cluster.id}</div>
                    <div className={`h-2 w-2 rounded-full ${cluster.stability > 90 ? 'bg-emerald-500' : cluster.stability > 60 ? 'bg-amber-500' : 'bg-rose-500'} shadow-[0_0_8px_currentColor]`} />
                  </div>
                  <CardTitle className="text-white text-base truncate">{cluster.label}</CardTitle>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{cluster.type}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <HealthGauge label="Cluster Stability" value={cluster.stability} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Size: {cluster.dataSize}</span>
                    <span>Acc: {cluster.lastAccess}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {cluster.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px] font-bold uppercase">#{tag}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredClusters.length === 0 && !isLoading && (
              <div className="col-span-full h-64 glass-dark border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                <Database className="h-12 w-12 mb-4 opacity-10" />
                <p className="font-bold text-white">No Memory Clusters Found</p>
                <p className="text-sm">Adjust your search or initialize new memory banks.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
