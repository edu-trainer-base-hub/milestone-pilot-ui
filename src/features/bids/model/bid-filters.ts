import type { BidFilters, OpportunitySource } from "./types";

export function bidFiltersFromParams(params: URLSearchParams): BidFilters {
  const number = (key: string) => (params.get(key)?.trim() ? Number(params.get(key)) : undefined);
  const text = (key: string) => params.get(key) || undefined;
  const list = (key: string) => params.get(key)?.split(",").filter(Boolean);
  return {
    tagUuids: list("tagUuids"),
    tagMatch: params.get("tagMatch") === "ALL" ? "ALL" : "ANY",
    projectManagerUserUuid: text("projectManagerUserUuid"),
    estimatorUserUuid: text("estimatorUserUuid"),
    assignedUserUuid: text("assignedUserUuid"),
    division: text("division"),
    opportunitySources: list("opportunitySources") as OpportunitySource[] | undefined,
    bidSubmittedFrom: text("bidSubmittedFrom"),
    bidSubmittedTo: text("bidSubmittedTo"),
    estimateMinCents: text("estimateMinCents"),
    estimateMaxCents: text("estimateMaxCents"),
    distanceFromMiles: number("distanceFromMiles"),
    distanceToMiles: number("distanceToMiles"),
  };
}
