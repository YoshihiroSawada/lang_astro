# Astro × スプレッドシート 多言語サイト サンプル

スプレッドシート（Google Sheets）をコンテンツソースとして、  
ビルド時に翻訳データを取得してAstroの多言語サイトを生成するサンプルプロジェクトです。

---

## ✨ 仕組み

```
スプレッドシート (Google Sheets)
        ↓ Sheets API v4
scripts/fetch-translations.mjs  ← npm run build の前に実行
        ↓
src/i18n/ja.json / en.json / fr.json  ← 自動生成
        ↓
Astro ビルド  →  /（日本語）/ /en/ / /fr/  の静的HTMLを生成
```

翻訳担当者はスプレッドシートを更新するだけ。  
エンジニアはコードを一切触らずに多言語テキストを更新できます。

---

## 📋 スプレッドシートのフォーマット

| key | ja | en | fr |
|-----|----|----|-----|
| hero.title | ようこそ | Welcome | Bienvenue |
| hero.subtitle | スプレッドシート駆動の… | Spreadsheet-driven… | Site multilingue… |
| nav.home | ホーム | Home | Accueil |
| features.items.0.title | スプレッドシート管理 | Spreadsheet Management | Gestion par tableur |

- **1列目**: キー（ドット記法でネスト構造を表現）
- **2列目以降**: ロケールコードをヘッダーにした翻訳テキスト
- `#` で始まる行はコメントとして無視されます

---

## 🚀 セットアップ

```bash
# 1. 依存関係のインストール
npm install

# 2. 環境変数の設定
cp .env.example .env
# .env を編集して GOOGLE_SHEETS_API_KEY と SHEET_ID を設定

# 3. 開発サーバー起動（翻訳データを自動取得してから起動）
npm run dev

# 4. 本番ビルド
npm run build
```

---

## 🔑 環境変数

`.env` ファイルに設定（または CI/CD の Secrets に登録）：

| 変数名 | 説明 |
|--------|------|
| `GAS_ENDPOINT` | GASのWebアプリ公開URL（`/exec` で終わるURL） |

> **未設定の場合**はモックデータを使用します（開発・デモ用）。

---

## 📁 ディレクトリ構成

```
astro-i18n-sample/
├── scripts/
│   └── fetch-translations.mjs   ← ① 翻訳データ取得スクリプト（ここが核心）
├── src/
│   ├── i18n/
│   │   ├── utils.ts              ← ② useTranslations() ヘルパー
│   │   ├── ja.json               ← ③ 自動生成（git管理外推奨）
│   │   ├── en.json
│   │   └── fr.json
│   ├── layouts/
│   │   └── BaseLayout.astro      ← ④ 共通レイアウト（ナビ・フッター・言語切替）
│   └── pages/
│       ├── index.astro           ← /（日本語）
│       ├── en/index.astro        ← /en/
│       └── fr/index.astro        ← /fr/
├── .github/workflows/build.yml   ← ⑤ CI/CD（毎日自動ビルド）
├── .env.example
└── astro.config.mjs
```

---

## 🌐 翻訳の使い方（コード内）

```astro
---
import { useTranslations } from '../i18n/utils';
const t = useTranslations('ja');  // or 'en', 'fr'
---

<h1>{t('hero.title')}</h1>
<p>{t('hero.subtitle')}</p>

<!-- 配列要素もドット記法でアクセス -->
<span>{t('features.items.0.title')}</span>

<!-- キーが存在しない場合のフォールバック -->
<span>{t('missing.key', 'デフォルトテキスト')}</span>
```

---

## 🚀 デプロイ（GitHub Actions → Cloudflare Pages）

GitHub の **Actions タブ → "Deploy to Cloudflare Pages" → "Run workflow"** で手動実行します。

事前に以下の Secrets / Variables をリポジトリに登録してください：

| 名前 | 種別 | 説明 |
|------|------|------|
| `GAS_ENDPOINT` | Secret | GASのWebアプリ公開URL |
| `CF_API_TOKEN` | Secret | Cloudflare APIトークン |
| `CF_ACCOUNT_ID` | Secret | CloudflareアカウントID |

実行フロー：
1. `node scripts/fetch-translations.mjs` → Google Sheets から最新の翻訳JSONを取得
2. `npx astro build` → 静的HTMLを生成
3. `wrangler pages deploy dist/` → Cloudflare Pages にデプロイ
