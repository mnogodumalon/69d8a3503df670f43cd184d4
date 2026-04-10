import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';

const AuditDurchfuehrungPage = lazy(() => import('@/pages/intents/AuditDurchfuehrungPage'));
const RisikoBehandlungPage = lazy(() => import('@/pages/intents/RisikoBehandlungPage'));
const IncidentResponsePage = lazy(() => import('@/pages/intents/IncidentResponsePage'));
import RisikomanagementPage from '@/pages/RisikomanagementPage';
import OrganisationseinheitenPage from '@/pages/OrganisationseinheitenPage';
import SoaManagementPage from '@/pages/SoaManagementPage';
import LieferantenmanagementPage from '@/pages/LieferantenmanagementPage';
import DokumenteEvidenzenPage from '@/pages/DokumenteEvidenzenPage';
import FrameworkVerwaltungPage from '@/pages/FrameworkVerwaltungPage';
import FindingsAbweichungenPage from '@/pages/FindingsAbweichungenPage';
import KontrollManagementPage from '@/pages/KontrollManagementPage';
import AuditManagementPage from '@/pages/AuditManagementPage';
import BcmNotfallmanagementPage from '@/pages/BcmNotfallmanagementPage';
import AufgabenFreigabenPage from '@/pages/AufgabenFreigabenPage';
import AwarenessSchulungenPage from '@/pages/AwarenessSchulungenPage';
import MassnahmenManagementPage from '@/pages/MassnahmenManagementPage';
import IncidentManagementPage from '@/pages/IncidentManagementPage';
import AssetRegisterPage from '@/pages/AssetRegisterPage';
import PolicyManagementPage from '@/pages/PolicyManagementPage';
import PublicFormRisikomanagement from '@/pages/public/PublicForm_Risikomanagement';
import PublicFormOrganisationseinheiten from '@/pages/public/PublicForm_Organisationseinheiten';
import PublicFormSoaManagement from '@/pages/public/PublicForm_SoaManagement';
import PublicFormLieferantenmanagement from '@/pages/public/PublicForm_Lieferantenmanagement';
import PublicFormDokumenteEvidenzen from '@/pages/public/PublicForm_DokumenteEvidenzen';
import PublicFormFrameworkVerwaltung from '@/pages/public/PublicForm_FrameworkVerwaltung';
import PublicFormFindingsAbweichungen from '@/pages/public/PublicForm_FindingsAbweichungen';
import PublicFormKontrollManagement from '@/pages/public/PublicForm_KontrollManagement';
import PublicFormAuditManagement from '@/pages/public/PublicForm_AuditManagement';
import PublicFormBcmNotfallmanagement from '@/pages/public/PublicForm_BcmNotfallmanagement';
import PublicFormAufgabenFreigaben from '@/pages/public/PublicForm_AufgabenFreigaben';
import PublicFormAwarenessSchulungen from '@/pages/public/PublicForm_AwarenessSchulungen';
import PublicFormMassnahmenManagement from '@/pages/public/PublicForm_MassnahmenManagement';
import PublicFormIncidentManagement from '@/pages/public/PublicForm_IncidentManagement';
import PublicFormAssetRegister from '@/pages/public/PublicForm_AssetRegister';
import PublicFormPolicyManagement from '@/pages/public/PublicForm_PolicyManagement';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route path="public/69d8a2cdd093755ffa3afc64" element={<PublicFormRisikomanagement />} />
            <Route path="public/69d8a2bd7fcebae2f20488a9" element={<PublicFormOrganisationseinheiten />} />
            <Route path="public/69d8a2d1b9410dcb1cfce862" element={<PublicFormSoaManagement />} />
            <Route path="public/69d8a2d5e0de8095025ba835" element={<PublicFormLieferantenmanagement />} />
            <Route path="public/69d8a2d8de900d41e8ede84c" element={<PublicFormDokumenteEvidenzen />} />
            <Route path="public/69d8a2cd0daaa949d5a3a850" element={<PublicFormFrameworkVerwaltung />} />
            <Route path="public/69d8a2d39905f4b7f9d2f78c" element={<PublicFormFindingsAbweichungen />} />
            <Route path="public/69d8a2d0445d7fa47b771835" element={<PublicFormKontrollManagement />} />
            <Route path="public/69d8a2d2fba494205d4c094b" element={<PublicFormAuditManagement />} />
            <Route path="public/69d8a2d9b9e5933137ed98cb" element={<PublicFormBcmNotfallmanagement />} />
            <Route path="public/69d8a2db27f833de3dc9a839" element={<PublicFormAufgabenFreigaben />} />
            <Route path="public/69d8a2daf82a6e90d0765807" element={<PublicFormAwarenessSchulungen />} />
            <Route path="public/69d8a2cf04326e3426341859" element={<PublicFormMassnahmenManagement />} />
            <Route path="public/69d8a2d45f729875c036a830" element={<PublicFormIncidentManagement />} />
            <Route path="public/69d8a2cb92e804d39a7888eb" element={<PublicFormAssetRegister />} />
            <Route path="public/69d8a2d7cc4d6bfd1a9a28df" element={<PublicFormPolicyManagement />} />
            <Route element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="intents/audit-durchfuehrung" element={<Suspense fallback={null}><AuditDurchfuehrungPage /></Suspense>} />
              <Route path="intents/risiko-behandlung" element={<Suspense fallback={null}><RisikoBehandlungPage /></Suspense>} />
              <Route path="intents/incident-response" element={<Suspense fallback={null}><IncidentResponsePage /></Suspense>} />
              <Route path="risikomanagement" element={<RisikomanagementPage />} />
              <Route path="organisationseinheiten" element={<OrganisationseinheitenPage />} />
              <Route path="soa-management" element={<SoaManagementPage />} />
              <Route path="lieferantenmanagement" element={<LieferantenmanagementPage />} />
              <Route path="dokumente-&-evidenzen" element={<DokumenteEvidenzenPage />} />
              <Route path="framework-verwaltung" element={<FrameworkVerwaltungPage />} />
              <Route path="findings-&-abweichungen" element={<FindingsAbweichungenPage />} />
              <Route path="kontroll-management" element={<KontrollManagementPage />} />
              <Route path="audit-management" element={<AuditManagementPage />} />
              <Route path="bcm-&-notfallmanagement" element={<BcmNotfallmanagementPage />} />
              <Route path="aufgaben-&-freigaben" element={<AufgabenFreigabenPage />} />
              <Route path="awareness-&-schulungen" element={<AwarenessSchulungenPage />} />
              <Route path="maßnahmen-management" element={<MassnahmenManagementPage />} />
              <Route path="incident-management" element={<IncidentManagementPage />} />
              <Route path="asset-register" element={<AssetRegisterPage />} />
              <Route path="policy-management" element={<PolicyManagementPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
