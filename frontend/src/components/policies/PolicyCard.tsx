import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Scale, Copy, Trash2, Edit2, AlertTriangle, Key } from 'lucide-react';
import { SafetyPolicy } from '@shared/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface PolicyCardProps {
  policy: SafetyPolicy;
  onEdit: () => void;
  onDelete: () => void;
}
export function PolicyCard({ policy, onEdit, onDelete }: PolicyCardProps) {
  const Icon = policy.category === 'Safety' ? Shield : policy.category === 'Performance' ? Zap : Scale;
  const permissionCount = Object.values(policy.permissions).filter(p => p.level !== 'None').length;
  const handleDuplicate = () => {
    toast.info('Nexus Replication Initiated', {
      description: `Creating mirror image of ${policy.name}...`
    });
  };
  const handleDelete = () => {
    if (policy.severity === 'high') {
      toast.error('Access Denied', {
        description: 'System-critical directives cannot be purged while active.'
      });
      return;
    }
    onDelete();
    toast.success('Directive Neutralized');
  };
  return (
    <Card className="glass-dark border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className={cn(
            "p-2.5 rounded-xl mb-4",
            policy.category === 'Safety' ? "bg-emerald-500/10 text-emerald-400" :
            policy.category === 'Performance' ? "bg-amber-500/10 text-amber-400" :
            "bg-indigo-500/10 text-indigo-400"
          )}>
            <Icon size={24} />
          </div>
          <Badge className={cn(
            "text-[8px] font-black tracking-[0.2em] border-none uppercase h-5",
            policy.severity === 'high' ? "bg-rose-500/20 text-rose-400" :
            policy.severity === 'medium' ? "bg-amber-500/20 text-amber-400" :
            "bg-emerald-500/20 text-emerald-400"
          )}>
            {policy.severity} Risk
          </Badge>
        </div>
        <CardTitle className="text-lg font-display font-black text-white group-hover:text-indigo-400 transition-colors">
          {policy.name}
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs line-clamp-2 min-h-[2.5rem] mt-2 leading-relaxed">
          {policy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-400 text-[9px] px-2 py-0.5">
            {permissionCount} Permissions Active
          </Badge>
          <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-400 text-[9px] px-2 py-0.5 flex gap-1 items-center">
            <Key size={10} /> {policy.targetKeyCount || 0} Targets
          </Badge>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Flow Rate</span>
          <span className="text-xs font-mono font-bold text-white">~{policy.rateLimits.rpm} t/min</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={onEdit} variant="outline" className="flex-1 bg-white/5 border-white/10 text-white h-9 text-xs font-bold hover:bg-white/10">
            <Edit2 size={12} className="mr-2" /> Adjust
          </Button>
          <Button onClick={handleDuplicate} variant="outline" size="icon" className="h-9 w-9 bg-white/5 border-white/10 text-slate-400 hover:text-white">
            <Copy size={12} />
          </Button>
          <Button onClick={handleDelete} variant="outline" size="icon" className="h-9 w-9 bg-white/5 border-white/10 text-slate-400 hover:text-rose-400">
            <Trash2 size={12} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}