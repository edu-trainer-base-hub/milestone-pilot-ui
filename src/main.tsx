import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "./i18n";
import WebApp from "@twa-dev/sdk";
import { AuthProvider } from "@/contexts/AuthContext.tsx";
import { ThemeProvider } from "@/components/theme/theme-provider.tsx";

WebApp.ready();

const raw = import.meta.env.VITE_UI_BASE_ENV_PATH || "/";
const basename = raw === "/" ? undefined : raw.replace(/\/+$/, ""); // no trailing slash

const qc = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="et-ui-theme">
            <App />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
