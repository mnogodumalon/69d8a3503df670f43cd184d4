import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichSoaManagement, enrichKontrollManagement, enrichAufgabenFreigaben, enrichAwarenessSchulungen, enrichPolicyManagement, enrichFindingsAbweichungen, enrichIncidentManagement, enrichMassnahmenManagement, enrichDokumenteEvidenzen, enrichAuditManagement, enrichAssetRegister, enrichBcmNotfallmanagement, enrichRisikoRegister } from '@/lib/enrich';
import type { EnrichedAufgabenFreigaben, EnrichedFindingsAbweichungen, EnrichedIncidentManagement, EnrichedMassnahmenManagement } from '@/types/enriched';
// @ts-ignore
import { LivingAppsService } from '@/services/livingAppsService';
// @ts-ignore
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconShieldCheck, IconAlertTriangle, IconClipboardList, IconBug, IconChartBar, IconExclamationMark, IconPlus, IconPencil, IconTrash, IconChevronRight, IconFileText, IconUsers } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { IncidentManagementDialog } from '@/components/dialogs/IncidentManagementDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { FindingsAbweichungenDialog } from '@/components/dialogs/FindingsAbweichungenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useNavigate } from 'react-router-dom';

const APPGROUP_ID = '69d8a3503df670f43cd184d4';
const REPAIR_ENDPOINT = '/claude/build/repair';

type DialogType = 'aufgabe' | 'incident' | 'massnahme' | 'finding' | null;

export default function DashboardOverview() {
  const navigate = useNavigate();
  const {
    organisationseinheiten, soaManagement, kontrollManagement, aufgabenFreigaben, awarenessSchulungen, policyManagement, findingsAbweichungen, frameworkVerwaltung, incidentManagement, massnahmenManagement, dokumenteEvidenzen, auditManagement, assetRegister, bcmNotfallmanagement, lieferantenmanagement, risikoRegister,
    organisationseinheitenMap, kontrollManagementMap, frameworkVerwaltungMap, massnahmenManagementMap, auditManagementMap, assetRegisterMap, risikoRegisterMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [editAufgabe, setEditAufgabe] = useState<EnrichedAufgabenFreigaben | null>(null);
  const [editIncident, setEditIncident] = useState<EnrichedIncidentManagement | null>(null);
  const [editMassnahme, setEditMassnahme] = useState<EnrichedMassnahmenManagement | null>(null);
  const [editFinding, setEditFinding] = useState<EnrichedFindingsAbweichungen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: DialogType; id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'uebersicht' | 'risiken' | 'aufgaben' | 'incidents' | 'massnahmen'>('uebersicht');

  const enrichedSoaManagement = enrichSoaManagement(soaManagement, { kontrollManagementMap });
  const enrichedKontrollManagement = enrichKontrollManagement(kontrollManagement, { frameworkVerwaltungMap, massnahmenManagementMap });
  const enrichedAufgabenFreigaben = enrichAufgabenFreigaben(aufgabenFreigaben, { risikoRegisterMap, massnahmenManagementMap, auditManagementMap });
  const enrichedAwarenessSchulungen = enrichAwarenessSchulungen(awarenessSchulungen, { frameworkVerwaltungMap });
  const enrichedPolicyManagement = enrichPolicyManagement(policyManagement, { frameworkVerwaltungMap });
  const enrichedFindingsAbweichungen = enrichFindingsAbweichungen(findingsAbweichungen, { auditManagementMap, kontrollManagementMap, massnahmenManagementMap });
  const enrichedIncidentManagement = enrichIncidentManagement(incidentManagement, { assetRegisterMap, organisationseinheitenMap });
  const enrichedMassnahmenManagement = enrichMassnahmenManagement(massnahmenManagement, { risikoRegisterMap });
  const enrichedDokumenteEvidenzen = enrichDokumenteEvidenzen(dokumenteEvidenzen, { kontrollManagementMap, auditManagementMap });
  const enrichedAuditManagement = enrichAuditManagement(auditManagement, { frameworkVerwaltungMap, organisationseinheitenMap });
  const enrichedAssetRegister = enrichAssetRegister(assetRegister, { organisationseinheitenMap });
  const enrichedBcmNotfallmanagement = enrichBcmNotfallmanagement(bcmNotfallmanagement, { assetRegisterMap });
  const enrichedRisikoRegister = enrichRisikoRegister(risikoRegister, { assetRegisterMap, organisationseinheitenMap });

  const stats = useMemo(() => {
    const offeneAufgaben = enrichedAufgabenFreigaben.filter(t => !['erledigt', 'abgebrochen', 'abgelehnt'].includes(t.fields.task_status?.key ?? ''));
    const kritischeRisiken = enrichedRisikoRegister.filter(r => ['p4', 'p5'].includes(r.fields.risk_probability?.key ?? '') || (r.fields.risk_score_brutto ?? 0) >= 16);
    const offeneIncidents = enrichedIncidentManagement.filter(i => !['behoben', 'geschlossen'].includes(i.fields.incident_status?.key ?? ''));
    const offeneFindings = enrichedFindingsAbweichungen.filter(f => !['behoben', 'akzeptiert', 'geschlossen'].includes(f.fields.finding_status?.key ?? ''));
    const ueberfaelligeMassnahmen = enrichedMassnahmenManagement.filter(m => {
      const due = m.fields.measure_due_date;
      return due && new Date(due) < new Date() && !['umgesetzt', 'entfaellt'].includes(m.fields.measure_status?.key ?? '');
    });
    const nis2Incidents = enrichedIncidentManagement.filter(i => i.fields.incident_nis2_reportable);
    return { offeneAufgaben, kritischeRisiken, offeneIncidents, offeneFindings, ueberfaelligeMassnahmen, nis2Incidents };
  }, [enrichedAufgabenFreigaben, enrichedRisikoRegister, enrichedIncidentManagement, enrichedFindingsAbweichungen, enrichedMassnahmenManagement]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'aufgabe') await LivingAppsService.deleteAufgabenFreigabenEntry(deleteTarget.id);
      else if (deleteTarget.type === 'incident') await LivingAppsService.deleteIncidentManagementEntry(deleteTarget.id);
      else if (deleteTarget.type === 'massnahme') await LivingAppsService.deleteMassnahmenManagementEntry(deleteTarget.id);
      else if (deleteTarget.type === 'finding') await LivingAppsService.deleteFindingsAbweichungenEntry(deleteTarget.id);
      fetchAll();
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const severityColor = (key?: string) => {
    if (key === 'kritisch') return 'bg-red-500/10 text-red-600 border-red-200';
    if (key === 'hoch') return 'bg-orange-500/10 text-orange-600 border-orange-200';
    if (key === 'mittel') return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    return 'bg-blue-500/10 text-blue-600 border-blue-200';
  };

  const statusColor = (key?: string) => {
    if (['offen', 'neu', 'geplant', 'in_planung'].includes(key ?? '')) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (['in_bearbeitung', 'in_umsetzung', 'in_durchfuehrung', 'aktiv'].includes(key ?? '')) return 'bg-blue-500/10 text-blue-600 border-blue-200';
    if (['behoben', 'erledigt', 'geschlossen', 'freigegeben', 'umgesetzt', 'abgeschlossen'].includes(key ?? '')) return 'bg-green-500/10 text-green-600 border-green-200';
    if (['eskaliert', 'kritisch', 'nc_major'].includes(key ?? '')) return 'bg-red-500/10 text-red-600 border-red-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const tabs = [
    { id: 'uebersicht', label: 'Übersicht' },
    { id: 'risiken', label: 'Risiken' },
    { id: 'aufgaben', label: 'Aufgaben' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'massnahmen', label: 'Maßnahmen' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Kritische Risiken"
          value={String(stats.kritischeRisiken.length)}
          description="Hohe / Sehr hohe Eintrittswahrscheinlichkeit"
          icon={<IconAlertTriangle size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offene Incidents"
          value={String(stats.offeneIncidents.length)}
          description={stats.nis2Incidents.length > 0 ? `${stats.nis2Incidents.length} NIS2-meldepflichtig` : 'Keine NIS2-Meldepflicht'}
          icon={<IconBug size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offene Aufgaben"
          value={String(stats.offeneAufgaben.length)}
          description="Freigaben & Tasks in Bearbeitung"
          icon={<IconClipboardList size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Überfällige Maßnahmen"
          value={String(stats.ueberfaelligeMassnahmen.length)}
          description={`${stats.offeneFindings.length} offene Findings`}
          icon={<IconShieldCheck size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Übersicht Tab */}
      {activeTab === 'uebersicht' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Compliance-Status */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <IconShieldCheck size={16} className="text-primary shrink-0" />
                Compliance-Übersicht
              </h3>
              <button onClick={() => navigate('/kontroll-management')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Alle <IconChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {frameworkVerwaltung.slice(0, 5).map(fw => {
                const controls = enrichedKontrollManagement.filter(k => k.fields.ctrl_framework && k.fields.ctrl_framework.includes(fw.record_id));
                const implemented = controls.filter(k => k.fields.ctrl_implementation_status?.key === 'vollstaendig_implementiert').length;
                const pct = controls.length > 0 ? Math.round((implemented / controls.length) * 100) : 0;
                return (
                  <div key={fw.record_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate min-w-0 text-foreground font-medium">{fw.fields.fw_name ?? fw.fields.fw_type?.label ?? 'Framework'}</span>
                      <span className="ml-2 shrink-0 text-muted-foreground">{pct}% ({implemented}/{controls.length})</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {frameworkVerwaltung.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Keine Frameworks erfasst</p>
              )}
            </div>
          </div>

          {/* Aktuelle Audits */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <IconFileText size={16} className="text-primary shrink-0" />
                Laufende Audits
              </h3>
              <button onClick={() => navigate('/audit-management')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Alle <IconChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {enrichedAuditManagement
                .filter(a => !['abgeschlossen', 'abgebrochen'].includes(a.fields.audit_status?.key ?? ''))
                .slice(0, 5)
                .map(audit => (
                  <div key={audit.record_id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border last:border-0">
                    <span className="truncate min-w-0 font-medium text-foreground">{audit.fields.audit_title ?? audit.fields.audit_id ?? 'Audit'}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {audit.fields.audit_end_date && (
                        <span className="text-muted-foreground">{formatDate(audit.fields.audit_end_date)}</span>
                      )}
                      <Badge variant="outline" className={`text-xs ${statusColor(audit.fields.audit_status?.key)}`}>
                        {audit.fields.audit_status?.label ?? 'Unbekannt'}
                      </Badge>
                    </div>
                  </div>
                ))}
              {enrichedAuditManagement.filter(a => !['abgeschlossen', 'abgebrochen'].includes(a.fields.audit_status?.key ?? '')).length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Keine laufenden Audits</p>
              )}
            </div>
          </div>

          {/* Policy-Status */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <IconChartBar size={16} className="text-primary shrink-0" />
                Richtlinien-Status
              </h3>
              <button onClick={() => navigate('/policy-management')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Alle <IconChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'freigegeben', label: 'Freigegeben', color: 'text-green-600 bg-green-50' },
                { key: 'in_review', label: 'In Review', color: 'text-blue-600 bg-blue-50' },
                { key: 'entwurf', label: 'Entwurf', color: 'text-yellow-600 bg-yellow-50' },
                { key: 'zurueckgezogen', label: 'Zurückgezogen', color: 'text-red-600 bg-red-50' },
              ].map(({ key, label, color }) => {
                const count = enrichedPolicyManagement.filter(p => p.fields.policy_status?.key === key).length;
                return (
                  <div key={key} className={`rounded-xl p-3 ${color}`}>
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-xs mt-0.5">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schulungen & Awareness */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <IconUsers size={16} className="text-primary shrink-0" />
                Schulungen & Awareness
              </h3>
              <button onClick={() => navigate('/awareness-schulungen')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Alle <IconChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {enrichedAwarenessSchulungen.filter(t => t.fields.training_status?.key !== 'abgeschlossen').slice(0, 4).map(training => (
                <div key={training.record_id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{training.fields.training_title ?? 'Schulung'}</p>
                    {training.fields.training_completion_rate !== undefined && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${training.fields.training_completion_rate}%` }} />
                        </div>
                        <span className="text-muted-foreground">{training.fields.training_completion_rate}%</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs ${statusColor(training.fields.training_status?.key)}`}>
                    {training.fields.training_status?.label ?? 'Unbekannt'}
                  </Badge>
                </div>
              ))}
              {enrichedAwarenessSchulungen.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Keine Schulungen erfasst</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Risiken Tab */}
      {activeTab === 'risiken' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">{enrichedRisikoRegister.length} Risiken gesamt</h3>
            <button onClick={() => navigate('/risiko-register')} className="text-xs text-primary hover:underline flex items-center gap-1">
              Alle im Detail <IconChevronRight size={12} />
            </button>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Risiko</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Kategorie</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Eintritt</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Auswirkung</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Eigentümer</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedRisikoRegister
                    .sort((a, b) => (b.fields.risk_score_brutto ?? 0) - (a.fields.risk_score_brutto ?? 0))
                    .map(risk => (
                      <tr key={risk.record_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[160px]">{risk.fields.risk_title ?? risk.fields.risk_id ?? 'Risiko'}</p>
                            {risk.fields.risk_score_brutto !== undefined && (
                              <p className="text-xs text-muted-foreground">Score: {risk.fields.risk_score_brutto}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
                            {risk.fields.risk_category?.map((c: { label: string }) => c.label).join(', ') ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${severityColor(risk.fields.risk_probability?.key?.replace('p', '') === '4' || risk.fields.risk_probability?.key?.replace('p', '') === '5' ? 'hoch' : 'niedrig')}`}>
                            {risk.fields.risk_probability?.label?.split('–')[0]?.trim() ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${severityColor(risk.fields.risk_impact?.key?.replace('i', '') === '4' || risk.fields.risk_impact?.key?.replace('i', '') === '5' ? 'hoch' : 'niedrig')}`}>
                            {risk.fields.risk_impact?.label?.split('–')[0]?.trim() ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="outline" className={`text-xs ${statusColor(risk.fields.risk_status?.key)}`}>
                            {risk.fields.risk_status?.label ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
                            {[risk.fields.risk_owner_firstname, risk.fields.risk_owner_lastname].filter(Boolean).join(' ') || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {enrichedRisikoRegister.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Keine Risiken erfasst</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Aufgaben Tab */}
      {activeTab === 'aufgaben' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-sm text-muted-foreground">{enrichedAufgabenFreigaben.length} Aufgaben gesamt</h3>
            <Button size="sm" onClick={() => { setEditAufgabe(null); setActiveDialog('aufgabe'); }}>
              <IconPlus size={14} className="mr-1 shrink-0" />Neue Aufgabe
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Titel</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Typ</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Priorität</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Fällig</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Zugewiesen an</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedAufgabenFreigaben
                    .sort((a, b) => {
                      const prio = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
                      return (prio[a.fields.task_priority?.key as keyof typeof prio] ?? 4) - (prio[b.fields.task_priority?.key as keyof typeof prio] ?? 4);
                    })
                    .map(task => {
                      const isOverdue = task.fields.task_due_date && new Date(task.fields.task_due_date) < new Date() && !['erledigt', 'abgebrochen'].includes(task.fields.task_status?.key ?? '');
                      return (
                        <tr key={task.record_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground truncate max-w-[160px]">{task.fields.task_title ?? 'Aufgabe'}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs text-muted-foreground">{task.fields.task_type?.label ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${severityColor(task.fields.task_priority?.key)}`}>
                              {task.fields.task_priority?.label ?? '—'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${statusColor(task.fields.task_status?.key)}`}>
                              {task.fields.task_status?.label ?? '—'}
                            </Badge>
                          </td>
                          <td className={`px-4 py-3 hidden md:table-cell text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            {task.fields.task_due_date ? formatDate(task.fields.task_due_date) : '—'}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {[task.fields.task_assignee_firstname, task.fields.task_assignee_lastname].filter(Boolean).join(' ') || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditAufgabe(task); setActiveDialog('aufgabe'); }}>
                                <IconPencil size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'aufgabe', id: task.record_id })}>
                                <IconTrash size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {enrichedAufgabenFreigaben.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Keine Aufgaben erfasst</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-sm text-muted-foreground">{enrichedIncidentManagement.length} Incidents gesamt</h3>
            <Button size="sm" onClick={() => { setEditIncident(null); setActiveDialog('incident'); }}>
              <IconPlus size={14} className="mr-1 shrink-0" />Neuer Incident
            </Button>
          </div>
          {stats.nis2Incidents.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3 text-sm text-red-700">
              <IconExclamationMark size={18} className="shrink-0 text-red-600" />
              <span><strong>{stats.nis2Incidents.length} NIS2-meldepflichtige</strong> Incidents erfordern Aufmerksamkeit</span>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Incident</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Kategorie</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Schwere</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Erkannt</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Flags</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedIncidentManagement
                    .sort((a, b) => {
                      const sev = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
                      return (sev[a.fields.incident_severity?.key as keyof typeof sev] ?? 4) - (sev[b.fields.incident_severity?.key as keyof typeof sev] ?? 4);
                    })
                    .map(incident => (
                      <tr key={incident.record_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground truncate max-w-[160px]">{incident.fields.incident_title ?? incident.fields.incident_id ?? 'Incident'}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{incident.fields.incident_category?.label ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${severityColor(incident.fields.incident_severity?.key)}`}>
                            {incident.fields.incident_severity?.label ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${statusColor(incident.fields.incident_status?.key)}`}>
                            {incident.fields.incident_status?.label ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                          {incident.fields.incident_detected_at ? formatDate(incident.fields.incident_detected_at) : '—'}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {incident.fields.incident_nis2_reportable && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">NIS2</Badge>
                            )}
                            {incident.fields.incident_dora_reportable && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">DORA</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditIncident(incident); setActiveDialog('incident'); }}>
                              <IconPencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'incident', id: incident.record_id })}>
                              <IconTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {enrichedIncidentManagement.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Keine Incidents erfasst</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Maßnahmen Tab */}
      {activeTab === 'massnahmen' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-sm text-muted-foreground">{enrichedMassnahmenManagement.length} Maßnahmen gesamt</h3>
            <Button size="sm" onClick={() => { setEditMassnahme(null); setActiveDialog('massnahme'); }}>
              <IconPlus size={14} className="mr-1 shrink-0" />Neue Maßnahme
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Maßnahme</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Typ</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Priorität</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Fällig</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Verantwortlich</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedMassnahmenManagement
                    .sort((a, b) => {
                      const prio = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
                      return (prio[a.fields.measure_priority?.key as keyof typeof prio] ?? 4) - (prio[b.fields.measure_priority?.key as keyof typeof prio] ?? 4);
                    })
                    .map(measure => {
                      const isOverdue = measure.fields.measure_due_date && new Date(measure.fields.measure_due_date) < new Date() && !['umgesetzt', 'entfaellt'].includes(measure.fields.measure_status?.key ?? '');
                      return (
                        <tr key={measure.record_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground truncate max-w-[160px]">{measure.fields.measure_title ?? measure.fields.measure_id ?? 'Maßnahme'}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs text-muted-foreground">{measure.fields.measure_type?.label ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${severityColor(measure.fields.measure_priority?.key)}`}>
                              {measure.fields.measure_priority?.label ?? '—'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${statusColor(measure.fields.measure_status?.key)}`}>
                              {measure.fields.measure_status?.label ?? '—'}
                            </Badge>
                          </td>
                          <td className={`px-4 py-3 hidden md:table-cell text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            {measure.fields.measure_due_date ? formatDate(measure.fields.measure_due_date) : '—'}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {[measure.fields.measure_responsible_firstname, measure.fields.measure_responsible_lastname].filter(Boolean).join(' ') || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditMassnahme(measure); setActiveDialog('massnahme'); }}>
                                <IconPencil size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: 'massnahme', id: measure.record_id })}>
                                <IconTrash size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {enrichedMassnahmenManagement.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Keine Maßnahmen erfasst</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {activeDialog === 'aufgabe' && (
        <AufgabenFreigabenDialog
          open={true}
          onClose={() => { setActiveDialog(null); setEditAufgabe(null); }}
          onSubmit={async (fields) => {
            if (editAufgabe) await LivingAppsService.updateAufgabenFreigabenEntry(editAufgabe.record_id, fields);
            else await LivingAppsService.createAufgabenFreigabenEntry(fields);
            fetchAll();
          }}
          defaultValues={editAufgabe?.fields}
          risiko_registerList={risikoRegister}
          maßnahmen_managementList={massnahmenManagement}
          audit_managementList={auditManagement}
          enablePhotoScan={AI_PHOTO_SCAN['AufgabenFreigaben']}
          enablePhotoLocation={AI_PHOTO_LOCATION['AufgabenFreigaben']}
        />
      )}

      {activeDialog === 'incident' && (
        <IncidentManagementDialog
          open={true}
          onClose={() => { setActiveDialog(null); setEditIncident(null); }}
          onSubmit={async (fields) => {
            if (editIncident) await LivingAppsService.updateIncidentManagementEntry(editIncident.record_id, fields);
            else await LivingAppsService.createIncidentManagementEntry(fields);
            fetchAll();
          }}
          defaultValues={editIncident?.fields}
          asset_registerList={assetRegister}
          organisationseinheitenList={organisationseinheiten}
          enablePhotoScan={AI_PHOTO_SCAN['IncidentManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['IncidentManagement']}
        />
      )}

      {activeDialog === 'massnahme' && (
        <MassnahmenManagementDialog
          open={true}
          onClose={() => { setActiveDialog(null); setEditMassnahme(null); }}
          onSubmit={async (fields) => {
            if (editMassnahme) await LivingAppsService.updateMassnahmenManagementEntry(editMassnahme.record_id, fields);
            else await LivingAppsService.createMassnahmenManagementEntry(fields);
            fetchAll();
          }}
          defaultValues={editMassnahme?.fields}
          risiko_registerList={risikoRegister}
          enablePhotoScan={AI_PHOTO_SCAN['MassnahmenManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['MassnahmenManagement']}
        />
      )}

      {activeDialog === 'finding' && (
        <FindingsAbweichungenDialog
          open={true}
          onClose={() => { setActiveDialog(null); setEditFinding(null); }}
          onSubmit={async (fields) => {
            if (editFinding) await LivingAppsService.updateFindingsAbweichungenEntry(editFinding.record_id, fields);
            else await LivingAppsService.createFindingsAbweichungenEntry(fields);
            fetchAll();
          }}
          defaultValues={editFinding?.fields}
          audit_managementList={auditManagement}
          kontroll_managementList={kontrollManagement}
          maßnahmen_managementList={massnahmenManagement}
          enablePhotoScan={AI_PHOTO_SCAN['FindingsAbweichungen']}
          enablePhotoLocation={AI_PHOTO_LOCATION['FindingsAbweichungen']}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description="Möchtest du diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
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
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-64 rounded-2xl" />
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
