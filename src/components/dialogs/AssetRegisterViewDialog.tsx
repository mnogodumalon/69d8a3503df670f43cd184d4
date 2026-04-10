import type { AssetRegister, Organisationseinheiten } from '@/types/app';
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

interface AssetRegisterViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: AssetRegister | null;
  onEdit: (record: AssetRegister) => void;
  organisationseinheitenList: Organisationseinheiten[];
}

export function AssetRegisterViewDialog({ open, onClose, record, onEdit, organisationseinheitenList }: AssetRegisterViewDialogProps) {
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
          <DialogTitle>Asset-Register anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Asset-Bezeichnung</Label>
            <p className="text-sm">{record.fields.asset_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Interne Asset-ID</Label>
            <p className="text-sm">{record.fields.asset_id_intern ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Asset-Kategorie</Label>
            <Badge variant="secondary">{record.fields.asset_category?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Asset-Typ</Label>
            <p className="text-sm">{record.fields.asset_type ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Asset-Owner Vorname</Label>
            <p className="text-sm">{record.fields.asset_owner_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Asset-Owner Nachname</Label>
            <p className="text-sm">{record.fields.asset_owner_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Asset-Owner E-Mail</Label>
            <p className="text-sm">{record.fields.asset_owner_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schutzbedarfsklasse</Label>
            <Badge variant="secondary">{record.fields.asset_classification?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vertraulichkeit</Label>
            <Badge variant="secondary">{record.fields.asset_confidentiality?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Integrität</Label>
            <Badge variant="secondary">{record.fields.asset_integrity?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verfügbarkeit</Label>
            <Badge variant="secondary">{record.fields.asset_availability?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Standort / Betriebsort</Label>
            <p className="text-sm">{record.fields.asset_location ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Organisationseinheit</Label>
            <p className="text-sm">{getOrganisationseinheitenDisplayName(record.fields.asset_org_unit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.asset_description ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.asset_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anschaffungsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.asset_purchase_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nächstes Review-Datum</Label>
            <p className="text-sm">{formatDate(record.fields.asset_review_date)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}