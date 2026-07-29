import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { HeaderContext, usePageHeader, type PageHeaderConfig } from "./HeaderContext";

function Page() {
  usePageHeader({ title: "Bids" }, []);
  return null;
}

function Host({ show }: { show: boolean }) {
  const [config, setConfig] = useState<PageHeaderConfig | null>(null);
  return (
    <HeaderContext.Provider value={{ setHeader: () => {}, setHeaderVisible: () => {}, setPageHeader: setConfig }}>
      <div data-testid="title">{config ? String(config.title) : "none"}</div>
      {show && <Page />}
    </HeaderContext.Provider>
  );
}

describe("usePageHeader", () => {
  it("publishes on mount and clears on unmount", () => {
    const { rerender } = render(<Host show />);
    expect(screen.getByTestId("title")).toHaveTextContent("Bids");
    rerender(<Host show={false} />);
    expect(screen.getByTestId("title")).toHaveTextContent("none");
  });
  it("does nothing without a provider", () => {
    expect(() => render(<Page />)).not.toThrow();
  });
});
