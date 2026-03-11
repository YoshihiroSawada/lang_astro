/**
 * scripts/fetch-translations.mjs
 *
 * Google Apps Script で公開したWebアプリURLから翻訳データを取得し、
 * ロケールごとのJSONファイルに保存するスクリプト。
 * ビルド前に `npm run fetch-translations` として実行される。
 *
 * 取得元:
 *   1. Google Apps Script Web App  (GAS_ENDPOINT を設定)
 *   2. モックデータ                (環境変数未設定時のフォールバック / 開発用)
 *
 * GAS側のレスポンス形式（フラットなキーバリュー）:
 * {
 *   "ja": { "hero.title": "ようこそ", "nav.home": "ホーム", ... },
 *   "en": { "hero.title": "Welcome",  "nav.home": "Home",   ... },
 *   "fr": { "hero.title": "Bienvenue","nav.home": "Accueil",... }
 * }
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../src/i18n');

// ─────────────────────────────────────────────
// 1. Google Apps Script Web App から取得
// ─────────────────────────────────────────────
async function fetchFromGAS() {
  const endpoint = process.env.GAS_ENDPOINT;

  console.log('📊 Google Apps Script から翻訳データを取得中...');
  console.log(`   URL: ${endpoint}\n`);

  const res = await fetch(endpoint, {
    // GASのリダイレクトに追従する
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`GAS fetch error: ${res.status} ${res.statusText}`);

  // GASは稀にHTMLエラーページを返すことがあるため、Content-Typeを確認
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const body = await res.text();
    throw new Error(`GASからJSONが返りませんでした。\nContent-Type: ${contentType}\n本文(先頭200文字): ${body.slice(0, 200)}`);
  }

  // フラット形式: { "ja": { "hero.title": "ようこそ", ... }, ... }
  const flat = await res.json();

  // ドット記法のキーをネストされたオブジェクトに変換
  const translations = {};
  for (const [locale, keys] of Object.entries(flat)) {
    translations[locale] = {};
    for (const [key, value] of Object.entries(keys)) {
      setNestedKey(translations[locale], key, String(value));
    }
  }

  return translations;
}

// ─────────────────────────────────────────────
// 2. 開発・デモ用モックデータ
// ─────────────────────────────────────────────
function getMockTranslations() {
  console.log('🎭 モックデータを使用します（開発用）');
  console.log('   本番では GAS_ENDPOINT を .env に設定してください\n');

  return {
    ja: {
      nav: {
        home:     'ホーム',
        about:    '私たちについて',
        services: 'サービス',
        contact:  'お問い合わせ',
      },
      hero: {
        title:    'ようこそ',
        subtitle: 'スプレッドシート駆動の多言語サイト',
        cta:      '詳しく見る',
      },
      features: {
        title: '特徴',
        items: [
          { title: 'スプレッドシート管理',    description: '翻訳データをGoogleスプレッドシートで一元管理。エンジニア不要で翻訳を更新できます。' },
          { title: '自動ビルド',             description: 'GitHub ActionsでGASから最新の翻訳データを取得してビルドします。' },
          { title: 'Astro製',               description: '静的サイトジェネレーターAstroを使い、高速で最適化されたサイトを生成します。' },
        ],
      },
      footer: {
        rights: '© 2025 多言語サンプル. All rights reserved.',
        lang:   '言語を選択',
      },
      meta: {
        description: 'GASで翻訳を管理するAstro多言語サイトのサンプル',
      },
    },

    en: {
      nav: {
        home:     'Home',
        about:    'About',
        services: 'Services',
        contact:  'Contact',
      },
      hero: {
        title:    'Welcome',
        subtitle: 'Spreadsheet-driven Multilingual Site',
        cta:      'Learn More',
      },
      features: {
        title: 'Features',
        items: [
          { title: 'Spreadsheet Management', description: 'Manage all translations centrally in Google Sheets. No engineers needed to update copy.' },
          { title: 'Automated Builds',        description: 'GitHub Actions fetches the latest translations from GAS before each build.' },
          { title: 'Built with Astro',        description: 'Using the static site generator Astro to produce fast, optimized sites.' },
        ],
      },
      footer: {
        rights: '© 2025 i18n Sample. All rights reserved.',
        lang:   'Select Language',
      },
      meta: {
        description: 'Sample Astro multilingual site with GAS-managed translations',
      },
    },

    fr: {
      nav: {
        home:     'Accueil',
        about:    'À propos',
        services: 'Services',
        contact:  'Contact',
      },
      hero: {
        title:    'Bienvenue',
        subtitle: 'Site multilingue piloté par tableur',
        cta:      'En savoir plus',
      },
      features: {
        title: 'Fonctionnalités',
        items: [
          { title: 'Gestion par tableur',  description: 'Gérez toutes les traductions dans Google Sheets, sans développeur.' },
          { title: 'Builds automatisés',   description: 'GitHub Actions récupère les dernières traductions depuis GAS avant chaque build.' },
          { title: 'Construit avec Astro', description: "Utilisation d'Astro pour produire des sites rapides et optimisés." },
        ],
      },
      footer: {
        rights: '© 2025 Exemple i18n. Tous droits réservés.',
        lang:   'Choisir la langue',
      },
      meta: {
        description: 'Exemple de site multilingue Astro avec traductions gérées par GAS',
      },
    },
  };
}

// ─────────────────────────────────────────────
// ユーティリティ: "a.b.c" → { a: { b: { c: value } } }
// ─────────────────────────────────────────────
function setNestedKey(obj, dotKey, value) {
  const keys = dotKey.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

// ─────────────────────────────────────────────
// メイン処理
// ─────────────────────────────────────────────
async function main() {
  console.log('🌍 翻訳データの取得を開始します...\n');

  let translations;

  try {
    if (process.env.GAS_ENDPOINT) {
      translations = await fetchFromGAS();
    } else {
      translations = getMockTranslations();
    }
  } catch (err) {
    console.error('⚠️  GASからの取得に失敗しました。モックデータにフォールバックします。');
    console.error(`   エラー: ${err.message}\n`);
    translations = getMockTranslations();
  }

  // ロケールごとにJSONファイルを出力
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const [locale, data] of Object.entries(translations)) {
    const filePath = path.join(OUTPUT_DIR, `${locale}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ ${filePath} を出力しました`);
  }

  // 全ロケールを統合したindex.tsも生成
  const indexContent = Object.keys(translations)
    .map(locale => `export { default as ${locale} } from './${locale}.json';`)
    .join('\n') + '\n';
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.ts'), indexContent, 'utf-8');

  console.log('\n🎉 翻訳データの取得が完了しました！\n');
}

main().catch(err => {
  console.error('❌ 翻訳の取得中にエラーが発生しました:', err);
  process.exit(1);
});

