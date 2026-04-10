import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichBcmNotfallmanagement, enrichPolicyManagement, enrichIncidentManagement, enrichSoaManagement, enrichRisikomanagement, enrichAufgabenFreigaben, enrichMassnahmenManagement, enrichFindingsAbweichungen, enrichAuditManagement, enrichKontrollManagement, enrichAwarenessSchulungen } from '@/lib/enrich';
import type { EnrichedIncidentManagement, EnrichedRisikomanagement, EnrichedAufgabenFreigaben, EnrichedMassnahmenManagement, EnrichedFindingsAbweichungen } from '@/types/enriched';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconShieldExclamation, IconBug, IconClipboardCheck, IconAlertTriangle, IconCircleCheck, IconClock, IconPencil, IconTrash, IconChevronRight, IconShield, IconUsers, IconFileText, IconActivity } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { IncidentManagementDialog } from '@/components/dialogs/IncidentManagementDialog';
import { RisikomanagementDialog } from '@/components/dialogs/RisikomanagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { FindingsAbweichungenDialog } from '@/components/dialogs/FindingsAbweichungenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { ShareFormLink } from '@/components/ShareFormLink';
import { APP_IDS } from '@/types/app';

const APPGROUP_ID = '69d8a3503df670f43cd184d4';
const REPAIR_ENDPOINT = '/claude/build/repair';

// --- Status helpers ---
function severityColor(key?: string): string {
  switch (key) {
    case 'kritisch': return 'bg-red-500/15 text-red-600 border-red-200';
    case 'hoch': return 'bg-orange-500/15 text-orange-600 border-orange-200';
    case 'mittel': return 'bg-yellow-500/15 text-yellow-700 border-yellow-200';
    case 'niedrig': return 'bg-green-500/15 text-green-600 border-green-200';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function statusColor(key?: string): string {
  switch (key) {
    case 'offen': case 'neu': case 'geplant': return 'bg-blue-500/15 text-blue-600 border-blue-200';
    case 'in_bearbeitung': case 'in_umsetzung': case 'in_behandlung': return 'bg-yellow-500/15 text-yellow-700 border-yellow-200';
    case 'behoben': case 'geschlossen': case 'erledigt': case 'umgesetzt': return 'bg-green-500/15 text-green-600 border-green-200';
    case 'eskaliert': case 'kritisch': return 'bg-red-500/15 text-red-600 border-red-200';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function riskScoreColor(score?: number): string {
  if (!score) return 'text-muted-foreground';
  if (score >= 15) return 'text-red-600';
  if (score >= 9) return 'text-orange-600';
  if (score >= 4) return 'text-yellow-700';
  return 'text-green-600';
}

export default function DashboardOverview() {
  const {
    bcmNotfallmanagement, policyManagement, incidentManagement, soaManagement, risikomanagement, organisationseinheiten, aufgabenFreigaben, massnahmenManagement, findingsAbweichungen, auditManagement, assetRegister, kontrollManagement, awarenessSchulungen,
    frameworkVerwaltungMap, risikomanagementMap, organisationseinheitenMap, massnahmenManagementMap, auditManagementMap, assetRegisterMap, kontrollManagementMap,
    loading, error, fetchAll,
  } = useDashboardData();

  // --- Dialog state ---
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [editIncident, setEditIncident] = useState<EnrichedIncidentManagement | null>(null);
  const [deleteIncident, setDeleteIncident] = useState<EnrichedIncidentManagement | null>(null);

  const [risikoDialog, setRisikoDialog] = useState(false);
  const [editRisiko, setEditRisiko] = useState<EnrichedRisikomanagement | null>(null);
  const [deleteRisiko, setDeleteRisiko] = useState<EnrichedRisikomanagement | null>(null);

  const [aufgabeDialog, setAufgabeDialog] = useState(false);
  const [editAufgabe, setEditAufgabe] = useState<EnrichedAufgabenFreigaben | null>(null);
  const [deleteAufgabe, setDeleteAufgabe] = useState<EnrichedAufgabenFreigaben | null>(null);

  const [massnahmeDialog, setMassnahmeDialog] = useState(false);
  const [editMassnahme, setEditMassnahme] = useState<EnrichedMassnahmenManagement | null>(null);
  const [deleteMassnahme, setDeleteMassnahme] = useState<EnrichedMassnahmenManagement | null>(null);

  const [findingDialog, setFindingDialog] = useState(false);
  const [editFinding, setEditFinding] = useState<EnrichedFindingsAbweichungen | null>(null);
  const [deleteFinding, setDeleteFinding] = useState<EnrichedFindingsAbweichungen | null>(null);

  const [activeSection, setActiveSection] = useState<'incidents' | 'risks' | 'tasks' | 'measures' | 'findings'>('incidents');

  // --- Enrichment ---
  const enrichedBcmNotfallmanagement = enrichBcmNotfallmanagement(bcmNotfallmanagement, { assetRegisterMap });
  const enrichedPolicyManagement = enrichPolicyManagement(policyManagement, { frameworkVerwaltungMap });
  const enrichedIncidentManagement = enrichIncidentManagement(incidentManagement, { assetRegisterMap, organisationseinheitenMap });
  const enrichedSoaManagement = enrichSoaManagement(soaManagement, { kontrollManagementMap });
  const enrichedRisikomanagement = enrichRisikomanagement(risikomanagement, { assetRegisterMap, organisationseinheitenMap });
  const enrichedAufgabenFreigaben = enrichAufgabenFreigaben(aufgabenFreigaben, { risikomanagementMap, massnahmenManagementMap, auditManagementMap });
  const enrichedMassnahmenManagement = enrichMassnahmenManagement(massnahmenManagement, { risikomanagementMap });
  const enrichedFindingsAbweichungen = enrichFindingsAbweichungen(findingsAbweichungen, { auditManagementMap, kontrollManagementMap, massnahmenManagementMap });
  const enrichedAuditManagement = enrichAuditManagement(auditManagement, { frameworkVerwaltungMap, organisationseinheitenMap });
  const enrichedKontrollManagement = enrichKontrollManagement(kontrollManagement, { frameworkVerwaltungMap, massnahmenManagementMap });
  const enrichedAwarenessSchulungen = enrichAwarenessSchulungen(awarenessSchulungen, { frameworkVerwaltungMap });

  // --- Computed stats ---
  const openIncidents = useMemo(() => enrichedIncidentManagement.filter(i => i.fields.incident_status?.key !== 'geschlossen' && i.fields.incident_status?.key !== 'behoben'), [enrichedIncidentManagement]);
  const criticalIncidents = useMemo(() => openIncidents.filter(i => i.fields.incident_severity?.key === 'kritisch' || i.fields.incident_severity?.key === 'hoch'), [openIncidents]);
  const openRisks = useMemo(() => enrichedRisikomanagement.filter(r => r.fields.risk_status?.key === 'offen' || r.fields.risk_status?.key === 'in_behandlung'), [enrichedRisikomanagement]);
  const highRisks = useMemo(() => enrichedRisikomanagement.filter(r => (r.fields.risk_score_brutto ?? 0) >= 15), [enrichedRisikomanagement]);
  const openTasks = useMemo(() => enrichedAufgabenFreigaben.filter(t => t.fields.task_status?.key !== 'erledigt' && t.fields.task_status?.key !== 'abgebrochen'), [enrichedAufgabenFreigaben]);
  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return openTasks.filter(t => t.fields.task_due_date && t.fields.task_due_date < today);
  }, [openTasks]);
  const openFindings = useMemo(() => enrichedFindingsAbweichungen.filter(f => f.fields.finding_status?.key !== 'geschlossen' && f.fields.finding_status?.key !== 'behoben' && f.fields.finding_status?.key !== 'akzeptiert'), [enrichedFindingsAbweichungen]);
  const openMeasures = useMemo(() => enrichedMassnahmenManagement.filter(m => m.fields.measure_status?.key !== 'umgesetzt' && m.fields.measure_status?.key !== 'entfaellt'), [enrichedMassnahmenManagement]);

  // SoA compliance
  const soaImplemented = useMemo(() => enrichedSoaManagement.filter(s => s.fields.soa_implementation_status?.key === 'vollstaendig_implementiert').length, [enrichedSoaManagement]);
  const soaTotal = enrichedSoaManagement.length;
  const soaPercent = soaTotal > 0 ? Math.round((soaImplemented / soaTotal) * 100) : 0;

  // Policy compliance
  const activePolicies = useMemo(() => enrichedPolicyManagement.filter(p => p.fields.policy_status?.key === 'freigegeben').length, [enrichedPolicyManagement]);

  // Controls
  const implementedControls = useMemo(() => enrichedKontrollManagement.filter(c => c.fields.ctrl_implementation_status?.key === 'vollstaendig_implementiert').length, [enrichedKontrollManagement]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Offene Incidents"
          value={String(openIncidents.length)}
          description={criticalIncidents.length > 0 ? `${criticalIncidents.length} kritisch/hoch` : 'Kein kritischer Incident'}
          icon={<IconBug size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offene Risiken"
          value={String(openRisks.length)}
          description={highRisks.length > 0 ? `${highRisks.length} Score ≥15` : 'Kein hohes Risiko'}
          icon={<IconShieldExclamation size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="SoA-Compliance"
          value={`${soaPercent}%`}
          description={`${soaImplemented} von ${soaTotal} implementiert`}
          icon={<IconClipboardCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offene Aufgaben"
          value={String(openTasks.length)}
          description={overdueTasks.length > 0 ? `${overdueTasks.length} überfällig` : 'Alles im Zeitplan'}
          icon={<IconAlertTriangle size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <IconFileText size={14} className="shrink-0" />
            Aktive Richtlinien
          </div>
          <div className="text-2xl font-bold">{activePolicies}</div>
          <div className="text-xs text-muted-foreground">von {policyManagement.length} gesamt</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <IconShield size={14} className="shrink-0" />
            Kontrollen
          </div>
          <div className="text-2xl font-bold">{implementedControls}</div>
          <div className="text-xs text-muted-foreground">von {kontrollManagement.length} vollst. impl.</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <IconActivity size={14} className="shrink-0" />
            Findings offen
          </div>
          <div className="text-2xl font-bold">{openFindings.length}</div>
          <div className="text-xs text-muted-foreground">von {findingsAbweichungen.length} gesamt</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <IconUsers size={14} className="shrink-0" />
            Schulungen
          </div>
          <div className="text-2xl font-bold">{enrichedAwarenessSchulungen.filter(s => s.fields.training_status?.key === 'aktiv').length}</div>
          <div className="text-xs text-muted-foreground">von {awarenessSchulungen.length} aktiv</div>
        </div>
      </div>

      {/* Main interactive section */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Tab navigation */}
        <div className="flex border-b overflow-x-auto">
          {([
            { key: 'incidents', label: 'Incidents', count: openIncidents.length, icon: <IconBug size={14} className="shrink-0" />, hasAlert: criticalIncidents.length > 0 },
            { key: 'risks', label: 'Risiken', count: openRisks.length, icon: <IconShieldExclamation size={14} className="shrink-0" />, hasAlert: highRisks.length > 0 },
            { key: 'tasks', label: 'Aufgaben', count: openTasks.length, icon: <IconAlertTriangle size={14} className="shrink-0" />, hasAlert: overdueTasks.length > 0 },
            { key: 'measures', label: 'Maßnahmen', count: openMeasures.length, icon: <IconCircleCheck size={14} className="shrink-0" />, hasAlert: false },
            { key: 'findings', label: 'Findings', count: openFindings.length, icon: <IconAlertCircle size={14} className="shrink-0" />, hasAlert: false },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeSection === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                tab.hasAlert ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="p-4">
          {/* INCIDENTS */}
          {activeSection === 'incidents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">Incident Management</h3>
                  <p className="text-xs text-muted-foreground">Sicherheitsvorfälle erfassen und verfolgen</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ShareFormLink appId={APP_IDS.INCIDENT_MANAGEMENT} label="Incident melden" variant="inline" />
                  <Button size="sm" onClick={() => { setEditIncident(null); setIncidentDialog(true); }}>
                    <IconPlus size={14} className="mr-1 shrink-0" />Neuer Incident
                  </Button>
                </div>
              </div>
              {openIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <IconCircleCheck size={40} stroke={1.5} />
                  <p className="text-sm">Keine offenen Incidents</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {openIncidents.slice(0, 10).map(inc => (
                    <div key={inc.record_id} className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm truncate">{inc.fields.incident_title || 'Unbekannter Incident'}</span>
                          {inc.fields.incident_severity && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColor(inc.fields.incident_severity.key)}`}>
                              {inc.fields.incident_severity.label}
                            </span>
                          )}
                          {inc.fields.incident_status && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(inc.fields.incident_status.key)}`}>
                              {inc.fields.incident_status.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {inc.fields.incident_category && <span>{inc.fields.incident_category.label}</span>}
                          {inc.fields.incident_detected_at && (
                            <span className="flex items-center gap-1">
                              <IconClock size={11} className="shrink-0" />{formatDate(inc.fields.incident_detected_at)}
                            </span>
                          )}
                          {inc.fields.incident_reporter_firstname && (
                            <span>{inc.fields.incident_reporter_firstname} {inc.fields.incident_reporter_lastname}</span>
                          )}
                          {(inc.fields.incident_nis2_reportable || inc.fields.incident_dora_reportable) && (
                            <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium bg-purple-500/15 text-purple-600 border-purple-200">
                              {inc.fields.incident_nis2_reportable ? 'NIS2' : ''}{inc.fields.incident_nis2_reportable && inc.fields.incident_dora_reportable ? ' + ' : ''}{inc.fields.incident_dora_reportable ? 'DORA' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditIncident(inc); setIncidentDialog(true); }}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Bearbeiten"
                        >
                          <IconPencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteIncident(inc)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Löschen"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {openIncidents.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{openIncidents.length - 10} weitere — <a href="#/incidents" className="text-primary hover:underline">Alle anzeigen <IconChevronRight size={11} className="inline" /></a>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RISKS */}
          {activeSection === 'risks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">Risikomanagement</h3>
                  <p className="text-xs text-muted-foreground">Risiken bewerten und behandeln</p>
                </div>
                <Button size="sm" onClick={() => { setEditRisiko(null); setRisikoDialog(true); }}>
                  <IconPlus size={14} className="mr-1 shrink-0" />Neues Risiko
                </Button>
              </div>
              {/* Risk heatmap summary */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {(['kritisch', 'hoch', 'mittel'] as const).map(level => {
                  const count = enrichedRisikomanagement.filter(r => {
                    const s = r.fields.risk_score_brutto ?? 0;
                    if (level === 'kritisch') return s >= 20;
                    if (level === 'hoch') return s >= 12 && s < 20;
                    return s >= 6 && s < 12;
                  }).length;
                  return (
                    <div key={level} className={`rounded-xl border p-3 text-center ${severityColor(level)}`}>
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs capitalize">{level}</div>
                    </div>
                  );
                })}
              </div>
              {openRisks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <IconCircleCheck size={40} stroke={1.5} />
                  <p className="text-sm">Keine offenen Risiken</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {openRisks.sort((a, b) => (b.fields.risk_score_brutto ?? 0) - (a.fields.risk_score_brutto ?? 0)).slice(0, 10).map(risk => (
                    <div key={risk.record_id} className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                      <div className={`text-xl font-bold w-10 text-center shrink-0 ${riskScoreColor(risk.fields.risk_score_brutto)}`}>
                        {risk.fields.risk_score_brutto ?? '—'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm truncate">{risk.fields.risk_title || 'Unbekanntes Risiko'}</span>
                          {risk.fields.risk_status && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(risk.fields.risk_status.key)}`}>
                              {risk.fields.risk_status.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {risk.fields.risk_treatment && <span>Behandlung: {risk.fields.risk_treatment.label}</span>}
                          {risk.fields.risk_review_date && (
                            <span className={`flex items-center gap-1 ${risk.fields.risk_review_date < today ? 'text-red-600' : ''}`}>
                              <IconClock size={11} className="shrink-0" />Review: {formatDate(risk.fields.risk_review_date)}
                            </span>
                          )}
                          {risk.fields.risk_owner_firstname && (
                            <span>{risk.fields.risk_owner_firstname} {risk.fields.risk_owner_lastname}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditRisiko(risk); setRisikoDialog(true); }}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Bearbeiten"
                        >
                          <IconPencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteRisiko(risk)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Löschen"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TASKS */}
          {activeSection === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">Aufgaben & Freigaben</h3>
                  <p className="text-xs text-muted-foreground">Offene Aufgaben und Freigabeanfragen</p>
                </div>
                <Button size="sm" onClick={() => { setEditAufgabe(null); setAufgabeDialog(true); }}>
                  <IconPlus size={14} className="mr-1 shrink-0" />Neue Aufgabe
                </Button>
              </div>
              {openTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <IconCircleCheck size={40} stroke={1.5} />
                  <p className="text-sm">Alle Aufgaben erledigt</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {openTasks.sort((a, b) => {
                    const aOver = a.fields.task_due_date && a.fields.task_due_date < today ? -1 : 0;
                    const bOver = b.fields.task_due_date && b.fields.task_due_date < today ? -1 : 0;
                    return aOver - bOver;
                  }).slice(0, 10).map(task => {
                    const isOverdue = task.fields.task_due_date && task.fields.task_due_date < today;
                    return (
                      <div key={task.record_id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${isOverdue ? 'bg-red-500/5 border-red-200' : 'bg-background hover:bg-muted/30'}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm truncate">{task.fields.task_title || 'Unbekannte Aufgabe'}</span>
                            {task.fields.task_priority && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColor(task.fields.task_priority.key)}`}>
                                {task.fields.task_priority.label}
                              </span>
                            )}
                            {task.fields.task_type && (
                              <Badge variant="secondary" className="text-xs">{task.fields.task_type.label}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {task.fields.task_status && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(task.fields.task_status.key)}`}>
                                {task.fields.task_status.label}
                              </span>
                            )}
                            {task.fields.task_due_date && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                <IconClock size={11} className="shrink-0" />
                                {isOverdue ? 'Überfällig: ' : 'Fällig: '}{formatDate(task.fields.task_due_date)}
                              </span>
                            )}
                            {task.fields.task_assignee_firstname && (
                              <span>{task.fields.task_assignee_firstname} {task.fields.task_assignee_lastname}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditAufgabe(task); setAufgabeDialog(true); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Bearbeiten"
                          >
                            <IconPencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteAufgabe(task)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Löschen"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MEASURES */}
          {activeSection === 'measures' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">Maßnahmen-Management</h3>
                  <p className="text-xs text-muted-foreground">Sicherheitsmaßnahmen verfolgen</p>
                </div>
                <Button size="sm" onClick={() => { setEditMassnahme(null); setMassnahmeDialog(true); }}>
                  <IconPlus size={14} className="mr-1 shrink-0" />Neue Maßnahme
                </Button>
              </div>
              {openMeasures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <IconCircleCheck size={40} stroke={1.5} />
                  <p className="text-sm">Alle Maßnahmen umgesetzt</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {openMeasures.sort((a, b) => {
                    const prio: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
                    return (prio[a.fields.measure_priority?.key ?? ''] ?? 99) - (prio[b.fields.measure_priority?.key ?? ''] ?? 99);
                  }).slice(0, 10).map(measure => {
                    const isOverdue = measure.fields.measure_due_date && measure.fields.measure_due_date < today;
                    return (
                      <div key={measure.record_id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${isOverdue ? 'bg-orange-500/5 border-orange-200' : 'bg-background hover:bg-muted/30'}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm truncate">{measure.fields.measure_title || 'Unbekannte Maßnahme'}</span>
                            {measure.fields.measure_priority && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColor(measure.fields.measure_priority.key)}`}>
                                {measure.fields.measure_priority.label}
                              </span>
                            )}
                            {measure.fields.measure_type && (
                              <Badge variant="secondary" className="text-xs">{measure.fields.measure_type.label}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {measure.fields.measure_status && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(measure.fields.measure_status.key)}`}>
                                {measure.fields.measure_status.label}
                              </span>
                            )}
                            {measure.fields.measure_due_date && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-orange-600 font-medium' : ''}`}>
                                <IconClock size={11} className="shrink-0" />
                                {isOverdue ? 'Überfällig: ' : 'Fällig: '}{formatDate(measure.fields.measure_due_date)}
                              </span>
                            )}
                            {measure.fields.measure_responsible_firstname && (
                              <span>{measure.fields.measure_responsible_firstname} {measure.fields.measure_responsible_lastname}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditMassnahme(measure); setMassnahmeDialog(true); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Bearbeiten"
                          >
                            <IconPencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteMassnahme(measure)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Löschen"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FINDINGS */}
          {activeSection === 'findings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">Findings & Abweichungen</h3>
                  <p className="text-xs text-muted-foreground">Audit-Findings und Nichtkonformitäten</p>
                </div>
                <Button size="sm" onClick={() => { setEditFinding(null); setFindingDialog(true); }}>
                  <IconPlus size={14} className="mr-1 shrink-0" />Neues Finding
                </Button>
              </div>
              {openFindings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <IconCircleCheck size={40} stroke={1.5} />
                  <p className="text-sm">Keine offenen Findings</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {openFindings.sort((a, b) => {
                    const sev: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3, informativ: 4 };
                    return (sev[a.fields.finding_severity?.key ?? ''] ?? 99) - (sev[b.fields.finding_severity?.key ?? ''] ?? 99);
                  }).slice(0, 10).map(finding => {
                    const isOverdue = finding.fields.finding_due_date && finding.fields.finding_due_date < today;
                    return (
                      <div key={finding.record_id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${isOverdue ? 'bg-red-500/5 border-red-200' : 'bg-background hover:bg-muted/30'}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm truncate">{finding.fields.finding_title || 'Unbekanntes Finding'}</span>
                            {finding.fields.finding_severity && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColor(finding.fields.finding_severity.key)}`}>
                                {finding.fields.finding_severity.label}
                              </span>
                            )}
                            {finding.fields.finding_type && (
                              <Badge variant="secondary" className="text-xs">{finding.fields.finding_type.label}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {finding.fields.finding_status && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(finding.fields.finding_status.key)}`}>
                                {finding.fields.finding_status.label}
                              </span>
                            )}
                            {finding.fields.finding_due_date && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                <IconClock size={11} className="shrink-0" />
                                {isOverdue ? 'Überfällig: ' : 'Fällig: '}{formatDate(finding.fields.finding_due_date)}
                              </span>
                            )}
                            {finding.fields.finding_responsible_firstname && (
                              <span>{finding.fields.finding_responsible_firstname} {finding.fields.finding_responsible_lastname}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditFinding(finding); setFindingDialog(true); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Bearbeiten"
                          >
                            <IconPencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteFinding(finding)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Löschen"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom summary: Audit & Compliance status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audit overview */}
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Aktive Audits</h3>
          {enrichedAuditManagement.filter(a => a.fields.audit_status?.key === 'in_durchfuehrung' || a.fields.audit_status?.key === 'geplant').length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Keine aktiven Audits</p>
          ) : (
            <div className="space-y-2">
              {enrichedAuditManagement
                .filter(a => a.fields.audit_status?.key === 'in_durchfuehrung' || a.fields.audit_status?.key === 'geplant')
                .slice(0, 5)
                .map(audit => (
                  <div key={audit.record_id} className="flex items-center gap-3 p-2 rounded-lg bg-background border">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{audit.fields.audit_title || audit.fields.audit_id || 'Audit'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {audit.fields.audit_type && <span>{audit.fields.audit_type.label}</span>}
                        {audit.fields.audit_start_date && <span>{formatDate(audit.fields.audit_start_date)}</span>}
                        {audit.fields.audit_end_date && <span>→ {formatDate(audit.fields.audit_end_date)}</span>}
                      </div>
                    </div>
                    {audit.fields.audit_status && (
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${statusColor(audit.fields.audit_status.key)}`}>
                        {audit.fields.audit_status.label}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* BCM / Policy review upcoming */}
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Anstehende Reviews</h3>
          {(() => {
            const upcoming: { label: string; date: string; type: string }[] = [];
            enrichedBcmNotfallmanagement.forEach(b => {
              if (b.fields.bcm_next_test_date) upcoming.push({ label: b.fields.bcm_title || 'BCM', date: b.fields.bcm_next_test_date, type: 'BCM' });
            });
            enrichedPolicyManagement.forEach(p => {
              if (p.fields.policy_review_date) upcoming.push({ label: p.fields.policy_title || 'Policy', date: p.fields.policy_review_date, type: 'Policy' });
            });
            enrichedAwarenessSchulungen.forEach(s => {
              if (s.fields.training_end_date && s.fields.training_status?.key === 'aktiv') upcoming.push({ label: s.fields.training_title || 'Schulung', date: s.fields.training_end_date, type: 'Schulung' });
            });
            return upcoming
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-background border">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${item.date < today ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {formatDate(item.date)}
                  </span>
                </div>
              ));
          })()}
          {enrichedBcmNotfallmanagement.length + enrichedPolicyManagement.length + enrichedAwarenessSchulungen.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Keine anstehenden Reviews</p>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <IncidentManagementDialog
        open={incidentDialog}
        onClose={() => { setIncidentDialog(false); setEditIncident(null); }}
        onSubmit={async (fields) => {
          if (editIncident) {
            await LivingAppsService.updateIncidentManagementEntry(editIncident.record_id, fields);
          } else {
            await LivingAppsService.createIncidentManagementEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editIncident?.fields}
        asset_registerList={assetRegister}
        organisationseinheitenList={organisationseinheiten}
        enablePhotoScan={AI_PHOTO_SCAN['IncidentManagement']}
        enablePhotoLocation={AI_PHOTO_LOCATION['IncidentManagement']}
      />
      <ConfirmDialog
        open={!!deleteIncident}
        title="Incident löschen"
        description={`"${deleteIncident?.fields.incident_title || 'Incident'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteIncident) await LivingAppsService.deleteIncidentManagementEntry(deleteIncident.record_id);
          setDeleteIncident(null);
          fetchAll();
        }}
        onClose={() => setDeleteIncident(null)}
      />

      <RisikomanagementDialog
        open={risikoDialog}
        onClose={() => { setRisikoDialog(false); setEditRisiko(null); }}
        onSubmit={async (fields) => {
          if (editRisiko) {
            await LivingAppsService.updateRisikomanagementEntry(editRisiko.record_id, fields);
          } else {
            await LivingAppsService.createRisikomanagementEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRisiko?.fields}
        asset_registerList={assetRegister}
        organisationseinheitenList={organisationseinheiten}
        enablePhotoScan={AI_PHOTO_SCAN['Risikomanagement']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Risikomanagement']}
      />
      <ConfirmDialog
        open={!!deleteRisiko}
        title="Risiko löschen"
        description={`"${deleteRisiko?.fields.risk_title || 'Risiko'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteRisiko) await LivingAppsService.deleteRisikomanagementEntry(deleteRisiko.record_id);
          setDeleteRisiko(null);
          fetchAll();
        }}
        onClose={() => setDeleteRisiko(null)}
      />

      <AufgabenFreigabenDialog
        open={aufgabeDialog}
        onClose={() => { setAufgabeDialog(false); setEditAufgabe(null); }}
        onSubmit={async (fields) => {
          if (editAufgabe) {
            await LivingAppsService.updateAufgabenFreigabenEntry(editAufgabe.record_id, fields);
          } else {
            await LivingAppsService.createAufgabenFreigabenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editAufgabe?.fields}
        risikomanagementList={risikomanagement}
        maßnahmen_managementList={massnahmenManagement}
        audit_managementList={auditManagement}
        enablePhotoScan={AI_PHOTO_SCAN['AufgabenFreigaben']}
        enablePhotoLocation={AI_PHOTO_LOCATION['AufgabenFreigaben']}
      />
      <ConfirmDialog
        open={!!deleteAufgabe}
        title="Aufgabe löschen"
        description={`"${deleteAufgabe?.fields.task_title || 'Aufgabe'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteAufgabe) await LivingAppsService.deleteAufgabenFreigabenEntry(deleteAufgabe.record_id);
          setDeleteAufgabe(null);
          fetchAll();
        }}
        onClose={() => setDeleteAufgabe(null)}
      />

      <MassnahmenManagementDialog
        open={massnahmeDialog}
        onClose={() => { setMassnahmeDialog(false); setEditMassnahme(null); }}
        onSubmit={async (fields) => {
          if (editMassnahme) {
            await LivingAppsService.updateMassnahmenManagementEntry(editMassnahme.record_id, fields);
          } else {
            await LivingAppsService.createMassnahmenManagementEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editMassnahme?.fields}
        risikomanagementList={risikomanagement}
        enablePhotoScan={AI_PHOTO_SCAN['MassnahmenManagement']}
        enablePhotoLocation={AI_PHOTO_LOCATION['MassnahmenManagement']}
      />
      <ConfirmDialog
        open={!!deleteMassnahme}
        title="Maßnahme löschen"
        description={`"${deleteMassnahme?.fields.measure_title || 'Maßnahme'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteMassnahme) await LivingAppsService.deleteMassnahmenManagementEntry(deleteMassnahme.record_id);
          setDeleteMassnahme(null);
          fetchAll();
        }}
        onClose={() => setDeleteMassnahme(null)}
      />

      <FindingsAbweichungenDialog
        open={findingDialog}
        onClose={() => { setFindingDialog(false); setEditFinding(null); }}
        onSubmit={async (fields) => {
          if (editFinding) {
            await LivingAppsService.updateFindingsAbweichungenEntry(editFinding.record_id, fields);
          } else {
            await LivingAppsService.createFindingsAbweichungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editFinding?.fields}
        audit_managementList={auditManagement}
        kontroll_managementList={kontrollManagement}
        maßnahmen_managementList={massnahmenManagement}
        enablePhotoScan={AI_PHOTO_SCAN['FindingsAbweichungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['FindingsAbweichungen']}
      />
      <ConfirmDialog
        open={!!deleteFinding}
        title="Finding löschen"
        description={`"${deleteFinding?.fields.finding_title || 'Finding'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteFinding) await LivingAppsService.deleteFindingsAbweichungenEntry(deleteFinding.record_id);
          setDeleteFinding(null);
          fetchAll();
        }}
        onClose={() => setDeleteFinding(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
