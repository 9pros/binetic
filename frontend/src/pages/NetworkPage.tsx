import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NetworkGraph } from '@/components/network/NetworkGraph';
import { SlotDetailsPanel } from '@/components/network/SlotDetailsPanel';
import { SignalMonitor } from '@/components/network/SignalMonitor';
import { NetworkToolbar } from '@/components/network/NetworkToolbar';
import { NetworkStats } from '@/components/network/NetworkStats';
import { NetworkSlot, NetworkSignal } from '@shared/types';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useNetworkSlots, useCreateNetworkSlot, useUpdateNetworkSlot } from '@/hooks/use-nexus-api';
import { Loader2 } from 'lucide-react';

export default function NetworkPage() {
  const { data: slots = [], isLoading } = useNetworkSlots();
  const createSlot = useCreateNetworkSlot();
  const updateSlot = useUpdateNetworkSlot();
  
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [signals, setSignals] = useState<NetworkSignal[]>([]);
  const [isMonitorOpen, setIsMonitorOpen] = useState(true);

  const selectedSlot = slots.find(s => s.id === selectedSlotId) || null;

  // Simulate incoming signals
  useEffect(() => {
    if (slots.length === 0) return;
    
    const interval = setInterval(() => {
      const source = slots[Math.floor(Math.random() * slots.length)];
      const target = slots[Math.floor(Math.random() * slots.length)];
      if (source.id === target.id) return;
      
      const newSignal: NetworkSignal = {
        id: `SIG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        sourceId: source.id,
        targetId: target.id,
        type: Math.random() > 0.8 ? 'COMMAND' : 'DATA',
        status: Math.random() > 0.95 ? 'ERROR' : 'SUCCESS',
        payload: `0x${Math.random().toString(16).substr(2, 8)}`,
        timestamp: Date.now(),
      };
      setSignals(prev => [newSignal, ...prev].slice(0, 50));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [slots]);

  const handleNewSlot = () => {
    createSlot.mutate({
      label: `Slot ${slots.length + 1}`,
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
    });
  };

  const handleAutoArrange = () => {
    // Auto-arrange slots in a grid
    slots.forEach((slot, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      updateSlot.mutate({
        id: slot.id,
        data: { x: 200 + col * 300, y: 150 + row * 200 }
      });
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-140px)]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-fade-in">
        <NetworkStats slots={slots} signals={signals} />
        
        <div className="flex-1 min-h-0 glass-dark border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <NetworkToolbar 
            onAutoArrange={handleAutoArrange} 
            onNewSlot={handleNewSlot}
          />
          
          <div className="flex-1 flex overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={75} minSize={50}>
                <div className="relative w-full h-full bg-slate-950/40">
                  <NetworkGraph 
                    slots={slots} 
                    signals={signals}
                    selectedId={selectedSlotId}
                    onSelect={setSelectedSlotId}
                  />
                  
                  {/* Bottom Signal Monitor Overlay */}
                  <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 ${isMonitorOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}>
                    <SignalMonitor 
                      signals={signals} 
                      isOpen={isMonitorOpen} 
                      onToggle={() => setIsMonitorOpen(!isMonitorOpen)} 
                    />
                  </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle className="bg-white/5 w-1" />
              
              <ResizablePanel defaultSize={25} minSize={20}>
                <SlotDetailsPanel 
                  slot={selectedSlot} 
                  signals={signals.filter(s => s.sourceId === selectedSlotId || s.targetId === selectedSlotId)}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
