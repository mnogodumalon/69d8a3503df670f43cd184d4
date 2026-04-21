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
const APP_ID = '69d8a2cdd093755ffa3afc64';
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

export default function PublicFormRisikomanagement() {
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
          <h1 className="text-2xl font-bold text-foreground">Risikomanagement — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="risk_description">Risikobeschreibung</Label>
            <Textarea
              id="risk_description"
              value={fields.risk_description ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_category">Risikokategorie</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_category_infosec"
                  checked={lookupKeys(fields.risk_category).includes('infosec')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risk_category);
                      const next = checked ? [...current, 'infosec'] : current.filter(k => k !== 'infosec');
                      return { ...f, risk_category: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risk_category_infosec" className="font-normal">Informationssicherheit</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_category_datenschutz"
                  checked={lookupKeys(fields.risk_category).includes('datenschutz')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risk_category);
                      const next = checked ? [...current, 'datenschutz'] : current.filter(k => k !== 'datenschutz');
                      return { ...f, risk_category: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risk_category_datenschutz" className="font-normal">Datenschutz</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_category_betrieb"
                  checked={lookupKeys(fields.risk_category).includes('betrieb')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risk_category);
                      const next = checked ? [...current, 'betrieb'] : current.filter(k => k !== 'betrieb');
                      return { ...f, risk_category: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risk_category_betrieb" className="font-normal">Betriebsrisiko</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_category_compliance"
                  checked={lookupKeys(fields.risk_category).includes('compliance')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risk_category);
                      const next = checked ? [...current, 'compliance'] : current.filter(k => k !== 'compliance');
                      return { ...f, risk_category: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risk_category_compliance" className="font-normal">Compliance</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_category_drittpartei"
                  checked={lookupKeys(fields.risk_category).includes('drittpartei')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risk_category);
                      const next = checked ? [...current, 'drittpartei'] : current.filter(k => k !== 'drittpartei');
                      return { ...f, risk_category: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risk_category_drittpartei" className="font-normal">Drittpartei / Lieferant</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_category_physisch"
                  checked={lookupKeys(fields.risk_category).includes('physisch')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risk_category);
                      const next = checked ? [...current, 'physisch'] : current.filter(k => k !== 'physisch');
                      return { ...f, risk_category: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risk_category_physisch" className="font-normal">Physische Sicherheit</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_category_personal"
                  checked={lookupKeys(fields.risk_category).includes('personal')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risk_category);
                      const next = checked ? [...current, 'personal'] : current.filter(k => k !== 'personal');
                      return { ...f, risk_category: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risk_category_personal" className="font-normal">Personalrisiko</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_category_sonstiges"
                  checked={lookupKeys(fields.risk_category).includes('sonstiges')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risk_category);
                      const next = checked ? [...current, 'sonstiges'] : current.filter(k => k !== 'sonstiges');
                      return { ...f, risk_category: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risk_category_sonstiges" className="font-normal">Sonstiges</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_asset">Betroffenes Asset</Label>
            <Input
              id="risk_asset"
              value={fields.risk_asset ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_asset: e.target.value }))}
              placeholder="Record URL"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_org_unit">Betroffene Organisationseinheiten</Label>
            <Input
              id="risk_org_unit"
              value={fields.risk_org_unit ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_org_unit: e.target.value }))}
              placeholder="Record URL"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_probability">Eintrittswahrscheinlichkeit</Label>
            <Select
              value={lookupKey(fields.risk_probability) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_probability: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_probability"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="p1">1 – Sehr gering</SelectItem>
                <SelectItem value="p2">2 – Gering</SelectItem>
                <SelectItem value="p3">3 – Mittel</SelectItem>
                <SelectItem value="p4">4 – Hoch</SelectItem>
                <SelectItem value="p5">5 – Sehr hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_impact">Schadensausmaß</Label>
            <Select
              value={lookupKey(fields.risk_impact) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_impact: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_impact"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="i1">1 – Sehr gering</SelectItem>
                <SelectItem value="i2">2 – Gering</SelectItem>
                <SelectItem value="i3">3 – Mittel</SelectItem>
                <SelectItem value="i4">4 – Hoch</SelectItem>
                <SelectItem value="i5">5 – Sehr hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_score_brutto">Risikoscore Brutto (berechnet)</Label>
            <Input
              id="risk_score_brutto"
              type="number"
              value={fields.risk_score_brutto ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_score_brutto: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_treatment">Risikobehandlung</Label>
            <Select
              value={lookupKey(fields.risk_treatment) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_treatment: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_treatment"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="reduzieren">Reduzieren</SelectItem>
                <SelectItem value="akzeptieren">Akzeptieren</SelectItem>
                <SelectItem value="vermeiden">Vermeiden</SelectItem>
                <SelectItem value="uebertragen">Übertragen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_probability_netto">Eintrittswahrscheinlichkeit (Netto)</Label>
            <Select
              value={lookupKey(fields.risk_probability_netto) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_probability_netto: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_probability_netto"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="p1">1 – Sehr gering</SelectItem>
                <SelectItem value="p2">2 – Gering</SelectItem>
                <SelectItem value="p3">3 – Mittel</SelectItem>
                <SelectItem value="p4">4 – Hoch</SelectItem>
                <SelectItem value="p5">5 – Sehr hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_confidentiality">Vertraulichkeit</Label>
            <Select
              value={lookupKey(fields.risk_confidentiality) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_confidentiality: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_confidentiality"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="gering">Gering</SelectItem>
                <SelectItem value="mittel">Mittel</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_integrity">Integrität</Label>
            <Select
              value={lookupKey(fields.risk_integrity) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_integrity: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_integrity"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="gering">Gering</SelectItem>
                <SelectItem value="mittel">Mittel</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_availability">Verfügbarkeit</Label>
            <Select
              value={lookupKey(fields.risk_availability) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_availability: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_availability"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="gering">Gering</SelectItem>
                <SelectItem value="mittel">Mittel</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_impact_netto">Schadensausmaß (Netto)</Label>
            <Select
              value={lookupKey(fields.risk_impact_netto) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_impact_netto: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_impact_netto"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="i1">1 – Sehr gering</SelectItem>
                <SelectItem value="i2">2 – Gering</SelectItem>
                <SelectItem value="i3">3 – Mittel</SelectItem>
                <SelectItem value="i4">4 – Hoch</SelectItem>
                <SelectItem value="i5">5 – Sehr hoch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_owner_firstname">Risikoverantwortlicher Vorname</Label>
            <Input
              id="risk_owner_firstname"
              value={fields.risk_owner_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_owner_firstname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_owner_lastname">Risikoverantwortlicher Nachname</Label>
            <Input
              id="risk_owner_lastname"
              value={fields.risk_owner_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_owner_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_review_date">Nächstes Review-Datum</Label>
            <Input
              id="risk_review_date"
              type="date"
              value={fields.risk_review_date ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_review_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_status">Status</Label>
            <Select
              value={lookupKey(fields.risk_status) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_status: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="risk_status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="in_behandlung">In Behandlung</SelectItem>
                <SelectItem value="akzeptiert">Akzeptiert</SelectItem>
                <SelectItem value="geschlossen">Geschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_notes">Anmerkungen</Label>
            <Textarea
              id="risk_notes"
              value={fields.risk_notes ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_notes: e.target.value }))}
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
