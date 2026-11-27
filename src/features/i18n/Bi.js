import React from 'react';
import {useLang} from '@site/src/features/i18n';

function renderInline(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index}>{part.slice(1, -1)}</code>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
}

/** Inline bilingual text; markdown emphasis and code inside the strings are rendered. */
export default function Bi({en, zh, children}) {
  const {lang} = useLang();
  const value = lang === 'zh' && zh ? zh : en ?? children ?? '';
  return <>{renderInline(value)}</>;
}
