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
import {
  PlatformUserUpsertPage,
  PlatformUsersPage,
  TenantMembershipsPage,
  TenantsPage,
  TenantUsersPage,
} from "@/features/tenants/pages";

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
          <Route path="settings/tenants" element={<TenantMembershipsPage />} />
          <Route element={<AuthorityRoute authority={Authority.UI_TENANT_USERS_VIEW} />}>
            <Route path="tenant/users" element={<TenantUsersPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.MANAGE_SUBSCRIPTIONS} />}>
            <Route path="subscriptions" element={<SubscriptionPage />} />
          </Route>

          <Route
            element={<AuthorityRoute authority={[Authority.MANAGE_PROFILES, Authority.UI_TENANT_SETTINGS_VIEW]} />}
          >
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.UI_PLATFORM_TENANTS_VIEW} />}>
            <Route path="platform/tenants" element={<TenantsPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.UI_PLATFORM_USERS_VIEW} />}>
            <Route path="platform/users" element={<PlatformUsersPage />} />
            <Route path="platform/users/new" element={<PlatformUserUpsertPage />} />
            <Route path="platform/users/:userId/edit" element={<PlatformUserUpsertPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.UI_TENANT_USERS_VIEW} />}>
            <Route path="platform/tenants/:tenantId/users" element={<TenantUsersPage />} />
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
