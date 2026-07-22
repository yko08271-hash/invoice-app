import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '請求書作成アプリ',
  description: '請求書の作成・管理・PDF出力',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
