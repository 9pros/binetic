import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard, ActivityFeed, HealthGauge } from '@/components/dashboard/StatsWidgets';
import { ApprovalQueue } from '@/components/dashboard/ApprovalQueue';
import { useSystemStats, useAuditLogs, useNeuralActivity } from '@/hooks/use-nexus-api';
import {
  Cpu,
  Key,
  Activity,
  Database,
  RefreshCw,
  Plus,
  Target,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function HomePage() {
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: logs, isLoading: logsLoading } = useAuditLogs();
  const { data: neuralData } = useNeuralActivity();
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-6 overflow-hidden bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-mono whitespace-nowrap">
          <div className="flex items-center gap-2 text-indigo-400">
            <div className="h-1 w-1 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-bold">STATUS: {stats?.load ? 'NOMINAL' : 'LINKING...'}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 animate-marquee">
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500"/> POL_ENFORCED [0x12A]</span>
            <span className="flex items-center gap-1.5"><Zap size={12} className="text-amber-500"/> LATENCY [14ms]</span>
            <span className="flex items-center gap-1.5"><Activity size={12} className="text-indigo-500"/> SYNC [99.4%]</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500"/> SEC_CLEARANCE [ALPHA-9]</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 bg-white/5 rounded-2xl" />)
          ) : (
            <>
              <StatsCard label="Brain Status" value="READY" subValue="99.9% Uptime // Sync Active" icon={Cpu} color="indigo" />
              <StatsCard label="Active Keys" value="142" subValue="4 Created Today" icon={Key} trend="up" trendValue="+12" color="emerald" />
              <StatsCard label="Net Health" value="OPTIMAL" subValue="1,024 Nodes // 14ms" icon={Activity} color="emerald" />
              <StatsCard label="Memory Load" value={`${stats?.load || 68.2}%`} subValue="1.2 TB Pattern // 4k Distro" icon={Database} trend="down" trendValue="-4%" color="amber" />
            </>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card className="glass-dark border-white/5 overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-white text-base">Neural Activity Matrix</CardTitle>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Global Synaptic Load Over 24h</p>
                </div>
              </CardHeader>
              <CardContent className="h-[320px] w-full pt-4 pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={neuralData || []}>
                    <defs>
                      <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} interval={3} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#6366f1', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="load" stroke="#6366f1" fill="url(#colorLoad)" strokeWidth={3} animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="glass-dark border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-base">Nexus Event Timeline</CardTitle>
                <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Real-time synaptic record</p>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 space-y-4">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    <p className="text-xs font-mono text-slate-500">DECRYPTING AUDIT SHARDS...</p>
                  </div>
                ) : (
                  <ActivityFeed activities={logs?.slice(0, 5).map(l => ({
                    message: l.details,
                    module: l.action,
                    time: l.timestamp.split(' ')[1],
                    status: l.status,
                    type: l.severity === 'Critical' ? 'alert' : 'thought'
                  })) || []} />
                )}
                <Button variant="ghost" className="w-full mt-6 text-slate-500 hover:text-white text-xs uppercase tracking-widest font-bold transition-all hover:bg-white/5">
                  Access Full Archives <ArrowUpRight className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
            <ApprovalQueue />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <Card className="glass-dark border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-base">System Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 justify-between px-6 shadow-glow">
                    <span className="flex items-center"><Plus className="mr-3 h-5 w-5" /> PROVISION ACCESS KEY</span>
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent border-white/10 text-white hover:bg-white/10 font-bold h-12 justify-start px-6">
                    <Target className="mr-3 h-5 w-5 text-emerald-400" /> DEFINE COGNITIVE GOAL
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent border-white/10 text-white hover:bg-white/10 font-bold h-12 justify-start px-6">
                    <Search className="mr-3 h-5 w-5 text-indigo-400" /> RUN NODE DISCOVERY
                  </Button>
                </div>
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Health Diagnostics</h4>
                  <HealthGauge label="Synaptic Latency" value={14} max={50} unit="ms" />
                  <HealthGauge label="Memory Pressure" value={stats?.load || 68} />
                  <HealthGauge label="Signal Consistency" value={94} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}