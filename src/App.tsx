import CommonLayout from "@/layout/CommonLayout.tsx";
import DefaultLayout from "@/layout/DefaultLayout.tsx";
import ResetPasswordPage from "@/pages/login/ResetPasswordPage.tsx";
import LoginPage from "@/pages/login/LoginPage.tsx";
import PrivateRoute from "@/components/PrivateRoute.tsx";
import WebLayout from "./layout/WebLayout.tsx";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import SettingsPage from "@/pages/SettingsPage.tsx";
import SubscriptionPage from "@/pages/subscriptions/SubscriptionPage.tsx";
import AuthorityRoute from "@/components/AuthorityRoute.tsx";
import { Authority } from "@/contexts/AuthContext.tsx";
import { PlatformUserUpsertPage } from "@/features/platform-users/pages/PlatformUserUpsertPage";
import { PlatformUsersPage } from "@/features/platform-users/pages/PlatformUsersPage";
import { TenantsPage } from "@/features/tenant-management/pages/TenantsPage";
import { TenantUsersPage } from "@/features/tenant-users/pages/TenantUsersPage";
import { EmailIntegrationsPage } from "@/features/tenant-email-connectors/pages/EmailIntegrationsPage";
import { EmailParsingLabPage } from "@/features/email-parsing-lab/pages/EmailParsingLabPage";
import FeatureFlagRoute from "@/components/FeatureFlagRoute";
import { FeatureFlag } from "@/services/FeatureFlagService";
import { WorkspaceMembershipsPage } from "@/features/workspaces/pages/WorkspaceMembershipsPage";

import { usePageTitle } from "@/hooks/usePageTitle.ts";

export default function App() {
  usePageTitle();
  return (
    <Routes>
      <Route
        path="password/reset"
        element={
          <DefaultLayout>
            <ResetPasswordPage />
          </DefaultLayout>
        }
      />
      <Route
        path="login"
        element={
          <DefaultLayout>
            <LoginPage />
          </DefaultLayout>
        }
      />
      <Route
        path="telegram/login"
        element={
          <DefaultLayout>
            <LoginPage />
          </DefaultLayout>
        }
      />
      <Route
        element={
          <WebLayout>
            <Outlet />
          </WebLayout>
        }
      >
        <Route path="/" element={<div className="p-8 text-2xl font-bold">Вітаємо у Milestone Pilot!</div>} />

        <Route element={<PrivateRoute />}>
          <Route path="settings/workspaces" element={<WorkspaceMembershipsPage />} />

          <Route element={<AuthorityRoute authority={Authority.MANAGE_SUBSCRIPTIONS} />}>
            <Route path="subscriptions" element={<SubscriptionPage />} />
          </Route>

          <Route
            element={<AuthorityRoute authority={[Authority.MANAGE_PROFILES, Authority.UI_TENANT_SETTINGS_VIEW]} />}
          >
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            element={
              <AuthorityRoute
                authority={[Authority.PLATFORM_TENANTS_READ]}
                allAuthorities={[Authority.UI_PLATFORM_TENANTS_VIEW]}
              />
            }
          >
            <Route path="platform/tenants" element={<TenantsPage />} />
          </Route>

          <Route
            element={
              <AuthorityRoute
                authority={[Authority.PLATFORM_ADMINS_READ, Authority.PLATFORM_MANAGERS_READ]}
                allAuthorities={[Authority.UI_PLATFORM_USERS_VIEW]}
              />
            }
          >
            <Route path="platform/users" element={<PlatformUsersPage />} />
          </Route>

          <Route
            element={
              <AuthorityRoute
                authority={[Authority.PLATFORM_ADMINS_CREATE, Authority.PLATFORM_MANAGERS_CREATE]}
                allAuthorities={[Authority.UI_PLATFORM_USERS_VIEW]}
              />
            }
          >
            <Route path="platform/users/new" element={<PlatformUserUpsertPage />} />
          </Route>

          <Route
            element={
              <AuthorityRoute
                authority={[Authority.PLATFORM_ADMINS_READ, Authority.PLATFORM_MANAGERS_READ]}
                allAuthorities={[Authority.UI_PLATFORM_USERS_VIEW]}
              />
            }
          >
            <Route path="platform/users/:userId/edit" element={<PlatformUserUpsertPage />} />
          </Route>

          <Route
            element={
              <AuthorityRoute
                authority={[Authority.TENANT_ADMINS_READ, Authority.TENANT_MANAGERS_READ, Authority.TENANT_USERS_READ]}
                allAuthorities={[Authority.UI_TENANT_USERS_VIEW]}
              />
            }
          >
            <Route path="tenant/users" element={<TenantUsersPage />} />
            <Route path="platform/tenants/:tenantId/users" element={<TenantUsersPage />} />
          </Route>

          <Route
            element={
              <AuthorityRoute
                authority={[Authority.TENANT_INTEGRATIONS_READ]}
                allAuthorities={[Authority.UI_TENANT_INTEGRATIONS_VIEW]}
              />
            }
          >
            <Route path="tenant/integrations/email" element={<EmailIntegrationsPage />} />
            <Route element={<FeatureFlagRoute flag={FeatureFlag.EMAIL_PARSING_LAB} />}>
              <Route path="tenant/integrations/email-parsing-lab" element={<EmailParsingLabPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route element={<CommonLayout />}>
        <Route path="/about" element={<h1 className="text-2xl">About Page</h1>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
