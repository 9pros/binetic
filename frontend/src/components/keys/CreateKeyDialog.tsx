import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Key, Copy, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiKey, ApiKeyScope } from '@shared/types';
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  scope: z.enum(['Master', 'Admin', 'User', 'Service', 'Readonly']),
  description: z.string(),
  tags: z.string(),
  expiresInDays: z.string(),
  neverExpires: z.boolean(),
  rpm: z.string(),
  rph: z.string(),
});
type FormValues = z.infer<typeof formSchema>;
export function CreateKeyDialog({ onCreated }: { onCreated: (key: ApiKey) => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [hasConfirmedSave, setHasConfirmedSave] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      scope: 'User',
      description: '',
      tags: '',
      neverExpires: false,
      expiresInDays: '365',
      rpm: "100",
      rph: "5000",
    },
  });
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const keyId = `k_${Math.random().toString(36).substring(2, 11)}`;
      const fullKey = `fgk_${values.scope.toLowerCase()}_${Math.random().toString(36).substring(2, 18)}`;
      const newKey: ApiKey = {
        id: keyId,
        name: values.name,
        key: fullKey,
        scope: values.scope as ApiKeyScope,
        owner: 'nexus-01',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        expiresAt: values.neverExpires ? null : new Date(Date.now() + Number(values.expiresInDays) * 86400000).toISOString().split('T')[0],
        lastUsed: 'Never',
        metadata: {
          description: values.description || '',
          tags: values.tags ? values.tags.split(',').map(t => t.trim()) : [],
        },
        rateLimit: {
          rpm: Number(values.rpm),
          rph: Number(values.rph),
        },
        stats: { totalRequests: 0, errorRate: 0, activeSessions: 0 }
      };
      setGeneratedKey(fullKey);
      onCreated(newKey);
      toast.success('Neural Link Encrypted');
    } catch (e) {
      toast.error('Failed to generate key');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => {
    setOpen(false);
    setGeneratedKey(null);
    setHasConfirmedSave(false);
    form.reset();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !isSubmitting && (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-600/20">
          <Plus className="mr-2 h-4 w-4" /> Provision Access Vector
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        {!generatedKey ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-black">Secure Link Provisioning</DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure the parameters for this new AGI access vector.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Vector Identifier</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Production Cluster A" {...field} className="bg-white/5 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Access Scope</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue placeholder="Select Scope" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="Master">Master (Full Control)</SelectItem>
                            <SelectItem value="Admin">Admin (Maintenance)</SelectItem>
                            <SelectItem value="User">User (Standard)</SelectItem>
                            <SelectItem value="Service">Service (Automated)</SelectItem>
                            <SelectItem value="Readonly">Read-Only (Monitoring)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Protocol Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Context for this access vector..." {...field} className="bg-white/5 border-white/10 resize-none h-20" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-6 items-end">
                  <FormField
                    control={form.control}
                    name="expiresInDays"
                    render={({ field }) => (
                      <FormItem className={form.watch("neverExpires") ? "opacity-30 pointer-events-none" : ""}>
                        <FormLabel className="text-slate-300">Persistence (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-white/5 border-white/10" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="neverExpires"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-lg border border-white/5 bg-white/5">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium text-slate-300">Perpetual Access</FormLabel>
                          <p className="text-[10px] text-slate-500 italic">High security risk.</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <Accordion type="single" collapsible className="w-full border-white/5">
                  <AccordionItem value="limits" className="border-white/5">
                    <AccordionTrigger className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:no-underline">Advanced Rate Constraints</AccordionTrigger>
                    <AccordionContent className="pt-4 grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="rpm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] text-slate-400">REQ PER MINUTE</FormLabel>
                            <FormControl><Input {...field} className="bg-white/5 border-white/10 h-8" /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rph"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] text-slate-400">REQ PER HOUR</FormLabel>
                            <FormControl><Input {...field} className="bg-white/5 border-white/10 h-8" /></FormControl>
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>Abort</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 min-w-[140px]" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Key className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Generating...' : 'Establish Link'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <div className="py-12 flex flex-col items-center text-center space-y-8">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={48} className="animate-in zoom-in duration-500" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-black text-white mb-2">Neural Signature Generated</h2>
              <p className="text-slate-400 text-sm max-w-sm">
                This token is unique and irrecoverable. Store it securely immediately.
              </p>
            </div>
            <div className="w-full bg-slate-950 p-6 rounded-2xl border border-white/10 relative group">
              <code className="text-indigo-400 font-mono text-lg break-all select-all">
                {generatedKey}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-slate-500 hover:text-white"
                onClick={() => {
                  if (generatedKey) navigator.clipboard.writeText(generatedKey);
                  toast.info("Copied to buffer");
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
            <div className="flex items-center space-x-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl w-full text-left">
              <Checkbox id="confirm-save" checked={hasConfirmedSave} onCheckedChange={(v) => setHasConfirmedSave(!!v)} />
              <label htmlFor="confirm-save" className="text-xs text-rose-200 font-medium leading-tight cursor-pointer">
                I have securely stored this key. I understand it will never be displayed again.
              </label>
            </div>
            <Button
              className="w-full h-12 bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest disabled:opacity-30"
              disabled={!hasConfirmedSave}
              onClick={handleClose}
            >
              Verify & Complete Nexus Link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}