import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { lookupKey } from '@/lib/formatters';

// Empty PROXY_BASE → relative URLs (dashboard and form-proxy share the domain).
const PROXY_BASE = '';
const APP_ID = '69d8a2cf04326e3426341859';
const SUBMIT_PATH = `/rest/apps/${APP_ID}/records`;
const ALTCHA_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js';

async function submitPublicForm(fields: Record<string, unknown>, captchaToken: string) {
  const res = await fetch(`${PROXY_BASE}/api${SUBMIT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Captcha-Token': captchaToken,
    },
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

export default function PublicFormMassnahmenManagement() {
  const [fields, setFields] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HTMLElement | null>(null);

  // Load the ALTCHA web component script once per page.
  useEffect(() => {
    if (document.querySelector(`script[src="${ALTCHA_SCRIPT_SRC}"]`)) return;
    const s = document.createElement('script');
    s.src = ALTCHA_SCRIPT_SRC;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return;
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const prefill: Record<string, any> = {};
    params.forEach((value, key) => { prefill[key] = value; });
    if (Object.keys(prefill).length) setFields(prev => ({ ...prefill, ...prev }));
  }, []);

  function readCaptchaToken(): string | null {
    const el = captchaRef.current as any;
    if (!el) return null;
    return el.value || el.getAttribute('value') || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = readCaptchaToken();
    if (!token) {
      setError('Bitte warte auf die Spam-Prüfung und versuche es erneut.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicForm(cleanFields(fields), token);
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
          <h1 className="text-2xl font-bold text-foreground">Maßnahmen-Management — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="measure_id">Maßnahmen-ID</Label>
            <Input
              id="measure_id"
              value={fields.measure_id ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_id: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_title">Maßnahmentitel</Label>
            <Input
              id="measure_title"
              value={fields.measure_title ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_description">Beschreibung</Label>
            <Textarea
              id="measure_description"
              value={fields.measure_description ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_type">Maßnahmentyp</Label>
            <Select
              value={lookupKey(fields.measure_type) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, measure_type: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="measure_type"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="technisch">Technisch</SelectItem>
                <SelectItem value="organisatorisch">Organisatorisch</SelectItem>
                <SelectItem value="personell">Personell</SelectItem>
                <SelectItem value="physisch">Physisch</SelectItem>
                <SelectItem value="rechtlich">Rechtlich / Vertraglich</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_priority">Priorität</Label>
            <Select
              value={lookupKey(fields.measure_priority) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, measure_priority: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="measure_priority"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="kritisch">Kritisch</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="mittel">Mittel</SelectItem>
                <SelectItem value="niedrig">Niedrig</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_responsible_firstname">Verantwortlicher Vorname</Label>
            <Input
              id="measure_responsible_firstname"
              value={fields.measure_responsible_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_responsible_firstname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_responsible_lastname">Verantwortlicher Nachname</Label>
            <Input
              id="measure_responsible_lastname"
              value={fields.measure_responsible_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_responsible_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_responsible_email">Verantwortlicher E-Mail</Label>
            <Input
              id="measure_responsible_email"
              type="email"
              value={fields.measure_responsible_email ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_responsible_email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_due_date">Fälligkeitsdatum</Label>
            <Input
              id="measure_due_date"
              type="date"
              value={fields.measure_due_date ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_due_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_completion_date">Umsetzungsdatum (tatsächlich)</Label>
            <Input
              id="measure_completion_date"
              type="date"
              value={fields.measure_completion_date ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_completion_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_status">Umsetzungsstatus</Label>
            <Select
              value={lookupKey(fields.measure_status) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, measure_status: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="measure_status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="geplant">Geplant</SelectItem>
                <SelectItem value="in_umsetzung">In Umsetzung</SelectItem>
                <SelectItem value="umgesetzt">Umgesetzt</SelectItem>
                <SelectItem value="nicht_umgesetzt">Nicht umgesetzt</SelectItem>
                <SelectItem value="entfaellt">Entfällt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_effectiveness">Wirksamkeit</Label>
            <Select
              value={lookupKey(fields.measure_effectiveness) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, measure_effectiveness: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="measure_effectiveness"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="nicht_bewertet">Nicht bewertet</SelectItem>
                <SelectItem value="wirksam">Wirksam</SelectItem>
                <SelectItem value="teilweise_wirksam">Teilweise wirksam</SelectItem>
                <SelectItem value="nicht_wirksam">Nicht wirksam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="measure_notes">Anmerkungen</Label>
            <Textarea
              id="measure_notes"
              value={fields.measure_notes ?? ''}
              onChange={e => setFields(f => ({ ...f, measure_notes: e.target.value }))}
              rows={3}
            />
          </div>

          <altcha-widget
            ref={captchaRef as any}
            challengeurl={`${PROXY_BASE}/api/_challenge?path=${encodeURIComponent(SUBMIT_PATH)}`}
            auto="onsubmit"
            hidefooter
          />

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
