export const fields = [
  "division",
  "bidSubmittedFrom",
  "bidSubmittedTo",
  "estimateMinCents",
  "estimateMaxCents",
  "distanceFromMiles",
  "distanceToMiles",
] as const;
export const filterKeys = [
  ...fields,
  "tagUuids",
  "tagMatch",
  "projectManagerUserUuid",
  "estimatorUserUuid",
  "assignedUserUuid",
  "opportunitySources",
];

export function countActiveFilters(params: URLSearchParams) {
  return filterKeys.filter((key) => key !== "tagMatch" && params.has(key)).length;
}
