import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AuditLog } from '@shared/types';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Activity, ShieldAlert, Cpu, Zap, TrendingUp } from 'lucide-react';
interface AuditStatsProps {
  logs: AuditLog[];
}
const OUTCOME_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  failure: '#ef4444',
};
export function AuditStats({ logs }: AuditStatsProps) {
  const volumeData = Array.from({ length: 12 }).map((_, i) => ({
    time: `${i * 2}:00`,
    actions: Math.floor(Math.random() * 100) + 20
  }));
  const outcomes = [
    { name: 'Success', value: logs.filter(l => l.status === 'success').length, color: OUTCOME_COLORS.success },
    { name: 'Warning', value: logs.filter(l => l.status === 'warning').length, color: OUTCOME_COLORS.warning },
    { name: 'Failure', value: logs.filter(l => l.status === 'failure').length, color: OUTCOME_COLORS.failure },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-dark border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px]" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Action Volume (24h)</span>
              <TrendingUp size={14} className="text-indigo-400" />
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#818cf8', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="actions" stroke="#6366f1" fill="url(#volGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        <Card className="glass-dark border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Outcome Entropy</span>
             <ShieldAlert size={14} className="text-amber-400" />
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomes} dataKey="value" innerRadius={25} outerRadius={40} paddingAngle={5}>
                  {outcomes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {outcomes.map(o => (
              <div key={o.name} className="text-center">
                <p className="text-[8px] font-bold text-slate-500 uppercase">{o.name}</p>
                <p className="text-xs font-mono font-bold text-white">{o.value}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="glass-dark border-white/5 p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400"><Cpu size={20} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avg Latency</p>
              <p className="text-xl font-mono font-black text-white">12.4ms</p>
            </div>
          </Card>
          <Card className="glass-dark border-white/5 p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400"><Zap size={20} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Throughput</p>
              <p className="text-xl font-mono font-black text-white">8.2k <span className="text-[10px] text-slate-500">ops/m</span></p>
            </div>
          </Card>
        </div>
      </div>
      <Card className="glass-dark border-white/5 p-6 space-y-4 bg-indigo-600/5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Access Vectors</h4>
        <div className="space-y-3">
          {['fgk_master_01', 'fgk_admin_sync', 'fgk_user_392'].map((v, i) => (
            <div key={v} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 group hover:border-indigo-500/30 transition-all">
              <span className="text-[10px] font-mono text-indigo-400">{v}</span>
              <span className="text-[10px] font-bold text-slate-500">{92 - i * 15}%</span>
            </div>
          ))}
        </div>
        <div className="pt-4 mt-auto">
          <p className="text-[10px] text-slate-500 italic">Historical data aggregated from 4 shards across Nexus Primary.</p>
        </div>
      </Card>
    </div>
  );
}