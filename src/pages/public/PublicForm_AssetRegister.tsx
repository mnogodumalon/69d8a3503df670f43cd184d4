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
const APP_ID = '69d8a2cb92e804d39a7888eb';
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

export default function PublicFormAssetRegister() {
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
          <h1 className="text-2xl font-bold text-foreground">Asset-Register — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="asset_name">Asset-Bezeichnung</Label>
            <Input
              id="asset_name"
              value={fields.asset_name ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_id_intern">Interne Asset-ID</Label>
            <Input
              id="asset_id_intern"
              value={fields.asset_id_intern ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_id_intern: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_category">Asset-Kategorie</Label>
            <Select
              value={lookupKey(fields.asset_category) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, asset_category: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="asset_category"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="daten">Daten / Information</SelectItem>
                <SelectItem value="dienst">Dienst / Service</SelectItem>
                <SelectItem value="prozess">Prozess</SelectItem>
                <SelectItem value="person">Person / Rolle</SelectItem>
                <SelectItem value="gebaeude">Gebäude / Infrastruktur</SelectItem>
                <SelectItem value="lieferant">Lieferant / Drittpartei</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_type">Asset-Typ</Label>
            <Input
              id="asset_type"
              value={fields.asset_type ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_type: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_owner_firstname">Asset-Owner Vorname</Label>
            <Input
              id="asset_owner_firstname"
              value={fields.asset_owner_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_owner_firstname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_owner_lastname">Asset-Owner Nachname</Label>
            <Input
              id="asset_owner_lastname"
              value={fields.asset_owner_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_owner_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_owner_email">Asset-Owner E-Mail</Label>
            <Input
              id="asset_owner_email"
              type="email"
              value={fields.asset_owner_email ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_owner_email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_classification">Schutzbedarfsklasse</Label>
            <Select
              value={lookupKey(fields.asset_classification) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, asset_classification: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="asset_classification"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="sehr_hoch">Sehr hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_confidentiality">Vertraulichkeit</Label>
            <Select
              value={lookupKey(fields.asset_confidentiality) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, asset_confidentiality: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="asset_confidentiality"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="oeffentlich">Öffentlich</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
                <SelectItem value="vertraulich">Vertraulich</SelectItem>
                <SelectItem value="streng_vertraulich">Streng vertraulich</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_integrity">Integrität</Label>
            <Select
              value={lookupKey(fields.asset_integrity) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, asset_integrity: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="asset_integrity"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="sehr_hoch">Sehr hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_availability">Verfügbarkeit</Label>
            <Select
              value={lookupKey(fields.asset_availability) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, asset_availability: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="asset_availability"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="sehr_hoch">Sehr hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_location">Standort / Betriebsort</Label>
            <Input
              id="asset_location"
              value={fields.asset_location ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_location: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_description">Beschreibung</Label>
            <Textarea
              id="asset_description"
              value={fields.asset_description ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_status">Status</Label>
            <Select
              value={lookupKey(fields.asset_status) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, asset_status: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="asset_status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="in_betrieb">In Betrieb</SelectItem>
                <SelectItem value="in_planung">In Planung</SelectItem>
                <SelectItem value="ausser_betrieb">Außer Betrieb</SelectItem>
                <SelectItem value="archiviert">Archiviert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_purchase_date">Anschaffungsdatum</Label>
            <Input
              id="asset_purchase_date"
              type="date"
              value={fields.asset_purchase_date ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_purchase_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset_review_date">Nächstes Review-Datum</Label>
            <Input
              id="asset_review_date"
              type="date"
              value={fields.asset_review_date ?? ''}
              onChange={e => setFields(f => ({ ...f, asset_review_date: e.target.value }))}
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
