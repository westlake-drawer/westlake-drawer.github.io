const collator = new Intl.Collator('en', {sensitivity: 'base'});
const metrics = ['stars', 'forks', 'openIssues'];

export function sortSidebarByStars(items, documentRepositories, snapshots,
  pinnedIds = new Set(), documentLabels = new Map()) {
  const documentSources = (id) => documentRepositories.get(id) ?? [];
  const totals = (repositories) => metrics.map((metric) =>
    [...repositories].reduce((total, repository) => {
      const value = snapshots[repository]?.info?.[metric];
      return total + (Number.isSafeInteger(value) && value >= 0 ? value : 0);
    }, 0));
  const rank = (siblings, pinned = new Set()) => {
    const ranked = siblings.map((item) => {
      let sources = [];
      let sortedItem = item;
      if (item.type === 'category') {
        const children = rank(item.items);
        sources = [...children.repositories];
        if (item.link?.type === 'doc') sources.push(...documentSources(item.link.id));
        sortedItem = {...item, items: children.items};
      } else if (item.type === 'doc' || item.type === 'ref') {
        sources = documentSources(item.id);
      }
      // Union repository identities before scoring, not child totals.
      const repositories = new Set(sources.map((repository) => repository.toLowerCase()));
      const scores = totals(repositories);
      if (['category', 'doc', 'ref'].includes(item.type)) {
        sortedItem = {
          ...sortedItem,
          customProps: {
            ...sortedItem.customProps,
            repositoryStats: {stars: scores[0], forks: scores[1]},
          },
        };
      }
      return {
        item: sortedItem, repositories, totals: scores,
        label: item.label ?? documentLabels.get(item.id) ?? item.id ?? item.href ?? '',
        key: item.id ?? item.link?.id ?? item.link?.slug ?? item.href ?? item.label ?? '',
        pinned: (item.type === 'doc' || item.type === 'ref') && pinned.has(item.id),
      };
    });
    ranked.sort((a, b) => Number(b.pinned) - Number(a.pinned)
      || b.totals[0] - a.totals[0]
      || b.totals[1] - a.totals[1]
      || b.totals[2] - a.totals[2]
      || collator.compare(a.label, b.label)
      || collator.compare(a.key, b.key)
      || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    return {
      items: ranked.map(({item}) => item),
      repositories: new Set(ranked.flatMap(({repositories}) => [...repositories])),
    };
  };
  return rank(items, pinnedIds).items;
}
