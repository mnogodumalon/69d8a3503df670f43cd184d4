import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Organisationseinheiten, SoaManagement, KontrollManagement, AufgabenFreigaben, AwarenessSchulungen, PolicyManagement, FindingsAbweichungen, FrameworkVerwaltung, IncidentManagement, MassnahmenManagement, DokumenteEvidenzen, AuditManagement, AssetRegister, BcmNotfallmanagement, Lieferantenmanagement, RisikoRegister } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [organisationseinheiten, setOrganisationseinheiten] = useState<Organisationseinheiten[]>([]);
  const [soaManagement, setSoaManagement] = useState<SoaManagement[]>([]);
  const [kontrollManagement, setKontrollManagement] = useState<KontrollManagement[]>([]);
  const [aufgabenFreigaben, setAufgabenFreigaben] = useState<AufgabenFreigaben[]>([]);
  const [awarenessSchulungen, setAwarenessSchulungen] = useState<AwarenessSchulungen[]>([]);
  const [policyManagement, setPolicyManagement] = useState<PolicyManagement[]>([]);
  const [findingsAbweichungen, setFindingsAbweichungen] = useState<FindingsAbweichungen[]>([]);
  const [frameworkVerwaltung, setFrameworkVerwaltung] = useState<FrameworkVerwaltung[]>([]);
  const [incidentManagement, setIncidentManagement] = useState<IncidentManagement[]>([]);
  const [massnahmenManagement, setMassnahmenManagement] = useState<MassnahmenManagement[]>([]);
  const [dokumenteEvidenzen, setDokumenteEvidenzen] = useState<DokumenteEvidenzen[]>([]);
  const [auditManagement, setAuditManagement] = useState<AuditManagement[]>([]);
  const [assetRegister, setAssetRegister] = useState<AssetRegister[]>([]);
  const [bcmNotfallmanagement, setBcmNotfallmanagement] = useState<BcmNotfallmanagement[]>([]);
  const [lieferantenmanagement, setLieferantenmanagement] = useState<Lieferantenmanagement[]>([]);
  const [risikoRegister, setRisikoRegister] = useState<RisikoRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [organisationseinheitenData, soaManagementData, kontrollManagementData, aufgabenFreigabenData, awarenessSchulungenData, policyManagementData, findingsAbweichungenData, frameworkVerwaltungData, incidentManagementData, massnahmenManagementData, dokumenteEvidenzenData, auditManagementData, assetRegisterData, bcmNotfallmanagementData, lieferantenmanagementData, risikoRegisterData] = await Promise.all([
        LivingAppsService.getOrganisationseinheiten(),
        LivingAppsService.getSoaManagement(),
        LivingAppsService.getKontrollManagement(),
        LivingAppsService.getAufgabenFreigaben(),
        LivingAppsService.getAwarenessSchulungen(),
        LivingAppsService.getPolicyManagement(),
        LivingAppsService.getFindingsAbweichungen(),
        LivingAppsService.getFrameworkVerwaltung(),
        LivingAppsService.getIncidentManagement(),
        LivingAppsService.getMassnahmenManagement(),
        LivingAppsService.getDokumenteEvidenzen(),
        LivingAppsService.getAuditManagement(),
        LivingAppsService.getAssetRegister(),
        LivingAppsService.getBcmNotfallmanagement(),
        LivingAppsService.getLieferantenmanagement(),
        LivingAppsService.getRisikoRegister(),
      ]);
      setOrganisationseinheiten(organisationseinheitenData);
      setSoaManagement(soaManagementData);
      setKontrollManagement(kontrollManagementData);
      setAufgabenFreigaben(aufgabenFreigabenData);
      setAwarenessSchulungen(awarenessSchulungenData);
      setPolicyManagement(policyManagementData);
      setFindingsAbweichungen(findingsAbweichungenData);
      setFrameworkVerwaltung(frameworkVerwaltungData);
      setIncidentManagement(incidentManagementData);
      setMassnahmenManagement(massnahmenManagementData);
      setDokumenteEvidenzen(dokumenteEvidenzenData);
      setAuditManagement(auditManagementData);
      setAssetRegister(assetRegisterData);
      setBcmNotfallmanagement(bcmNotfallmanagementData);
      setLieferantenmanagement(lieferantenmanagementData);
      setRisikoRegister(risikoRegisterData);
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
        const [organisationseinheitenData, soaManagementData, kontrollManagementData, aufgabenFreigabenData, awarenessSchulungenData, policyManagementData, findingsAbweichungenData, frameworkVerwaltungData, incidentManagementData, massnahmenManagementData, dokumenteEvidenzenData, auditManagementData, assetRegisterData, bcmNotfallmanagementData, lieferantenmanagementData, risikoRegisterData] = await Promise.all([
          LivingAppsService.getOrganisationseinheiten(),
          LivingAppsService.getSoaManagement(),
          LivingAppsService.getKontrollManagement(),
          LivingAppsService.getAufgabenFreigaben(),
          LivingAppsService.getAwarenessSchulungen(),
          LivingAppsService.getPolicyManagement(),
          LivingAppsService.getFindingsAbweichungen(),
          LivingAppsService.getFrameworkVerwaltung(),
          LivingAppsService.getIncidentManagement(),
          LivingAppsService.getMassnahmenManagement(),
          LivingAppsService.getDokumenteEvidenzen(),
          LivingAppsService.getAuditManagement(),
          LivingAppsService.getAssetRegister(),
          LivingAppsService.getBcmNotfallmanagement(),
          LivingAppsService.getLieferantenmanagement(),
          LivingAppsService.getRisikoRegister(),
        ]);
        setOrganisationseinheiten(organisationseinheitenData);
        setSoaManagement(soaManagementData);
        setKontrollManagement(kontrollManagementData);
        setAufgabenFreigaben(aufgabenFreigabenData);
        setAwarenessSchulungen(awarenessSchulungenData);
        setPolicyManagement(policyManagementData);
        setFindingsAbweichungen(findingsAbweichungenData);
        setFrameworkVerwaltung(frameworkVerwaltungData);
        setIncidentManagement(incidentManagementData);
        setMassnahmenManagement(massnahmenManagementData);
        setDokumenteEvidenzen(dokumenteEvidenzenData);
        setAuditManagement(auditManagementData);
        setAssetRegister(assetRegisterData);
        setBcmNotfallmanagement(bcmNotfallmanagementData);
        setLieferantenmanagement(lieferantenmanagementData);
        setRisikoRegister(risikoRegisterData);
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

  const kontrollManagementMap = useMemo(() => {
    const m = new Map<string, KontrollManagement>();
    kontrollManagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kontrollManagement]);

  const frameworkVerwaltungMap = useMemo(() => {
    const m = new Map<string, FrameworkVerwaltung>();
    frameworkVerwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [frameworkVerwaltung]);

  const massnahmenManagementMap = useMemo(() => {
    const m = new Map<string, MassnahmenManagement>();
    massnahmenManagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [massnahmenManagement]);

  const auditManagementMap = useMemo(() => {
    const m = new Map<string, AuditManagement>();
    auditManagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [auditManagement]);

  const assetRegisterMap = useMemo(() => {
    const m = new Map<string, AssetRegister>();
    assetRegister.forEach(r => m.set(r.record_id, r));
    return m;
  }, [assetRegister]);

  const risikoRegisterMap = useMemo(() => {
    const m = new Map<string, RisikoRegister>();
    risikoRegister.forEach(r => m.set(r.record_id, r));
    return m;
  }, [risikoRegister]);

  return { organisationseinheiten, setOrganisationseinheiten, soaManagement, setSoaManagement, kontrollManagement, setKontrollManagement, aufgabenFreigaben, setAufgabenFreigaben, awarenessSchulungen, setAwarenessSchulungen, policyManagement, setPolicyManagement, findingsAbweichungen, setFindingsAbweichungen, frameworkVerwaltung, setFrameworkVerwaltung, incidentManagement, setIncidentManagement, massnahmenManagement, setMassnahmenManagement, dokumenteEvidenzen, setDokumenteEvidenzen, auditManagement, setAuditManagement, assetRegister, setAssetRegister, bcmNotfallmanagement, setBcmNotfallmanagement, lieferantenmanagement, setLieferantenmanagement, risikoRegister, setRisikoRegister, loading, error, fetchAll, organisationseinheitenMap, kontrollManagementMap, frameworkVerwaltungMap, massnahmenManagementMap, auditManagementMap, assetRegisterMap, risikoRegisterMap };
}