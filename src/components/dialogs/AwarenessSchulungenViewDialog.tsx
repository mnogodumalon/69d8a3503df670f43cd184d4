import type { AwarenessSchulungen, FrameworkVerwaltung } from '@/types/app';
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

interface AwarenessSchulungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: AwarenessSchulungen | null;
  onEdit: (record: AwarenessSchulungen) => void;
  framework_verwaltungList: FrameworkVerwaltung[];
}

export function AwarenessSchulungenViewDialog({ open, onClose, record, onEdit, framework_verwaltungList }: AwarenessSchulungenViewDialogProps) {
  function getFrameworkVerwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return framework_verwaltungList.find(r => r.record_id === id)?.fields.fw_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Awareness & Schulungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Titel der Schulung</Label>
            <p className="text-sm">{record.fields.training_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schulungstyp</Label>
            <Badge variant="secondary">{record.fields.training_type?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zielgruppe</Label>
            <p className="text-sm">{Array.isArray(record.fields.training_target_group) ? record.fields.training_target_group.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Startdatum</Label>
            <p className="text-sm">{formatDate(record.fields.training_start_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Enddatum</Label>
            <p className="text-sm">{formatDate(record.fields.training_end_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Vorname</Label>
            <p className="text-sm">{record.fields.training_responsible_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Nachname</Label>
            <p className="text-sm">{record.fields.training_responsible_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anzahl Teilnehmer (geplant)</Label>
            <p className="text-sm">{record.fields.training_participants_count ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Abschlussquote (%)</Label>
            <p className="text-sm">{record.fields.training_completion_rate ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.training_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehöriges Framework</Label>
            <p className="text-sm">{getFrameworkVerwaltungDisplayName(record.fields.training_framework)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schulungsmaterial (Upload)</Label>
            {record.fields.training_material ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.training_material} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.training_notes ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}