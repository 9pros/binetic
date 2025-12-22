import React from 'react';
import { NetworkSlot, NetworkSignal } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Activity, Link2, Unlink, Radio, Terminal } from 'lucide-react';
import { toast } from 'sonner';
interface SlotDetailsPanelProps {
  slot: NetworkSlot | null;
  signals: NetworkSignal[];
}
export function SlotDetailsPanel({ slot, signals }: SlotDetailsPanelProps) {
  if (!slot) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/40">
        <Radio className="h-12 w-12 text-slate-800 mb-4" />
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No Node Selected</p>
        <p className="text-slate-600 text-[10px] mt-2">Select a synaptic slot from the network matrix to inspect its state.</p>
      </div>
    );
  }
  const handleTestSignal = () => {
    toast.promise(new Promise(r => setTimeout(r, 1000)), {
      loading: `Pinging ${slot.id}...`,
      success: `Handshake established with ${slot.label}`,
      error: 'Ping timed out'
    });
  };
  return (
    <div className="h-full flex flex-col bg-slate-900/60 border-l border-white/5">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold text-indigo-400">{slot.id}</span>
          <Badge variant="outline" className="text-[8px] h-4 border-white/10 uppercase tracking-tighter">
            {slot.state}
          </Badge>
        </div>
        <h3 className="text-xl font-display font-black text-white">{slot.label}</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Total Ops</p>
              <p className="text-lg font-mono font-bold text-white">{(slot.opsCount / 1000).toFixed(1)}k</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Connections</p>
              <p className="text-lg font-mono font-bold text-indigo-400">{slot.connections.length}</p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Link2 size={12} className="text-indigo-400" /> Policy Bindings
            </h4>
            <div className="space-y-2">
              {slot.bindings.map(b => (
                <div key={b} className="flex items-center justify-between p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                  <span className="text-xs font-mono text-indigo-300">{b}</span>
                  <Badge className="bg-indigo-600/20 text-indigo-400 border-none text-[8px]">ACTIVE</Badge>
                </div>
              ))}
              {slot.bindings.length === 0 && <p className="text-[10px] italic text-slate-600">No policies bound to this node.</p>}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Terminal size={12} className="text-emerald-400" /> Recent Activity
            </h4>
            <div className="space-y-2 font-mono">
              {signals.slice(0, 8).map(sig => (
                <div key={sig.id} className="text-[9px] flex items-center justify-between border-b border-white/5 pb-1">
                  <span className={sig.status === 'ERROR' ? 'text-rose-400' : 'text-slate-400'}>
                    {sig.sourceId === slot.id ? 'OUT' : 'IN'} {sig.id}
                  </span>
                  <span className="text-slate-600">
                    {new Date(sig.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-6 border-t border-white/5 bg-slate-950/40 space-y-3">
        <Button onClick={handleTestSignal} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10">
          <Zap className="mr-2 h-4 w-4" /> Inject Pulse
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="border-white/10 bg-white/5 text-white text-[10px] font-bold h-9">
            <Activity className="mr-2 h-3 w-3" /> Bind
          </Button>
          <Button variant="outline" className="border-rose-500/20 bg-rose-500/5 text-rose-400 text-[10px] font-bold h-9 hover:bg-rose-500/10">
            <Unlink className="mr-2 h-3 w-3" /> Sever
          </Button>
        </div>
      </div>
    </div>
  );
}