import React from 'react';
import Tabs from '@theme/Tabs';
import {useLang} from '@site/src/features/i18n';

/** Tabs that follow the site language; the tab bar itself is hidden by CSS. */
export default function LangTabs({children}) {
  const {lang} = useLang();
  return (
    <div className="lang-tabs">
      <Tabs key={lang} defaultValue={lang === 'zh' ? 'zh' : 'en'}>
        {children}
      </Tabs>
    </div>
  );
}
