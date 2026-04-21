import { useState, useEffect, useRef, useCallback } from 'react';
import type { AssetRegister, Organisationseinheiten } from '@/types/app';
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
import { IconArrowBigDownLinesFilled, IconCamera, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

interface AssetRegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: AssetRegister['fields']) => Promise<void>;
  defaultValues?: AssetRegister['fields'];
  organisationseinheitenList: Organisationseinheiten[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function AssetRegisterDialog({ open, onClose, onSubmit, defaultValues, organisationseinheitenList, enablePhotoScan = true, enablePhotoLocation = true }: AssetRegisterDialogProps) {
  const [fields, setFields] = useState<Partial<AssetRegister['fields']>>({});
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
  const [aiText, setAiText] = useState('');

  useEffect(() => {
    if (open) {
      setFields(defaultValues ?? {});
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
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
      const clean = cleanFieldsForApi({ ...fields }, 'asset_register');
      await onSubmit(clean as AssetRegister['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="asset_org_unit" entity="Organisationseinheiten">\n${JSON.stringify(organisationseinheitenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "asset_name": string | null, // Asset-Bezeichnung\n  "asset_id_intern": string | null, // Interne Asset-ID\n  "asset_category": LookupValue | null, // Asset-Kategorie (select one key: "hardware" | "software" | "daten" | "dienst" | "prozess" | "person" | "gebaeude" | "lieferant") mapping: hardware=Hardware, software=Software, daten=Daten / Information, dienst=Dienst / Service, prozess=Prozess, person=Person / Rolle, gebaeude=Gebäude / Infrastruktur, lieferant=Lieferant / Drittpartei\n  "asset_type": string | null, // Asset-Typ\n  "asset_owner_firstname": string | null, // Asset-Owner Vorname\n  "asset_owner_lastname": string | null, // Asset-Owner Nachname\n  "asset_owner_email": string | null, // Asset-Owner E-Mail\n  "asset_classification": LookupValue | null, // Schutzbedarfsklasse (select one key: "normal" | "hoch" | "sehr_hoch") mapping: normal=Normal, hoch=Hoch, sehr_hoch=Sehr hoch\n  "asset_confidentiality": LookupValue | null, // Vertraulichkeit (select one key: "oeffentlich" | "intern" | "vertraulich" | "streng_vertraulich") mapping: oeffentlich=Öffentlich, intern=Intern, vertraulich=Vertraulich, streng_vertraulich=Streng vertraulich\n  "asset_integrity": LookupValue | null, // Integrität (select one key: "normal" | "hoch" | "sehr_hoch") mapping: normal=Normal, hoch=Hoch, sehr_hoch=Sehr hoch\n  "asset_availability": LookupValue | null, // Verfügbarkeit (select one key: "normal" | "hoch" | "sehr_hoch") mapping: normal=Normal, hoch=Hoch, sehr_hoch=Sehr hoch\n  "asset_location": string | null, // Standort / Betriebsort\n  "asset_org_unit": string | null, // Display name from Organisationseinheiten (see <available-records>)\n  "asset_description": string | null, // Beschreibung\n  "asset_status": LookupValue | null, // Status (select one key: "in_betrieb" | "in_planung" | "ausser_betrieb" | "archiviert") mapping: in_betrieb=In Betrieb, in_planung=In Planung, ausser_betrieb=Außer Betrieb, archiviert=Archiviert\n  "asset_purchase_date": string | null, // YYYY-MM-DD\n  "asset_review_date": string | null, // YYYY-MM-DD\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["asset_org_unit"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const asset_org_unitName = raw['asset_org_unit'] as string | null;
        if (asset_org_unitName) {
          const asset_org_unitMatch = organisationseinheitenList.find(r => matchName(asset_org_unitName!, [String(r.fields.org_housenumber ?? '')]));
          if (asset_org_unitMatch) merged['asset_org_unit'] = createRecordUrl(APP_IDS.ORGANISATIONSEINHEITEN, asset_org_unitMatch.record_id);
        }
        return merged as Partial<AssetRegister['fields']>;
      });
      setAiText('');
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
    if (f) handleAiExtract(f);
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
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues ? 'Asset-Register bearbeiten' : 'Asset-Register hinzufügen';

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
              <p className="text-xs text-muted-foreground mt-0.5">Versteht Fotos, Dokumente und Text und füllt alles für dich aus</p>
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

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />Kamera
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />Foto wählen
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />Dokument
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder="Text eingeben oder einfügen, z.B. Notizen, E-Mails, Beschreibungen..."
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title="Paste"
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />Analysieren
              </Button>
            )}
            <div className="flex justify-center pt-1">
              <IconArrowBigDownLinesFilled className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="asset_org_unit">Organisationseinheit</Label>
            <Select
              value={extractRecordId(fields.asset_org_unit) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, asset_org_unit: v === 'none' ? undefined : createRecordUrl(APP_IDS.ORGANISATIONSEINHEITEN, v) }))}
            >
              <SelectTrigger id="asset_org_unit"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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