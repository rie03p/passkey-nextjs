import type {WebAuthnCredential} from '@simplewebauthn/server';

export type User = {
  id: string;
  username: string;
  displayName: string;
  currentChallenge?: string;
  credentials: WebAuthnCredential[];
};

export type registrationVerifyResponse = {
  verified: boolean;
  user: User;
};

export type Log = {
  timestamp: string;
  type: 'request' | 'response';
  endpoint: string;
  status?: number;
  data: unknown;
};

