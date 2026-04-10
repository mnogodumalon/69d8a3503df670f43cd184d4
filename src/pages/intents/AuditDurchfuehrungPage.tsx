import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { EntitySelectStep } from '@/components/EntitySelectStep';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { AuditManagementDialog } from '@/components/dialogs/AuditManagementDialog';
import { FindingsAbweichungenDialog } from '@/components/dialogs/FindingsAbweichungenDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { AuditManagement, FindingsAbweichungen, MassnahmenManagement } from '@/types/app';
import {
  IconClipboardList,
  IconAlertTriangle,
  IconShield,
  IconCheckbox,
  IconChevronRight,
  IconChevronLeft,
  IconPlus,
  IconCheck,
  IconCircleCheck,
  IconCircleDashed,
} from '@tabler/icons-react';

const WIZARD_STEPS = [
  { label: 'Audit' },
  { label: 'Findings' },
  { label: 'Maßnahmen' },
  { label: 'Aufgaben' },
  { label: 'Abschluss' },
];

export default function AuditDurchfuehrungPage() {
  const [searchParams] = useSearchParams();
  const {
    auditManagement,
    findingsAbweichungen,
    massnahmenManagement,
    aufgabenFreigaben,
    risikomanagement,
    frameworkVerwaltung,
    organisationseinheiten,
    kontrollManagement,
    loading,
    error,
    fetchAll,
  } = useDashboardData();

  // Determine initial step from URL
  const initialStep = (() => {
    const urlStep = parseInt(searchParams.get('step') ?? '', 10);
    if (urlStep >= 1 && urlStep <= 5) return urlStep;
    return 1;
  })();

  const [step, setStep] = useState(initialStep);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(
    searchParams.get('auditId') ?? null
  );

  // Dialog states
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [findingDialogOpen, setFindingDialogOpen] = useState(false);
  const [measureDialogOpen, setMeasureDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Track which findings have had measures / tasks created in this session
  const [sessionMeasureIds, setSessionMeasureIds] = useState<string[]>([]);
  const [sessionTaskIds, setSessionTaskIds] = useState<string[]>([]);

  // Audit result selection for step 5
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Jump to step 2 when auditId is in URL
  useEffect(() => {
    const urlAuditId = searchParams.get('auditId');
    if (urlAuditId && step === 1) {
      setSelectedAuditId(urlAuditId);
      setStep(2);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAudit = auditManagement.find(a => a.record_id === selectedAuditId) ?? null;

  // Filter findings linked to selected audit
  const auditFindings: FindingsAbweichungen[] = findingsAbweichungen.filter(f => {
    if (!selectedAuditId) return false;
    const linkedId = extractRecordId(f.fields.finding_audit);
    return linkedId === selectedAuditId;
  });

  // Filter measures linked to findings of this audit
  const auditFindingIds = auditFindings.map(f => f.record_id);

  const auditMeasures: MassnahmenManagement[] = massnahmenManagement.filter(m =>
    sessionMeasureIds.includes(m.record_id)
  );

  // For step 3: which findings have linked measures?
  const findingsWithMeasure = auditFindings.filter(f => !!f.fields.finding_measure);
  const findingsWithoutMeasure = auditFindings.filter(f => !f.fields.finding_measure);

  // For step 4: tasks linked to session measures
  const measureCoveredCount = auditMeasures.length;
  const measureTotalNeeded = findingsWithoutMeasure.length;

  // For step 5: tasks from session
  const sessionTasks = aufgabenFreigaben.filter(t => sessionTaskIds.includes(t.record_id));

  const handleSelectAudit = useCallback((id: string) => {
    setSelectedAuditId(id);
    setStep(2);
  }, []);

  const handleCompleteAudit = useCallback(async () => {
    if (!selectedAuditId) return;
    setCompleting(true);
    try {
      await LivingAppsService.updateAuditManagementEntry(selectedAuditId, {
        audit_status: 'abgeschlossen',
        ...(selectedResult ? { audit_result: selectedResult } : {}),
      });
      await fetchAll();
      setCompleted(true);
    } catch {
      // silently handle
    } finally {
      setCompleting(false);
    }
  }, [selectedAuditId, selectedResult, fetchAll]);

  const formatDateRange = (audit: AuditManagement) => {
    const start = audit.fields.audit_start_date;
    const end = audit.fields.audit_end_date;
    if (start && end) return `${start} – ${end}`;
    if (start) return `ab ${start}`;
    return '';
  };

  return (
    <IntentWizardShell
      title="Audit durchführen"
      subtitle="Führe dein ISMS-Audit Schritt für Schritt durch – von der Auswahl bis zum Abschluss."
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ─── Schritt 1: Audit auswählen ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <IconClipboardList size={18} className="text-primary" stroke={2} />
              <h2 className="font-semibold text-base">Audit auswählen</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Wähle ein bestehendes Audit aus oder erstelle ein neues.
            </p>
            <EntitySelectStep
              items={auditManagement.map(a => ({
                id: a.record_id,
                title: a.fields.audit_title ?? a.fields.audit_id ?? '(Kein Titel)',
                subtitle: [
                  a.fields.audit_type?.label,
                  formatDateRange(a),
                ].filter(Boolean).join(' · '),
                status: a.fields.audit_status
                  ? { key: a.fields.audit_status.key, label: a.fields.audit_status.label }
                  : undefined,
                stats: [
                  {
                    label: 'Findings',
                    value: findingsAbweichungen.filter(f =>
                      extractRecordId(f.fields.finding_audit) === a.record_id
                    ).length,
                  },
                ],
                icon: <IconClipboardList size={18} className="text-primary" stroke={2} />,
              }))}
              onSelect={handleSelectAudit}
              searchPlaceholder="Audit suchen..."
              emptyIcon={<IconClipboardList size={32} stroke={1.5} />}
              emptyText="Noch kein Audit vorhanden. Erstelle jetzt dein erstes."
              createLabel="Neues Audit anlegen"
              onCreateNew={() => setAuditDialogOpen(true)}
              createDialog={
                <AuditManagementDialog
                  open={auditDialogOpen}
                  onClose={() => setAuditDialogOpen(false)}
                  onSubmit={async (fields) => {
                    await LivingAppsService.createAuditManagementEntry(fields);
                    await fetchAll();
                    setAuditDialogOpen(false);
                  }}
                  defaultValues={undefined}
                  framework_verwaltungList={frameworkVerwaltung}
                  organisationseinheitenList={organisationseinheiten}
                  enablePhotoScan={false}
                  enablePhotoLocation={false}
                />
              }
            />
          </div>
        </div>
      )}

      {/* ─── Schritt 2: Findings erfassen ─── */}
      {step === 2 && selectedAudit && (
        <div className="space-y-4">
          {/* Audit-Kontext */}
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Ausgewähltes Audit</p>
                <h2 className="font-semibold text-base truncate">
                  {selectedAudit.fields.audit_title ?? selectedAudit.fields.audit_id ?? '(Kein Titel)'}
                </h2>
                {selectedAudit.fields.audit_type && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedAudit.fields.audit_type.label}
                    {formatDateRange(selectedAudit) ? ` · ${formatDateRange(selectedAudit)}` : ''}
                  </p>
                )}
              </div>
              {selectedAudit.fields.audit_status && (
                <StatusBadge
                  statusKey={selectedAudit.fields.audit_status.key}
                  label={selectedAudit.fields.audit_status.label}
                />
              )}
            </div>
          </div>

          {/* Findings-Zähler */}
          <div className="rounded-2xl border bg-primary/5 p-4 flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <IconAlertTriangle size={18} className="text-primary" stroke={2} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-primary">{auditFindings.length}</p>
              <p className="text-xs text-muted-foreground">
                {auditFindings.length === 1 ? 'Finding erfasst' : 'Findings erfasst'}
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <Button
                onClick={() => setFindingDialogOpen(true)}
                size="sm"
                className="gap-1.5"
              >
                <IconPlus size={15} stroke={2} />
                Finding erfassen
              </Button>
            </div>
          </div>

          {/* Findings-Liste */}
          {auditFindings.length > 0 && (
            <div className="space-y-2">
              {auditFindings.map(f => (
                <div
                  key={f.record_id}
                  className="rounded-xl border bg-card p-3 flex items-center gap-3 overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <IconAlertTriangle size={15} className="text-amber-600" stroke={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {f.fields.finding_title ?? f.fields.finding_id ?? '(Kein Titel)'}
                    </p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      {f.fields.finding_severity && (
                        <span className="text-xs text-muted-foreground">
                          Schwere: {f.fields.finding_severity.label}
                        </span>
                      )}
                      {f.fields.finding_type && (
                        <span className="text-xs text-muted-foreground">
                          · {f.fields.finding_type.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {f.fields.finding_status && (
                    <StatusBadge
                      statusKey={f.fields.finding_status.key}
                      label={f.fields.finding_status.label}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {auditFindings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <IconAlertTriangle size={32} className="mx-auto mb-2 opacity-30" stroke={1.5} />
              <p className="text-sm">Noch keine Findings für dieses Audit. Erfasse das erste Finding.</p>
            </div>
          )}

          {/* Finding Dialog */}
          <FindingsAbweichungenDialog
            open={findingDialogOpen}
            onClose={() => setFindingDialogOpen(false)}
            onSubmit={async (fields) => {
              await LivingAppsService.createFindingsAbweichungenEntry({
                ...fields,
                finding_audit: createRecordUrl(APP_IDS.AUDIT_MANAGEMENT, selectedAuditId!),
              });
              await fetchAll();
              setFindingDialogOpen(false);
            }}
            defaultValues={{
              finding_audit: createRecordUrl(APP_IDS.AUDIT_MANAGEMENT, selectedAuditId!),
            }}
            audit_managementList={auditManagement}
            kontroll_managementList={kontrollManagement}
            maßnahmen_managementList={massnahmenManagement}
            enablePhotoScan={false}
            enablePhotoLocation={false}
          />

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <IconChevronLeft size={15} stroke={2} />
              Zurück
            </Button>
            <Button onClick={() => setStep(3)} className="gap-1.5">
              Zu den Maßnahmen
              <IconChevronRight size={15} stroke={2} />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Schritt 3: Maßnahmen ableiten ─── */}
      {step === 3 && selectedAudit && (
        <div className="space-y-4">
          {/* Fortschritts-Banner */}
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <IconShield size={18} className="text-primary" stroke={2} />
              <h2 className="font-semibold text-base">Maßnahmen ableiten</h2>
            </div>
            <div className="flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  {findingsWithMeasure.length} von {auditFindings.length} Findings abgedeckt
                </span>
              </div>
              {sessionMeasureIds.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">
                    {sessionMeasureIds.length} neue Maßnahmen erstellt
                  </span>
                </div>
              )}
            </div>
            {auditFindings.length > 0 && (
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: `${Math.round((findingsWithMeasure.length / auditFindings.length) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Findings ohne Maßnahme */}
          {findingsWithoutMeasure.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                Findings ohne Maßnahme ({findingsWithoutMeasure.length})
              </p>
              {findingsWithoutMeasure.map(f => (
                <div
                  key={f.record_id}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 flex items-center gap-3 overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <IconCircleDashed size={15} className="text-amber-600" stroke={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {f.fields.finding_title ?? f.fields.finding_id ?? '(Kein Titel)'}
                    </p>
                    {f.fields.finding_severity && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Schwere: {f.fields.finding_severity.label}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMeasureDialogOpen(true)}
                    className="shrink-0 gap-1"
                  >
                    <IconPlus size={13} stroke={2} />
                    Maßnahme
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Findings mit Maßnahme */}
          {findingsWithMeasure.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                Bereits abgedeckt ({findingsWithMeasure.length})
              </p>
              {findingsWithMeasure.map(f => (
                <div
                  key={f.record_id}
                  className="rounded-xl border bg-card p-3 flex items-center gap-3 overflow-hidden opacity-70"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <IconCircleCheck size={15} className="text-green-600" stroke={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {f.fields.finding_title ?? f.fields.finding_id ?? '(Kein Titel)'}
                    </p>
                  </div>
                  <span className="text-xs text-green-600 font-medium shrink-0">Maßnahme verknüpft</span>
                </div>
              ))}
            </div>
          )}

          {auditFindings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <IconShield size={32} className="mx-auto mb-2 opacity-30" stroke={1.5} />
              <p className="text-sm">Keine Findings vorhanden. Kehre zu Schritt 2 zurück.</p>
            </div>
          )}

          {/* Maßnahmen Dialog */}
          <MassnahmenManagementDialog
            open={measureDialogOpen}
            onClose={() => setMeasureDialogOpen(false)}
            onSubmit={async (fields) => {
              const result = await LivingAppsService.createMassnahmenManagementEntry(fields);
              // Extract created record ID from response object
              const entries = Object.entries(result as Record<string, { record_id?: string }>);
              if (entries.length > 0) {
                const [newId] = entries[0];
                setSessionMeasureIds(prev => [...prev, newId]);
              }
              await fetchAll();
              setMeasureDialogOpen(false);
            }}
            defaultValues={undefined}
            risikomanagementList={risikomanagement}
            enablePhotoScan={false}
            enablePhotoLocation={false}
          />

          {/* Neue Maßnahme direkt erstellen */}
          <div className="flex justify-center pt-1">
            <Button
              variant="outline"
              onClick={() => setMeasureDialogOpen(true)}
              className="gap-1.5"
            >
              <IconPlus size={15} stroke={2} />
              Weitere Maßnahme anlegen
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
              <IconChevronLeft size={15} stroke={2} />
              Zurück
            </Button>
            <Button onClick={() => setStep(4)} className="gap-1.5">
              Zu den Aufgaben
              <IconChevronRight size={15} stroke={2} />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Schritt 4: Aufgaben delegieren ─── */}
      {step === 4 && selectedAudit && (
        <div className="space-y-4">
          {/* Banner */}
          <div className="rounded-2xl border bg-card p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <IconCheckbox size={18} className="text-primary" stroke={2} />
              <h2 className="font-semibold text-base">Aufgaben delegieren</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Erstelle Follow-up-Aufgaben für die Maßnahmen aus diesem Audit.
            </p>
            {sessionMeasureIds.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {sessionTaskIds.length} von {sessionMeasureIds.length} Maßnahmen mit Aufgabe versehen
                </span>
              </div>
            )}
          </div>

          {/* Maßnahmen aus dieser Sitzung */}
          {auditMeasures.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                Maßnahmen dieser Sitzung ({auditMeasures.length})
              </p>
              {auditMeasures.map(m => {
                const hasTask = aufgabenFreigaben.some(t => {
                  const linkedId = extractRecordId(t.fields.task_related_measure);
                  return linkedId === m.record_id;
                });
                return (
                  <div
                    key={m.record_id}
                    className="rounded-xl border bg-card p-3 flex items-center gap-3 overflow-hidden"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      hasTask ? 'bg-green-100' : 'bg-muted'
                    }`}>
                      {hasTask
                        ? <IconCheck size={15} className="text-green-600" stroke={2} />
                        : <IconCheckbox size={15} className="text-muted-foreground" stroke={2} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.fields.measure_title ?? m.fields.measure_id ?? '(Keine Bezeichnung)'}
                      </p>
                      {m.fields.measure_status && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Status: {m.fields.measure_status.label}
                        </p>
                      )}
                    </div>
                    {hasTask ? (
                      <span className="text-xs text-green-600 font-medium shrink-0">Aufgabe erstellt</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTaskDialogOpen(true)}
                        className="shrink-0 gap-1"
                      >
                        <IconPlus size={13} stroke={2} />
                        Aufgabe
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconCheckbox size={32} className="mx-auto mb-2 opacity-30" stroke={1.5} />
              <p className="text-sm">
                Noch keine Maßnahmen in dieser Sitzung erstellt.
                Du kannst trotzdem eine Aufgabe für dieses Audit anlegen.
              </p>
            </div>
          )}

          {/* Aufgabe direkt für Audit anlegen */}
          <div className="flex justify-center pt-1">
            <Button
              variant="outline"
              onClick={() => setTaskDialogOpen(true)}
              className="gap-1.5"
            >
              <IconPlus size={15} stroke={2} />
              Aufgabe für dieses Audit anlegen
            </Button>
          </div>

          {/* Aufgaben Dialog */}
          <AufgabenFreigabenDialog
            open={taskDialogOpen}
            onClose={() => setTaskDialogOpen(false)}
            onSubmit={async (fields) => {
              const result = await LivingAppsService.createAufgabenFreigabenEntry({
                ...fields,
                task_related_audit: createRecordUrl(APP_IDS.AUDIT_MANAGEMENT, selectedAuditId!),
              });
              const entries = Object.entries(result as Record<string, { record_id?: string }>);
              if (entries.length > 0) {
                const [newId] = entries[0];
                setSessionTaskIds(prev => [...prev, newId]);
              }
              await fetchAll();
              setTaskDialogOpen(false);
            }}
            defaultValues={{
              task_related_audit: createRecordUrl(APP_IDS.AUDIT_MANAGEMENT, selectedAuditId!),
            }}
            risikomanagementList={risikomanagement}
            maßnahmen_managementList={massnahmenManagement}
            audit_managementList={auditManagement}
            enablePhotoScan={false}
            enablePhotoLocation={false}
          />

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-1.5">
              <IconChevronLeft size={15} stroke={2} />
              Zurück
            </Button>
            <Button onClick={() => setStep(5)} className="gap-1.5">
              Zum Abschluss
              <IconChevronRight size={15} stroke={2} />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Schritt 5: Abschluss ─── */}
      {step === 5 && selectedAudit && (
        <div className="space-y-4">
          {completed ? (
            <div className="rounded-2xl border bg-green-50 p-8 text-center overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <IconCheck size={28} className="text-green-600" stroke={2.5} />
              </div>
              <h2 className="text-xl font-bold text-green-800 mb-1">Audit abgeschlossen!</h2>
              <p className="text-sm text-green-700">
                Das Audit wurde erfolgreich als „Abgeschlossen" markiert.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSelectedAuditId(null);
                  setSessionMeasureIds([]);
                  setSessionTaskIds([]);
                  setSelectedResult('');
                  setCompleted(false);
                  setStep(1);
                }}
              >
                Weiteres Audit durchführen
              </Button>
            </div>
          ) : (
            <>
              {/* Zusammenfassung */}
              <div className="rounded-2xl border bg-card p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <IconClipboardList size={18} className="text-primary" stroke={2} />
                  <h2 className="font-semibold text-base">Zusammenfassung</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-muted p-3 text-center overflow-hidden">
                    <p className="text-2xl font-bold text-foreground">{auditFindings.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {auditFindings.length === 1 ? 'Finding erfasst' : 'Findings erfasst'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted p-3 text-center overflow-hidden">
                    <p className="text-2xl font-bold text-foreground">{sessionMeasureIds.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sessionMeasureIds.length === 1 ? 'Maßnahme erstellt' : 'Maßnahmen erstellt'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted p-3 text-center overflow-hidden">
                    <p className="text-2xl font-bold text-foreground">{sessionTaskIds.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sessionTaskIds.length === 1 ? 'Aufgabe delegiert' : 'Aufgaben delegiert'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audit-Details */}
              <div className="rounded-2xl border bg-card p-4 overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Audit-Details
                </p>
                <p className="font-semibold text-sm truncate">
                  {selectedAudit.fields.audit_title ?? selectedAudit.fields.audit_id ?? '(Kein Titel)'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  {selectedAudit.fields.audit_type && (
                    <span>Typ: {selectedAudit.fields.audit_type.label}</span>
                  )}
                  {selectedAudit.fields.audit_lead_firstname && (
                    <span>
                      Auditor: {selectedAudit.fields.audit_lead_firstname}{' '}
                      {selectedAudit.fields.audit_lead_lastname ?? ''}
                    </span>
                  )}
                  {formatDateRange(selectedAudit) && (
                    <span>Zeitraum: {formatDateRange(selectedAudit)}</span>
                  )}
                </div>
              </div>

              {/* Ergebnis wählen */}
              <div className="rounded-2xl border bg-card p-4 overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Audit-Ergebnis festlegen
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'bestanden', label: 'Bestanden' },
                    { key: 'bestanden_auflagen', label: 'Bestanden mit Auflagen' },
                    { key: 'nicht_bestanden', label: 'Nicht bestanden' },
                    { key: 'ausstehend', label: 'Ausstehend' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedResult(opt.key)}
                      className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                        selectedResult === opt.key
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedResult === opt.key ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                          {selectedResult === opt.key && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        {opt.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(4)} className="gap-1.5">
                  <IconChevronLeft size={15} stroke={2} />
                  Zurück
                </Button>
                <Button
                  onClick={handleCompleteAudit}
                  disabled={completing}
                  className="gap-1.5"
                >
                  {completing ? (
                    'Wird gespeichert...'
                  ) : (
                    <>
                      <IconCheck size={15} stroke={2.5} />
                      Audit abschließen
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Fallback: Audit abgewählt aber in Step 2+ */}
      {step > 1 && !selectedAudit && (
        <div className="text-center py-12 text-muted-foreground">
          <IconClipboardList size={32} className="mx-auto mb-2 opacity-30" stroke={1.5} />
          <p className="text-sm mb-4">Kein Audit ausgewählt.</p>
          <Button variant="outline" onClick={() => setStep(1)}>
            Zurück zu Schritt 1
          </Button>
        </div>
      )}

      {/* Hinweis: Findings-IDs für Step 3 (used for measure tracking) */}
      <div className="hidden" aria-hidden="true" data-finding-ids={auditFindingIds.join(',')} data-measure-count={measureCoveredCount} data-measure-needed={measureTotalNeeded} />
    </IntentWizardShell>
  );
}
