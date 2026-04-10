import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BcmNotfallmanagement, Lieferantenmanagement, PolicyManagement, FrameworkVerwaltung, IncidentManagement, SoaManagement, Risikomanagement, DokumenteEvidenzen, Organisationseinheiten, AufgabenFreigaben, MassnahmenManagement, FindingsAbweichungen, AuditManagement, AssetRegister, KontrollManagement, AwarenessSchulungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [bcmNotfallmanagement, setBcmNotfallmanagement] = useState<BcmNotfallmanagement[]>([]);
  const [lieferantenmanagement, setLieferantenmanagement] = useState<Lieferantenmanagement[]>([]);
  const [policyManagement, setPolicyManagement] = useState<PolicyManagement[]>([]);
  const [frameworkVerwaltung, setFrameworkVerwaltung] = useState<FrameworkVerwaltung[]>([]);
  const [incidentManagement, setIncidentManagement] = useState<IncidentManagement[]>([]);
  const [soaManagement, setSoaManagement] = useState<SoaManagement[]>([]);
  const [risikomanagement, setRisikomanagement] = useState<Risikomanagement[]>([]);
  const [dokumenteEvidenzen, setDokumenteEvidenzen] = useState<DokumenteEvidenzen[]>([]);
  const [organisationseinheiten, setOrganisationseinheiten] = useState<Organisationseinheiten[]>([]);
  const [aufgabenFreigaben, setAufgabenFreigaben] = useState<AufgabenFreigaben[]>([]);
  const [massnahmenManagement, setMassnahmenManagement] = useState<MassnahmenManagement[]>([]);
  const [findingsAbweichungen, setFindingsAbweichungen] = useState<FindingsAbweichungen[]>([]);
  const [auditManagement, setAuditManagement] = useState<AuditManagement[]>([]);
  const [assetRegister, setAssetRegister] = useState<AssetRegister[]>([]);
  const [kontrollManagement, setKontrollManagement] = useState<KontrollManagement[]>([]);
  const [awarenessSchulungen, setAwarenessSchulungen] = useState<AwarenessSchulungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [bcmNotfallmanagementData, lieferantenmanagementData, policyManagementData, frameworkVerwaltungData, incidentManagementData, soaManagementData, risikomanagementData, dokumenteEvidenzenData, organisationseinheitenData, aufgabenFreigabenData, massnahmenManagementData, findingsAbweichungenData, auditManagementData, assetRegisterData, kontrollManagementData, awarenessSchulungenData] = await Promise.all([
        LivingAppsService.getBcmNotfallmanagement(),
        LivingAppsService.getLieferantenmanagement(),
        LivingAppsService.getPolicyManagement(),
        LivingAppsService.getFrameworkVerwaltung(),
        LivingAppsService.getIncidentManagement(),
        LivingAppsService.getSoaManagement(),
        LivingAppsService.getRisikomanagement(),
        LivingAppsService.getDokumenteEvidenzen(),
        LivingAppsService.getOrganisationseinheiten(),
        LivingAppsService.getAufgabenFreigaben(),
        LivingAppsService.getMassnahmenManagement(),
        LivingAppsService.getFindingsAbweichungen(),
        LivingAppsService.getAuditManagement(),
        LivingAppsService.getAssetRegister(),
        LivingAppsService.getKontrollManagement(),
        LivingAppsService.getAwarenessSchulungen(),
      ]);
      setBcmNotfallmanagement(bcmNotfallmanagementData);
      setLieferantenmanagement(lieferantenmanagementData);
      setPolicyManagement(policyManagementData);
      setFrameworkVerwaltung(frameworkVerwaltungData);
      setIncidentManagement(incidentManagementData);
      setSoaManagement(soaManagementData);
      setRisikomanagement(risikomanagementData);
      setDokumenteEvidenzen(dokumenteEvidenzenData);
      setOrganisationseinheiten(organisationseinheitenData);
      setAufgabenFreigaben(aufgabenFreigabenData);
      setMassnahmenManagement(massnahmenManagementData);
      setFindingsAbweichungen(findingsAbweichungenData);
      setAuditManagement(auditManagementData);
      setAssetRegister(assetRegisterData);
      setKontrollManagement(kontrollManagementData);
      setAwarenessSchulungen(awarenessSchulungenData);
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
        const [bcmNotfallmanagementData, lieferantenmanagementData, policyManagementData, frameworkVerwaltungData, incidentManagementData, soaManagementData, risikomanagementData, dokumenteEvidenzenData, organisationseinheitenData, aufgabenFreigabenData, massnahmenManagementData, findingsAbweichungenData, auditManagementData, assetRegisterData, kontrollManagementData, awarenessSchulungenData] = await Promise.all([
          LivingAppsService.getBcmNotfallmanagement(),
          LivingAppsService.getLieferantenmanagement(),
          LivingAppsService.getPolicyManagement(),
          LivingAppsService.getFrameworkVerwaltung(),
          LivingAppsService.getIncidentManagement(),
          LivingAppsService.getSoaManagement(),
          LivingAppsService.getRisikomanagement(),
          LivingAppsService.getDokumenteEvidenzen(),
          LivingAppsService.getOrganisationseinheiten(),
          LivingAppsService.getAufgabenFreigaben(),
          LivingAppsService.getMassnahmenManagement(),
          LivingAppsService.getFindingsAbweichungen(),
          LivingAppsService.getAuditManagement(),
          LivingAppsService.getAssetRegister(),
          LivingAppsService.getKontrollManagement(),
          LivingAppsService.getAwarenessSchulungen(),
        ]);
        setBcmNotfallmanagement(bcmNotfallmanagementData);
        setLieferantenmanagement(lieferantenmanagementData);
        setPolicyManagement(policyManagementData);
        setFrameworkVerwaltung(frameworkVerwaltungData);
        setIncidentManagement(incidentManagementData);
        setSoaManagement(soaManagementData);
        setRisikomanagement(risikomanagementData);
        setDokumenteEvidenzen(dokumenteEvidenzenData);
        setOrganisationseinheiten(organisationseinheitenData);
        setAufgabenFreigaben(aufgabenFreigabenData);
        setMassnahmenManagement(massnahmenManagementData);
        setFindingsAbweichungen(findingsAbweichungenData);
        setAuditManagement(auditManagementData);
        setAssetRegister(assetRegisterData);
        setKontrollManagement(kontrollManagementData);
        setAwarenessSchulungen(awarenessSchulungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

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

  const organisationseinheitenMap = useMemo(() => {
    const m = new Map<string, Organisationseinheiten>();
    organisationseinheiten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [organisationseinheiten]);

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

  const kontrollManagementMap = useMemo(() => {
    const m = new Map<string, KontrollManagement>();
    kontrollManagement.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kontrollManagement]);

  return { bcmNotfallmanagement, setBcmNotfallmanagement, lieferantenmanagement, setLieferantenmanagement, policyManagement, setPolicyManagement, frameworkVerwaltung, setFrameworkVerwaltung, incidentManagement, setIncidentManagement, soaManagement, setSoaManagement, risikomanagement, setRisikomanagement, dokumenteEvidenzen, setDokumenteEvidenzen, organisationseinheiten, setOrganisationseinheiten, aufgabenFreigaben, setAufgabenFreigaben, massnahmenManagement, setMassnahmenManagement, findingsAbweichungen, setFindingsAbweichungen, auditManagement, setAuditManagement, assetRegister, setAssetRegister, kontrollManagement, setKontrollManagement, awarenessSchulungen, setAwarenessSchulungen, loading, error, fetchAll, frameworkVerwaltungMap, risikomanagementMap, organisationseinheitenMap, massnahmenManagementMap, auditManagementMap, assetRegisterMap, kontrollManagementMap };
}