import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('user_session', '', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('company_id', '', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
