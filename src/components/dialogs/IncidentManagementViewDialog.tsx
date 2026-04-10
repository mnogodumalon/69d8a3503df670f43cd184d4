import type { IncidentManagement, AssetRegister, Organisationseinheiten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface IncidentManagementViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: IncidentManagement | null;
  onEdit: (record: IncidentManagement) => void;
  asset_registerList: AssetRegister[];
  organisationseinheitenList: Organisationseinheiten[];
}

export function IncidentManagementViewDialog({ open, onClose, record, onEdit, asset_registerList, organisationseinheitenList }: IncidentManagementViewDialogProps) {
  function getAssetRegisterDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return asset_registerList.find(r => r.record_id === id)?.fields.asset_name ?? '—';
  }

  function getOrganisationseinheitenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return organisationseinheitenList.find(r => r.record_id === id)?.fields.org_housenumber ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Incident-Management anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorfalls-ID</Label>
            <p className="text-sm">{record.fields.incident_id ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorfallsbezeichnung</Label>
            <p className="text-sm">{record.fields.incident_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorfallsbeschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.incident_description ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorfallskategorie</Label>
            <Badge variant="secondary">{record.fields.incident_category?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schweregrad</Label>
            <Badge variant="secondary">{record.fields.incident_severity?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Erkennungszeitpunkt</Label>
            <p className="text-sm">{formatDate(record.fields.incident_detected_at)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eintrittszeitpunkt (geschätzt)</Label>
            <p className="text-sm">{formatDate(record.fields.incident_occurred_at)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Melder Vorname</Label>
            <p className="text-sm">{record.fields.incident_reporter_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Melder Nachname</Label>
            <p className="text-sm">{record.fields.incident_reporter_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Melder E-Mail</Label>
            <p className="text-sm">{record.fields.incident_reporter_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Betroffenes Asset</Label>
            <p className="text-sm">{getAssetRegisterDisplayName(record.fields.incident_affected_asset)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Betroffene Organisationseinheit</Label>
            <p className="text-sm">{getOrganisationseinheitenDisplayName(record.fields.incident_affected_org)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">NIS2-meldepflichtig</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.incident_nis2_reportable ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.incident_nis2_reportable ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">DORA-meldepflichtig</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.incident_dora_reportable ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.incident_dora_reportable ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.incident_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Screenshot / Nachweis</Label>
            {record.fields.incident_evidence ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.incident_evidence} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Weitere Informationen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.incident_notes ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}