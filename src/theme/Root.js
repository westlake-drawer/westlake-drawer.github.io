import React from 'react';
import {LanguageProvider} from '@site/src/features/i18n';

export default function Root({children}) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
