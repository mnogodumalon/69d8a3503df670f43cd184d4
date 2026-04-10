import type { SoaManagement, KontrollManagement } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface SoaManagementViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: SoaManagement | null;
  onEdit: (record: SoaManagement) => void;
  kontroll_managementList: KontrollManagement[];
}

export function SoaManagementViewDialog({ open, onClose, record, onEdit, kontroll_managementList }: SoaManagementViewDialogProps) {
  function getKontrollManagementDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kontroll_managementList.find(r => r.record_id === id)?.fields.ctrl_id ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SoA-Management anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kontrolle (Control)</Label>
            <p className="text-sm">{getKontrollManagementDisplayName(record.fields.soa_control)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anwendbar</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.soa_applicable ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.soa_applicable ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einbeziehungsgrund</Label>
            <p className="text-sm">{Array.isArray(record.fields.soa_inclusion_reason) ? record.fields.soa_inclusion_reason.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ausschlussgrund (falls nicht anwendbar)</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.soa_exclusion_reason ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Begründung / Rechtfertigung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.soa_justification ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Umsetzungsstatus</Label>
            <Badge variant="secondary">{record.fields.soa_implementation_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Vorname</Label>
            <p className="text-sm">{record.fields.soa_responsible_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Nachname</Label>
            <p className="text-sm">{record.fields.soa_responsible_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Review-Datum</Label>
            <p className="text-sm">{formatDate(record.fields.soa_review_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.soa_notes ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}