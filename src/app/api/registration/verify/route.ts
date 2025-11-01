/**
 * ブラウザから navigator.credentials.create() の結果を受け取り、
 * サーバー側で検証してPasskeyを保存する
 */

import {type NextRequest, NextResponse} from 'next/server';
import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import {demoUser, origin, rpId} from '@/env';

export async function POST(request: NextRequest) {
  try {
    if (!demoUser.currentChallenge) {
      return NextResponse.json(
        {error: 'No challenge found for user'},
        {status: 400},
      );
    }

    const body = (await request.json()) as RegistrationResponseJSON;

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: demoUser.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
      // https://simplewebauthn.dev/docs/advanced/passkeys#verifyregistrationresponse
      // https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification
      requireUserVerification: false,
    });

    const {verified, registrationInfo} = verification;

    // 登録が成功した場合、認証情報を保存
    if (verified && registrationInfo) {
      const {credential} = registrationInfo;
      // 新しい認証情報をユーザーのcredentials配列に追加
      demoUser.credentials.push({
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: body.response.transports,
      });
    }

    return NextResponse.json({
      verified,
      user: demoUser,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Registration verification failed:', errorMessage);
    return NextResponse.json(
      {error: `Registration verification failed: ${errorMessage}`},
      {status: 400},
    );
  }
}
