import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Risikomanagement, Organisationseinheiten, SoaManagement, Lieferantenmanagement, DokumenteEvidenzen, FrameworkVerwaltung, FindingsAbweichungen, KontrollManagement, AuditManagement, BcmNotfallmanagement, AufgabenFreigaben, AwarenessSchulungen, MassnahmenManagement, IncidentManagement, AssetRegister, PolicyManagement } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [risikomanagement, setRisikomanagement] = useState<Risikomanagement[]>([]);
  const [organisationseinheiten, setOrganisationseinheiten] = useState<Organisationseinheiten[]>([]);
  const [soaManagement, setSoaManagement] = useState<SoaManagement[]>([]);
  const [lieferantenmanagement, setLieferantenmanagement] = useState<Lieferantenmanagement[]>([]);
  const [dokumenteEvidenzen, setDokumenteEvidenzen] = useState<DokumenteEvidenzen[]>([]);
  const [frameworkVerwaltung, setFrameworkVerwaltung] = useState<FrameworkVerwaltung[]>([]);
  const [findingsAbweichungen, setFindingsAbweichungen] = useState<FindingsAbweichungen[]>([]);
  const [kontrollManagement, setKontrollManagement] = useState<KontrollManagement[]>([]);
  const [auditManagement, setAuditManagement] = useState<AuditManagement[]>([]);
  const [bcmNotfallmanagement, setBcmNotfallmanagement] = useState<BcmNotfallmanagement[]>([]);
  const [aufgabenFreigaben, setAufgabenFreigaben] = useState<AufgabenFreigaben[]>([]);
  const [awarenessSchulungen, setAwarenessSchulungen] = useState<AwarenessSchulungen[]>([]);
  const [massnahmenManagement, setMassnahmenManagement] = useState<MassnahmenManagement[]>([]);
  const [incidentManagement, setIncidentManagement] = useState<IncidentManagement[]>([]);
  const [assetRegister, setAssetRegister] = useState<AssetRegister[]>([]);
  const [policyManagement, setPolicyManagement] = useState<PolicyManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [risikomanagementData, organisationseinheitenData, soaManagementData, lieferantenmanagementData, dokumenteEvidenzenData, frameworkVerwaltungData, findingsAbweichungenData, kontrollManagementData, auditManagementData, bcmNotfallmanagementData, aufgabenFreigabenData, awarenessSchulungenData, massnahmenManagementData, incidentManagementData, assetRegisterData, policyManagementData] = await Promise.all([
        LivingAppsService.getRisikomanagement(),
        LivingAppsService.getOrganisationseinheiten(),
        LivingAppsService.getSoaManagement(),
        LivingAppsService.getLieferantenmanagement(),
        LivingAppsService.getDokumenteEvidenzen(),
        LivingAppsService.getFrameworkVerwaltung(),
        LivingAppsService.getFindingsAbweichungen(),
        LivingAppsService.getKontrollManagement(),
        LivingAppsService.getAuditManagement(),
        LivingAppsService.getBcmNotfallmanagement(),
        LivingAppsService.getAufgabenFreigaben(),
        LivingAppsService.getAwarenessSchulungen(),
        LivingAppsService.getMassnahmenManagement(),
        LivingAppsService.getIncidentManagement(),
        LivingAppsService.getAssetRegister(),
        LivingAppsService.getPolicyManagement(),
      ]);
      setRisikomanagement(risikomanagementData);
      setOrganisationseinheiten(organisationseinheitenData);
      setSoaManagement(soaManagementData);
      setLieferantenmanagement(lieferantenmanagementData);
      setDokumenteEvidenzen(dokumenteEvidenzenData);
      setFrameworkVerwaltung(frameworkVerwaltungData);
      setFindingsAbweichungen(findingsAbweichungenData);
      setKontrollManagement(kontrollManagementData);
      setAuditManagement(auditManagementData);
      setBcmNotfallmanagement(bcmNotfallmanagementData);
      setAufgabenFreigaben(aufgabenFreigabenData);
      setAwarenessSchulungen(awarenessSchulungenData);
      setMassnahmenManagement(massnahmenManagementData);
      setIncidentManagement(incidentManagementData);
      setAssetRegister(assetRegisterData);
      setPolicyManagement(policyManagementData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [risikomanagementData, organisationseinheitenData, soaManagementData, lieferantenmanagementData, dokumenteEvidenzenData, frameworkVerwaltungData, findingsAbweichungenData, kontrollManagementData, auditManagementData, bcmNotfallmanagementData, aufgabenFreigabenData, awarenessSchulungenData, massnahmenManagementData, incidentManagementData, assetRegisterData, policyManagementData] = await Promise.all([
          LivingAppsService.getRisikomanagement(),
          LivingAppsService.getOrganisationseinheiten(),
          LivingAppsService.getSoaManagement(),
          LivingAppsService.getLieferantenmanagement(),
          LivingAppsService.getDokumenteEvidenzen(),
          LivingAppsService.getFrameworkVerwaltung(),
          LivingAppsService.getFindingsAbweichungen(),
          LivingAppsService.getKontrollManagement(),
          LivingAppsService.getAuditManagement(),
          LivingAppsService.getBcmNotfallmanagement(),
          LivingAppsService.getAufgabenFreigaben(),
          LivingAppsService.getAwarenessSchulungen(),
          LivingAppsService.getMassnahmenManagement(),
          LivingAppsService.getIncidentManagement(),
          LivingAppsService.getAssetRegister(),
          LivingAppsService.getPolicyManagement(),
        ]);
        setRisikomanagement(risikomanagementData);
        setOrganisationseinheiten(organisationseinheitenData);
        setSoaManagement(soaManagementData);
        setLieferantenmanagement(lieferantenmanagementData);
        setDokumenteEvidenzen(dokumenteEvidenzenData);
        setFrameworkVerwaltung(frameworkVerwaltungData);
        setFindingsAbweichungen(findingsAbweichungenData);
        setKontrollManagement(kontrollManagementData);
        setAuditManagement(auditManagementData);
        setBcmNotfallmanagement(bcmNotfallmanagementData);
        setAufgabenFreigaben(aufgabenFreigabenData);
        setAwarenessSchulungen(awarenessSchulungenData);
        setMassnahmenManagement(massnahmenManagementData);
        setIncidentManagement(incidentManagementData);
        setAssetRegister(assetRegisterData);
        setPolicyManagement(policyManagementData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const risikomanagementMap = useMemo(() => {
    const m = new Map<string, Risikomanagement>();
    risikomanagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [risikomanagement]);

  const organisationseinheitenMap = useMemo(() => {
    const m = new Map<string, Organisationseinheiten>();
    organisationseinheiten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [organisationseinheiten]);

  const frameworkVerwaltungMap = useMemo(() => {
    const m = new Map<string, FrameworkVerwaltung>();
    frameworkVerwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [frameworkVerwaltung]);

  const kontrollManagementMap = useMemo(() => {
    const m = new Map<string, KontrollManagement>();
    kontrollManagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kontrollManagement]);

  const auditManagementMap = useMemo(() => {
    const m = new Map<string, AuditManagement>();
    auditManagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [auditManagement]);

  const massnahmenManagementMap = useMemo(() => {
    const m = new Map<string, MassnahmenManagement>();
    massnahmenManagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [massnahmenManagement]);

  const assetRegisterMap = useMemo(() => {
    const m = new Map<string, AssetRegister>();
    assetRegister.forEach(r => m.set(r.record_id, r));
    return m;
  }, [assetRegister]);

  return { risikomanagement, setRisikomanagement, organisationseinheiten, setOrganisationseinheiten, soaManagement, setSoaManagement, lieferantenmanagement, setLieferantenmanagement, dokumenteEvidenzen, setDokumenteEvidenzen, frameworkVerwaltung, setFrameworkVerwaltung, findingsAbweichungen, setFindingsAbweichungen, kontrollManagement, setKontrollManagement, auditManagement, setAuditManagement, bcmNotfallmanagement, setBcmNotfallmanagement, aufgabenFreigaben, setAufgabenFreigaben, awarenessSchulungen, setAwarenessSchulungen, massnahmenManagement, setMassnahmenManagement, incidentManagement, setIncidentManagement, assetRegister, setAssetRegister, policyManagement, setPolicyManagement, loading, error, fetchAll, risikomanagementMap, organisationseinheitenMap, frameworkVerwaltungMap, kontrollManagementMap, auditManagementMap, massnahmenManagementMap, assetRegisterMap };
}