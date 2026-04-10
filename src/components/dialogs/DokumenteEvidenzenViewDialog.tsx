import type { DokumenteEvidenzen, KontrollManagement, AuditManagement } from '@/types/app';
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

interface DokumenteEvidenzenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: DokumenteEvidenzen | null;
  onEdit: (record: DokumenteEvidenzen) => void;
  kontroll_managementList: KontrollManagement[];
  audit_managementList: AuditManagement[];
}

export function DokumenteEvidenzenViewDialog({ open, onClose, record, onEdit, kontroll_managementList, audit_managementList }: DokumenteEvidenzenViewDialogProps) {
  function getKontrollManagementDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kontroll_managementList.find(r => r.record_id === id)?.fields.ctrl_id ?? '—';
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
          <DialogTitle>Dokumente & Evidenzen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dokumententitel</Label>
            <p className="text-sm">{record.fields.doc_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dokumententyp</Label>
            <Badge variant="secondary">{record.fields.doc_type?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Version</Label>
            <p className="text-sm">{record.fields.doc_version ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.doc_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dokumentenverantwortlicher Vorname</Label>
            <p className="text-sm">{record.fields.doc_owner_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dokumentenverantwortlicher Nachname</Label>
            <p className="text-sm">{record.fields.doc_owner_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gültig ab</Label>
            <p className="text-sm">{formatDate(record.fields.doc_valid_from)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gültig bis</Label>
            <p className="text-sm">{formatDate(record.fields.doc_valid_until)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehörige Kontrolle</Label>
            <p className="text-sm">{getKontrollManagementDisplayName(record.fields.doc_related_control)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehöriges Audit</Label>
            <p className="text-sm">{getAuditManagementDisplayName(record.fields.doc_related_audit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datei (Upload)</Label>
            {record.fields.doc_file ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.doc_file} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.doc_description ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schlagwörter / Tags</Label>
            <p className="text-sm">{record.fields.doc_tags ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}