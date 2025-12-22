import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Bell, ShieldAlert, Terminal, Lock, Activity, Send } from 'lucide-react';
import { toast } from 'sonner';
export function AuditAlerts() {
  const handleSave = () => {
    toast.success('Alert Protocols Enabled', {
      description: 'System-wide notification matrix synchronized.'
    });
  };
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white relative bg-white/5 h-11 w-11">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-slate-950 border-white/10 text-white max-w-md w-full overflow-y-auto">
        <SheetHeader className="mb-8">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 mb-4">
            <Bell size={28} />
          </div>
          <SheetTitle className="text-2xl font-display font-black">Operator Notifications</SheetTitle>
          <SheetDescription className="text-slate-400">
            Configure automated system alerts based on neural audit triggers.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-8 py-4">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Critical Triggers</h4>
            <div className="space-y-4">
              {[
                { label: 'Failed Auth Attempts', icon: Lock, id: 'fail-auth' },
                { label: 'Policy Modifications', icon: Terminal, id: 'pol-mod' },
                { label: 'Emergency Key Revocation', icon: ShieldAlert, id: 'key-rev' },
                { label: 'Unusual API Volume Spikes', icon: Activity, id: 'vol-spike' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-indigo-400" />
                    <Label htmlFor={item.id} className="text-sm font-bold text-white cursor-pointer">{item.label}</Label>
                  </div>
                  <Switch id={item.id} defaultChecked className="data-[state=checked]:bg-indigo-600" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sensitivity Threshold</h4>
              <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 font-mono">HIGH</Badge>
            </div>
            <Slider defaultValue={[85]} max={100} step={1} className="[&_[role=slider]]:bg-indigo-500" />
            <p className="text-[10px] text-slate-500 italic">Adjust the confidence required for neural anomaly alerts.</p>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Dispatch Channels</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300">
                <span>Primary Terminal Push</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px]">ACTIVE</Badge>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-500">
                <span>Internal Webhook</span>
                <span className="text-[8px] font-bold uppercase tracking-widest">Config Pending</span>
              </div>
            </div>
          </div>
          <div className="pt-10">
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-600/20">
              <Send size={18} className="mr-2" /> Propagate Alert Matrix
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}