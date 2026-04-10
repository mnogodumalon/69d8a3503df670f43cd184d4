import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { lookupKey } from '@/lib/formatters';

const KLAR_BASE = 'http://localhost:8000/claude';

async function submitPublicForm(fields: Record<string, unknown>) {
  const res = await fetch(`${KLAR_BASE}/public/69d8a3503df670f43cd184d4/69d8a2cd0daaa949d5a3a850/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Submission failed');
  }
  return res.json();
}


function cleanFields(fields: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (typeof value === 'object' && !Array.isArray(value) && 'key' in (value as any)) {
      cleaned[key] = (value as any).key;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === 'object' && item !== null && 'key' in item ? item.key : item
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export default function PublicFormFrameworkVerwaltung() {
  const [fields, setFields] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return;
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const prefill: Record<string, any> = {};
    params.forEach((value, key) => { prefill[key] = value; });
    if (Object.keys(prefill).length) setFields(prev => ({ ...prefill, ...prev }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicForm(cleanFields(fields));
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Vielen Dank!</h2>
          <p className="text-muted-foreground">Deine Eingabe wurde erfolgreich übermittelt.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setFields({}); }}>
            Weitere Eingabe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Framework-Verwaltung — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="fw_name">Framework-Name</Label>
            <Input
              id="fw_name"
              value={fields.fw_name ?? ''}
              onChange={e => setFields(f => ({ ...f, fw_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fw_type">Framework-Typ</Label>
            <Select
              value={lookupKey(fields.fw_type) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, fw_type: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="fw_type"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="iso27001">ISO/IEC 27001</SelectItem>
                <SelectItem value="nis2">NIS2</SelectItem>
                <SelectItem value="dora">DORA</SelectItem>
                <SelectItem value="bsi">BSI IT-Grundschutz</SelectItem>
                <SelectItem value="soc2">SOC 2</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fw_version">Version / Jahr</Label>
            <Input
              id="fw_version"
              value={fields.fw_version ?? ''}
              onChange={e => setFields(f => ({ ...f, fw_version: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fw_description">Beschreibung</Label>
            <Textarea
              id="fw_description"
              value={fields.fw_description ?? ''}
              onChange={e => setFields(f => ({ ...f, fw_description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req_id">Anforderungs-ID</Label>
            <Input
              id="req_id"
              value={fields.req_id ?? ''}
              onChange={e => setFields(f => ({ ...f, req_id: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req_title">Anforderungstitel</Label>
            <Input
              id="req_title"
              value={fields.req_title ?? ''}
              onChange={e => setFields(f => ({ ...f, req_title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req_description">Anforderungstext</Label>
            <Textarea
              id="req_description"
              value={fields.req_description ?? ''}
              onChange={e => setFields(f => ({ ...f, req_description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req_domain">Domäne / Kapitel</Label>
            <Input
              id="req_domain"
              value={fields.req_domain ?? ''}
              onChange={e => setFields(f => ({ ...f, req_domain: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req_mandatory">Verpflichtend</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="req_mandatory"
                checked={!!fields.req_mandatory}
                onCheckedChange={(v) => setFields(f => ({ ...f, req_mandatory: !!v }))}
              />
              <Label htmlFor="req_mandatory" className="font-normal">Verpflichtend</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fw_active">Framework aktiv</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="fw_active"
                checked={!!fields.fw_active}
                onCheckedChange={(v) => setFields(f => ({ ...f, fw_active: !!v }))}
              />
              <Label htmlFor="fw_active" className="font-normal">Framework aktiv</Label>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Wird gesendet...' : 'Absenden'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Powered by Klar
        </p>
      </div>
    </div>
  );
}
