import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Maximize, 
  Search, 
  Plus, 
  ScanLine, 
  Eye, 
  Settings2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
interface NetworkToolbarProps {
  onAutoArrange: () => void;
  onNewSlot: () => void;
}
export function NetworkToolbar({ onAutoArrange, onNewSlot }: NetworkToolbarProps) {
  return (
    <div className="h-14 border-b border-white/5 bg-slate-900/40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Find Node ID..." 
            className="bg-black/40 border-white/10 h-9 w-[200px] pl-9 text-xs"
          />
        </div>
        <div className="h-6 w-[1px] bg-white/10" />
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={onAutoArrange}>
          <Maximize className="mr-2 h-4 w-4" /> Auto-Arrange
        </Button>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
          <Eye className="mr-2 h-4 w-4" /> Toggle Labels
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <Settings2 className="mr-2 h-4 w-4" /> State Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural States</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="focus:bg-white/5 focus:text-white">Active Only</DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/5 focus:text-white">Error States</DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/5 focus:text-white">Unbound Slots</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold" onClick={onNewSlot}>
          <Plus className="mr-2 h-4 w-4" /> New Slot
        </Button>
        <div className="h-6 w-[1px] bg-white/10 mx-2" />
        <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
          <ScanLine className="mr-2 h-4 w-4" /> Run Diagnostics
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
          <RefreshCw size={18} />
        </Button>
      </div>
    </div>
  );
}