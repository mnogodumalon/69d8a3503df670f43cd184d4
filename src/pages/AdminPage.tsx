import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Organisationseinheiten, SoaManagement, KontrollManagement, AufgabenFreigaben, AwarenessSchulungen, PolicyManagement, FindingsAbweichungen, FrameworkVerwaltung, IncidentManagement, MassnahmenManagement, DokumenteEvidenzen, AuditManagement, AssetRegister, BcmNotfallmanagement, Lieferantenmanagement, RisikoRegister } from '@/types/app';
import { LivingAppsService, extractRecordId, cleanFieldsForApi } from '@/services/livingAppsService';
import { OrganisationseinheitenDialog } from '@/components/dialogs/OrganisationseinheitenDialog';
import { OrganisationseinheitenViewDialog } from '@/components/dialogs/OrganisationseinheitenViewDialog';
import { SoaManagementDialog } from '@/components/dialogs/SoaManagementDialog';
import { SoaManagementViewDialog } from '@/components/dialogs/SoaManagementViewDialog';
import { KontrollManagementDialog } from '@/components/dialogs/KontrollManagementDialog';
import { KontrollManagementViewDialog } from '@/components/dialogs/KontrollManagementViewDialog';
import { AufgabenFreigabenDialog } from '@/components/dialogs/AufgabenFreigabenDialog';
import { AufgabenFreigabenViewDialog } from '@/components/dialogs/AufgabenFreigabenViewDialog';
import { AwarenessSchulungenDialog } from '@/components/dialogs/AwarenessSchulungenDialog';
import { AwarenessSchulungenViewDialog } from '@/components/dialogs/AwarenessSchulungenViewDialog';
import { PolicyManagementDialog } from '@/components/dialogs/PolicyManagementDialog';
import { PolicyManagementViewDialog } from '@/components/dialogs/PolicyManagementViewDialog';
import { FindingsAbweichungenDialog } from '@/components/dialogs/FindingsAbweichungenDialog';
import { FindingsAbweichungenViewDialog } from '@/components/dialogs/FindingsAbweichungenViewDialog';
import { FrameworkVerwaltungDialog } from '@/components/dialogs/FrameworkVerwaltungDialog';
import { FrameworkVerwaltungViewDialog } from '@/components/dialogs/FrameworkVerwaltungViewDialog';
import { IncidentManagementDialog } from '@/components/dialogs/IncidentManagementDialog';
import { IncidentManagementViewDialog } from '@/components/dialogs/IncidentManagementViewDialog';
import { MassnahmenManagementDialog } from '@/components/dialogs/MassnahmenManagementDialog';
import { MassnahmenManagementViewDialog } from '@/components/dialogs/MassnahmenManagementViewDialog';
import { DokumenteEvidenzenDialog } from '@/components/dialogs/DokumenteEvidenzenDialog';
import { DokumenteEvidenzenViewDialog } from '@/components/dialogs/DokumenteEvidenzenViewDialog';
import { AuditManagementDialog } from '@/components/dialogs/AuditManagementDialog';
import { AuditManagementViewDialog } from '@/components/dialogs/AuditManagementViewDialog';
import { AssetRegisterDialog } from '@/components/dialogs/AssetRegisterDialog';
import { AssetRegisterViewDialog } from '@/components/dialogs/AssetRegisterViewDialog';
import { BcmNotfallmanagementDialog } from '@/components/dialogs/BcmNotfallmanagementDialog';
import { BcmNotfallmanagementViewDialog } from '@/components/dialogs/BcmNotfallmanagementViewDialog';
import { LieferantenmanagementDialog } from '@/components/dialogs/LieferantenmanagementDialog';
import { LieferantenmanagementViewDialog } from '@/components/dialogs/LieferantenmanagementViewDialog';
import { RisikoRegisterDialog } from '@/components/dialogs/RisikoRegisterDialog';
import { RisikoRegisterViewDialog } from '@/components/dialogs/RisikoRegisterViewDialog';
import { BulkEditDialog } from '@/components/dialogs/BulkEditDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconPencil, IconTrash, IconPlus, IconFilter, IconX, IconArrowsUpDown, IconArrowUp, IconArrowDown, IconSearch, IconCopy, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

// Field metadata per entity for bulk edit and column filters
const ORGANISATIONSEINHEITEN_FIELDS = [
  { key: 'org_housenumber', label: 'Hausnummer', type: 'string/text' },
  { key: 'org_postal', label: 'Postleitzahl', type: 'string/text' },
  { key: 'org_city', label: 'Stadt', type: 'string/text' },
  { key: 'org_country', label: 'Land', type: 'string/text' },
  { key: 'org_responsible_firstname', label: 'Verantwortlicher Vorname', type: 'string/text' },
  { key: 'org_responsible_lastname', label: 'Verantwortlicher Nachname', type: 'string/text' },
  { key: 'org_responsible_email', label: 'E-Mail Verantwortlicher', type: 'string/email' },
  { key: 'org_description', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'org_active', label: 'Aktiv', type: 'bool' },
  { key: 'org_name', label: 'Name der Organisationseinheit', type: 'string/text' },
  { key: 'org_type', label: 'Typ', type: 'lookup/select', options: [{ key: 'abteilung', label: 'Abteilung' }, { key: 'bereich', label: 'Bereich' }, { key: 'standort', label: 'Standort' }, { key: 'tochtergesellschaft', label: 'Tochtergesellschaft' }, { key: 'konzerngesellschaft', label: 'Konzerngesellschaft' }] },
  { key: 'org_parent', label: 'Übergeordnete Einheit', type: 'string/text' },
  { key: 'org_street', label: 'Straße', type: 'string/text' },
];
const SOAMANAGEMENT_FIELDS = [
  { key: 'soa_control', label: 'Kontrolle (Control)', type: 'applookup/select', targetEntity: 'kontroll_management', targetAppId: 'KONTROLL_MANAGEMENT', displayField: 'ctrl_id' },
  { key: 'soa_applicable', label: 'Anwendbar', type: 'bool' },
  { key: 'soa_inclusion_reason', label: 'Einbeziehungsgrund', type: 'multiplelookup/checkbox', options: [{ key: 'vertraglich', label: 'Vertragliche Anforderung' }, { key: 'risiko', label: 'Ergebnis der Risikobeurteilung' }, { key: 'best_practice', label: 'Best Practice' }, { key: 'richtlinie', label: 'Unternehmensrichtlinie' }, { key: 'gesetzlich', label: 'Gesetzliche Anforderung' }] },
  { key: 'soa_exclusion_reason', label: 'Ausschlussgrund (falls nicht anwendbar)', type: 'string/textarea' },
  { key: 'soa_justification', label: 'Begründung / Rechtfertigung', type: 'string/textarea' },
  { key: 'soa_implementation_status', label: 'Umsetzungsstatus', type: 'lookup/select', options: [{ key: 'nicht_implementiert', label: 'Nicht implementiert' }, { key: 'in_planung', label: 'In Planung' }, { key: 'in_umsetzung', label: 'In Umsetzung' }, { key: 'teilweise_implementiert', label: 'Teilweise implementiert' }, { key: 'vollstaendig_implementiert', label: 'Vollständig implementiert' }] },
  { key: 'soa_responsible_firstname', label: 'Verantwortlicher Vorname', type: 'string/text' },
  { key: 'soa_responsible_lastname', label: 'Verantwortlicher Nachname', type: 'string/text' },
  { key: 'soa_review_date', label: 'Review-Datum', type: 'date/date' },
  { key: 'soa_notes', label: 'Anmerkungen', type: 'string/textarea' },
];
const KONTROLLMANAGEMENT_FIELDS = [
  { key: 'ctrl_id', label: 'Kontroll-ID', type: 'string/text' },
  { key: 'ctrl_title', label: 'Kontrolltitel', type: 'string/text' },
  { key: 'ctrl_description', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'ctrl_type', label: 'Kontrolltyp', type: 'lookup/select', options: [{ key: 'praeventiv', label: 'Präventiv' }, { key: 'detektiv', label: 'Detektiv' }, { key: 'korrektiv', label: 'Korrektiv' }, { key: 'direktiv', label: 'Direktiv' }] },
  { key: 'ctrl_domain', label: 'Kontrolldomäne', type: 'string/text' },
  { key: 'ctrl_framework', label: 'Primäres Framework', type: 'applookup/select', targetEntity: 'framework_verwaltung', targetAppId: 'FRAMEWORK_VERWALTUNG', displayField: 'fw_name' },
  { key: 'ctrl_owner_firstname', label: 'Kontrollverantwortlicher Vorname', type: 'string/text' },
  { key: 'ctrl_owner_lastname', label: 'Kontrollverantwortlicher Nachname', type: 'string/text' },
  { key: 'ctrl_implementation_status', label: 'Implementierungsstatus', type: 'lookup/select', options: [{ key: 'nicht_implementiert', label: 'Nicht implementiert' }, { key: 'in_umsetzung', label: 'In Umsetzung' }, { key: 'teilweise_implementiert', label: 'Teilweise implementiert' }, { key: 'vollstaendig_implementiert', label: 'Vollständig implementiert' }] },
  { key: 'ctrl_review_date', label: 'Nächstes Review-Datum', type: 'date/date' },
  { key: 'ctrl_measure', label: 'Zugehörige Maßnahme', type: 'applookup/select', targetEntity: 'maßnahmen_management', targetAppId: 'MASSNAHMEN_MANAGEMENT', displayField: 'measure_id' },
  { key: 'ctrl_notes', label: 'Anmerkungen', type: 'string/textarea' },
];
const AUFGABENFREIGABEN_FIELDS = [
  { key: 'task_title', label: 'Aufgabentitel', type: 'string/text' },
  { key: 'task_type', label: 'Aufgabentyp', type: 'lookup/select', options: [{ key: 'aufgabe', label: 'Aufgabe' }, { key: 'freigabe', label: 'Freigabeanfrage' }, { key: 'review', label: 'Review' }, { key: 'eskalation', label: 'Eskalation' }, { key: 'erinnerung', label: 'Erinnerung' }] },
  { key: 'task_description', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'task_priority', label: 'Priorität', type: 'lookup/radio', options: [{ key: 'kritisch', label: 'Kritisch' }, { key: 'hoch', label: 'Hoch' }, { key: 'mittel', label: 'Mittel' }, { key: 'niedrig', label: 'Niedrig' }] },
  { key: 'task_assignee_firstname', label: 'Zugewiesen an (Vorname)', type: 'string/text' },
  { key: 'task_assignee_lastname', label: 'Zugewiesen an (Nachname)', type: 'string/text' },
  { key: 'task_assignee_email', label: 'Zugewiesen an (E-Mail)', type: 'string/email' },
  { key: 'task_requester_firstname', label: 'Anforderer Vorname', type: 'string/text' },
  { key: 'task_requester_lastname', label: 'Anforderer Nachname', type: 'string/text' },
  { key: 'task_due_date', label: 'Fälligkeitsdatum', type: 'date/date' },
  { key: 'task_related_risk', label: 'Zugehöriges Risiko', type: 'applookup/select', targetEntity: 'risiko_register', targetAppId: 'RISIKO_REGISTER', displayField: 'risk_id' },
  { key: 'task_related_measure', label: 'Zugehörige Maßnahme', type: 'applookup/select', targetEntity: 'maßnahmen_management', targetAppId: 'MASSNAHMEN_MANAGEMENT', displayField: 'measure_id' },
  { key: 'task_related_audit', label: 'Zugehöriges Audit', type: 'applookup/select', targetEntity: 'audit_management', targetAppId: 'AUDIT_MANAGEMENT', displayField: 'audit_id' },
  { key: 'task_status', label: 'Status', type: 'lookup/select', options: [{ key: 'offen', label: 'Offen' }, { key: 'in_bearbeitung', label: 'In Bearbeitung' }, { key: 'warte_freigabe', label: 'Warte auf Freigabe' }, { key: 'freigegeben', label: 'Freigegeben' }, { key: 'abgelehnt', label: 'Abgelehnt' }, { key: 'erledigt', label: 'Erledigt' }, { key: 'abgebrochen', label: 'Abgebrochen' }] },
  { key: 'task_approval_comment', label: 'Freigabe-/Ablehnungskommentar', type: 'string/textarea' },
  { key: 'task_attachment', label: 'Anhang', type: 'file' },
];
const AWARENESSSCHULUNGEN_FIELDS = [
  { key: 'training_title', label: 'Titel der Schulung', type: 'string/text' },
  { key: 'training_type', label: 'Schulungstyp', type: 'lookup/select', options: [{ key: 'pflicht', label: 'Pflichtschulung' }, { key: 'awareness', label: 'Awareness-Kampagne' }, { key: 'technisch', label: 'Technische Schulung' }, { key: 'fuehrung', label: 'Führungskräfteschulung' }, { key: 'onboarding', label: 'Onboarding' }, { key: 'phishing', label: 'Phishing-Simulation' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'training_target_group', label: 'Zielgruppe', type: 'multiplelookup/checkbox', options: [{ key: 'alle', label: 'Alle Mitarbeiter' }, { key: 'it', label: 'IT-Personal' }, { key: 'fuehrung', label: 'Führungskräfte' }, { key: 'neu', label: 'Neue Mitarbeiter' }, { key: 'admin', label: 'Administratoren' }, { key: 'fach', label: 'Fachverantwortliche' }] },
  { key: 'training_start_date', label: 'Startdatum', type: 'date/date' },
  { key: 'training_end_date', label: 'Enddatum', type: 'date/date' },
  { key: 'training_responsible_firstname', label: 'Verantwortlicher Vorname', type: 'string/text' },
  { key: 'training_responsible_lastname', label: 'Verantwortlicher Nachname', type: 'string/text' },
  { key: 'training_participants_count', label: 'Anzahl Teilnehmer (geplant)', type: 'number' },
  { key: 'training_completion_rate', label: 'Abschlussquote (%)', type: 'number' },
  { key: 'training_status', label: 'Status', type: 'lookup/select', options: [{ key: 'geplant', label: 'Geplant' }, { key: 'aktiv', label: 'Aktiv' }, { key: 'abgeschlossen', label: 'Abgeschlossen' }, { key: 'abgebrochen', label: 'Abgebrochen' }] },
  { key: 'training_framework', label: 'Zugehöriges Framework', type: 'applookup/select', targetEntity: 'framework_verwaltung', targetAppId: 'FRAMEWORK_VERWALTUNG', displayField: 'fw_name' },
  { key: 'training_material', label: 'Schulungsmaterial (Upload)', type: 'file' },
  { key: 'training_notes', label: 'Anmerkungen', type: 'string/textarea' },
];
const POLICYMANAGEMENT_FIELDS = [
  { key: 'policy_id', label: 'Richtlinien-ID', type: 'string/text' },
  { key: 'policy_title', label: 'Titel der Richtlinie', type: 'string/text' },
  { key: 'policy_category', label: 'Kategorie', type: 'lookup/select', options: [{ key: 'infosec', label: 'Informationssicherheit' }, { key: 'datenschutz', label: 'Datenschutz' }, { key: 'it_betrieb', label: 'IT-Betrieb' }, { key: 'zugang', label: 'Zugangskontrolle' }, { key: 'incident', label: 'Incident Response' }, { key: 'bcm', label: 'Business Continuity' }, { key: 'personal', label: 'Personalrichtlinie' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'policy_version', label: 'Version', type: 'string/text' },
  { key: 'policy_status', label: 'Status', type: 'lookup/select', options: [{ key: 'entwurf', label: 'Entwurf' }, { key: 'in_review', label: 'In Review' }, { key: 'freigegeben', label: 'Freigegeben' }, { key: 'zurueckgezogen', label: 'Zurückgezogen' }, { key: 'archiviert', label: 'Archiviert' }] },
  { key: 'policy_owner_firstname', label: 'Richtlinienverantwortlicher Vorname', type: 'string/text' },
  { key: 'policy_owner_lastname', label: 'Richtlinienverantwortlicher Nachname', type: 'string/text' },
  { key: 'policy_approver_firstname', label: 'Freigeber Vorname', type: 'string/text' },
  { key: 'policy_approver_lastname', label: 'Freigeber Nachname', type: 'string/text' },
  { key: 'policy_valid_from', label: 'Gültig ab', type: 'date/date' },
  { key: 'policy_valid_until', label: 'Gültig bis', type: 'date/date' },
  { key: 'policy_review_date', label: 'Nächstes Review-Datum', type: 'date/date' },
  { key: 'policy_scope', label: 'Geltungsbereich', type: 'string/textarea' },
  { key: 'policy_document', label: 'Richtliniendokument (Upload)', type: 'file' },
  { key: 'policy_framework', label: 'Zugehöriges Framework', type: 'applookup/select', targetEntity: 'framework_verwaltung', targetAppId: 'FRAMEWORK_VERWALTUNG', displayField: 'fw_name' },
  { key: 'policy_notes', label: 'Anmerkungen', type: 'string/textarea' },
];
const FINDINGSABWEICHUNGEN_FIELDS = [
  { key: 'finding_id', label: 'Finding-ID', type: 'string/text' },
  { key: 'finding_title', label: 'Bezeichnung', type: 'string/text' },
  { key: 'finding_description', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'finding_type', label: 'Finding-Typ', type: 'lookup/select', options: [{ key: 'nc_major', label: 'Nichtkonformität (Major)' }, { key: 'nc_minor', label: 'Nichtkonformität (Minor)' }, { key: 'beobachtung', label: 'Beobachtung' }, { key: 'verbesserung', label: 'Verbesserungspotenzial' }, { key: 'positiv', label: 'Positiver Befund' }] },
  { key: 'finding_audit', label: 'Zugehöriges Audit', type: 'applookup/select', targetEntity: 'audit_management', targetAppId: 'AUDIT_MANAGEMENT', displayField: 'audit_id' },
  { key: 'finding_control', label: 'Betroffene Kontrolle', type: 'applookup/select', targetEntity: 'kontroll_management', targetAppId: 'KONTROLL_MANAGEMENT', displayField: 'ctrl_id' },
  { key: 'finding_severity', label: 'Schweregrad', type: 'lookup/radio', options: [{ key: 'kritisch', label: 'Kritisch' }, { key: 'hoch', label: 'Hoch' }, { key: 'mittel', label: 'Mittel' }, { key: 'niedrig', label: 'Niedrig' }, { key: 'informativ', label: 'Informativ' }] },
  { key: 'finding_responsible_lastname', label: 'Verantwortlicher Nachname', type: 'string/text' },
  { key: 'finding_due_date', label: 'Behebungsfrist', type: 'date/date' },
  { key: 'finding_status', label: 'Status', type: 'lookup/select', options: [{ key: 'offen', label: 'Offen' }, { key: 'in_bearbeitung', label: 'In Bearbeitung' }, { key: 'behoben', label: 'Behoben' }, { key: 'akzeptiert', label: 'Akzeptiert' }, { key: 'geschlossen', label: 'Geschlossen' }] },
  { key: 'finding_measure', label: 'Zugehörige Maßnahme', type: 'applookup/select', targetEntity: 'maßnahmen_management', targetAppId: 'MASSNAHMEN_MANAGEMENT', displayField: 'measure_id' },
  { key: 'finding_evidence', label: 'Nachweis / Evidenz', type: 'file' },
  { key: 'finding_notes', label: 'Anmerkungen', type: 'string/textarea' },
  { key: 'finding_responsible_firstname', label: 'Verantwortlicher Vorname', type: 'string/text' },
];
const FRAMEWORKVERWALTUNG_FIELDS = [
  { key: 'fw_name', label: 'Framework-Name', type: 'string/text' },
  { key: 'fw_type', label: 'Framework-Typ', type: 'lookup/select', options: [{ key: 'iso27001', label: 'ISO/IEC 27001' }, { key: 'nis2', label: 'NIS2' }, { key: 'dora', label: 'DORA' }, { key: 'bsi', label: 'BSI IT-Grundschutz' }, { key: 'soc2', label: 'SOC 2' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'fw_version', label: 'Version / Jahr', type: 'string/text' },
  { key: 'fw_description', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'req_id', label: 'Anforderungs-ID', type: 'string/text' },
  { key: 'req_title', label: 'Anforderungstitel', type: 'string/text' },
  { key: 'req_description', label: 'Anforderungstext', type: 'string/textarea' },
  { key: 'req_domain', label: 'Domäne / Kapitel', type: 'string/text' },
  { key: 'req_mandatory', label: 'Verpflichtend', type: 'bool' },
  { key: 'fw_active', label: 'Framework aktiv', type: 'bool' },
];
const INCIDENTMANAGEMENT_FIELDS = [
  { key: 'incident_id', label: 'Vorfalls-ID', type: 'string/text' },
  { key: 'incident_title', label: 'Vorfallsbezeichnung', type: 'string/text' },
  { key: 'incident_description', label: 'Vorfallsbeschreibung', type: 'string/textarea' },
  { key: 'incident_category', label: 'Vorfallskategorie', type: 'lookup/select', options: [{ key: 'malware', label: 'Malware / Ransomware' }, { key: 'phishing', label: 'Phishing / Social Engineering' }, { key: 'datenpanne', label: 'Datenpanne / Datenleck' }, { key: 'unbefugter_zugriff', label: 'Unbefugter Zugriff' }, { key: 'dos', label: 'Denial of Service' }, { key: 'physisch', label: 'Physischer Einbruch' }, { key: 'systemausfall', label: 'Systemausfall' }, { key: 'insider', label: 'Insider-Bedrohung' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'incident_severity', label: 'Schweregrad', type: 'lookup/radio', options: [{ key: 'kritisch', label: 'Kritisch' }, { key: 'hoch', label: 'Hoch' }, { key: 'mittel', label: 'Mittel' }, { key: 'niedrig', label: 'Niedrig' }] },
  { key: 'incident_detected_at', label: 'Erkennungszeitpunkt', type: 'date/datetimeminute' },
  { key: 'incident_occurred_at', label: 'Eintrittszeitpunkt (geschätzt)', type: 'date/datetimeminute' },
  { key: 'incident_reporter_firstname', label: 'Melder Vorname', type: 'string/text' },
  { key: 'incident_reporter_lastname', label: 'Melder Nachname', type: 'string/text' },
  { key: 'incident_reporter_email', label: 'Melder E-Mail', type: 'string/email' },
  { key: 'incident_affected_asset', label: 'Betroffenes Asset', type: 'applookup/select', targetEntity: 'asset_register', targetAppId: 'ASSET_REGISTER', displayField: 'asset_name' },
  { key: 'incident_affected_org', label: 'Betroffene Organisationseinheit', type: 'applookup/select', targetEntity: 'organisationseinheiten', targetAppId: 'ORGANISATIONSEINHEITEN', displayField: 'org_housenumber' },
  { key: 'incident_nis2_reportable', label: 'NIS2-meldepflichtig', type: 'bool' },
  { key: 'incident_dora_reportable', label: 'DORA-meldepflichtig', type: 'bool' },
  { key: 'incident_status', label: 'Status', type: 'lookup/select', options: [{ key: 'neu', label: 'Neu gemeldet' }, { key: 'in_bearbeitung', label: 'In Bearbeitung' }, { key: 'eskaliert', label: 'Eskaliert' }, { key: 'behoben', label: 'Behoben' }, { key: 'geschlossen', label: 'Geschlossen' }] },
  { key: 'incident_evidence', label: 'Screenshot / Nachweis', type: 'file' },
  { key: 'incident_notes', label: 'Weitere Informationen', type: 'string/textarea' },
];
const MASSNAHMENMANAGEMENT_FIELDS = [
  { key: 'measure_id', label: 'Maßnahmen-ID', type: 'string/text' },
  { key: 'measure_title', label: 'Maßnahmentitel', type: 'string/text' },
  { key: 'measure_description', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'measure_type', label: 'Maßnahmentyp', type: 'lookup/select', options: [{ key: 'technisch', label: 'Technisch' }, { key: 'organisatorisch', label: 'Organisatorisch' }, { key: 'personell', label: 'Personell' }, { key: 'physisch', label: 'Physisch' }, { key: 'rechtlich', label: 'Rechtlich / Vertraglich' }] },
  { key: 'measure_priority', label: 'Priorität', type: 'lookup/radio', options: [{ key: 'kritisch', label: 'Kritisch' }, { key: 'hoch', label: 'Hoch' }, { key: 'mittel', label: 'Mittel' }, { key: 'niedrig', label: 'Niedrig' }] },
  { key: 'measure_risk', label: 'Zugehöriges Risiko', type: 'applookup/select', targetEntity: 'risiko_register', targetAppId: 'RISIKO_REGISTER', displayField: 'risk_id' },
  { key: 'measure_responsible_firstname', label: 'Verantwortlicher Vorname', type: 'string/text' },
  { key: 'measure_responsible_lastname', label: 'Verantwortlicher Nachname', type: 'string/text' },
  { key: 'measure_responsible_email', label: 'Verantwortlicher E-Mail', type: 'string/email' },
  { key: 'measure_due_date', label: 'Fälligkeitsdatum', type: 'date/date' },
  { key: 'measure_completion_date', label: 'Umsetzungsdatum (tatsächlich)', type: 'date/date' },
  { key: 'measure_status', label: 'Umsetzungsstatus', type: 'lookup/select', options: [{ key: 'geplant', label: 'Geplant' }, { key: 'in_umsetzung', label: 'In Umsetzung' }, { key: 'umgesetzt', label: 'Umgesetzt' }, { key: 'nicht_umgesetzt', label: 'Nicht umgesetzt' }, { key: 'entfaellt', label: 'Entfällt' }] },
  { key: 'measure_effectiveness', label: 'Wirksamkeit', type: 'lookup/radio', options: [{ key: 'nicht_bewertet', label: 'Nicht bewertet' }, { key: 'wirksam', label: 'Wirksam' }, { key: 'teilweise_wirksam', label: 'Teilweise wirksam' }, { key: 'nicht_wirksam', label: 'Nicht wirksam' }] },
  { key: 'measure_evidence', label: 'Nachweis / Evidenz', type: 'file' },
  { key: 'measure_notes', label: 'Anmerkungen', type: 'string/textarea' },
];
const DOKUMENTEEVIDENZEN_FIELDS = [
  { key: 'doc_title', label: 'Dokumententitel', type: 'string/text' },
  { key: 'doc_type', label: 'Dokumententyp', type: 'lookup/select', options: [{ key: 'verfahren', label: 'Verfahrensanweisung' }, { key: 'evidenz', label: 'Nachweis / Evidenz' }, { key: 'auditbericht', label: 'Auditbericht' }, { key: 'risikoanalyse', label: 'Risikoanalyse' }, { key: 'vertrag', label: 'Vertrag' }, { key: 'zertifikat', label: 'Zertifikat' }, { key: 'protokoll', label: 'Protokoll' }, { key: 'sonstiges', label: 'Sonstiges' }, { key: 'richtlinie', label: 'Richtlinie' }] },
  { key: 'doc_version', label: 'Version', type: 'string/text' },
  { key: 'doc_status', label: 'Status', type: 'lookup/select', options: [{ key: 'entwurf', label: 'Entwurf' }, { key: 'in_review', label: 'In Review' }, { key: 'freigegeben', label: 'Freigegeben' }, { key: 'archiviert', label: 'Archiviert' }] },
  { key: 'doc_owner_firstname', label: 'Dokumentenverantwortlicher Vorname', type: 'string/text' },
  { key: 'doc_owner_lastname', label: 'Dokumentenverantwortlicher Nachname', type: 'string/text' },
  { key: 'doc_valid_from', label: 'Gültig ab', type: 'date/date' },
  { key: 'doc_valid_until', label: 'Gültig bis', type: 'date/date' },
  { key: 'doc_related_control', label: 'Zugehörige Kontrolle', type: 'applookup/select', targetEntity: 'kontroll_management', targetAppId: 'KONTROLL_MANAGEMENT', displayField: 'ctrl_id' },
  { key: 'doc_related_audit', label: 'Zugehöriges Audit', type: 'applookup/select', targetEntity: 'audit_management', targetAppId: 'AUDIT_MANAGEMENT', displayField: 'audit_id' },
  { key: 'doc_file', label: 'Datei (Upload)', type: 'file' },
  { key: 'doc_description', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'doc_tags', label: 'Schlagwörter / Tags', type: 'string/text' },
];
const AUDITMANAGEMENT_FIELDS = [
  { key: 'audit_framework', label: 'Auditiertes Framework', type: 'applookup/select', targetEntity: 'framework_verwaltung', targetAppId: 'FRAMEWORK_VERWALTUNG', displayField: 'fw_name' },
  { key: 'audit_scope', label: 'Auditumfang / Scope', type: 'string/textarea' },
  { key: 'audit_start_date', label: 'Auditbeginn', type: 'date/date' },
  { key: 'audit_end_date', label: 'Auditende', type: 'date/date' },
  { key: 'audit_lead_firstname', label: 'Leitender Auditor Vorname', type: 'string/text' },
  { key: 'audit_lead_lastname', label: 'Leitender Auditor Nachname', type: 'string/text' },
  { key: 'audit_lead_email', label: 'Leitender Auditor E-Mail', type: 'string/email' },
  { key: 'audit_org_unit', label: 'Auditierte Organisationseinheit', type: 'applookup/select', targetEntity: 'organisationseinheiten', targetAppId: 'ORGANISATIONSEINHEITEN', displayField: 'org_housenumber' },
  { key: 'audit_status', label: 'Auditstatus', type: 'lookup/select', options: [{ key: 'geplant', label: 'Geplant' }, { key: 'in_durchfuehrung', label: 'In Durchführung' }, { key: 'abgeschlossen', label: 'Abgeschlossen' }, { key: 'abgebrochen', label: 'Abgebrochen' }] },
  { key: 'audit_result', label: 'Auditergebnis', type: 'lookup/radio', options: [{ key: 'bestanden', label: 'Bestanden' }, { key: 'bestanden_auflagen', label: 'Bestanden mit Auflagen' }, { key: 'nicht_bestanden', label: 'Nicht bestanden' }, { key: 'ausstehend', label: 'Ausstehend' }] },
  { key: 'audit_report', label: 'Auditbericht (Upload)', type: 'file' },
  { key: 'audit_notes', label: 'Anmerkungen', type: 'string/textarea' },
  { key: 'audit_id', label: 'Audit-ID', type: 'string/text' },
  { key: 'audit_title', label: 'Audittitel', type: 'string/text' },
  { key: 'audit_type', label: 'Audittyp', type: 'lookup/select', options: [{ key: 'intern', label: 'Internes Audit' }, { key: 'extern', label: 'Externes Audit' }, { key: 'zertifizierung', label: 'Zertifizierungsaudit' }, { key: 'ueberwachung', label: 'Überwachungsaudit' }, { key: 'lieferant', label: 'Lieferantenaudit' }, { key: 'behoerde', label: 'Behördenaudit' }] },
];
const ASSETREGISTER_FIELDS = [
  { key: 'asset_name', label: 'Asset-Bezeichnung', type: 'string/text' },
  { key: 'asset_id_intern', label: 'Interne Asset-ID', type: 'string/text' },
  { key: 'asset_category', label: 'Asset-Kategorie', type: 'lookup/select', options: [{ key: 'hardware', label: 'Hardware' }, { key: 'software', label: 'Software' }, { key: 'daten', label: 'Daten / Information' }, { key: 'dienst', label: 'Dienst / Service' }, { key: 'prozess', label: 'Prozess' }, { key: 'person', label: 'Person / Rolle' }, { key: 'gebaeude', label: 'Gebäude / Infrastruktur' }, { key: 'lieferant', label: 'Lieferant / Drittpartei' }] },
  { key: 'asset_type', label: 'Asset-Typ', type: 'string/text' },
  { key: 'asset_owner_firstname', label: 'Asset-Owner Vorname', type: 'string/text' },
  { key: 'asset_owner_lastname', label: 'Asset-Owner Nachname', type: 'string/text' },
  { key: 'asset_owner_email', label: 'Asset-Owner E-Mail', type: 'string/email' },
  { key: 'asset_classification', label: 'Schutzbedarfsklasse', type: 'lookup/select', options: [{ key: 'normal', label: 'Normal' }, { key: 'hoch', label: 'Hoch' }, { key: 'sehr_hoch', label: 'Sehr hoch' }] },
  { key: 'asset_confidentiality', label: 'Vertraulichkeit', type: 'lookup/radio', options: [{ key: 'oeffentlich', label: 'Öffentlich' }, { key: 'intern', label: 'Intern' }, { key: 'vertraulich', label: 'Vertraulich' }, { key: 'streng_vertraulich', label: 'Streng vertraulich' }] },
  { key: 'asset_integrity', label: 'Integrität', type: 'lookup/radio', options: [{ key: 'normal', label: 'Normal' }, { key: 'hoch', label: 'Hoch' }, { key: 'sehr_hoch', label: 'Sehr hoch' }] },
  { key: 'asset_availability', label: 'Verfügbarkeit', type: 'lookup/radio', options: [{ key: 'normal', label: 'Normal' }, { key: 'hoch', label: 'Hoch' }, { key: 'sehr_hoch', label: 'Sehr hoch' }] },
  { key: 'asset_location', label: 'Standort / Betriebsort', type: 'string/text' },
  { key: 'asset_org_unit', label: 'Organisationseinheit', type: 'applookup/select', targetEntity: 'organisationseinheiten', targetAppId: 'ORGANISATIONSEINHEITEN', displayField: 'org_housenumber' },
  { key: 'asset_description', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'asset_status', label: 'Status', type: 'lookup/select', options: [{ key: 'in_betrieb', label: 'In Betrieb' }, { key: 'in_planung', label: 'In Planung' }, { key: 'ausser_betrieb', label: 'Außer Betrieb' }, { key: 'archiviert', label: 'Archiviert' }] },
  { key: 'asset_purchase_date', label: 'Anschaffungsdatum', type: 'date/date' },
  { key: 'asset_review_date', label: 'Nächstes Review-Datum', type: 'date/date' },
];
const BCMNOTFALLMANAGEMENT_FIELDS = [
  { key: 'bcm_title', label: 'Bezeichnung', type: 'string/text' },
  { key: 'bcm_type', label: 'Typ', type: 'lookup/select', options: [{ key: 'bcp', label: 'Business Continuity Plan (BCP)' }, { key: 'drp', label: 'Disaster Recovery Plan (DRP)' }, { key: 'bia', label: 'Business Impact Analyse (BIA)' }, { key: 'uebung', label: 'Notfallübung' }, { key: 'prozess', label: 'Kritischer Prozess' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'bcm_scope', label: 'Geltungsbereich', type: 'string/textarea' },
  { key: 'bcm_rto', label: 'Recovery Time Objective (RTO)', type: 'string/text' },
  { key: 'bcm_rpo', label: 'Recovery Point Objective (RPO)', type: 'string/text' },
  { key: 'bcm_responsible_firstname', label: 'Verantwortlicher Vorname', type: 'string/text' },
  { key: 'bcm_responsible_lastname', label: 'Verantwortlicher Nachname', type: 'string/text' },
  { key: 'bcm_related_asset', label: 'Kritisches Asset', type: 'applookup/select', targetEntity: 'asset_register', targetAppId: 'ASSET_REGISTER', displayField: 'asset_name' },
  { key: 'bcm_last_test_date', label: 'Letzter Test / Übung', type: 'date/date' },
  { key: 'bcm_next_test_date', label: 'Nächster Test / Übung', type: 'date/date' },
  { key: 'bcm_status', label: 'Status', type: 'lookup/select', options: [{ key: 'entwurf', label: 'Entwurf' }, { key: 'freigegeben', label: 'Freigegeben' }, { key: 'in_ueberarbeitung', label: 'In Überarbeitung' }, { key: 'archiviert', label: 'Archiviert' }] },
  { key: 'bcm_document', label: 'Plan-Dokument (Upload)', type: 'file' },
  { key: 'bcm_notes', label: 'Anmerkungen', type: 'string/textarea' },
];
const LIEFERANTENMANAGEMENT_FIELDS = [
  { key: 'supplier_housenumber', label: 'Hausnummer', type: 'string/text' },
  { key: 'supplier_postal', label: 'Postleitzahl', type: 'string/text' },
  { key: 'supplier_city', label: 'Stadt', type: 'string/text' },
  { key: 'supplier_country', label: 'Land', type: 'string/text' },
  { key: 'supplier_criticality', label: 'Kritikalität', type: 'lookup/radio', options: [{ key: 'kritisch', label: 'Kritisch' }, { key: 'hoch', label: 'Hoch' }, { key: 'mittel', label: 'Mittel' }, { key: 'niedrig', label: 'Niedrig' }] },
  { key: 'supplier_risk_score', label: 'Risikoscore (0-100)', type: 'number' },
  { key: 'supplier_last_assessment', label: 'Letzte Risikobewertung', type: 'date/date' },
  { key: 'supplier_next_assessment', label: 'Nächste Risikobewertung', type: 'date/date' },
  { key: 'supplier_contract_exists', label: 'Vertrag vorhanden', type: 'bool' },
  { key: 'supplier_dpa_exists', label: 'Auftragsverarbeitungsvertrag (AVV) vorhanden', type: 'bool' },
  { key: 'supplier_iso_certified', label: 'ISO 27001 zertifiziert', type: 'bool' },
  { key: 'supplier_status', label: 'Status', type: 'lookup/select', options: [{ key: 'aktiv', label: 'Aktiv' }, { key: 'in_pruefung', label: 'In Prüfung' }, { key: 'gesperrt', label: 'Gesperrt' }, { key: 'inaktiv', label: 'Inaktiv' }] },
  { key: 'supplier_notes', label: 'Anmerkungen', type: 'string/textarea' },
  { key: 'supplier_name', label: 'Unternehmensname', type: 'string/text' },
  { key: 'supplier_id_intern', label: 'Interne Lieferanten-ID', type: 'string/text' },
  { key: 'supplier_category', label: 'Lieferantenkategorie', type: 'lookup/select', options: [{ key: 'it', label: 'IT-Dienstleister' }, { key: 'cloud', label: 'Cloud-Anbieter' }, { key: 'software', label: 'Softwareanbieter' }, { key: 'hardware', label: 'Hardwarelieferant' }, { key: 'beratung', label: 'Beratung' }, { key: 'telko', label: 'Telekommunikation' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'supplier_contact_firstname', label: 'Ansprechpartner Vorname', type: 'string/text' },
  { key: 'supplier_contact_lastname', label: 'Ansprechpartner Nachname', type: 'string/text' },
  { key: 'supplier_contact_email', label: 'Ansprechpartner E-Mail', type: 'string/email' },
  { key: 'supplier_contact_tel', label: 'Ansprechpartner Telefon', type: 'string/tel' },
  { key: 'supplier_street', label: 'Straße', type: 'string/text' },
];
const RISIKOREGISTER_FIELDS = [
  { key: 'risk_id', label: 'Risiko-ID', type: 'string/text' },
  { key: 'risk_title', label: 'Risikobezeichnung', type: 'string/text' },
  { key: 'risk_description', label: 'Risikobeschreibung', type: 'string/textarea' },
  { key: 'risk_category', label: 'Risikokategorie', type: 'multiplelookup/checkbox', options: [{ key: 'infosec', label: 'Informationssicherheit' }, { key: 'datenschutz', label: 'Datenschutz' }, { key: 'betrieb', label: 'Betriebsrisiko' }, { key: 'compliance', label: 'Compliance' }, { key: 'drittpartei', label: 'Drittpartei / Lieferant' }, { key: 'physisch', label: 'Physische Sicherheit' }, { key: 'personal', label: 'Personalrisiko' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'risk_asset', label: 'Betroffene Assets', type: 'multipleapplookup/select', targetEntity: 'asset_register', targetAppId: 'ASSET_REGISTER', displayField: 'asset_name' },
  { key: 'risk_org_unit', label: 'Betroffene Organisationseinheiten', type: 'multipleapplookup/select', targetEntity: 'organisationseinheiten', targetAppId: 'ORGANISATIONSEINHEITEN', displayField: 'org_housenumber' },
  { key: 'risk_probability', label: 'Eintrittswahrscheinlichkeit', type: 'lookup/radio', options: [{ key: 'p1', label: '1 – Sehr gering' }, { key: 'p2', label: '2 – Gering' }, { key: 'p3', label: '3 – Mittel' }, { key: 'p4', label: '4 – Hoch' }, { key: 'p5', label: '5 – Sehr hoch' }] },
  { key: 'risk_impact', label: 'Schadensausmaß', type: 'lookup/radio', options: [{ key: 'i1', label: '1 – Sehr gering' }, { key: 'i2', label: '2 – Gering' }, { key: 'i3', label: '3 – Mittel' }, { key: 'i4', label: '4 – Hoch' }, { key: 'i5', label: '5 – Sehr hoch' }] },
  { key: 'risk_score_brutto', label: 'Risikoscore Brutto (berechnet)', type: 'number' },
  { key: 'risk_treatment', label: 'Risikobehandlung', type: 'lookup/select', options: [{ key: 'reduzieren', label: 'Reduzieren' }, { key: 'akzeptieren', label: 'Akzeptieren' }, { key: 'vermeiden', label: 'Vermeiden' }, { key: 'uebertragen', label: 'Übertragen' }] },
  { key: 'risk_probability_netto', label: 'Eintrittswahrscheinlichkeit (Netto)', type: 'lookup/radio', options: [{ key: 'p1', label: '1 – Sehr gering' }, { key: 'p2', label: '2 – Gering' }, { key: 'p3', label: '3 – Mittel' }, { key: 'p4', label: '4 – Hoch' }, { key: 'p5', label: '5 – Sehr hoch' }] },
  { key: 'risk_confidentiality', label: 'Vertraulichkeit', type: 'lookup/radio', options: [{ key: 'intern', label: 'Intern' }, { key: 'vertraulich', label: 'Vertraulich' }, { key: 'oeffentlich', label: 'Öffentlich' }, { key: 'streng_vertraulich', label: 'Streng vertraulich' }] },
  { key: 'risk_integrity', label: 'Integrität', type: 'lookup/radio', options: [{ key: 'normal', label: 'Normal' }, { key: 'hoch', label: 'Hoch' }, { key: 'sehr_hoch', label: 'Sehr hoch' }] },
  { key: 'risk_availability', label: 'Verfügbarkeit', type: 'lookup/radio', options: [{ key: 'normal', label: 'Normal' }, { key: 'hoch', label: 'Hoch' }, { key: 'sehr_hoch', label: 'Sehr hoch' }] },
  { key: 'risk_impact_netto', label: 'Schadensausmaß (Netto)', type: 'lookup/radio', options: [{ key: 'i1', label: '1 – Sehr gering' }, { key: 'i2', label: '2 – Gering' }, { key: 'i3', label: '3 – Mittel' }, { key: 'i4', label: '4 – Hoch' }, { key: 'i5', label: '5 – Sehr hoch' }] },
  { key: 'risk_owner_firstname', label: 'Risikoverantwortlicher Vorname', type: 'string/text' },
  { key: 'risk_owner_lastname', label: 'Risikoverantwortlicher Nachname', type: 'string/text' },
  { key: 'risk_review_date', label: 'Nächstes Review-Datum', type: 'date/date' },
  { key: 'risk_status', label: 'Status', type: 'lookup/select', options: [{ key: 'offen', label: 'Offen' }, { key: 'in_behandlung', label: 'In Behandlung' }, { key: 'akzeptiert', label: 'Akzeptiert' }, { key: 'geschlossen', label: 'Geschlossen' }] },
  { key: 'risk_notes', label: 'Anmerkungen', type: 'string/textarea' },
];

const ENTITY_TABS = [
  { key: 'organisationseinheiten', label: 'Organisationseinheiten', pascal: 'Organisationseinheiten' },
  { key: 'soa_management', label: 'SoA-Management', pascal: 'SoaManagement' },
  { key: 'kontroll_management', label: 'Kontroll-Management', pascal: 'KontrollManagement' },
  { key: 'aufgaben_&_freigaben', label: 'Aufgaben & Freigaben', pascal: 'AufgabenFreigaben' },
  { key: 'awareness_&_schulungen', label: 'Awareness & Schulungen', pascal: 'AwarenessSchulungen' },
  { key: 'policy_management', label: 'Policy-Management', pascal: 'PolicyManagement' },
  { key: 'findings_&_abweichungen', label: 'Findings & Abweichungen', pascal: 'FindingsAbweichungen' },
  { key: 'framework_verwaltung', label: 'Framework-Verwaltung', pascal: 'FrameworkVerwaltung' },
  { key: 'incident_management', label: 'Incident-Management', pascal: 'IncidentManagement' },
  { key: 'maßnahmen_management', label: 'Maßnahmen-Management', pascal: 'MassnahmenManagement' },
  { key: 'dokumente_&_evidenzen', label: 'Dokumente & Evidenzen', pascal: 'DokumenteEvidenzen' },
  { key: 'audit_management', label: 'Audit-Management', pascal: 'AuditManagement' },
  { key: 'asset_register', label: 'Asset-Register', pascal: 'AssetRegister' },
  { key: 'bcm_&_notfallmanagement', label: 'BCM & Notfallmanagement', pascal: 'BcmNotfallmanagement' },
  { key: 'lieferantenmanagement', label: 'Lieferantenmanagement', pascal: 'Lieferantenmanagement' },
  { key: 'risiko_register', label: 'Risiko-Register', pascal: 'RisikoRegister' },
] as const;

type EntityKey = typeof ENTITY_TABS[number]['key'];

export default function AdminPage() {
  const data = useDashboardData();
  const { loading, error, fetchAll } = data;

  const [activeTab, setActiveTab] = useState<EntityKey>('organisationseinheiten');
  const [selectedIds, setSelectedIds] = useState<Record<EntityKey, Set<string>>>(() => ({
    'organisationseinheiten': new Set(),
    'soa_management': new Set(),
    'kontroll_management': new Set(),
    'aufgaben_&_freigaben': new Set(),
    'awareness_&_schulungen': new Set(),
    'policy_management': new Set(),
    'findings_&_abweichungen': new Set(),
    'framework_verwaltung': new Set(),
    'incident_management': new Set(),
    'maßnahmen_management': new Set(),
    'dokumente_&_evidenzen': new Set(),
    'audit_management': new Set(),
    'asset_register': new Set(),
    'bcm_&_notfallmanagement': new Set(),
    'lieferantenmanagement': new Set(),
    'risiko_register': new Set(),
  }));
  const [filters, setFilters] = useState<Record<EntityKey, Record<string, string>>>(() => ({
    'organisationseinheiten': {},
    'soa_management': {},
    'kontroll_management': {},
    'aufgaben_&_freigaben': {},
    'awareness_&_schulungen': {},
    'policy_management': {},
    'findings_&_abweichungen': {},
    'framework_verwaltung': {},
    'incident_management': {},
    'maßnahmen_management': {},
    'dokumente_&_evidenzen': {},
    'audit_management': {},
    'asset_register': {},
    'bcm_&_notfallmanagement': {},
    'lieferantenmanagement': {},
    'risiko_register': {},
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [createEntity, setCreateEntity] = useState<EntityKey | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<{ entity: EntityKey; ids: string[] } | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState<EntityKey | null>(null);
  const [viewState, setViewState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const getRecords = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'organisationseinheiten': return (data as any).organisationseinheiten as Organisationseinheiten[] ?? [];
      case 'soa_management': return (data as any).soaManagement as SoaManagement[] ?? [];
      case 'kontroll_management': return (data as any).kontrollManagement as KontrollManagement[] ?? [];
      case 'aufgaben_&_freigaben': return (data as any).aufgabenFreigaben as AufgabenFreigaben[] ?? [];
      case 'awareness_&_schulungen': return (data as any).awarenessSchulungen as AwarenessSchulungen[] ?? [];
      case 'policy_management': return (data as any).policyManagement as PolicyManagement[] ?? [];
      case 'findings_&_abweichungen': return (data as any).findingsAbweichungen as FindingsAbweichungen[] ?? [];
      case 'framework_verwaltung': return (data as any).frameworkVerwaltung as FrameworkVerwaltung[] ?? [];
      case 'incident_management': return (data as any).incidentManagement as IncidentManagement[] ?? [];
      case 'maßnahmen_management': return (data as any).massnahmenManagement as MassnahmenManagement[] ?? [];
      case 'dokumente_&_evidenzen': return (data as any).dokumenteEvidenzen as DokumenteEvidenzen[] ?? [];
      case 'audit_management': return (data as any).auditManagement as AuditManagement[] ?? [];
      case 'asset_register': return (data as any).assetRegister as AssetRegister[] ?? [];
      case 'bcm_&_notfallmanagement': return (data as any).bcmNotfallmanagement as BcmNotfallmanagement[] ?? [];
      case 'lieferantenmanagement': return (data as any).lieferantenmanagement as Lieferantenmanagement[] ?? [];
      case 'risiko_register': return (data as any).risikoRegister as RisikoRegister[] ?? [];
      default: return [];
    }
  }, [data]);

  const getLookupLists = useCallback((entity: EntityKey) => {
    const lists: Record<string, any[]> = {};
    switch (entity) {
      case 'soa_management':
        lists.kontroll_managementList = (data as any).kontrollManagement ?? [];
        break;
      case 'kontroll_management':
        lists.framework_verwaltungList = (data as any).frameworkVerwaltung ?? [];
        lists.maßnahmen_managementList = (data as any).massnahmenManagement ?? [];
        break;
      case 'aufgaben_&_freigaben':
        lists.risiko_registerList = (data as any).risikoRegister ?? [];
        lists.maßnahmen_managementList = (data as any).massnahmenManagement ?? [];
        lists.audit_managementList = (data as any).auditManagement ?? [];
        break;
      case 'awareness_&_schulungen':
        lists.framework_verwaltungList = (data as any).frameworkVerwaltung ?? [];
        break;
      case 'policy_management':
        lists.framework_verwaltungList = (data as any).frameworkVerwaltung ?? [];
        break;
      case 'findings_&_abweichungen':
        lists.audit_managementList = (data as any).auditManagement ?? [];
        lists.kontroll_managementList = (data as any).kontrollManagement ?? [];
        lists.maßnahmen_managementList = (data as any).massnahmenManagement ?? [];
        break;
      case 'incident_management':
        lists.asset_registerList = (data as any).assetRegister ?? [];
        lists.organisationseinheitenList = (data as any).organisationseinheiten ?? [];
        break;
      case 'maßnahmen_management':
        lists.risiko_registerList = (data as any).risikoRegister ?? [];
        break;
      case 'dokumente_&_evidenzen':
        lists.kontroll_managementList = (data as any).kontrollManagement ?? [];
        lists.audit_managementList = (data as any).auditManagement ?? [];
        break;
      case 'audit_management':
        lists.framework_verwaltungList = (data as any).frameworkVerwaltung ?? [];
        lists.organisationseinheitenList = (data as any).organisationseinheiten ?? [];
        break;
      case 'asset_register':
        lists.organisationseinheitenList = (data as any).organisationseinheiten ?? [];
        break;
      case 'bcm_&_notfallmanagement':
        lists.asset_registerList = (data as any).assetRegister ?? [];
        break;
      case 'risiko_register':
        lists.asset_registerList = (data as any).assetRegister ?? [];
        lists.organisationseinheitenList = (data as any).organisationseinheiten ?? [];
        break;
    }
    return lists;
  }, [data]);

  const getApplookupDisplay = useCallback((entity: EntityKey, fieldKey: string, url?: unknown) => {
    if (!url) return '—';
    const id = extractRecordId(url);
    if (!id) return '—';
    const lists = getLookupLists(entity);
    void fieldKey; // ensure used for noUnusedParameters
    if (entity === 'soa_management' && fieldKey === 'soa_control') {
      const match = (lists.kontroll_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.ctrl_id ?? '—';
    }
    if (entity === 'kontroll_management' && fieldKey === 'ctrl_framework') {
      const match = (lists.framework_verwaltungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.fw_name ?? '—';
    }
    if (entity === 'kontroll_management' && fieldKey === 'ctrl_measure') {
      const match = (lists.maßnahmen_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.measure_id ?? '—';
    }
    if (entity === 'aufgaben_&_freigaben' && fieldKey === 'task_related_risk') {
      const match = (lists.risiko_registerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.risk_id ?? '—';
    }
    if (entity === 'aufgaben_&_freigaben' && fieldKey === 'task_related_measure') {
      const match = (lists.maßnahmen_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.measure_id ?? '—';
    }
    if (entity === 'aufgaben_&_freigaben' && fieldKey === 'task_related_audit') {
      const match = (lists.audit_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.audit_id ?? '—';
    }
    if (entity === 'awareness_&_schulungen' && fieldKey === 'training_framework') {
      const match = (lists.framework_verwaltungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.fw_name ?? '—';
    }
    if (entity === 'policy_management' && fieldKey === 'policy_framework') {
      const match = (lists.framework_verwaltungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.fw_name ?? '—';
    }
    if (entity === 'findings_&_abweichungen' && fieldKey === 'finding_audit') {
      const match = (lists.audit_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.audit_id ?? '—';
    }
    if (entity === 'findings_&_abweichungen' && fieldKey === 'finding_control') {
      const match = (lists.kontroll_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.ctrl_id ?? '—';
    }
    if (entity === 'findings_&_abweichungen' && fieldKey === 'finding_measure') {
      const match = (lists.maßnahmen_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.measure_id ?? '—';
    }
    if (entity === 'incident_management' && fieldKey === 'incident_affected_asset') {
      const match = (lists.asset_registerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.asset_name ?? '—';
    }
    if (entity === 'incident_management' && fieldKey === 'incident_affected_org') {
      const match = (lists.organisationseinheitenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.org_housenumber ?? '—';
    }
    if (entity === 'maßnahmen_management' && fieldKey === 'measure_risk') {
      const match = (lists.risiko_registerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.risk_id ?? '—';
    }
    if (entity === 'dokumente_&_evidenzen' && fieldKey === 'doc_related_control') {
      const match = (lists.kontroll_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.ctrl_id ?? '—';
    }
    if (entity === 'dokumente_&_evidenzen' && fieldKey === 'doc_related_audit') {
      const match = (lists.audit_managementList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.audit_id ?? '—';
    }
    if (entity === 'audit_management' && fieldKey === 'audit_framework') {
      const match = (lists.framework_verwaltungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.fw_name ?? '—';
    }
    if (entity === 'audit_management' && fieldKey === 'audit_org_unit') {
      const match = (lists.organisationseinheitenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.org_housenumber ?? '—';
    }
    if (entity === 'asset_register' && fieldKey === 'asset_org_unit') {
      const match = (lists.organisationseinheitenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.org_housenumber ?? '—';
    }
    if (entity === 'bcm_&_notfallmanagement' && fieldKey === 'bcm_related_asset') {
      const match = (lists.asset_registerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.asset_name ?? '—';
    }
    if (entity === 'risiko_register' && fieldKey === 'risk_asset') {
      const match = (lists.asset_registerList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.asset_name ?? '—';
    }
    if (entity === 'risiko_register' && fieldKey === 'risk_org_unit') {
      const match = (lists.organisationseinheitenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.org_housenumber ?? '—';
    }
    return String(url);
  }, [getLookupLists]);

  const getFieldMeta = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'organisationseinheiten': return ORGANISATIONSEINHEITEN_FIELDS;
      case 'soa_management': return SOAMANAGEMENT_FIELDS;
      case 'kontroll_management': return KONTROLLMANAGEMENT_FIELDS;
      case 'aufgaben_&_freigaben': return AUFGABENFREIGABEN_FIELDS;
      case 'awareness_&_schulungen': return AWARENESSSCHULUNGEN_FIELDS;
      case 'policy_management': return POLICYMANAGEMENT_FIELDS;
      case 'findings_&_abweichungen': return FINDINGSABWEICHUNGEN_FIELDS;
      case 'framework_verwaltung': return FRAMEWORKVERWALTUNG_FIELDS;
      case 'incident_management': return INCIDENTMANAGEMENT_FIELDS;
      case 'maßnahmen_management': return MASSNAHMENMANAGEMENT_FIELDS;
      case 'dokumente_&_evidenzen': return DOKUMENTEEVIDENZEN_FIELDS;
      case 'audit_management': return AUDITMANAGEMENT_FIELDS;
      case 'asset_register': return ASSETREGISTER_FIELDS;
      case 'bcm_&_notfallmanagement': return BCMNOTFALLMANAGEMENT_FIELDS;
      case 'lieferantenmanagement': return LIEFERANTENMANAGEMENT_FIELDS;
      case 'risiko_register': return RISIKOREGISTER_FIELDS;
      default: return [];
    }
  }, []);

  const getFilteredRecords = useCallback((entity: EntityKey) => {
    const records = getRecords(entity);
    const s = search.toLowerCase();
    const searched = !s ? records : records.filter((r: any) => {
      return Object.values(r.fields).some((v: any) => {
        if (v == null) return false;
        if (Array.isArray(v)) return v.some((item: any) => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
        if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
        return String(v).toLowerCase().includes(s);
      });
    });
    const entityFilters = filters[entity] ?? {};
    const fieldMeta = getFieldMeta(entity);
    return searched.filter((r: any) => {
      return fieldMeta.every((fm: any) => {
        const fv = entityFilters[fm.key];
        if (!fv || fv === '') return true;
        const val = r.fields?.[fm.key];
        if (fm.type === 'bool') {
          if (fv === 'true') return val === true;
          if (fv === 'false') return val !== true;
          return true;
        }
        if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
          const label = val && typeof val === 'object' && 'label' in val ? val.label : '';
          return String(label).toLowerCase().includes(fv.toLowerCase());
        }
        if (fm.type.includes('multiplelookup')) {
          if (!Array.isArray(val)) return false;
          return val.some((item: any) => String(item?.label ?? '').toLowerCase().includes(fv.toLowerCase()));
        }
        if (fm.type.includes('applookup')) {
          const display = getApplookupDisplay(entity, fm.key, val);
          return String(display).toLowerCase().includes(fv.toLowerCase());
        }
        return String(val ?? '').toLowerCase().includes(fv.toLowerCase());
      });
    });
  }, [getRecords, filters, getFieldMeta, getApplookupDisplay, search]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const toggleSelect = useCallback((entity: EntityKey, id: string) => {
    setSelectedIds(prev => {
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (next[entity].has(id)) next[entity].delete(id);
      else next[entity].add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((entity: EntityKey) => {
    const filtered = getFilteredRecords(entity);
    setSelectedIds(prev => {
      const allSelected = filtered.every((r: any) => prev[entity].has(r.record_id));
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (allSelected) {
        filtered.forEach((r: any) => next[entity].delete(r.record_id));
      } else {
        filtered.forEach((r: any) => next[entity].add(r.record_id));
      }
      return next;
    });
  }, [getFilteredRecords]);

  const clearSelection = useCallback((entity: EntityKey) => {
    setSelectedIds(prev => ({ ...prev, [entity]: new Set() }));
  }, []);

  const getServiceMethods = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'organisationseinheiten': return {
        create: (fields: any) => LivingAppsService.createOrganisationseinheitenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateOrganisationseinheitenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteOrganisationseinheitenEntry(id),
      };
      case 'soa_management': return {
        create: (fields: any) => LivingAppsService.createSoaManagementEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateSoaManagementEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteSoaManagementEntry(id),
      };
      case 'kontroll_management': return {
        create: (fields: any) => LivingAppsService.createKontrollManagementEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateKontrollManagementEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteKontrollManagementEntry(id),
      };
      case 'aufgaben_&_freigaben': return {
        create: (fields: any) => LivingAppsService.createAufgabenFreigabenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateAufgabenFreigabenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteAufgabenFreigabenEntry(id),
      };
      case 'awareness_&_schulungen': return {
        create: (fields: any) => LivingAppsService.createAwarenessSchulungenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateAwarenessSchulungenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteAwarenessSchulungenEntry(id),
      };
      case 'policy_management': return {
        create: (fields: any) => LivingAppsService.createPolicyManagementEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updatePolicyManagementEntry(id, fields),
        remove: (id: string) => LivingAppsService.deletePolicyManagementEntry(id),
      };
      case 'findings_&_abweichungen': return {
        create: (fields: any) => LivingAppsService.createFindingsAbweichungenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateFindingsAbweichungenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteFindingsAbweichungenEntry(id),
      };
      case 'framework_verwaltung': return {
        create: (fields: any) => LivingAppsService.createFrameworkVerwaltungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateFrameworkVerwaltungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteFrameworkVerwaltungEntry(id),
      };
      case 'incident_management': return {
        create: (fields: any) => LivingAppsService.createIncidentManagementEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateIncidentManagementEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteIncidentManagementEntry(id),
      };
      case 'maßnahmen_management': return {
        create: (fields: any) => LivingAppsService.createMassnahmenManagementEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateMassnahmenManagementEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteMassnahmenManagementEntry(id),
      };
      case 'dokumente_&_evidenzen': return {
        create: (fields: any) => LivingAppsService.createDokumenteEvidenzenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateDokumenteEvidenzenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteDokumenteEvidenzenEntry(id),
      };
      case 'audit_management': return {
        create: (fields: any) => LivingAppsService.createAuditManagementEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateAuditManagementEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteAuditManagementEntry(id),
      };
      case 'asset_register': return {
        create: (fields: any) => LivingAppsService.createAssetRegisterEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateAssetRegisterEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteAssetRegisterEntry(id),
      };
      case 'bcm_&_notfallmanagement': return {
        create: (fields: any) => LivingAppsService.createBcmNotfallmanagementEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateBcmNotfallmanagementEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteBcmNotfallmanagementEntry(id),
      };
      case 'lieferantenmanagement': return {
        create: (fields: any) => LivingAppsService.createLieferantenmanagementEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateLieferantenmanagementEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteLieferantenmanagementEntry(id),
      };
      case 'risiko_register': return {
        create: (fields: any) => LivingAppsService.createRisikoRegisterEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateRisikoRegisterEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteRisikoRegisterEntry(id),
      };
      default: return null;
    }
  }, []);

  async function handleCreate(entity: EntityKey, fields: any) {
    const svc = getServiceMethods(entity);
    if (!svc) return;
    await svc.create(fields);
    fetchAll();
    setCreateEntity(null);
  }

  async function handleUpdate(fields: any) {
    if (!dialogState) return;
    const svc = getServiceMethods(dialogState.entity);
    if (!svc) return;
    await svc.update(dialogState.record.record_id, fields);
    fetchAll();
    setDialogState(null);
  }

  async function handleBulkDelete() {
    if (!deleteTargets) return;
    const svc = getServiceMethods(deleteTargets.entity);
    if (!svc) return;
    setBulkLoading(true);
    try {
      for (const id of deleteTargets.ids) {
        await svc.remove(id);
      }
      clearSelection(deleteTargets.entity);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setDeleteTargets(null);
    }
  }

  async function handleBulkClone() {
    const svc = getServiceMethods(activeTab);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const records = getRecords(activeTab);
      const ids = Array.from(selectedIds[activeTab]);
      for (const id of ids) {
        const rec = records.find((r: any) => r.record_id === id);
        if (!rec) continue;
        const clean = cleanFieldsForApi(rec.fields, activeTab);
        await svc.create(clean as any);
      }
      clearSelection(activeTab);
      fetchAll();
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkEdit(fieldKey: string, value: any) {
    if (!bulkEditOpen) return;
    const svc = getServiceMethods(bulkEditOpen);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds[bulkEditOpen]);
      for (const id of ids) {
        await svc.update(id, { [fieldKey]: value });
      }
      clearSelection(bulkEditOpen);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setBulkEditOpen(null);
    }
  }

  function updateFilter(entity: EntityKey, fieldKey: string, value: string) {
    setFilters(prev => ({
      ...prev,
      [entity]: { ...prev[entity], [fieldKey]: value },
    }));
  }

  function clearEntityFilters(entity: EntityKey) {
    setFilters(prev => ({ ...prev, [entity]: {} }));
  }

  const activeFilterCount = useMemo(() => {
    const f = filters[activeTab] ?? {};
    return Object.values(f).filter(v => v && v !== '').length;
  }, [filters, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={fetchAll}>Erneut versuchen</Button>
      </div>
    );
  }

  const filtered = getFilteredRecords(activeTab);
  const sel = selectedIds[activeTab];
  const allFiltered = filtered.every((r: any) => sel.has(r.record_id)) && filtered.length > 0;
  const fieldMeta = getFieldMeta(activeTab);

  return (
    <PageShell
      title="Verwaltung"
      subtitle="Alle Daten verwalten"
      action={
        <Button onClick={() => setCreateEntity(activeTab)} className="shrink-0">
          <IconPlus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map(tab => {
          const count = getRecords(tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); setSortKey(''); setSortDir('asc'); fetchAll(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2">
            <IconFilter className="h-4 w-4" />
            Filtern
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearEntityFilters(activeTab)}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-muted/60 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium">{sel.size} ausgewählt</span>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(activeTab)}>
              <IconPencil className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Feld bearbeiten</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkClone()}>
              <IconCopy className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Kopieren</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTargets({ entity: activeTab, ids: Array.from(sel) })}>
              <IconTrash className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Ausgewählte löschen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearSelection(activeTab)}>
              <IconX className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Auswahl aufheben</span>
            </Button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          {fieldMeta.map((fm: any) => (
            <div key={fm.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{fm.label}</label>
              {fm.type === 'bool' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              ) : fm.type === 'lookup/select' || fm.type === 'lookup/radio' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {fm.options?.map((o: any) => (
                      <SelectItem key={o.key} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="Filtern..."
                  value={filters[activeTab]?.[fm.key] ?? ''}
                  onChange={e => updateFilter(activeTab, fm.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[27px] bg-card shadow-lg overflow-x-auto">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="w-10 px-6">
                <Checkbox
                  checked={allFiltered}
                  onCheckedChange={() => toggleSelectAll(activeTab)}
                />
              </TableHead>
              {fieldMeta.map((fm: any) => (
                <TableHead key={fm.key} className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(fm.key)}>
                  <span className="inline-flex items-center gap-1">
                    {fm.label}
                    {sortKey === fm.key ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map((record: any) => (
              <TableRow key={record.record_id} className={`transition-colors cursor-pointer ${sel.has(record.record_id) ? "bg-primary/5" : "hover:bg-muted/50"}`} onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; setViewState({ entity: activeTab, record }); }}>
                <TableCell>
                  <Checkbox
                    checked={sel.has(record.record_id)}
                    onCheckedChange={() => toggleSelect(activeTab, record.record_id)}
                  />
                </TableCell>
                {fieldMeta.map((fm: any) => {
                  const val = record.fields?.[fm.key];
                  if (fm.type === 'bool') {
                    return (
                      <TableCell key={fm.key}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          val ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {val ? 'Ja' : 'Nein'}
                        </span>
                      </TableCell>
                    );
                  }
                  if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{val?.label ?? '—'}</span></TableCell>;
                  }
                  if (fm.type.includes('multiplelookup')) {
                    return <TableCell key={fm.key}>{Array.isArray(val) ? val.map((v: any) => v?.label ?? v).join(', ') : '—'}</TableCell>;
                  }
                  if (fm.type.includes('applookup')) {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getApplookupDisplay(activeTab, fm.key, val)}</span></TableCell>;
                  }
                  if (fm.type.includes('date')) {
                    return <TableCell key={fm.key} className="text-muted-foreground">{fmtDate(val)}</TableCell>;
                  }
                  if (fm.type.startsWith('file')) {
                    return (
                      <TableCell key={fm.key}>
                        {val ? (
                          <div className="relative h-8 w-8 rounded bg-muted overflow-hidden">
                            <img src={val} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : '—'}
                      </TableCell>
                    );
                  }
                  if (fm.type === 'string/textarea') {
                    return <TableCell key={fm.key} className="max-w-xs"><span className="truncate block">{val ?? '—'}</span></TableCell>;
                  }
                  if (fm.type === 'geo') {
                    return (
                      <TableCell key={fm.key} className="max-w-[200px]">
                        <span className="truncate block" title={val ? `${val.lat}, ${val.long}` : undefined}>
                          {val?.info ?? (val ? `${val.lat?.toFixed(4)}, ${val.long?.toFixed(4)}` : '—')}
                        </span>
                      </TableCell>
                    );
                  }
                  return <TableCell key={fm.key}>{val ?? '—'}</TableCell>;
                })}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ entity: activeTab, record })}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargets({ entity: activeTab, ids: [record.record_id] })}>
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={fieldMeta.length + 2} className="text-center py-16 text-muted-foreground">
                  Keine Ergebnisse gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(createEntity === 'organisationseinheiten' || dialogState?.entity === 'organisationseinheiten') && (
        <OrganisationseinheitenDialog
          open={createEntity === 'organisationseinheiten' || dialogState?.entity === 'organisationseinheiten'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'organisationseinheiten' ? handleUpdate : (fields: any) => handleCreate('organisationseinheiten', fields)}
          defaultValues={dialogState?.entity === 'organisationseinheiten' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Organisationseinheiten']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Organisationseinheiten']}
        />
      )}
      {(createEntity === 'soa_management' || dialogState?.entity === 'soa_management') && (
        <SoaManagementDialog
          open={createEntity === 'soa_management' || dialogState?.entity === 'soa_management'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'soa_management' ? handleUpdate : (fields: any) => handleCreate('soa_management', fields)}
          defaultValues={dialogState?.entity === 'soa_management' ? dialogState.record?.fields : undefined}
          kontroll_managementList={(data as any).kontrollManagement ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['SoaManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['SoaManagement']}
        />
      )}
      {(createEntity === 'kontroll_management' || dialogState?.entity === 'kontroll_management') && (
        <KontrollManagementDialog
          open={createEntity === 'kontroll_management' || dialogState?.entity === 'kontroll_management'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'kontroll_management' ? handleUpdate : (fields: any) => handleCreate('kontroll_management', fields)}
          defaultValues={dialogState?.entity === 'kontroll_management' ? dialogState.record?.fields : undefined}
          framework_verwaltungList={(data as any).frameworkVerwaltung ?? []}
          maßnahmen_managementList={(data as any).massnahmenManagement ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['KontrollManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['KontrollManagement']}
        />
      )}
      {(createEntity === 'aufgaben_&_freigaben' || dialogState?.entity === 'aufgaben_&_freigaben') && (
        <AufgabenFreigabenDialog
          open={createEntity === 'aufgaben_&_freigaben' || dialogState?.entity === 'aufgaben_&_freigaben'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'aufgaben_&_freigaben' ? handleUpdate : (fields: any) => handleCreate('aufgaben_&_freigaben', fields)}
          defaultValues={dialogState?.entity === 'aufgaben_&_freigaben' ? dialogState.record?.fields : undefined}
          risiko_registerList={(data as any).risikoRegister ?? []}
          maßnahmen_managementList={(data as any).massnahmenManagement ?? []}
          audit_managementList={(data as any).auditManagement ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['AufgabenFreigaben']}
          enablePhotoLocation={AI_PHOTO_LOCATION['AufgabenFreigaben']}
        />
      )}
      {(createEntity === 'awareness_&_schulungen' || dialogState?.entity === 'awareness_&_schulungen') && (
        <AwarenessSchulungenDialog
          open={createEntity === 'awareness_&_schulungen' || dialogState?.entity === 'awareness_&_schulungen'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'awareness_&_schulungen' ? handleUpdate : (fields: any) => handleCreate('awareness_&_schulungen', fields)}
          defaultValues={dialogState?.entity === 'awareness_&_schulungen' ? dialogState.record?.fields : undefined}
          framework_verwaltungList={(data as any).frameworkVerwaltung ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['AwarenessSchulungen']}
          enablePhotoLocation={AI_PHOTO_LOCATION['AwarenessSchulungen']}
        />
      )}
      {(createEntity === 'policy_management' || dialogState?.entity === 'policy_management') && (
        <PolicyManagementDialog
          open={createEntity === 'policy_management' || dialogState?.entity === 'policy_management'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'policy_management' ? handleUpdate : (fields: any) => handleCreate('policy_management', fields)}
          defaultValues={dialogState?.entity === 'policy_management' ? dialogState.record?.fields : undefined}
          framework_verwaltungList={(data as any).frameworkVerwaltung ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['PolicyManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['PolicyManagement']}
        />
      )}
      {(createEntity === 'findings_&_abweichungen' || dialogState?.entity === 'findings_&_abweichungen') && (
        <FindingsAbweichungenDialog
          open={createEntity === 'findings_&_abweichungen' || dialogState?.entity === 'findings_&_abweichungen'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'findings_&_abweichungen' ? handleUpdate : (fields: any) => handleCreate('findings_&_abweichungen', fields)}
          defaultValues={dialogState?.entity === 'findings_&_abweichungen' ? dialogState.record?.fields : undefined}
          audit_managementList={(data as any).auditManagement ?? []}
          kontroll_managementList={(data as any).kontrollManagement ?? []}
          maßnahmen_managementList={(data as any).massnahmenManagement ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['FindingsAbweichungen']}
          enablePhotoLocation={AI_PHOTO_LOCATION['FindingsAbweichungen']}
        />
      )}
      {(createEntity === 'framework_verwaltung' || dialogState?.entity === 'framework_verwaltung') && (
        <FrameworkVerwaltungDialog
          open={createEntity === 'framework_verwaltung' || dialogState?.entity === 'framework_verwaltung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'framework_verwaltung' ? handleUpdate : (fields: any) => handleCreate('framework_verwaltung', fields)}
          defaultValues={dialogState?.entity === 'framework_verwaltung' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['FrameworkVerwaltung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['FrameworkVerwaltung']}
        />
      )}
      {(createEntity === 'incident_management' || dialogState?.entity === 'incident_management') && (
        <IncidentManagementDialog
          open={createEntity === 'incident_management' || dialogState?.entity === 'incident_management'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'incident_management' ? handleUpdate : (fields: any) => handleCreate('incident_management', fields)}
          defaultValues={dialogState?.entity === 'incident_management' ? dialogState.record?.fields : undefined}
          asset_registerList={(data as any).assetRegister ?? []}
          organisationseinheitenList={(data as any).organisationseinheiten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['IncidentManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['IncidentManagement']}
        />
      )}
      {(createEntity === 'maßnahmen_management' || dialogState?.entity === 'maßnahmen_management') && (
        <MassnahmenManagementDialog
          open={createEntity === 'maßnahmen_management' || dialogState?.entity === 'maßnahmen_management'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'maßnahmen_management' ? handleUpdate : (fields: any) => handleCreate('maßnahmen_management', fields)}
          defaultValues={dialogState?.entity === 'maßnahmen_management' ? dialogState.record?.fields : undefined}
          risiko_registerList={(data as any).risikoRegister ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['MassnahmenManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['MassnahmenManagement']}
        />
      )}
      {(createEntity === 'dokumente_&_evidenzen' || dialogState?.entity === 'dokumente_&_evidenzen') && (
        <DokumenteEvidenzenDialog
          open={createEntity === 'dokumente_&_evidenzen' || dialogState?.entity === 'dokumente_&_evidenzen'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'dokumente_&_evidenzen' ? handleUpdate : (fields: any) => handleCreate('dokumente_&_evidenzen', fields)}
          defaultValues={dialogState?.entity === 'dokumente_&_evidenzen' ? dialogState.record?.fields : undefined}
          kontroll_managementList={(data as any).kontrollManagement ?? []}
          audit_managementList={(data as any).auditManagement ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['DokumenteEvidenzen']}
          enablePhotoLocation={AI_PHOTO_LOCATION['DokumenteEvidenzen']}
        />
      )}
      {(createEntity === 'audit_management' || dialogState?.entity === 'audit_management') && (
        <AuditManagementDialog
          open={createEntity === 'audit_management' || dialogState?.entity === 'audit_management'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'audit_management' ? handleUpdate : (fields: any) => handleCreate('audit_management', fields)}
          defaultValues={dialogState?.entity === 'audit_management' ? dialogState.record?.fields : undefined}
          framework_verwaltungList={(data as any).frameworkVerwaltung ?? []}
          organisationseinheitenList={(data as any).organisationseinheiten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['AuditManagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['AuditManagement']}
        />
      )}
      {(createEntity === 'asset_register' || dialogState?.entity === 'asset_register') && (
        <AssetRegisterDialog
          open={createEntity === 'asset_register' || dialogState?.entity === 'asset_register'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'asset_register' ? handleUpdate : (fields: any) => handleCreate('asset_register', fields)}
          defaultValues={dialogState?.entity === 'asset_register' ? dialogState.record?.fields : undefined}
          organisationseinheitenList={(data as any).organisationseinheiten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['AssetRegister']}
          enablePhotoLocation={AI_PHOTO_LOCATION['AssetRegister']}
        />
      )}
      {(createEntity === 'bcm_&_notfallmanagement' || dialogState?.entity === 'bcm_&_notfallmanagement') && (
        <BcmNotfallmanagementDialog
          open={createEntity === 'bcm_&_notfallmanagement' || dialogState?.entity === 'bcm_&_notfallmanagement'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'bcm_&_notfallmanagement' ? handleUpdate : (fields: any) => handleCreate('bcm_&_notfallmanagement', fields)}
          defaultValues={dialogState?.entity === 'bcm_&_notfallmanagement' ? dialogState.record?.fields : undefined}
          asset_registerList={(data as any).assetRegister ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['BcmNotfallmanagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['BcmNotfallmanagement']}
        />
      )}
      {(createEntity === 'lieferantenmanagement' || dialogState?.entity === 'lieferantenmanagement') && (
        <LieferantenmanagementDialog
          open={createEntity === 'lieferantenmanagement' || dialogState?.entity === 'lieferantenmanagement'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'lieferantenmanagement' ? handleUpdate : (fields: any) => handleCreate('lieferantenmanagement', fields)}
          defaultValues={dialogState?.entity === 'lieferantenmanagement' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Lieferantenmanagement']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Lieferantenmanagement']}
        />
      )}
      {(createEntity === 'risiko_register' || dialogState?.entity === 'risiko_register') && (
        <RisikoRegisterDialog
          open={createEntity === 'risiko_register' || dialogState?.entity === 'risiko_register'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'risiko_register' ? handleUpdate : (fields: any) => handleCreate('risiko_register', fields)}
          defaultValues={dialogState?.entity === 'risiko_register' ? dialogState.record?.fields : undefined}
          asset_registerList={(data as any).assetRegister ?? []}
          organisationseinheitenList={(data as any).organisationseinheiten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['RisikoRegister']}
          enablePhotoLocation={AI_PHOTO_LOCATION['RisikoRegister']}
        />
      )}
      {viewState?.entity === 'organisationseinheiten' && (
        <OrganisationseinheitenViewDialog
          open={viewState?.entity === 'organisationseinheiten'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'organisationseinheiten', record: r }); }}
        />
      )}
      {viewState?.entity === 'soa_management' && (
        <SoaManagementViewDialog
          open={viewState?.entity === 'soa_management'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'soa_management', record: r }); }}
          kontroll_managementList={(data as any).kontrollManagement ?? []}
        />
      )}
      {viewState?.entity === 'kontroll_management' && (
        <KontrollManagementViewDialog
          open={viewState?.entity === 'kontroll_management'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'kontroll_management', record: r }); }}
          framework_verwaltungList={(data as any).frameworkVerwaltung ?? []}
          maßnahmen_managementList={(data as any).massnahmenManagement ?? []}
        />
      )}
      {viewState?.entity === 'aufgaben_&_freigaben' && (
        <AufgabenFreigabenViewDialog
          open={viewState?.entity === 'aufgaben_&_freigaben'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'aufgaben_&_freigaben', record: r }); }}
          risiko_registerList={(data as any).risikoRegister ?? []}
          maßnahmen_managementList={(data as any).massnahmenManagement ?? []}
          audit_managementList={(data as any).auditManagement ?? []}
        />
      )}
      {viewState?.entity === 'awareness_&_schulungen' && (
        <AwarenessSchulungenViewDialog
          open={viewState?.entity === 'awareness_&_schulungen'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'awareness_&_schulungen', record: r }); }}
          framework_verwaltungList={(data as any).frameworkVerwaltung ?? []}
        />
      )}
      {viewState?.entity === 'policy_management' && (
        <PolicyManagementViewDialog
          open={viewState?.entity === 'policy_management'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'policy_management', record: r }); }}
          framework_verwaltungList={(data as any).frameworkVerwaltung ?? []}
        />
      )}
      {viewState?.entity === 'findings_&_abweichungen' && (
        <FindingsAbweichungenViewDialog
          open={viewState?.entity === 'findings_&_abweichungen'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'findings_&_abweichungen', record: r }); }}
          audit_managementList={(data as any).auditManagement ?? []}
          kontroll_managementList={(data as any).kontrollManagement ?? []}
          maßnahmen_managementList={(data as any).massnahmenManagement ?? []}
        />
      )}
      {viewState?.entity === 'framework_verwaltung' && (
        <FrameworkVerwaltungViewDialog
          open={viewState?.entity === 'framework_verwaltung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'framework_verwaltung', record: r }); }}
        />
      )}
      {viewState?.entity === 'incident_management' && (
        <IncidentManagementViewDialog
          open={viewState?.entity === 'incident_management'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'incident_management', record: r }); }}
          asset_registerList={(data as any).assetRegister ?? []}
          organisationseinheitenList={(data as any).organisationseinheiten ?? []}
        />
      )}
      {viewState?.entity === 'maßnahmen_management' && (
        <MassnahmenManagementViewDialog
          open={viewState?.entity === 'maßnahmen_management'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'maßnahmen_management', record: r }); }}
          risiko_registerList={(data as any).risikoRegister ?? []}
        />
      )}
      {viewState?.entity === 'dokumente_&_evidenzen' && (
        <DokumenteEvidenzenViewDialog
          open={viewState?.entity === 'dokumente_&_evidenzen'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'dokumente_&_evidenzen', record: r }); }}
          kontroll_managementList={(data as any).kontrollManagement ?? []}
          audit_managementList={(data as any).auditManagement ?? []}
        />
      )}
      {viewState?.entity === 'audit_management' && (
        <AuditManagementViewDialog
          open={viewState?.entity === 'audit_management'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'audit_management', record: r }); }}
          framework_verwaltungList={(data as any).frameworkVerwaltung ?? []}
          organisationseinheitenList={(data as any).organisationseinheiten ?? []}
        />
      )}
      {viewState?.entity === 'asset_register' && (
        <AssetRegisterViewDialog
          open={viewState?.entity === 'asset_register'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'asset_register', record: r }); }}
          organisationseinheitenList={(data as any).organisationseinheiten ?? []}
        />
      )}
      {viewState?.entity === 'bcm_&_notfallmanagement' && (
        <BcmNotfallmanagementViewDialog
          open={viewState?.entity === 'bcm_&_notfallmanagement'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'bcm_&_notfallmanagement', record: r }); }}
          asset_registerList={(data as any).assetRegister ?? []}
        />
      )}
      {viewState?.entity === 'lieferantenmanagement' && (
        <LieferantenmanagementViewDialog
          open={viewState?.entity === 'lieferantenmanagement'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'lieferantenmanagement', record: r }); }}
        />
      )}
      {viewState?.entity === 'risiko_register' && (
        <RisikoRegisterViewDialog
          open={viewState?.entity === 'risiko_register'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'risiko_register', record: r }); }}
          asset_registerList={(data as any).assetRegister ?? []}
          organisationseinheitenList={(data as any).organisationseinheiten ?? []}
        />
      )}

      <BulkEditDialog
        open={!!bulkEditOpen}
        onClose={() => setBulkEditOpen(null)}
        onApply={handleBulkEdit}
        fields={bulkEditOpen ? getFieldMeta(bulkEditOpen) : []}
        selectedCount={bulkEditOpen ? selectedIds[bulkEditOpen].size : 0}
        loading={bulkLoading}
        lookupLists={bulkEditOpen ? getLookupLists(bulkEditOpen) : {}}
      />

      <ConfirmDialog
        open={!!deleteTargets}
        onClose={() => setDeleteTargets(null)}
        onConfirm={handleBulkDelete}
        title="Ausgewählte löschen"
        description={`Sollen ${deleteTargets?.ids.length ?? 0} Einträge wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />
    </PageShell>
  );
}