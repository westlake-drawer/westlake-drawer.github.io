import React from 'react';
import {useLang} from '@site/src/features/i18n';

/** Inline bilingual text: renders the Chinese string when the site language is zh. */
export default function Bi({en, zh, children}) {
  const {lang} = useLang();
  if (lang === 'zh' && zh) return <>{zh}</>;
  if (en) return <>{en}</>;
  return <>{children}</>;
}
