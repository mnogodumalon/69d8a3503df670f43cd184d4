import { useState, useEffect, useRef, useCallback } from 'react';
import type { AwarenessSchulungen, FrameworkVerwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, uploadFile, getUserProfile } from '@/services/livingAppsService';
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
import { fileToDataUri, extractFromPhoto, extractPhotoMeta, reverseGeocode, dataUriToBlob } from '@/lib/ai';
import { lookupKey, lookupKeys } from '@/lib/formatters';

interface AwarenessSchulungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: AwarenessSchulungen['fields']) => Promise<void>;
  defaultValues?: AwarenessSchulungen['fields'];
  framework_verwaltungList: FrameworkVerwaltung[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function AwarenessSchulungenDialog({ open, onClose, onSubmit, defaultValues, framework_verwaltungList, enablePhotoScan = true, enablePhotoLocation = true }: AwarenessSchulungenDialogProps) {
  const [fields, setFields] = useState<Partial<AwarenessSchulungen['fields']>>({});
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
      const clean = cleanFieldsForApi({ ...fields }, 'awareness_&_schulungen');
      await onSubmit(clean as AwarenessSchulungen['fields']);
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
      contextParts.push(`<available-records field="training_framework" entity="Framework-Verwaltung">\n${JSON.stringify(framework_verwaltungList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "training_title": string | null, // Titel der Schulung\n  "training_type": LookupValue | null, // Schulungstyp (select one key: "pflicht" | "awareness" | "technisch" | "fuehrung" | "onboarding" | "phishing" | "sonstiges") mapping: pflicht=Pflichtschulung, awareness=Awareness-Kampagne, technisch=Technische Schulung, fuehrung=Führungskräfteschulung, onboarding=Onboarding, phishing=Phishing-Simulation, sonstiges=Sonstiges\n  "training_target_group": LookupValue[] | null, // Zielgruppe (select one or more keys: "alle" | "it" | "fuehrung" | "neu" | "admin" | "fach") mapping: alle=Alle Mitarbeiter, it=IT-Personal, fuehrung=Führungskräfte, neu=Neue Mitarbeiter, admin=Administratoren, fach=Fachverantwortliche\n  "training_start_date": string | null, // YYYY-MM-DD\n  "training_end_date": string | null, // YYYY-MM-DD\n  "training_responsible_firstname": string | null, // Verantwortlicher Vorname\n  "training_responsible_lastname": string | null, // Verantwortlicher Nachname\n  "training_participants_count": number | null, // Anzahl Teilnehmer (geplant)\n  "training_completion_rate": number | null, // Abschlussquote (%)\n  "training_status": LookupValue | null, // Status (select one key: "geplant" | "aktiv" | "abgeschlossen" | "abgebrochen") mapping: geplant=Geplant, aktiv=Aktiv, abgeschlossen=Abgeschlossen, abgebrochen=Abgebrochen\n  "training_framework": string | null, // Display name from Framework-Verwaltung (see <available-records>)\n  "training_notes": string | null, // Anmerkungen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema, photoContext, DIALOG_INTENT);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["training_framework"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const training_frameworkName = raw['training_framework'] as string | null;
        if (training_frameworkName) {
          const training_frameworkMatch = framework_verwaltungList.find(r => matchName(training_frameworkName!, [String(r.fields.fw_name ?? '')]));
          if (training_frameworkMatch) merged['training_framework'] = createRecordUrl(APP_IDS.FRAMEWORK_VERWALTUNG, training_frameworkMatch.record_id);
        }
        return merged as Partial<AwarenessSchulungen['fields']>;
      });
      // Upload scanned file to file fields
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        try {
          const blob = dataUriToBlob(uri);
          const fileUrl = await uploadFile(blob, file.name);
          setFields(prev => ({ ...prev, training_material: fileUrl }));
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
        }
      }
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

  const DIALOG_INTENT = defaultValues ? 'Awareness & Schulungen bearbeiten' : 'Awareness & Schulungen hinzufügen';

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
            <Label htmlFor="training_framework">Zugehöriges Framework</Label>
            <Select
              value={extractRecordId(fields.training_framework) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, training_framework: v === 'none' ? undefined : createRecordUrl(APP_IDS.FRAMEWORK_VERWALTUNG, v) }))}
            >
              <SelectTrigger id="training_framework"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {framework_verwaltungList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.fw_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_material">Schulungsmaterial (Upload)</Label>
            {fields.training_material ? (
              <div className="flex items-center gap-3 rounded-lg border p-2">
                <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconFileText size={20} className="text-muted-foreground" />
                  </div>
                  <img
                    src={fields.training_material}
                    alt=""
                    className="relative h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate text-foreground">{fields.training_material.split("/").pop()}</p>
                  <div className="flex gap-2 mt-1">
                    <label
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      Ändern
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const fileUrl = await uploadFile(file, file.name);
                            setFields(f => ({ ...f, training_material: fileUrl }));
                          } catch (err) { console.error('Upload failed:', err); }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setFields(f => ({ ...f, training_material: undefined }))}
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <IconUpload size={20} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Datei hochladen</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const fileUrl = await uploadFile(file, file.name);
                      setFields(f => ({ ...f, training_material: fileUrl }));
                    } catch (err) { console.error('Upload failed:', err); }
                  }}
                />
              </label>
            )}
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