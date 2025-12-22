import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiscoverySource, DiscoveryCapability } from '@shared/types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Database, Zap, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
interface DiscoveryStatsProps {
  sources: DiscoverySource[];
  capabilities: DiscoveryCapability[];
}
export function DiscoveryStats({ sources, capabilities }: DiscoveryStatsProps) {
  const avgHealth = capabilities.length > 0 
    ? capabilities.reduce((acc, curr) => acc + curr.health, 0) / capabilities.length 
    : 0;
  const distribution = [
    { name: 'Analytic', count: capabilities.filter(c => c.type === 'Analytic').length },
    { name: 'Action', count: capabilities.filter(c => c.type === 'Action').length },
    { name: 'Stream', count: capabilities.filter(c => c.type === 'Stream').length },
    { name: 'Knowledge', count: capabilities.filter(c => c.type === 'Knowledge').length },
  ];
  const stats = [
    { label: 'Infrastructure Sources', value: sources.length, icon: Database, color: 'indigo' },
    { label: 'Active Capabilities', value: capabilities.length, icon: Zap, color: 'emerald' },
    { label: 'Ecosystem Health', value: `${avgHealth.toFixed(1)}%`, icon: Activity, color: 'indigo' },
    { label: 'Policy Coverage', value: '100%', icon: ShieldCheck, color: 'emerald' },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="glass-dark border-white/5 overflow-hidden group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl",
                stat.color === 'indigo' ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
              )}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                <h4 className="text-2xl font-mono font-black text-white">{stat.value}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glass-dark border-white/5 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-xs font-black uppercase tracking-widest">Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-40 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#6366f1', fontSize: '10px' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}