import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import OrganisationseinheitenPage from '@/pages/OrganisationseinheitenPage';
import AssetRegisterPage from '@/pages/AssetRegisterPage';
import FrameworkVerwaltungPage from '@/pages/FrameworkVerwaltungPage';
import RisikoRegisterPage from '@/pages/RisikoRegisterPage';
import MassnahmenManagementPage from '@/pages/MassnahmenManagementPage';
import KontrollManagementPage from '@/pages/KontrollManagementPage';
import SoaManagementPage from '@/pages/SoaManagementPage';
import AuditManagementPage from '@/pages/AuditManagementPage';
import FindingsAbweichungenPage from '@/pages/FindingsAbweichungenPage';
import IncidentManagementPage from '@/pages/IncidentManagementPage';
import LieferantenmanagementPage from '@/pages/LieferantenmanagementPage';
import PolicyManagementPage from '@/pages/PolicyManagementPage';
import DokumenteEvidenzenPage from '@/pages/DokumenteEvidenzenPage';
import BcmNotfallmanagementPage from '@/pages/BcmNotfallmanagementPage';
import AwarenessSchulungenPage from '@/pages/AwarenessSchulungenPage';
import AufgabenFreigabenPage from '@/pages/AufgabenFreigabenPage';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
              <Route path="organisationseinheiten" element={<OrganisationseinheitenPage />} />
              <Route path="asset-register" element={<AssetRegisterPage />} />
              <Route path="framework-verwaltung" element={<FrameworkVerwaltungPage />} />
              <Route path="risiko-register" element={<RisikoRegisterPage />} />
              <Route path="maßnahmen-management" element={<MassnahmenManagementPage />} />
              <Route path="kontroll-management" element={<KontrollManagementPage />} />
              <Route path="soa-management" element={<SoaManagementPage />} />
              <Route path="audit-management" element={<AuditManagementPage />} />
              <Route path="findings-&-abweichungen" element={<FindingsAbweichungenPage />} />
              <Route path="incident-management" element={<IncidentManagementPage />} />
              <Route path="lieferantenmanagement" element={<LieferantenmanagementPage />} />
              <Route path="policy-management" element={<PolicyManagementPage />} />
              <Route path="dokumente-&-evidenzen" element={<DokumenteEvidenzenPage />} />
              <Route path="bcm-&-notfallmanagement" element={<BcmNotfallmanagementPage />} />
              <Route path="awareness-&-schulungen" element={<AwarenessSchulungenPage />} />
              <Route path="aufgaben-&-freigaben" element={<AufgabenFreigabenPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
