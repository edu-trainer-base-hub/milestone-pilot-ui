import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { post, registerLogoutFn, registerRefreshFn } from "@/services/ApiService.ts";
import { type LoginResponse, logout as apiLogout, logoutTelegram } from "@/services/AuthService.ts";
import { getMe, type UserProfileDto } from "@/services/ProfileService.ts";
import WebApp from "@twa-dev/sdk";
import { jwtDecode } from "jwt-decode";

export const Authority = {
  MANAGE_PROFILES: "MANAGE_PROFILES",
  MANAGE_SUBSCRIPTIONS: "MANAGE_SUBSCRIPTIONS",
  VIEW_REPORTS: "VIEW_REPORTS",
  UI_PLATFORM_TENANTS_VIEW: "UI_PLATFORM_TENANTS_VIEW",
  UI_PLATFORM_USERS_VIEW: "UI_PLATFORM_USERS_VIEW",
  UI_TENANT_USERS_VIEW: "UI_TENANT_USERS_VIEW",
} as const;

export type Authority = (typeof Authority)[keyof typeof Authority];

const toAuthorities = (arr: string[] | undefined | null): Authority[] => {
  if (!arr) return [];
  const allowed = new Set(Object.values(Authority));
  return arr.filter((a): a is Authority => allowed.has(a as Authority));
};

interface Principal {
  id: string;
  authorities: Authority[];
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileType: "PRIMARY" | "SECONDARY";
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
  doRegister: (email: string, password: string, confirmPassword: string, confirmationCode: string) => Promise<void>;
  doResetPassword: (
    email: string,
    password: string,
    confirmPassword: string,
    confirmationCode: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithTelegram: () => Promise<string>;
  doRefresh: () => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const refresh = async (): Promise<string> => {
    try {
      const { accessToken } = await post<LoginResponse>("/auth/refresh", undefined, { withCredentials: true });
      setToken(accessToken);
      localStorage.setItem("token", accessToken);
      const newPrincipal = await fetchPrincipalData(accessToken);
      setPrincipal(newPrincipal);
      return accessToken;
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

  const doRegister = async (
    email: string,
    password: string,
    confirmPassword: string,
    confirmationCode: string
  ): Promise<void> => {
    const { accessToken } = await post<LoginResponse>("/auth/registration", {
      email,
      emailVerificationCode: confirmationCode,
      password,
      confirmPassword,
      initData: telegramInitDataString,
    });
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
    const newPrincipal = await fetchPrincipalData(accessToken);
    setPrincipal(newPrincipal);
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
    const { accessToken } = await post<LoginResponse>("/auth/login", {
      username: email,
      password,
      initData: telegramInitDataString,
    });
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
    const newPrincipal = await fetchPrincipalData(accessToken);
    setPrincipal(newPrincipal);
  };

  const loginWithTelegram = async (initDataParam?: string | null): Promise<string> => {
    const initData = initDataParam ?? telegramInitDataString;
    const { accessToken } = await post<LoginResponse>("/auth/login/telegram", {
      initData: initData,
    });
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
    const newPrincipal = await fetchPrincipalData(accessToken);
    setPrincipal(newPrincipal);
    return accessToken;
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

      let token = null;
      if (WebApp?.initData) {
        const initDataString = WebApp.initData;
        if (initDataString) {
          setTelegramInitDataString(initDataString);
          try {
            token = await loginWithTelegram(initDataString);
          } catch (e) {
            console.error("AuthProvider useEffect - loginWithTelegram - error", e);
          }
        }
      } else {
        const savedJwt = localStorage.getItem("token");
        if (savedJwt) {
          try {
            token = await refresh();
          } catch (e) {
            console.error("AuthProvider useEffect - refresh savedJwt - error", e);
          }
        }
      }
      if (token) {
        try {
          const newPrincipal = await fetchPrincipalData(token);
          setPrincipal(newPrincipal);
        } catch (e) {
          console.error("AuthProvider useEffect - fetchPrincipalData - error", e);
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
        doRegister,
        doResetPassword,
        login,
        loginWithTelegram,
        doRefresh: refreshFn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const fetchPrincipalData = async (token: string): Promise<Principal> => {
  // We still decode token for authorities if they are not in the profile response or if we prefer token source of truth for authz
  const { sub, authorities } = jwtDecode<{
    sub: string;
    authorities: string[];
  }>(token);

  const profile: UserProfileDto = await getMe();

  return {
    id: sub,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    profileType: profile.profileType,
    authorities: toAuthorities(authorities),
  };
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth should be used within AuthProvider");
  return ctx;
};
