import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { EntitySelectStep } from '@/components/EntitySelectStep';
import { StatusBadge } from '@/components/StatusBadge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { Risikomanagement, MassnahmenManagement, AufgabenFreigaben } from '@/types/app';
import { RisikomanagementDialog } from '@/components/dialogs/RisikomanagementDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconShieldExclamation,
  IconShield,
  IconAlertTriangle,
  IconListCheck,
  IconCheckbox,
  IconChevronRight,
  IconChevronLeft,
  IconPlus,
  IconScale,
  IconCircleCheck,
  IconLoader2,
} from '@tabler/icons-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskScoreColor(score: number | undefined): string {
  if (score === undefined) return 'bg-muted text-muted-foreground';
  if (score >= 15) return 'bg-red-100 text-red-700';
  if (score >= 8) return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}

function riskScoreLabel(score: number | undefined): string {
  if (score === undefined) return '–';
  if (score >= 15) return 'Hoch';
  if (score >= 8) return 'Mittel';
  return 'Gering';
}

function nettoScore(risk: Risikomanagement): number | undefined {
  const p = risk.fields.risk_probability_netto?.key;
  const i = risk.fields.risk_impact_netto?.key;
  if (!p || !i) return undefined;
  const pNum = parseInt(p.replace('p', ''), 10);
  const iNum = parseInt(i.replace('i', ''), 10);
  if (isNaN(pNum) || isNaN(iNum)) return undefined;
  return pNum * iNum;
}

// ---------------------------------------------------------------------------
// Wizard step definitions
// ---------------------------------------------------------------------------

const STEPS = [
  { label: 'Risiko wählen' },
  { label: 'Strategie' },
  { label: 'Maßnahmen' },
  { label: 'Kontrollen' },
  { label: 'Abschluss' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RisikoBehandlungPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    risikomanagement,
    massnahmenManagement,
    kontrollManagement,
    aufgabenFreigaben,
    auditManagement,
    assetRegister,
    organisationseinheiten,
    loading,
    error,
    fetchAll,
  } = useDashboardData();

  // ------- Wizard state -------
  const initialStep = (() => {
    const s = parseInt(searchParams.get('step') ?? '', 10);
    if (s >= 1 && s <= 5) return s;
    return 1;
  })();
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Pre-select risk from URL param
  const urlRiskId = searchParams.get('riskId') ?? null;
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(urlRiskId);

  // Treatment strategy (might be pre-filled from risk)
  const [chosenTreatment, setChosenTreatment] = useState<string | null>(null);

  // Track created measure IDs in this session
  const [sessionMeasureIds, setSessionMeasureIds] = useState<string[]>([]);

  // Track created task IDs in this session
  const [sessionTaskIds, setSessionTaskIds] = useState<string[]>([]);

  // Saving state for step 5 final action
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  // Dialog open states
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [measureDialogOpen, setMeasureDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Sync step to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentStep > 1) {
      params.set('step', String(currentStep));
    } else {
      params.delete('step');
    }
    if (selectedRiskId) {
      params.set('riskId', selectedRiskId);
    } else {
      params.delete('riskId');
    }
    setSearchParams(params, { replace: true });
  }, [currentStep, selectedRiskId, searchParams, setSearchParams]);

  // If URL has riskId and step, jump to step 2+ on initial mount
  useEffect(() => {
    if (urlRiskId && initialStep === 1) {
      setCurrentStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived: selected risk object
  const selectedRisk = useMemo(
    () => risikomanagement.find(r => r.record_id === selectedRiskId) ?? null,
    [risikomanagement, selectedRiskId]
  );

  // Sync chosenTreatment from risk when risk changes
  useEffect(() => {
    if (selectedRisk?.fields.risk_treatment?.key) {
      setChosenTreatment(selectedRisk.fields.risk_treatment.key);
    }
  }, [selectedRisk]);

  // Measures linked to selected risk
  const linkedMeasures = useMemo(() => {
    if (!selectedRiskId) return [];
    const riskUrl = createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRiskId);
    return massnahmenManagement.filter(m => m.fields.measure_risk === riskUrl);
  }, [massnahmenManagement, selectedRiskId]);

  // Tasks linked to selected risk
  const linkedTasks = useMemo(() => {
    if (!selectedRiskId) return [];
    const riskUrl = createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRiskId);
    return aufgabenFreigaben.filter(t => t.fields.task_related_risk === riskUrl);
  }, [aufgabenFreigaben, selectedRiskId]);

  // Controls that reference any linked measure
  const linkedControls = useMemo(() => {
    if (linkedMeasures.length === 0) return [];
    const measureUrls = new Set(
      linkedMeasures.map(m => createRecordUrl(APP_IDS.MASSNAHMEN_MANAGEMENT, m.record_id))
    );
    return kontrollManagement.filter(c => c.fields.ctrl_measure && measureUrls.has(c.fields.ctrl_measure));
  }, [kontrollManagement, linkedMeasures]);

  // Handle select risk → go to step 2
  const handleSelectRisk = useCallback((id: string) => {
    setSelectedRiskId(id);
    setCurrentStep(2);
  }, []);

  // Handle treatment strategy chosen → decide next step
  const handleConfirmTreatment = useCallback(() => {
    if (!chosenTreatment) return;
    if (chosenTreatment === 'reduzieren' || chosenTreatment === 'uebertragen') {
      setCurrentStep(3);
    } else if (chosenTreatment === 'akzeptieren') {
      setCurrentStep(4);
    } else if (chosenTreatment === 'vermeiden') {
      setCurrentStep(5);
    }
  }, [chosenTreatment]);

  // Final: update risk status
  const handleFinish = useCallback(async () => {
    if (!selectedRiskId) return;
    setSaving(true);
    try {
      const newStatus = sessionMeasureIds.length > 0 ? 'in_behandlung' : 'akzeptiert';
      await LivingAppsService.updateRisikomanagementEntry(selectedRiskId, {
        risk_status: newStatus,
      });
      await fetchAll();
      setFinished(true);
    } finally {
      setSaving(false);
    }
  }, [selectedRiskId, sessionMeasureIds, fetchAll]);

  // Treatment strategy options
  const treatmentOptions = [
    { key: 'reduzieren', label: 'Reduzieren', desc: 'Maßnahmen zur Risikominderung einleiten', color: 'border-blue-200 bg-blue-50' },
    { key: 'akzeptieren', label: 'Akzeptieren', desc: 'Risiko bewusst akzeptieren, keine Maßnahmen', color: 'border-green-200 bg-green-50' },
    { key: 'vermeiden', label: 'Vermeiden', desc: 'Risikoauslösende Aktivität einstellen', color: 'border-orange-200 bg-orange-50' },
    { key: 'uebertragen', label: 'Übertragen', desc: 'Risiko auf Dritte übertragen (z. B. Versicherung)', color: 'border-purple-200 bg-purple-50' },
  ];

  const bruttoScore = selectedRisk?.fields.risk_score_brutto;
  const nettoScoreVal = selectedRisk ? nettoScore(selectedRisk) : undefined;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <IntentWizardShell
      title="Risikobehandlung"
      subtitle="Identifiziertes Risiko bewerten, Strategie festlegen und Maßnahmen einleiten"
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ===== SCHRITT 1: Risiko auswählen ===== */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconShieldExclamation size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Risiko auswählen</h2>
                <p className="text-xs text-muted-foreground">Wähle ein bestehendes Risiko oder lege ein neues an</p>
              </div>
            </div>
            <EntitySelectStep
              items={risikomanagement.map(r => {
                const score = r.fields.risk_score_brutto;
                const cats = r.fields.risk_category?.map(c => c.label).join(', ') ?? '';
                return {
                  id: r.record_id,
                  title: r.fields.risk_description
                    ? r.fields.risk_description.slice(0, 80) + (r.fields.risk_description.length > 80 ? '…' : '')
                    : '(Kein Titel)',
                  subtitle: [
                    cats,
                    r.fields.risk_probability?.label,
                    r.fields.risk_impact?.label,
                  ].filter(Boolean).join(' · '),
                  status: r.fields.risk_status
                    ? { key: r.fields.risk_status.key, label: r.fields.risk_status.label }
                    : undefined,
                  stats: [
                    { label: 'Brutto-Score', value: score !== undefined ? `${score} (${riskScoreLabel(score)})` : '–' },
                    { label: 'Strategie', value: r.fields.risk_treatment?.label ?? '–' },
                  ],
                  icon: <IconShieldExclamation size={18} className={score !== undefined && score >= 15 ? 'text-red-500' : score !== undefined && score >= 8 ? 'text-yellow-500' : 'text-green-500'} />,
                };
              })}
              onSelect={handleSelectRisk}
              searchPlaceholder="Risiko suchen…"
              emptyText="Kein Risiko gefunden. Lege ein neues an."
              emptyIcon={<IconShieldExclamation size={32} />}
              createLabel="Neues Risiko anlegen"
              onCreateNew={() => setRiskDialogOpen(true)}
              createDialog={
                <RisikomanagementDialog
                  open={riskDialogOpen}
                  onClose={() => setRiskDialogOpen(false)}
                  onSubmit={async (fields) => {
                    const resp = await LivingAppsService.createRisikomanagementEntry(fields);
                    await fetchAll();
                    // Auto-select newly created risk
                    const entries = Object.entries(resp as Record<string, unknown>);
                    if (entries.length > 0) {
                      const [newId] = entries[0];
                      setSelectedRiskId(newId);
                      setRiskDialogOpen(false);
                      setCurrentStep(2);
                    } else {
                      setRiskDialogOpen(false);
                    }
                  }}
                  defaultValues={undefined}
                  asset_registerList={assetRegister}
                  organisationseinheitenList={organisationseinheiten}
                  enablePhotoScan={false}
                  enablePhotoLocation={false}
                />
              }
            />
          </div>
        </div>
      )}

      {/* ===== SCHRITT 2: Behandlungsstrategie ===== */}
      {currentStep === 2 && selectedRisk && (
        <div className="space-y-4">
          {/* Risk summary card */}
          <div className="rounded-2xl border bg-card p-5 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconShieldExclamation size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {selectedRisk.fields.risk_description ?? '(Kein Titel)'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedRisk.fields.risk_category?.map(c => c.label).join(', ') ?? '–'}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bruttoScore !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskScoreColor(bruttoScore)}`}>
                      Brutto: {bruttoScore} – {riskScoreLabel(bruttoScore)}
                    </span>
                  )}
                  {nettoScoreVal !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskScoreColor(nettoScoreVal)}`}>
                      Netto: {nettoScoreVal} – {riskScoreLabel(nettoScoreVal)}
                    </span>
                  )}
                  {selectedRisk.fields.risk_status && (
                    <StatusBadge
                      statusKey={selectedRisk.fields.risk_status.key}
                      label={selectedRisk.fields.risk_status.label}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Score comparison */}
          {(bruttoScore !== undefined || nettoScoreVal !== undefined) && (
            <div className="rounded-2xl border bg-card p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <IconScale size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">Score-Vergleich</span>
              </div>
              <div className="flex gap-4 flex-wrap">
                {bruttoScore !== undefined && (
                  <div className="flex-1 min-w-[120px] rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Brutto-Risiko</p>
                    <p className={`text-2xl font-bold ${bruttoScore >= 15 ? 'text-red-600' : bruttoScore >= 8 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {bruttoScore}
                    </p>
                    <p className="text-xs text-muted-foreground">{riskScoreLabel(bruttoScore)}</p>
                  </div>
                )}
                {nettoScoreVal !== undefined && (
                  <div className="flex-1 min-w-[120px] rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Netto-Risiko</p>
                    <p className={`text-2xl font-bold ${nettoScoreVal >= 15 ? 'text-red-600' : nettoScoreVal >= 8 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {nettoScoreVal}
                    </p>
                    <p className="text-xs text-muted-foreground">{riskScoreLabel(nettoScoreVal)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strategy picker */}
          <div className="rounded-2xl border bg-card p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <IconScale size={16} className="text-primary" />
              <h2 className="font-semibold text-sm">Behandlungsstrategie wählen</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {treatmentOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setChosenTreatment(opt.key)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    chosenTreatment === opt.key
                      ? 'border-primary ring-2 ring-primary/20 ' + opt.color
                      : 'border-border hover:border-primary/40 bg-card'
                  }`}
                >
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <IconChevronLeft size={16} className="mr-1" />
              Zurück
            </Button>
            <Button
              onClick={handleConfirmTreatment}
              disabled={!chosenTreatment}
            >
              Strategie bestätigen
              <IconChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ===== SCHRITT 3: Maßnahmen anlegen ===== */}
      {currentStep === 3 && selectedRisk && (
        <div className="space-y-4">
          {/* Context banner */}
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconListCheck size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {selectedRisk.fields.risk_description ?? '(Kein Titel)'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Strategie: <span className="font-medium">{treatmentOptions.find(t => t.key === chosenTreatment)?.label ?? chosenTreatment}</span>
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {linkedMeasures.length} Maßnahme{linkedMeasures.length !== 1 ? 'n' : ''}
              </Badge>
            </div>
          </div>

          {/* Already linked measures */}
          {linkedMeasures.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 overflow-hidden">
              <p className="text-sm font-medium mb-3">Bereits verknüpfte Maßnahmen</p>
              <div className="space-y-2">
                {linkedMeasures.map(m => (
                  <div
                    key={m.record_id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      sessionMeasureIds.includes(m.record_id) ? 'border-primary/30 bg-primary/5' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconListCheck size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.fields.measure_title ?? '(Kein Titel)'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[m.fields.measure_type?.label, m.fields.measure_status?.label].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {sessionMeasureIds.includes(m.record_id) && (
                      <Badge variant="secondary" className="text-xs shrink-0">Neu</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add measure */}
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Neue Maßnahme anlegen</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMeasureDialogOpen(true)}
                className="gap-1.5 shrink-0"
              >
                <IconPlus size={14} />
                Maßnahme anlegen
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Lege eine oder mehrere Maßnahmen an, die direkt mit diesem Risiko verknüpft werden.
            </p>
            <MassnahmenManagementDialog
              open={measureDialogOpen}
              onClose={() => setMeasureDialogOpen(false)}
              onSubmit={async (fields) => {
                // Pre-link to the risk
                const linkedFields: MassnahmenManagement['fields'] = {
                  ...fields,
                  measure_risk: createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRisk.record_id),
                };
                const resp = await LivingAppsService.createMassnahmenManagementEntry(linkedFields);
                await fetchAll();
                // Track created ID
                const entries = Object.entries(resp as Record<string, unknown>);
                if (entries.length > 0) {
                  const [newId] = entries[0];
                  setSessionMeasureIds(prev => [...prev, newId]);
                }
                setMeasureDialogOpen(false);
              }}
              defaultValues={{
                measure_risk: createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRisk.record_id),
              }}
              risikomanagementList={risikomanagement}
              enablePhotoScan={false}
              enablePhotoLocation={false}
            />
          </div>

          {/* Live counter */}
          <div className="flex items-center gap-2 px-1">
            <IconListCheck size={16} className="text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{linkedMeasures.length}</span> Maßnahme{linkedMeasures.length !== 1 ? 'n' : ''} für dieses Risiko
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <IconChevronLeft size={16} className="mr-1" />
              Zurück
            </Button>
            <Button onClick={() => setCurrentStep(4)}>
              Weiter zu Kontrollen
              <IconChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ===== SCHRITT 4: Kontrollen & Aufgaben ===== */}
      {currentStep === 4 && selectedRisk && (
        <div className="space-y-4">
          {/* Context banner */}
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconCheckbox size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {selectedRisk.fields.risk_description ?? '(Kein Titel)'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {linkedMeasures.length} Maßnahme{linkedMeasures.length !== 1 ? 'n' : ''} · {linkedControls.length} zugeordnete Kontrolle{linkedControls.length !== 1 ? 'n' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Controls linked via measures */}
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <IconCheckbox size={16} className="text-primary" />
              <p className="text-sm font-medium">Zugeordnete Kontrollen</p>
            </div>
            {kontrollManagement.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine Kontrollen vorhanden.</p>
            ) : linkedControls.length > 0 ? (
              <div className="space-y-2">
                {linkedControls.map(c => (
                  <div key={c.record_id} className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconCheckbox size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.fields.ctrl_title ?? c.fields.ctrl_id ?? '(Kein Titel)'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[c.fields.ctrl_type?.label, c.fields.ctrl_implementation_status?.label].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Noch keine Kontrollen über verknüpfte Maßnahmen gefunden.
                  {linkedMeasures.length === 0
                    ? ' Lege zuerst Maßnahmen im vorherigen Schritt an.'
                    : ' Weise den Maßnahmen Kontrollen in der Kontrollverwaltung zu.'}
                </p>
              </div>
            )}
          </div>

          {/* All controls overview (for reference) */}
          {kontrollManagement.length > 0 && linkedControls.length < kontrollManagement.length && (
            <div className="rounded-2xl border bg-card p-4 overflow-hidden">
              <p className="text-sm font-medium mb-3">Alle verfügbaren Kontrollen ({kontrollManagement.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {kontrollManagement.slice(0, 20).map(c => {
                  const isLinked = linkedControls.some(lc => lc.record_id === c.record_id);
                  return (
                    <div key={c.record_id} className={`flex items-center gap-3 p-3 rounded-xl border ${isLinked ? 'border-primary/30 bg-primary/5 opacity-50' : ''}`}>
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <IconShield size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.fields.ctrl_title ?? c.fields.ctrl_id ?? '–'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.fields.ctrl_implementation_status?.label ?? '–'}
                        </p>
                      </div>
                      {isLinked && <Badge variant="secondary" className="text-xs shrink-0">Verknüpft</Badge>}
                    </div>
                  );
                })}
                {kontrollManagement.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    … und {kontrollManagement.length - 20} weitere
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Create follow-up task */}
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Aufgabe erstellen</p>
                <p className="text-xs text-muted-foreground">Erstelle eine Folgeaufgabe, die direkt mit diesem Risiko verknüpft ist</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTaskDialogOpen(true)}
                className="gap-1.5 shrink-0"
              >
                <IconPlus size={14} />
                Aufgabe anlegen
              </Button>
            </div>

            {/* Existing linked tasks */}
            {linkedTasks.length > 0 && (
              <div className="space-y-2 mt-3">
                {linkedTasks.map(t => (
                  <div
                    key={t.record_id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      sessionTaskIds.includes(t.record_id) ? 'border-primary/30 bg-primary/5' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <IconAlertTriangle size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.fields.task_title ?? '(Kein Titel)'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[t.fields.task_priority?.label, t.fields.task_status?.label].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {sessionTaskIds.includes(t.record_id) && (
                      <Badge variant="secondary" className="text-xs shrink-0">Neu</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            <AufgabenFreigabenDialog
              open={taskDialogOpen}
              onClose={() => setTaskDialogOpen(false)}
              onSubmit={async (fields) => {
                const linkedFields: AufgabenFreigaben['fields'] = {
                  ...fields,
                  task_related_risk: createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRisk.record_id),
                };
                const resp = await LivingAppsService.createAufgabenFreigabenEntry(linkedFields);
                await fetchAll();
                const entries = Object.entries(resp as Record<string, unknown>);
                if (entries.length > 0) {
                  const [newId] = entries[0];
                  setSessionTaskIds(prev => [...prev, newId]);
                }
                setTaskDialogOpen(false);
              }}
              defaultValues={{
                task_related_risk: createRecordUrl(APP_IDS.RISIKOMANAGEMENT, selectedRisk.record_id),
              }}
              risikomanagementList={risikomanagement}
              maßnahmen_managementList={massnahmenManagement}
              audit_managementList={auditManagement}
              enablePhotoScan={false}
              enablePhotoLocation={false}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (chosenTreatment === 'reduzieren' || chosenTreatment === 'uebertragen') {
                  setCurrentStep(3);
                } else {
                  setCurrentStep(2);
                }
              }}
            >
              <IconChevronLeft size={16} className="mr-1" />
              Zurück
            </Button>
            <Button onClick={() => setCurrentStep(5)}>
              Weiter zum Abschluss
              <IconChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ===== SCHRITT 5: Abschluss ===== */}
      {currentStep === 5 && selectedRisk && (
        <div className="space-y-4">
          {finished ? (
            /* Success state */
            <div className="rounded-2xl border bg-card p-8 overflow-hidden text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
                <IconCircleCheck size={28} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Risikobehandlung abgeschlossen</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Das Risiko wurde erfolgreich behandelt und der Status aktualisiert.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRiskId(null);
                    setChosenTreatment(null);
                    setSessionMeasureIds([]);
                    setSessionTaskIds([]);
                    setFinished(false);
                    setCurrentStep(1);
                  }}
                >
                  Weiteres Risiko behandeln
                </Button>
                <Button asChild>
                  <a href="#/risikomanagement">Zur Risikoliste</a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="rounded-2xl border bg-card p-5 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <IconCircleCheck size={18} className="text-primary" />
                  </div>
                  <h2 className="font-semibold text-sm">Zusammenfassung</h2>
                </div>
                <div className="space-y-3">
                  {/* Risk name */}
                  <div className="flex gap-3 items-start">
                    <div className="w-5 shrink-0 text-muted-foreground mt-0.5">
                      <IconShieldExclamation size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Risiko</p>
                      <p className="text-sm font-medium truncate">{selectedRisk.fields.risk_description ?? '(Kein Titel)'}</p>
                    </div>
                  </div>

                  {/* Treatment */}
                  <div className="flex gap-3 items-start">
                    <div className="w-5 shrink-0 text-muted-foreground mt-0.5">
                      <IconScale size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Behandlungsstrategie</p>
                      <p className="text-sm font-medium">
                        {treatmentOptions.find(t => t.key === chosenTreatment)?.label ?? chosenTreatment ?? '–'}
                      </p>
                    </div>
                  </div>

                  {/* Measures */}
                  <div className="flex gap-3 items-start">
                    <div className="w-5 shrink-0 text-muted-foreground mt-0.5">
                      <IconListCheck size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Maßnahmen</p>
                      <p className="text-sm font-medium">
                        {linkedMeasures.length} Maßnahme{linkedMeasures.length !== 1 ? 'n' : ''} verknüpft
                        {sessionMeasureIds.length > 0 && ` (${sessionMeasureIds.length} neu angelegt)`}
                      </p>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="flex gap-3 items-start">
                    <div className="w-5 shrink-0 text-muted-foreground mt-0.5">
                      <IconAlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Aufgaben</p>
                      <p className="text-sm font-medium">
                        {linkedTasks.length} Aufgabe{linkedTasks.length !== 1 ? 'n' : ''} zugewiesen
                        {sessionTaskIds.length > 0 && ` (${sessionTaskIds.length} neu)`}
                      </p>
                    </div>
                  </div>

                  {/* Risk scores */}
                  <div className="flex gap-3 items-start">
                    <div className="w-5 shrink-0 text-muted-foreground mt-0.5">
                      <IconScale size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Risikoscore</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {bruttoScore !== undefined && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskScoreColor(bruttoScore)}`}>
                            Brutto: {bruttoScore}
                          </span>
                        )}
                        {nettoScoreVal !== undefined && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskScoreColor(nettoScoreVal)}`}>
                            Netto: {nettoScoreVal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status update preview */}
              <div className="rounded-2xl border bg-card p-4 overflow-hidden">
                <p className="text-sm font-medium mb-1">Statusaktualisierung</p>
                <p className="text-xs text-muted-foreground">
                  Der Risikostatusw wird auf{' '}
                  <span className="font-semibold text-foreground">
                    {sessionMeasureIds.length > 0 ? '"In Behandlung"' : '"Akzeptiert"'}
                  </span>{' '}
                  gesetzt.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(4)}
                  disabled={saving}
                >
                  <IconChevronLeft size={16} className="mr-1" />
                  Zurück
                </Button>
                <Button onClick={handleFinish} disabled={saving}>
                  {saving ? (
                    <>
                      <IconLoader2 size={16} className="mr-2 animate-spin" />
                      Wird gespeichert…
                    </>
                  ) : (
                    <>
                      <IconCircleCheck size={16} className="mr-2" />
                      Risikobehandlung abschließen
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Fallback: if step 2-5 but no risk selected */}
      {currentStep > 1 && !selectedRisk && !loading && (
        <div className="rounded-2xl border bg-card p-8 text-center space-y-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <IconShieldExclamation size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Kein Risiko ausgewählt.</p>
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            Zum Risiko-Auswahlschritt
          </Button>
        </div>
      )}
    </IntentWizardShell>
  );
}
