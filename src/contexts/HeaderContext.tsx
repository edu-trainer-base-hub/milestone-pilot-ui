import React from "react";

export type HeaderContextType = {
  setHeader: (node: React.ReactNode | null) => void;
  setHeaderVisible: (visible: boolean) => void;
};

export const HeaderContext = React.createContext<HeaderContextType | undefined>(undefined);

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
