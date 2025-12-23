import React, { useEffect, useRef, useState } from 'react';
import { X, Minus, Terminal as TerminalIcon, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminalStore } from '@/lib/terminal-store';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

// Use Cloudflare Tunnel URL to avoid Mixed Content errors (HTTPS -> HTTP)
const PYTHON_CORE_URL = 'https://refused-care-drives-powerseller.trycloudflare.com/api';

export function TerminalOverlay() {
  const { isOpen, history, toggle, addEntry, clear } = useTerminalStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addEntry('command', trimmed);
    setInput('');

    // Process command
    try {
      const [command, ...args] = trimmed.split(' ');
      
      switch (command.toLowerCase()) {
        case 'help':
          addEntry('system', 'Available commands:\n  help     - Show this help\n  clear    - Clear terminal\n  status   - Check system status\n  echo     - Echo back text\n  brain    - Query the brain\n  discover - Trigger capability discovery');
          break;
        case 'clear':
          clear();
          break;
        case 'echo':
          addEntry('output', args.join(' '));
          break;
        case 'status':
          try {
            addEntry('output', 'Fetching system status...');
            const stats = await api<any>('/brain/stats', { baseUrl: PYTHON_CORE_URL });
            addEntry('output', `System: ONLINE\nBrain State: ${stats.state}\nThoughts: ${stats.total_thoughts}\nUptime: ${stats.uptime_seconds.toFixed(2)}s`);
          } catch (e: any) {
            addEntry('error', `Status check failed: ${e.message}`);
          }
          break;
        case 'brain':
          if (args.length === 0) {
            addEntry('error', 'Usage: brain <query>');
            break;
          }
          try {
            addEntry('output', 'Thinking...');
            const result = await api<any>('/brain/think', {
              method: 'POST',
              body: JSON.stringify({ content: args.join(' '), type: 'query' }),
              baseUrl: PYTHON_CORE_URL
            });
            addEntry('output', `Brain response:\n> ${JSON.stringify(result.result, null, 2)}`);
          } catch (e: any) {
            addEntry('error', `Brain error: ${e.message}`);
          }
          break;
        case 'discover':
          try {
            addEntry('output', 'Initiating discovery protocol...');
            const result = await api<any>('/discovery/discover', { method: 'POST', baseUrl: PYTHON_CORE_URL });
            addEntry('output', `Discovery complete.\nSources probed: ${result.sources_probed}\nTotal capabilities: ${result.total_capabilities}`);
          } catch (e: any) {
            addEntry('error', `Discovery failed: ${e.message}`);
          }
          break;
        default:
          // In a real app, this would call the backend API
          addEntry('error', `Command not found: ${command}`);
      }
    } catch (err: any) {
      addEntry('error', `Failed to execute command: ${err.message}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
    if (e.key === 'Escape') {
      toggle();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 h-[40vh] bg-[#0a0a0a] border-t border-white/10 shadow-2xl flex flex-col font-mono text-sm transition-transform duration-300 ease-in-out",
      isOpen ? "translate-y-0" : "translate-y-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
        <div className="flex items-center gap-2 text-slate-400">
          <TerminalIcon className="w-4 h-4" />
          <span className="font-semibold text-xs uppercase tracking-wider">System Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={clear} title="Clear">
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={toggle} title="Minimize">
            <Minus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-500/20 hover:text-red-400" onClick={toggle} title="Close">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {history.map((entry) => (
          <div key={entry.id} className="flex gap-2 break-words">
            <span className="text-slate-600 shrink-0 select-none">
              {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className="flex-1">
              {entry.type === 'command' && (
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <ChevronRight className="w-3 h-3" />
                  {entry.content}
                </div>
              )}
              {entry.type === 'output' && (
                <div className="text-slate-300 whitespace-pre-wrap">{entry.content}</div>
              )}
              {entry.type === 'error' && (
                <div className="text-red-400">{entry.content}</div>
              )}
              {entry.type === 'system' && (
                <div className="text-emerald-500 italic">{entry.content}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 bg-[#0a0a0a] border-t border-white/5">
        <div className="flex items-center gap-2 px-2">
          <ChevronRight className="w-4 h-4 text-cyan-500 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-700"
            placeholder="Enter command..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}
