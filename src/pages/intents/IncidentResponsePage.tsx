import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { IncidentManagement, MassnahmenManagement } from '@/types/app';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { EntitySelectStep } from '@/components/EntitySelectStep';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IncidentManagementDialog } from '@/components/dialogs/IncidentManagementDialog';
import { RisikomanagementDialog } from '@/components/dialogs/RisikomanagementDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import {
  IconAlertTriangle,
  IconShieldCheck,
  IconListCheck,
  IconUser,
  IconCheck,
  IconPlus,
  IconBuilding,
  IconServer,
  IconAlertCircle,
  IconClipboardList,
  IconCheckbox,
} from '@tabler/icons-react';

const WIZARD_STEPS = [
  { label: 'Incident' },
  { label: 'Assets & Org' },
  { label: 'Maßnahmen' },
  { label: 'Aufgaben' },
  { label: 'Abschluss' },
];

export default function IncidentResponsePage() {
  const [searchParams] = useSearchParams();
  const {
    incidentManagement,
    risikomanagement,
    massnahmenManagement,
    aufgabenFreigaben,
    assetRegister,
    organisationseinheiten,
    auditManagement,
    loading,
    error,
    fetchAll,
    assetRegisterMap,
    organisationseinheitenMap,
    risikomanagementMap,
    massnahmenManagementMap,
  } = useDashboardData();

  // Deep-linking: read URL params on mount
  const initialIncidentId = searchParams.get('incidentId') ?? null;
  const initialStepParam = parseInt(searchParams.get('step') ?? '', 10);

  const computeInitialStep = () => {
    if (initialIncidentId) {
      if (!isNaN(initialStepParam) && initialStepParam >= 1 && initialStepParam <= 5) {
        return initialStepParam;
      }
      return 2;
    }
    return 1;
  };

  const [step, setStep] = useState(computeInitialStep);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(initialIncidentId);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);
  const [closedSuccess, setClosedSuccess] = useState(false);
  const [closing, setClosing] = useState(false);

  // Dialog open states
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [risikoDialogOpen, setRisikoDialogOpen] = useState(false);
  const [massnahmeDialogOpen, setMassnahmeDialogOpen] = useState(false);
  const [aufgabeDialogOpen, setAufgabeDialogOpen] = useState(false);

  // Derived: selected incident
  const selectedIncident = useMemo(
    () => incidentManagement.find((i) => i.record_id === selectedIncidentId) ?? null,
    [incidentManagement, selectedIncidentId]
  );

  // Resolve asset and org names for selected incident
  const affectedAssetName = useMemo(() => {
    if (!selectedIncident?.fields.incident_affected_asset) return null;
    const id = extractRecordId(selectedIncident.fields.incident_affected_asset);
    const asset = id ? assetRegisterMap.get(id) : null;
    return asset?.fields.asset_name ?? null;
  }, [selectedIncident, assetRegisterMap]);

  const affectedOrgName = useMemo(() => {
    if (!selectedIncident?.fields.incident_affected_org) return null;
    const id = extractRecordId(selectedIncident.fields.incident_affected_org);
    const org = id ? organisationseinheitenMap.get(id) : null;
    return org?.fields.org_name ?? null;
  }, [selectedIncident, organisationseinheitenMap]);

  // Derived: risks linked to incident's affected asset
  const linkedRisks = useMemo(() => {
    if (!selectedIncident?.fields.incident_affected_asset) return [];
    const assetId = extractRecordId(selectedIncident.fields.incident_affected_asset);
    if (!assetId) return [];
    return risikomanagement.filter((r) => {
      const riskAssetId = extractRecordId(r.fields.risk_asset ?? '');
      return riskAssetId === assetId;
    });
  }, [selectedIncident, risikomanagement]);

  // Derived: measures linked to any of the linked risks
  const linkedMeasures = useMemo(() => {
    const riskIds = new Set(linkedRisks.map((r) => r.record_id));
    return massnahmenManagement.filter((m) => {
      const riskId = extractRecordId(m.fields.measure_risk ?? '');
      return riskId && riskIds.has(riskId);
    });
  }, [linkedRisks, massnahmenManagement]);

  // Derived: tasks linked to any of the linked measures
  const linkedTasks = useMemo(() => {
    const measureIds = new Set(linkedMeasures.map((m) => m.record_id));
    return aufgabenFreigaben.filter((t) => {
      const measureId = extractRecordId(t.fields.task_related_measure ?? '');
      return measureId && measureIds.has(measureId);
    });
  }, [linkedMeasures, aufgabenFreigaben]);

  const openTasks = useMemo(
    () => linkedTasks.filter((t) => t.fields.task_status?.key !== 'erledigt' && t.fields.task_status?.key !== 'abgeschlossen'),
    [linkedTasks]
  );

  const doneTasks = useMemo(
    () => linkedTasks.filter((t) => t.fields.task_status?.key === 'erledigt' || t.fields.task_status?.key === 'abgeschlossen'),
    [linkedTasks]
  );

  // Auto-select first risk / measure for use as default in dialogs
  useEffect(() => {
    if (linkedRisks.length > 0 && !selectedRiskId) {
      setSelectedRiskId(linkedRisks[0].record_id);
    }
  }, [linkedRisks, selectedRiskId]);

  useEffect(() => {
    if (linkedMeasures.length > 0 && !selectedMeasureId) {
      setSelectedMeasureId(linkedMeasures[0].record_id);
    }
  }, [linkedMeasures, selectedMeasureId]);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    setSelectedRiskId(null);
    setSelectedMeasureId(null);
    setClosedSuccess(false);
    setStep(2);
  };

  const handleCloseIncident = async () => {
    if (!selectedIncidentId) return;
    setClosing(true);
    try {
      await LivingAppsService.updateIncidentManagementEntry(selectedIncidentId, {
        incident_status: 'geschlossen',
      });
      await fetchAll();
      setClosedSuccess(true);
    } finally {
      setClosing(false);
    }
  };

  const getMeasureRiskName = (measure: MassnahmenManagement): string => {
    const riskId = extractRecordId(measure.fields.measure_risk ?? '');
    if (!riskId) return '—';
    return risikomanagementMap.get(riskId)?.fields.risk_title ?? riskId;
  };

  const getMeasureName = (taskMeasureUrl: string | undefined): string => {
    if (!taskMeasureUrl) return '—';
    const id = extractRecordId(taskMeasureUrl);
    if (!id) return '—';
    return massnahmenManagementMap.get(id)?.fields.measure_title ?? id;
  };

  return (
    <IntentWizardShell
      title="Incident Response"
      subtitle="Vollständige Bearbeitung eines Sicherheitsvorfalls"
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ─── Step 1: Incident auswählen ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <EntitySelectStep
            items={incidentManagement.map((i) => ({
              id: i.record_id,
              title: i.fields.incident_title ?? '(Kein Titel)',
              subtitle: [i.fields.incident_category?.label, i.fields.incident_severity?.label]
                .filter(Boolean)
                .join(' | '),
              status: i.fields.incident_status
                ? { key: i.fields.incident_status.key ?? '', label: i.fields.incident_status.label ?? '' }
                : undefined,
              stats: [
                { label: 'Schweregrad', value: i.fields.incident_severity?.label ?? '—' },
                { label: 'Status', value: i.fields.incident_status?.label ?? '—' },
              ],
              icon: <IconAlertTriangle size={20} className="text-destructive" />,
            }))}
            onSelect={handleSelectIncident}
            searchPlaceholder="Incident suchen..."
            emptyText="Keine Incidents vorhanden"
            createLabel="Neuen Incident erfassen"
            onCreateNew={() => setIncidentDialogOpen(true)}
            createDialog={
              <IncidentManagementDialog
                open={incidentDialogOpen}
                onClose={() => setIncidentDialogOpen(false)}
                onSubmit={async (fields) => {
                  await LivingAppsService.createIncidentManagementEntry(fields);
                  await fetchAll();
                  setIncidentDialogOpen(false);
                }}
                asset_registerList={assetRegister}
                organisationseinheitenList={organisationseinheiten}
              />
            }
          />
        </div>
      )}

      {/* ─── Step 2: Betroffene Assets & Org ─── */}
      {step === 2 && selectedIncident && (
        <div className="space-y-6">
          {/* Incident Details */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <IconAlertTriangle size={18} className="text-destructive" />
                Incident-Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Titel</p>
                <p className="font-semibold truncate">{selectedIncident.fields.incident_title ?? '—'}</p>
              </div>
              {selectedIncident.fields.incident_description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Beschreibung</p>
                  <p className="text-sm">{selectedIncident.fields.incident_description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kategorie</p>
                  <p className="text-sm">{selectedIncident.fields.incident_category?.label ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Schweregrad</p>
                  <p className="text-sm">{selectedIncident.fields.incident_severity?.label ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Erkennungsdatum</p>
                  <p className="text-sm">{selectedIncident.fields.incident_detected_at ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge
                    statusKey={selectedIncident.fields.incident_status?.key}
                    label={selectedIncident.fields.incident_status?.label}
                  />
                </div>
              </div>

              {/* Asset & Org */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="flex items-start gap-2">
                  <IconServer size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Betroffenes Asset</p>
                    <p className="text-sm truncate">{affectedAssetName ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <IconBuilding size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Betroffene Org</p>
                    <p className="text-sm truncate">{affectedOrgName ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* NIS2 / DORA */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">NIS2-Meldepflicht:</span>
                  <Badge variant={selectedIncident.fields.incident_nis2_reportable ? 'destructive' : 'secondary'}>
                    {selectedIncident.fields.incident_nis2_reportable ? 'Meldepflichtig' : 'Nicht meldepflichtig'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">DORA-Meldepflicht:</span>
                  <Badge variant={selectedIncident.fields.incident_dora_reportable ? 'destructive' : 'secondary'}>
                    {selectedIncident.fields.incident_dora_reportable ? 'Meldepflichtig' : 'Nicht meldepflichtig'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Risks */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <IconShieldCheck size={18} className="text-primary" />
                Verknüpfte Risiken
                <Badge variant="outline" className="ml-auto">{linkedRisks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {linkedRisks.length === 0 ? (
                <div className="py-6 flex flex-col items-center gap-3 text-center">
                  <IconAlertCircle size={32} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Kein Risiko für das betroffene Asset gefunden.
                  </p>
                  <Button variant="outline" onClick={() => setRisikoDialogOpen(true)}>
                    <IconPlus size={16} className="mr-2" />
                    Neues Risiko erfassen
                  </Button>
                  <RisikomanagementDialog
                    open={risikoDialogOpen}
                    onClose={() => setRisikoDialogOpen(false)}
                    onSubmit={async (fields) => {
                      await LivingAppsService.createRisikomanagementEntry(fields);
                      await fetchAll();
                      setRisikoDialogOpen(false);
                    }}
                    asset_registerList={assetRegister}
                    organisationseinheitenList={organisationseinheiten}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedRisks.map((r) => (
                    <div
                      key={r.record_id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRiskId === r.record_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedRiskId(r.record_id)}
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{r.fields.risk_title ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.fields.risk_probability?.label ?? '—'} Wahrscheinlichkeit ·{' '}
                            {r.fields.risk_impact?.label ?? '—'} Auswirkung
                          </p>
                        </div>
                        <StatusBadge statusKey={r.fields.risk_status?.key} label={r.fields.risk_status?.label} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Zurück
            </Button>
            <Button onClick={() => setStep(3)}>
              Weiter zu Maßnahmen
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Maßnahmen planen ─── */}
      {step === 3 && selectedIncident && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg">Maßnahmen planen</h2>
              <p className="text-sm text-muted-foreground">
                Für Incident: <span className="font-medium">{selectedIncident.fields.incident_title}</span>
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              <IconClipboardList size={14} className="mr-1" />
              {linkedMeasures.length} geplant
            </Badge>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconListCheck size={18} className="text-primary" />
                  Maßnahmen
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMassnahmeDialogOpen(true)}
                  disabled={linkedRisks.length === 0}
                >
                  <IconPlus size={14} className="mr-1" />
                  Neue Maßnahme
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {linkedRisks.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Zuerst ein Risiko in Schritt 2 verknüpfen.
                </p>
              )}
              {linkedRisks.length > 0 && linkedMeasures.length === 0 && (
                <div className="py-6 flex flex-col items-center gap-3 text-center">
                  <IconListCheck size={32} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Noch keine Maßnahmen geplant.
                  </p>
                  <Button variant="outline" onClick={() => setMassnahmeDialogOpen(true)}>
                    <IconPlus size={16} className="mr-2" />
                    Erste Maßnahme erstellen
                  </Button>
                </div>
              )}
              {linkedMeasures.length > 0 && (
                <div className="space-y-2">
                  {linkedMeasures.map((m) => (
                    <div
                      key={m.record_id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMeasureId === m.record_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedMeasureId(m.record_id)}
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{m.fields.measure_title ?? '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Risiko: {getMeasureRiskName(m)}
                          </p>
                        </div>
                        <StatusBadge statusKey={m.fields.measure_status?.key} label={m.fields.measure_status?.label} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <MassnahmenManagementDialog
            open={massnahmeDialogOpen}
            onClose={() => setMassnahmeDialogOpen(false)}
            onSubmit={async (fields) => {
              await LivingAppsService.createMassnahmenManagementEntry(fields);
              await fetchAll();
              setMassnahmeDialogOpen(false);
            }}
            defaultValues={
              selectedRiskId
                ? { measure_risk: createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRiskId) }
                : undefined
            }
            risikomanagementList={risikomanagement}
          />

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              Zurück
            </Button>
            <Button onClick={() => setStep(4)}>
              Weiter zu Aufgaben
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Aufgaben zuweisen ─── */}
      {step === 4 && selectedIncident && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg">Aufgaben zuweisen</h2>
              <p className="text-sm text-muted-foreground">
                Für Incident: <span className="font-medium">{selectedIncident.fields.incident_title}</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                {openTasks.length} offen
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                {doneTasks.length} erledigt
              </Badge>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconUser size={18} className="text-primary" />
                  Aufgaben
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAufgabeDialogOpen(true)}
                  disabled={linkedMeasures.length === 0}
                >
                  <IconPlus size={14} className="mr-1" />
                  Neue Aufgabe
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {linkedMeasures.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Zuerst Maßnahmen in Schritt 3 anlegen.
                </p>
              )}
              {linkedMeasures.length > 0 && linkedTasks.length === 0 && (
                <div className="py-6 flex flex-col items-center gap-3 text-center">
                  <IconUser size={32} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Noch keine Aufgaben zugewiesen.
                  </p>
                  <Button variant="outline" onClick={() => setAufgabeDialogOpen(true)}>
                    <IconPlus size={16} className="mr-2" />
                    Erste Aufgabe erstellen
                  </Button>
                </div>
              )}
              {linkedTasks.length > 0 && (
                <div className="space-y-2">
                  {linkedTasks.map((t) => (
                    <div key={t.record_id} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{t.fields.task_title ?? '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.fields.task_assignee_firstname
                              ? `${t.fields.task_assignee_firstname} ${t.fields.task_assignee_lastname ?? ''} · `
                              : ''}
                            Maßnahme: {getMeasureName(t.fields.task_related_measure)}
                          </p>
                        </div>
                        <StatusBadge statusKey={t.fields.task_status?.key} label={t.fields.task_status?.label} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <AufgabenFreigabenDialog
            open={aufgabeDialogOpen}
            onClose={() => setAufgabeDialogOpen(false)}
            onSubmit={async (fields) => {
              await LivingAppsService.createAufgabenFreigabenEntry(fields);
              await fetchAll();
              setAufgabeDialogOpen(false);
            }}
            defaultValues={
              selectedMeasureId
                ? { task_related_measure: createRecordUrl(APP_IDS.MASSNAHMEN_MANAGEMENT, selectedMeasureId) }
                : undefined
            }
            risikomanagementList={risikomanagement}
            maßnahmen_managementList={massnahmenManagement}
            audit_managementList={auditManagement}
          />

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(3)}>
              Zurück
            </Button>
            <Button onClick={() => setStep(5)}>
              Weiter zum Abschluss
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 5: Abschluss ─── */}
      {step === 5 && selectedIncident && (
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-lg">Abschluss & Zusammenfassung</h2>
            <p className="text-sm text-muted-foreground">
              Überprüfe alle Details und schließe den Incident ab.
            </p>
          </div>

          {/* Summary Card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <IconCheckbox size={18} className="text-primary" />
                Zusammenfassung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incident</p>
                <p className="font-semibold truncate">{selectedIncident.fields.incident_title ?? '—'}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold">{linkedRisks.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Risiken</p>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold">{linkedMeasures.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Maßnahmen</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{openTasks.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Offene Tasks</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{doneTasks.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Erledigte Tasks</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Aktueller Status:</span>
                  <StatusBadge
                    statusKey={selectedIncident.fields.incident_status?.key}
                    label={selectedIncident.fields.incident_status?.label}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Incident Action */}
          {closedSuccess ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <IconCheck size={24} className="text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Incident erfolgreich geschlossen</p>
                <p className="text-sm text-green-700">
                  Der Incident wurde auf &quot;Geschlossen&quot; gesetzt.
                </p>
              </div>
            </div>
          ) : (
            <Card className="overflow-hidden border-destructive/30">
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  <div>
                    <p className="font-medium">Incident abschließen</p>
                    <p className="text-sm text-muted-foreground">
                      Setzt den Status auf &quot;Geschlossen&quot;. Dieser Schritt kann nicht rückgängig gemacht werden.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="shrink-0"
                    onClick={handleCloseIncident}
                    disabled={closing || selectedIncident.fields.incident_status?.key === 'geschlossen'}
                  >
                    {closing ? (
                      <>Wird geschlossen...</>
                    ) : (
                      <>
                        <IconCheck size={16} className="mr-2" />
                        Incident schließen
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(4)}>
              Zurück
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedIncidentId(null);
                setSelectedRiskId(null);
                setSelectedMeasureId(null);
                setClosedSuccess(false);
                setStep(1);
              }}
            >
              Neuen Incident bearbeiten
            </Button>
          </div>
        </div>
      )}
    </IntentWizardShell>
  );
}
