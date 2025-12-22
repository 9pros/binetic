import React, { useState, useMemo } from 'react';
import { DiscoveryCapability, DiscoverySource } from '@shared/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, Activity, Zap, Box, Terminal, Clock } from 'lucide-react';
import { CapabilityDetails } from './CapabilityDetails';
interface CapabilityGridProps {
  capabilities: DiscoveryCapability[];
  sources: DiscoverySource[];
}
export function CapabilityGrid({ capabilities, sources }: CapabilityGridProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCap, setSelectedCap] = useState<DiscoveryCapability | null>(null);
  const filtered = useMemo(() => {
    return capabilities.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                           c.endpoint.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [capabilities, search, typeFilter]);
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
          <Input 
            placeholder="Search discovered capabilities, endpoints, or patterns..." 
            className="bg-white/5 border-white/10 text-white pl-10 h-11"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white h-11">
            <SelectValue placeholder="Type: All" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            <SelectItem value="all">Type: All</SelectItem>
            <SelectItem value="Analytic">Analytic</SelectItem>
            <SelectItem value="Action">Action</SelectItem>
            <SelectItem value="Stream">Stream</SelectItem>
            <SelectItem value="Knowledge">Knowledge</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="h-11 border-white/10 bg-white/5 text-slate-400">
          <Filter size={18} />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(cap => (
          <Card key={cap.id} className="glass-dark border-white/5 hover:border-indigo-500/30 transition-all group overflow-hidden flex flex-col">
            <CardHeader className="p-5 pb-2">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-[8px] h-4 bg-white/5 border-white/10 text-slate-400 tracking-tighter uppercase">
                  {cap.type}
                </Badge>
                <Badge className={`text-[8px] h-4 border-none ${cap.method === 'POST' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {cap.method}
                </Badge>
              </div>
              <h3 className="text-white font-bold group-hover:text-indigo-400 transition-colors truncate">{cap.name}</h3>
              <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">{cap.endpoint}</p>
            </CardHeader>
            <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Health</span>
                  <span className="text-[10px] font-mono font-bold text-white">{cap.health}%</span>
                </div>
                <Progress value={cap.health} className={`h-1 bg-white/5 ${cap.health > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Latency</p>
                  <p className="text-sm font-mono font-bold text-white flex items-center gap-1"><Zap size={10} className="text-indigo-400"/> {cap.responseTime}ms</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Success</p>
                  <p className="text-sm font-mono font-bold text-white flex items-center gap-1"><Activity size={10} className="text-emerald-400"/> {cap.successRate}%</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-auto pt-4">
                {cap.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-500 text-[8px] font-bold uppercase tracking-tighter">#{tag}</span>
                ))}
              </div>
              <div className="pt-4 flex items-center justify-between">
                <span className="text-[9px] text-slate-600 font-mono italic">Sync: {cap.lastCheck}</span>
                <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10" onClick={() => setSelectedCap(cap)}>
                  Inspect Node
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <CapabilityDetails 
        capability={selectedCap} 
        open={!!selectedCap} 
        onOpenChange={(open) => !open && setSelectedCap(null)} 
      />
    </div>
  );
}