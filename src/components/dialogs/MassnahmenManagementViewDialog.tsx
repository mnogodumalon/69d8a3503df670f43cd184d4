import type { MassnahmenManagement, RisikoRegister } from '@/types/app';
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

interface MassnahmenManagementViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: MassnahmenManagement | null;
  onEdit: (record: MassnahmenManagement) => void;
  risiko_registerList: RisikoRegister[];
}

export function MassnahmenManagementViewDialog({ open, onClose, record, onEdit, risiko_registerList }: MassnahmenManagementViewDialogProps) {
  function getRisikoRegisterDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return risiko_registerList.find(r => r.record_id === id)?.fields.risk_id ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Maßnahmen-Management anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Maßnahmen-ID</Label>
            <p className="text-sm">{record.fields.measure_id ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Maßnahmentitel</Label>
            <p className="text-sm">{record.fields.measure_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.measure_description ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Maßnahmentyp</Label>
            <Badge variant="secondary">{record.fields.measure_type?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Priorität</Label>
            <Badge variant="secondary">{record.fields.measure_priority?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehöriges Risiko</Label>
            <p className="text-sm">{getRisikoRegisterDisplayName(record.fields.measure_risk)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Vorname</Label>
            <p className="text-sm">{record.fields.measure_responsible_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Nachname</Label>
            <p className="text-sm">{record.fields.measure_responsible_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher E-Mail</Label>
            <p className="text-sm">{record.fields.measure_responsible_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fälligkeitsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.measure_due_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Umsetzungsdatum (tatsächlich)</Label>
            <p className="text-sm">{formatDate(record.fields.measure_completion_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Umsetzungsstatus</Label>
            <Badge variant="secondary">{record.fields.measure_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wirksamkeit</Label>
            <Badge variant="secondary">{record.fields.measure_effectiveness?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachweis / Evidenz</Label>
            {record.fields.measure_evidence ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.measure_evidence} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.measure_notes ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}