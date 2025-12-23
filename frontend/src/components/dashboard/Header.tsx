import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Plus, Power, RefreshCw, ChevronDown, Terminal } from 'lucide-react';
import { useTerminalStore } from '@/lib/terminal-store';
const PATH_MAP: Record<string, string> = {
  '/': 'Mission Control',
  '/network': 'Neural Topology',
  '/brain': 'Brain State',
  '/keys': 'Access Management',
  '/policies': 'Safety Directives',
  '/logs': 'System Audit',
  '/memory': 'Cognitive Storage',
  '/operators': 'Operator Registry',
  '/discovery': 'Autonomous Search',
  '/settings': 'Nexus Configuration',
};
export function Header() {
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toggle: toggleTerminal, isOpen: isTerminalOpen } = useTerminalStore();
  const pageTitle = PATH_MAP[location.pathname] || 'Nexus Hub';
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-[#030712]/80 backdrop-blur-md px-6 justify-between">
      <div className="flex items-center gap-8">
        <SidebarTrigger className="text-slate-400 hover:text-white" />
        <h2 className="hidden lg:block text-lg font-display font-bold text-white whitespace-nowrap">
          {pageTitle}
        </h2>
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            ref={searchInputRef}
            placeholder="Search commands, nodes, or logs (⌘K)"
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 pl-10 h-9 w-[300px] lg:w-[400px] focus:w-[450px] transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 mr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-9 w-9 transition-colors ${isTerminalOpen ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            onClick={toggleTerminal}
            title="Toggle System Terminal"
          >
            <Terminal className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 h-9">
                <Plus className="mr-2 h-4 w-4" /> Quick Actions <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0f172a] border-white/10 text-white">
              <DropdownMenuLabel>Nexus Shortcuts</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-white">
                <Plus className="mr-2 h-4 w-4" /> New Access Key
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-white">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Neural Sync
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="cursor-pointer text-rose-400 focus:bg-rose-500/20 focus:text-rose-400">
                <Power className="mr-2 h-4 w-4" /> Emergency Halt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white bg-white/5 h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-[#030712] animate-pulse">
            3
          </span>
        </div>
      </div>
    </header>
  );
}