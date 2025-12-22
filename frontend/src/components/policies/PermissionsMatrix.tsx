import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ResourceType, PermissionLevel, PolicyPermissions, ResourcePermission } from '@shared/types';
import { cn } from '@/lib/utils';
const RESOURCES: ResourceType[] = ['OPERATOR', 'SLOT', 'NETWORK', 'KEY', 'POLICY', 'USER', 'AUDIT', 'SYSTEM'];
const LEVELS: PermissionLevel[] = ['None', 'Read', 'Execute', 'Write', 'Admin'];
interface PermissionsMatrixProps {
  value: PolicyPermissions;
  onChange: (value: PolicyPermissions) => void;
}
export function PermissionsMatrix({ value, onChange }: PermissionsMatrixProps) {
  const getResourceConfig = (res: ResourceType): ResourcePermission => {
    return value[res] || { level: 'None', wildcard: false, resourceId: '' };
  };
  const handleLevelChange = (resource: ResourceType, level: PermissionLevel) => {
    const next = { ...value };
    next[resource] = { ...getResourceConfig(resource), level };
    onChange(next);
  };
  const handleIdChange = (resource: ResourceType, resourceId: string) => {
    const next = { ...value };
    next[resource] = { ...getResourceConfig(resource), resourceId };
    onChange(next);
  };
  const handleWildcardToggle = (resource: ResourceType, wildcard: boolean) => {
    const next = { ...value };
    next[resource] = { ...getResourceConfig(resource), wildcard };
    onChange(next);
  };
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Resource</th>
              {LEVELS.map(level => (
                <th key={level} className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {level}
                </th>
              ))}
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Config</th>
            </tr>
          </thead>
          <tbody>
            {RESOURCES.map(res => {
              const current = getResourceConfig(res);
              return (
                <React.Fragment key={res}>
                  <tr className="border-b border-white/5 group hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <span className="text-xs font-bold text-white font-mono">{res}</span>
                    </td>
                    {LEVELS.map(level => (
                      <td key={level} className="p-4 text-center">
                        <div className="flex justify-center">
                          <RadioGroup
                            value={current.level}
                            onValueChange={(val) => handleLevelChange(res, val as PermissionLevel)}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={level}
                                className={cn(
                                  "border-white/20",
                                  current.level === level && "bg-indigo-600 border-indigo-600"
                                )}
                              />
                            </div>
                          </RadioGroup>
                        </div>
                      </td>
                    ))}
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`wildcard-${res}`}
                            checked={current.wildcard}
                            onCheckedChange={(val) => handleWildcardToggle(res, !!val)}
                            className="border-white/20 data-[state=checked]:bg-indigo-600"
                          />
                          <Label htmlFor={`wildcard-${res}`} className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer">All</Label>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-slate-900/30">
                    <td colSpan={7} className="px-4 py-2">
                      {!current.wildcard && (
                        <div className="flex items-center gap-3 pl-4">
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Instance Filter:</span>
                          <Input
                            placeholder="Resource ID or Pattern..."
                            value={current.resourceId || ''}
                            onChange={(e) => handleIdChange(res, e.target.value)}
                            className="h-7 text-[10px] bg-black/40 border-white/5 text-indigo-300 w-64"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
        <p className="text-[10px] text-indigo-400 leading-relaxed flex items-center gap-2 italic">
          <span className="h-1 w-1 rounded-full bg-indigo-400" />
          Wildcard overrides Instance Filters. "Admin" level includes all lower permissions by default.
        </p>
      </div>
    </div>
  );
}