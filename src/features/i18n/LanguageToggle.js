import React from 'react';
import {useLang} from '@site/src/features/i18n';
import styles from './styles.module.css';

export default function LanguageToggle() {
  const {lang, setLang} = useLang();
  const next = lang === 'en' ? 'zh' : 'en';
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setLang(next)}
      title={lang === 'en' ? '切换为中文' : 'Switch to English'}
      aria-label={lang === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-2.3a15.6 15.6 0 0 0-1.2-3.1A8 8 0 0 1 18.9 8ZM12 4c.8 1.1 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.9 1.9-4ZM4.3 14a8.2 8.2 0 0 1 0-4h2.6a17 17 0 0 0 0 4H4.3Zm.8 2h2.3c.3 1.1.7 2.2 1.2 3.1A8 8 0 0 1 5.1 16Zm2.3-8H5.1a8 8 0 0 1 3.5-3.1A15.6 15.6 0 0 0 7.4 8ZM12 20c-.8-1.1-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.9-1.9 4Zm2.3-6H9.7a14.6 14.6 0 0 1 0-4h4.6a14.6 14.6 0 0 1 0 4Zm.4 5.1c.5-.9.9-2 1.2-3.1h2.3a8 8 0 0 1-3.5 3.1Zm1.6-5.1a17 17 0 0 0 0-4h2.6a8.2 8.2 0 0 1 0 4h-2.6Z" fill="currentColor"/>
      </svg>
      <span>{lang === 'en' ? 'EN' : '中'}</span>
    </button>
  );
}
