import React from 'react';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDateTimeFormat} from '@docusaurus/theme-common/internal';
import {useLang} from '@site/src/features/i18n';

export default function LastUpdated({lastUpdatedAt, lastUpdatedBy}) {
  const {lang} = useLang();
  const zh = lang === 'zh';
  const dateTimeFormat = useDateTimeFormat({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  if (!lastUpdatedAt && !lastUpdatedBy) return null;
  const atDate = lastUpdatedAt ? new Date(lastUpdatedAt) : null;
  return (
    <span className={ThemeClassNames.common.lastUpdated}>
      {zh ? '最后更新于 ' : 'Last updated on '}
      {atDate && (
        <b>
          <time dateTime={atDate.toISOString()} itemProp="dateModified">
            {dateTimeFormat.format(atDate)}
          </time>
        </b>
      )}
      {lastUpdatedBy && (zh ? ` · ${lastUpdatedBy}` : ` by ${lastUpdatedBy}`)}
    </span>
  );
}
