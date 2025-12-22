import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar as CalendarIcon, RefreshCw, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
interface AuditFiltersProps {
  onFilterChange: (filters: any) => void;
}
export function AuditFilters({ onFilterChange }: AuditFiltersProps) {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [resource, setResource] = useState('all');
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const updateFilters = (newFilters: any) => {
    onFilterChange({
      search,
      action,
      resource,
      status,
      dateRange: date,
      ...newFilters
    });
  };
  const handleClear = () => {
    setSearch('');
    setAction('all');
    setResource('all');
    setStatus('all');
    setDate({ from: undefined, to: undefined });
    onFilterChange({ search: '', action: 'all', resource: 'all', status: 'all', dateRange: { from: undefined, to: undefined } });
  };
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
        <Input 
          placeholder="Operator ID, Hash, or Details..." 
          className="bg-black/20 border-white/5 pl-10 h-10 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            updateFilters({ search: e.target.value });
          }}
        />
      </div>
      <Select value={action} onValueChange={(v) => { setAction(v); updateFilters({ action: v }); }}>
        <SelectTrigger className="w-[140px] bg-black/20 border-white/5 h-10 text-xs">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent className="bg-slate-950 border-white/10 text-white">
          <SelectItem value="all">Any Action</SelectItem>
          <SelectItem value="API_KEY_GENERATE">Key Gen</SelectItem>
          <SelectItem value="POLICY_ENFORCEMENT">Policy Check</SelectItem>
          <SelectItem value="BRAIN_RESET">Neural Reset</SelectItem>
          <SelectItem value="AUTH_LINK">Auth Established</SelectItem>
          <SelectItem value="NODE_DISCOVERY">Discovery</SelectItem>
        </SelectContent>
      </Select>
      <Select value={resource} onValueChange={(v) => { setResource(v); updateFilters({ resource: v }); }}>
        <SelectTrigger className="w-[140px] bg-black/20 border-white/5 h-10 text-xs">
          <SelectValue placeholder="Resource" />
        </SelectTrigger>
        <SelectContent className="bg-slate-950 border-white/10 text-white">
          <SelectItem value="all">Any Resource</SelectItem>
          <SelectItem value="SYSTEM">System</SelectItem>
          <SelectItem value="KEY">Key</SelectItem>
          <SelectItem value="POLICY">Policy</SelectItem>
          <SelectItem value="OPERATOR">Operator</SelectItem>
          <SelectItem value="NETWORK">Network</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={(v) => { setStatus(v); updateFilters({ status: v }); }}>
        <SelectTrigger className="w-[120px] bg-black/20 border-white/5 h-10 text-xs">
          <SelectValue placeholder="Outcome" />
        </SelectTrigger>
        <SelectContent className="bg-slate-950 border-white/10 text-white">
          <SelectItem value="all">Any Outcome</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="failure">Failure</SelectItem>
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="bg-black/20 border-white/5 h-10 text-xs gap-2">
            <CalendarIcon size={14} className="text-slate-400" />
            {date.from ? (
              date.to ? `${format(date.from, 'LLL dd')} - ${format(date.to, 'LLL dd')}` : format(date.from, 'LLL dd')
            ) : 'Date Range'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-950 border-white/10" align="end">
          <Calendar
            mode="range"
            selected={{ from: date.from, to: date.to }}
            onSelect={(range: any) => {
              setDate(range || { from: undefined, to: undefined });
              updateFilters({ dateRange: range || { from: undefined, to: undefined } });
            }}
            initialFocus
            className="text-white"
          />
        </PopoverContent>
      </Popover>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={handleClear} className="h-10 w-10 text-slate-500 hover:text-white">
          <X size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-indigo-400">
          <RefreshCw size={18} />
        </Button>
      </div>
    </div>
  );
}