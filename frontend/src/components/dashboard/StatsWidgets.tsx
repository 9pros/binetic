import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Brain, Zap, AlertTriangle } from 'lucide-react';
interface StatsCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber';
}
export function StatsCard({ label, value, subValue, icon: Icon, trend, trendValue, color = "indigo" }: StatsCardProps) {
  return (
    <Card className="glass-dark border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-300">
      <CardContent className="p-6 relative">
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 transition-all group-hover:opacity-20",
          color === 'indigo' ? "bg-indigo-500" : 
          color === 'emerald' ? "bg-emerald-500" : 
          color === 'rose' ? "bg-rose-500" : "bg-amber-500"
        )} />
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-2.5 rounded-xl",
            color === 'indigo' ? "bg-indigo-500/10 text-indigo-400" : 
            color === 'emerald' ? "bg-emerald-500/10 text-emerald-400" : 
            color === 'rose' ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
          )}>
            <Icon size={22} />
          </div>
          {trendValue && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
              trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            )}>
              {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendValue}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">{label}</p>
          <h3 className="text-3xl font-black text-white font-mono tracking-tighter">{value}</h3>
          {subValue && <p className="text-[10px] font-medium text-slate-400 mt-1 italic">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
export function HealthGauge({ label, value, max = 100, unit = "%" }: { label: string, value: number, max?: number, unit?: string }) {
  const percentage = (value / max) * 100;
  const color = percentage < 60 ? "bg-emerald-500" : percentage < 85 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-mono font-bold text-white">{value}{unit}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
export function ActivityFeed({ activities }: { activities: any[] }) {
  return (
    <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
      {activities.map((act, i) => {
        const Icon = act.type === 'thought' ? Brain : act.type === 'alert' ? AlertTriangle : Zap;
        return (
          <div key={i} className="relative group">
            <div className={cn(
              "absolute -left-[23px] top-1 p-1 rounded-full border-2 border-[#030712] z-10 transition-transform group-hover:scale-110",
              act.status === 'success' ? 'bg-emerald-500 text-black' : 
              act.status === 'warning' ? 'bg-amber-500 text-black' : 
              'bg-indigo-600 text-white'
            )}>
              <Icon size={12} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">{act.module}</span>
                <span className="text-[10px] text-slate-600 font-medium">{act.time}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-indigo-500/20 transition-all">
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  {act.message}
                </p>
                {act.details && (
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">
                    {">"} {act.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}