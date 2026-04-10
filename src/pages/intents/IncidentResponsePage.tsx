import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { EntitySelectStep } from '@/components/EntitySelectStep';
import { StatusBadge } from '@/components/StatusBadge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type { IncidentManagement, MassnahmenManagement, AufgabenFreigaben, AssetRegister, Risikomanagement, AuditManagement } from '@/types/app';
import { IncidentManagementDialog } from '@/components/dialogs/IncidentManagementDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  IconAlertTriangle,
  IconShieldOff,
  IconBug,
  IconActivity,
  IconCheckbox,
  IconChevronRight,
  IconChevronLeft,
  IconPlus,
  IconAlertCircle,
  IconCircleCheck,
  IconBuilding,
  IconServer,
  IconClipboardList,
} from '@tabler/icons-react';

const WIZARD_STEPS = [
  { label: 'Incident' },
  { label: 'Assets & Org' },
  { label: 'Maßnahmen' },
  { label: 'Aufgaben' },
  { label: 'Abschluss' },
];

function getSeverityColor(key: string | undefined): string {
  if (!key) return 'bg-muted text-muted-foreground';
  const k = key.toLowerCase();
  if (k === 'kritisch' || k === 'critical') return 'bg-red-100 text-red-700 border border-red-200';
  if (k === 'hoch' || k === 'high') return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (k === 'mittel' || k === 'medium') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  if (k === 'niedrig' || k === 'low') return 'bg-green-100 text-green-700 border border-green-200';
  return 'bg-muted text-muted-foreground';
}

function isCriticalOrHigh(key: string | undefined): boolean {
  if (!key) return false;
  const k = key.toLowerCase();
  return k === 'kritisch' || k === 'critical' || k === 'hoch' || k === 'high';
}

function formatDateTime(val: string | undefined): string {
  if (!val) return '–';
  try {
    const d = new Date(val);
    return d.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return val;
  }
}

export default function IncidentResponsePage() {
  const [searchParams] = useSearchParams();
  const {
    incidentManagement,
    massnahmenManagement,
    aufgabenFreigaben,
    assetRegister,
    risikomanagement,
    auditManagement,
    loading,
    error,
    fetchAll,
  } = useDashboardData();

  // Step state — initialize from URL param
  const urlStep = parseInt(searchParams.get('step') ?? '', 10);
  const urlIncidentId = searchParams.get('incidentId') ?? null;

  const [step, setStep] = useState<number>(() => {
    if (urlIncidentId && urlStep >= 2 && urlStep <= 5) return urlStep;
    if (urlStep >= 1 && urlStep <= 5) return urlStep;
    return 1;
  });

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(urlIncidentId);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [massnahmenDialogOpen, setMassnahmenDialogOpen] = useState(false);
  const [aufgabenDialogOpen, setAufgabenDialogOpen] = useState(false);

  // Tasks created in this session, keyed by measure record_id
  const [sessionTasks, setSessionTasks] = useState<Record<string, string>>({});
  // Tasks dialog: pre-selected measure id
  const [taskMeasureId, setTaskMeasureId] = useState<string | null>(null);

  // Track newly created measures in this session
  const [sessionMeasureIds, setSessionMeasureIds] = useState<string[]>([]);

  // Closing state
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);

  // Auto-select incident from URL param once data is loaded
  useEffect(() => {
    if (!loading && urlIncidentId && !selectedIncidentId) {
      setSelectedIncidentId(urlIncidentId);
    }
  }, [loading, urlIncidentId, selectedIncidentId]);

  const selectedIncident = incidentManagement.find(i => i.record_id === selectedIncidentId) ?? null;

  // Assets linked to the incident (multipleapplookup → stored as JSON array string or comma-sep URLs)
  const linkedAssetIds: string[] = (() => {
    if (!selectedIncident?.fields.incident_affected_asset) return [];
    const raw = selectedIncident.fields.incident_affected_asset;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((u: string) => extractRecordId(u)).filter((id): id is string => !!id);
      return [];
    } catch {
      const id = extractRecordId(raw);
      return id ? [id] : [];
    }
  })();

  const linkedAssets = assetRegister.filter(a => linkedAssetIds.includes(a.record_id));
  const linkedOrgId = selectedIncident?.fields.incident_affected_org
    ? extractRecordId(selectedIncident.fields.incident_affected_org)
    : null;

  // Measures relevant to this incident: either created in this session
  const relevantMeasures: MassnahmenManagement[] = massnahmenManagement.filter(
    m => sessionMeasureIds.includes(m.record_id)
  );

  // Tasks created in this session (for summary)
  const sessionTaskCount = Object.keys(sessionTasks).length;

  const handleSelectIncident = useCallback((id: string) => {
    setSelectedIncidentId(id);
    setStep(2);
  }, []);

  const handleCloseIncident = useCallback(async () => {
    if (!selectedIncidentId) return;
    setClosing(true);
    try {
      await LivingAppsService.updateIncidentManagementEntry(selectedIncidentId, {
        incident_status: 'geschlossen' as unknown as IncidentManagement['fields']['incident_status'],
      });
      await fetchAll();
      setClosed(true);
    } catch {
      // ignore
    } finally {
      setClosing(false);
    }
  }, [selectedIncidentId, fetchAll]);

  const openAssetList = assetRegister;
  const emptyRisiko: Risikomanagement[] = risikomanagement;
  const emptyAudit: AuditManagement[] = auditManagement;

  const severityKey = selectedIncident?.fields.incident_severity?.key;
  const severityLabel = selectedIncident?.fields.incident_severity?.label ?? '–';
  const isNis2 = selectedIncident?.fields.incident_nis2_reportable ?? false;
  const isDora = selectedIncident?.fields.incident_dora_reportable ?? false;
  const reportable = isNis2 || isDora;

  return (
    <IntentWizardShell
      title="Incident Response"
      subtitle="Sicherheitsvorfall erfassen, analysieren und beheben"
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ── SCHRITT 1: Incident erfassen ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Schritt 1 – Incident erfassen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Wähle einen offenen Vorfall aus oder melde einen neuen.
            </p>
          </div>

          <EntitySelectStep
            items={incidentManagement.map(inc => ({
              id: inc.record_id,
              title: inc.fields.incident_title ?? inc.fields.incident_id ?? 'Unbekannt',
              subtitle: [
                inc.fields.incident_category?.label,
                inc.fields.incident_detected_at ? `Erkannt: ${formatDateTime(inc.fields.incident_detected_at)}` : undefined,
                inc.fields.incident_nis2_reportable ? 'NIS2' : undefined,
                inc.fields.incident_dora_reportable ? 'DORA' : undefined,
              ].filter(Boolean).join(' · '),
              status: inc.fields.incident_status
                ? { key: inc.fields.incident_status.key, label: inc.fields.incident_status.label }
                : undefined,
              stats: [
                { label: 'Schwere', value: inc.fields.incident_severity?.label ?? '–' },
              ],
              icon: <IconBug size={20} className="text-primary" />,
            }))}
            onSelect={handleSelectIncident}
            searchPlaceholder="Incident suchen..."
            emptyIcon={<IconShieldOff size={36} />}
            emptyText="Keine Incidents gefunden. Melde einen neuen Vorfall."
            createLabel="Neuen Incident melden"
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
                defaultValues={undefined}
                asset_registerList={openAssetList as AssetRegister[]}
                organisationseinheitenList={[]}
                enablePhotoScan={false}
                enablePhotoLocation={false}
              />
            }
          />
        </div>
      )}

      {/* ── SCHRITT 2: Betroffene Assets & Org ── */}
      {step === 2 && selectedIncident && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Schritt 2 – Betroffene Assets & Org zuordnen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Prüfe die betroffenen Assets und die Organisationseinheit des Incidents.
            </p>
          </div>

          {/* Incident summary card */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconBug size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">
                      {selectedIncident.fields.incident_title ?? selectedIncident.fields.incident_id ?? 'Unbekannt'}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${getSeverityColor(severityKey)}`}>
                      {severityLabel}
                    </span>
                    {selectedIncident.fields.incident_status && (
                      <StatusBadge
                        statusKey={selectedIncident.fields.incident_status.key}
                        label={selectedIncident.fields.incident_status.label}
                      />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 space-x-2">
                    {selectedIncident.fields.incident_category?.label && (
                      <span>Kategorie: {selectedIncident.fields.incident_category.label}</span>
                    )}
                    {selectedIncident.fields.incident_detected_at && (
                      <span>· Erkannt: {formatDateTime(selectedIncident.fields.incident_detected_at)}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {isNis2 && (
                      <span className="text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">
                        NIS2-meldepflichtig
                      </span>
                    )}
                    {isDora && (
                      <span className="text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">
                        DORA-meldepflichtig
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NIS2/DORA warning banner */}
          {reportable && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
              <IconAlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-800">Meldepflicht beachten!</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  Dieser Incident ist{isNis2 && isDora ? ' NIS2- und DORA-' : isNis2 ? ' NIS2-' : ' DORA-'}meldepflichtig.
                  Stelle sicher, dass du die zuständigen Behörden rechtzeitig benachrichtigst.
                </p>
              </div>
            </div>
          )}

          {/* Summary card */}
          <Card className="overflow-hidden bg-secondary/30">
            <CardContent className="p-4 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <IconServer size={16} className="text-muted-foreground shrink-0" />
                <span className="text-sm">
                  <span className="font-semibold">{linkedAssets.length}</span>
                  <span className="text-muted-foreground ml-1">Assets betroffen</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IconBuilding size={16} className="text-muted-foreground shrink-0" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Org-Einheit: </span>
                  <span className="font-semibold">
                    {linkedOrgId ? linkedOrgId : '–'}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Linked assets */}
          {linkedAssets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Betroffene Assets laut Incident</h3>
              <div className="space-y-2">
                {linkedAssets.map(asset => (
                  <div key={asset.record_id} className="flex items-center gap-3 p-3 rounded-xl border bg-card overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconServer size={15} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.fields.asset_name ?? '–'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[asset.fields.asset_category?.label, asset.fields.asset_classification?.label].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {asset.fields.asset_status && (
                      <StatusBadge statusKey={asset.fields.asset_status.key} label={asset.fields.asset_status.label} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All assets reference list */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Alle Assets im Asset-Register</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {openAssetList.map(asset => (
                <div key={asset.record_id} className="flex items-center gap-2 p-2 rounded-lg text-xs text-muted-foreground">
                  <IconServer size={13} className="shrink-0" />
                  <span className="truncate min-w-0">{asset.fields.asset_name ?? '–'}</span>
                  {asset.fields.asset_category?.label && (
                    <span className="shrink-0 bg-muted px-1.5 py-0.5 rounded-full">{asset.fields.asset_category.label}</span>
                  )}
                </div>
              ))}
              {openAssetList.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">Keine Assets vorhanden.</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <IconChevronLeft size={16} className="mr-1" /> Zurück
            </Button>
            <Button onClick={() => setStep(3)}>
              Weiter zu Maßnahmen <IconChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── SCHRITT 3: Maßnahmen einleiten ── */}
      {step === 3 && selectedIncident && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Schritt 3 – Maßnahmen einleiten</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Erstelle Maßnahmen für diesen Incident. Neu erstellte Maßnahmen werden in dieser Sitzung verfolgt.
            </p>
          </div>

          {/* Critical/high urgency banner */}
          {isCriticalOrHigh(severityKey) && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <IconAlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800">Kritischer Incident – Maßnahmen sofort einleiten!</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Schweregrad {severityLabel}. Reagiere umgehend und dokumentiere alle Schritte.
                </p>
              </div>
            </div>
          )}

          {/* Live counter */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/40 border">
            <IconActivity size={18} className="text-primary shrink-0" />
            <span className="text-sm font-medium">
              {relevantMeasures.length} Maßnahme{relevantMeasures.length !== 1 ? 'n' : ''} in dieser Sitzung erstellt
            </span>
          </div>

          {/* All existing measures for reference */}
          {massnahmenManagement.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Bestehende Maßnahmen (alle)</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {massnahmenManagement.map(m => (
                  <div key={m.record_id} className="flex items-center gap-3 p-3 rounded-xl border bg-card overflow-hidden">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.fields.measure_title ?? m.fields.measure_id ?? '–'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[m.fields.measure_type?.label, m.fields.measure_priority?.label].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {m.fields.measure_status && (
                      <StatusBadge statusKey={m.fields.measure_status.key} label={m.fields.measure_status.label} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session measures */}
          {relevantMeasures.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">In dieser Sitzung erstellt</h3>
              <div className="space-y-2">
                {relevantMeasures.map(m => (
                  <div key={m.record_id} className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <IconCheckbox size={15} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.fields.measure_title ?? m.fields.measure_id ?? '–'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[m.fields.measure_type?.label, m.fields.measure_priority?.label].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {m.fields.measure_status && (
                      <StatusBadge statusKey={m.fields.measure_status.key} label={m.fields.measure_status.label} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create new measure button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setMassnahmenDialogOpen(true)}
          >
            <IconPlus size={16} />
            Neue Maßnahme anlegen
          </Button>

          <MassnahmenManagementDialog
            open={massnahmenDialogOpen}
            onClose={() => setMassnahmenDialogOpen(false)}
            onSubmit={async (fields) => {
              const result = await LivingAppsService.createMassnahmenManagementEntry(fields);
              await fetchAll();
              // Track the newly created measure id
              if (result) {
                const newId = Object.keys(result)[0];
                if (newId) setSessionMeasureIds(prev => [...prev, newId]);
              }
              setMassnahmenDialogOpen(false);
            }}
            defaultValues={undefined}
            risikomanagementList={emptyRisiko as Risikomanagement[]}
            enablePhotoScan={false}
            enablePhotoLocation={false}
          />

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <IconChevronLeft size={16} className="mr-1" /> Zurück
            </Button>
            <Button onClick={() => setStep(4)}>
              Weiter zu Aufgaben <IconChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── SCHRITT 4: Aufgaben delegieren ── */}
      {step === 4 && selectedIncident && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Schritt 4 – Aufgaben delegieren</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Erstelle Folgeaufgaben für die Maßnahmen aus Schritt 3.
            </p>
          </div>

          {/* Live counter */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/40 border">
            <IconClipboardList size={18} className="text-primary shrink-0" />
            <span className="text-sm font-medium">
              {sessionTaskCount} Aufgabe{sessionTaskCount !== 1 ? 'n' : ''} delegiert
            </span>
          </div>

          {/* Checklist: for each session measure, optionally create a task */}
          {relevantMeasures.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Aufgaben pro Maßnahme</h3>
              {relevantMeasures.map(m => {
                const hasTask = !!sessionTasks[m.record_id];
                return (
                  <div
                    key={m.record_id}
                    className={`flex items-center gap-3 p-4 rounded-xl border overflow-hidden ${hasTask ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${hasTask ? 'bg-primary/15' : 'bg-muted'}`}>
                      {hasTask
                        ? <IconCircleCheck size={16} className="text-primary" />
                        : <IconCheckbox size={16} className="text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.fields.measure_title ?? m.fields.measure_id ?? '–'}</p>
                      {hasTask && (
                        <p className="text-xs text-primary mt-0.5">Aufgabe erstellt</p>
                      )}
                    </div>
                    {!hasTask && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1"
                        onClick={() => {
                          setTaskMeasureId(m.record_id);
                          setAufgabenDialogOpen(true);
                        }}
                      >
                        <IconPlus size={13} />
                        Aufgabe
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <IconClipboardList size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Keine Maßnahmen aus Schritt 3 vorhanden.</p>
              <p className="text-xs mt-1">Gehe zurück und erstelle zuerst Maßnahmen.</p>
            </div>
          )}

          {/* Button to create task without specific measure */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              setTaskMeasureId(null);
              setAufgabenDialogOpen(true);
            }}
          >
            <IconPlus size={16} />
            Weitere Aufgabe delegieren
          </Button>

          <AufgabenFreigabenDialog
            open={aufgabenDialogOpen}
            onClose={() => setAufgabenDialogOpen(false)}
            onSubmit={async (fields) => {
              await LivingAppsService.createAufgabenFreigabenEntry({
                ...fields,
                ...(taskMeasureId
                  ? { task_related_measure: createRecordUrl(APP_IDS.MASSNAHMEN_MANAGEMENT, taskMeasureId) }
                  : {}),
              } as AufgabenFreigaben['fields']);
              await fetchAll();
              if (taskMeasureId) {
                setSessionTasks(prev => ({ ...prev, [taskMeasureId]: 'created' }));
              }
              setAufgabenDialogOpen(false);
              setTaskMeasureId(null);
            }}
            defaultValues={
              taskMeasureId
                ? { task_related_measure: createRecordUrl(APP_IDS.MASSNAHMEN_MANAGEMENT, taskMeasureId) }
                : undefined
            }
            risikomanagementList={emptyRisiko as Risikomanagement[]}
            maßnahmen_managementList={massnahmenManagement as MassnahmenManagement[]}
            audit_managementList={emptyAudit as AuditManagement[]}
            enablePhotoScan={false}
            enablePhotoLocation={false}
          />

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)}>
              <IconChevronLeft size={16} className="mr-1" /> Zurück
            </Button>
            <Button onClick={() => setStep(5)}>
              Weiter zum Abschluss <IconChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── SCHRITT 5: Abschluss ── */}
      {step === 5 && selectedIncident && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Schritt 5 – Abschluss</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Überprüfe die Zusammenfassung und schließe den Incident.
            </p>
          </div>

          {/* Summary card */}
          <Card className="overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconBug size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {selectedIncident.fields.incident_title ?? selectedIncident.fields.incident_id ?? 'Unbekannt'}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityColor(severityKey)}`}>
                      {severityLabel}
                    </span>
                    {selectedIncident.fields.incident_status && (
                      <StatusBadge
                        statusKey={closed ? 'geschlossen' : selectedIncident.fields.incident_status.key}
                        label={closed ? 'Geschlossen' : selectedIncident.fields.incident_status.label}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-secondary/40 text-center">
                  <p className="text-2xl font-bold text-primary">{linkedAssets.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Assets betroffen</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 text-center">
                  <p className="text-2xl font-bold text-primary">{relevantMeasures.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Maßnahmen erstellt</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 text-center">
                  <p className="text-2xl font-bold text-primary">{sessionTaskCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Aufgaben delegiert</p>
                </div>
              </div>

              {selectedIncident.fields.incident_detected_at && (
                <div className="text-sm text-muted-foreground">
                  <span>Erkannt am: </span>
                  <span className="font-medium text-foreground">
                    {formatDateTime(selectedIncident.fields.incident_detected_at)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* NIS2/DORA reminder */}
          {reportable && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
              <IconAlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-800">Behördennotifikation prüfen!</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  Dieser Incident ist{isNis2 && isDora ? ' NIS2- und DORA-' : isNis2 ? ' NIS2-' : ' DORA-'}meldepflichtig.
                  Stelle sicher, dass du die zuständigen Behörden fristgerecht benachrichtigt hast.
                </p>
              </div>
            </div>
          )}

          {/* Closed success state */}
          {closed && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <IconCircleCheck size={20} className="text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800">Incident erfolgreich geschlossen</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Der Status wurde auf "Geschlossen" gesetzt.
                </p>
              </div>
            </div>
          )}

          {/* Navigation + close action */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(4)}>
              <IconChevronLeft size={16} className="mr-1" /> Zurück
            </Button>
            {!closed && (
              <Button
                onClick={handleCloseIncident}
                disabled={closing}
                className="gap-2"
              >
                {closing ? (
                  <>Schließe...</>
                ) : (
                  <>
                    <IconCircleCheck size={16} />
                    Incident schließen
                  </>
                )}
              </Button>
            )}
            {closed && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedIncidentId(null);
                  setSessionMeasureIds([]);
                  setSessionTasks({});
                  setClosed(false);
                  setStep(1);
                }}
              >
                Neuen Incident bearbeiten
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Fallback if no incident selected but on step > 1 */}
      {step > 1 && !selectedIncident && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <IconShieldOff size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Kein Incident ausgewählt. Bitte kehre zu Schritt 1 zurück.
            </p>
            <Button variant="outline" onClick={() => setStep(1)}>
              <IconChevronLeft size={16} className="mr-1" /> Zu Schritt 1
            </Button>
          </div>
        </div>
      )}
    </IntentWizardShell>
  );
}
