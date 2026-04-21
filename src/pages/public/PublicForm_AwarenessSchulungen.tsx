import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { lookupKey, lookupKeys } from '@/lib/formatters';

// Empty PROXY_BASE → relative URLs (dashboard and form-proxy share the domain).
const PROXY_BASE = '';
const APP_ID = '69d8a2daf82a6e90d0765807';
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

export default function PublicFormAwarenessSchulungen() {
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
          <h1 className="text-2xl font-bold text-foreground">Awareness & Schulungen — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="training_title">Titel der Schulung</Label>
            <Input
              id="training_title"
              value={fields.training_title ?? ''}
              onChange={e => setFields(f => ({ ...f, training_title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_type">Schulungstyp</Label>
            <Select
              value={lookupKey(fields.training_type) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, training_type: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="training_type"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="pflicht">Pflichtschulung</SelectItem>
                <SelectItem value="awareness">Awareness-Kampagne</SelectItem>
                <SelectItem value="technisch">Technische Schulung</SelectItem>
                <SelectItem value="fuehrung">Führungskräfteschulung</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="phishing">Phishing-Simulation</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_target_group">Zielgruppe</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="training_target_group_alle"
                  checked={lookupKeys(fields.training_target_group).includes('alle')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.training_target_group);
                      const next = checked ? [...current, 'alle'] : current.filter(k => k !== 'alle');
                      return { ...f, training_target_group: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="training_target_group_alle" className="font-normal">Alle Mitarbeiter</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="training_target_group_it"
                  checked={lookupKeys(fields.training_target_group).includes('it')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.training_target_group);
                      const next = checked ? [...current, 'it'] : current.filter(k => k !== 'it');
                      return { ...f, training_target_group: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="training_target_group_it" className="font-normal">IT-Personal</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="training_target_group_fuehrung"
                  checked={lookupKeys(fields.training_target_group).includes('fuehrung')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.training_target_group);
                      const next = checked ? [...current, 'fuehrung'] : current.filter(k => k !== 'fuehrung');
                      return { ...f, training_target_group: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="training_target_group_fuehrung" className="font-normal">Führungskräfte</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="training_target_group_neu"
                  checked={lookupKeys(fields.training_target_group).includes('neu')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.training_target_group);
                      const next = checked ? [...current, 'neu'] : current.filter(k => k !== 'neu');
                      return { ...f, training_target_group: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="training_target_group_neu" className="font-normal">Neue Mitarbeiter</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="training_target_group_admin"
                  checked={lookupKeys(fields.training_target_group).includes('admin')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.training_target_group);
                      const next = checked ? [...current, 'admin'] : current.filter(k => k !== 'admin');
                      return { ...f, training_target_group: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="training_target_group_admin" className="font-normal">Administratoren</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="training_target_group_fach"
                  checked={lookupKeys(fields.training_target_group).includes('fach')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.training_target_group);
                      const next = checked ? [...current, 'fach'] : current.filter(k => k !== 'fach');
                      return { ...f, training_target_group: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="training_target_group_fach" className="font-normal">Fachverantwortliche</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_start_date">Startdatum</Label>
            <Input
              id="training_start_date"
              type="date"
              value={fields.training_start_date ?? ''}
              onChange={e => setFields(f => ({ ...f, training_start_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_end_date">Enddatum</Label>
            <Input
              id="training_end_date"
              type="date"
              value={fields.training_end_date ?? ''}
              onChange={e => setFields(f => ({ ...f, training_end_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_responsible_firstname">Verantwortlicher Vorname</Label>
            <Input
              id="training_responsible_firstname"
              value={fields.training_responsible_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, training_responsible_firstname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_responsible_lastname">Verantwortlicher Nachname</Label>
            <Input
              id="training_responsible_lastname"
              value={fields.training_responsible_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, training_responsible_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_participants_count">Anzahl Teilnehmer (geplant)</Label>
            <Input
              id="training_participants_count"
              type="number"
              value={fields.training_participants_count ?? ''}
              onChange={e => setFields(f => ({ ...f, training_participants_count: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_completion_rate">Abschlussquote (%)</Label>
            <Input
              id="training_completion_rate"
              type="number"
              value={fields.training_completion_rate ?? ''}
              onChange={e => setFields(f => ({ ...f, training_completion_rate: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_status">Status</Label>
            <Select
              value={lookupKey(fields.training_status) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, training_status: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="training_status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="geplant">Geplant</SelectItem>
                <SelectItem value="aktiv">Aktiv</SelectItem>
                <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                <SelectItem value="abgebrochen">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_notes">Anmerkungen</Label>
            <Textarea
              id="training_notes"
              value={fields.training_notes ?? ''}
              onChange={e => setFields(f => ({ ...f, training_notes: e.target.value }))}
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
