import React from 'react';
import {ThemeClassNames} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import IconEdit from '@theme/Icon/Edit';
import {useLang} from '@site/src/features/i18n';

export default function EditThisPage({editUrl}) {
  const {lang} = useLang();
  return (
    <Link to={editUrl} className={ThemeClassNames.common.editThisPage}>
      <IconEdit />
      {lang === 'zh' ? '编辑此页' : 'Edit this page'}
    </Link>
  );
}
