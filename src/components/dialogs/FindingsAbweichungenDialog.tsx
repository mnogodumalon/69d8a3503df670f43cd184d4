import { useState, useEffect, useRef, useCallback } from 'react';
import type { FindingsAbweichungen, AuditManagement, KontrollManagement, MassnahmenManagement } from '@/types/app';
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
import { lookupKey } from '@/lib/formatters';

interface FindingsAbweichungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: FindingsAbweichungen['fields']) => Promise<void>;
  defaultValues?: FindingsAbweichungen['fields'];
  audit_managementList: AuditManagement[];
  kontroll_managementList: KontrollManagement[];
  maßnahmen_managementList: MassnahmenManagement[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function FindingsAbweichungenDialog({ open, onClose, onSubmit, defaultValues, audit_managementList, kontroll_managementList, maßnahmen_managementList, enablePhotoScan = true, enablePhotoLocation = true }: FindingsAbweichungenDialogProps) {
  const [fields, setFields] = useState<Partial<FindingsAbweichungen['fields']>>({});
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
      const clean = cleanFieldsForApi({ ...fields }, 'findings_&_abweichungen');
      await onSubmit(clean as FindingsAbweichungen['fields']);
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
      contextParts.push(`<available-records field="finding_audit" entity="Audit-Management">\n${JSON.stringify(audit_managementList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="finding_control" entity="Kontroll-Management">\n${JSON.stringify(kontroll_managementList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="finding_measure" entity="Maßnahmen-Management">\n${JSON.stringify(maßnahmen_managementList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "finding_id": string | null, // Finding-ID\n  "finding_title": string | null, // Bezeichnung\n  "finding_description": string | null, // Beschreibung\n  "finding_type": LookupValue | null, // Finding-Typ (select one key: "nc_minor" | "beobachtung" | "verbesserung" | "positiv" | "nc_major") mapping: nc_minor=Nichtkonformität (Minor), beobachtung=Beobachtung, verbesserung=Verbesserungspotenzial, positiv=Positiver Befund, nc_major=Nichtkonformität (Major)\n  "finding_audit": string | null, // Display name from Audit-Management (see <available-records>)\n  "finding_control": string | null, // Display name from Kontroll-Management (see <available-records>)\n  "finding_severity": LookupValue | null, // Schweregrad (select one key: "kritisch" | "hoch" | "mittel" | "niedrig" | "informativ") mapping: kritisch=Kritisch, hoch=Hoch, mittel=Mittel, niedrig=Niedrig, informativ=Informativ\n  "finding_responsible_lastname": string | null, // Verantwortlicher Nachname\n  "finding_due_date": string | null, // YYYY-MM-DD\n  "finding_status": LookupValue | null, // Status (select one key: "offen" | "in_bearbeitung" | "behoben" | "akzeptiert" | "geschlossen") mapping: offen=Offen, in_bearbeitung=In Bearbeitung, behoben=Behoben, akzeptiert=Akzeptiert, geschlossen=Geschlossen\n  "finding_measure": string | null, // Display name from Maßnahmen-Management (see <available-records>)\n  "finding_notes": string | null, // Anmerkungen\n  "finding_responsible_firstname": string | null, // Verantwortlicher Vorname\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema, photoContext, DIALOG_INTENT);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["finding_audit", "finding_control", "finding_measure"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const finding_auditName = raw['finding_audit'] as string | null;
        if (finding_auditName) {
          const finding_auditMatch = audit_managementList.find(r => matchName(finding_auditName!, [String(r.fields.audit_id ?? '')]));
          if (finding_auditMatch) merged['finding_audit'] = createRecordUrl(APP_IDS.AUDIT_MANAGEMENT, finding_auditMatch.record_id);
        }
        const finding_controlName = raw['finding_control'] as string | null;
        if (finding_controlName) {
          const finding_controlMatch = kontroll_managementList.find(r => matchName(finding_controlName!, [String(r.fields.ctrl_id ?? '')]));
          if (finding_controlMatch) merged['finding_control'] = createRecordUrl(APP_IDS.KONTROLL_MANAGEMENT, finding_controlMatch.record_id);
        }
        const finding_measureName = raw['finding_measure'] as string | null;
        if (finding_measureName) {
          const finding_measureMatch = maßnahmen_managementList.find(r => matchName(finding_measureName!, [String(r.fields.measure_id ?? '')]));
          if (finding_measureMatch) merged['finding_measure'] = createRecordUrl(APP_IDS.MASSNAHMEN_MANAGEMENT, finding_measureMatch.record_id);
        }
        return merged as Partial<FindingsAbweichungen['fields']>;
      });
      // Upload scanned file to file fields
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        try {
          const blob = dataUriToBlob(uri);
          const fileUrl = await uploadFile(blob, file.name);
          setFields(prev => ({ ...prev, finding_evidence: fileUrl }));
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

  const DIALOG_INTENT = defaultValues ? 'Findings & Abweichungen bearbeiten' : 'Findings & Abweichungen hinzufügen';

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
            <Label htmlFor="finding_id">Finding-ID</Label>
            <Input
              id="finding_id"
              value={fields.finding_id ?? ''}
              onChange={e => setFields(f => ({ ...f, finding_id: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_title">Bezeichnung</Label>
            <Input
              id="finding_title"
              value={fields.finding_title ?? ''}
              onChange={e => setFields(f => ({ ...f, finding_title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_description">Beschreibung</Label>
            <Textarea
              id="finding_description"
              value={fields.finding_description ?? ''}
              onChange={e => setFields(f => ({ ...f, finding_description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_type">Finding-Typ</Label>
            <Select
              value={lookupKey(fields.finding_type) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, finding_type: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="finding_type"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="nc_minor">Nichtkonformität (Minor)</SelectItem>
                <SelectItem value="beobachtung">Beobachtung</SelectItem>
                <SelectItem value="verbesserung">Verbesserungspotenzial</SelectItem>
                <SelectItem value="positiv">Positiver Befund</SelectItem>
                <SelectItem value="nc_major">Nichtkonformität (Major)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_audit">Zugehöriges Audit</Label>
            <Select
              value={extractRecordId(fields.finding_audit) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, finding_audit: v === 'none' ? undefined : createRecordUrl(APP_IDS.AUDIT_MANAGEMENT, v) }))}
            >
              <SelectTrigger id="finding_audit"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {audit_managementList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.audit_id ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_control">Betroffene Kontrolle</Label>
            <Select
              value={extractRecordId(fields.finding_control) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, finding_control: v === 'none' ? undefined : createRecordUrl(APP_IDS.KONTROLL_MANAGEMENT, v) }))}
            >
              <SelectTrigger id="finding_control"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {kontroll_managementList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.ctrl_id ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_severity">Schweregrad</Label>
            <Select
              value={lookupKey(fields.finding_severity) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, finding_severity: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="finding_severity"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="kritisch">Kritisch</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="mittel">Mittel</SelectItem>
                <SelectItem value="niedrig">Niedrig</SelectItem>
                <SelectItem value="informativ">Informativ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_responsible_lastname">Verantwortlicher Nachname</Label>
            <Input
              id="finding_responsible_lastname"
              value={fields.finding_responsible_lastname ?? ''}
              onChange={e => setFields(f => ({ ...f, finding_responsible_lastname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_due_date">Behebungsfrist</Label>
            <Input
              id="finding_due_date"
              type="date"
              value={fields.finding_due_date ?? ''}
              onChange={e => setFields(f => ({ ...f, finding_due_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_status">Status</Label>
            <Select
              value={lookupKey(fields.finding_status) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, finding_status: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="finding_status"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="behoben">Behoben</SelectItem>
                <SelectItem value="akzeptiert">Akzeptiert</SelectItem>
                <SelectItem value="geschlossen">Geschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_measure">Zugehörige Maßnahme</Label>
            <Select
              value={extractRecordId(fields.finding_measure) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, finding_measure: v === 'none' ? undefined : createRecordUrl(APP_IDS.MASSNAHMEN_MANAGEMENT, v) }))}
            >
              <SelectTrigger id="finding_measure"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {maßnahmen_managementList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.measure_id ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_evidence">Nachweis / Evidenz</Label>
            {fields.finding_evidence ? (
              <div className="flex items-center gap-3 rounded-lg border p-2">
                <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconFileText size={20} className="text-muted-foreground" />
                  </div>
                  <img
                    src={fields.finding_evidence}
                    alt=""
                    className="relative h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate text-foreground">{fields.finding_evidence.split("/").pop()}</p>
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
                            setFields(f => ({ ...f, finding_evidence: fileUrl }));
                          } catch (err) { console.error('Upload failed:', err); }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setFields(f => ({ ...f, finding_evidence: undefined }))}
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
                      setFields(f => ({ ...f, finding_evidence: fileUrl }));
                    } catch (err) { console.error('Upload failed:', err); }
                  }}
                />
              </label>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_notes">Anmerkungen</Label>
            <Textarea
              id="finding_notes"
              value={fields.finding_notes ?? ''}
              onChange={e => setFields(f => ({ ...f, finding_notes: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finding_responsible_firstname">Verantwortlicher Vorname</Label>
            <Input
              id="finding_responsible_firstname"
              value={fields.finding_responsible_firstname ?? ''}
              onChange={e => setFields(f => ({ ...f, finding_responsible_firstname: e.target.value }))}
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