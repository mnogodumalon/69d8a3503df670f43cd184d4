import type { BcmNotfallmanagement, AssetRegister } from '@/types/app';
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

interface BcmNotfallmanagementViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: BcmNotfallmanagement | null;
  onEdit: (record: BcmNotfallmanagement) => void;
  asset_registerList: AssetRegister[];
}

export function BcmNotfallmanagementViewDialog({ open, onClose, record, onEdit, asset_registerList }: BcmNotfallmanagementViewDialogProps) {
  function getAssetRegisterDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return asset_registerList.find(r => r.record_id === id)?.fields.asset_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>BCM & Notfallmanagement anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezeichnung</Label>
            <p className="text-sm">{record.fields.bcm_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Typ</Label>
            <Badge variant="secondary">{record.fields.bcm_type?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geltungsbereich</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bcm_scope ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Recovery Time Objective (RTO)</Label>
            <p className="text-sm">{record.fields.bcm_rto ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Recovery Point Objective (RPO)</Label>
            <p className="text-sm">{record.fields.bcm_rpo ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Vorname</Label>
            <p className="text-sm">{record.fields.bcm_responsible_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verantwortlicher Nachname</Label>
            <p className="text-sm">{record.fields.bcm_responsible_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kritisches Asset</Label>
            <p className="text-sm">{getAssetRegisterDisplayName(record.fields.bcm_related_asset)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Letzter Test / Übung</Label>
            <p className="text-sm">{formatDate(record.fields.bcm_last_test_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nächster Test / Übung</Label>
            <p className="text-sm">{formatDate(record.fields.bcm_next_test_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.bcm_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Plan-Dokument (Upload)</Label>
            {record.fields.bcm_document ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.bcm_document} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bcm_notes ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}