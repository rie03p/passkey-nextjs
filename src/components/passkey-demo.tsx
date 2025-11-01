'use client';

import {useCallback, useState} from 'react';
import {
  type AuthenticationResponseJSON,
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import {type registrationVerifyResponse} from '@/types';

type Status = 'idle' | 'registering' | 'authenticating';

export default function PasskeyDemo() {
  // UI状態管理
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('Ready to use passkeys');

  // Passkeyの登録処理
  const register = useCallback(async () => {
    setStatus('registering');
    setMessage('Generating registration options...');

    try {
      const optionsResponse = await fetch('/api/registration/options', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      });
      if (!optionsResponse.ok) {
        throw new Error('Failed to fetch registration options');
      }

      setMessage('Waiting for authenticator...');

      const options = (await optionsResponse.json()) as PublicKeyCredentialCreationOptionsJSON;
      const attestationResponse = await startRegistration({optionsJSON: options});
      const verificationResponse = await fetch('/api/registration/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(attestationResponse satisfies RegistrationResponseJSON),
      });
      if (!verificationResponse.ok) {
        throw new Error('Failed to verify registration response');
      }

      const verification = (await verificationResponse.json()) as registrationVerifyResponse;

      if (verification.verified) {
        const username = verification.user?.username ?? 'demo user';
        setMessage(`Authenticated as ${username}`);
      } else {
        setMessage('Authentication failed, please try again');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed unexpectedly');
    } finally {
      setStatus('idle');
    }
  }, []);

  // Passkeyでの認証処理
  const authenticate = useCallback(async () => {
    setStatus('authenticating');
    setMessage('Generating authentication options...');

    try {
      const optionsResponse = await fetch('/api/authentication/options', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to fetch authentication options');
      }

      const options = (await optionsResponse.json()) as PublicKeyCredentialRequestOptionsJSON;
      setMessage('Waiting for authenticator...');

      const assertionResponse = await startAuthentication({optionsJSON: options});

      const verificationResponse = await fetch('/api/authentication/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(assertionResponse satisfies AuthenticationResponseJSON),
      });

      if (!verificationResponse.ok) {
        throw new Error('Failed to verify authentication response');
      }

      const verification = (await verificationResponse.json()) as registrationVerifyResponse;

      if (verification.verified) {
        const username = verification.user?.username ?? 'demo user';
        setMessage(`Authenticated as ${username}`);
      } else {
        setMessage('Authentication failed, please try again');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setMessage(error instanceof Error ? error.message : 'Authentication failed unexpectedly');
    } finally {
      setStatus('idle');
    }
  }, []);

  const busy = status !== 'idle';

  return (
    <div className='flex w-full flex-col gap-6'>
      {/* Passkeyの操作ボタン */}
      <div className='flex flex-col items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
        <p className='text-sm text-zinc-600 dark:text-zinc-300'>{message}</p>
        <div className='flex w-full flex-col gap-3 sm:flex-row'>
          {/* Passkey登録ボタン */}
          <button
            type='button'
            onClick={register}
            disabled={busy}
            className='flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400'
          >
            {status === 'registering' ? 'Registering…' : 'Register Passkey'}
          </button>
          {/* Passkey認証ボタン */}
          <button
            type='button'
            onClick={authenticate}
            disabled={busy}
            className='flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400'
          >
            {status === 'authenticating' ? 'Signing in…' : 'Sign in with Passkey'}
          </button>
        </div>
      </div>
    </div>
  );
}
