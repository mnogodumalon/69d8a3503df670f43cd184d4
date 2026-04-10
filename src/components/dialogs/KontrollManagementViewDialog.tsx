import type { KontrollManagement, FrameworkVerwaltung, MassnahmenManagement } from '@/types/app';
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

interface KontrollManagementViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: KontrollManagement | null;
  onEdit: (record: KontrollManagement) => void;
  framework_verwaltungList: FrameworkVerwaltung[];
  maßnahmen_managementList: MassnahmenManagement[];
}

export function KontrollManagementViewDialog({ open, onClose, record, onEdit, framework_verwaltungList, maßnahmen_managementList }: KontrollManagementViewDialogProps) {
  function getFrameworkVerwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return framework_verwaltungList.find(r => r.record_id === id)?.fields.fw_name ?? '—';
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
          <DialogTitle>Kontroll-Management anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kontroll-ID</Label>
            <p className="text-sm">{record.fields.ctrl_id ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kontrolltitel</Label>
            <p className="text-sm">{record.fields.ctrl_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.ctrl_description ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kontrolltyp</Label>
            <Badge variant="secondary">{record.fields.ctrl_type?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kontrolldomäne</Label>
            <p className="text-sm">{record.fields.ctrl_domain ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Primäres Framework</Label>
            <p className="text-sm">{getFrameworkVerwaltungDisplayName(record.fields.ctrl_framework)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kontrollverantwortlicher Vorname</Label>
            <p className="text-sm">{record.fields.ctrl_owner_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kontrollverantwortlicher Nachname</Label>
            <p className="text-sm">{record.fields.ctrl_owner_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Implementierungsstatus</Label>
            <Badge variant="secondary">{record.fields.ctrl_implementation_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nächstes Review-Datum</Label>
            <p className="text-sm">{formatDate(record.fields.ctrl_review_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugehörige Maßnahme</Label>
            <p className="text-sm">{getMassnahmenManagementDisplayName(record.fields.ctrl_measure)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.ctrl_notes ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}