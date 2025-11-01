/**
 * WebAuthn登録用のオプションを生成する
 */

import {generateRegistrationOptions} from '@simplewebauthn/server';
import {NextResponse} from 'next/server';
import {demoUser, rpId, rpName} from '@/env';

export async function POST() {
  try {
    // デモだから固定ユーザー
    const user = demoUser;

    // https://simplewebauthn.dev/docs/packages/server#1-generate-registration-options
    const options = await generateRegistrationOptions({
      rpName,
      rpID: rpId,
      userName: user.username,
      userDisplayName: user.displayName,
      timeout: 60_000,
      attestationType: 'none',
      // 既存の認証を除外するために使用
      excludeCredentials: [],
      // 認証器の選択基準
      authenticatorSelection: {
        // default
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // ユーザー向けにこれらのオプションを記録しておく
    // データベースやセッションストレージを使用すべき
    user.currentChallenge = options.challenge;

    return NextResponse.json(options);
  } catch (error) {
    console.error('Registration options generation failed:', error);
    return NextResponse.json(
      {error: 'Failed to generate registration options'},
      {status: 500},
    );
  }
}
