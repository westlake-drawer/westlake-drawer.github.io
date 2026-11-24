import React from 'react';
import clsx from 'clsx';
import OriginalDocCardList from '@theme-original/DocCardList';

export default function DocCardList({className, ...props}) {
  return (
    <OriginalDocCardList
      {...props}
      className={clsx('auto-doc-index', className)}
    />
  );
}
