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
  const res = await fetch(`${KLAR_BASE}/public/69d8a3503df670f43cd184d4/69d8a2bd7fcebae2f20488a9/submit`, {
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

export default function PublicFormOrganisationseinheiten() {
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
          <h1 className="text-2xl font-bold text-foreground">Organisationseinheiten — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="org_housenumber">Hausnummer</Label>
            <Input
              id="org_housenumber"
              value={fields.org_housenumber ?? ''}
              onChange={e => setFields(f => ({ ...f, org_housenumber: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_postal">Postleitzahl</Label>
            <Input
              id="org_postal"
              value={fields.org_postal ?? ''}
              onChange={e => setFields(f => ({ ...f, org_postal: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_city">Stadt</Label>
            <Input
              id="org_city"
              value={fields.org_city ?? ''}
              onChange={e => setFields(f => ({ ...f, org_city: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_country">Land</Label>
            <Input
              id="org_country"
              value={fields.org_country ?? ''}
              onChange={e => setFields(f => ({ ...f, org_country: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_responsible_firstname">Verantwortlicher Vorname</Label>
            <Input
              id="org_responsible_firstname"
              value={fields.org_responsible_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, org_responsible_firstname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_responsible_lastname">Verantwortlicher Nachname</Label>
            <Input
              id="org_responsible_lastname"
              value={fields.org_responsible_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, org_responsible_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_responsible_email">E-Mail Verantwortlicher</Label>
            <Input
              id="org_responsible_email"
              type="email"
              value={fields.org_responsible_email ?? ''}
              onChange={e => setFields(f => ({ ...f, org_responsible_email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_description">Beschreibung</Label>
            <Textarea
              id="org_description"
              value={fields.org_description ?? ''}
              onChange={e => setFields(f => ({ ...f, org_description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_active">Aktiv</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="org_active"
                checked={!!fields.org_active}
                onCheckedChange={(v) => setFields(f => ({ ...f, org_active: !!v }))}
              />
              <Label htmlFor="org_active" className="font-normal">Aktiv</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_name">Name der Organisationseinheit</Label>
            <Input
              id="org_name"
              value={fields.org_name ?? ''}
              onChange={e => setFields(f => ({ ...f, org_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_type">Typ</Label>
            <Select
              value={lookupKey(fields.org_type) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, org_type: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="org_type"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="abteilung">Abteilung</SelectItem>
                <SelectItem value="bereich">Bereich</SelectItem>
                <SelectItem value="standort">Standort</SelectItem>
                <SelectItem value="tochtergesellschaft">Tochtergesellschaft</SelectItem>
                <SelectItem value="konzerngesellschaft">Konzerngesellschaft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_parent">Übergeordnete Einheit</Label>
            <Input
              id="org_parent"
              value={fields.org_parent ?? ''}
              onChange={e => setFields(f => ({ ...f, org_parent: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org_street">Straße</Label>
            <Input
              id="org_street"
              value={fields.org_street ?? ''}
              onChange={e => setFields(f => ({ ...f, org_street: e.target.value }))}
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
