/**
 * ブラウザから navigator.credentials.get() の結果を受け取り、
 * サーバー側で検証してユーザーを認証
 */

import {type NextRequest, NextResponse} from 'next/server';
import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import {demoUser, rpId} from '@/env';

export async function POST(request: NextRequest) {
  try {
    if (!demoUser.currentChallenge) {
      return NextResponse.json(
        {error: 'No authentication challenge found. Please request authentication options first.'},
        {status: 400},
      );
    }

    const body = (await request.json()) as AuthenticationResponseJSON;

    // 使用されたPasskeyを検索
    const credential = demoUser.credentials.find(cred => cred.id === body.rawId);

    // Passkeyが登録されていない場合はエラー
    if (!credential) {
      return NextResponse.json(
        {error: 'Authenticator is not registered with this site. Please register first.'},
        {status: 400},
      );
    }

    // SimpleWebAuthnを使用してレスポンスを検証
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: demoUser.currentChallenge,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: rpId,
      credential,
      requireUserVerification: false,
    });

    const {verified, authenticationInfo} = verification;

    // 認証が成功した場合、カウンターを更新
    if (verified && authenticationInfo) {
      credential.counter = authenticationInfo.newCounter;
    }

    return NextResponse.json({
      verified,
      user: demoUser,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Authentication verification failed:', errorMessage);
    return NextResponse.json(
      {error: `Authentication verification failed: ${errorMessage}`},
      {status: 400},
    );
  }
}
