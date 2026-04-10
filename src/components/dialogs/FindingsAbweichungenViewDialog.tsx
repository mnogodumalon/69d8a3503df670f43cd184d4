import type { FindingsAbweichungen, AuditManagement, KontrollManagement, MassnahmenManagement } from '@/types/app';
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

interface FindingsAbweichungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: FindingsAbweichungen | null;
  onEdit: (record: FindingsAbweichungen) => void;
  audit_managementList: AuditManagement[];
  kontroll_managementList: KontrollManagement[];
  maßnahmen_managementList: MassnahmenManagement[];
}

export function FindingsAbweichungenViewDialog({ open, onClose, record, onEdit, audit_managementList, kontroll_managementList, maßnahmen_managementList }: FindingsAbweichungenViewDialogProps) {
  function getAuditManagementDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return audit_managementList.find(r => r.record_id === id)?.fields.audit_id ?? '—';
  }

  function getKontrollManagementDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kontroll_managementList.find(r => r.record_id === id)?.fields.ctrl_id ?? '—';
  }

  function getMassnahmenManagementDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return maßnahmen_managementList.find(r => r.record_id === id)?.fields.measure_id ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Findings & Abweichungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Finding-ID</Label>
            <p className="text-sm">{record.fields.finding_id ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezeichnung</Label>
            <p className="text-sm">{record.fields.finding_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.finding_description ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Finding-Typ</Label>
            <Badge variant="secondary">{record.fields.finding_type?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehöriges Audit</Label>
            <p className="text-sm">{getAuditManagementDisplayName(record.fields.finding_audit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Betroffene Kontrolle</Label>
            <p className="text-sm">{getKontrollManagementDisplayName(record.fields.finding_control)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schweregrad</Label>
            <Badge variant="secondary">{record.fields.finding_severity?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Nachname</Label>
            <p className="text-sm">{record.fields.finding_responsible_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Behebungsfrist</Label>
            <p className="text-sm">{formatDate(record.fields.finding_due_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.finding_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehörige Maßnahme</Label>
            <p className="text-sm">{getMassnahmenManagementDisplayName(record.fields.finding_measure)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachweis / Evidenz</Label>
            {record.fields.finding_evidence ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.finding_evidence} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.finding_notes ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Vorname</Label>
            <p className="text-sm">{record.fields.finding_responsible_firstname ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}