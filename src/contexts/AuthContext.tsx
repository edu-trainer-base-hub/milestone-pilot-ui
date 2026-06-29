import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { post, registerLogoutFn, registerRefreshFn } from "@/services/ApiService.ts";
import { type LoginResponse, logout as apiLogout, logoutTelegram } from "@/services/AuthService.ts";
import { getMe, type UserProfileDto } from "@/services/ProfileService.ts";
import {
  type Workspace,
  type WorkspaceContextType,
  WorkspaceContextType as WorkspaceContextTypeValue,
  getWorkspaceLabel,
  getWorkspaceTenantUuid,
} from "@/features/tenants/types";
import { switchWorkspace as switchWorkspaceRequest } from "@/features/tenants/api";
import WebApp from "@twa-dev/sdk";
import { jwtDecode } from "jwt-decode";

export const Authority = {
  MANAGE_PROFILES: "MANAGE_PROFILES",
  MANAGE_SUBSCRIPTIONS: "MANAGE_SUBSCRIPTIONS",
  VIEW_REPORTS: "VIEW_REPORTS",
  UI_PLATFORM_TENANTS_VIEW: "UI_PLATFORM_TENANTS_VIEW",
  UI_PLATFORM_USERS_VIEW: "UI_PLATFORM_USERS_VIEW",
  UI_TENANT_USERS_VIEW: "UI_TENANT_USERS_VIEW",
  UI_TENANT_SETTINGS_VIEW: "UI_TENANT_SETTINGS_VIEW",
  PLATFORM_TENANTS_CREATE: "PLATFORM_TENANTS_CREATE",
  PLATFORM_TENANTS_READ: "PLATFORM_TENANTS_READ",
  PLATFORM_TENANTS_UPDATE: "PLATFORM_TENANTS_UPDATE",
  PLATFORM_ADMINS_CREATE: "PLATFORM_ADMINS_CREATE",
  PLATFORM_ADMINS_READ: "PLATFORM_ADMINS_READ",
  PLATFORM_ADMINS_UPDATE: "PLATFORM_ADMINS_UPDATE",
  PLATFORM_MANAGERS_CREATE: "PLATFORM_MANAGERS_CREATE",
  PLATFORM_MANAGERS_READ: "PLATFORM_MANAGERS_READ",
  PLATFORM_MANAGERS_UPDATE: "PLATFORM_MANAGERS_UPDATE",
  TENANT_ADMINS_CREATE: "TENANT_ADMINS_CREATE",
  TENANT_ADMINS_READ: "TENANT_ADMINS_READ",
  TENANT_ADMINS_UPDATE: "TENANT_ADMINS_UPDATE",
  TENANT_MANAGERS_CREATE: "TENANT_MANAGERS_CREATE",
  TENANT_MANAGERS_READ: "TENANT_MANAGERS_READ",
  TENANT_MANAGERS_UPDATE: "TENANT_MANAGERS_UPDATE",
  TENANT_USERS_CREATE: "TENANT_USERS_CREATE",
  TENANT_USERS_READ: "TENANT_USERS_READ",
  TENANT_USERS_UPDATE: "TENANT_USERS_UPDATE",
} as const;

export type Authority = (typeof Authority)[keyof typeof Authority];

const toAuthorities = (arr: string[] | undefined | null): Authority[] => {
  if (!arr) return [];
  const allowed = new Set(Object.values(Authority));
  return arr.filter((a): a is Authority => allowed.has(a as Authority));
};

export interface Principal {
  id: string;
  authorities: Authority[];
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileType: "PRIMARY" | "SECONDARY";
  contextType: WorkspaceContextType;
  activeTenantUuid: string | null;
  activeRole: string | null;
  activeWorkspaceName: string | null;
  availableWorkspaces: Workspace[];
}

export const EmailVerificationType = {
  EMAIL_VERIFICATION_CODE_WEB: "EMAIL_VERIFICATION_CODE_WEB",
  PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB: "PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB",
} as const;

export type EmailVerificationType = (typeof EmailVerificationType)[keyof typeof EmailVerificationType];

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  principal: Principal | null;
  isTelegram: boolean;
  sendConfirmationCode: (email: string, verificationCodeType: EmailVerificationType) => Promise<void>;
  doResetPassword: (
    email: string,
    password: string,
    confirmPassword: string,
    confirmationCode: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithTelegram: () => Promise<string>;
  doRefresh: () => Promise<string>;
  switchWorkspace: (contextType: WorkspaceContextType, tenantUuid?: string | null) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DecodedAccessToken {
  sub: string;
  authorities?: string[];
  contextType?: WorkspaceContextType;
  activeTenantUuid?: string;
  activeRole?: string;
}

interface WorkspaceSessionState {
  contextType: WorkspaceContextType;
  activeTenantUuid: string | null;
  activeRole: string | null;
  activeWorkspaceName: string | null;
  availableWorkspaces: Workspace[];
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const didInit = useRef(false);
  const [initDone, setInitDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [telegramInitDataString, setTelegramInitDataString] = useState<string | null>(null);

  useEffect(() => {
    registerRefreshFn(refreshFn);
    registerLogoutFn(logoutFn);
  });

  const refreshFn = async (): Promise<string> => {
    if (telegramInitDataString) {
      return await loginWithTelegram();
    } else {
      return await refresh();
    }
  };

  const logoutFn = async (): Promise<void> => {
    apiLogout().catch((e) => console.error("Logout error", e));
    setToken(null);
    setPrincipal(null);
    localStorage.removeItem("token");
  };

  const applyAuthenticatedSession = async (session: LoginResponse): Promise<Principal> => {
    const { accessToken } = session;

    setToken(accessToken);
    localStorage.setItem("token", accessToken);

    const newPrincipal = await fetchPrincipalData(accessToken, session);
    setPrincipal(newPrincipal);

    return newPrincipal;
  };

  const refresh = async (): Promise<string> => {
    try {
      const session = await post<LoginResponse>("/auth/refresh", undefined, { withCredentials: true });
      await applyAuthenticatedSession(session);
      return session.accessToken;
    } catch (e) {
      console.error("AuthProvider Refresh - error", e);
      throw e;
    }
  };

  const sendConfirmationCode = async (email: string, verificationCodeType: EmailVerificationType): Promise<void> => {
    await post<LoginResponse>("/auth/email/verification/send", {
      email,
      verificationCodeType,
      initData: telegramInitDataString,
    });
  };

  const doResetPassword = async (
    email: string,
    password: string,
    confirmPassword: string,
    confirmationCode: string
  ): Promise<void> => {
    await post<LoginResponse>("/auth/password/reset", {
      email,
      emailVerificationCode: confirmationCode,
      password,
      confirmPassword,
      initData: telegramInitDataString,
    });
  };

  const login = async (email: string, password: string): Promise<void> => {
    const session = await post<LoginResponse>("/auth/login", {
      username: email,
      password,
      initData: telegramInitDataString,
    });
    await applyAuthenticatedSession(session);
  };

  const loginWithTelegram = async (initDataParam?: string | null): Promise<string> => {
    const initData = initDataParam ?? telegramInitDataString;
    const session = await post<LoginResponse>("/auth/login/telegram", {
      initData: initData,
    });
    await applyAuthenticatedSession(session);
    return session.accessToken;
  };

  const switchWorkspace = async (contextType: WorkspaceContextType, tenantUuid?: string | null): Promise<void> => {
    const session = await switchWorkspaceRequest({ contextType, tenantUuid });
    await applyAuthenticatedSession(session);
  };

  const logout = () => {
    // Call backend logout
    if (telegramInitDataString) {
      logoutTelegram(telegramInitDataString).catch((e) => console.error("Logout Telegram error", e));
    } else {
      apiLogout().catch((e) => console.error("Logout error", e));
    }

    setToken(null);
    setPrincipal(null);
    localStorage.removeItem("token");
    // Close WebApp in Telegram
    /*if (window && window.Telegram && window.Telegram.WebApp) {
          WebApp.close();
        }*/
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const init = async () => {
      setInitDone(false);
      if (WebApp) {
        WebApp.ready();
      }

      if (WebApp?.initData) {
        const initDataString = WebApp.initData;
        if (initDataString) {
          setTelegramInitDataString(initDataString);
          try {
            await loginWithTelegram(initDataString);
          } catch (e) {
            console.error("AuthProvider useEffect - loginWithTelegram - error", e);
          }
        }
      } else {
        const savedJwt = localStorage.getItem("token");
        if (savedJwt) {
          try {
            await refresh();
          } catch (e) {
            console.error("AuthProvider useEffect - refresh savedJwt - error", e);
          }
        }
      }
      setInitDone(true);
    };
    init();
  });

  if (!initDone) {
    return <div className="flex items-center justify-center h-screen">Loading…</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: Boolean(token),
        principal,
        isTelegram: Boolean(telegramInitDataString),
        sendConfirmationCode,
        doResetPassword,
        login,
        loginWithTelegram,
        doRefresh: refreshFn,
        switchWorkspace,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const fetchPrincipalData = async (token: string, session?: LoginResponse): Promise<Principal> => {
  const claims = jwtDecode<DecodedAccessToken>(token);
  const profile: UserProfileDto = await getMe();
  const workspaceSession = resolveWorkspaceSession(session, claims);

  return {
    id: claims.sub,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    profileType: profile.profileType,
    authorities: toAuthorities(claims.authorities),
    contextType: workspaceSession.contextType,
    activeTenantUuid: workspaceSession.activeTenantUuid,
    activeRole: workspaceSession.activeRole,
    activeWorkspaceName: workspaceSession.activeWorkspaceName,
    availableWorkspaces: workspaceSession.availableWorkspaces,
  };
};

const resolveWorkspaceSession = (
  session: LoginResponse | undefined,
  claims: DecodedAccessToken
): WorkspaceSessionState => normalizeWorkspaceSession(session, claims);

const normalizeWorkspaceSession = (
  session: LoginResponse | undefined,
  claims: DecodedAccessToken
): WorkspaceSessionState => {
  const availableWorkspaces = (session?.availableWorkspaces ?? []).map((workspace) => ({
    ...workspace,
    tenantUuid: getWorkspaceTenantUuid(workspace),
    tenantId: workspace.tenantId ?? workspace.tenantUuid ?? null,
    tenantName: getWorkspaceLabel(workspace),
    isActive: workspace.isActive ?? workspace.activeWorkspace ?? false,
    isDefault: workspace.isDefault ?? workspace.defaultWorkspace ?? workspace.defaultTenant ?? false,
  }));

  const contextType = session?.contextType ?? claims.contextType ?? WorkspaceContextTypeValue.PLATFORM;
  const activeTenantUuid = session?.activeTenantUuid ?? claims.activeTenantUuid ?? null;
  const activeWorkspace =
    availableWorkspaces.find((workspace) =>
      workspace.contextType === WorkspaceContextTypeValue.PLATFORM
        ? contextType === WorkspaceContextTypeValue.PLATFORM
        : workspace.tenantUuid === activeTenantUuid
    ) ?? null;

  return {
    contextType,
    activeTenantUuid,
    activeRole: session?.activeRole ?? claims.activeRole ?? activeWorkspace?.role ?? null,
    activeWorkspaceName: activeWorkspace?.tenantName ?? null,
    availableWorkspaces,
  };
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth should be used within AuthProvider");
  return ctx;
};
