import type { AufgabenFreigaben, Risikomanagement, MassnahmenManagement, AuditManagement } from '@/types/app';
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

interface AufgabenFreigabenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: AufgabenFreigaben | null;
  onEdit: (record: AufgabenFreigaben) => void;
  risikomanagementList: Risikomanagement[];
  maßnahmen_managementList: MassnahmenManagement[];
  audit_managementList: AuditManagement[];
}

export function AufgabenFreigabenViewDialog({ open, onClose, record, onEdit, risikomanagementList, maßnahmen_managementList, audit_managementList }: AufgabenFreigabenViewDialogProps) {
  function getRisikomanagementDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return risikomanagementList.find(r => r.record_id === id)?.fields.risk_title ?? '—';
  }

  function getMassnahmenManagementDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return maßnahmen_managementList.find(r => r.record_id === id)?.fields.measure_id ?? '—';
  }

  function getAuditManagementDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return audit_managementList.find(r => r.record_id === id)?.fields.audit_id ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aufgaben & Freigaben anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aufgabentitel</Label>
            <p className="text-sm">{record.fields.task_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aufgabentyp</Label>
            <Badge variant="secondary">{record.fields.task_type?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.task_description ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Priorität</Label>
            <Badge variant="secondary">{record.fields.task_priority?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugewiesen an (Vorname)</Label>
            <p className="text-sm">{record.fields.task_assignee_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugewiesen an (Nachname)</Label>
            <p className="text-sm">{record.fields.task_assignee_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugewiesen an (E-Mail)</Label>
            <p className="text-sm">{record.fields.task_assignee_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anforderer Vorname</Label>
            <p className="text-sm">{record.fields.task_requester_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anforderer Nachname</Label>
            <p className="text-sm">{record.fields.task_requester_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fälligkeitsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.task_due_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehöriges Risiko</Label>
            <p className="text-sm">{getRisikomanagementDisplayName(record.fields.task_related_risk)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehörige Maßnahme</Label>
            <p className="text-sm">{getMassnahmenManagementDisplayName(record.fields.task_related_measure)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehöriges Audit</Label>
            <p className="text-sm">{getAuditManagementDisplayName(record.fields.task_related_audit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.task_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Freigabe-/Ablehnungskommentar</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.task_approval_comment ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anhang</Label>
            {record.fields.task_attachment ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.task_attachment} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}