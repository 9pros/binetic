import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Users, Activity, Database, Search, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
export function SubsystemOverview() {
  const subsystems = [
    { label: 'Operators', metric: '4 Active', icon: Users, href: '/operators', status: 'online' },
    { label: 'Network', metric: '1,024 Nodes', icon: Activity, href: '/network', status: 'online' },
    { label: 'Memory', metric: '4.2 TB', icon: Database, href: '/memory', status: 'warning' },
    { label: 'Discovery', metric: '82% Sync', icon: Search, href: '/discovery', status: 'online' },
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {subsystems.map((sub) => (
        <Link key={sub.label} to={sub.href} className="block group">
          <Card className="glass-dark border-white/5 group-hover:border-indigo-500/20 transition-all h-full overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-indigo-400 transition-colors">
                  <sub.icon size={16} />
                </div>
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  sub.status === 'online' ? "bg-emerald-500" : "bg-amber-500",
                  "shadow-[0_0_8px_currentColor]"
                )} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{sub.label}</p>
                <h4 className="text-sm font-bold text-white mt-1 flex items-center justify-between">
                  {sub.metric}
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </h4>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}