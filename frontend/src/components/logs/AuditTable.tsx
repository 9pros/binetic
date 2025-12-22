import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AuditLog } from '@shared/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, ShieldCheck, User, Globe, Activity, Clock, 
  ChevronRight, ChevronDown, Monitor, Database 
} from 'lucide-react';
import { cn } from '@/lib/utils';
interface AuditTableProps {
  logs: AuditLog[];
}
export function AuditTable({ logs }: AuditTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  const getActionIcon = (action: string) => {
    if (action.includes('KEY')) return <ShieldCheck size={14} className="text-indigo-400" />;
    if (action.includes('AUTH')) return <User size={14} className="text-emerald-400" />;
    if (action.includes('POLICY')) return <Terminal size={14} className="text-amber-400" />;
    return <Activity size={14} className="text-slate-400" />;
  };
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-white/5 sticky top-0 z-20">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="w-10"></TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-5">Timestamp</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Action</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Actor</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resource</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Outcome</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Origin IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <React.Fragment key={log.id}>
              <TableRow 
                onClick={() => toggleRow(log.id)}
                className={cn(
                  "border-white/5 cursor-pointer transition-all duration-200 group",
                  expandedRow === log.id ? "bg-indigo-600/10" : "hover:bg-white/5"
                )}
              >
                <TableCell className="text-slate-600 group-hover:text-indigo-400">
                  {expandedRow === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </TableCell>
                <TableCell className="text-slate-400 text-xs font-mono">{log.timestamp.split(' ')[1]}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <span className="text-white text-xs font-bold tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-300">{log.operator}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[9px] border-white/10 text-slate-500 bg-white/5">
                    {log.resource}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] font-black uppercase tracking-tighter border-none",
                    log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    log.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  )}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-slate-500">{log.ip || '127.0.0.1'}</TableCell>
              </TableRow>
              <AnimatePresence>
                {expandedRow === log.id && (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={7} className="p-0">
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/40 border-y border-indigo-500/20 p-8"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                          <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                                <Monitor size={12} /> Forensic Description
                              </h4>
                              <p className="text-sm text-slate-300 leading-relaxed font-medium">{log.details}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processing Time</p>
                                <div className="flex items-center gap-2 text-white font-mono font-bold">
                                  <Clock size={14} className="text-indigo-400" /> {log.duration || 42}ms
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Shard</p>
                                <div className="flex items-center gap-2 text-white font-mono font-bold">
                                  <Database size={14} className="text-indigo-400" /> Nexus_04_A
                                </div>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-white/5 space-y-3">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Metadata</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(log.metadata || {}).map(([k, v]) => (
                                  <Badge key={k} variant="secondary" className="text-[9px] bg-white/5 border-white/10 text-slate-400">
                                    {k}: {String(v)}
                                  </Badge>
                                ))}
                                {!log.metadata && <span className="text-[10px] italic text-slate-600">No extended metadata.</span>}
                              </div>
                            </div>
                          </div>
                          <div className="lg:col-span-3 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Synaptic Payload / Response</h4>
                              <Badge className="bg-indigo-600/10 text-indigo-400 text-[8px] uppercase font-mono">JSON_RAW</Badge>
                            </div>
                            <div className="bg-slate-950 rounded-xl p-4 border border-white/10 max-h-64 overflow-y-auto custom-scrollbar">
                              <pre className="text-xs font-mono text-indigo-300">
                                {JSON.stringify({
                                  payload: log.payload || { context: "System standard call", params: [] },
                                  response: log.response || { status: "OK", code: 200 }
                                }, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}