import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DiscoverySource, HttpMethod, AuthType } from '@shared/types';
import { Globe, Plus, Trash2, RefreshCw, Radio, Server, Lock } from 'lucide-react';
import { toast } from 'sonner';
interface SourceManagerProps {
  sources: DiscoverySource[];
  onAdd: (source: DiscoverySource) => void;
  onRemove: (id: string) => void;
}
export function SourceManager({ sources, onAdd, onRemove }: SourceManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSource, setNewSource] = useState<Partial<DiscoverySource>>({
    method: 'GET',
    auth: { type: 'None' },
    status: 'Active',
    autoInterval: 15
  });
  const handleAdd = () => {
    if (!newSource.name || !newSource.url) return;
    const source: DiscoverySource = {
      id: `src-${Math.random().toString(36).substr(2, 6)}`,
      name: newSource.name,
      url: newSource.url,
      method: (newSource.method as HttpMethod) || 'GET',
      lastDiscovery: 'Just now',
      capabilitiesCount: 0,
      status: 'Active',
      auth: newSource.auth || { type: 'None' },
      autoInterval: newSource.autoInterval || 15
    };
    onAdd(source);
    setIsModalOpen(false);
    toast.success('Source Registered', { description: `${source.name} added to catalog.` });
  };
  return (
    <div className="glass-dark border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-5">Source Interface</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gateway URL</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Method</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last Sync</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Count</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 pr-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map(source => (
            <TableRow key={source.id} className="border-white/5 hover:bg-white/5 transition-all group">
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                    <Server size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">{source.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{source.id}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
                {source.url}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-white/5 border-white/10 text-indigo-400 text-[9px] font-mono">
                  {source.method}
                </Badge>
              </TableCell>
              <TableCell className="text-[10px] text-slate-500">{source.lastDiscovery}</TableCell>
              <TableCell className="text-center font-mono font-bold text-white text-sm">{source.capabilitiesCount}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${source.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{source.status}</span>
                </div>
              </TableCell>
              <TableCell className="text-right pr-6">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400">
                    <RefreshCw size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-400" onClick={() => onRemove(source.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-none hover:bg-transparent">
            <TableCell colSpan={7} className="p-0">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full h-12 text-slate-500 hover:text-white border-t border-white/5 rounded-none flex items-center justify-center gap-2">
                    <Plus size={16} /> Provision New Infrastructure Source
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display font-black">Provision Discovery Source</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Source Name</Label>
                        <Input 
                          placeholder="e.g. Cluster Omega" 
                          className="bg-white/5 border-white/10"
                          value={newSource.name || ''}
                          onChange={e => setNewSource({...newSource, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>HTTP Method</Label>
                        <Select onValueChange={v => setNewSource({...newSource, method: v as HttpMethod})} defaultValue="GET">
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Endpoint URL</Label>
                      <Input 
                        placeholder="https://api.nexus.node/discovery" 
                        className="bg-white/5 border-white/10"
                        value={newSource.url || ''}
                        onChange={e => setNewSource({...newSource, url: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Authentication</Label>
                        <Select onValueChange={v => setNewSource({...newSource, auth: { type: v as AuthType }})} defaultValue="None">
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="API Key">API Key</SelectItem>
                            <SelectItem value="Bearer Token">Bearer Token</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Auto-Interval (min)</Label>
                        <Input 
                          type="number" 
                          defaultValue={15} 
                          className="bg-white/5 border-white/10" 
                          onChange={e => setNewSource({...newSource, autoInterval: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Abort</Button>
                    <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-500 font-bold min-w-[120px]">
                      Initialize Source
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}