import { Outlet, Route, Routes } from "react-router";
import RabbitJumpX9 from "./pages/jumping-rabbit/JumpingRabbit.tsx";
import { MultiplicationTrainerPage } from "@/features/multiplication-trainer";
import { CompareNumbersTrainerPage } from "@/features/compare-numbers-trainer";
import { RoundingTrainerPage } from "@/features/rounding-trainer";
import { AddSubTrainerPage } from "@/features/add-sub-trainer";
import CommonLayout from "@/layout/CommonLayout.tsx";
import RegistrationPage from "@/pages/login/RegistrationPage.tsx";
import DefaultLayout from "@/layout/DefaultLayout.tsx";
import ResetPasswordPage from "@/pages/login/ResetPasswordPage.tsx";
import LoginPage from "@/pages/login/LoginPage.tsx";
import PrivateRoute from "@/components/PrivateRoute.tsx";
import WebLayout from "./layout/WebLayout.tsx";
import { Navigate } from "react-router-dom";
import SettingsPage from "@/pages/SettingsPage.tsx";
import SubscriptionPage from "@/pages/subscriptions/SubscriptionPage.tsx";
import AuthorityRoute from "@/components/AuthorityRoute.tsx";
import { Authority } from "@/contexts/AuthContext.tsx";
import SecondaryProfilesPage from "@/pages/profiles/SecondaryProfilesPage.tsx";
import CreateSecondaryProfilePage from "@/pages/profiles/CreateSecondaryProfilePage.tsx";
import EditSecondaryProfilePage from "@/pages/profiles/EditSecondaryProfilePage.tsx";
import EnglishCoachPage from "@/pages/EnglishCoachPage.tsx";
import { TenantsPage, TenantUsersPage } from "@/features/tenants/pages";

import { usePageTitle } from "@/hooks/usePageTitle.ts";

export default function App() {
  usePageTitle();
  return (
    <Routes>
      <Route
        path="register"
        element={
          <DefaultLayout>
            <RegistrationPage />
          </DefaultLayout>
        }
      />
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
        <Route
          path="/"
          element={<div className="p-8 text-2xl font-bold">Вітаємо у Milestone Pilot!</div>}
        />

        <Route element={<PrivateRoute />}>
          <Route element={<AuthorityRoute authority={Authority.MANAGE_SUBSCRIPTIONS} />}>
            <Route path="subscriptions" element={<SubscriptionPage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.MANAGE_PROFILES} />}>
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/profiles" element={<SecondaryProfilesPage />} />
            <Route path="settings/profiles/create" element={<CreateSecondaryProfilePage />} />
            <Route path="settings/profiles/:id/edit" element={<EditSecondaryProfilePage />} />
          </Route>

          <Route element={<AuthorityRoute authority={Authority.ENGLISH_COACH_OPENAI} />}>
            <Route path="english-coach" element={<EnglishCoachPage />} />
          </Route>

          <Route
            element={
              <AuthorityRoute
                authority={[Authority.ROLE_PLATFORM_ADMIN, Authority.ROLE_PLATFORM_MANAGER]}
              />
            }
          >
            <Route path="tenants" element={<TenantsPage />} />
          </Route>

          <Route
            element={
              <AuthorityRoute
                authority={[
                  Authority.ROLE_PLATFORM_ADMIN,
                  Authority.ROLE_PLATFORM_MANAGER,
                  Authority.ROLE_TENANT_ADMIN,
                  Authority.ROLE_TENANT_MANAGER,
                ]}
              />
            }
          >
            <Route path="tenants/:tenantId/users" element={<TenantUsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<CommonLayout />}>
        <Route path="/about" element={<h1 className="text-2xl">About Page</h1>} />
        <Route path="/multiplication-trainer" element={<MultiplicationTrainerPage />} />
        <Route path="/multiplication-rabbit" element={<RabbitJumpX9 />} />
        <Route path="/compare-numbers" element={<CompareNumbersTrainerPage />} />
        <Route path="/rounding-trainer" element={<RoundingTrainerPage />} />
        <Route path="/add-sub-trainer" element={<AddSubTrainerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
