import React from "react";
import { Outlet } from "react-router";

import { HeaderContext } from "@/contexts/HeaderContext";
export { useCustomHeader } from "@/contexts/HeaderContext";

import { useTelegramHeader } from "@/hooks/useTelegramHeader";

const CommonLayout: React.FC = () => {
  const [header, setHeader] = React.useState<React.ReactNode | null>(null);
  const { renderHeaderBlock } = useTelegramHeader();
  const [headerVisible, setHeaderVisible] = React.useState<boolean>(false);

  const ctxValue = React.useMemo(() => ({ setHeader, setHeaderVisible }), [setHeader, setHeaderVisible]);

  return (
    <HeaderContext.Provider value={ctxValue}>
      {renderHeaderBlock && (
        <div
          style={{ height: 60 }}
          className="w-full flex items-center border-b bg-white/80 dark:bg-slate-900/60 backdrop-blur"
        >
          {headerVisible && <div className="w-full max-w-7xl mx-auto px-4">{header}</div>}
        </div>
      )}
      <Outlet />
    </HeaderContext.Provider>
  );
};

export default CommonLayout;
