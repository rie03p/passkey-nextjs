import {type User} from './types.js';

export const rpId = 'localhost';
export const rpName = 'Passkey Demo';
export const origin = 'http://localhost:3000';
export const demoUser: User = {
  id: 'demo-user-id',
  username: 'demo-user@example.com',
  displayName: 'Demo User',
  credentials: [],
  currentChallenge: undefined,
};
