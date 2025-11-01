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
