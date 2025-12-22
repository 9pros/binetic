import React from 'react';
import { AuditLog } from '@shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink, ShieldAlert, Cpu, Activity, User } from 'lucide-react';
import { cn } from '@/lib/utils';
interface AuditTimelineProps {
  logs: AuditLog[];
}
export function AuditTimeline({ logs }: AuditTimelineProps) {
  // Simple grouping by relative time for demo
  const groups = [
    { label: 'Today', logs: logs.slice(0, 5) },
    { label: 'Yesterday', logs: logs.slice(5, 12) },
    { label: 'Earlier this week', logs: logs.slice(12, 20) },
  ];
  const getEventMarker = (status: string) => {
    switch(status) {
      case 'failure': return 'bg-rose-500 shadow-[0_0_10px_#f43f5e]';
      case 'warning': return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
      default: return 'bg-indigo-500 shadow-[0_0_10px_#6366f1]';
    }
  };
  const getIcon = (action: string) => {
    if (action.includes('KEY')) return <ShieldAlert size={14} />;
    if (action.includes('AUTH')) return <User size={14} />;
    if (action.includes('BRAIN')) return <Cpu size={14} />;
    return <Activity size={14} />;
  };
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {groups.map(group => (
          <div key={group.label} className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{group.label}</h3>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="relative pl-8 space-y-8 before:absolute before:left-[3px] before:top-2 before:bottom-0 before:w-[2px] before:bg-white/5">
              {group.logs.map((log) => (
                <div key={log.id} className="relative">
                  {/* Timeline Pulse Node */}
                  <div className={cn(
                    "absolute -left-[32px] top-1.5 h-3 w-3 rounded-full border-2 border-slate-950 z-10 transition-transform hover:scale-125",
                    getEventMarker(log.status)
                  )} />
                  <Card className="glass-dark border-white/5 hover:border-indigo-500/20 transition-all duration-300 group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                            {getIcon(log.action)}
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm tracking-tight">{log.action.replace(/_/g, ' ')}</h4>
                            <p className="text-[10px] font-mono text-slate-500">{log.operator} // {log.timestamp.split(' ')[1]}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[8px] border-white/10 text-slate-500 uppercase">
                          {log.resource}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        {log.details}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-4">
                           <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                             <Clock size={10} /> {log.duration || 42}ms
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                             <ShieldAlert size={10} className={log.severity === 'Critical' ? 'text-rose-400' : 'text-slate-600'} /> 
                             Sev: {log.severity}
                           </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300">
                          Forensic Link <ExternalLink size={10} className="ml-1.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}