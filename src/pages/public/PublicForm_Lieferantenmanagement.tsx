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
  const res = await fetch(`${KLAR_BASE}/public/69d8a3503df670f43cd184d4/69d8a2d5e0de8095025ba835/submit`, {
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

export default function PublicFormLieferantenmanagement() {
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
          <h1 className="text-2xl font-bold text-foreground">Lieferantenmanagement — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="supplier_housenumber">Hausnummer</Label>
            <Input
              id="supplier_housenumber"
              value={fields.supplier_housenumber ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_housenumber: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_postal">Postleitzahl</Label>
            <Input
              id="supplier_postal"
              value={fields.supplier_postal ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_postal: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_city">Stadt</Label>
            <Input
              id="supplier_city"
              value={fields.supplier_city ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_city: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_country">Land</Label>
            <Input
              id="supplier_country"
              value={fields.supplier_country ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_country: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_criticality">Kritikalität</Label>
            <Select
              value={lookupKey(fields.supplier_criticality) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, supplier_criticality: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="supplier_criticality"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="supplier_risk_score">Risikoscore (0-100)</Label>
            <Input
              id="supplier_risk_score"
              type="number"
              value={fields.supplier_risk_score ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_risk_score: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_last_assessment">Letzte Risikobewertung</Label>
            <Input
              id="supplier_last_assessment"
              type="date"
              value={fields.supplier_last_assessment ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_last_assessment: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_next_assessment">Nächste Risikobewertung</Label>
            <Input
              id="supplier_next_assessment"
              type="date"
              value={fields.supplier_next_assessment ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_next_assessment: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_contract_exists">Vertrag vorhanden</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="supplier_contract_exists"
                checked={!!fields.supplier_contract_exists}
                onCheckedChange={(v) => setFields(f => ({ ...f, supplier_contract_exists: !!v }))}
              />
              <Label htmlFor="supplier_contract_exists" className="font-normal">Vertrag vorhanden</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_dpa_exists">Auftragsverarbeitungsvertrag (AVV) vorhanden</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="supplier_dpa_exists"
                checked={!!fields.supplier_dpa_exists}
                onCheckedChange={(v) => setFields(f => ({ ...f, supplier_dpa_exists: !!v }))}
              />
              <Label htmlFor="supplier_dpa_exists" className="font-normal">Auftragsverarbeitungsvertrag (AVV) vorhanden</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_iso_certified">ISO 27001 zertifiziert</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="supplier_iso_certified"
                checked={!!fields.supplier_iso_certified}
                onCheckedChange={(v) => setFields(f => ({ ...f, supplier_iso_certified: !!v }))}
              />
              <Label htmlFor="supplier_iso_certified" className="font-normal">ISO 27001 zertifiziert</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_status">Status</Label>
            <Select
              value={lookupKey(fields.supplier_status) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, supplier_status: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="supplier_status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="aktiv">Aktiv</SelectItem>
                <SelectItem value="in_pruefung">In Prüfung</SelectItem>
                <SelectItem value="gesperrt">Gesperrt</SelectItem>
                <SelectItem value="inaktiv">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_notes">Anmerkungen</Label>
            <Textarea
              id="supplier_notes"
              value={fields.supplier_notes ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_notes: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_name">Unternehmensname</Label>
            <Input
              id="supplier_name"
              value={fields.supplier_name ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_id_intern">Interne Lieferanten-ID</Label>
            <Input
              id="supplier_id_intern"
              value={fields.supplier_id_intern ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_id_intern: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_category">Lieferantenkategorie</Label>
            <Select
              value={lookupKey(fields.supplier_category) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, supplier_category: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="supplier_category"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="it">IT-Dienstleister</SelectItem>
                <SelectItem value="cloud">Cloud-Anbieter</SelectItem>
                <SelectItem value="software">Softwareanbieter</SelectItem>
                <SelectItem value="hardware">Hardwarelieferant</SelectItem>
                <SelectItem value="beratung">Beratung</SelectItem>
                <SelectItem value="telko">Telekommunikation</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_contact_firstname">Ansprechpartner Vorname</Label>
            <Input
              id="supplier_contact_firstname"
              value={fields.supplier_contact_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_contact_firstname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_contact_lastname">Ansprechpartner Nachname</Label>
            <Input
              id="supplier_contact_lastname"
              value={fields.supplier_contact_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_contact_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_contact_email">Ansprechpartner E-Mail</Label>
            <Input
              id="supplier_contact_email"
              type="email"
              value={fields.supplier_contact_email ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_contact_email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_contact_tel">Ansprechpartner Telefon</Label>
            <Input
              id="supplier_contact_tel"
              value={fields.supplier_contact_tel ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_contact_tel: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier_street">Straße</Label>
            <Input
              id="supplier_street"
              value={fields.supplier_street ?? ''}
              onChange={e => setFields(f => ({ ...f, supplier_street: e.target.value }))}
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
