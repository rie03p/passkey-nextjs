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
import LogViewer from './log';
import {type Log, type registrationVerifyResponse} from '@/types';

type Status = 'idle' | 'registering' | 'authenticating';

export default function PasskeyDemo() {
  // UI状態管理
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('Ready to use passkeys');

  const [dataLogs, setDataLogs] = useState<Log[]>([]);

  // ログにデータを追加するヘルパー関数（Promiseも受け取り可能）
  const addLog = useCallback(async (type: 'request' | 'response', endpoint: string, data: unknown | Promise<unknown>, status?: number) => {
    let resolvedData = data;
    // dataがPromiseの場合は解決し、エラー時はnullを使用
    if (data instanceof Promise) {
      try {
        resolvedData = await data;
      } catch {
        resolvedData = null;
      }
    }

    setDataLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString('ja-JP'),
        type,
        endpoint,
        status,
        data: resolvedData,
      },
    ])
  }, [])

  // Passkeyの登録処理
  const register = useCallback(async () => {
    setStatus('registering');
    setMessage('Generating registration options...');

    try {
      // 1. サーバーから登録用のチャレンジ情報を取得
      const optionsResponse = await fetch('/api/registration/options', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      });

      if (!optionsResponse.ok) {
        await addLog('response', '/api/registration/options', optionsResponse.json(), optionsResponse.status);
        throw new Error('Failed to fetch registration options');
      }

      await addLog('response', '/api/registration/options', optionsResponse.clone().json(), optionsResponse.status);
      setMessage('Waiting for authenticator...');

      // 2. ブラウザのWebAuthn APIで認証器を使って署名を作成
      const options = (await optionsResponse.json()) as PublicKeyCredentialCreationOptionsJSON;
      const attestationResponse = await startRegistration({optionsJSON: options});
      await addLog('response', 'navigator.credentials.create', attestationResponse);

      // 3. サーバーで署名を検証してPasskeyを保存
      const verificationResponse = await fetch('/api/registration/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(attestationResponse satisfies RegistrationResponseJSON),
      });

      await addLog('request', '/api/registration/verify', attestationResponse);

      if (!verificationResponse.ok) {
        await addLog('response', '/api/registration/verify', verificationResponse.json(), verificationResponse.status);
        throw new Error('Failed to verify registration response');
      }

      // 4. 検証結果を確認
      const verification = (await verificationResponse.json()) as registrationVerifyResponse;
      await addLog('response', '/api/registration/verify', verification, verificationResponse.status);

      if (verification.verified) {
        const username = verification.user?.username ?? 'demo user';
        setMessage(`Authenticated as ${username}`);
      } else {
        setMessage('Authentication failed, please try again');
      }
    } catch (error) {
      await addLog('response', '/api/registration/verify', {error: error instanceof Error ? error.message : String(error)});
      setMessage(error instanceof Error ? error.message : 'Registration failed unexpectedly');
    } finally {
      setStatus('idle');
    }
  }, [addLog]);

  // Passkeyでの認証処理
  const authenticate = useCallback(async () => {
    setStatus('authenticating');
    setMessage('Generating authentication options...');

    try {
      // 1. サーバーから認証用のチャレンジ情報を取得
      const optionsResponse = await fetch('/api/authentication/options', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      });

      await addLog('request', '/api/authentication/options', {method: 'POST'});

      if (!optionsResponse.ok) {
        await addLog('response', '/api/authentication/options', optionsResponse.json(), optionsResponse.status);
        throw new Error('Failed to fetch authentication options');
      }

      const options = (await optionsResponse.json()) as PublicKeyCredentialRequestOptionsJSON;
      await addLog('response', '/api/authentication/options', options, optionsResponse.status);
      setMessage('Waiting for authenticator...');

      // 2. ブラウザのWebAuthn APIで保存済みPasskeyを使って署名
      const assertionResponse = await startAuthentication({optionsJSON: options});
      await addLog('response', 'navigator.credentials.get', assertionResponse);

      // 3. サーバーで署名を検証してユーザーを認証
      const verificationResponse = await fetch('/api/authentication/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(assertionResponse satisfies AuthenticationResponseJSON),
      });

      await addLog('request', '/api/authentication/verify', assertionResponse);

      if (!verificationResponse.ok) {
        await addLog('response', '/api/authentication/verify', verificationResponse.json(), verificationResponse.status);
        throw new Error('Failed to verify authentication response');
      }

      // 4. 検証結果を確認
      const verification = (await verificationResponse.json()) as registrationVerifyResponse;
      await addLog('response', '/api/authentication/verify', verification, verificationResponse.status);

      if (verification.verified) {
        const username = verification.user?.username ?? 'demo user';
        setMessage(`Authenticated as ${username}`);
      } else {
        setMessage('Authentication failed, please try again');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      await addLog('response', '/api/authentication/verify', {error: error instanceof Error ? error.message : String(error)});
      setMessage(error instanceof Error ? error.message : 'Authentication failed unexpectedly');
    } finally {
      setStatus('idle');
    }
  }, [addLog]);

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
      <LogViewer logs={dataLogs} onClear={() => setDataLogs([])} />
    </div>
  );
}
