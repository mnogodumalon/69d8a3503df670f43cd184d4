import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lieferantenmanagement } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconCamera, IconCircleCheck, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromPhoto, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

interface LieferantenmanagementDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Lieferantenmanagement['fields']) => Promise<void>;
  defaultValues?: Lieferantenmanagement['fields'];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function LieferantenmanagementDialog({ open, onClose, onSubmit, defaultValues, enablePhotoScan = true, enablePhotoLocation = true }: LieferantenmanagementDialogProps) {
  const [fields, setFields] = useState<Partial<Lieferantenmanagement['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFields(defaultValues ?? {});
      setPreview(null);
      setScanSuccess(false);
    }
  }, [open, defaultValues]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const clean = cleanFieldsForApi({ ...fields }, 'lieferantenmanagement');
      await onSubmit(clean as Lieferantenmanagement['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    setScanSuccess(false);
    try {
      const [uri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
      if (file.type.startsWith('image/')) setPreview(uri);
      const gps = enablePhotoLocation ? meta?.gps ?? null : null;
      const parts: string[] = [];
      let geoAddr = '';
      if (gps) {
        geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
        parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
        if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
      }
      if (meta?.dateTime) {
        parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "supplier_housenumber": string | null, // Hausnummer\n  "supplier_postal": string | null, // Postleitzahl\n  "supplier_city": string | null, // Stadt\n  "supplier_country": string | null, // Land\n  "supplier_criticality": LookupValue | null, // Kritikalität (select one key: "kritisch" | "hoch" | "mittel" | "niedrig") mapping: kritisch=Kritisch, hoch=Hoch, mittel=Mittel, niedrig=Niedrig\n  "supplier_risk_score": number | null, // Risikoscore (0-100)\n  "supplier_last_assessment": string | null, // YYYY-MM-DD\n  "supplier_next_assessment": string | null, // YYYY-MM-DD\n  "supplier_contract_exists": boolean | null, // Vertrag vorhanden\n  "supplier_dpa_exists": boolean | null, // Auftragsverarbeitungsvertrag (AVV) vorhanden\n  "supplier_iso_certified": boolean | null, // ISO 27001 zertifiziert\n  "supplier_status": LookupValue | null, // Status (select one key: "aktiv" | "in_pruefung" | "gesperrt" | "inaktiv") mapping: aktiv=Aktiv, in_pruefung=In Prüfung, gesperrt=Gesperrt, inaktiv=Inaktiv\n  "supplier_notes": string | null, // Anmerkungen\n  "supplier_name": string | null, // Unternehmensname\n  "supplier_id_intern": string | null, // Interne Lieferanten-ID\n  "supplier_category": LookupValue | null, // Lieferantenkategorie (select one key: "it" | "cloud" | "software" | "hardware" | "beratung" | "telko" | "sonstiges") mapping: it=IT-Dienstleister, cloud=Cloud-Anbieter, software=Softwareanbieter, hardware=Hardwarelieferant, beratung=Beratung, telko=Telekommunikation, sonstiges=Sonstiges\n  "supplier_contact_firstname": string | null, // Ansprechpartner Vorname\n  "supplier_contact_lastname": string | null, // Ansprechpartner Nachname\n  "supplier_contact_email": string | null, // Ansprechpartner E-Mail\n  "supplier_contact_tel": string | null, // Ansprechpartner Telefon\n  "supplier_street": string | null, // Straße\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema, photoContext, DIALOG_INTENT);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        for (const [k, v] of Object.entries(raw)) {
          if (v != null) merged[k] = v;
        }
        return merged as Partial<Lieferantenmanagement['fields']>;
      });
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handlePhotoScan(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handlePhotoScan(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues ? 'Lieferantenmanagement bearbeiten' : 'Lieferantenmanagement hinzufügen';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DIALOG_INTENT}</DialogTitle>
        </DialogHeader>

        {enablePhotoScan && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                <IconSparkles className="h-4 w-4 text-primary" />
                KI-Assistent
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Versteht deine Fotos / Dokumente und füllt alles für dich aus</p>
            </div>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  KI-Assistent darf zusätzlich Informationen zu meiner Person verwenden
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? 'Lade...' : '(mehr Infos)'}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">Folgende Infos über dich können von der KI genutzt werden:</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">Profil konnte nicht geladen werden</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">KI analysiert...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Felder werden automatisch ausgefüllt</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Felder ausgefüllt!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Prüfe die Werte und passe sie ggf. an</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Foto oder Dokument hierher ziehen oder auswählen</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1.5" />Kamera
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1.5" />Foto wählen
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1.5" />Dokument
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}