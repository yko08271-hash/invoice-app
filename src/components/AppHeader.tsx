'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AppHeader({ userEmail }: { userEmail: string }) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <header className="no-print bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <Link href="/dashboard" className="font-bold text-gray-800 text-lg">
          請求書作成アプリ
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
            一覧
          </Link>
          <Link href="/invoices/new" className="text-gray-600 hover:text-blue-600">
            新規作成
          </Link>
          <Link href="/settings" className="text-gray-600 hover:text-blue-600">
            自社設定
          </Link>
          <span className="hidden sm:inline text-gray-400">|</span>
          <span className="hidden sm:inline text-gray-500 truncate max-w-[10rem]">{userEmail}</span>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  );
}
