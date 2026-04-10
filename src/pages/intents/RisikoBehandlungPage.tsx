import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Risikomanagement, MassnahmenManagement, SoaManagement, AufgabenFreigaben, AssetRegister, Organisationseinheiten, KontrollManagement, AuditManagement } from '@/types/app';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { EntitySelectStep } from '@/components/EntitySelectStep';
import { StatusBadge } from '@/components/StatusBadge';
import { RisikomanagementDialog } from '@/components/dialogs/RisikomanagementDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { SoaManagementDialog } from '@/components/dialogs/SoaManagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconShieldX,
  IconAlertTriangle,
  IconListCheck,
  IconShieldCheck,
  IconCheck,
  IconPlus,
  IconPencil,
  IconChevronRight,
  IconChevronLeft,
  IconUser,
} from '@tabler/icons-react';

const WIZARD_STEPS = [
  { label: 'Risiko' },
  { label: 'Bewertung' },
  { label: 'Maßnahmen' },
  { label: 'SoA-Kontrollen' },
  { label: 'Aufgaben' },
  { label: 'Abschluss' },
];

const TODAY = new Date().toISOString().slice(0, 10);

export default function RisikoBehandlungPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { risikomanagement, massnahmenManagement, soaManagement, aufgabenFreigaben, assetRegister, organisationseinheiten, kontrollManagement, auditManagement, loading, error, fetchAll } = useDashboardData();

  // Step state — init from URL
  const urlStep = parseInt(searchParams.get('step') ?? '0', 10);
  const [currentStep, setCurrentStep] = useState<number>(isNaN(urlStep) || urlStep < 0 || urlStep > 5 ? 0 : urlStep);

  // Selected risk
  const urlRisikoId = searchParams.get('risikoId') ?? '';
  const [selectedRisikoId, setSelectedRisikoId] = useState<string>(urlRisikoId);
  const [selectedRisiko, setSelectedRisiko] = useState<Risikomanagement | null>(null);

  // Dialog states
  const [risikoDialogOpen, setRisikoDialogOpen] = useState(false);
  const [risikoEditDialogOpen, setRisikoEditDialogOpen] = useState(false);
  const [massnahmeDialogOpen, setMassnahmeDialogOpen] = useState(false);
  const [soaDialogOpen, setSoaDialogOpen] = useState(false);
  const [soaEditTarget, setSoaEditTarget] = useState<SoaManagement | null>(null);
  const [aufgabeDialogOpen, setAufgabeDialogOpen] = useState(false);

  // Status feedback
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Sync selectedRisiko when data or selectedRisikoId changes
  useEffect(() => {
    if (selectedRisikoId && risikomanagement.length > 0) {
      const found = risikomanagement.find(r => r.record_id === selectedRisikoId) ?? null;
      setSelectedRisiko(found);
    }
  }, [selectedRisikoId, risikomanagement]);

  // Deep-link: if risikoId in URL, jump to step 1 (or URL step)
  useEffect(() => {
    if (urlRisikoId) {
      const targetStep = isNaN(urlStep) || urlStep < 1 ? 1 : urlStep;
      setCurrentStep(targetStep);
      setSelectedRisikoId(urlRisikoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL params when step/risk changes
  function goToStep(step: number) {
    setCurrentStep(step);
    const params = new URLSearchParams(searchParams);
    params.set('step', String(step));
    if (selectedRisikoId) params.set('risikoId', selectedRisikoId);
    setSearchParams(params, { replace: true });
  }

  function handleRisikoSelect(id: string) {
    setSelectedRisikoId(id);
    const found = risikomanagement.find(r => r.record_id === id) ?? null;
    setSelectedRisiko(found);
    const params = new URLSearchParams(searchParams);
    params.set('risikoId', id);
    params.set('step', '1');
    setSearchParams(params, { replace: true });
    setCurrentStep(1);
  }

  // Filter Maßnahmen for selected risk
  const risikoMassnahmen = massnahmenManagement.filter(m => {
    const linkId = extractRecordId(m.fields.measure_risk);
    return linkId === selectedRisikoId;
  });

  // Filter Tasks for selected risk (or linked measures)
  const risikoMassnahmeIds = new Set(risikoMassnahmen.map(m => m.record_id));
  const risikoAufgaben = aufgabenFreigaben.filter(t => {
    const riskId = extractRecordId(t.fields.task_related_risk);
    const measureId = extractRecordId(t.fields.task_related_measure);
    return riskId === selectedRisikoId || (measureId !== null && risikoMassnahmeIds.has(measureId));
  });

  // SoA: only applicable entries
  const applicableSoa = soaManagement.filter(s => s.fields.soa_applicable === true);

  // Stats
  const massnahmenAbgeschlossen = risikoMassnahmen.filter(m => m.fields.measure_status?.key === 'abgeschlossen').length;
  const soaImplementiert = applicableSoa.filter(s => s.fields.soa_implementation_status?.key === 'vollstaendig_implementiert').length;
  const aufgabenOffen = risikoAufgaben.filter(t => t.fields.task_status?.key !== 'abgeschlossen' && t.fields.task_status?.key !== 'erledigt').length;
  const aufgabenUeberfaellig = risikoAufgaben.filter(t => {
    const due = t.fields.task_due_date;
    const notDone = t.fields.task_status?.key !== 'abgeschlossen' && t.fields.task_status?.key !== 'erledigt';
    return notDone && due && due.slice(0, 10) < TODAY;
  }).length;

  async function handleStatusUpdate() {
    if (!selectedRisikoId) return;
    setUpdateLoading(true);
    try {
      await LivingAppsService.updateRisikomanagementEntry(selectedRisikoId, { risk_status: 'in_behandlung' } as any);
      await fetchAll();
      setUpdateSuccess(true);
    } finally {
      setUpdateLoading(false);
    }
  }

  // Helpers for multipleapplookup display
  function parseMultipleApplookup(val: string | undefined): string[] {
    if (!val) return [];
    // Could be comma-separated URLs or JSON array
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((u: string) => extractRecordId(u) ?? u);
    } catch {
      // single URL or empty
      const id = extractRecordId(val);
      return id ? [id] : [];
    }
    return [];
  }

  return (
    <IntentWizardShell
      title="Risikobehandlung"
      subtitle="Vollständiger Workflow: Risiko auswählen, bewerten, Maßnahmen planen, SoA-Kontrollen zuordnen und Aufgaben erstellen."
      steps={WIZARD_STEPS}
      currentStep={currentStep + 1}
      onStepChange={step => setCurrentStep(step - 1)}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ================================================================
          STEP 0: Risiko auswählen
      ================================================================ */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Risiko auswählen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Wähle ein bestehendes Risiko aus oder erfasse ein neues, um mit der Behandlung zu beginnen.
            </p>
          </div>

          <EntitySelectStep
            items={risikomanagement.map(r => ({
              id: r.record_id,
              title: r.fields.risk_title ?? '(Kein Titel)',
              subtitle: Array.isArray(r.fields.risk_category)
                ? r.fields.risk_category.map(c => c.label).join(', ')
                : undefined,
              status: r.fields.risk_status
                ? { key: r.fields.risk_status.key, label: r.fields.risk_status.label }
                : undefined,
              icon: <IconShieldX size={18} className="text-primary" />,
              stats: [
                { label: 'Brutto-Score', value: r.fields.risk_score_brutto ?? '-' },
                { label: 'Behandlung', value: r.fields.risk_treatment?.label ?? '-' },
              ],
            }))}
            onSelect={handleRisikoSelect}
            searchPlaceholder="Risiko suchen..."
            emptyIcon={<IconShieldX size={36} />}
            emptyText="Noch keine Risiken vorhanden. Erstelle ein neues Risiko."
            createLabel="Neues Risiko erfassen"
            onCreateNew={() => setRisikoDialogOpen(true)}
            createDialog={
              <RisikomanagementDialog
                open={risikoDialogOpen}
                onClose={() => setRisikoDialogOpen(false)}
                onSubmit={async fields => {
                  await LivingAppsService.createRisikomanagementEntry(fields as any);
                  await fetchAll();
                }}
                asset_registerList={assetRegister as AssetRegister[]}
                organisationseinheitenList={organisationseinheiten as Organisationseinheiten[]}
                enablePhotoScan={AI_PHOTO_SCAN['Risikomanagement']}
                enablePhotoLocation={AI_PHOTO_LOCATION['Risikomanagement']}
              />
            }
          />
        </div>
      )}

      {/* ================================================================
          STEP 1: Risikobewertung prüfen
      ================================================================ */}
      {currentStep === 1 && selectedRisiko && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold">{selectedRisiko.fields.risk_title ?? '(Kein Titel)'}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Risikobewertung prüfen</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedRisiko.fields.risk_status && (
                <StatusBadge
                  statusKey={selectedRisiko.fields.risk_status.key}
                  label={selectedRisiko.fields.risk_status.label}
                />
              )}
              <Button variant="outline" size="sm" onClick={() => setRisikoEditDialogOpen(true)}>
                <IconPencil size={14} className="mr-1.5" />
                Risikodaten bearbeiten
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brutto-Risiko */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconAlertTriangle size={15} className="text-orange-500" />
                  Brutto-Risiko
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wahrscheinlichkeit</span>
                  <span className="font-medium truncate ml-2">{selectedRisiko.fields.risk_probability?.label ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impact</span>
                  <span className="font-medium truncate ml-2">{selectedRisiko.fields.risk_impact?.label ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground font-medium">Score</span>
                  <span className="font-bold text-base text-foreground">{selectedRisiko.fields.risk_score_brutto ?? '-'}</span>
                </div>
              </CardContent>
            </Card>

            {/* CIA-Bewertung */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconShieldCheck size={15} className="text-blue-500" />
                  CIA-Bewertung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vertraulichkeit</span>
                  <span className="font-medium">{selectedRisiko.fields.risk_confidentiality?.label ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Integrität</span>
                  <span className="font-medium">{selectedRisiko.fields.risk_integrity?.label ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verfügbarkeit</span>
                  <span className="font-medium">{selectedRisiko.fields.risk_availability?.label ?? '-'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Netto-Risiko */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconShieldCheck size={15} className="text-green-500" />
                  Netto-Risiko
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wahrscheinlichkeit (netto)</span>
                  <span className="font-medium truncate ml-2">{selectedRisiko.fields.risk_probability_netto?.label ?? '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impact (netto)</span>
                  <span className="font-medium truncate ml-2">{selectedRisiko.fields.risk_impact_netto?.label ?? '-'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Behandlungsstrategie */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Behandlungsstrategie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedRisiko.fields.risk_treatment ? (
                  <StatusBadge
                    statusKey={selectedRisiko.fields.risk_treatment.key}
                    label={selectedRisiko.fields.risk_treatment.label}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Keine Strategie festgelegt</span>
                )}
                {selectedRisiko.fields.risk_owner_firstname || selectedRisiko.fields.risk_owner_lastname ? (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <IconUser size={13} />
                    <span className="truncate">
                      {[selectedRisiko.fields.risk_owner_firstname, selectedRisiko.fields.risk_owner_lastname].filter(Boolean).join(' ')}
                    </span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Description & Notes */}
          {(selectedRisiko.fields.risk_description || selectedRisiko.fields.risk_notes) && (
            <Card className="overflow-hidden">
              <CardContent className="pt-4 space-y-3">
                {selectedRisiko.fields.risk_description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Beschreibung</p>
                    <p className="text-sm">{selectedRisiko.fields.risk_description}</p>
                  </div>
                )}
                {selectedRisiko.fields.risk_notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notizen</p>
                    <p className="text-sm">{selectedRisiko.fields.risk_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assets & Org-Einheiten */}
          {(selectedRisiko.fields.risk_asset || selectedRisiko.fields.risk_org_unit) && (
            <Card className="overflow-hidden">
              <CardContent className="pt-4 space-y-3">
                {selectedRisiko.fields.risk_asset && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Betroffene Assets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parseMultipleApplookup(selectedRisiko.fields.risk_asset).map(id => (
                        <span key={id} className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono truncate max-w-[160px]">{id}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRisiko.fields.risk_org_unit && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Organisationseinheiten</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parseMultipleApplookup(selectedRisiko.fields.risk_org_unit).map(id => (
                        <span key={id} className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono truncate max-w-[160px]">{id}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <RisikomanagementDialog
            open={risikoEditDialogOpen}
            onClose={() => setRisikoEditDialogOpen(false)}
            onSubmit={async fields => {
              await LivingAppsService.updateRisikomanagementEntry(selectedRisikoId, fields as any);
              await fetchAll();
            }}
            defaultValues={selectedRisiko.fields}
            asset_registerList={assetRegister as AssetRegister[]}
            organisationseinheitenList={organisationseinheiten as Organisationseinheiten[]}
            enablePhotoScan={AI_PHOTO_SCAN['Risikomanagement']}
            enablePhotoLocation={AI_PHOTO_LOCATION['Risikomanagement']}
          />

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => goToStep(0)}>
              <IconChevronLeft size={15} className="mr-1" />
              Zurück
            </Button>
            <Button onClick={() => goToStep(2)}>
              Weiter: Maßnahmen
              <IconChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================
          STEP 2: Maßnahmen planen
      ================================================================ */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold">Maßnahmen planen</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Plane Maßnahmen zur Risikominderung für <span className="font-medium text-foreground">{selectedRisiko?.fields.risk_title ?? 'das gewählte Risiko'}</span>.
              </p>
            </div>
            <Button variant="outline" onClick={() => setMassnahmeDialogOpen(true)}>
              <IconPlus size={15} className="mr-1.5" />
              Neue Maßnahme erstellen
            </Button>
          </div>

          {/* Live-Feedback */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
              <IconListCheck size={15} className="text-primary" />
              <span><span className="font-semibold">{risikoMassnahmen.length}</span> Maßnahmen geplant</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm">
              <IconCheck size={15} />
              <span><span className="font-semibold">{massnahmenAbgeschlossen}</span> abgeschlossen</span>
            </div>
          </div>

          {risikoMassnahmen.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <IconListCheck size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Noch keine Maßnahmen für dieses Risiko.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setMassnahmeDialogOpen(true)}>
                <IconPlus size={14} className="mr-1.5" />
                Erste Maßnahme erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {risikoMassnahmen.map(m => (
                <div
                  key={m.record_id}
                  className="flex items-center gap-3 p-4 rounded-xl border bg-card overflow-hidden"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <IconListCheck size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{m.fields.measure_title ?? '(Kein Titel)'}</span>
                      {m.fields.measure_status && (
                        <StatusBadge statusKey={m.fields.measure_status.key} label={m.fields.measure_status.label} />
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {m.fields.measure_type && <span>Typ: <span className="font-medium text-foreground">{m.fields.measure_type.label}</span></span>}
                      {m.fields.measure_priority && <span>Priorität: <span className="font-medium text-foreground">{m.fields.measure_priority.label}</span></span>}
                      {m.fields.measure_due_date && <span>Fällig: <span className="font-medium text-foreground">{m.fields.measure_due_date.slice(0, 10)}</span></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <MassnahmenManagementDialog
            open={massnahmeDialogOpen}
            onClose={() => setMassnahmeDialogOpen(false)}
            onSubmit={async fields => {
              await LivingAppsService.createMassnahmenManagementEntry(fields as any);
              await fetchAll();
            }}
            defaultValues={{
              measure_risk: selectedRisikoId
                ? createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRisikoId)
                : undefined,
            }}
            risikomanagementList={risikomanagement as Risikomanagement[]}
            enablePhotoScan={AI_PHOTO_SCAN['MassnahmenManagement']}
            enablePhotoLocation={AI_PHOTO_LOCATION['MassnahmenManagement']}
          />

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => goToStep(1)}>
              <IconChevronLeft size={15} className="mr-1" />
              Zurück
            </Button>
            <Button onClick={() => goToStep(3)}>
              Weiter: SoA-Kontrollen
              <IconChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================
          STEP 3: SoA-Kontrollen zuordnen
      ================================================================ */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">SoA-Kontrollen zuordnen</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Zeigt alle anwendbaren SoA-Kontrollen und ihren Implementierungsstatus.
            </p>
          </div>

          {/* Live-Feedback */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
              <IconShieldCheck size={15} className="text-primary" />
              <span><span className="font-semibold">{applicableSoa.length}</span> Kontrollen anwendbar</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm">
              <IconCheck size={15} />
              <span><span className="font-semibold">{soaImplementiert}</span> vollständig implementiert</span>
            </div>
          </div>

          {applicableSoa.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <IconShieldCheck size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Keine anwendbaren SoA-Kontrollen vorhanden.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSoaEditTarget(null); setSoaDialogOpen(true); }}>
                <IconPlus size={14} className="mr-1.5" />
                SoA-Eintrag erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-2 overflow-x-auto">
              {applicableSoa.map(s => (
                <div
                  key={s.record_id}
                  className="flex items-center gap-3 p-4 rounded-xl border bg-card overflow-hidden"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <IconShieldCheck size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[140px]">
                        {extractRecordId(s.fields.soa_control) ?? '–'}
                      </span>
                      {s.fields.soa_implementation_status && (
                        <StatusBadge
                          statusKey={s.fields.soa_implementation_status.key}
                          label={s.fields.soa_implementation_status.label}
                        />
                      )}
                    </div>
                    {(s.fields.soa_responsible_firstname || s.fields.soa_responsible_lastname) && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <IconUser size={11} />
                        <span className="truncate">
                          {[s.fields.soa_responsible_firstname, s.fields.soa_responsible_lastname].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => { setSoaEditTarget(s); setSoaDialogOpen(true); }}
                  >
                    <IconPencil size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <SoaManagementDialog
            open={soaDialogOpen}
            onClose={() => { setSoaDialogOpen(false); setSoaEditTarget(null); }}
            onSubmit={async fields => {
              if (soaEditTarget) {
                await LivingAppsService.updateSoaManagementEntry(soaEditTarget.record_id, fields as any);
              } else {
                await LivingAppsService.createSoaManagementEntry(fields as any);
              }
              await fetchAll();
            }}
            defaultValues={soaEditTarget?.fields}
            kontroll_managementList={kontrollManagement as KontrollManagement[]}
            enablePhotoScan={AI_PHOTO_SCAN['SoaManagement']}
            enablePhotoLocation={AI_PHOTO_LOCATION['SoaManagement']}
          />

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => goToStep(2)}>
              <IconChevronLeft size={15} className="mr-1" />
              Zurück
            </Button>
            <Button onClick={() => goToStep(4)}>
              Weiter: Aufgaben
              <IconChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================
          STEP 4: Aufgaben erstellen
      ================================================================ */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold">Aufgaben erstellen</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Aufgaben für <span className="font-medium text-foreground">{selectedRisiko?.fields.risk_title ?? 'das gewählte Risiko'}</span> und zugehörige Maßnahmen.
              </p>
            </div>
            <Button variant="outline" onClick={() => setAufgabeDialogOpen(true)}>
              <IconPlus size={15} className="mr-1.5" />
              Neue Aufgabe erstellen
            </Button>
          </div>

          {/* Live-Feedback */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
              <IconListCheck size={15} className="text-primary" />
              <span><span className="font-semibold">{aufgabenOffen}</span> offene Aufgaben</span>
            </div>
            {aufgabenUeberfaellig > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
                <IconAlertTriangle size={15} />
                <span><span className="font-semibold">{aufgabenUeberfaellig}</span> überfällig</span>
              </div>
            )}
          </div>

          {risikoAufgaben.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-card">
              <IconListCheck size={36} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Noch keine Aufgaben für dieses Risiko.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setAufgabeDialogOpen(true)}>
                <IconPlus size={14} className="mr-1.5" />
                Erste Aufgabe erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {risikoAufgaben.map(t => {
                const isDue = t.fields.task_due_date && t.fields.task_due_date.slice(0, 10) < TODAY;
                const isOpen = t.fields.task_status?.key !== 'abgeschlossen' && t.fields.task_status?.key !== 'erledigt';
                return (
                  <div
                    key={t.record_id}
                    className={`flex items-center gap-3 p-4 rounded-xl border bg-card overflow-hidden ${isDue && isOpen ? 'border-red-200 bg-red-50' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDue && isOpen ? 'bg-red-100' : 'bg-primary/10'}`}>
                      <IconListCheck size={16} className={isDue && isOpen ? 'text-red-600' : 'text-primary'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{t.fields.task_title ?? '(Kein Titel)'}</span>
                        {t.fields.task_status && (
                          <StatusBadge statusKey={t.fields.task_status.key} label={t.fields.task_status.label} />
                        )}
                        {t.fields.task_priority && (
                          <span className="text-xs text-muted-foreground">Prio: {t.fields.task_priority.label}</span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {(t.fields.task_assignee_firstname || t.fields.task_assignee_lastname) && (
                          <span className="flex items-center gap-1">
                            <IconUser size={10} />
                            {[t.fields.task_assignee_firstname, t.fields.task_assignee_lastname].filter(Boolean).join(' ')}
                          </span>
                        )}
                        {t.fields.task_due_date && (
                          <span className={isDue && isOpen ? 'text-red-600 font-medium' : ''}>
                            Fällig: {t.fields.task_due_date.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AufgabenFreigabenDialog
            open={aufgabeDialogOpen}
            onClose={() => setAufgabeDialogOpen(false)}
            onSubmit={async fields => {
              await LivingAppsService.createAufgabenFreigabenEntry(fields as any);
              await fetchAll();
            }}
            defaultValues={{
              task_related_risk: selectedRisikoId
                ? createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRisikoId)
                : undefined,
            }}
            risikomanagementList={risikomanagement as Risikomanagement[]}
            maßnahmen_managementList={massnahmenManagement as MassnahmenManagement[]}
            audit_managementList={auditManagement as AuditManagement[]}
            enablePhotoScan={AI_PHOTO_SCAN['AufgabenFreigaben']}
            enablePhotoLocation={AI_PHOTO_LOCATION['AufgabenFreigaben']}
          />

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => goToStep(3)}>
              <IconChevronLeft size={15} className="mr-1" />
              Zurück
            </Button>
            <Button onClick={() => goToStep(5)}>
              Weiter: Abschluss
              <IconChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================
          STEP 5: Abschluss
      ================================================================ */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Abschluss & Zusammenfassung</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Überblick über die Risikobehandlung von <span className="font-medium text-foreground">{selectedRisiko?.fields.risk_title ?? '(Risiko)'}</span>.
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Risiko-Details */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconShieldX size={15} className="text-orange-500" />
                  Risiko
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {selectedRisiko?.fields.risk_status ? (
                    <StatusBadge statusKey={selectedRisiko.fields.risk_status.key} label={selectedRisiko.fields.risk_status.label} />
                  ) : <span>–</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brutto-Score</span>
                  <span className="font-semibold">{selectedRisiko?.fields.risk_score_brutto ?? '–'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wahrscheinlichkeit (netto)</span>
                  <span className="font-medium text-right truncate ml-2">{selectedRisiko?.fields.risk_probability_netto?.label ?? '–'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impact (netto)</span>
                  <span className="font-medium text-right truncate ml-2">{selectedRisiko?.fields.risk_impact_netto?.label ?? '–'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Behandlung</span>
                  {selectedRisiko?.fields.risk_treatment ? (
                    <StatusBadge statusKey={selectedRisiko.fields.risk_treatment.key} label={selectedRisiko.fields.risk_treatment.label} />
                  ) : <span>–</span>}
                </div>
              </CardContent>
            </Card>

            {/* Maßnahmen-Übersicht */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconListCheck size={15} className="text-blue-500" />
                  Maßnahmen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gesamt</span>
                  <span className="font-semibold">{risikoMassnahmen.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Abgeschlossen</span>
                  <span className="font-semibold text-green-700">{massnahmenAbgeschlossen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Bearbeitung</span>
                  <span className="font-semibold">
                    {risikoMassnahmen.filter(m => m.fields.measure_status?.key === 'in_bearbeitung').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Offen</span>
                  <span className="font-semibold text-amber-700">
                    {risikoMassnahmen.filter(m => !m.fields.measure_status || m.fields.measure_status.key === 'offen').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* SoA-Kontrollen */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconShieldCheck size={15} className="text-green-500" />
                  SoA-Kontrollen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anwendbar</span>
                  <span className="font-semibold">{applicableSoa.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vollständig implementiert</span>
                  <span className="font-semibold text-green-700">{soaImplementiert}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Implementierungsquote</span>
                  <span className="font-semibold">
                    {applicableSoa.length > 0 ? `${Math.round((soaImplementiert / applicableSoa.length) * 100)} %` : '–'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Aufgaben */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconListCheck size={15} className="text-purple-500" />
                  Aufgaben
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gesamt</span>
                  <span className="font-semibold">{risikoAufgaben.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Offen</span>
                  <span className="font-semibold text-amber-700">{aufgabenOffen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Überfällig</span>
                  <span className={`font-semibold ${aufgabenUeberfaellig > 0 ? 'text-red-600' : ''}`}>{aufgabenUeberfaellig}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Erledigt</span>
                  <span className="font-semibold text-green-700">
                    {risikoAufgaben.filter(t => t.fields.task_status?.key === 'abgeschlossen' || t.fields.task_status?.key === 'erledigt').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status-Update Button */}
          {updateSuccess ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <IconCheck size={16} />
              </div>
              <div>
                <p className="font-semibold text-sm">Status aktualisiert</p>
                <p className="text-xs">Das Risiko wurde auf "In Behandlung" gesetzt.</p>
              </div>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-medium text-sm">Risikobehandlung abschließen</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Setze den Risikostatus auf "In Behandlung", um den Fortschritt zu dokumentieren.
                    </p>
                  </div>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={updateLoading || !selectedRisikoId}
                    className="shrink-0"
                  >
                    {updateLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                        Wird gespeichert...
                      </span>
                    ) : (
                      <>
                        <IconCheck size={15} className="mr-1.5" />
                        Risiko auf "In Behandlung" setzen
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => goToStep(4)}>
              <IconChevronLeft size={15} className="mr-1" />
              Zurück
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRisikoId('');
                setSelectedRisiko(null);
                setUpdateSuccess(false);
                const params = new URLSearchParams();
                setSearchParams(params, { replace: true });
                setCurrentStep(0);
              }}
            >
              Neues Risiko behandeln
            </Button>
          </div>
        </div>
      )}

      {/* Fallback: wenn kein Risiko gewählt aber Step > 0 */}
      {currentStep > 0 && !selectedRisiko && !loading && (
        <div className="text-center py-16 space-y-4">
          <IconShieldX size={40} className="mx-auto text-muted-foreground opacity-40" />
          <div>
            <p className="font-medium">Kein Risiko ausgewählt</p>
            <p className="text-sm text-muted-foreground mt-1">Bitte gehe zurück zu Schritt 1 und wähle ein Risiko aus.</p>
          </div>
          <Button variant="outline" onClick={() => goToStep(0)}>
            <IconChevronLeft size={15} className="mr-1" />
            Zu Schritt 1
          </Button>
        </div>
      )}
    </IntentWizardShell>
  );
}
