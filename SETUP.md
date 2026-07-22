# 請求書作成アプリ セットアップ手順

## 1. Supabase 設定

1. https://supabase.com で無料アカウント作成
2. 新規プロジェクト作成
3. **SQL Editor** を開き `supabase/schema.sql` の内容を貼り付けて実行
4. **Authentication → Users** から自分用のログインアカウントを手動で追加
   - 「Invite user」でメールアドレス＋パスワードを設定（このアプリはこのアカウントでのみログインできます）
5. **Settings → API** から以下をメモ
   - Project URL
   - anon public key

## 2. ローカル開発

```bash
cd invoice-app
npm install
cp .env.example .env.local
# .env.local に Project URL と anon key を設定
npm run dev
```

ブラウザで `http://localhost:3000` を開き、手順1で作成したアカウントでログインします。

## 3. Vercel デプロイ（スマホ含めどこからでも使えるようにする場合）

1. https://vercel.com で無料アカウント作成（GitHubログイン推奨）
2. このフォルダを GitHub にプッシュ
3. Vercel で「New Project」→ GitHubリポジトリを選択
4. **Environment Variables** に以下を設定
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```
5. Deploy を実行
6. デプロイ後のURLをスマホのホーム画面に追加すると、アプリのように使えます

## 使い方

1. 初回ログイン後、右上メニューの「自社設定」から自社情報・振込先を登録
2. 「新規作成」から請求書を作成（品目ごとに数量・単価・税率(8%/10%)を入力すると自動計算されます）
3. 保存すると請求書詳細画面が開くので「PDFダウンロード」でPDFを保存
4. 「一覧」から過去の請求書をいつでも確認・編集・削除できます

## データベース構成

- `company_settings`：自社情報・振込先（1件のみ使用、全請求書で共通）
- `invoices`：請求書本体（請求先・金額・日付など）
- `invoice_items`：請求書の明細行（品目・数量・単価・税率）

税率が混在する請求書にも対応しており、8%・10%それぞれの小計と消費税を分けて自動計算します（インボイス制度対応）。

## 補足：OneDriveフォルダでの開発について

このプロジェクトはOneDrive同期フォルダ内にあります。`node_modules`（依存パッケージ、数千ファイル）をOneDrive経由で同期させるとファイル破損やビルドエラーが起きやすいため、実体は `C:\Users\seiwa\dev-cache\invoice-app\node_modules` に置き、`invoice-app\node_modules` からはジャンクション（ショートカットのようなもの）で参照する構成にしてあります。

- 普段の `npm run dev` の起動には影響ありません。
- 新しいパッケージを追加する場合は、`invoice-app` フォルダで直接 `npm install` すると、このジャンクションが壊れて再びOneDrive直下に展開されてしまいます。パッケージ追加が必要なときはClaude Codeに依頼してください。
