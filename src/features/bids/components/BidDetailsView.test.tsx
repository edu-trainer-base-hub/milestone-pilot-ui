import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeBid } from "../model/bid-test-data";
import { BidDetailsView } from "./BidDetailsView";

describe("BidDetailsView", () => {
  it("renders every detail section and representative values without collapsing fields", () => {
    render(
      <BidDetailsView
        bid={makeBid()}
        tenantUsers={[
          {
            uuid: "22222222-2222-2222-2222-222222222222",
            email: "manager@example.com",
            firstName: "Morgan",
            lastName: "Stone",
            role: "ROLE_TENANT_MANAGER",
          },
        ]}
      />
    );

    [
      "Project and scope",
      "Identifiers and source",
      "Project location",
      "Schedule and milestones",
      "Issuer and primary contact",
      "Submission",
      "Ownership and controls",
      "System record",
    ].forEach((heading) => expect(screen.getByText(heading)).toBeInTheDocument());

    [
      "Central Library Expansion",
      "BP-07",
      "100 Main Street",
      "Jordan Lee",
      "Upload one signed PDF.",
      "Morgan Stone · manager@example.com",
      "33333333-3333-3333-3333-333333333333",
    ].forEach((value) => expect(screen.getByText(value)).toBeInTheDocument());

    expect(screen.getByRole("link", { name: "jordan@example.com" })).toHaveAttribute(
      "href",
      "mailto:jordan@example.com"
    );
    expect(screen.getByRole("link", { name: "https://example.com/submit" })).toHaveAttribute(
      "href",
      "https://example.com/submit"
    );
    expect(screen.getByText("Email parse")).toBeInTheDocument();
  });

  it("shows a dash for every missing value and falls back to an assignee UUID", () => {
    render(
      <BidDetailsView
        bid={makeBid({
          projectDescription: null,
          awardedAt: null,
          assignedToUserUuid: "unresolved-user",
        })}
        tenantUsers={[]}
      />
    );

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("unresolved-user")).toBeInTheDocument();
  });
});
