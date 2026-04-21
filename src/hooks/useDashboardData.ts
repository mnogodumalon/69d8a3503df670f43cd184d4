import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BcmNotfallmanagement, AwarenessSchulungen, AufgabenFreigaben, Organisationseinheiten, AssetRegister, FrameworkVerwaltung, Risikomanagement, MassnahmenManagement, KontrollManagement, SoaManagement, AuditManagement, FindingsAbweichungen, IncidentManagement, Lieferantenmanagement, PolicyManagement, DokumenteEvidenzen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [bcmNotfallmanagement, setBcmNotfallmanagement] = useState<BcmNotfallmanagement[]>([]);
  const [awarenessSchulungen, setAwarenessSchulungen] = useState<AwarenessSchulungen[]>([]);
  const [aufgabenFreigaben, setAufgabenFreigaben] = useState<AufgabenFreigaben[]>([]);
  const [organisationseinheiten, setOrganisationseinheiten] = useState<Organisationseinheiten[]>([]);
  const [assetRegister, setAssetRegister] = useState<AssetRegister[]>([]);
  const [frameworkVerwaltung, setFrameworkVerwaltung] = useState<FrameworkVerwaltung[]>([]);
  const [risikomanagement, setRisikomanagement] = useState<Risikomanagement[]>([]);
  const [massnahmenManagement, setMassnahmenManagement] = useState<MassnahmenManagement[]>([]);
  const [kontrollManagement, setKontrollManagement] = useState<KontrollManagement[]>([]);
  const [soaManagement, setSoaManagement] = useState<SoaManagement[]>([]);
  const [auditManagement, setAuditManagement] = useState<AuditManagement[]>([]);
  const [findingsAbweichungen, setFindingsAbweichungen] = useState<FindingsAbweichungen[]>([]);
  const [incidentManagement, setIncidentManagement] = useState<IncidentManagement[]>([]);
  const [lieferantenmanagement, setLieferantenmanagement] = useState<Lieferantenmanagement[]>([]);
  const [policyManagement, setPolicyManagement] = useState<PolicyManagement[]>([]);
  const [dokumenteEvidenzen, setDokumenteEvidenzen] = useState<DokumenteEvidenzen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [bcmNotfallmanagementData, awarenessSchulungenData, aufgabenFreigabenData, organisationseinheitenData, assetRegisterData, frameworkVerwaltungData, risikomanagementData, massnahmenManagementData, kontrollManagementData, soaManagementData, auditManagementData, findingsAbweichungenData, incidentManagementData, lieferantenmanagementData, policyManagementData, dokumenteEvidenzenData] = await Promise.all([
        LivingAppsService.getBcmNotfallmanagement(),
        LivingAppsService.getAwarenessSchulungen(),
        LivingAppsService.getAufgabenFreigaben(),
        LivingAppsService.getOrganisationseinheiten(),
        LivingAppsService.getAssetRegister(),
        LivingAppsService.getFrameworkVerwaltung(),
        LivingAppsService.getRisikomanagement(),
        LivingAppsService.getMassnahmenManagement(),
        LivingAppsService.getKontrollManagement(),
        LivingAppsService.getSoaManagement(),
        LivingAppsService.getAuditManagement(),
        LivingAppsService.getFindingsAbweichungen(),
        LivingAppsService.getIncidentManagement(),
        LivingAppsService.getLieferantenmanagement(),
        LivingAppsService.getPolicyManagement(),
        LivingAppsService.getDokumenteEvidenzen(),
      ]);
      setBcmNotfallmanagement(bcmNotfallmanagementData);
      setAwarenessSchulungen(awarenessSchulungenData);
      setAufgabenFreigaben(aufgabenFreigabenData);
      setOrganisationseinheiten(organisationseinheitenData);
      setAssetRegister(assetRegisterData);
      setFrameworkVerwaltung(frameworkVerwaltungData);
      setRisikomanagement(risikomanagementData);
      setMassnahmenManagement(massnahmenManagementData);
      setKontrollManagement(kontrollManagementData);
      setSoaManagement(soaManagementData);
      setAuditManagement(auditManagementData);
      setFindingsAbweichungen(findingsAbweichungenData);
      setIncidentManagement(incidentManagementData);
      setLieferantenmanagement(lieferantenmanagementData);
      setPolicyManagement(policyManagementData);
      setDokumenteEvidenzen(dokumenteEvidenzenData);
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
        const [bcmNotfallmanagementData, awarenessSchulungenData, aufgabenFreigabenData, organisationseinheitenData, assetRegisterData, frameworkVerwaltungData, risikomanagementData, massnahmenManagementData, kontrollManagementData, soaManagementData, auditManagementData, findingsAbweichungenData, incidentManagementData, lieferantenmanagementData, policyManagementData, dokumenteEvidenzenData] = await Promise.all([
          LivingAppsService.getBcmNotfallmanagement(),
          LivingAppsService.getAwarenessSchulungen(),
          LivingAppsService.getAufgabenFreigaben(),
          LivingAppsService.getOrganisationseinheiten(),
          LivingAppsService.getAssetRegister(),
          LivingAppsService.getFrameworkVerwaltung(),
          LivingAppsService.getRisikomanagement(),
          LivingAppsService.getMassnahmenManagement(),
          LivingAppsService.getKontrollManagement(),
          LivingAppsService.getSoaManagement(),
          LivingAppsService.getAuditManagement(),
          LivingAppsService.getFindingsAbweichungen(),
          LivingAppsService.getIncidentManagement(),
          LivingAppsService.getLieferantenmanagement(),
          LivingAppsService.getPolicyManagement(),
          LivingAppsService.getDokumenteEvidenzen(),
        ]);
        setBcmNotfallmanagement(bcmNotfallmanagementData);
        setAwarenessSchulungen(awarenessSchulungenData);
        setAufgabenFreigaben(aufgabenFreigabenData);
        setOrganisationseinheiten(organisationseinheitenData);
        setAssetRegister(assetRegisterData);
        setFrameworkVerwaltung(frameworkVerwaltungData);
        setRisikomanagement(risikomanagementData);
        setMassnahmenManagement(massnahmenManagementData);
        setKontrollManagement(kontrollManagementData);
        setSoaManagement(soaManagementData);
        setAuditManagement(auditManagementData);
        setFindingsAbweichungen(findingsAbweichungenData);
        setIncidentManagement(incidentManagementData);
        setLieferantenmanagement(lieferantenmanagementData);
        setPolicyManagement(policyManagementData);
        setDokumenteEvidenzen(dokumenteEvidenzenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const organisationseinheitenMap = useMemo(() => {
    const m = new Map<string, Organisationseinheiten>();
    organisationseinheiten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [organisationseinheiten]);

  const assetRegisterMap = useMemo(() => {
    const m = new Map<string, AssetRegister>();
    assetRegister.forEach(r => m.set(r.record_id, r));
    return m;
  }, [assetRegister]);

  const frameworkVerwaltungMap = useMemo(() => {
    const m = new Map<string, FrameworkVerwaltung>();
    frameworkVerwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [frameworkVerwaltung]);

  const risikomanagementMap = useMemo(() => {
    const m = new Map<string, Risikomanagement>();
    risikomanagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [risikomanagement]);

  const massnahmenManagementMap = useMemo(() => {
    const m = new Map<string, MassnahmenManagement>();
    massnahmenManagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [massnahmenManagement]);

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

  return { bcmNotfallmanagement, setBcmNotfallmanagement, awarenessSchulungen, setAwarenessSchulungen, aufgabenFreigaben, setAufgabenFreigaben, organisationseinheiten, setOrganisationseinheiten, assetRegister, setAssetRegister, frameworkVerwaltung, setFrameworkVerwaltung, risikomanagement, setRisikomanagement, massnahmenManagement, setMassnahmenManagement, kontrollManagement, setKontrollManagement, soaManagement, setSoaManagement, auditManagement, setAuditManagement, findingsAbweichungen, setFindingsAbweichungen, incidentManagement, setIncidentManagement, lieferantenmanagement, setLieferantenmanagement, policyManagement, setPolicyManagement, dokumenteEvidenzen, setDokumenteEvidenzen, loading, error, fetchAll, organisationseinheitenMap, assetRegisterMap, frameworkVerwaltungMap, risikomanagementMap, massnahmenManagementMap, kontrollManagementMap, auditManagementMap };
}