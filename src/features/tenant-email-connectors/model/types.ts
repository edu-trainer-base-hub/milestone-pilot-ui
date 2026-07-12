export const EmailProvider = {
  GMAIL: "GMAIL",
} as const;

export type EmailProvider = (typeof EmailProvider)[keyof typeof EmailProvider];

export const GmailScopeMode = {
  GMAIL_READONLY: "GMAIL_READONLY",
  GMAIL_MODIFY: "GMAIL_MODIFY",
} as const;

export type GmailScopeMode = (typeof GmailScopeMode)[keyof typeof GmailScopeMode];

export const EmailConnectorStatus = {
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  ERROR: "ERROR",
  DISABLED: "DISABLED",
} as const;

export type EmailConnectorStatus = (typeof EmailConnectorStatus)[keyof typeof EmailConnectorStatus];

export interface EmailConnectorResponse {
  uuid: string;
  provider: EmailProvider;
  displayName: string;
  emailAddress: string;
  scopeMode: GmailScopeMode;
  status: EmailConnectorStatus;
  default: boolean;
  lastConnectedAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
}

export interface StartGmailConnectRequest {
  scopeMode: GmailScopeMode;
  redirectAfterConnect: string;
}

export interface GmailConnectResponse {
  authorizationUrl: string;
}
