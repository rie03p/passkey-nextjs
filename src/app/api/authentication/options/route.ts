/**
 * WebAuthn認証用のオプションを生成
 */

import {NextResponse} from 'next/server';
import {generateAuthenticationOptions} from '@simplewebauthn/server';
import {demoUser, rpId} from '@/env';

export async function POST() {
  try {
    // ユーザーの登録済みPasskeyを取得
    const userCredentials = demoUser.credentials;

    // SimpleWebAuthnを使用して認証オプションを生成
    const options = await generateAuthenticationOptions({
      rpID: rpId, // ドメイン名
      // タイムアウト: 60秒（デフォルト）
      timeout: 60_000,
      userVerification: 'preferred',
      // 登録済みのPasskeyを指定（これらのPasskeyのみが認証に使用できる）
      allowCredentials: userCredentials,
    });

    // チャレンジをサーバー側で一時保存（検証時に使用）
    demoUser.currentChallenge = options.challenge;

    // 生成したオプションをフロントエンドに返す
    return NextResponse.json(options);
  } catch (error) {
    console.error('Authentication options generation failed:', error);
    return NextResponse.json(
      {error: 'Failed to generate authentication options'},
      {status: 500},
    );
  }
}
