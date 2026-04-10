import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichRisikomanagement, enrichFindingsAbweichungen, enrichMassnahmenManagement, enrichIncidentManagement, enrichAufgabenFreigaben, enrichKontrollManagement, enrichAuditManagement } from '@/lib/enrich';
import type { EnrichedRisikomanagement, EnrichedFindingsAbweichungen, EnrichedMassnahmenManagement, EnrichedIncidentManagement, EnrichedAufgabenFreigaben, EnrichedKontrollManagement, EnrichedAuditManagement } from '@/types/enriched';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RisikomanagementDialog } from '@/components/dialogs/RisikomanagementDialog';
import { IncidentManagementDialog } from '@/components/dialogs/IncidentManagementDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertTriangle, IconShield, IconClipboardList, IconBug,
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconChevronRight,
  IconExclamationMark, IconCircleCheck, IconClock,
  IconUsers, IconFileText, IconBuildingFactory2,
  IconFlame
} from '@tabler/icons-react';

const APPGROUP_ID = '69d8a3503df670f43cd184d4';
const REPAIR_ENDPOINT = '/claude/build/repair';

// ── Severity / Status helpers ──────────────────────────────────────────────

function riskSeverityColor(score?: number) {
  if (!score) return 'bg-muted text-muted-foreground';
  if (score >= 16) return 'bg-red-100 text-red-700 border border-red-200';
  if (score >= 9) return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (score >= 4) return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-green-100 text-green-700 border border-green-200';
}

function riskSeverityLabel(score?: number) {
  if (!score) return 'Keine';
  if (score >= 16) return 'Kritisch';
  if (score >= 9) return 'Hoch';
  if (score >= 4) return 'Mittel';
  return 'Niedrig';
}

function severityColor(key?: string) {
  switch (key) {
    case 'kritisch': return 'bg-red-100 text-red-700 border border-red-200';
    case 'hoch': return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'mittel': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'niedrig': return 'bg-blue-100 text-blue-700 border border-blue-200';
    default: return 'bg-muted text-muted-foreground';
  }
}

function statusColor(key?: string) {
  switch (key) {
    case 'offen':
    case 'neu':
      return 'bg-red-100 text-red-700';
    case 'in_bearbeitung':
    case 'in_behandlung':
    case 'in_umsetzung':
      return 'bg-yellow-100 text-yellow-700';
    case 'geschlossen':
    case 'erledigt':
    case 'umgesetzt':
    case 'behoben':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function priorityColor(key?: string) {
  switch (key) {
    case 'kritisch': return 'text-red-600';
    case 'hoch': return 'text-orange-500';
    case 'mittel': return 'text-yellow-500';
    default: return 'text-muted-foreground';
  }
}

function isOverdue(dateStr?: string) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ── Tab types ──────────────────────────────────────────────────────────────

type DashTab = 'risiken' | 'incidents' | 'massnahmen' | 'aufgaben';

// ── Main Component ─────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const {
    risikomanagement, soaManagement, findingsAbweichungen,
    kontrollManagement, auditManagement,
    massnahmenManagement, incidentManagement, aufgabenFreigaben,
    assetRegister, policyManagement, awarenessSchulungen,
    assetRegisterMap, organisationseinheitenMap, risikomanagementMap,
    massnahmenManagementMap, auditManagementMap, kontrollManagementMap,
    frameworkVerwaltungMap,
    loading, error, fetchAll,
  } = useDashboardData();

  // Enrichment
  const enrichedRisiken = enrichRisikomanagement(risikomanagement, { assetRegisterMap, organisationseinheitenMap });
  const enrichedFindings = enrichFindingsAbweichungen(findingsAbweichungen, { auditManagementMap, kontrollManagementMap, massnahmenManagementMap });
  const enrichedMassnahmen = enrichMassnahmenManagement(massnahmenManagement, { risikomanagementMap });
  const enrichedIncidents = enrichIncidentManagement(incidentManagement, { assetRegisterMap, organisationseinheitenMap });
  const enrichedAufgaben = enrichAufgabenFreigaben(aufgabenFreigaben, { risikomanagementMap, massnahmenManagementMap, auditManagementMap });
  const enrichedKontrollen = enrichKontrollManagement(kontrollManagement, { frameworkVerwaltungMap, massnahmenManagementMap });
  const enrichedAudits = enrichAuditManagement(auditManagement, { frameworkVerwaltungMap, organisationseinheitenMap });

  // UI State — ALL hooks before early returns
  const [activeTab, setActiveTab] = useState<DashTab>('risiken');
  const [risikoDialog, setRisikoDialog] = useState(false);
  const [editRisiko, setEditRisiko] = useState<EnrichedRisikomanagement | null>(null);
  const [deleteRisiko, setDeleteRisiko] = useState<EnrichedRisikomanagement | null>(null);
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [editIncident, setEditIncident] = useState<EnrichedIncidentManagement | null>(null);
  const [deleteIncident, setDeleteIncident] = useState<EnrichedIncidentManagement | null>(null);
  const [massnahmeDialog, setMassnahmeDialog] = useState(false);
  const [editMassnahme, setEditMassnahme] = useState<EnrichedMassnahmenManagement | null>(null);
  const [deleteMassnahme, setDeleteMassnahme] = useState<EnrichedMassnahmenManagement | null>(null);
  const [aufgabeDialog, setAufgabeDialog] = useState(false);
  const [editAufgabe, setEditAufgabe] = useState<EnrichedAufgabenFreigaben | null>(null);
  const [deleteAufgabe, setDeleteAufgabe] = useState<EnrichedAufgabenFreigaben | null>(null);

  // Derived KPIs
  const kpis = useMemo(() => {
    const offeneRisiken = enrichedRisiken.filter(r => r.fields.risk_status?.key !== 'geschlossen');
    const kritischeRisiken = enrichedRisiken.filter(r => (r.fields.risk_score_brutto ?? 0) >= 16);
    const offeneIncidents = enrichedIncidents.filter(i => !['behoben', 'geschlossen'].includes(i.fields.incident_status?.key ?? ''));
    const kritIncidents = enrichedIncidents.filter(i => i.fields.incident_severity?.key === 'kritisch');
    const offeneMassnahmen = enrichedMassnahmen.filter(m => !['umgesetzt', 'entfaellt'].includes(m.fields.measure_status?.key ?? ''));
    const overdueMassnahmen = enrichedMassnahmen.filter(m => isOverdue(m.fields.measure_due_date) && !['umgesetzt', 'entfaellt'].includes(m.fields.measure_status?.key ?? ''));
    const offeneAufgaben = enrichedAufgaben.filter(a => !['erledigt', 'abgebrochen'].includes(a.fields.task_status?.key ?? ''));
    const overdueAufgaben = enrichedAufgaben.filter(a => isOverdue(a.fields.task_due_date) && !['erledigt', 'abgebrochen'].includes(a.fields.task_status?.key ?? ''));
    const vollImplKontrollen = enrichedKontrollen.filter(k => k.fields.ctrl_implementation_status?.key === 'vollstaendig_implementiert').length;
    const soaApplicable = soaManagement.filter(s => s.fields.soa_applicable).length;
    const soaImplemented = soaManagement.filter(s => s.fields.soa_applicable && s.fields.soa_implementation_status?.key === 'vollstaendig_implementiert').length;
    const activeAudits = enrichedAudits.filter(a => a.fields.audit_status?.key === 'in_durchfuehrung').length;
    const openFindings = enrichedFindings.filter(f => !['behoben', 'geschlossen', 'akzeptiert'].includes(f.fields.finding_status?.key ?? '')).length;
    return {
      offeneRisiken: offeneRisiken.length,
      kritischeRisiken: kritischeRisiken.length,
      offeneIncidents: offeneIncidents.length,
      kritIncidents: kritIncidents.length,
      offeneMassnahmen: offeneMassnahmen.length,
      overdueMassnahmen: overdueMassnahmen.length,
      offeneAufgaben: offeneAufgaben.length,
      overdueAufgaben: overdueAufgaben.length,
      kontrollenGesamt: enrichedKontrollen.length,
      vollImplKontrollen,
      soaApplicable,
      soaImplemented,
      activeAudits,
      openFindings,
      assets: assetRegister.length,
      policies: policyManagement.length,
      schulungen: awarenessSchulungen.length,
    };
  }, [enrichedRisiken, enrichedIncidents, enrichedMassnahmen, enrichedAufgaben, enrichedKontrollen, enrichedAudits, enrichedFindings, soaManagement, assetRegister, policyManagement, awarenessSchulungen]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  // ── CRUD Handlers ────────────────────────────────────────────────────────

  const handleRisikoSubmit = async (fields: EnrichedRisikomanagement['fields']) => {
    if (editRisiko) {
      await LivingAppsService.updateRisikomanagementEntry(editRisiko.record_id, fields as never);
    } else {
      await LivingAppsService.createRisikomanagementEntry(fields as never);
    }
    fetchAll();
    setEditRisiko(null);
    setRisikoDialog(false);
  };

  const handleRisikoDelete = async () => {
    if (!deleteRisiko) return;
    await LivingAppsService.deleteRisikomanagementEntry(deleteRisiko.record_id);
    fetchAll();
    setDeleteRisiko(null);
  };

  const handleIncidentSubmit = async (fields: EnrichedIncidentManagement['fields']) => {
    if (editIncident) {
      await LivingAppsService.updateIncidentManagementEntry(editIncident.record_id, fields as never);
    } else {
      await LivingAppsService.createIncidentManagementEntry(fields as never);
    }
    fetchAll();
    setEditIncident(null);
    setIncidentDialog(false);
  };

  const handleIncidentDelete = async () => {
    if (!deleteIncident) return;
    await LivingAppsService.deleteIncidentManagementEntry(deleteIncident.record_id);
    fetchAll();
    setDeleteIncident(null);
  };

  const handleMassnahmeSubmit = async (fields: EnrichedMassnahmenManagement['fields']) => {
    if (editMassnahme) {
      await LivingAppsService.updateMassnahmenManagementEntry(editMassnahme.record_id, fields as never);
    } else {
      await LivingAppsService.createMassnahmenManagementEntry(fields as never);
    }
    fetchAll();
    setEditMassnahme(null);
    setMassnahmeDialog(false);
  };

  const handleMassnahmeDelete = async () => {
    if (!deleteMassnahme) return;
    await LivingAppsService.deleteMassnahmenManagementEntry(deleteMassnahme.record_id);
    fetchAll();
    setDeleteMassnahme(null);
  };

  const handleAufgabeSubmit = async (fields: EnrichedAufgabenFreigaben['fields']) => {
    if (editAufgabe) {
      await LivingAppsService.updateAufgabenFreigabenEntry(editAufgabe.record_id, fields as never);
    } else {
      await LivingAppsService.createAufgabenFreigabenEntry(fields as never);
    }
    fetchAll();
    setEditAufgabe(null);
    setAufgabeDialog(false);
  };

  const handleAufgabeDelete = async () => {
    if (!deleteAufgabe) return;
    await LivingAppsService.deleteAufgabenFreigabenEntry(deleteAufgabe.record_id);
    fetchAll();
    setDeleteAufgabe(null);
  };

  // ── Tab content ──────────────────────────────────────────────────────────

  const sortedRisiken = [...enrichedRisiken].sort((a, b) => (b.fields.risk_score_brutto ?? 0) - (a.fields.risk_score_brutto ?? 0));
  const sortedIncidents = [...enrichedIncidents].sort((a, b) => {
    const sev = ['kritisch', 'hoch', 'mittel', 'niedrig'];
    return sev.indexOf(a.fields.incident_severity?.key ?? '') - sev.indexOf(b.fields.incident_severity?.key ?? '');
  });
  const sortedMassnahmen = [...enrichedMassnahmen].sort((a, b) => {
    const prio = ['kritisch', 'hoch', 'mittel', 'niedrig'];
    return prio.indexOf(a.fields.measure_priority?.key ?? '') - prio.indexOf(b.fields.measure_priority?.key ?? '');
  });
  const sortedAufgaben = [...enrichedAufgaben].sort((a, b) => {
    const prio = ['kritisch', 'hoch', 'mittel', 'niedrig'];
    return prio.indexOf(a.fields.task_priority?.key ?? '') - prio.indexOf(b.fields.task_priority?.key ?? '');
  });

  return (
    <div className="space-y-6">
      {/* ── Intent Workflows ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a href="#/intents/audit-durchfuehrung" className="flex items-center gap-3 bg-card border border-border border-l-4 border-l-primary rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
          <IconClipboardList size={22} className="text-primary shrink-0" stroke={1.5} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">Audit durchführen</div>
            <div className="text-xs text-muted-foreground truncate">Findings erfassen, Maßnahmen ableiten & Aufgaben delegieren</div>
          </div>
          <IconChevronRight size={16} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" stroke={1.5} />
        </a>
        <a href="#/intents/risiko-behandlung" className="flex items-center gap-3 bg-card border border-border border-l-4 border-l-primary rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
          <IconShield size={22} className="text-primary shrink-0" stroke={1.5} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">Risiko behandeln</div>
            <div className="text-xs text-muted-foreground truncate">Strategie festlegen, Maßnahmen anlegen & Kontrollen zuordnen</div>
          </div>
          <IconChevronRight size={16} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" stroke={1.5} />
        </a>
        <a href="#/intents/incident-response" className="flex items-center gap-3 bg-card border border-border border-l-4 border-l-primary rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
          <IconBug size={22} className="text-primary shrink-0" stroke={1.5} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">Incident bearbeiten</div>
            <div className="text-xs text-muted-foreground truncate">Assets zuordnen, Maßnahmen einleiten & Incident schließen</div>
          </div>
          <IconChevronRight size={16} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" stroke={1.5} />
        </a>
      </div>
      {/* ── KPI Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Offene Risiken"
          value={String(kpis.offeneRisiken)}
          description={`${kpis.kritischeRisiken} kritisch`}
          icon={<IconAlertTriangle size={18} className={kpis.kritischeRisiken > 0 ? 'text-red-500' : 'text-muted-foreground'} />}
        />
        <StatCard
          title="Aktive Incidents"
          value={String(kpis.offeneIncidents)}
          description={`${kpis.kritIncidents} kritisch`}
          icon={<IconFlame size={18} className={kpis.kritIncidents > 0 ? 'text-red-500' : 'text-muted-foreground'} />}
        />
        <StatCard
          title="Maßnahmen offen"
          value={String(kpis.offeneMassnahmen)}
          description={kpis.overdueMassnahmen > 0 ? `${kpis.overdueMassnahmen} überfällig` : 'Im Zeitplan'}
          icon={<IconClipboardList size={18} className={kpis.overdueMassnahmen > 0 ? 'text-orange-500' : 'text-muted-foreground'} />}
        />
        <StatCard
          title="Offene Aufgaben"
          value={String(kpis.offeneAufgaben)}
          description={kpis.overdueAufgaben > 0 ? `${kpis.overdueAufgaben} überfällig` : 'Im Zeitplan'}
          icon={<IconUsers size={18} className={kpis.overdueAufgaben > 0 ? 'text-orange-500' : 'text-muted-foreground'} />}
        />
      </div>

      {/* ── Secondary KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniKpi label="Kontrollen" value={`${kpis.vollImplKontrollen}/${kpis.kontrollenGesamt}`} sub="vollständig" color="indigo" />
        <MiniKpi label="SOA-Controls" value={`${kpis.soaImplemented}/${kpis.soaApplicable}`} sub="implementiert" color="purple" />
        <MiniKpi label="Audits aktiv" value={String(kpis.activeAudits)} sub="laufend" color="blue" />
        <MiniKpi label="Findings offen" value={String(kpis.openFindings)} sub="unbehandelt" color={kpis.openFindings > 0 ? 'red' : 'green'} />
        <MiniKpi label="Assets" value={String(kpis.assets)} sub="registriert" color="slate" />
        <MiniKpi label="Richtlinien" value={String(kpis.policies)} sub="verwaltet" color="slate" />
      </div>

      {/* ── Main Workspace ──────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Tab Bar */}
        <div className="flex items-center gap-0 border-b bg-muted/30 overflow-x-auto">
          {(
            [
              { key: 'risiken', label: 'Risiken', icon: <IconAlertTriangle size={15} />, count: kpis.offeneRisiken, alert: kpis.kritischeRisiken > 0 },
              { key: 'incidents', label: 'Incidents', icon: <IconBug size={15} />, count: kpis.offeneIncidents, alert: kpis.kritIncidents > 0 },
              { key: 'massnahmen', label: 'Maßnahmen', icon: <IconShield size={15} />, count: kpis.offeneMassnahmen, alert: kpis.overdueMassnahmen > 0 },
              { key: 'aufgaben', label: 'Aufgaben', icon: <IconClipboardList size={15} />, count: kpis.offeneAufgaben, alert: kpis.overdueAufgaben > 0 },
            ] as { key: DashTab; label: string; icon: React.ReactNode; count: number; alert: boolean }[]
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium shrink-0 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                tab.alert ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* ── RISIKEN ── */}
          {activeTab === 'risiken' && (
            <TabSection
              title="Risikomanagement"
              onNew={() => { setEditRisiko(null); setRisikoDialog(true); }}
            >
              {sortedRisiken.length === 0 ? (
                <EmptyState icon={<IconAlertTriangle size={40} stroke={1.5} />} label="Keine Risiken erfasst" />
              ) : (
                <div className="space-y-2">
                  {sortedRisiken.map(r => (
                    <div key={r.record_id} className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                      <div className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-lg text-xs font-bold ${riskSeverityColor(r.fields.risk_score_brutto)}`}>
                        {r.fields.risk_score_brutto ?? '–'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.fields.risk_description ?? '(Kein Titel)'}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${riskSeverityColor(r.fields.risk_score_brutto)}`}>
                            {riskSeverityLabel(r.fields.risk_score_brutto)}
                          </span>
                          {r.fields.risk_status && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor(r.fields.risk_status.key)}`}>
                              {r.fields.risk_status.label}
                            </span>
                          )}
                          {r.fields.risk_category && r.fields.risk_category.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate">
                              {r.fields.risk_category.map(c => c.label).join(', ')}
                            </span>
                          )}
                          {r.fields.risk_review_date && (
                            <span className={`text-xs flex items-center gap-0.5 ${isOverdue(r.fields.risk_review_date) ? 'text-red-600' : 'text-muted-foreground'}`}>
                              <IconClock size={11} />
                              Review: {formatDate(r.fields.risk_review_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex gap-1">
                        <button onClick={() => { setEditRisiko(r); setRisikoDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <IconPencil size={15} />
                        </button>
                        <button onClick={() => setDeleteRisiko(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabSection>
          )}

          {/* ── INCIDENTS ── */}
          {activeTab === 'incidents' && (
            <TabSection
              title="Incident Management"
              onNew={() => { setEditIncident(null); setIncidentDialog(true); }}
            >
              {sortedIncidents.length === 0 ? (
                <EmptyState icon={<IconBug size={40} stroke={1.5} />} label="Keine Incidents erfasst" />
              ) : (
                <div className="space-y-2">
                  {sortedIncidents.map(i => (
                    <div key={i.record_id} className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                      <div className="shrink-0 mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${severityColor(i.fields.incident_severity?.key)}`}>
                          {i.fields.incident_severity?.label ?? '–'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{i.fields.incident_title ?? '(Kein Titel)'}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {i.fields.incident_status && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor(i.fields.incident_status.key)}`}>
                              {i.fields.incident_status.label}
                            </span>
                          )}
                          {i.fields.incident_category && (
                            <span className="text-xs text-muted-foreground truncate">{i.fields.incident_category.label}</span>
                          )}
                          {(i.fields.incident_nis2_reportable || i.fields.incident_dora_reportable) && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                              {[i.fields.incident_nis2_reportable && 'NIS2', i.fields.incident_dora_reportable && 'DORA'].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {i.fields.incident_detected_at && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <IconClock size={11} />
                              Entdeckt: {formatDate(i.fields.incident_detected_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex gap-1">
                        <button onClick={() => { setEditIncident(i); setIncidentDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <IconPencil size={15} />
                        </button>
                        <button onClick={() => setDeleteIncident(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabSection>
          )}

          {/* ── MAßNAHMEN ── */}
          {activeTab === 'massnahmen' && (
            <TabSection
              title="Maßnahmen Management"
              onNew={() => { setEditMassnahme(null); setMassnahmeDialog(true); }}
            >
              {sortedMassnahmen.length === 0 ? (
                <EmptyState icon={<IconShield size={40} stroke={1.5} />} label="Keine Maßnahmen erfasst" />
              ) : (
                <div className="space-y-2">
                  {sortedMassnahmen.map(m => (
                    <div key={m.record_id} className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                      <div className="shrink-0 mt-1">
                        <IconExclamationMark size={16} className={`shrink-0 ${priorityColor(m.fields.measure_priority?.key)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.fields.measure_title ?? '(Kein Titel)'}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {m.fields.measure_status && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor(m.fields.measure_status.key)}`}>
                              {m.fields.measure_status.label}
                            </span>
                          )}
                          {m.fields.measure_priority && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${severityColor(m.fields.measure_priority.key)}`}>
                              {m.fields.measure_priority.label}
                            </span>
                          )}
                          {m.fields.measure_type && (
                            <span className="text-xs text-muted-foreground">{m.fields.measure_type.label}</span>
                          )}
                          {m.fields.measure_due_date && (
                            <span className={`text-xs flex items-center gap-0.5 ${isOverdue(m.fields.measure_due_date) && m.fields.measure_status?.key !== 'umgesetzt' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              <IconClock size={11} />
                              Fällig: {formatDate(m.fields.measure_due_date)}
                              {isOverdue(m.fields.measure_due_date) && m.fields.measure_status?.key !== 'umgesetzt' && ' (überfällig)'}
                            </span>
                          )}
                          {m.measure_riskName && (
                            <span className="text-xs text-muted-foreground truncate flex items-center gap-0.5">
                              <IconChevronRight size={11} />
                              {m.measure_riskName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex gap-1">
                        <button onClick={() => { setEditMassnahme(m); setMassnahmeDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <IconPencil size={15} />
                        </button>
                        <button onClick={() => setDeleteMassnahme(m)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabSection>
          )}

          {/* ── AUFGABEN ── */}
          {activeTab === 'aufgaben' && (
            <TabSection
              title="Aufgaben & Freigaben"
              onNew={() => { setEditAufgabe(null); setAufgabeDialog(true); }}
            >
              {sortedAufgaben.length === 0 ? (
                <EmptyState icon={<IconClipboardList size={40} stroke={1.5} />} label="Keine Aufgaben erfasst" />
              ) : (
                <div className="space-y-2">
                  {sortedAufgaben.map(a => (
                    <div key={a.record_id} className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                      <div className="shrink-0 mt-1">
                        {['erledigt', 'freigegeben'].includes(a.fields.task_status?.key ?? '') ? (
                          <IconCircleCheck size={16} className="text-green-500 shrink-0" />
                        ) : (
                          <IconExclamationMark size={16} className={`shrink-0 ${priorityColor(a.fields.task_priority?.key)}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.fields.task_title ?? '(Kein Titel)'}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {a.fields.task_status && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor(a.fields.task_status.key)}`}>
                              {a.fields.task_status.label}
                            </span>
                          )}
                          {a.fields.task_priority && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${severityColor(a.fields.task_priority.key)}`}>
                              {a.fields.task_priority.label}
                            </span>
                          )}
                          {a.fields.task_type && (
                            <span className="text-xs text-muted-foreground">{a.fields.task_type.label}</span>
                          )}
                          {(a.fields.task_assignee_firstname || a.fields.task_assignee_lastname) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <IconUsers size={11} />
                              {[a.fields.task_assignee_firstname, a.fields.task_assignee_lastname].filter(Boolean).join(' ')}
                            </span>
                          )}
                          {a.fields.task_due_date && (
                            <span className={`text-xs flex items-center gap-0.5 ${isOverdue(a.fields.task_due_date) && !['erledigt', 'abgebrochen', 'freigegeben'].includes(a.fields.task_status?.key ?? '') ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              <IconClock size={11} />
                              Fällig: {formatDate(a.fields.task_due_date)}
                              {isOverdue(a.fields.task_due_date) && !['erledigt', 'abgebrochen', 'freigegeben'].includes(a.fields.task_status?.key ?? '') && ' (überfällig)'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex gap-1">
                        <button onClick={() => { setEditAufgabe(a); setAufgabeDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <IconPencil size={15} />
                        </button>
                        <button onClick={() => setDeleteAufgabe(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabSection>
          )}
        </div>
      </div>

      {/* ── GRC Overview Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Kontroll-Status */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <IconShield size={16} className="text-indigo-500 shrink-0" />
            <span className="text-sm font-semibold">Kontrollstatus</span>
          </div>
          <ProgressBar
            value={kpis.vollImplKontrollen}
            max={kpis.kontrollenGesamt}
            label="Vollständig implementiert"
            color="indigo"
          />
          <div className="mt-3 space-y-1">
            {(['vollstaendig_implementiert', 'teilweise_implementiert', 'in_umsetzung', 'nicht_implementiert'] as const).map(status => {
              const count = enrichedKontrollen.filter(k => k.fields.ctrl_implementation_status?.key === status).length;
              const labels: Record<string, string> = {
                vollstaendig_implementiert: 'Vollständig',
                teilweise_implementiert: 'Teilweise',
                in_umsetzung: 'In Umsetzung',
                nicht_implementiert: 'Nicht impl.',
              };
              const colors: Record<string, string> = {
                vollstaendig_implementiert: 'bg-green-500',
                teilweise_implementiert: 'bg-yellow-400',
                in_umsetzung: 'bg-blue-400',
                nicht_implementiert: 'bg-red-400',
              };
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
                    <span className="text-muted-foreground">{labels[status]}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Übersicht */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <IconFileText size={16} className="text-blue-500 shrink-0" />
            <span className="text-sm font-semibold">Audits</span>
          </div>
          {enrichedAudits.length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Audits erfasst</p>
          ) : (
            <div className="space-y-2">
              {enrichedAudits.slice(0, 4).map(a => (
                <div key={a.record_id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{a.fields.audit_title ?? a.fields.audit_id ?? '(Kein Titel)'}</p>
                    {a.fields.audit_end_date && (
                      <p className="text-xs text-muted-foreground">{formatDate(a.fields.audit_end_date)}</p>
                    )}
                  </div>
                  {a.fields.audit_status && (
                    <Badge variant="outline" className={`text-xs shrink-0 ${statusColor(a.fields.audit_status.key)}`}>
                      {a.fields.audit_status.label}
                    </Badge>
                  )}
                </div>
              ))}
              {enrichedAudits.length > 4 && (
                <p className="text-xs text-muted-foreground">+{enrichedAudits.length - 4} weitere</p>
              )}
            </div>
          )}
        </div>

        {/* Findings Übersicht */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <IconBuildingFactory2 size={16} className="text-orange-500 shrink-0" />
            <span className="text-sm font-semibold">Findings & Abweichungen</span>
          </div>
          {enrichedFindings.length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Findings erfasst</p>
          ) : (
            <div className="space-y-2">
              {enrichedFindings.slice(0, 4).map(f => (
                <div key={f.record_id} className="flex items-center gap-2">
                  <div className={`shrink-0 w-2 h-2 rounded-full ${
                    f.fields.finding_severity?.key === 'kritisch' ? 'bg-red-500' :
                    f.fields.finding_severity?.key === 'hoch' ? 'bg-orange-500' :
                    f.fields.finding_severity?.key === 'mittel' ? 'bg-yellow-500' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{f.fields.finding_title ?? f.fields.finding_id ?? '(Kein Titel)'}</p>
                  </div>
                  {f.fields.finding_status && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${statusColor(f.fields.finding_status.key)}`}>
                      {f.fields.finding_status.label}
                    </span>
                  )}
                </div>
              ))}
              {enrichedFindings.length > 4 && (
                <p className="text-xs text-muted-foreground">+{enrichedFindings.length - 4} weitere</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}
      <RisikomanagementDialog
        open={risikoDialog}
        onClose={() => { setRisikoDialog(false); setEditRisiko(null); }}
        onSubmit={handleRisikoSubmit as never}
        defaultValues={editRisiko?.fields as never}
        asset_registerList={assetRegister}
        organisationseinheitenList={[]}
        enablePhotoScan={AI_PHOTO_SCAN['Risikomanagement']}
      />

      <IncidentManagementDialog
        open={incidentDialog}
        onClose={() => { setIncidentDialog(false); setEditIncident(null); }}
        onSubmit={handleIncidentSubmit as never}
        defaultValues={editIncident?.fields as never}
        asset_registerList={assetRegister}
        organisationseinheitenList={[]}
        enablePhotoScan={AI_PHOTO_SCAN['IncidentManagement']}
      />

      <MassnahmenManagementDialog
        open={massnahmeDialog}
        onClose={() => { setMassnahmeDialog(false); setEditMassnahme(null); }}
        onSubmit={handleMassnahmeSubmit as never}
        defaultValues={editMassnahme?.fields as never}
        risikomanagementList={risikomanagement}
        enablePhotoScan={AI_PHOTO_SCAN['MassnahmenManagement']}
      />

      <AufgabenFreigabenDialog
        open={aufgabeDialog}
        onClose={() => { setAufgabeDialog(false); setEditAufgabe(null); }}
        onSubmit={handleAufgabeSubmit as never}
        defaultValues={editAufgabe?.fields as never}
        risikomanagementList={risikomanagement}
        maßnahmen_managementList={massnahmenManagement}
        audit_managementList={auditManagement}
        enablePhotoScan={AI_PHOTO_SCAN['AufgabenFreigaben']}
      />

      <ConfirmDialog
        open={!!deleteRisiko}
        title="Risiko löschen"
        description="Dieses Risiko wirklich löschen? Die Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleRisikoDelete}
        onClose={() => setDeleteRisiko(null)}
      />
      <ConfirmDialog
        open={!!deleteIncident}
        title="Incident löschen"
        description="Diesen Incident wirklich löschen? Die Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleIncidentDelete}
        onClose={() => setDeleteIncident(null)}
      />
      <ConfirmDialog
        open={!!deleteMassnahme}
        title="Maßnahme löschen"
        description="Diese Maßnahme wirklich löschen? Die Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleMassnahmeDelete}
        onClose={() => setDeleteMassnahme(null)}
      />
      <ConfirmDialog
        open={!!deleteAufgabe}
        title="Aufgabe löschen"
        description="Diese Aufgabe wirklich löschen? Die Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleAufgabeDelete}
        onClose={() => setDeleteAufgabe(null)}
      />
    </div>
  );
}

// ── Sub-Components ────────────────────────────────────────────────────────

function TabSection({ title, onNew, children }: { title: string; onNew: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
        <Button size="sm" onClick={onNew} className="gap-1">
          <IconPlus size={14} />
          <span className="hidden sm:inline">Neu anlegen</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>
      <div className="overflow-y-auto max-h-[480px] pr-1">{children}</div>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
      {icon}
      <p className="text-sm">{label}</p>
    </div>
  );
}

function MiniKpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-100',
    purple: 'bg-purple-50 border-purple-100',
    blue: 'bg-blue-50 border-blue-100',
    red: 'bg-red-50 border-red-100',
    green: 'bg-green-50 border-green-100',
    slate: 'bg-slate-50 border-slate-100',
  };
  const textColors: Record<string, string> = {
    indigo: 'text-indigo-700',
    purple: 'text-purple-700',
    blue: 'text-blue-700',
    red: 'text-red-700',
    green: 'text-green-700',
    slate: 'text-slate-700',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color] ?? colors.slate}`}>
      <div className={`text-xl font-bold ${textColors[color] ?? textColors.slate}`}>{value}</div>
      <div className="text-xs font-medium text-foreground mt-0.5">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const barColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColors[color] ?? barColors.indigo}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{value} von {max}</div>
    </div>
  );
}

// ── Skeleton & Error ──────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
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

      if (!resp.ok || !resp.body) { setRepairing(false); setRepairFailed(true); return; }

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
    } catch { setRepairing(false); setRepairFailed(true); }
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
        <Button size="sm" onClick={() => window.location.reload()}><IconRefresh size={14} className="mr-1" />Neu laden</Button>
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
        <p className="text-sm text-muted-foreground max-w-xs">{repairing ? repairStatus : error.message}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" /> : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktiere den Support.</p>}
    </div>
  );
}
