import React, { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextType {
  sidebarContent: ReactNode | null;
  setSidebarContent: (content: ReactNode | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null);

  return <SidebarContext.Provider value={{ sidebarContent, setSidebarContent }}>{children}</SidebarContext.Provider>;
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarContextProvider");
  }
  return context;
};

// Helper hook for pages to set content easily
export const useSidebarContent = (content: ReactNode | null) => {
  const { setSidebarContent } = useSidebarContext();

  React.useEffect(() => {
    setSidebarContent(content);
    return () => setSidebarContent(null); // Cleanup on unmount
  }, [content, setSidebarContent]);
};
