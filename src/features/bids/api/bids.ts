import { get, patch, post } from "@/services/ApiService";
import type {
  Bid,
  BidActivityFilters,
  BidActivityPage,
  BidAudit,
  BidAuditFilters,
  BidAuditPage,
  BidDashboard,
  BidFilters,
  BidPage,
  BidStatus,
  BidSourceEmail,
  BidSourceEmailPage,
  CreateBidInput,
  UpdateBidInput,
} from "../model/types";

const BASE_URL = "/api/v1/tenant/bids";

const params = (filters: BidFilters) => ({
  ...filters,
  statuses: filters.statuses?.join(","),
  priorities: filters.priorities?.join(","),
  reviewStatuses: filters.reviewStatuses?.join(","),
});

export const getBids = (filters: BidFilters): Promise<BidPage> => get<BidPage>(BASE_URL, { params: params(filters) });
export const getBid = (uuid: string): Promise<Bid> => get<Bid>(`${BASE_URL}/${uuid}`);
export const getBidDashboard = (): Promise<BidDashboard> => get<BidDashboard>(`${BASE_URL}/dashboard`);
export const createBid = (input: CreateBidInput): Promise<Bid> => post<Bid>(BASE_URL, input);
export const updateBid = (uuid: string, input: UpdateBidInput): Promise<Bid> =>
  patch<Bid>(`${BASE_URL}/${uuid}`, input);
export const transitionBid = (uuid: string, version: number, status: BidStatus): Promise<Bid> =>
  post<Bid>(`${BASE_URL}/${uuid}/transitions`, { version, status });
export const getBidTimeline = (uuid: string, filters: BidActivityFilters = {}): Promise<BidActivityPage> =>
  get<BidActivityPage>(`${BASE_URL}/${uuid}/timeline`, { params: filters });
export const getBidAudit = (uuid: string, filters: BidAuditFilters = {}): Promise<BidAuditPage> =>
  get<BidAuditPage>(`${BASE_URL}/${uuid}/audit`, { params: filters });
export const getBidAuditDetail = (uuid: string, auditId: number): Promise<BidAudit> =>
  get<BidAudit>(`${BASE_URL}/${uuid}/audit/${auditId}`);
export const getBidSourceEmails = (uuid: string, page = 0, size = 20): Promise<BidSourceEmailPage> =>
  get<BidSourceEmailPage>(`${BASE_URL}/${uuid}/source-emails`, { params: { page, size } });
export const getBidSourceEmail = (uuid: string, sourceEmailUuid: string): Promise<BidSourceEmail> =>
  get<BidSourceEmail>(`${BASE_URL}/${uuid}/source-emails/${sourceEmailUuid}`);
