// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS, LOOKUP_OPTIONS, FIELD_TYPES } from '@/types/app';
import type { Risikomanagement, Organisationseinheiten, SoaManagement, Lieferantenmanagement, DokumenteEvidenzen, FrameworkVerwaltung, FindingsAbweichungen, KontrollManagement, AuditManagement, BcmNotfallmanagement, AufgabenFreigaben, AwarenessSchulungen, MassnahmenManagement, IncidentManagement, AssetRegister, PolicyManagement, CreateRisikomanagement, CreateOrganisationseinheiten, CreateSoaManagement, CreateLieferantenmanagement, CreateDokumenteEvidenzen, CreateFrameworkVerwaltung, CreateFindingsAbweichungen, CreateKontrollManagement, CreateAuditManagement, CreateBcmNotfallmanagement, CreateAufgabenFreigaben, CreateAwarenessSchulungen, CreateMassnahmenManagement, CreateIncidentManagement, CreateAssetRegister, CreatePolicyManagement } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: unknown): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) window.dispatchEvent(new Event('auth-error'));
    throw new Error(await response.text());
  }
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) window.dispatchEvent(new Event('auth-error'));
    throw new Error(`File upload failed: ${res.status}`);
  }
  const data = await res.json();
  return data.url;
}

function enrichLookupFields<T extends { fields: Record<string, unknown> }>(
  records: T[], entityKey: string
): T[] {
  const opts = LOOKUP_OPTIONS[entityKey];
  if (!opts) return records;
  return records.map(r => {
    const fields = { ...r.fields };
    for (const [fieldKey, options] of Object.entries(opts)) {
      const val = fields[fieldKey];
      if (typeof val === 'string') {
        const m = options.find(o => o.key === val);
        fields[fieldKey] = m ?? { key: val, label: val };
      } else if (Array.isArray(val)) {
        fields[fieldKey] = val.map(v => {
          if (typeof v === 'string') {
            const m = options.find(o => o.key === v);
            return m ?? { key: v, label: v };
          }
          return v;
        });
      }
    }
    return { ...r, fields } as T;
  });
}

/** Normalize fields for API writes: strip lookup objects to keys, fix date formats. */
export function cleanFieldsForApi(
  fields: Record<string, unknown>,
  entityKey: string
): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...fields };
  for (const [k, v] of Object.entries(clean)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'key' in v) clean[k] = (v as any).key;
    if (Array.isArray(v)) clean[k] = v.map((item: any) => item && typeof item === 'object' && 'key' in item ? item.key : item);
  }
  const types = FIELD_TYPES[entityKey];
  if (types) {
    for (const [k, ft] of Object.entries(types)) {
      if (!(k in clean)) continue;
      const val = clean[k];
      // applookup fields: undefined → null (clear single reference)
      if ((ft === 'applookup/select' || ft === 'applookup/choice') && val === undefined) { clean[k] = null; continue; }
      // multipleapplookup fields: undefined/null → [] (clear multi reference)
      if ((ft === 'multipleapplookup/select' || ft === 'multipleapplookup/choice') && (val === undefined || val === null)) { clean[k] = []; continue; }
      // lookup fields: undefined → null (clear single lookup)
      if ((ft.startsWith('lookup/')) && val === undefined) { clean[k] = null; continue; }
      // multiplelookup fields: undefined/null → [] (clear multi lookup)
      if ((ft.startsWith('multiplelookup/')) && (val === undefined || val === null)) { clean[k] = []; continue; }
      if (typeof val !== 'string' || !val) continue;
      if (ft === 'date/datetimeminute') clean[k] = val.slice(0, 16);
      else if (ft === 'date/date') clean[k] = val.slice(0, 10);
    }
  }
  return clean;
}

let _cachedUserProfile: Record<string, unknown> | null = null;

export async function getUserProfile(): Promise<Record<string, unknown>> {
  if (_cachedUserProfile) return _cachedUserProfile;
  const raw = await callApi('GET', '/user');
  const skip = new Set(['id', 'image', 'lang', 'gender', 'title', 'fax', 'menus', 'initials']);
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v != null && !skip.has(k)) data[k] = v;
  }
  _cachedUserProfile = data;
  return data;
}

export interface HeaderProfile {
  firstname: string;
  surname: string;
  email: string;
  image: string | null;
  company: string | null;
}

let _cachedHeaderProfile: HeaderProfile | null = null;

export async function getHeaderProfile(): Promise<HeaderProfile> {
  if (_cachedHeaderProfile) return _cachedHeaderProfile;
  const raw = await callApi('GET', '/user');
  _cachedHeaderProfile = {
    firstname: raw.firstname ?? '',
    surname: raw.surname ?? '',
    email: raw.email ?? '',
    image: raw.image ?? null,
    company: raw.company ?? null,
  };
  return _cachedHeaderProfile;
}

export interface AppGroupInfo {
  id: string;
  name: string;
  image: string | null;
  createdat: string;
  /** Resolved link: /objects/{id}/ if the dashboard exists, otherwise /gateway/apps/{firstAppId}?template=list_page */
  href: string;
}

let _cachedAppGroups: AppGroupInfo[] | null = null;

export async function getAppGroups(): Promise<AppGroupInfo[]> {
  if (_cachedAppGroups) return _cachedAppGroups;
  const raw = await callApi('GET', '/appgroups?with=apps');
  const groups: AppGroupInfo[] = Object.values(raw)
    .map((g: any) => {
      const firstAppId = Object.keys(g.apps ?? {})[0] ?? g.id;
      return {
        id: g.id,
        name: g.name,
        image: g.image ?? null,
        createdat: g.createdat ?? '',
        href: `/gateway/apps/${firstAppId}?template=list_page`,
        _firstAppId: firstAppId,
      };
    })
    .sort((a, b) => b.createdat.localeCompare(a.createdat));

  // Check which appgroups have a deployed dashboard via app params
  const paramChecks = await Promise.allSettled(
    groups.map(g => callApi('GET', `/apps/${(g as any)._firstAppId}/params/la_page_header_additional_url`))
  );
  paramChecks.forEach((result, i) => {
    if (result.status !== 'fulfilled' || !result.value) return;
    const url = result.value.value;
    if (typeof url === 'string' && url.length > 0) {
      try { groups[i].href = new URL(url).pathname; } catch { groups[i].href = url; }
    }
  });

  // Clean up internal helper property
  groups.forEach(g => delete (g as any)._firstAppId);

  _cachedAppGroups = groups;
  return _cachedAppGroups;
}

export class LivingAppsService {
  // --- RISIKOMANAGEMENT ---
  static async getRisikomanagement(): Promise<Risikomanagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.RISIKOMANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Risikomanagement[];
    return enrichLookupFields(records, 'risikomanagement');
  }
  static async getRisikomanagementEntry(id: string): Promise<Risikomanagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.RISIKOMANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as Risikomanagement;
    return enrichLookupFields([record], 'risikomanagement')[0];
  }
  static async createRisikomanagementEntry(fields: CreateRisikomanagement) {
    return callApi('POST', `/apps/${APP_IDS.RISIKOMANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'risikomanagement') });
  }
  static async updateRisikomanagementEntry(id: string, fields: Partial<CreateRisikomanagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.RISIKOMANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'risikomanagement') });
  }
  static async deleteRisikomanagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.RISIKOMANAGEMENT}/records/${id}`);
  }

  // --- ORGANISATIONSEINHEITEN ---
  static async getOrganisationseinheiten(): Promise<Organisationseinheiten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ORGANISATIONSEINHEITEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Organisationseinheiten[];
    return enrichLookupFields(records, 'organisationseinheiten');
  }
  static async getOrganisationseinheitenEntry(id: string): Promise<Organisationseinheiten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ORGANISATIONSEINHEITEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as Organisationseinheiten;
    return enrichLookupFields([record], 'organisationseinheiten')[0];
  }
  static async createOrganisationseinheitenEntry(fields: CreateOrganisationseinheiten) {
    return callApi('POST', `/apps/${APP_IDS.ORGANISATIONSEINHEITEN}/records`, { fields: cleanFieldsForApi(fields as any, 'organisationseinheiten') });
  }
  static async updateOrganisationseinheitenEntry(id: string, fields: Partial<CreateOrganisationseinheiten>) {
    return callApi('PATCH', `/apps/${APP_IDS.ORGANISATIONSEINHEITEN}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'organisationseinheiten') });
  }
  static async deleteOrganisationseinheitenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ORGANISATIONSEINHEITEN}/records/${id}`);
  }

  // --- SOA_MANAGEMENT ---
  static async getSoaManagement(): Promise<SoaManagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SOA_MANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as SoaManagement[];
    return enrichLookupFields(records, 'soa_management');
  }
  static async getSoaManagementEntry(id: string): Promise<SoaManagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SOA_MANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as SoaManagement;
    return enrichLookupFields([record], 'soa_management')[0];
  }
  static async createSoaManagementEntry(fields: CreateSoaManagement) {
    return callApi('POST', `/apps/${APP_IDS.SOA_MANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'soa_management') });
  }
  static async updateSoaManagementEntry(id: string, fields: Partial<CreateSoaManagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.SOA_MANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'soa_management') });
  }
  static async deleteSoaManagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SOA_MANAGEMENT}/records/${id}`);
  }

  // --- LIEFERANTENMANAGEMENT ---
  static async getLieferantenmanagement(): Promise<Lieferantenmanagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.LIEFERANTENMANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Lieferantenmanagement[];
    return enrichLookupFields(records, 'lieferantenmanagement');
  }
  static async getLieferantenmanagementEntry(id: string): Promise<Lieferantenmanagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.LIEFERANTENMANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as Lieferantenmanagement;
    return enrichLookupFields([record], 'lieferantenmanagement')[0];
  }
  static async createLieferantenmanagementEntry(fields: CreateLieferantenmanagement) {
    return callApi('POST', `/apps/${APP_IDS.LIEFERANTENMANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'lieferantenmanagement') });
  }
  static async updateLieferantenmanagementEntry(id: string, fields: Partial<CreateLieferantenmanagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.LIEFERANTENMANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'lieferantenmanagement') });
  }
  static async deleteLieferantenmanagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.LIEFERANTENMANAGEMENT}/records/${id}`);
  }

  // --- DOKUMENTE_&_EVIDENZEN ---
  static async getDokumenteEvidenzen(): Promise<DokumenteEvidenzen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.DOKUMENTE_EVIDENZEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as DokumenteEvidenzen[];
    return enrichLookupFields(records, 'dokumente_&_evidenzen');
  }
  static async getDokumenteEvidenzenEntry(id: string): Promise<DokumenteEvidenzen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.DOKUMENTE_EVIDENZEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as DokumenteEvidenzen;
    return enrichLookupFields([record], 'dokumente_&_evidenzen')[0];
  }
  static async createDokumenteEvidenzenEntry(fields: CreateDokumenteEvidenzen) {
    return callApi('POST', `/apps/${APP_IDS.DOKUMENTE_EVIDENZEN}/records`, { fields: cleanFieldsForApi(fields as any, 'dokumente_&_evidenzen') });
  }
  static async updateDokumenteEvidenzenEntry(id: string, fields: Partial<CreateDokumenteEvidenzen>) {
    return callApi('PATCH', `/apps/${APP_IDS.DOKUMENTE_EVIDENZEN}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'dokumente_&_evidenzen') });
  }
  static async deleteDokumenteEvidenzenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.DOKUMENTE_EVIDENZEN}/records/${id}`);
  }

  // --- FRAMEWORK_VERWALTUNG ---
  static async getFrameworkVerwaltung(): Promise<FrameworkVerwaltung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.FRAMEWORK_VERWALTUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as FrameworkVerwaltung[];
    return enrichLookupFields(records, 'framework_verwaltung');
  }
  static async getFrameworkVerwaltungEntry(id: string): Promise<FrameworkVerwaltung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.FRAMEWORK_VERWALTUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as FrameworkVerwaltung;
    return enrichLookupFields([record], 'framework_verwaltung')[0];
  }
  static async createFrameworkVerwaltungEntry(fields: CreateFrameworkVerwaltung) {
    return callApi('POST', `/apps/${APP_IDS.FRAMEWORK_VERWALTUNG}/records`, { fields: cleanFieldsForApi(fields as any, 'framework_verwaltung') });
  }
  static async updateFrameworkVerwaltungEntry(id: string, fields: Partial<CreateFrameworkVerwaltung>) {
    return callApi('PATCH', `/apps/${APP_IDS.FRAMEWORK_VERWALTUNG}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'framework_verwaltung') });
  }
  static async deleteFrameworkVerwaltungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.FRAMEWORK_VERWALTUNG}/records/${id}`);
  }

  // --- FINDINGS_&_ABWEICHUNGEN ---
  static async getFindingsAbweichungen(): Promise<FindingsAbweichungen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.FINDINGS_ABWEICHUNGEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as FindingsAbweichungen[];
    return enrichLookupFields(records, 'findings_&_abweichungen');
  }
  static async getFindingsAbweichungenEntry(id: string): Promise<FindingsAbweichungen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.FINDINGS_ABWEICHUNGEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as FindingsAbweichungen;
    return enrichLookupFields([record], 'findings_&_abweichungen')[0];
  }
  static async createFindingsAbweichungenEntry(fields: CreateFindingsAbweichungen) {
    return callApi('POST', `/apps/${APP_IDS.FINDINGS_ABWEICHUNGEN}/records`, { fields: cleanFieldsForApi(fields as any, 'findings_&_abweichungen') });
  }
  static async updateFindingsAbweichungenEntry(id: string, fields: Partial<CreateFindingsAbweichungen>) {
    return callApi('PATCH', `/apps/${APP_IDS.FINDINGS_ABWEICHUNGEN}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'findings_&_abweichungen') });
  }
  static async deleteFindingsAbweichungenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.FINDINGS_ABWEICHUNGEN}/records/${id}`);
  }

  // --- KONTROLL_MANAGEMENT ---
  static async getKontrollManagement(): Promise<KontrollManagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KONTROLL_MANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as KontrollManagement[];
    return enrichLookupFields(records, 'kontroll_management');
  }
  static async getKontrollManagementEntry(id: string): Promise<KontrollManagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KONTROLL_MANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as KontrollManagement;
    return enrichLookupFields([record], 'kontroll_management')[0];
  }
  static async createKontrollManagementEntry(fields: CreateKontrollManagement) {
    return callApi('POST', `/apps/${APP_IDS.KONTROLL_MANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'kontroll_management') });
  }
  static async updateKontrollManagementEntry(id: string, fields: Partial<CreateKontrollManagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.KONTROLL_MANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'kontroll_management') });
  }
  static async deleteKontrollManagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.KONTROLL_MANAGEMENT}/records/${id}`);
  }

  // --- AUDIT_MANAGEMENT ---
  static async getAuditManagement(): Promise<AuditManagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUDIT_MANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as AuditManagement[];
    return enrichLookupFields(records, 'audit_management');
  }
  static async getAuditManagementEntry(id: string): Promise<AuditManagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUDIT_MANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as AuditManagement;
    return enrichLookupFields([record], 'audit_management')[0];
  }
  static async createAuditManagementEntry(fields: CreateAuditManagement) {
    return callApi('POST', `/apps/${APP_IDS.AUDIT_MANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'audit_management') });
  }
  static async updateAuditManagementEntry(id: string, fields: Partial<CreateAuditManagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.AUDIT_MANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'audit_management') });
  }
  static async deleteAuditManagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.AUDIT_MANAGEMENT}/records/${id}`);
  }

  // --- BCM_&_NOTFALLMANAGEMENT ---
  static async getBcmNotfallmanagement(): Promise<BcmNotfallmanagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.BCM_NOTFALLMANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as BcmNotfallmanagement[];
    return enrichLookupFields(records, 'bcm_&_notfallmanagement');
  }
  static async getBcmNotfallmanagementEntry(id: string): Promise<BcmNotfallmanagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.BCM_NOTFALLMANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as BcmNotfallmanagement;
    return enrichLookupFields([record], 'bcm_&_notfallmanagement')[0];
  }
  static async createBcmNotfallmanagementEntry(fields: CreateBcmNotfallmanagement) {
    return callApi('POST', `/apps/${APP_IDS.BCM_NOTFALLMANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'bcm_&_notfallmanagement') });
  }
  static async updateBcmNotfallmanagementEntry(id: string, fields: Partial<CreateBcmNotfallmanagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.BCM_NOTFALLMANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'bcm_&_notfallmanagement') });
  }
  static async deleteBcmNotfallmanagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.BCM_NOTFALLMANAGEMENT}/records/${id}`);
  }

  // --- AUFGABEN_&_FREIGABEN ---
  static async getAufgabenFreigaben(): Promise<AufgabenFreigaben[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUFGABEN_FREIGABEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as AufgabenFreigaben[];
    return enrichLookupFields(records, 'aufgaben_&_freigaben');
  }
  static async getAufgabenFreigabenEntry(id: string): Promise<AufgabenFreigaben | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUFGABEN_FREIGABEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as AufgabenFreigaben;
    return enrichLookupFields([record], 'aufgaben_&_freigaben')[0];
  }
  static async createAufgabenFreigabenEntry(fields: CreateAufgabenFreigaben) {
    return callApi('POST', `/apps/${APP_IDS.AUFGABEN_FREIGABEN}/records`, { fields: cleanFieldsForApi(fields as any, 'aufgaben_&_freigaben') });
  }
  static async updateAufgabenFreigabenEntry(id: string, fields: Partial<CreateAufgabenFreigaben>) {
    return callApi('PATCH', `/apps/${APP_IDS.AUFGABEN_FREIGABEN}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'aufgaben_&_freigaben') });
  }
  static async deleteAufgabenFreigabenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.AUFGABEN_FREIGABEN}/records/${id}`);
  }

  // --- AWARENESS_&_SCHULUNGEN ---
  static async getAwarenessSchulungen(): Promise<AwarenessSchulungen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.AWARENESS_SCHULUNGEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as AwarenessSchulungen[];
    return enrichLookupFields(records, 'awareness_&_schulungen');
  }
  static async getAwarenessSchulungenEntry(id: string): Promise<AwarenessSchulungen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.AWARENESS_SCHULUNGEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as AwarenessSchulungen;
    return enrichLookupFields([record], 'awareness_&_schulungen')[0];
  }
  static async createAwarenessSchulungenEntry(fields: CreateAwarenessSchulungen) {
    return callApi('POST', `/apps/${APP_IDS.AWARENESS_SCHULUNGEN}/records`, { fields: cleanFieldsForApi(fields as any, 'awareness_&_schulungen') });
  }
  static async updateAwarenessSchulungenEntry(id: string, fields: Partial<CreateAwarenessSchulungen>) {
    return callApi('PATCH', `/apps/${APP_IDS.AWARENESS_SCHULUNGEN}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'awareness_&_schulungen') });
  }
  static async deleteAwarenessSchulungenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.AWARENESS_SCHULUNGEN}/records/${id}`);
  }

  // --- MASSNAHMEN_MANAGEMENT ---
  static async getMassnahmenManagement(): Promise<MassnahmenManagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MASSNAHMEN_MANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as MassnahmenManagement[];
    return enrichLookupFields(records, 'maßnahmen_management');
  }
  static async getMassnahmenManagementEntry(id: string): Promise<MassnahmenManagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MASSNAHMEN_MANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as MassnahmenManagement;
    return enrichLookupFields([record], 'maßnahmen_management')[0];
  }
  static async createMassnahmenManagementEntry(fields: CreateMassnahmenManagement) {
    return callApi('POST', `/apps/${APP_IDS.MASSNAHMEN_MANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'maßnahmen_management') });
  }
  static async updateMassnahmenManagementEntry(id: string, fields: Partial<CreateMassnahmenManagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.MASSNAHMEN_MANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'maßnahmen_management') });
  }
  static async deleteMassnahmenManagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MASSNAHMEN_MANAGEMENT}/records/${id}`);
  }

  // --- INCIDENT_MANAGEMENT ---
  static async getIncidentManagement(): Promise<IncidentManagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.INCIDENT_MANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as IncidentManagement[];
    return enrichLookupFields(records, 'incident_management');
  }
  static async getIncidentManagementEntry(id: string): Promise<IncidentManagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.INCIDENT_MANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as IncidentManagement;
    return enrichLookupFields([record], 'incident_management')[0];
  }
  static async createIncidentManagementEntry(fields: CreateIncidentManagement) {
    return callApi('POST', `/apps/${APP_IDS.INCIDENT_MANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'incident_management') });
  }
  static async updateIncidentManagementEntry(id: string, fields: Partial<CreateIncidentManagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.INCIDENT_MANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'incident_management') });
  }
  static async deleteIncidentManagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.INCIDENT_MANAGEMENT}/records/${id}`);
  }

  // --- ASSET_REGISTER ---
  static async getAssetRegister(): Promise<AssetRegister[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ASSET_REGISTER}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as AssetRegister[];
    return enrichLookupFields(records, 'asset_register');
  }
  static async getAssetRegisterEntry(id: string): Promise<AssetRegister | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ASSET_REGISTER}/records/${id}`);
    const record = { record_id: data.id, ...data } as AssetRegister;
    return enrichLookupFields([record], 'asset_register')[0];
  }
  static async createAssetRegisterEntry(fields: CreateAssetRegister) {
    return callApi('POST', `/apps/${APP_IDS.ASSET_REGISTER}/records`, { fields: cleanFieldsForApi(fields as any, 'asset_register') });
  }
  static async updateAssetRegisterEntry(id: string, fields: Partial<CreateAssetRegister>) {
    return callApi('PATCH', `/apps/${APP_IDS.ASSET_REGISTER}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'asset_register') });
  }
  static async deleteAssetRegisterEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ASSET_REGISTER}/records/${id}`);
  }

  // --- POLICY_MANAGEMENT ---
  static async getPolicyManagement(): Promise<PolicyManagement[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.POLICY_MANAGEMENT}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as PolicyManagement[];
    return enrichLookupFields(records, 'policy_management');
  }
  static async getPolicyManagementEntry(id: string): Promise<PolicyManagement | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.POLICY_MANAGEMENT}/records/${id}`);
    const record = { record_id: data.id, ...data } as PolicyManagement;
    return enrichLookupFields([record], 'policy_management')[0];
  }
  static async createPolicyManagementEntry(fields: CreatePolicyManagement) {
    return callApi('POST', `/apps/${APP_IDS.POLICY_MANAGEMENT}/records`, { fields: cleanFieldsForApi(fields as any, 'policy_management') });
  }
  static async updatePolicyManagementEntry(id: string, fields: Partial<CreatePolicyManagement>) {
    return callApi('PATCH', `/apps/${APP_IDS.POLICY_MANAGEMENT}/records/${id}`, { fields: cleanFieldsForApi(fields as any, 'policy_management') });
  }
  static async deletePolicyManagementEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.POLICY_MANAGEMENT}/records/${id}`);
  }

}