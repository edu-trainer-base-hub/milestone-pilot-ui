import React from "react";

export type PageHeaderConfig = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export type HeaderContextType = {
  setHeader: (node: React.ReactNode | null) => void;
  setHeaderVisible: (visible: boolean) => void;
  setPageHeader?: (config: PageHeaderConfig | null) => void;
};

export const HeaderContext = React.createContext<HeaderContextType | undefined>(undefined);

/**
 * Hook for child pages to publish a title, description and action buttons to the top bar of the web layout.
 * The config is cleared on unmount. Pass memoized `actions` (or stable `deps`) to avoid re-publishing every render.
 *
 * Example usage inside a page component:
 *   usePageHeader({ title: t("bids.title"), description: t("bids.subtitle"), actions }, [t, actions]);
 */
export function usePageHeader(config: PageHeaderConfig, deps: React.DependencyList) {
  const setPageHeader = React.useContext(HeaderContext)?.setPageHeader;

  React.useEffect(() => {
    setPageHeader?.(config);
    return () => setPageHeader?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageHeader, ...deps]);
}

/**
 * Hook for child pages to set custom header content and control visibility of the common header.
 *
 * Example usage inside a page component:
 *   useCustomHeader(<MyHeaderContent />, { visible: true });
 */
export function useCustomHeader(
  content?: React.ReactNode,
  options?: { visible?: boolean; deps?: React.DependencyList }
) {
  const ctx = React.useContext(HeaderContext);
  // If used outside of a layout that provides HeaderContext, do nothing to avoid runtime errors
  if (!ctx) return;

  const { setHeader, setHeaderVisible } = ctx;
  const visible = options?.visible ?? true;
  const deps = options?.deps ?? [content, visible];

  React.useEffect(() => {
    if (visible) {
      setHeader(content ?? null);
      setHeaderVisible(true);
    } else {
      setHeaderVisible(false);
    }
    return () => {
      // Cleanup on unmount or dependency change
      setHeader(null);
      setHeaderVisible(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
