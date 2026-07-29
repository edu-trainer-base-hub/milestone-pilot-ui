import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RelatedLinks } from "./RelatedLinks";

describe("Related links", () => {
  it("preserves multiline notes and only linkifies HTTP(S) URLs", () => {
    const { container } = render(
      <RelatedLinks
        value={"Plans: https://example.com/plans.\nScope notes\nhttp://example.com/scope\njavascript:alert(1)"}
      />
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "https://example.com/plans" })).toHaveAttribute(
      "href",
      "https://example.com/plans"
    );
    expect(container.textContent).toBe(
      "Plans: https://example.com/plans.\nScope notes\nhttp://example.com/scope\njavascript:alert(1)"
    );
  });
});
