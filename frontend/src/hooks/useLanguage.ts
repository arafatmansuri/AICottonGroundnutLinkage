import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { t as translate } from '../i18n';

/**
 * Returns a `t(key)` function bound to the current UI language,
 * plus the raw language code for cases that need it directly.
 */
export function useLanguage() {
  const language = useSelector((s: RootState) => s.ui.language);
  const t = (key: string) => translate(key, language);
  return { t, language };
}
