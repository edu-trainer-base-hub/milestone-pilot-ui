import { del, get, patch, post } from "@/services/ApiService";
import type { EmailConnectorResponse, GmailConnectResponse, StartGmailConnectRequest } from "../model/types";

const TENANT_INTEGRATIONS_BASE_URL = "/api/v1/tenant/integrations";

export const startGmailConnect = (request: StartGmailConnectRequest): Promise<GmailConnectResponse> =>
  post<GmailConnectResponse>(`${TENANT_INTEGRATIONS_BASE_URL}/gmail/connect`, request);

export const getEmailConnectors = (): Promise<EmailConnectorResponse[]> =>
  get<EmailConnectorResponse[]>(`${TENANT_INTEGRATIONS_BASE_URL}/email-connectors`);

export const setDefaultEmailConnector = (connectorUuid: string): Promise<EmailConnectorResponse> =>
  patch<EmailConnectorResponse>(`${TENANT_INTEGRATIONS_BASE_URL}/email-connectors/${connectorUuid}/default`);

export const disableEmailConnector = (connectorUuid: string): Promise<EmailConnectorResponse> =>
  patch<EmailConnectorResponse>(`${TENANT_INTEGRATIONS_BASE_URL}/email-connectors/${connectorUuid}/disable`);

export const deleteEmailConnector = (connectorUuid: string): Promise<void> =>
  del<void>(`${TENANT_INTEGRATIONS_BASE_URL}/email-connectors/${connectorUuid}`);
