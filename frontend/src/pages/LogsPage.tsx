import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuditStats } from '@/components/logs/AuditStats';
import { AuditFilters } from '@/components/logs/AuditFilters';
import { AuditTable } from '@/components/logs/AuditTable';
import { AuditTimeline } from '@/components/logs/AuditTimeline';
import { AuditAlerts } from '@/components/logs/AuditAlerts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table as TableIcon, ListTree, Bell, Download, RefreshCcw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { AuditLog } from '@shared/types';
import { toast } from 'sonner';
import { useAuditLogs } from '@/hooks/use-nexus-api';

export default function LogsPage() {
  const { data: logs = [], isLoading, refetch } = useAuditLogs();
  const [view, setView] = useState<'table' | 'timeline'>('table');
  const [showStats, setShowStats] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    resource: 'all',
    status: 'all',
    dateRange: { from: undefined, to: undefined } as { from?: Date; to?: Date }
  });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !filters.search || 
        log.operator.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.details.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.id.toLowerCase().includes(filters.search.toLowerCase());
      const matchesAction = filters.action === 'all' || log.action === filters.action;
      const matchesResource = filters.resource === 'all' || log.resource === filters.resource;
      const matchesStatus = filters.status === 'all' || log.status === filters.status;
      return matchesSearch && matchesAction && matchesResource && matchesStatus;
    });
  }, [logs, filters]);

  const handleExport = () => {
    toast.success('Forensic Report Generated', {
      description: 'CSV package ready for download.'
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-black text-white tracking-tight flex items-center gap-4">
                Forensic Audit Suite
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-tighter">SEC_LINK_ACTIVE</span>
                </div>
              </h1>
              <p className="text-slate-400 mt-2 text-lg font-medium">Deep packet inspection and chronological neural reconstruction.</p>
            </div>
            <div className="flex items-center gap-3">
              <AuditAlerts />
              <Button variant="outline" onClick={handleExport} className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-11 px-6">
                <Download className="mr-2 h-4 w-4" /> Export Report
              </Button>
            </div>
          </div>

          {/* Stats Section (Collapsible) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                {showStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showStats ? 'Hide' : 'Show'} Real-Time Telemetry
              </button>
              <div className="h-px flex-1 bg-white/5 mx-4" />
              <div className="text-[10px] font-mono text-slate-600">AUDIT_SESSION: 0xFD29A</div>
            </div>
            {showStats && <AuditStats logs={logs} />}
          </div>

          {/* Controls & View Switching */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <AuditFilters onFilterChange={setFilters} />
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full lg:w-auto">
              <TabsList className="bg-white/5 border border-white/10 p-1">
                <TabsTrigger value="table" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  <TableIcon size={16} className="mr-2" /> Data Grid
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  <ListTree size={16} className="mr-2" /> Timeline
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content View */}
          {isLoading ? (
            <div className="flex items-center justify-center h-[600px] glass-dark border border-white/5 rounded-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="min-h-[600px] glass-dark border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              {view === 'table' ? (
                <AuditTable logs={filteredLogs} />
              ) : (
                <AuditTimeline logs={filteredLogs} />
              )}
            </div>
          )}

          {/* Footer Sync Status */}
          <div className="flex items-center justify-center gap-4 py-4 border-t border-white/5">
            <button onClick={() => refetch()} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <RefreshCcw size={14} className={`text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Syncing with Nexus Archive nodes // Latency: 12ms // 100% Integrity
              </p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
