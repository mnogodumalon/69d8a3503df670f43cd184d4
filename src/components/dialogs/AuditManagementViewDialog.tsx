import type { AuditManagement, FrameworkVerwaltung, Organisationseinheiten } from '@/types/app';
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

interface AuditManagementViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: AuditManagement | null;
  onEdit: (record: AuditManagement) => void;
  framework_verwaltungList: FrameworkVerwaltung[];
  organisationseinheitenList: Organisationseinheiten[];
}

export function AuditManagementViewDialog({ open, onClose, record, onEdit, framework_verwaltungList, organisationseinheitenList }: AuditManagementViewDialogProps) {
  function getFrameworkVerwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return framework_verwaltungList.find(r => r.record_id === id)?.fields.fw_name ?? '—';
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
          <DialogTitle>Audit-Management anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auditiertes Framework</Label>
            <p className="text-sm">{getFrameworkVerwaltungDisplayName(record.fields.audit_framework)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auditumfang / Scope</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.audit_scope ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auditbeginn</Label>
            <p className="text-sm">{formatDate(record.fields.audit_start_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auditende</Label>
            <p className="text-sm">{formatDate(record.fields.audit_end_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Leitender Auditor Vorname</Label>
            <p className="text-sm">{record.fields.audit_lead_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Leitender Auditor Nachname</Label>
            <p className="text-sm">{record.fields.audit_lead_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Leitender Auditor E-Mail</Label>
            <p className="text-sm">{record.fields.audit_lead_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auditierte Organisationseinheit</Label>
            <p className="text-sm">{getOrganisationseinheitenDisplayName(record.fields.audit_org_unit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auditstatus</Label>
            <Badge variant="secondary">{record.fields.audit_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auditergebnis</Label>
            <Badge variant="secondary">{record.fields.audit_result?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auditbericht (Upload)</Label>
            {record.fields.audit_report ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.audit_report} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.audit_notes ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Audit-ID</Label>
            <p className="text-sm">{record.fields.audit_id ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Audittitel</Label>
            <p className="text-sm">{record.fields.audit_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Audittyp</Label>
            <Badge variant="secondary">{record.fields.audit_type?.label ?? '—'}</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}