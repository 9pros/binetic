import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { PermissionsMatrix } from './PermissionsMatrix';
import { SafetyPolicy, PolicyPermissions } from '@shared/types';
import { Shield, Zap, Globe, Lock, Info, Save } from 'lucide-react';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const formSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(['Safety', 'Performance', 'Ethics']),
  severity: z.enum(['low', 'medium', 'high']),
  enabled: z.boolean(),
  rpm: z.number().min(1),
  rph: z.number().min(1),
  rpd: z.number().min(1),
  maxConcurrent: z.number().min(1),
  ipWhitelist: z.string(),
  ipBlacklist: z.string(),
  mfaRequired: z.boolean(),
  allowedDays: z.array(z.string()),
});
type FormValues = z.infer<typeof formSchema>;
interface PolicyEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: SafetyPolicy | null;
  onSave: (policy: SafetyPolicy) => void;
}
export function PolicyEditorDialog({ open, onOpenChange, initialData, onSave }: PolicyEditorDialogProps) {
  const [permissions, setPermissions] = React.useState<PolicyPermissions>({} as PolicyPermissions);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
      description: '',
      category: 'Safety',
      severity: 'medium',
      enabled: true,
      rpm: 60,
      rph: 1000,
      rpd: 10000,
      maxConcurrent: 10,
      ipWhitelist: '',
      ipBlacklist: '',
      mfaRequired: false,
      allowedDays: DAYS,
    },
  });
  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        name: initialData.name,
        description: initialData.description,
        category: initialData.category,
        severity: initialData.severity,
        enabled: initialData.enabled,
        rpm: initialData.rateLimits.rpm,
        rph: initialData.rateLimits.rph,
        rpd: initialData.rateLimits.rpd,
        maxConcurrent: initialData.rateLimits.maxConcurrent,
        ipWhitelist: initialData.restrictions.ipWhitelist.join('\n'),
        ipBlacklist: initialData.restrictions.ipBlacklist.join('\n'),
        mfaRequired: initialData.restrictions.mfaRequired,
        allowedDays: initialData.restrictions.allowedDays || DAYS,
      });
      setPermissions(initialData.permissions);
    } else {
      form.reset({
        id: `POL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        name: '',
        description: '',
        category: 'Safety',
        severity: 'medium',
        enabled: true,
        rpm: 60,
        rph: 1000,
        rpd: 10000,
        maxConcurrent: 10,
        ipWhitelist: '',
        ipBlacklist: '',
        mfaRequired: false,
        allowedDays: DAYS,
      });
      setPermissions({} as PolicyPermissions);
    }
  }, [initialData, open, form]);
  const onSubmit = (values: FormValues) => {
    const policy: SafetyPolicy = {
      id: values.id,
      name: values.name,
      description: values.description,
      category: values.category,
      severity: values.severity,
      enabled: values.enabled,
      permissions,
      rateLimits: {
        rpm: values.rpm,
        rph: values.rph,
        rpd: values.rpd,
        maxConcurrent: values.maxConcurrent
      },
      restrictions: {
        ipWhitelist: values.ipWhitelist.split('\n').filter(Boolean),
        ipBlacklist: values.ipBlacklist.split('\n').filter(Boolean),
        timeWindow: null,
        allowedDays: values.allowedDays,
        mfaRequired: values.mfaRequired
      }
    };
    onSave(policy);
  };
  const getPreviewSummary = () => {
    const active = Object.entries(permissions)
      .filter(([_, p]) => p && p.level !== 'None')
      .map(([res, p]) => `${p.level} ${res}${p.wildcard ? ' (*)' : ''}`);
    if (active.length === 0) return "This policy grants NO permissions.";
    return `Can: ${active.join(', ')}. Restricts all other system resources.`;
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
          <DialogTitle className="text-2xl font-display font-black flex items-center gap-3">
            {initialData ? 'Re-align Directive' : 'Initialize New Directive'}
            <span className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded ml-auto">
              {form.watch('id')}
            </span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="foundation" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="bg-transparent border-b border-white/5 justify-start px-6 h-12 rounded-none space-x-6">
                <TabsTrigger value="foundation" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none px-0 h-full flex gap-2">
                  <Info size={14} /> Foundation
                </TabsTrigger>
                <TabsTrigger value="permissions" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none px-0 h-full flex gap-2">
                  <Lock size={14} /> Permissions
                </TabsTrigger>
                <TabsTrigger value="constraints" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none px-0 h-full flex gap-2">
                  <Zap size={14} /> Constraints
                </TabsTrigger>
                <TabsTrigger value="safeguards" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 rounded-none px-0 h-full flex gap-2">
                  <Globe size={14} /> Safeguards
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <TabsContent value="foundation" className="m-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Policy Name</FormLabel>
                        <FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="Safety">Safety</SelectItem>
                            <SelectItem value="Performance">Performance</SelectItem>
                            <SelectItem value="Ethics">Ethics</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Directive Scope</FormLabel>
                      <FormControl><Textarea {...field} className="bg-white/5 border-white/10 h-32" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>
                <TabsContent value="permissions" className="m-0">
                  <PermissionsMatrix value={permissions} onChange={setPermissions} />
                </TabsContent>
                <TabsContent value="constraints" className="m-0 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <FormField control={form.control} name="rpm" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Req / Minute</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="maxConcurrent" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Max Concurrent</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <FormField control={form.control} name="rph" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Req / Hour</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="rpd" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Req / Day</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                </TabsContent>
                <TabsContent value="safeguards" className="m-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField control={form.control} name="ipWhitelist" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">IP Whitelist (one per line)</FormLabel>
                        <FormControl><Textarea {...field} placeholder="192.168.1.*" className="bg-white/5 border-white/10 h-32 font-mono text-xs" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="ipBlacklist" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">IP Blacklist (one per line)</FormLabel>
                        <FormControl><Textarea {...field} placeholder="0.0.0.0" className="bg-white/5 border-white/10 h-32 font-mono text-xs" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Require Multi-Factor Authentication</p>
                      <p className="text-[10px] text-indigo-300 uppercase font-mono mt-1">Status: High-Security Mode</p>
                    </div>
                    <FormField control={form.control} name="mfaRequired" render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-indigo-600" />
                    )} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <div className="p-6 border-t border-white/5 bg-slate-950 flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Impact Preview</p>
                <p className="text-xs text-indigo-400 italic font-medium">{getPreviewSummary()}</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">Abort</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold min-w-[140px]">
                  <Save className="mr-2 h-4 w-4" /> Propagate Changes
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}