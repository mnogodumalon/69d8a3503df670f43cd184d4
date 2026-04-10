// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Organisationseinheiten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    org_housenumber?: string;
    org_postal?: string;
    org_city?: string;
    org_country?: string;
    org_responsible_firstname?: string;
    org_responsible_lastname?: string;
    org_responsible_email?: string;
    org_description?: string;
    org_active?: boolean;
    org_name?: string;
    org_type?: LookupValue;
    org_parent?: string;
    org_street?: string;
  };
}

export interface SoaManagement {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    soa_control?: string; // applookup -> URL zu 'KontrollManagement' Record
    soa_applicable?: boolean;
    soa_inclusion_reason?: LookupValue[];
    soa_exclusion_reason?: string;
    soa_justification?: string;
    soa_implementation_status?: LookupValue;
    soa_responsible_firstname?: string;
    soa_responsible_lastname?: string;
    soa_review_date?: string; // Format: YYYY-MM-DD oder ISO String
    soa_notes?: string;
  };
}

export interface KontrollManagement {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    ctrl_id?: string;
    ctrl_title?: string;
    ctrl_description?: string;
    ctrl_type?: LookupValue;
    ctrl_domain?: string;
    ctrl_framework?: string; // applookup -> URL zu 'FrameworkVerwaltung' Record
    ctrl_owner_firstname?: string;
    ctrl_owner_lastname?: string;
    ctrl_implementation_status?: LookupValue;
    ctrl_review_date?: string; // Format: YYYY-MM-DD oder ISO String
    ctrl_measure?: string; // applookup -> URL zu 'MassnahmenManagement' Record
    ctrl_notes?: string;
  };
}

export interface AufgabenFreigaben {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    task_title?: string;
    task_type?: LookupValue;
    task_description?: string;
    task_priority?: LookupValue;
    task_assignee_firstname?: string;
    task_assignee_lastname?: string;
    task_assignee_email?: string;
    task_requester_firstname?: string;
    task_requester_lastname?: string;
    task_due_date?: string; // Format: YYYY-MM-DD oder ISO String
    task_related_risk?: string; // applookup -> URL zu 'RisikoRegister' Record
    task_related_measure?: string; // applookup -> URL zu 'MassnahmenManagement' Record
    task_related_audit?: string; // applookup -> URL zu 'AuditManagement' Record
    task_status?: LookupValue;
    task_approval_comment?: string;
    task_attachment?: string;
  };
}

export interface AwarenessSchulungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    training_title?: string;
    training_type?: LookupValue;
    training_target_group?: LookupValue[];
    training_start_date?: string; // Format: YYYY-MM-DD oder ISO String
    training_end_date?: string; // Format: YYYY-MM-DD oder ISO String
    training_responsible_firstname?: string;
    training_responsible_lastname?: string;
    training_participants_count?: number;
    training_completion_rate?: number;
    training_status?: LookupValue;
    training_framework?: string; // applookup -> URL zu 'FrameworkVerwaltung' Record
    training_material?: string;
    training_notes?: string;
  };
}

export interface PolicyManagement {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    policy_id?: string;
    policy_title?: string;
    policy_category?: LookupValue;
    policy_version?: string;
    policy_status?: LookupValue;
    policy_owner_firstname?: string;
    policy_owner_lastname?: string;
    policy_approver_firstname?: string;
    policy_approver_lastname?: string;
    policy_valid_from?: string; // Format: YYYY-MM-DD oder ISO String
    policy_valid_until?: string; // Format: YYYY-MM-DD oder ISO String
    policy_review_date?: string; // Format: YYYY-MM-DD oder ISO String
    policy_scope?: string;
    policy_document?: string;
    policy_framework?: string; // applookup -> URL zu 'FrameworkVerwaltung' Record
    policy_notes?: string;
  };
}

export interface FindingsAbweichungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    finding_id?: string;
    finding_title?: string;
    finding_description?: string;
    finding_type?: LookupValue;
    finding_audit?: string; // applookup -> URL zu 'AuditManagement' Record
    finding_control?: string; // applookup -> URL zu 'KontrollManagement' Record
    finding_severity?: LookupValue;
    finding_responsible_lastname?: string;
    finding_due_date?: string; // Format: YYYY-MM-DD oder ISO String
    finding_status?: LookupValue;
    finding_measure?: string; // applookup -> URL zu 'MassnahmenManagement' Record
    finding_evidence?: string;
    finding_notes?: string;
    finding_responsible_firstname?: string;
  };
}

export interface FrameworkVerwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    fw_name?: string;
    fw_type?: LookupValue;
    fw_version?: string;
    fw_description?: string;
    req_id?: string;
    req_title?: string;
    req_description?: string;
    req_domain?: string;
    req_mandatory?: boolean;
    fw_active?: boolean;
  };
}

export interface IncidentManagement {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    incident_id?: string;
    incident_title?: string;
    incident_description?: string;
    incident_category?: LookupValue;
    incident_severity?: LookupValue;
    incident_detected_at?: string; // Format: YYYY-MM-DD oder ISO String
    incident_occurred_at?: string; // Format: YYYY-MM-DD oder ISO String
    incident_reporter_firstname?: string;
    incident_reporter_lastname?: string;
    incident_reporter_email?: string;
    incident_affected_asset?: string; // applookup -> URL zu 'AssetRegister' Record
    incident_affected_org?: string; // applookup -> URL zu 'Organisationseinheiten' Record
    incident_nis2_reportable?: boolean;
    incident_dora_reportable?: boolean;
    incident_status?: LookupValue;
    incident_evidence?: string;
    incident_notes?: string;
  };
}

export interface MassnahmenManagement {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    measure_id?: string;
    measure_title?: string;
    measure_description?: string;
    measure_type?: LookupValue;
    measure_priority?: LookupValue;
    measure_risk?: string; // applookup -> URL zu 'RisikoRegister' Record
    measure_responsible_firstname?: string;
    measure_responsible_lastname?: string;
    measure_responsible_email?: string;
    measure_due_date?: string; // Format: YYYY-MM-DD oder ISO String
    measure_completion_date?: string; // Format: YYYY-MM-DD oder ISO String
    measure_status?: LookupValue;
    measure_effectiveness?: LookupValue;
    measure_evidence?: string;
    measure_notes?: string;
  };
}

export interface DokumenteEvidenzen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    doc_title?: string;
    doc_type?: LookupValue;
    doc_version?: string;
    doc_status?: LookupValue;
    doc_owner_firstname?: string;
    doc_owner_lastname?: string;
    doc_valid_from?: string; // Format: YYYY-MM-DD oder ISO String
    doc_valid_until?: string; // Format: YYYY-MM-DD oder ISO String
    doc_related_control?: string; // applookup -> URL zu 'KontrollManagement' Record
    doc_related_audit?: string; // applookup -> URL zu 'AuditManagement' Record
    doc_file?: string;
    doc_description?: string;
    doc_tags?: string;
  };
}

export interface AuditManagement {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    audit_framework?: string; // applookup -> URL zu 'FrameworkVerwaltung' Record
    audit_scope?: string;
    audit_start_date?: string; // Format: YYYY-MM-DD oder ISO String
    audit_end_date?: string; // Format: YYYY-MM-DD oder ISO String
    audit_lead_firstname?: string;
    audit_lead_lastname?: string;
    audit_lead_email?: string;
    audit_org_unit?: string; // applookup -> URL zu 'Organisationseinheiten' Record
    audit_status?: LookupValue;
    audit_result?: LookupValue;
    audit_report?: string;
    audit_notes?: string;
    audit_id?: string;
    audit_title?: string;
    audit_type?: LookupValue;
  };
}

export interface AssetRegister {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    asset_name?: string;
    asset_id_intern?: string;
    asset_category?: LookupValue;
    asset_type?: string;
    asset_owner_firstname?: string;
    asset_owner_lastname?: string;
    asset_owner_email?: string;
    asset_classification?: LookupValue;
    asset_confidentiality?: LookupValue;
    asset_integrity?: LookupValue;
    asset_availability?: LookupValue;
    asset_location?: string;
    asset_org_unit?: string; // applookup -> URL zu 'Organisationseinheiten' Record
    asset_description?: string;
    asset_status?: LookupValue;
    asset_purchase_date?: string; // Format: YYYY-MM-DD oder ISO String
    asset_review_date?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface BcmNotfallmanagement {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    bcm_title?: string;
    bcm_type?: LookupValue;
    bcm_scope?: string;
    bcm_rto?: string;
    bcm_rpo?: string;
    bcm_responsible_firstname?: string;
    bcm_responsible_lastname?: string;
    bcm_related_asset?: string; // applookup -> URL zu 'AssetRegister' Record
    bcm_last_test_date?: string; // Format: YYYY-MM-DD oder ISO String
    bcm_next_test_date?: string; // Format: YYYY-MM-DD oder ISO String
    bcm_status?: LookupValue;
    bcm_document?: string;
    bcm_notes?: string;
  };
}

export interface Lieferantenmanagement {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    supplier_housenumber?: string;
    supplier_postal?: string;
    supplier_city?: string;
    supplier_country?: string;
    supplier_criticality?: LookupValue;
    supplier_risk_score?: number;
    supplier_last_assessment?: string; // Format: YYYY-MM-DD oder ISO String
    supplier_next_assessment?: string; // Format: YYYY-MM-DD oder ISO String
    supplier_contract_exists?: boolean;
    supplier_dpa_exists?: boolean;
    supplier_iso_certified?: boolean;
    supplier_status?: LookupValue;
    supplier_notes?: string;
    supplier_name?: string;
    supplier_id_intern?: string;
    supplier_category?: LookupValue;
    supplier_contact_firstname?: string;
    supplier_contact_lastname?: string;
    supplier_contact_email?: string;
    supplier_contact_tel?: string;
    supplier_street?: string;
  };
}

export interface RisikoRegister {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    risk_id?: string;
    risk_title?: string;
    risk_description?: string;
    risk_category?: LookupValue[];
    risk_asset?: string;
    risk_org_unit?: string;
    risk_probability?: LookupValue;
    risk_impact?: LookupValue;
    risk_score_brutto?: number;
    risk_treatment?: LookupValue;
    risk_probability_netto?: LookupValue;
    risk_confidentiality?: LookupValue;
    risk_integrity?: LookupValue;
    risk_availability?: LookupValue;
    risk_impact_netto?: LookupValue;
    risk_owner_firstname?: string;
    risk_owner_lastname?: string;
    risk_review_date?: string; // Format: YYYY-MM-DD oder ISO String
    risk_status?: LookupValue;
    risk_notes?: string;
  };
}

export const APP_IDS = {
  ORGANISATIONSEINHEITEN: '69d8a2bd7fcebae2f20488a9',
  SOA_MANAGEMENT: '69d8a2d1b9410dcb1cfce862',
  KONTROLL_MANAGEMENT: '69d8a2d0445d7fa47b771835',
  AUFGABEN_FREIGABEN: '69d8a2db27f833de3dc9a839',
  AWARENESS_SCHULUNGEN: '69d8a2daf82a6e90d0765807',
  POLICY_MANAGEMENT: '69d8a2d7cc4d6bfd1a9a28df',
  FINDINGS_ABWEICHUNGEN: '69d8a2d39905f4b7f9d2f78c',
  FRAMEWORK_VERWALTUNG: '69d8a2cd0daaa949d5a3a850',
  INCIDENT_MANAGEMENT: '69d8a2d45f729875c036a830',
  MASSNAHMEN_MANAGEMENT: '69d8a2cf04326e3426341859',
  DOKUMENTE_EVIDENZEN: '69d8a2d8de900d41e8ede84c',
  AUDIT_MANAGEMENT: '69d8a2d2fba494205d4c094b',
  ASSET_REGISTER: '69d8a2cb92e804d39a7888eb',
  BCM_NOTFALLMANAGEMENT: '69d8a2d9b9e5933137ed98cb',
  LIEFERANTENMANAGEMENT: '69d8a2d5e0de8095025ba835',
  RISIKO_REGISTER: '69d8a2cdd093755ffa3afc64',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'organisationseinheiten': {
    org_type: [{ key: "abteilung", label: "Abteilung" }, { key: "bereich", label: "Bereich" }, { key: "standort", label: "Standort" }, { key: "tochtergesellschaft", label: "Tochtergesellschaft" }, { key: "konzerngesellschaft", label: "Konzerngesellschaft" }],
  },
  'soa_management': {
    soa_inclusion_reason: [{ key: "vertraglich", label: "Vertragliche Anforderung" }, { key: "risiko", label: "Ergebnis der Risikobeurteilung" }, { key: "best_practice", label: "Best Practice" }, { key: "richtlinie", label: "Unternehmensrichtlinie" }, { key: "gesetzlich", label: "Gesetzliche Anforderung" }],
    soa_implementation_status: [{ key: "nicht_implementiert", label: "Nicht implementiert" }, { key: "in_planung", label: "In Planung" }, { key: "in_umsetzung", label: "In Umsetzung" }, { key: "teilweise_implementiert", label: "Teilweise implementiert" }, { key: "vollstaendig_implementiert", label: "Vollständig implementiert" }],
  },
  'kontroll_management': {
    ctrl_type: [{ key: "praeventiv", label: "Präventiv" }, { key: "detektiv", label: "Detektiv" }, { key: "korrektiv", label: "Korrektiv" }, { key: "direktiv", label: "Direktiv" }],
    ctrl_implementation_status: [{ key: "nicht_implementiert", label: "Nicht implementiert" }, { key: "in_umsetzung", label: "In Umsetzung" }, { key: "teilweise_implementiert", label: "Teilweise implementiert" }, { key: "vollstaendig_implementiert", label: "Vollständig implementiert" }],
  },
  'aufgaben_&_freigaben': {
    task_type: [{ key: "aufgabe", label: "Aufgabe" }, { key: "freigabe", label: "Freigabeanfrage" }, { key: "review", label: "Review" }, { key: "eskalation", label: "Eskalation" }, { key: "erinnerung", label: "Erinnerung" }],
    task_priority: [{ key: "kritisch", label: "Kritisch" }, { key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }],
    task_status: [{ key: "offen", label: "Offen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "warte_freigabe", label: "Warte auf Freigabe" }, { key: "freigegeben", label: "Freigegeben" }, { key: "abgelehnt", label: "Abgelehnt" }, { key: "erledigt", label: "Erledigt" }, { key: "abgebrochen", label: "Abgebrochen" }],
  },
  'awareness_&_schulungen': {
    training_type: [{ key: "pflicht", label: "Pflichtschulung" }, { key: "awareness", label: "Awareness-Kampagne" }, { key: "technisch", label: "Technische Schulung" }, { key: "fuehrung", label: "Führungskräfteschulung" }, { key: "onboarding", label: "Onboarding" }, { key: "phishing", label: "Phishing-Simulation" }, { key: "sonstiges", label: "Sonstiges" }],
    training_target_group: [{ key: "alle", label: "Alle Mitarbeiter" }, { key: "it", label: "IT-Personal" }, { key: "fuehrung", label: "Führungskräfte" }, { key: "neu", label: "Neue Mitarbeiter" }, { key: "admin", label: "Administratoren" }, { key: "fach", label: "Fachverantwortliche" }],
    training_status: [{ key: "geplant", label: "Geplant" }, { key: "aktiv", label: "Aktiv" }, { key: "abgeschlossen", label: "Abgeschlossen" }, { key: "abgebrochen", label: "Abgebrochen" }],
  },
  'policy_management': {
    policy_category: [{ key: "infosec", label: "Informationssicherheit" }, { key: "datenschutz", label: "Datenschutz" }, { key: "it_betrieb", label: "IT-Betrieb" }, { key: "zugang", label: "Zugangskontrolle" }, { key: "incident", label: "Incident Response" }, { key: "bcm", label: "Business Continuity" }, { key: "personal", label: "Personalrichtlinie" }, { key: "sonstiges", label: "Sonstiges" }],
    policy_status: [{ key: "entwurf", label: "Entwurf" }, { key: "in_review", label: "In Review" }, { key: "freigegeben", label: "Freigegeben" }, { key: "zurueckgezogen", label: "Zurückgezogen" }, { key: "archiviert", label: "Archiviert" }],
  },
  'findings_&_abweichungen': {
    finding_type: [{ key: "nc_major", label: "Nichtkonformität (Major)" }, { key: "nc_minor", label: "Nichtkonformität (Minor)" }, { key: "beobachtung", label: "Beobachtung" }, { key: "verbesserung", label: "Verbesserungspotenzial" }, { key: "positiv", label: "Positiver Befund" }],
    finding_severity: [{ key: "kritisch", label: "Kritisch" }, { key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }, { key: "informativ", label: "Informativ" }],
    finding_status: [{ key: "offen", label: "Offen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "behoben", label: "Behoben" }, { key: "akzeptiert", label: "Akzeptiert" }, { key: "geschlossen", label: "Geschlossen" }],
  },
  'framework_verwaltung': {
    fw_type: [{ key: "iso27001", label: "ISO/IEC 27001" }, { key: "nis2", label: "NIS2" }, { key: "dora", label: "DORA" }, { key: "bsi", label: "BSI IT-Grundschutz" }, { key: "soc2", label: "SOC 2" }, { key: "sonstiges", label: "Sonstiges" }],
  },
  'incident_management': {
    incident_category: [{ key: "malware", label: "Malware / Ransomware" }, { key: "phishing", label: "Phishing / Social Engineering" }, { key: "datenpanne", label: "Datenpanne / Datenleck" }, { key: "unbefugter_zugriff", label: "Unbefugter Zugriff" }, { key: "dos", label: "Denial of Service" }, { key: "physisch", label: "Physischer Einbruch" }, { key: "systemausfall", label: "Systemausfall" }, { key: "insider", label: "Insider-Bedrohung" }, { key: "sonstiges", label: "Sonstiges" }],
    incident_severity: [{ key: "kritisch", label: "Kritisch" }, { key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }],
    incident_status: [{ key: "neu", label: "Neu gemeldet" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "eskaliert", label: "Eskaliert" }, { key: "behoben", label: "Behoben" }, { key: "geschlossen", label: "Geschlossen" }],
  },
  'maßnahmen_management': {
    measure_type: [{ key: "technisch", label: "Technisch" }, { key: "organisatorisch", label: "Organisatorisch" }, { key: "personell", label: "Personell" }, { key: "physisch", label: "Physisch" }, { key: "rechtlich", label: "Rechtlich / Vertraglich" }],
    measure_priority: [{ key: "kritisch", label: "Kritisch" }, { key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }],
    measure_status: [{ key: "geplant", label: "Geplant" }, { key: "in_umsetzung", label: "In Umsetzung" }, { key: "umgesetzt", label: "Umgesetzt" }, { key: "nicht_umgesetzt", label: "Nicht umgesetzt" }, { key: "entfaellt", label: "Entfällt" }],
    measure_effectiveness: [{ key: "nicht_bewertet", label: "Nicht bewertet" }, { key: "wirksam", label: "Wirksam" }, { key: "teilweise_wirksam", label: "Teilweise wirksam" }, { key: "nicht_wirksam", label: "Nicht wirksam" }],
  },
  'dokumente_&_evidenzen': {
    doc_type: [{ key: "verfahren", label: "Verfahrensanweisung" }, { key: "evidenz", label: "Nachweis / Evidenz" }, { key: "auditbericht", label: "Auditbericht" }, { key: "risikoanalyse", label: "Risikoanalyse" }, { key: "vertrag", label: "Vertrag" }, { key: "zertifikat", label: "Zertifikat" }, { key: "protokoll", label: "Protokoll" }, { key: "sonstiges", label: "Sonstiges" }, { key: "richtlinie", label: "Richtlinie" }],
    doc_status: [{ key: "entwurf", label: "Entwurf" }, { key: "in_review", label: "In Review" }, { key: "freigegeben", label: "Freigegeben" }, { key: "archiviert", label: "Archiviert" }],
  },
  'audit_management': {
    audit_status: [{ key: "geplant", label: "Geplant" }, { key: "in_durchfuehrung", label: "In Durchführung" }, { key: "abgeschlossen", label: "Abgeschlossen" }, { key: "abgebrochen", label: "Abgebrochen" }],
    audit_result: [{ key: "bestanden", label: "Bestanden" }, { key: "bestanden_auflagen", label: "Bestanden mit Auflagen" }, { key: "nicht_bestanden", label: "Nicht bestanden" }, { key: "ausstehend", label: "Ausstehend" }],
    audit_type: [{ key: "intern", label: "Internes Audit" }, { key: "extern", label: "Externes Audit" }, { key: "zertifizierung", label: "Zertifizierungsaudit" }, { key: "ueberwachung", label: "Überwachungsaudit" }, { key: "lieferant", label: "Lieferantenaudit" }, { key: "behoerde", label: "Behördenaudit" }],
  },
  'asset_register': {
    asset_category: [{ key: "hardware", label: "Hardware" }, { key: "software", label: "Software" }, { key: "daten", label: "Daten / Information" }, { key: "dienst", label: "Dienst / Service" }, { key: "prozess", label: "Prozess" }, { key: "person", label: "Person / Rolle" }, { key: "gebaeude", label: "Gebäude / Infrastruktur" }, { key: "lieferant", label: "Lieferant / Drittpartei" }],
    asset_classification: [{ key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }],
    asset_confidentiality: [{ key: "oeffentlich", label: "Öffentlich" }, { key: "intern", label: "Intern" }, { key: "vertraulich", label: "Vertraulich" }, { key: "streng_vertraulich", label: "Streng vertraulich" }],
    asset_integrity: [{ key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }],
    asset_availability: [{ key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }],
    asset_status: [{ key: "in_betrieb", label: "In Betrieb" }, { key: "in_planung", label: "In Planung" }, { key: "ausser_betrieb", label: "Außer Betrieb" }, { key: "archiviert", label: "Archiviert" }],
  },
  'bcm_&_notfallmanagement': {
    bcm_type: [{ key: "bcp", label: "Business Continuity Plan (BCP)" }, { key: "drp", label: "Disaster Recovery Plan (DRP)" }, { key: "bia", label: "Business Impact Analyse (BIA)" }, { key: "uebung", label: "Notfallübung" }, { key: "prozess", label: "Kritischer Prozess" }, { key: "sonstiges", label: "Sonstiges" }],
    bcm_status: [{ key: "entwurf", label: "Entwurf" }, { key: "freigegeben", label: "Freigegeben" }, { key: "in_ueberarbeitung", label: "In Überarbeitung" }, { key: "archiviert", label: "Archiviert" }],
  },
  'lieferantenmanagement': {
    supplier_criticality: [{ key: "kritisch", label: "Kritisch" }, { key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }],
    supplier_status: [{ key: "aktiv", label: "Aktiv" }, { key: "in_pruefung", label: "In Prüfung" }, { key: "gesperrt", label: "Gesperrt" }, { key: "inaktiv", label: "Inaktiv" }],
    supplier_category: [{ key: "it", label: "IT-Dienstleister" }, { key: "cloud", label: "Cloud-Anbieter" }, { key: "software", label: "Softwareanbieter" }, { key: "hardware", label: "Hardwarelieferant" }, { key: "beratung", label: "Beratung" }, { key: "telko", label: "Telekommunikation" }, { key: "sonstiges", label: "Sonstiges" }],
  },
  'risiko_register': {
    risk_category: [{ key: "infosec", label: "Informationssicherheit" }, { key: "datenschutz", label: "Datenschutz" }, { key: "betrieb", label: "Betriebsrisiko" }, { key: "compliance", label: "Compliance" }, { key: "drittpartei", label: "Drittpartei / Lieferant" }, { key: "physisch", label: "Physische Sicherheit" }, { key: "personal", label: "Personalrisiko" }, { key: "sonstiges", label: "Sonstiges" }],
    risk_probability: [{ key: "p1", label: "1 – Sehr gering" }, { key: "p2", label: "2 – Gering" }, { key: "p3", label: "3 – Mittel" }, { key: "p4", label: "4 – Hoch" }, { key: "p5", label: "5 – Sehr hoch" }],
    risk_impact: [{ key: "i1", label: "1 – Sehr gering" }, { key: "i2", label: "2 – Gering" }, { key: "i3", label: "3 – Mittel" }, { key: "i4", label: "4 – Hoch" }, { key: "i5", label: "5 – Sehr hoch" }],
    risk_treatment: [{ key: "reduzieren", label: "Reduzieren" }, { key: "akzeptieren", label: "Akzeptieren" }, { key: "vermeiden", label: "Vermeiden" }, { key: "uebertragen", label: "Übertragen" }],
    risk_probability_netto: [{ key: "p1", label: "1 – Sehr gering" }, { key: "p2", label: "2 – Gering" }, { key: "p3", label: "3 – Mittel" }, { key: "p4", label: "4 – Hoch" }, { key: "p5", label: "5 – Sehr hoch" }],
    risk_confidentiality: [{ key: "intern", label: "Intern" }, { key: "vertraulich", label: "Vertraulich" }, { key: "oeffentlich", label: "Öffentlich" }, { key: "streng_vertraulich", label: "Streng vertraulich" }],
    risk_integrity: [{ key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }],
    risk_availability: [{ key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }, { key: "sehr_hoch", label: "Sehr hoch" }],
    risk_impact_netto: [{ key: "i1", label: "1 – Sehr gering" }, { key: "i2", label: "2 – Gering" }, { key: "i3", label: "3 – Mittel" }, { key: "i4", label: "4 – Hoch" }, { key: "i5", label: "5 – Sehr hoch" }],
    risk_status: [{ key: "offen", label: "Offen" }, { key: "in_behandlung", label: "In Behandlung" }, { key: "akzeptiert", label: "Akzeptiert" }, { key: "geschlossen", label: "Geschlossen" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'organisationseinheiten': {
    'org_housenumber': 'string/text',
    'org_postal': 'string/text',
    'org_city': 'string/text',
    'org_country': 'string/text',
    'org_responsible_firstname': 'string/text',
    'org_responsible_lastname': 'string/text',
    'org_responsible_email': 'string/email',
    'org_description': 'string/textarea',
    'org_active': 'bool',
    'org_name': 'string/text',
    'org_type': 'lookup/select',
    'org_parent': 'string/text',
    'org_street': 'string/text',
  },
  'soa_management': {
    'soa_control': 'applookup/select',
    'soa_applicable': 'bool',
    'soa_inclusion_reason': 'multiplelookup/checkbox',
    'soa_exclusion_reason': 'string/textarea',
    'soa_justification': 'string/textarea',
    'soa_implementation_status': 'lookup/select',
    'soa_responsible_firstname': 'string/text',
    'soa_responsible_lastname': 'string/text',
    'soa_review_date': 'date/date',
    'soa_notes': 'string/textarea',
  },
  'kontroll_management': {
    'ctrl_id': 'string/text',
    'ctrl_title': 'string/text',
    'ctrl_description': 'string/textarea',
    'ctrl_type': 'lookup/select',
    'ctrl_domain': 'string/text',
    'ctrl_framework': 'applookup/select',
    'ctrl_owner_firstname': 'string/text',
    'ctrl_owner_lastname': 'string/text',
    'ctrl_implementation_status': 'lookup/select',
    'ctrl_review_date': 'date/date',
    'ctrl_measure': 'applookup/select',
    'ctrl_notes': 'string/textarea',
  },
  'aufgaben_&_freigaben': {
    'task_title': 'string/text',
    'task_type': 'lookup/select',
    'task_description': 'string/textarea',
    'task_priority': 'lookup/radio',
    'task_assignee_firstname': 'string/text',
    'task_assignee_lastname': 'string/text',
    'task_assignee_email': 'string/email',
    'task_requester_firstname': 'string/text',
    'task_requester_lastname': 'string/text',
    'task_due_date': 'date/date',
    'task_related_risk': 'applookup/select',
    'task_related_measure': 'applookup/select',
    'task_related_audit': 'applookup/select',
    'task_status': 'lookup/select',
    'task_approval_comment': 'string/textarea',
    'task_attachment': 'file',
  },
  'awareness_&_schulungen': {
    'training_title': 'string/text',
    'training_type': 'lookup/select',
    'training_target_group': 'multiplelookup/checkbox',
    'training_start_date': 'date/date',
    'training_end_date': 'date/date',
    'training_responsible_firstname': 'string/text',
    'training_responsible_lastname': 'string/text',
    'training_participants_count': 'number',
    'training_completion_rate': 'number',
    'training_status': 'lookup/select',
    'training_framework': 'applookup/select',
    'training_material': 'file',
    'training_notes': 'string/textarea',
  },
  'policy_management': {
    'policy_id': 'string/text',
    'policy_title': 'string/text',
    'policy_category': 'lookup/select',
    'policy_version': 'string/text',
    'policy_status': 'lookup/select',
    'policy_owner_firstname': 'string/text',
    'policy_owner_lastname': 'string/text',
    'policy_approver_firstname': 'string/text',
    'policy_approver_lastname': 'string/text',
    'policy_valid_from': 'date/date',
    'policy_valid_until': 'date/date',
    'policy_review_date': 'date/date',
    'policy_scope': 'string/textarea',
    'policy_document': 'file',
    'policy_framework': 'applookup/select',
    'policy_notes': 'string/textarea',
  },
  'findings_&_abweichungen': {
    'finding_id': 'string/text',
    'finding_title': 'string/text',
    'finding_description': 'string/textarea',
    'finding_type': 'lookup/select',
    'finding_audit': 'applookup/select',
    'finding_control': 'applookup/select',
    'finding_severity': 'lookup/radio',
    'finding_responsible_lastname': 'string/text',
    'finding_due_date': 'date/date',
    'finding_status': 'lookup/select',
    'finding_measure': 'applookup/select',
    'finding_evidence': 'file',
    'finding_notes': 'string/textarea',
    'finding_responsible_firstname': 'string/text',
  },
  'framework_verwaltung': {
    'fw_name': 'string/text',
    'fw_type': 'lookup/select',
    'fw_version': 'string/text',
    'fw_description': 'string/textarea',
    'req_id': 'string/text',
    'req_title': 'string/text',
    'req_description': 'string/textarea',
    'req_domain': 'string/text',
    'req_mandatory': 'bool',
    'fw_active': 'bool',
  },
  'incident_management': {
    'incident_id': 'string/text',
    'incident_title': 'string/text',
    'incident_description': 'string/textarea',
    'incident_category': 'lookup/select',
    'incident_severity': 'lookup/radio',
    'incident_detected_at': 'date/datetimeminute',
    'incident_occurred_at': 'date/datetimeminute',
    'incident_reporter_firstname': 'string/text',
    'incident_reporter_lastname': 'string/text',
    'incident_reporter_email': 'string/email',
    'incident_affected_asset': 'applookup/select',
    'incident_affected_org': 'applookup/select',
    'incident_nis2_reportable': 'bool',
    'incident_dora_reportable': 'bool',
    'incident_status': 'lookup/select',
    'incident_evidence': 'file',
    'incident_notes': 'string/textarea',
  },
  'maßnahmen_management': {
    'measure_id': 'string/text',
    'measure_title': 'string/text',
    'measure_description': 'string/textarea',
    'measure_type': 'lookup/select',
    'measure_priority': 'lookup/radio',
    'measure_risk': 'applookup/select',
    'measure_responsible_firstname': 'string/text',
    'measure_responsible_lastname': 'string/text',
    'measure_responsible_email': 'string/email',
    'measure_due_date': 'date/date',
    'measure_completion_date': 'date/date',
    'measure_status': 'lookup/select',
    'measure_effectiveness': 'lookup/radio',
    'measure_evidence': 'file',
    'measure_notes': 'string/textarea',
  },
  'dokumente_&_evidenzen': {
    'doc_title': 'string/text',
    'doc_type': 'lookup/select',
    'doc_version': 'string/text',
    'doc_status': 'lookup/select',
    'doc_owner_firstname': 'string/text',
    'doc_owner_lastname': 'string/text',
    'doc_valid_from': 'date/date',
    'doc_valid_until': 'date/date',
    'doc_related_control': 'applookup/select',
    'doc_related_audit': 'applookup/select',
    'doc_file': 'file',
    'doc_description': 'string/textarea',
    'doc_tags': 'string/text',
  },
  'audit_management': {
    'audit_framework': 'applookup/select',
    'audit_scope': 'string/textarea',
    'audit_start_date': 'date/date',
    'audit_end_date': 'date/date',
    'audit_lead_firstname': 'string/text',
    'audit_lead_lastname': 'string/text',
    'audit_lead_email': 'string/email',
    'audit_org_unit': 'applookup/select',
    'audit_status': 'lookup/select',
    'audit_result': 'lookup/radio',
    'audit_report': 'file',
    'audit_notes': 'string/textarea',
    'audit_id': 'string/text',
    'audit_title': 'string/text',
    'audit_type': 'lookup/select',
  },
  'asset_register': {
    'asset_name': 'string/text',
    'asset_id_intern': 'string/text',
    'asset_category': 'lookup/select',
    'asset_type': 'string/text',
    'asset_owner_firstname': 'string/text',
    'asset_owner_lastname': 'string/text',
    'asset_owner_email': 'string/email',
    'asset_classification': 'lookup/select',
    'asset_confidentiality': 'lookup/radio',
    'asset_integrity': 'lookup/radio',
    'asset_availability': 'lookup/radio',
    'asset_location': 'string/text',
    'asset_org_unit': 'applookup/select',
    'asset_description': 'string/textarea',
    'asset_status': 'lookup/select',
    'asset_purchase_date': 'date/date',
    'asset_review_date': 'date/date',
  },
  'bcm_&_notfallmanagement': {
    'bcm_title': 'string/text',
    'bcm_type': 'lookup/select',
    'bcm_scope': 'string/textarea',
    'bcm_rto': 'string/text',
    'bcm_rpo': 'string/text',
    'bcm_responsible_firstname': 'string/text',
    'bcm_responsible_lastname': 'string/text',
    'bcm_related_asset': 'applookup/select',
    'bcm_last_test_date': 'date/date',
    'bcm_next_test_date': 'date/date',
    'bcm_status': 'lookup/select',
    'bcm_document': 'file',
    'bcm_notes': 'string/textarea',
  },
  'lieferantenmanagement': {
    'supplier_housenumber': 'string/text',
    'supplier_postal': 'string/text',
    'supplier_city': 'string/text',
    'supplier_country': 'string/text',
    'supplier_criticality': 'lookup/radio',
    'supplier_risk_score': 'number',
    'supplier_last_assessment': 'date/date',
    'supplier_next_assessment': 'date/date',
    'supplier_contract_exists': 'bool',
    'supplier_dpa_exists': 'bool',
    'supplier_iso_certified': 'bool',
    'supplier_status': 'lookup/select',
    'supplier_notes': 'string/textarea',
    'supplier_name': 'string/text',
    'supplier_id_intern': 'string/text',
    'supplier_category': 'lookup/select',
    'supplier_contact_firstname': 'string/text',
    'supplier_contact_lastname': 'string/text',
    'supplier_contact_email': 'string/email',
    'supplier_contact_tel': 'string/tel',
    'supplier_street': 'string/text',
  },
  'risiko_register': {
    'risk_id': 'string/text',
    'risk_title': 'string/text',
    'risk_description': 'string/textarea',
    'risk_category': 'multiplelookup/checkbox',
    'risk_asset': 'multipleapplookup/select',
    'risk_org_unit': 'multipleapplookup/select',
    'risk_probability': 'lookup/radio',
    'risk_impact': 'lookup/radio',
    'risk_score_brutto': 'number',
    'risk_treatment': 'lookup/select',
    'risk_probability_netto': 'lookup/radio',
    'risk_confidentiality': 'lookup/radio',
    'risk_integrity': 'lookup/radio',
    'risk_availability': 'lookup/radio',
    'risk_impact_netto': 'lookup/radio',
    'risk_owner_firstname': 'string/text',
    'risk_owner_lastname': 'string/text',
    'risk_review_date': 'date/date',
    'risk_status': 'lookup/select',
    'risk_notes': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateOrganisationseinheiten = StripLookup<Organisationseinheiten['fields']>;
export type CreateSoaManagement = StripLookup<SoaManagement['fields']>;
export type CreateKontrollManagement = StripLookup<KontrollManagement['fields']>;
export type CreateAufgabenFreigaben = StripLookup<AufgabenFreigaben['fields']>;
export type CreateAwarenessSchulungen = StripLookup<AwarenessSchulungen['fields']>;
export type CreatePolicyManagement = StripLookup<PolicyManagement['fields']>;
export type CreateFindingsAbweichungen = StripLookup<FindingsAbweichungen['fields']>;
export type CreateFrameworkVerwaltung = StripLookup<FrameworkVerwaltung['fields']>;
export type CreateIncidentManagement = StripLookup<IncidentManagement['fields']>;
export type CreateMassnahmenManagement = StripLookup<MassnahmenManagement['fields']>;
export type CreateDokumenteEvidenzen = StripLookup<DokumenteEvidenzen['fields']>;
export type CreateAuditManagement = StripLookup<AuditManagement['fields']>;
export type CreateAssetRegister = StripLookup<AssetRegister['fields']>;
export type CreateBcmNotfallmanagement = StripLookup<BcmNotfallmanagement['fields']>;
export type CreateLieferantenmanagement = StripLookup<Lieferantenmanagement['fields']>;
export type CreateRisikoRegister = StripLookup<RisikoRegister['fields']>;