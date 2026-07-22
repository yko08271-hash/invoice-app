import { type NextRequest, NextResponse } from 'next/server';

// 認証チェックはサーバーコンポーネント側で実施するためミドルウェアはスルー
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
