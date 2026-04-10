import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichRisikoRegister, enrichMassnahmenManagement, enrichFindingsAbweichungen, enrichIncidentManagement, enrichAufgabenFreigaben } from '@/lib/enrich';
import type { EnrichedRisikoRegister, EnrichedMassnahmenManagement, EnrichedIncidentManagement, EnrichedAufgabenFreigaben } from '@/types/enriched';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RisikoRegisterDialog } from '@/components/dialogs/RisikoRegisterDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { IncidentManagementDialog } from '@/components/dialogs/IncidentManagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertTriangle, IconShield, IconAlertCircle, IconTool,
  IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash,
  IconClipboardList, IconUsers, IconTarget, IconBolt,
  IconEye
} from '@tabler/icons-react';

const APPGROUP_ID = '69d8a3503df670f43cd184d4';
const REPAIR_ENDPOINT = '/claude/build/repair';

// --- Severity / Status helpers ---
function riskScoreColor(score: number | undefined): string {
  if (!score) return 'bg-muted text-muted-foreground';
  if (score >= 16) return 'bg-red-500/15 text-red-600 border-red-200';
  if (score >= 9) return 'bg-orange-500/15 text-orange-600 border-orange-200';
  if (score >= 4) return 'bg-yellow-500/15 text-yellow-600 border-yellow-200';
  return 'bg-green-500/15 text-green-600 border-green-200';
}

function riskScoreLabel(score: number | undefined): string {
  if (!score) return '–';
  if (score >= 16) return 'Kritisch';
  if (score >= 9) return 'Hoch';
  if (score >= 4) return 'Mittel';
  return 'Niedrig';
}

function severityColor(key: string | undefined): string {
  switch (key) {
    case 'kritisch': return 'bg-red-500/15 text-red-600 border border-red-200';
    case 'hoch': return 'bg-orange-500/15 text-orange-600 border border-orange-200';
    case 'mittel': return 'bg-yellow-500/15 text-yellow-600 border border-yellow-200';
    case 'niedrig': return 'bg-green-500/15 text-green-600 border border-green-200';
    default: return 'bg-muted/50 text-muted-foreground';
  }
}

function statusColor(key: string | undefined): string {
  switch (key) {
    case 'offen': case 'neu': case 'geplant': return 'bg-blue-500/10 text-blue-600';
    case 'in_bearbeitung': case 'in_behandlung': case 'in_umsetzung': return 'bg-yellow-500/10 text-yellow-700';
    case 'eskaliert': return 'bg-red-500/10 text-red-600';
    case 'behoben': case 'geschlossen': case 'erledigt': case 'akzeptiert': return 'bg-green-500/10 text-green-600';
    default: return 'bg-muted/50 text-muted-foreground';
  }
}

type ActiveDialog =
  | { type: 'risk-create' }
  | { type: 'risk-edit'; record: EnrichedRisikoRegister }
  | { type: 'measure-create' }
  | { type: 'measure-edit'; record: EnrichedMassnahmenManagement }
  | { type: 'incident-create' }
  | { type: 'incident-edit'; record: EnrichedIncidentManagement }
  | { type: 'task-create' }
  | { type: 'task-edit'; record: EnrichedAufgabenFreigaben }
  | null;

type DeleteTarget =
  | { type: 'risk'; id: string; title: string }
  | { type: 'measure'; id: string; title: string }
  | { type: 'incident'; id: string; title: string }
  | { type: 'task'; id: string; title: string }
  | null;

export default function DashboardOverview() {
  const {
    organisationseinheiten, assetRegister, frameworkVerwaltung, risikoRegister, massnahmenManagement,
    kontrollManagement, auditManagement, findingsAbweichungen, incidentManagement,
    lieferantenmanagement, policyManagement, aufgabenFreigaben,
    organisationseinheitenMap, assetRegisterMap, frameworkVerwaltungMap,
    risikoRegisterMap, massnahmenManagementMap, kontrollManagementMap, auditManagementMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [activeTab, setActiveTab] = useState<'risiken' | 'massnahmen' | 'incidents' | 'aufgaben'>('risiken');

  const enrichedRisikoRegister = enrichRisikoRegister(risikoRegister, { assetRegisterMap, organisationseinheitenMap });
  const enrichedMassnahmenManagement = enrichMassnahmenManagement(massnahmenManagement, { risikoRegisterMap });
  const enrichedFindingsAbweichungen = enrichFindingsAbweichungen(findingsAbweichungen, { auditManagementMap, kontrollManagementMap, massnahmenManagementMap });
  const enrichedIncidentManagement = enrichIncidentManagement(incidentManagement, { assetRegisterMap, organisationseinheitenMap });
  const enrichedAufgabenFreigaben = enrichAufgabenFreigaben(aufgabenFreigaben, { risikoRegisterMap, massnahmenManagementMap, auditManagementMap });

  // Risk matrix data
  const riskMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, EnrichedRisikoRegister[]>> = {};
    const probKeys = ['p5', 'p4', 'p3', 'p2', 'p1'];
    const impactKeys = ['i1', 'i2', 'i3', 'i4', 'i5'];
    probKeys.forEach(p => { matrix[p] = {}; impactKeys.forEach(i => { matrix[p][i] = []; }); });
    enrichedRisikoRegister.forEach(r => {
      const p = r.fields.risk_probability?.key;
      const i = r.fields.risk_impact?.key;
      if (p && i && matrix[p] && matrix[p][i] !== undefined) matrix[p][i].push(r);
    });
    return { matrix, probKeys, impactKeys };
  }, [enrichedRisikoRegister]);

  // KPIs
  const openRisks = enrichedRisikoRegister.filter(r => r.fields.risk_status?.key === 'offen' || r.fields.risk_status?.key === 'in_behandlung');
  const criticalRisks = enrichedRisikoRegister.filter(r => (r.fields.risk_score_brutto ?? 0) >= 16);
  const openFindings = enrichedFindingsAbweichungen.filter(f => f.fields.finding_status?.key !== 'geschlossen' && f.fields.finding_status?.key !== 'behoben');
  const openIncidents = enrichedIncidentManagement.filter(i => i.fields.incident_status?.key !== 'geschlossen' && i.fields.incident_status?.key !== 'behoben');
  const openTasks = enrichedAufgabenFreigaben.filter(t => t.fields.task_status?.key !== 'erledigt' && t.fields.task_status?.key !== 'abgebrochen');
  const pendingApprovals = enrichedAufgabenFreigaben.filter(t => t.fields.task_status?.key === 'warte_freigabe');

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'risk') await LivingAppsService.deleteRisikoRegisterEntry(deleteTarget.id);
    if (deleteTarget.type === 'measure') await LivingAppsService.deleteMassnahmenManagementEntry(deleteTarget.id);
    if (deleteTarget.type === 'incident') await LivingAppsService.deleteIncidentManagementEntry(deleteTarget.id);
    if (deleteTarget.type === 'task') await LivingAppsService.deleteAufgabenFreigabenEntry(deleteTarget.id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const matrixCellColor = (p: string, i: string): string => {
    const pNum = parseInt(p.replace('p', ''));
    const iNum = parseInt(i.replace('i', ''));
    const score = pNum * iNum;
    if (score >= 16) return 'bg-red-500/20 hover:bg-red-500/30';
    if (score >= 9) return 'bg-orange-400/20 hover:bg-orange-400/30';
    if (score >= 4) return 'bg-yellow-400/20 hover:bg-yellow-400/30';
    return 'bg-green-400/20 hover:bg-green-400/30';
  };

  const probLabel = (k: string) => ({ p5: '5', p4: '4', p3: '3', p2: '2', p1: '1' }[k] ?? k);
  const impLabel = (k: string) => ({ i1: '1', i2: '2', i3: '3', i4: '4', i5: '5' }[k] ?? k);

  return (
    <div className="space-y-6 pb-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Offene Risiken"
          value={String(openRisks.length)}
          description={`${criticalRisks.length} kritisch`}
          icon={<IconAlertTriangle size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offene Findings"
          value={String(openFindings.length)}
          description={`${enrichedFindingsAbweichungen.filter(f => f.fields.finding_severity?.key === 'kritisch').length} kritisch`}
          icon={<IconEye size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktive Incidents"
          value={String(openIncidents.length)}
          description={`${enrichedIncidentManagement.filter(i => i.fields.incident_nis2_reportable).length} NIS2-pflichtig`}
          icon={<IconBolt size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offene Aufgaben"
          value={String(openTasks.length)}
          description={`${pendingApprovals.length} warten auf Freigabe`}
          icon={<IconClipboardList size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Assets', value: assetRegister.length, icon: <IconShield size={14} className="text-muted-foreground shrink-0" /> },
          { label: 'Kontrollen', value: kontrollManagement.length, icon: <IconTarget size={14} className="text-muted-foreground shrink-0" /> },
          { label: 'Lieferanten', value: lieferantenmanagement.length, icon: <IconUsers size={14} className="text-muted-foreground shrink-0" /> },
          { label: 'Richtlinien', value: policyManagement.length, icon: <IconClipboardList size={14} className="text-muted-foreground shrink-0" /> },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
            {s.icon}
            <span className="font-bold text-foreground text-base">{s.value}</span>
            <span className="text-xs text-muted-foreground truncate">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Main content: risk matrix + work list */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-6">
        {/* Risk Matrix */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="font-semibold text-foreground">Risikomatrix</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{enrichedRisikoRegister.length} Risiken · Eintrittswahrsch. × Auswirkung</p>
            </div>
            <Button size="sm" onClick={() => setActiveDialog({ type: 'risk-create' })}>
              <IconPlus size={14} className="mr-1 shrink-0" />
              <span className="hidden sm:inline">Neues Risiko</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </div>
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-2 min-w-[340px]">
              {/* Y-axis label */}
              <div className="flex flex-col items-center justify-center w-6 shrink-0">
                <span className="text-[10px] text-muted-foreground rotate-[-90deg] whitespace-nowrap font-medium tracking-wider">WAHRSCH.</span>
              </div>
              <div className="flex-1">
                <div className="grid" style={{ gridTemplateColumns: 'auto repeat(5, 1fr)' }}>
                  {/* Y-axis numbers + cells */}
                  {riskMatrix.probKeys.map((p) => (
                    <>
                      <div key={`ylabel-${p}`} className="flex items-center justify-center h-12 w-7 shrink-0">
                        <span className="text-[11px] font-semibold text-muted-foreground">{probLabel(p)}</span>
                      </div>
                      {riskMatrix.impactKeys.map((i) => {
                        const risks = riskMatrix.matrix[p][i];
                        return (
                          <div
                            key={`${p}-${i}`}
                            className={`relative h-12 border border-background/50 rounded-md m-0.5 flex items-center justify-center cursor-pointer transition-colors ${matrixCellColor(p, i)}`}
                            title={risks.map(r => r.fields.risk_title ?? '').join(', ') || `${probLabel(p)}×${impLabel(i)}`}
                            onClick={() => {
                              if (risks.length === 1) setActiveDialog({ type: 'risk-edit', record: risks[0] });
                              else if (risks.length === 0) setActiveDialog({ type: 'risk-create' });
                            }}
                          >
                            {risks.length > 0 && (
                              <span className="text-xs font-bold text-foreground/80">{risks.length}</span>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ))}
                  {/* X-axis */}
                  <div className="w-7" />
                  {riskMatrix.impactKeys.map(i => (
                    <div key={`xlabel-${i}`} className="flex items-center justify-center h-6">
                      <span className="text-[11px] font-semibold text-muted-foreground">{impLabel(i)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-1">
                  <span className="text-[10px] text-muted-foreground font-medium tracking-wider">AUSWIRKUNG</span>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {[
                { label: 'Kritisch (16–25)', cls: 'bg-red-500/20 border-red-200' },
                { label: 'Hoch (9–15)', cls: 'bg-orange-400/20 border-orange-200' },
                { label: 'Mittel (4–8)', cls: 'bg-yellow-400/20 border-yellow-200' },
                { label: 'Niedrig (1–3)', cls: 'bg-green-400/20 border-green-200' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm border ${l.cls}`} />
                  <span className="text-[11px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top risks list */}
          {enrichedRisikoRegister.length > 0 && (
            <div className="border-t px-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4 mb-2">Top-Risiken</p>
              <div className="space-y-2">
                {enrichedRisikoRegister
                  .sort((a, b) => (b.fields.risk_score_brutto ?? 0) - (a.fields.risk_score_brutto ?? 0))
                  .slice(0, 5)
                  .map(r => (
                    <div key={r.record_id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={`px-2 py-0.5 rounded-md text-xs font-bold border ${riskScoreColor(r.fields.risk_score_brutto)}`}>
                        {r.fields.risk_score_brutto ?? '–'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.fields.risk_title ?? 'Unbenanntes Risiko'}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.fields.risk_category?.label ?? ''}{r.risk_assetName ? ` · ${r.risk_assetName}` : ''}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(r.fields.risk_status?.key)}`}>
                        {r.fields.risk_status?.label ?? '–'}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setActiveDialog({ type: 'risk-edit', record: r })}
                        >
                          <IconPencil size={13} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          onClick={() => setDeleteTarget({ type: 'risk', id: r.record_id, title: r.fields.risk_title ?? 'Risiko' })}
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {enrichedRisikoRegister.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-t">
              <IconAlertTriangle size={36} stroke={1.5} className="mb-2" />
              <p className="text-sm">Noch keine Risiken erfasst</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveDialog({ type: 'risk-create' })}>
                <IconPlus size={14} className="mr-1" />Erstes Risiko anlegen
              </Button>
            </div>
          )}
        </div>

        {/* Right panel: Tabs for Maßnahmen / Incidents / Aufgaben */}
        <div className="rounded-2xl border bg-card overflow-hidden flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b overflow-x-auto">
            {([
              { key: 'risiken', label: 'Risiken', count: enrichedRisikoRegister.filter(r => r.fields.risk_status?.key === 'offen').length },
              { key: 'massnahmen', label: 'Maßnahmen', count: enrichedMassnahmenManagement.filter(m => m.fields.measure_status?.key !== 'umgesetzt' && m.fields.measure_status?.key !== 'entfaellt').length },
              { key: 'incidents', label: 'Incidents', count: openIncidents.length },
              { key: 'aufgaben', label: 'Aufgaben', count: openTasks.length },
            ] as const).map(tab => (
              <button
                key={tab.key}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'risiken' && (
              <TabList
                items={enrichedRisikoRegister}
                onAdd={() => setActiveDialog({ type: 'risk-create' })}
                addLabel="Risiko"
                emptyIcon={<IconAlertTriangle size={40} stroke={1.5} />}
                emptyText="Keine Risiken erfasst"
                renderItem={(r: EnrichedRisikoRegister) => (
                  <WorkItem
                    key={r.record_id}
                    title={r.fields.risk_title ?? 'Unbenannt'}
                    subtitle={r.fields.risk_category?.label}
                    badge={<span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${riskScoreColor(r.fields.risk_score_brutto)}`}>{riskScoreLabel(r.fields.risk_score_brutto)}</span>}
                    meta={r.fields.risk_owner_lastname ? `${r.fields.risk_owner_firstname ?? ''} ${r.fields.risk_owner_lastname}`.trim() : undefined}
                    status={<span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor(r.fields.risk_status?.key)}`}>{r.fields.risk_status?.label ?? '–'}</span>}
                    onEdit={() => setActiveDialog({ type: 'risk-edit', record: r })}
                    onDelete={() => setDeleteTarget({ type: 'risk', id: r.record_id, title: r.fields.risk_title ?? 'Risiko' })}
                  />
                )}
              />
            )}
            {activeTab === 'massnahmen' && (
              <TabList
                items={enrichedMassnahmenManagement}
                onAdd={() => setActiveDialog({ type: 'measure-create' })}
                addLabel="Maßnahme"
                emptyIcon={<IconTool size={40} stroke={1.5} />}
                emptyText="Keine Maßnahmen erfasst"
                renderItem={(m: EnrichedMassnahmenManagement) => (
                  <WorkItem
                    key={m.record_id}
                    title={m.fields.measure_title ?? 'Unbenannt'}
                    subtitle={m.fields.measure_type?.label}
                    badge={<span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${severityColor(m.fields.measure_priority?.key)}`}>{m.fields.measure_priority?.label ?? '–'}</span>}
                    meta={m.fields.measure_due_date ? `Fällig: ${formatDate(m.fields.measure_due_date)}` : undefined}
                    status={<span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor(m.fields.measure_status?.key)}`}>{m.fields.measure_status?.label ?? '–'}</span>}
                    onEdit={() => setActiveDialog({ type: 'measure-edit', record: m })}
                    onDelete={() => setDeleteTarget({ type: 'measure', id: m.record_id, title: m.fields.measure_title ?? 'Maßnahme' })}
                  />
                )}
              />
            )}
            {activeTab === 'incidents' && (
              <TabList
                items={enrichedIncidentManagement}
                onAdd={() => setActiveDialog({ type: 'incident-create' })}
                addLabel="Incident"
                emptyIcon={<IconBolt size={40} stroke={1.5} />}
                emptyText="Keine Incidents gemeldet"
                renderItem={(inc: EnrichedIncidentManagement) => (
                  <WorkItem
                    key={inc.record_id}
                    title={inc.fields.incident_title ?? 'Unbenannt'}
                    subtitle={inc.fields.incident_category?.label}
                    badge={<span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${severityColor(inc.fields.incident_severity?.key)}`}>{inc.fields.incident_severity?.label ?? '–'}</span>}
                    meta={inc.fields.incident_detected_at ? `Erkannt: ${formatDate(inc.fields.incident_detected_at)}` : undefined}
                    status={<span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor(inc.fields.incident_status?.key)}`}>{inc.fields.incident_status?.label ?? '–'}</span>}
                    onEdit={() => setActiveDialog({ type: 'incident-edit', record: inc })}
                    onDelete={() => setDeleteTarget({ type: 'incident', id: inc.record_id, title: inc.fields.incident_title ?? 'Incident' })}
                  />
                )}
              />
            )}
            {activeTab === 'aufgaben' && (
              <TabList
                items={enrichedAufgabenFreigaben}
                onAdd={() => setActiveDialog({ type: 'task-create' })}
                addLabel="Aufgabe"
                emptyIcon={<IconClipboardList size={40} stroke={1.5} />}
                emptyText="Keine Aufgaben offen"
                renderItem={(t: EnrichedAufgabenFreigaben) => (
                  <WorkItem
                    key={t.record_id}
                    title={t.fields.task_title ?? 'Unbenannt'}
                    subtitle={t.fields.task_type?.label}
                    badge={<span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${severityColor(t.fields.task_priority?.key)}`}>{t.fields.task_priority?.label ?? '–'}</span>}
                    meta={t.fields.task_assignee_lastname ? `${t.fields.task_assignee_firstname ?? ''} ${t.fields.task_assignee_lastname}`.trim() : t.fields.task_due_date ? `Fällig: ${formatDate(t.fields.task_due_date)}` : undefined}
                    status={<span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor(t.fields.task_status?.key)}`}>{t.fields.task_status?.label ?? '–'}</span>}
                    onEdit={() => setActiveDialog({ type: 'task-edit', record: t })}
                    onDelete={() => setDeleteTarget({ type: 'task', id: t.record_id, title: t.fields.task_title ?? 'Aufgabe' })}
                  />
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* Compliance overview: Frameworks, Audits, Policies */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Frameworks */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-foreground">Frameworks</h3>
            <span className="text-xs text-muted-foreground">{frameworkVerwaltung.length} gesamt</span>
          </div>
          {frameworkVerwaltung.length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Frameworks erfasst.</p>
          ) : (
            <div className="space-y-2">
              {frameworkVerwaltung.slice(0, 5).map(fw => (
                <div key={fw.record_id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${fw.fields.fw_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                  <span className="text-sm text-foreground truncate flex-1">{fw.fields.fw_name ?? 'Unbenannt'}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{fw.fields.fw_type?.label ?? ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audits */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-foreground">Audits</h3>
            <span className="text-xs text-muted-foreground">{auditManagement.length} gesamt</span>
          </div>
          {auditManagement.length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Audits geplant.</p>
          ) : (
            <div className="space-y-2">
              {auditManagement.slice(0, 5).map(a => (
                <div key={a.record_id} className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor(a.fields.audit_status?.key)}`}>
                    {a.fields.audit_status?.label ?? '–'}
                  </span>
                  <span className="text-sm text-foreground truncate flex-1">{a.fields.audit_title ?? a.fields.audit_scope ?? 'Unbenannt'}</span>
                  {a.fields.audit_start_date && <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(a.fields.audit_start_date)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Policies */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-foreground">Richtlinien</h3>
            <span className="text-xs text-muted-foreground">{policyManagement.length} gesamt</span>
          </div>
          {policyManagement.length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Richtlinien hinterlegt.</p>
          ) : (
            <div className="space-y-2">
              {policyManagement.slice(0, 5).map(p => (
                <div key={p.record_id} className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor(p.fields.policy_status?.key)}`}>
                    {p.fields.policy_status?.label ?? '–'}
                  </span>
                  <span className="text-sm text-foreground truncate flex-1">{p.fields.policy_title ?? 'Unbenannt'}</span>
                  {p.fields.policy_review_date && <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(p.fields.policy_review_date)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {activeDialog?.type === 'risk-create' && (
        <RisikoRegisterDialog
          open
          onClose={() => setActiveDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.createRisikoRegisterEntry(fields); fetchAll(); }}
          asset_registerList={assetRegister}
          organisationseinheitenList={organisationseinheiten}
          enablePhotoScan={AI_PHOTO_SCAN['RisikoRegister']}
          enablePhotoLocation={AI_PHOTO_LOCATION['RisikoRegister']}
        />
      )}
      {activeDialog?.type === 'risk-edit' && (
        <RisikoRegisterDialog
          open
          onClose={() => setActiveDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.updateRisikoRegisterEntry(activeDialog.record.record_id, fields); fetchAll(); }}
          defaultValues={activeDialog.record.fields}
          asset_registerList={assetRegister}
          organisationseinheitenList={organisationseinheiten}
          enablePhotoScan={AI_PHOTO_SCAN['RisikoRegister']}
          enablePhotoLocation={AI_PHOTO_LOCATION['RisikoRegister']}
        />
      )}
      {activeDialog?.type === 'measure-create' && (
        <MassnahmenManagementDialog
          open
          onClose={() => setActiveDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.createMassnahmenManagementEntry(fields); fetchAll(); }}
          risiko_registerList={risikoRegister}
          enablePhotoScan={AI_PHOTO_SCAN['MassnahmenManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['MassnahmenManagement']}
        />
      )}
      {activeDialog?.type === 'measure-edit' && (
        <MassnahmenManagementDialog
          open
          onClose={() => setActiveDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.updateMassnahmenManagementEntry(activeDialog.record.record_id, fields); fetchAll(); }}
          defaultValues={activeDialog.record.fields}
          risiko_registerList={risikoRegister}
          enablePhotoScan={AI_PHOTO_SCAN['MassnahmenManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['MassnahmenManagement']}
        />
      )}
      {activeDialog?.type === 'incident-create' && (
        <IncidentManagementDialog
          open
          onClose={() => setActiveDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.createIncidentManagementEntry(fields); fetchAll(); }}
          asset_registerList={assetRegister}
          organisationseinheitenList={organisationseinheiten}
          enablePhotoScan={AI_PHOTO_SCAN['IncidentManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['IncidentManagement']}
        />
      )}
      {activeDialog?.type === 'incident-edit' && (
        <IncidentManagementDialog
          open
          onClose={() => setActiveDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.updateIncidentManagementEntry(activeDialog.record.record_id, fields); fetchAll(); }}
          defaultValues={activeDialog.record.fields}
          asset_registerList={assetRegister}
          organisationseinheitenList={organisationseinheiten}
          enablePhotoScan={AI_PHOTO_SCAN['IncidentManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['IncidentManagement']}
        />
      )}
      {activeDialog?.type === 'task-create' && (
        <AufgabenFreigabenDialog
          open
          onClose={() => setActiveDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.createAufgabenFreigabenEntry(fields); fetchAll(); }}
          risiko_registerList={risikoRegister}
          maßnahmen_managementList={massnahmenManagement}
          audit_managementList={auditManagement}
          enablePhotoScan={AI_PHOTO_SCAN['AufgabenFreigaben']}
          enablePhotoLocation={AI_PHOTO_LOCATION['AufgabenFreigaben']}
        />
      )}
      {activeDialog?.type === 'task-edit' && (
        <AufgabenFreigabenDialog
          open
          onClose={() => setActiveDialog(null)}
          onSubmit={async (fields) => { await LivingAppsService.updateAufgabenFreigabenEntry(activeDialog.record.record_id, fields); fetchAll(); }}
          defaultValues={activeDialog.record.fields}
          risiko_registerList={risikoRegister}
          maßnahmen_managementList={massnahmenManagement}
          audit_managementList={auditManagement}
          enablePhotoScan={AI_PHOTO_SCAN['AufgabenFreigaben']}
          enablePhotoLocation={AI_PHOTO_LOCATION['AufgabenFreigaben']}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={`Möchtest du "${deleteTarget?.title ?? ''}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// --- Reusable tab list component ---
function TabList<T>({
  items,
  onAdd,
  addLabel,
  emptyIcon,
  emptyText,
  renderItem,
}: {
  items: T[];
  onAdd: () => void;
  addLabel: string;
  emptyIcon: React.ReactNode;
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-card z-10">
        <span className="text-xs text-muted-foreground">{items.length} Einträge</span>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <IconPlus size={13} className="mr-1 shrink-0" />
          {addLabel}
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          {emptyIcon}
          <p className="text-sm mt-2">{emptyText}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onAdd}>
            <IconPlus size={13} className="mr-1" />{addLabel} anlegen
          </Button>
        </div>
      ) : (
        <div className="divide-y">
          {items.map(item => renderItem(item))}
        </div>
      )}
    </div>
  );
}

// --- Work item row ---
function WorkItem({
  title,
  subtitle,
  badge,
  meta,
  status,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  badge: React.ReactNode;
  meta?: string;
  status: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{title}</span>
          {badge}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {subtitle && <span className="text-xs text-muted-foreground truncate">{subtitle}</span>}
          {meta && <><span className="text-muted-foreground/40 text-xs">·</span><span className="text-xs text-muted-foreground truncate">{meta}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        {status}
        <button
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          onClick={onEdit}
        >
          <IconPencil size={13} />
        </button>
        <button
          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
          onClick={onDelete}
        >
          <IconTrash size={13} />
        </button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-6">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
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
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
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
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte lade die Seite neu.</p>
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
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktiere den Support.</p>}
    </div>
  );
}
