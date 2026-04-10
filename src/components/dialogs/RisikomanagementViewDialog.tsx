import type { Risikomanagement, AssetRegister, Organisationseinheiten } from '@/types/app';
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

interface RisikomanagementViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Risikomanagement | null;
  onEdit: (record: Risikomanagement) => void;
  asset_registerList: AssetRegister[];
  organisationseinheitenList: Organisationseinheiten[];
}

export function RisikomanagementViewDialog({ open, onClose, record, onEdit, asset_registerList, organisationseinheitenList }: RisikomanagementViewDialogProps) {
  function getAssetRegisterDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return asset_registerList.find(r => r.record_id === id)?.fields.asset_name ?? '—';
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
          <DialogTitle>Risikomanagement anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Risikobezeichnung</Label>
            <p className="text-sm">{record.fields.risk_title ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Risikobeschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.risk_description ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Risikokategorie</Label>
            <p className="text-sm">{Array.isArray(record.fields.risk_category) ? record.fields.risk_category.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Betroffene Assets</Label>
            <p className="text-sm">{getAssetRegisterDisplayName(record.fields.risk_asset)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Betroffene Organisationseinheiten</Label>
            <p className="text-sm">{getOrganisationseinheitenDisplayName(record.fields.risk_org_unit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eintrittswahrscheinlichkeit</Label>
            <Badge variant="secondary">{record.fields.risk_probability?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schadensausmaß</Label>
            <Badge variant="secondary">{record.fields.risk_impact?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Risikoscore Brutto (berechnet)</Label>
            <p className="text-sm">{record.fields.risk_score_brutto ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Risikobehandlung</Label>
            <Badge variant="secondary">{record.fields.risk_treatment?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eintrittswahrscheinlichkeit (Netto)</Label>
            <Badge variant="secondary">{record.fields.risk_probability_netto?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vertraulichkeit</Label>
            <Badge variant="secondary">{record.fields.risk_confidentiality?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Integrität</Label>
            <Badge variant="secondary">{record.fields.risk_integrity?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verfügbarkeit</Label>
            <Badge variant="secondary">{record.fields.risk_availability?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schadensausmaß (Netto)</Label>
            <Badge variant="secondary">{record.fields.risk_impact_netto?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Risikoverantwortlicher Vorname</Label>
            <p className="text-sm">{record.fields.risk_owner_firstname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Risikoverantwortlicher Nachname</Label>
            <p className="text-sm">{record.fields.risk_owner_lastname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nächstes Review-Datum</Label>
            <p className="text-sm">{formatDate(record.fields.risk_review_date)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="secondary">{record.fields.risk_status?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.risk_notes ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}