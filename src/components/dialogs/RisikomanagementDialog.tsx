import { useState, useEffect, useRef, useCallback } from 'react';
import type { Risikomanagement, AssetRegister, Organisationseinheiten } from '@/types/app';
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
import { lookupKey, lookupKeys } from '@/lib/formatters';

interface RisikomanagementDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Risikomanagement['fields']) => Promise<void>;
  defaultValues?: Risikomanagement['fields'];
  asset_registerList: AssetRegister[];
  organisationseinheitenList: Organisationseinheiten[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function RisikomanagementDialog({ open, onClose, onSubmit, defaultValues, asset_registerList, organisationseinheitenList, enablePhotoScan = true, enablePhotoLocation = true }: RisikomanagementDialogProps) {
  const [fields, setFields] = useState<Partial<Risikomanagement['fields']>>({});
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
      const clean = cleanFieldsForApi({ ...fields }, 'risikomanagement');
      await onSubmit(clean as Risikomanagement['fields']);
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
      contextParts.push(`<available-records field="risk_asset" entity="Asset-Register">\n${JSON.stringify(asset_registerList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="risk_org_unit" entity="Organisationseinheiten">\n${JSON.stringify(organisationseinheitenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "risk_title": string | null, // Risikobezeichnung\n  "risk_description": string | null, // Risikobeschreibung\n  "risk_category": LookupValue[] | null, // Risikokategorie (select one or more keys: "infosec" | "datenschutz" | "betrieb" | "compliance" | "drittpartei" | "physisch" | "personal" | "sonstiges") mapping: infosec=Informationssicherheit, datenschutz=Datenschutz, betrieb=Betriebsrisiko, compliance=Compliance, drittpartei=Drittpartei / Lieferant, physisch=Physische Sicherheit, personal=Personalrisiko, sonstiges=Sonstiges\n  "risk_asset": string | null, // Display name from Asset-Register (see <available-records>)\n  "risk_org_unit": string | null, // Display name from Organisationseinheiten (see <available-records>)\n  "risk_probability": LookupValue | null, // Eintrittswahrscheinlichkeit (select one key: "p1" | "p2" | "p3" | "p4" | "p5") mapping: p1=1 – Sehr gering, p2=2 – Gering, p3=3 – Mittel, p4=4 – Hoch, p5=5 – Sehr hoch\n  "risk_impact": LookupValue | null, // Schadensausmaß (select one key: "i1" | "i2" | "i3" | "i4" | "i5") mapping: i1=1 – Sehr gering, i2=2 – Gering, i3=3 – Mittel, i4=4 – Hoch, i5=5 – Sehr hoch\n  "risk_score_brutto": number | null, // Risikoscore Brutto (berechnet)\n  "risk_treatment": LookupValue | null, // Risikobehandlung (select one key: "reduzieren" | "akzeptieren" | "vermeiden" | "uebertragen") mapping: reduzieren=Reduzieren, akzeptieren=Akzeptieren, vermeiden=Vermeiden, uebertragen=Übertragen\n  "risk_probability_netto": LookupValue | null, // Eintrittswahrscheinlichkeit (Netto) (select one key: "p1" | "p2" | "p3" | "p4" | "p5") mapping: p1=1 – Sehr gering, p2=2 – Gering, p3=3 – Mittel, p4=4 – Hoch, p5=5 – Sehr hoch\n  "risk_confidentiality": LookupValue | null, // Vertraulichkeit (select one key: "gering" | "mittel" | "hoch") mapping: gering=Gering, mittel=Mittel, hoch=Hoch\n  "risk_integrity": LookupValue | null, // Integrität (select one key: "gering" | "hoch" | "mittel") mapping: gering=Gering, hoch=Hoch, mittel=Mittel\n  "risk_availability": LookupValue | null, // Verfügbarkeit (select one key: "gering" | "mittel" | "hoch") mapping: gering=Gering, mittel=Mittel, hoch=Hoch\n  "risk_impact_netto": LookupValue | null, // Schadensausmaß (Netto) (select one key: "i1" | "i2" | "i3" | "i4" | "i5") mapping: i1=1 – Sehr gering, i2=2 – Gering, i3=3 – Mittel, i4=4 – Hoch, i5=5 – Sehr hoch\n  "risk_owner_firstname": string | null, // Risikoverantwortlicher Vorname\n  "risk_owner_lastname": string | null, // Risikoverantwortlicher Nachname\n  "risk_review_date": string | null, // YYYY-MM-DD\n  "risk_status": LookupValue | null, // Status (select one key: "offen" | "in_behandlung" | "akzeptiert" | "geschlossen") mapping: offen=Offen, in_behandlung=In Behandlung, akzeptiert=Akzeptiert, geschlossen=Geschlossen\n  "risk_notes": string | null, // Anmerkungen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema, photoContext, DIALOG_INTENT);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["risk_asset", "risk_org_unit"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const risk_assetName = raw['risk_asset'] as string | null;
        if (risk_assetName) {
          const risk_assetMatch = asset_registerList.find(r => matchName(risk_assetName!, [String(r.fields.asset_name ?? '')]));
          if (risk_assetMatch) merged['risk_asset'] = createRecordUrl(APP_IDS.ASSET_REGISTER, risk_assetMatch.record_id);
        }
        const risk_org_unitName = raw['risk_org_unit'] as string | null;
        if (risk_org_unitName) {
          const risk_org_unitMatch = organisationseinheitenList.find(r => matchName(risk_org_unitName!, [String(r.fields.org_housenumber ?? '')]));
          if (risk_org_unitMatch) merged['risk_org_unit'] = createRecordUrl(APP_IDS.ORGANISATIONSEINHEITEN, risk_org_unitMatch.record_id);
        }
        return merged as Partial<Risikomanagement['fields']>;
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

  const DIALOG_INTENT = defaultValues ? 'Risikomanagement bearbeiten' : 'Risikomanagement hinzufügen';

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
            <Label htmlFor="risk_title">Risikobezeichnung</Label>
            <Input
              id="risk_title"
              value={fields.risk_title ?? ''}
              onChange={e => setFields(f => ({ ...f, risk_title: e.target.value }))}
            />
          </div>
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
            <Label htmlFor="risk_asset">Betroffene Assets</Label>
            <Select
              value={extractRecordId(fields.risk_asset) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_asset: v === 'none' ? undefined : createRecordUrl(APP_IDS.ASSET_REGISTER, v) }))}
            >
              <SelectTrigger id="risk_asset"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {asset_registerList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.asset_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_org_unit">Betroffene Organisationseinheiten</Label>
            <Select
              value={extractRecordId(fields.risk_org_unit) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, risk_org_unit: v === 'none' ? undefined : createRecordUrl(APP_IDS.ORGANISATIONSEINHEITEN, v) }))}
            >
              <SelectTrigger id="risk_org_unit"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {organisationseinheitenList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.org_housenumber ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="mittel">Mittel</SelectItem>
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