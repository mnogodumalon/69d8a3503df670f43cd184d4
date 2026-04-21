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
const APP_ID = '69d8a2d9b9e5933137ed98cb';
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

export default function PublicFormBcmNotfallmanagement() {
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
          <h1 className="text-2xl font-bold text-foreground">BCM & Notfallmanagement — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="bcm_title">Bezeichnung</Label>
            <Input
              id="bcm_title"
              value={fields.bcm_title ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_type">Typ</Label>
            <Select
              value={lookupKey(fields.bcm_type) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, bcm_type: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="bcm_type"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="bcp">Business Continuity Plan (BCP)</SelectItem>
                <SelectItem value="drp">Disaster Recovery Plan (DRP)</SelectItem>
                <SelectItem value="bia">Business Impact Analyse (BIA)</SelectItem>
                <SelectItem value="uebung">Notfallübung</SelectItem>
                <SelectItem value="prozess">Kritischer Prozess</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_scope">Geltungsbereich</Label>
            <Textarea
              id="bcm_scope"
              value={fields.bcm_scope ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_scope: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_rto">Recovery Time Objective (RTO)</Label>
            <Input
              id="bcm_rto"
              value={fields.bcm_rto ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_rto: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_rpo">Recovery Point Objective (RPO)</Label>
            <Input
              id="bcm_rpo"
              value={fields.bcm_rpo ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_rpo: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_responsible_firstname">Verantwortlicher Vorname</Label>
            <Input
              id="bcm_responsible_firstname"
              value={fields.bcm_responsible_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_responsible_firstname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_responsible_lastname">Verantwortlicher Nachname</Label>
            <Input
              id="bcm_responsible_lastname"
              value={fields.bcm_responsible_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_responsible_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_last_test_date">Letzter Test / Übung</Label>
            <Input
              id="bcm_last_test_date"
              type="date"
              value={fields.bcm_last_test_date ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_last_test_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_next_test_date">Nächster Test / Übung</Label>
            <Input
              id="bcm_next_test_date"
              type="date"
              value={fields.bcm_next_test_date ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_next_test_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_status">Status</Label>
            <Select
              value={lookupKey(fields.bcm_status) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, bcm_status: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="bcm_status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="entwurf">Entwurf</SelectItem>
                <SelectItem value="freigegeben">Freigegeben</SelectItem>
                <SelectItem value="in_ueberarbeitung">In Überarbeitung</SelectItem>
                <SelectItem value="archiviert">Archiviert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcm_notes">Anmerkungen</Label>
            <Textarea
              id="bcm_notes"
              value={fields.bcm_notes ?? ''}
              onChange={e => setFields(f => ({ ...f, bcm_notes: e.target.value }))}
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
