import React, { type ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { AppSidebar } from "@/components/sidebar/app-sidebar.tsx";
import { Separator } from "@/components/ui/separator.tsx";
// import { BreadcrumbComponent } from "@/components/BreadcrumbComponent.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector.tsx";
import { ModeToggle } from "@/components/theme/mode-toggle.tsx";
import { HeaderContext } from "@/contexts/HeaderContext";
import { useTelegramHeader } from "@/hooks/useTelegramHeader";

interface LayoutProps {
  children: ReactNode;
}

import { SidebarContextProvider } from "@/contexts/SidebarContext";

const WebLayout: React.FC<LayoutProps> = ({ children }) => {
  const [header, setHeader] = React.useState<React.ReactNode | null>(null);
  const { renderHeaderBlock } = useTelegramHeader();
  const [headerVisible, setHeaderVisible] = React.useState<boolean>(false);

  const ctxValue = React.useMemo(() => ({ setHeader, setHeaderVisible }), [setHeader, setHeaderVisible]);

  return (
    <SidebarContextProvider>
      <HeaderContext.Provider value={ctxValue}>
        <div className="h-svh flex flex-col overflow-hidden">
          {renderHeaderBlock && (
            <div
              style={{ height: 60 }}
              className="w-full flex items-center border-b bg-white/80 dark:bg-slate-900/60 backdrop-blur shrink-0"
            >
              {headerVisible && <div className="w-full max-w-7xl mx-auto px-4">{header}</div>}
            </div>
          )}
          <SidebarProvider className="flex-1 min-h-0">
            <AppSidebar />
            <SidebarInset className="min-h-0">
              <header className="flex h-16 shrink-0 items-center justify-between px-4">
                {/* Left: Sidebar trigger + breadcrumb */}
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                  {/* <BreadcrumbComponent /> */}
                </div>

                {/* Right: Language marker + dropdown */}
                <div className="flex items-center gap-2">
                  <LanguageSelector mode={LanguageSelectorMode.FULL} />
                  <ModeToggle />
                </div>
              </header>
              <main className="flex flex-1 flex-col overflow-auto">{children}</main>
              <Toaster position="top-center" />
            </SidebarInset>
          </SidebarProvider>
        </div>
      </HeaderContext.Provider>
    </SidebarContextProvider>
  );
};

export default WebLayout;
