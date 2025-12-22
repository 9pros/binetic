import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkSlot, NetworkSignal, SlotState } from '@shared/types';
import { cn } from '@/lib/utils';
interface NetworkGraphProps {
  slots: NetworkSlot[];
  signals: NetworkSignal[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}
const STATE_COLORS: Record<SlotState, string> = {
  IDLE: '#64748b',
  LISTENING: '#6366f1',
  PROCESSING: '#f59e0b',
  EXECUTING: '#10b981',
  WAITING: '#f97316',
  ERROR: '#ef4444',
  STOPPED: '#334155',
};
export function NetworkGraph({ slots, signals, selectedId, onSelect }: NetworkGraphProps) {
  const connections = useMemo(() => {
    return slots.flatMap(slot =>
      slot.connections.map(targetId => {
        const target = slots.find(s => s.id === targetId);
        if (!target) return null;
        return {
          id: `${slot.id}-${targetId}`,
          source: slot,
          target: target
        };
      })
    ).filter(Boolean);
  }, [slots]);
  return (
    <div className="w-full h-full relative cursor-crosshair overflow-hidden" onClick={() => onSelect(null)}>
      <svg 
        className="w-full h-full" 
        viewBox="0 0 1000 600" 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="connections">
          {connections.map(conn => (
            <motion.path
              key={conn!.id}
              d={`M ${conn!.source.x} ${conn!.source.y} Q ${(conn!.source.x + conn!.target.x)/2} ${(conn!.source.y + conn!.target.y)/2 - 50} ${conn!.target.x} ${conn!.target.y}`}
              stroke="rgba(99, 102, 241, 0.15)"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
            />
          ))}
        </g>
        <AnimatePresence>
          {signals.slice(0, 5).map(sig => {
            const source = slots.find(s => s.id === sig.sourceId);
            const target = slots.find(s => s.id === sig.targetId);
            if (!source || !target) return null;
            return (
              <motion.circle
                key={sig.id}
                r="4"
                fill={sig.status === 'ERROR' ? '#ef4444' : '#818cf8'}
                filter="url(#glow)"
                initial={{ cx: source.x, cy: source.y, opacity: 1 }}
                animate={{ cx: target.x, cy: target.y, opacity: 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            );
          })}
        </AnimatePresence>
        <g className="nodes">
          {slots.map(slot => (
            <motion.g
              key={slot.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(slot.id);
              }}
            >
              <circle
                cx={slot.x}
                cy={slot.y}
                r={20 + (slot.opsCount / 1000)}
                fill={STATE_COLORS[slot.state]}
                fillOpacity="0.1"
                stroke={STATE_COLORS[slot.state]}
                strokeWidth={selectedId === slot.id ? "4" : "2"}
                className={cn(
                  "transition-all duration-300",
                  slot.state === 'EXECUTING' && "animate-pulse"
                )}
                style={{ filter: 'url(#glow)' }}
              />
              <circle
                cx={slot.x}
                cy={slot.y}
                r="6"
                fill={STATE_COLORS[slot.state]}
              />
              <text
                x={slot.x}
                y={slot.y + 40}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest pointer-events-none"
              >
                {slot.label}
              </text>
            </motion.g>
          ))}
        </g>
      </svg>
    </div>
  );
}