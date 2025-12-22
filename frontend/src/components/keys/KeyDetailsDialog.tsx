import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Calendar,
  User,
  ShieldCheck,
  BarChart3,
  RefreshCcw,
  PauseCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiKey } from '@shared/types';
import { useKeyUsageStats } from '@/hooks/use-nexus-api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface KeyDetailsDialogProps {
  keyData: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyDetailsDialog({ keyData, open, onOpenChange }: KeyDetailsDialogProps) {
  const { data: usageData } = useKeyUsageStats(keyData?.id);

  if (!keyData) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-3xl overflow-hidden p-0">
        <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-display font-black tracking-tight">{keyData.name}</DialogTitle>
                <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                  ID: {keyData.id} <Badge variant="outline" className="h-4 px-1 text-[8px] border-white/10 uppercase">{keyData.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 h-8 text-[10px] font-bold uppercase tracking-widest">
                  <RefreshCcw className="mr-2 h-3 w-3" /> Rotate
                </Button>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 h-8 text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300">
                  <PauseCircle className="mr-2 h-3 w-3" /> Suspend
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-6 md:col-span-1">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Configuration</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><User size={14}/></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Owner</p>
                      <p className="text-xs font-medium text-white">{keyData.owner}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><ShieldCheck size={14}/></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Scope</p>
                      <p className="text-xs font-medium text-white">{keyData.scope}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><Calendar size={14}/></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Created</p>
                      <p className="text-xs font-medium text-white">{keyData.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><Clock size={14}/></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Expiry</p>
                      <p className="text-xs font-medium text-white">{keyData.expiresAt || 'Never'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Metadata Tags</p>
                <div className="flex flex-wrap gap-1">
                  {(keyData.metadata.tags || []).map(tag => (
                    <Badge key={tag} className="bg-white/5 border-white/10 text-slate-400 text-[9px] hover:bg-white/10">#{tag}</Badge>
                  ))}
                  {(keyData.metadata.tags || []).length === 0 && <span className="text-xs italic text-slate-600">No tags assigned</span>}
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <BarChart3 size={12} className="text-indigo-400" /> Usage Telemetry (24h)
                  </h4>
                  <div className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">LIVE</div>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageData || []}>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#6366f1', fontSize: '10px' }}
                      />
                      <Bar dataKey="reqs" radius={[4, 4, 0, 0]}>
                        {(usageData || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 3 ? '#818cf8' : '#312e81'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Req</p>
                    <p className="text-lg font-mono font-bold text-white">{((keyData.stats?.totalRequests || 0) / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Error %</p>
                    <p className="text-lg font-mono font-bold text-rose-400">{(keyData.stats?.errorRate || 0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Sessions</p>
                    <p className="text-lg font-mono font-bold text-emerald-400">{keyData.stats?.activeSessions || 0}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rate Limit Saturation</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Quota: {keyData.rateLimit?.rpm || 0} RPM</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Current Burst (1m)</span>
                      <span className="text-white">12%</span>
                    </div>
                    <Progress value={12} className="h-1 bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Hourly Quota</span>
                      <span className="text-white">65%</span>
                    </div>
                    <Progress value={65} className="h-1 bg-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl flex items-start gap-4">
            <ShieldCheck size={20} className="text-rose-500 mt-1 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white mb-1">Destructive Action Zone</p>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Revoking this access vector will immediately disconnect {keyData.stats?.activeSessions || 0} active neural sessions. This action is immutable.
              </p>
              <Button variant="destructive" className="h-9 font-black uppercase tracking-[0.2em] text-[10px] px-6">
                Terminate Link Hierarchy
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}