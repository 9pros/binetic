import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Copy,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  RefreshCw,
  ShieldAlert,
  Calendar,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiKey, ApiKeyScope } from '@shared/types';
import { CreateKeyDialog } from '@/components/keys/CreateKeyDialog';
import { KeyDetailsDialog } from '@/components/keys/KeyDetailsDialog';
import { RevokeConfirmDialog } from '@/components/keys/RevokeConfirmDialog';
import { differenceInDays, parseISO } from 'date-fns';
import { useApiKeys, useRevokeKey, nexusKeys } from '@/hooks/use-nexus-api';
import { useQueryClient } from '@tanstack/react-query';

export default function KeysPage() {
  const { data: keys = [], isLoading, refetch } = useApiKeys();
  const revokeKey = useRevokeKey();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
  const filteredKeys = useMemo(() => {
    return keys.filter(k => {
      const matchesSearch = k.name.toLowerCase().includes(search.toLowerCase()) ||
                           k.id.toLowerCase().includes(search.toLowerCase()) ||
                           k.owner.toLowerCase().includes(search.toLowerCase());
      const matchesScope = scopeFilter === 'all' || k.scope === scopeFilter;
      return matchesSearch && matchesScope;
    });
  }, [keys, search, scopeFilter]);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Hash Copied', { description: 'Key signature stored in buffer.' });
  };
  const getScopeBadge = (scope: ApiKeyScope) => {
    const variants: Record<ApiKeyScope, string> = {
      Master: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      Admin: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      User: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      Service: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      Readonly: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return <Badge variant="outline" className={`${variants[scope]} font-mono text-[10px]`}>{scope.toUpperCase()}</Badge>;
  };
  const checkExpiration = (dateStr: string | null) => {
    if (!dateStr) return null;
    const daysLeft = differenceInDays(parseISO(dateStr), new Date());
    if (daysLeft < 0) return <span className="text-rose-500 font-bold">EXPIRED</span>;
    if (daysLeft <= 7) return <span className="text-amber-500 flex items-center gap-1"><ShieldAlert size={12}/> {daysLeft}d left</span>;
    return <span className="text-slate-500">{dateStr}</span>;
  };
  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight">Access Control</h1>
          <p className="text-slate-400 mt-2 text-lg">Provision and audit secure neural interface tokens.</p>
        </div>
        <CreateKeyDialog onCreated={() => queryClient.invalidateQueries({ queryKey: nexusKeys.keys() })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
          <Input
            placeholder="Filter by Name, ID, or Operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white h-11"
          />
        </div>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
            <SelectValue placeholder="Scope: All" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            <SelectItem value="all">Scope: All</SelectItem>
            <SelectItem value="Master">Master</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Service">Service</SelectItem>
            <SelectItem value="Readonly">Readonly</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync Stats
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64 glass-dark border border-white/5 rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
      <div className="glass-dark border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] py-5">Ident / Name</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Level</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Operator</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Validity</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Activity</TableHead>
              <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKeys.map((key) => (
              <TableRow key={key.id} className="border-white/5 hover:bg-white/5 transition-all group">
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-bold text-sm flex items-center gap-2">
                      {key.name}
                      {key.status === 'suspended' && <Badge variant="secondary" className="text-[8px] h-4 bg-amber-500/20 text-amber-500">PAUSED</Badge>}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                      {key.id}
                      <button onClick={() => copyToClipboard(key.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300">
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getScopeBadge(key.scope)}</TableCell>
                <TableCell className="text-slate-300 text-xs font-medium">{key.owner}</TableCell>
                <TableCell className="text-xs font-mono">
                  {checkExpiration(key.expiresAt) || <span className="text-slate-600">PERPETUAL</span>}
                </TableCell>
                <TableCell className="text-slate-400 text-xs">{key.lastUsed}</TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      onClick={() => { setSelectedKey(key); setIsDetailsOpen(true); }}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-400"
                      onClick={() => { setKeyToRevoke(key); setIsRevokeOpen(true); }}
                      disabled={key.status === 'revoked'}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredKeys.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <ShieldAlert size={40} className="mb-2 opacity-20" />
                    <p className="font-display font-bold text-white text-lg">No Active Vectors Found</p>
                    <p className="text-sm">Refine your search parameters or provision a new link.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}
      <KeyDetailsDialog
        keyData={selectedKey}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
      <RevokeConfirmDialog
        keyData={keyToRevoke}
        open={isRevokeOpen}
        onOpenChange={setIsRevokeOpen}
        onRevoked={(id) => revokeKey.mutate(id)}
      />
    </DashboardLayout>
  );
}