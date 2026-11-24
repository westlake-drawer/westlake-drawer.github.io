import React from 'react';
import { useDocsSidebar, useDoc } from '@docusaurus/plugin-content-docs/client';
import DocCardList from '@theme/DocCardList';

export default function AutoDocIndex() {
  const sidebar = useDocsSidebar();
  const {metadata} = useDoc();
  const isCurrent = (item) => (item.type === 'link' && item.docId === metadata.id)
    || item.href === metadata.permalink;
  function findItems(items) {
    for (const item of items) {
      if (item.type === 'category') {
        if (isCurrent(item)) return item.items;
        const nested = findItems(item.items);
        if (nested) return nested;
      }
    }
    return undefined;
  }
  const items = findItems(sidebar?.items ?? [])
    ?? (sidebar?.items ?? []).filter((item) => !isCurrent(item));

  return <DocCardList items={items} />;
}
