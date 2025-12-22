import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { NetworkSlot, NetworkSignal } from '@shared/types';
import { Activity, ShieldAlert, Cpu, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
interface NetworkStatsProps {
  slots: NetworkSlot[];
  signals: NetworkSignal[];
}
export function NetworkStats({ slots, signals }: NetworkStatsProps) {
  const activeCount = slots.filter(s => s.state !== 'IDLE' && s.state !== 'STOPPED').length;
  const errorCount = signals.filter(s => s.status === 'ERROR').length;
  const stats = [
    {
      label: 'Network Saturation',
      value: `${activeCount} / ${slots.length}`,
      sub: 'Nodes Online',
      icon: Cpu,
      color: 'indigo' as const,
    },
    {
      label: 'Signal Velocity',
      value: '1.2k',
      sub: 'Packets / Min',
      icon: Zap,
      color: 'emerald' as const,
    },
    {
      label: 'Anomaly Rate',
      value: `${((errorCount / Math.max(1, signals.length)) * 100).toFixed(1)}%`,
      sub: 'Last 50 Packets',
      icon: ShieldAlert,
      color: errorCount > 0 ? ('rose' as const) : ('emerald' as const),
    },
    {
      label: 'Mean Latency',
      value: '14ms',
      sub: 'Inter-node Avg',
      icon: Activity,
      color: 'indigo' as const,
    },
  ];
  const colorMap = {
    indigo: {
      bg: "bg-indigo-500",
      text: "text-indigo-400",
      muted: "bg-indigo-500/10",
    },
    emerald: {
      bg: "bg-emerald-500",
      text: "text-emerald-400",
      muted: "bg-emerald-500/10",
    },
    rose: {
      bg: "bg-rose-500",
      text: "text-rose-400",
      muted: "bg-rose-500/10",
    },
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, i) => {
        const colors = colorMap[stat.color as keyof typeof colorMap];
        return (
          <Card key={i} className="glass-dark border-white/5 overflow-hidden group">
            <CardContent className="p-4 relative">
              <div className={cn(
                "absolute -top-4 -right-4 w-16 h-16 blur-3xl opacity-10 transition-all group-hover:opacity-20",
                colors.bg
              )} />
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  colors.muted,
                  colors.text
                )}>
                  <stat.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-xl font-mono font-black text-white">{stat.value}</h4>
                    <span className="text-[10px] font-medium text-slate-500 italic">{stat.sub}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn("h-full", colors.bg)}
                  style={{ width: `${Math.random() * 60 + 40}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}