import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { lookupKey } from '@/lib/formatters';

const KLAR_BASE = 'http://localhost:8000/claude';

async function submitPublicForm(fields: Record<string, unknown>) {
  const res = await fetch(`${KLAR_BASE}/public/69d8a3503df670f43cd184d4/69d8a2d0445d7fa47b771835/submit`, {
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

export default function PublicFormKontrollManagement() {
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
          <h1 className="text-2xl font-bold text-foreground">Kontroll-Management — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="ctrl_id">Kontroll-ID</Label>
            <Input
              id="ctrl_id"
              value={fields.ctrl_id ?? ''}
              onChange={e => setFields(f => ({ ...f, ctrl_id: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_title">Kontrolltitel</Label>
            <Input
              id="ctrl_title"
              value={fields.ctrl_title ?? ''}
              onChange={e => setFields(f => ({ ...f, ctrl_title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_description">Beschreibung</Label>
            <Textarea
              id="ctrl_description"
              value={fields.ctrl_description ?? ''}
              onChange={e => setFields(f => ({ ...f, ctrl_description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_type">Kontrolltyp</Label>
            <Select
              value={lookupKey(fields.ctrl_type) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, ctrl_type: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="ctrl_type"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="praeventiv">Präventiv</SelectItem>
                <SelectItem value="detektiv">Detektiv</SelectItem>
                <SelectItem value="korrektiv">Korrektiv</SelectItem>
                <SelectItem value="direktiv">Direktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_domain">Kontrolldomäne</Label>
            <Input
              id="ctrl_domain"
              value={fields.ctrl_domain ?? ''}
              onChange={e => setFields(f => ({ ...f, ctrl_domain: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_owner_firstname">Kontrollverantwortlicher Vorname</Label>
            <Input
              id="ctrl_owner_firstname"
              value={fields.ctrl_owner_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, ctrl_owner_firstname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_owner_lastname">Kontrollverantwortlicher Nachname</Label>
            <Input
              id="ctrl_owner_lastname"
              value={fields.ctrl_owner_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, ctrl_owner_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_implementation_status">Implementierungsstatus</Label>
            <Select
              value={lookupKey(fields.ctrl_implementation_status) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, ctrl_implementation_status: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="ctrl_implementation_status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="nicht_implementiert">Nicht implementiert</SelectItem>
                <SelectItem value="in_umsetzung">In Umsetzung</SelectItem>
                <SelectItem value="teilweise_implementiert">Teilweise implementiert</SelectItem>
                <SelectItem value="vollstaendig_implementiert">Vollständig implementiert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_review_date">Nächstes Review-Datum</Label>
            <Input
              id="ctrl_review_date"
              type="date"
              value={fields.ctrl_review_date ?? ''}
              onChange={e => setFields(f => ({ ...f, ctrl_review_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctrl_notes">Anmerkungen</Label>
            <Textarea
              id="ctrl_notes"
              value={fields.ctrl_notes ?? ''}
              onChange={e => setFields(f => ({ ...f, ctrl_notes: e.target.value }))}
              rows={3}
            />
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
