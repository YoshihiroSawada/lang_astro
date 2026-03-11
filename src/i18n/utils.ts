/**
 * src/i18n/utils.ts
 *
 * 翻訳ユーティリティ。Astroコンポーネント内で useTranslations() を呼び出すだけで
 * 型安全な翻訳関数 t() が得られる。
 *
 * 使用例:
 *   const t = useTranslations(locale);
 *   t('hero.title')          // => 'ようこそ'
 *   t('features.items.0.title') // => 'スプレッドシート管理'
 */

// ビルド時に fetch-translations.mjs が生成するJSON
import ja from './ja.json';
import en from './en.json';
import fr from './fr.json';

export const SUPPORTED_LOCALES = ['ja', 'en', 'fr'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'ja';

// ロケールマップ
const translations: Record<Locale, Record<string, unknown>> = { ja, en, fr };

/**
 * ロケールに対応する翻訳関数を返す。
 * キーはドット記法 ('hero.title') または配列インデックス ('features.items.0.title') が使える。
 */
export function useTranslations(locale: Locale) {
  return function t(key: string, fallback?: string): string {
    const parts = key.split('.');
    let value: unknown = translations[locale] ?? translations[DEFAULT_LOCALE];

    for (const part of parts) {
      if (value === null || typeof value !== 'object') {
        value = undefined;
        break;
      }
      value = (value as Record<string, unknown>)[part];
    }

    if (typeof value === 'string') return value;

    // フォールバック: デフォルトロケールで再試行
    if (locale !== DEFAULT_LOCALE) {
      return useTranslations(DEFAULT_LOCALE)(key, fallback);
    }

    return fallback ?? key;
  };
}

/**
 * URLパスからロケールを推定する。
 * /en/about → 'en', /about → DEFAULT_LOCALE
 */
export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  if ((SUPPORTED_LOCALES as readonly string[]).includes(first)) {
    return first as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * 同じパスを別のロケールに変換する。
 * translatePath('/about', 'en') => '/en/about'
 * translatePath('/en/about', 'ja') => '/about'
 */
export function translatePath(path: string, targetLocale: Locale): string {
  const parts = path.split('/').filter(Boolean);
  const firstPart = parts[0];

  // 先頭がロケールなら除去
  if ((SUPPORTED_LOCALES as readonly string[]).includes(firstPart)) {
    parts.shift();
  }

  if (targetLocale === DEFAULT_LOCALE) {
    return '/' + parts.join('/');
  }
  return '/' + [targetLocale, ...parts].join('/');
}

/**
 * ロケールの表示名
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
  fr: 'Français',
};
