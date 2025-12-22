import React, { useState } from 'react';
import { NetworkSignal } from '@shared/types';
import { ChevronDown, ChevronUp, Radio, Pause, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
interface SignalMonitorProps {
  signals: NetworkSignal[];
  isOpen: boolean;
  onToggle: () => void;
}
export function SignalMonitor({ signals, isOpen, onToggle }: SignalMonitorProps) {
  const [isPaused, setIsPaused] = useState(false);
  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border-t border-white/5 h-64 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5" onClick={onToggle}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Signal Stream</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <span className="text-[10px] font-mono text-slate-500">{signals.length} Packets Captured</span>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-400">
            <Trash2 size={14} />
          </Button>
          <div className="ml-4 text-slate-500">
            {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-white/5">
          {signals.map(sig => (
            <div key={sig.id} className="grid grid-cols-12 gap-4 px-6 py-2.5 items-center hover:bg-white/5 transition-colors group">
              <div className="col-span-1 font-mono text-[10px] text-slate-500">
                {new Date(sig.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="col-span-1">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter",
                  sig.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                )}>
                  {sig.status}
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-2 font-mono text-[10px]">
                <span className="text-indigo-400">{sig.sourceId}</span>
                <span className="text-slate-600">→</span>
                <span className="text-indigo-400">{sig.targetId}</span>
              </div>
              <div className="col-span-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sig.type}</span>
              </div>
              <div className="col-span-6 font-mono text-[10px] text-slate-500 truncate group-hover:text-slate-300">
                {sig.payload}
              </div>
              <div className="col-span-1 text-right">
                <Button variant="ghost" className="h-6 text-[9px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 uppercase">
                  Audit
                </Button>
              </div>
            </div>
          ))}
          {signals.length === 0 && (
            <div className="p-12 text-center text-slate-600 font-mono text-xs">
              WAITING FOR NEURAL HANDSHAKE...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}