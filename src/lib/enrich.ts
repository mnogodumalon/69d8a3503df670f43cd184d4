import type { EnrichedAssetRegister, EnrichedAuditManagement, EnrichedAufgabenFreigaben, EnrichedAwarenessSchulungen, EnrichedBcmNotfallmanagement, EnrichedDokumenteEvidenzen, EnrichedFindingsAbweichungen, EnrichedIncidentManagement, EnrichedKontrollManagement, EnrichedMassnahmenManagement, EnrichedPolicyManagement, EnrichedRisikoRegister, EnrichedSoaManagement } from '@/types/enriched';
import type { AssetRegister, AuditManagement, AufgabenFreigaben, AwarenessSchulungen, BcmNotfallmanagement, DokumenteEvidenzen, FindingsAbweichungen, FrameworkVerwaltung, IncidentManagement, KontrollManagement, MassnahmenManagement, Organisationseinheiten, PolicyManagement, RisikoRegister, SoaManagement } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface AssetRegisterMaps {
  organisationseinheitenMap: Map<string, Organisationseinheiten>;
}

export function enrichAssetRegister(
  assetRegister: AssetRegister[],
  maps: AssetRegisterMaps
): EnrichedAssetRegister[] {
  return assetRegister.map(r => ({
    ...r,
    asset_org_unitName: resolveDisplay(r.fields.asset_org_unit, maps.organisationseinheitenMap, 'org_housenumber'),
  }));
}

interface RisikoRegisterMaps {
  assetRegisterMap: Map<string, AssetRegister>;
  organisationseinheitenMap: Map<string, Organisationseinheiten>;
}

export function enrichRisikoRegister(
  risikoRegister: RisikoRegister[],
  maps: RisikoRegisterMaps
): EnrichedRisikoRegister[] {
  return risikoRegister.map(r => ({
    ...r,
    risk_assetName: resolveDisplay(r.fields.risk_asset, maps.assetRegisterMap, 'asset_name'),
    risk_org_unitName: resolveDisplay(r.fields.risk_org_unit, maps.organisationseinheitenMap, 'org_housenumber'),
  }));
}

interface MassnahmenManagementMaps {
  risikoRegisterMap: Map<string, RisikoRegister>;
}

export function enrichMassnahmenManagement(
  massnahmenManagement: MassnahmenManagement[],
  maps: MassnahmenManagementMaps
): EnrichedMassnahmenManagement[] {
  return massnahmenManagement.map(r => ({
    ...r,
    measure_riskName: resolveDisplay(r.fields.measure_risk, maps.risikoRegisterMap, 'risk_id'),
  }));
}

interface KontrollManagementMaps {
  frameworkVerwaltungMap: Map<string, FrameworkVerwaltung>;
  massnahmenManagementMap: Map<string, MassnahmenManagement>;
}

export function enrichKontrollManagement(
  kontrollManagement: KontrollManagement[],
  maps: KontrollManagementMaps
): EnrichedKontrollManagement[] {
  return kontrollManagement.map(r => ({
    ...r,
    ctrl_frameworkName: resolveDisplay(r.fields.ctrl_framework, maps.frameworkVerwaltungMap, 'fw_name'),
    ctrl_measureName: resolveDisplay(r.fields.ctrl_measure, maps.massnahmenManagementMap, 'measure_id'),
  }));
}

interface SoaManagementMaps {
  kontrollManagementMap: Map<string, KontrollManagement>;
}

export function enrichSoaManagement(
  soaManagement: SoaManagement[],
  maps: SoaManagementMaps
): EnrichedSoaManagement[] {
  return soaManagement.map(r => ({
    ...r,
    soa_controlName: resolveDisplay(r.fields.soa_control, maps.kontrollManagementMap, 'ctrl_id'),
  }));
}

interface AuditManagementMaps {
  frameworkVerwaltungMap: Map<string, FrameworkVerwaltung>;
  organisationseinheitenMap: Map<string, Organisationseinheiten>;
}

export function enrichAuditManagement(
  auditManagement: AuditManagement[],
  maps: AuditManagementMaps
): EnrichedAuditManagement[] {
  return auditManagement.map(r => ({
    ...r,
    audit_frameworkName: resolveDisplay(r.fields.audit_framework, maps.frameworkVerwaltungMap, 'fw_name'),
    audit_org_unitName: resolveDisplay(r.fields.audit_org_unit, maps.organisationseinheitenMap, 'org_housenumber'),
  }));
}

interface FindingsAbweichungenMaps {
  auditManagementMap: Map<string, AuditManagement>;
  kontrollManagementMap: Map<string, KontrollManagement>;
  massnahmenManagementMap: Map<string, MassnahmenManagement>;
}

export function enrichFindingsAbweichungen(
  findingsAbweichungen: FindingsAbweichungen[],
  maps: FindingsAbweichungenMaps
): EnrichedFindingsAbweichungen[] {
  return findingsAbweichungen.map(r => ({
    ...r,
    finding_auditName: resolveDisplay(r.fields.finding_audit, maps.auditManagementMap, 'audit_id'),
    finding_controlName: resolveDisplay(r.fields.finding_control, maps.kontrollManagementMap, 'ctrl_id'),
    finding_measureName: resolveDisplay(r.fields.finding_measure, maps.massnahmenManagementMap, 'measure_id'),
  }));
}

interface IncidentManagementMaps {
  assetRegisterMap: Map<string, AssetRegister>;
  organisationseinheitenMap: Map<string, Organisationseinheiten>;
}

export function enrichIncidentManagement(
  incidentManagement: IncidentManagement[],
  maps: IncidentManagementMaps
): EnrichedIncidentManagement[] {
  return incidentManagement.map(r => ({
    ...r,
    incident_affected_assetName: resolveDisplay(r.fields.incident_affected_asset, maps.assetRegisterMap, 'asset_name'),
    incident_affected_orgName: resolveDisplay(r.fields.incident_affected_org, maps.organisationseinheitenMap, 'org_housenumber'),
  }));
}

interface PolicyManagementMaps {
  frameworkVerwaltungMap: Map<string, FrameworkVerwaltung>;
}

export function enrichPolicyManagement(
  policyManagement: PolicyManagement[],
  maps: PolicyManagementMaps
): EnrichedPolicyManagement[] {
  return policyManagement.map(r => ({
    ...r,
    policy_frameworkName: resolveDisplay(r.fields.policy_framework, maps.frameworkVerwaltungMap, 'fw_name'),
  }));
}

interface DokumenteEvidenzenMaps {
  kontrollManagementMap: Map<string, KontrollManagement>;
  auditManagementMap: Map<string, AuditManagement>;
}

export function enrichDokumenteEvidenzen(
  dokumenteEvidenzen: DokumenteEvidenzen[],
  maps: DokumenteEvidenzenMaps
): EnrichedDokumenteEvidenzen[] {
  return dokumenteEvidenzen.map(r => ({
    ...r,
    doc_related_controlName: resolveDisplay(r.fields.doc_related_control, maps.kontrollManagementMap, 'ctrl_id'),
    doc_related_auditName: resolveDisplay(r.fields.doc_related_audit, maps.auditManagementMap, 'audit_id'),
  }));
}

interface BcmNotfallmanagementMaps {
  assetRegisterMap: Map<string, AssetRegister>;
}

export function enrichBcmNotfallmanagement(
  bcmNotfallmanagement: BcmNotfallmanagement[],
  maps: BcmNotfallmanagementMaps
): EnrichedBcmNotfallmanagement[] {
  return bcmNotfallmanagement.map(r => ({
    ...r,
    bcm_related_assetName: resolveDisplay(r.fields.bcm_related_asset, maps.assetRegisterMap, 'asset_name'),
  }));
}

interface AwarenessSchulungenMaps {
  frameworkVerwaltungMap: Map<string, FrameworkVerwaltung>;
}

export function enrichAwarenessSchulungen(
  awarenessSchulungen: AwarenessSchulungen[],
  maps: AwarenessSchulungenMaps
): EnrichedAwarenessSchulungen[] {
  return awarenessSchulungen.map(r => ({
    ...r,
    training_frameworkName: resolveDisplay(r.fields.training_framework, maps.frameworkVerwaltungMap, 'fw_name'),
  }));
}

interface AufgabenFreigabenMaps {
  risikoRegisterMap: Map<string, RisikoRegister>;
  massnahmenManagementMap: Map<string, MassnahmenManagement>;
  auditManagementMap: Map<string, AuditManagement>;
}

export function enrichAufgabenFreigaben(
  aufgabenFreigaben: AufgabenFreigaben[],
  maps: AufgabenFreigabenMaps
): EnrichedAufgabenFreigaben[] {
  return aufgabenFreigaben.map(r => ({
    ...r,
    task_related_riskName: resolveDisplay(r.fields.task_related_risk, maps.risikoRegisterMap, 'risk_id'),
    task_related_measureName: resolveDisplay(r.fields.task_related_measure, maps.massnahmenManagementMap, 'measure_id'),
    task_related_auditName: resolveDisplay(r.fields.task_related_audit, maps.auditManagementMap, 'audit_id'),
  }));
}
