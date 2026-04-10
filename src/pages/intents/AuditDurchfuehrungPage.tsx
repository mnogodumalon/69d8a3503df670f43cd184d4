import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { AuditManagement, KontrollManagement, FindingsAbweichungen, MassnahmenManagement, AufgabenFreigaben, FrameworkVerwaltung, Risikomanagement, Organisationseinheiten } from '@/types/app';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { EntitySelectStep } from '@/components/EntitySelectStep';
import { StatusBadge } from '@/components/StatusBadge';
import { AuditManagementDialog } from '@/components/dialogs/AuditManagementDialog';
import { FindingsAbweichungenDialog } from '@/components/dialogs/FindingsAbweichungenDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconClipboardList,
  IconShield,
  IconAlertCircle,
  IconCheckbox,
  IconListCheck,
  IconCheck,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

const STEPS = [
  { label: 'Audit' },
  { label: 'Kontrollen' },
  { label: 'Findings' },
  { label: 'Maßnahmen' },
  { label: 'Aufgaben' },
  { label: 'Abschluss' },
];

export default function AuditDurchfuehrungPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    auditManagement,
    kontrollManagement,
    findingsAbweichungen,
    massnahmenManagement,
    aufgabenFreigaben,
    frameworkVerwaltung,
    risikomanagement,
    organisationseinheiten,
    loading,
    error,
    fetchAll,
  } = useDashboardData();

  // Read initial state from URL params
  const urlAuditId = searchParams.get('auditId') ?? '';
  const urlStep = parseInt(searchParams.get('step') ?? '0', 10);

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (urlAuditId && !isNaN(urlStep) && urlStep >= 1) return urlStep;
    if (urlAuditId) return 1;
    return 0;
  });
  const [selectedAuditId, setSelectedAuditId] = useState<string>(urlAuditId);

  // Dialog states
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [findingDialogOpen, setFindingDialogOpen] = useState(false);
  const [massnahmeDialogOpen, setMassnahmeDialogOpen] = useState(false);
  const [aufgabeDialogOpen, setAufgabeDialogOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Sync URL when step or audit changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedAuditId) params.set('auditId', selectedAuditId);
    else params.delete('auditId');
    if (currentStep > 0) params.set('step', String(currentStep));
    else params.delete('step');
    setSearchParams(params, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedAuditId]);

  const selectedAudit = useMemo<AuditManagement | undefined>(
    () => auditManagement.find(a => a.record_id === selectedAuditId),
    [auditManagement, selectedAuditId]
  );

  const auditFrameworkId = useMemo<string>(() => {
    if (!selectedAudit?.fields.audit_framework) return '';
    return extractRecordId(selectedAudit.fields.audit_framework) ?? '';
  }, [selectedAudit]);

  const filteredKontrollen = useMemo<KontrollManagement[]>(() => {
    if (!auditFrameworkId) return kontrollManagement;
    return kontrollManagement.filter(k => {
      const fwId = extractRecordId(k.fields.ctrl_framework ?? '');
      return fwId === auditFrameworkId;
    });
  }, [kontrollManagement, auditFrameworkId]);

  const auditFindings = useMemo<FindingsAbweichungen[]>(() => {
    if (!selectedAuditId) return [];
    return findingsAbweichungen.filter(f => {
      const auditId = extractRecordId(f.fields.finding_audit ?? '');
      return auditId === selectedAuditId;
    });
  }, [findingsAbweichungen, selectedAuditId]);

  const auditTasks = useMemo<AufgabenFreigaben[]>(() => {
    if (!selectedAuditId) return [];
    return aufgabenFreigaben.filter(t => {
      const relAuditId = extractRecordId(t.fields.task_related_audit ?? '');
      return relAuditId === selectedAuditId;
    });
  }, [aufgabenFreigaben, selectedAuditId]);

  const implementedCount = useMemo<number>(
    () => filteredKontrollen.filter(k => k.fields.ctrl_implementation_status?.key === 'vollstaendig_implementiert').length,
    [filteredKontrollen]
  );

  const findingsBySeverity = useMemo(() => {
    const counts: Record<string, number> = { kritisch: 0, hoch: 0, mittel: 0, niedrig: 0, informativ: 0 };
    auditFindings.forEach(f => {
      const sev = f.fields.finding_severity?.key ?? 'niedrig';
      if (sev in counts) counts[sev]++;
    });
    return counts;
  }, [auditFindings]);

  const findingsWithMeasures = useMemo<number>(
    () => auditFindings.filter(f => f.fields.finding_measure).length,
    [auditFindings]
  );

  const openTasks = useMemo<number>(
    () => auditTasks.filter(t => t.fields.task_status?.key !== 'erledigt' && t.fields.task_status?.key !== 'abgebrochen').length,
    [auditTasks]
  );
  const doneTasks = useMemo<number>(
    () => auditTasks.filter(t => t.fields.task_status?.key === 'erledigt').length,
    [auditTasks]
  );

  const frameworkVerwaltungListProp = useMemo<FrameworkVerwaltung[]>(() => frameworkVerwaltung, [frameworkVerwaltung]);
  const organisationseinheitenListProp = useMemo<Organisationseinheiten[]>(() => organisationseinheiten, [organisationseinheiten]);
  const risikomanagementListProp = useMemo<Risikomanagement[]>(() => risikomanagement, [risikomanagement]);
  const massnahmenListProp = useMemo<MassnahmenManagement[]>(() => massnahmenManagement, [massnahmenManagement]);
  const auditManagementListProp = useMemo<AuditManagement[]>(() => auditManagement, [auditManagement]);

  function goToStep(step: number) {
    setCurrentStep(step);
  }

  function handleSelectAudit(id: string) {
    setSelectedAuditId(id);
    setCurrentStep(1);
  }

  async function handleCompleteAudit() {
    if (!selectedAuditId) return;
    setCompleting(true);
    try {
      await LivingAppsService.updateAuditManagementEntry(selectedAuditId, { audit_status: 'abgeschlossen' });
      await fetchAll();
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  }

  // Render helpers
  function NavButtons({ canGoBack = true, canGoNext = true, nextLabel = 'Weiter', onNext }: { canGoBack?: boolean; canGoNext?: boolean; nextLabel?: string; onNext?: () => void }) {
    return (
      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => goToStep(currentStep - 1)}
          disabled={!canGoBack || currentStep === 0}
          className="gap-1.5"
        >
          <IconChevronLeft size={16} />
          Zurück
        </Button>
        {onNext && (
          <Button onClick={onNext} disabled={!canGoNext} className="gap-1.5">
            {nextLabel}
            <IconChevronRight size={16} />
          </Button>
        )}
      </div>
    );
  }

  // Step 0: Audit auswählen
  function renderStep0() {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Audit auswählen</h2>
          <p className="text-sm text-muted-foreground mt-1">Wähle ein Audit aus oder lege ein neues an.</p>
        </div>
        <EntitySelectStep
          items={auditManagement.map(a => ({
            id: a.record_id,
            title: a.fields.audit_title ?? '(Kein Titel)',
            subtitle: [a.fields.audit_type?.label, a.fields.audit_scope].filter(Boolean).join(' | '),
            status: a.fields.audit_status ? { key: a.fields.audit_status.key, label: a.fields.audit_status.label } : undefined,
            stats: [
              { label: 'Start', value: a.fields.audit_start_date ? formatDate(a.fields.audit_start_date) : '–' },
              { label: 'Status', value: a.fields.audit_status?.label ?? '–' },
            ],
            icon: <IconClipboardList size={20} className="text-primary" />,
          }))}
          onSelect={handleSelectAudit}
          searchPlaceholder="Audit suchen..."
          emptyIcon={<IconClipboardList size={32} />}
          emptyText="Keine Audits gefunden. Erstelle dein erstes Audit."
          createLabel="Neues Audit anlegen"
          onCreateNew={() => setAuditDialogOpen(true)}
          createDialog={
            <AuditManagementDialog
              open={auditDialogOpen}
              onClose={() => setAuditDialogOpen(false)}
              onSubmit={async (fields) => {
                const result = await LivingAppsService.createAuditManagementEntry(fields);
                await fetchAll();
                // auto-select the newly created record
                if (result && typeof result === 'object') {
                  const entries = Object.entries(result as Record<string, unknown>);
                  if (entries.length > 0) {
                    const [newId] = entries[0];
                    setAuditDialogOpen(false);
                    handleSelectAudit(newId);
                  }
                }
              }}
              framework_verwaltungList={frameworkVerwaltungListProp}
              organisationseinheitenList={organisationseinheitenListProp}
              enablePhotoScan={AI_PHOTO_SCAN['AuditManagement']}
              enablePhotoLocation={AI_PHOTO_LOCATION['AuditManagement']}
            />
          }
        />
      </div>
    );
  }

  // Step 1: Kontrollen prüfen
  function renderStep1() {
    if (!selectedAudit) return null;
    const fw = frameworkVerwaltung.find(f => f.record_id === auditFrameworkId);
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl border bg-card space-y-2">
          <h2 className="text-lg font-semibold truncate">{selectedAudit.fields.audit_title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Framework</span>
              <p className="font-medium truncate">{fw?.fields.fw_name ?? '–'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Typ</span>
              <p className="font-medium">{selectedAudit.fields.audit_type?.label ?? '–'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Start</span>
              <p className="font-medium">{selectedAudit.fields.audit_start_date ? formatDate(selectedAudit.fields.audit_start_date) : '–'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Ende</span>
              <p className="font-medium">{selectedAudit.fields.audit_end_date ? formatDate(selectedAudit.fields.audit_end_date) : '–'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Kontrollen</h3>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{implementedCount}</span> von <span className="font-semibold text-foreground">{filteredKontrollen.length}</span> implementiert
          </span>
        </div>

        {filteredKontrollen.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <IconShield size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Keine Kontrollen für dieses Framework gefunden.</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-x-auto">
            {filteredKontrollen.map(k => (
              <div key={k.record_id} className="flex items-center gap-3 p-3 rounded-xl border bg-card overflow-hidden">
                <div className="shrink-0 text-muted-foreground">
                  <IconShield size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{k.fields.ctrl_id}</span>
                    <span className="text-sm font-medium truncate">{k.fields.ctrl_title}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge
                    statusKey={k.fields.ctrl_implementation_status?.key}
                    label={k.fields.ctrl_implementation_status?.label}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <NavButtons canGoBack onNext={() => goToStep(2)} />
      </div>
    );
  }

  // Step 2: Findings erfassen
  function renderStep2() {
    if (!selectedAudit) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold">Findings erfassen</h2>
            <p className="text-sm text-muted-foreground">Erfasse Abweichungen für: {selectedAudit.fields.audit_title}</p>
          </div>
          <Button onClick={() => setFindingDialogOpen(true)} className="gap-1.5 shrink-0">
            <IconPlus size={16} />
            Neues Finding
          </Button>
        </div>

        {/* Severity counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { key: 'kritisch', label: 'Kritisch', color: 'bg-red-100 text-red-700 border-red-200' },
            { key: 'hoch', label: 'Hoch', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { key: 'mittel', label: 'Mittel', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            { key: 'niedrig', label: 'Niedrig', color: 'bg-green-100 text-green-700 border-green-200' },
            { key: 'informativ', label: 'Informativ', color: 'bg-blue-100 text-blue-700 border-blue-200' },
          ].map(s => (
            <div key={s.key} className={`rounded-xl border p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{findingsBySeverity[s.key] ?? 0}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {auditFindings.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <IconAlertCircle size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Noch keine Findings erfasst.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {auditFindings.map(f => (
              <div key={f.record_id} className="flex items-center gap-3 p-3 rounded-xl border bg-card overflow-hidden">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{f.fields.finding_title ?? '(Kein Titel)'}</span>
                    <StatusBadge statusKey={f.fields.finding_severity?.key} label={f.fields.finding_severity?.label} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge statusKey={f.fields.finding_status?.key} label={f.fields.finding_status?.label} />
                    {f.fields.finding_responsible_firstname && (
                      <span className="text-xs text-muted-foreground truncate">
                        {f.fields.finding_responsible_firstname} {f.fields.finding_responsible_lastname}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <FindingsAbweichungenDialog
          open={findingDialogOpen}
          onClose={() => setFindingDialogOpen(false)}
          onSubmit={async (fields) => {
            await LivingAppsService.createFindingsAbweichungenEntry(fields);
            await fetchAll();
            setFindingDialogOpen(false);
          }}
          defaultValues={{ finding_audit: createRecordUrl(APP_IDS.AUDIT_MANAGEMENT, selectedAuditId) }}
          audit_managementList={auditManagementListProp}
          kontroll_managementList={kontrollManagement}
          maßnahmen_managementList={massnahmenListProp}
          enablePhotoScan={AI_PHOTO_SCAN['FindingsAbweichungen']}
          enablePhotoLocation={AI_PHOTO_LOCATION['FindingsAbweichungen']}
        />

        <NavButtons canGoBack onNext={() => goToStep(3)} />
      </div>
    );
  }

  // Step 3: Maßnahmen ableiten
  function renderStep3() {
    if (!selectedAudit) return null;
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Maßnahmen ableiten</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{findingsWithMeasures}</span> von <span className="font-semibold text-foreground">{auditFindings.length}</span> Findings haben Maßnahmen
          </p>
        </div>

        {auditFindings.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <IconCheckbox size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Keine Findings vorhanden. Gehe zurück zu Schritt 3.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditFindings.map(f => {
              const measureId = f.fields.finding_measure ? extractRecordId(f.fields.finding_measure) : null;
              const linkedMeasure = measureId ? massnahmenManagement.find(m => m.record_id === measureId) : null;
              return (
                <div key={f.record_id} className="p-4 rounded-xl border bg-card space-y-2 overflow-hidden">
                  <div className="flex items-start gap-2 justify-between flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <StatusBadge statusKey={f.fields.finding_severity?.key} label={f.fields.finding_severity?.label} />
                      <span className="text-sm font-medium truncate">{f.fields.finding_title ?? '(Kein Titel)'}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => setMassnahmeDialogOpen(true)}
                    >
                      <IconPlus size={14} />
                      Maßnahme
                    </Button>
                  </div>
                  <div>
                    {linkedMeasure ? (
                      <div className="flex items-center gap-2">
                        <IconCheck size={14} className="text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 truncate">{linkedMeasure.fields.measure_title}</span>
                        <StatusBadge statusKey={linkedMeasure.fields.measure_status?.key} label={linkedMeasure.fields.measure_status?.label} />
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">
                        Keine Maßnahme
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <MassnahmenManagementDialog
          open={massnahmeDialogOpen}
          onClose={() => setMassnahmeDialogOpen(false)}
          onSubmit={async (fields) => {
            await LivingAppsService.createMassnahmenManagementEntry(fields);
            await fetchAll();
            setMassnahmeDialogOpen(false);
          }}
          risikomanagementList={risikomanagementListProp}
          enablePhotoScan={AI_PHOTO_SCAN['MassnahmenManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['MassnahmenManagement']}
        />

        <NavButtons canGoBack onNext={() => goToStep(4)} />
      </div>
    );
  }

  // Step 4: Tasks erstellen
  function renderStep4() {
    if (!selectedAudit) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold">Aufgaben erstellen</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{openTasks}</span> offen · <span className="font-semibold text-foreground">{doneTasks}</span> erledigt
            </p>
          </div>
          <Button onClick={() => setAufgabeDialogOpen(true)} className="gap-1.5 shrink-0">
            <IconPlus size={16} />
            Neue Aufgabe
          </Button>
        </div>

        {auditTasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <IconListCheck size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Noch keine Aufgaben angelegt.</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-x-auto">
            {auditTasks.map(t => (
              <div key={t.record_id} className="flex items-center gap-3 p-3 rounded-xl border bg-card overflow-hidden">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{t.fields.task_title ?? '(Kein Titel)'}</span>
                    <StatusBadge statusKey={t.fields.task_priority?.key} label={t.fields.task_priority?.label} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <StatusBadge statusKey={t.fields.task_status?.key} label={t.fields.task_status?.label} />
                    {(t.fields.task_assignee_firstname || t.fields.task_assignee_lastname) && (
                      <span className="text-xs text-muted-foreground truncate">
                        {[t.fields.task_assignee_firstname, t.fields.task_assignee_lastname].filter(Boolean).join(' ')}
                      </span>
                    )}
                    {t.fields.task_due_date && (
                      <span className="text-xs text-muted-foreground">Fällig: {formatDate(t.fields.task_due_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AufgabenFreigabenDialog
          open={aufgabeDialogOpen}
          onClose={() => setAufgabeDialogOpen(false)}
          onSubmit={async (fields) => {
            await LivingAppsService.createAufgabenFreigabenEntry(fields);
            await fetchAll();
            setAufgabeDialogOpen(false);
          }}
          defaultValues={{ task_related_audit: createRecordUrl(APP_IDS.AUDIT_MANAGEMENT, selectedAuditId) }}
          risikomanagementList={risikomanagementListProp}
          maßnahmen_managementList={massnahmenListProp}
          audit_managementList={auditManagementListProp}
          enablePhotoScan={AI_PHOTO_SCAN['AufgabenFreigaben']}
          enablePhotoLocation={AI_PHOTO_LOCATION['AufgabenFreigaben']}
        />

        <NavButtons canGoBack onNext={() => goToStep(5)} />
      </div>
    );
  }

  // Step 5: Abschluss
  function renderStep5() {
    if (!selectedAudit) return null;
    const fw = frameworkVerwaltung.find(f => f.record_id === auditFrameworkId);
    const isAlreadyAbgeschlossen = selectedAudit.fields.audit_status?.key === 'abgeschlossen';

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Audit abschließen</h2>
          <p className="text-sm text-muted-foreground">Zusammenfassung und finaler Abschluss</p>
        </div>

        {/* Summary card */}
        <div className="p-4 rounded-xl border bg-card space-y-4">
          <div>
            <h3 className="font-semibold text-base">{selectedAudit.fields.audit_title}</h3>
            <p className="text-sm text-muted-foreground">{selectedAudit.fields.audit_type?.label} · {fw?.fields.fw_name ?? '–'}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Zeitraum</p>
              <p className="text-sm font-medium">
                {selectedAudit.fields.audit_start_date ? formatDate(selectedAudit.fields.audit_start_date) : '–'} – {selectedAudit.fields.audit_end_date ? formatDate(selectedAudit.fields.audit_end_date) : '–'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Verantwortlich</p>
              <p className="text-sm font-medium truncate">
                {[selectedAudit.fields.audit_lead_firstname, selectedAudit.fields.audit_lead_lastname].filter(Boolean).join(' ') || '–'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge statusKey={selectedAudit.fields.audit_status?.key} label={selectedAudit.fields.audit_status?.label} />
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{implementedCount}/{filteredKontrollen.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Kontrollen implementiert</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{auditFindings.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Findings gesamt</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {auditFindings.length > 0 ? Math.round((findingsWithMeasures / auditFindings.length) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Maßnahmen-Quote</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{doneTasks}/{auditTasks.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tasks erledigt</p>
            </div>
          </div>

          {auditFindings.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">Findings nach Schweregrad</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'kritisch', label: 'Kritisch', color: 'bg-red-100 text-red-700 border-red-200' },
                  { key: 'hoch', label: 'Hoch', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { key: 'mittel', label: 'Mittel', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                  { key: 'niedrig', label: 'Niedrig', color: 'bg-green-100 text-green-700 border-green-200' },
                ].map(s => findingsBySeverity[s.key] > 0 && (
                  <span key={s.key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${s.color}`}>
                    {findingsBySeverity[s.key]}× {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {completed || isAlreadyAbgeschlossen ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-green-50 border-green-200">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <IconCheck size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">Audit abgeschlossen</p>
              <p className="text-sm text-green-700">Das Audit wurde erfolgreich als abgeschlossen markiert.</p>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleCompleteAudit}
            disabled={completing}
            className="w-full gap-2"
            size="lg"
          >
            {completing ? (
              <>Wird abgeschlossen...</>
            ) : (
              <>
                <IconCheck size={18} />
                Audit als "Abgeschlossen" markieren
              </>
            )}
          </Button>
        )}

        <div className="flex justify-start pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => goToStep(currentStep - 1)}
            className="gap-1.5"
          >
            <IconChevronLeft size={16} />
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  }

  return (
    <IntentWizardShell
      title="Audit durchführen"
      subtitle="Mehrstufiger Workflow zur vollständigen Audit-Durchführung"
      steps={STEPS}
      currentStep={currentStep + 1}
      onStepChange={(s) => setCurrentStep(s - 1)}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {renderCurrentStep()}
    </IntentWizardShell>
  );
}
