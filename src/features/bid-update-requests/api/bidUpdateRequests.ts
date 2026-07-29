import { get, post } from "@/services/ApiService";
import type { ApplyUpdateInput, BidUpdateRequest, BidUpdateRequestPage, UpdateRequestStatus } from "../model/types";

const BASE_URL = "/api/v1/tenant/bid-update-requests";

export const getBidUpdateRequests = (
  status: UpdateRequestStatus | undefined,
  bidUuid: string | undefined,
  page: number,
  size: number
): Promise<BidUpdateRequestPage> => get<BidUpdateRequestPage>(BASE_URL, { params: { status, bidUuid, page, size } });
export const getBidUpdateRequest = (uuid: string): Promise<BidUpdateRequest> =>
  get<BidUpdateRequest>(`${BASE_URL}/${uuid}`);
export const applyBidUpdateRequest = (uuid: string, input: ApplyUpdateInput): Promise<BidUpdateRequest> =>
  post<BidUpdateRequest>(`${BASE_URL}/${uuid}/apply`, input);
export const rejectBidUpdateRequest = (uuid: string, version: number): Promise<BidUpdateRequest> =>
  post<BidUpdateRequest>(`${BASE_URL}/${uuid}/reject`, { version });
export const resolveBidCorrelation = (uuid: string, version: number, bidUuid: string): Promise<BidUpdateRequest> =>
  post<BidUpdateRequest>(`${BASE_URL}/${uuid}/resolve-correlation`, { version, bidUuid });
