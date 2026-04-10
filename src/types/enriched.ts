import type { AssetRegister, AuditManagement, AufgabenFreigaben, AwarenessSchulungen, BcmNotfallmanagement, DokumenteEvidenzen, FindingsAbweichungen, IncidentManagement, KontrollManagement, MassnahmenManagement, PolicyManagement, Risikomanagement, SoaManagement } from './app';

export type EnrichedBcmNotfallmanagement = BcmNotfallmanagement & {
  bcm_related_assetName: string;
};

export type EnrichedPolicyManagement = PolicyManagement & {
  policy_frameworkName: string;
};

export type EnrichedIncidentManagement = IncidentManagement & {
  incident_affected_assetName: string;
  incident_affected_orgName: string;
};

export type EnrichedSoaManagement = SoaManagement & {
  soa_controlName: string;
};

export type EnrichedRisikomanagement = Risikomanagement & {
  risk_assetName: string;
  risk_org_unitName: string;
};

export type EnrichedDokumenteEvidenzen = DokumenteEvidenzen & {
  doc_related_controlName: string;
  doc_related_auditName: string;
};

export type EnrichedAufgabenFreigaben = AufgabenFreigaben & {
  task_related_riskName: string;
  task_related_measureName: string;
  task_related_auditName: string;
};

export type EnrichedMassnahmenManagement = MassnahmenManagement & {
  measure_riskName: string;
};

export type EnrichedFindingsAbweichungen = FindingsAbweichungen & {
  finding_auditName: string;
  finding_controlName: string;
  finding_measureName: string;
};

export type EnrichedAuditManagement = AuditManagement & {
  audit_frameworkName: string;
  audit_org_unitName: string;
};

export type EnrichedAssetRegister = AssetRegister & {
  asset_org_unitName: string;
};

export type EnrichedKontrollManagement = KontrollManagement & {
  ctrl_frameworkName: string;
  ctrl_measureName: string;
};

export type EnrichedAwarenessSchulungen = AwarenessSchulungen & {
  training_frameworkName: string;
};
