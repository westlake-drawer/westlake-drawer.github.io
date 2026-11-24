export const documentViews = [
  {value: 'overview', label: 'Overview'},
  {value: 'pdf', label: 'PDF'},
  {value: 'readme', label: 'README'},
  {value: 'contributing', label: 'Contributing'},
  {value: 'license', label: 'License'},
];

export function getPdfDocuments(customDocuments = []) {
  const seen = new Set();
  return customDocuments.flatMap((tab) => tab.documents ?? [tab]).flatMap((document) => {
    const source = document.pdfSource ?? document.outline?.source;
    if (!source || seen.has(source.url)) return [];
    seen.add(source.url);
    return [{
      id: document.scope ?? document.id, label: source.label, pdfSource: source,
      local: true, status: 'ready', preview: true,
    }];
  });
}

export function getDocumentViews(customDocuments = []) {
  const custom = customDocuments.map(({id, label}) => ({value: id, label}));
  return [
    documentViews[0],
    ...custom.filter(({value}) => value === 'toc'),
    ...documentViews.slice(1).filter(({value}) => value !== 'pdf' || getPdfDocuments(customDocuments).length),
    ...custom.filter(({value}) => value !== 'toc'),
  ];
}

export function resolveCustomDocument(customDocuments, view, search, hash) {
  const tab = view === 'pdf' ? {documents: getPdfDocuments(customDocuments)}
    : customDocuments.find(({id}) => id === view);
  const documents = tab?.documents ?? [];
  const requested = new URLSearchParams(search).get('document');
  const selected = [...documents].sort((a, b) => (b.scope?.length ?? 0) - (a.scope?.length ?? 0))
    .find(({scope}) => scope && hash.startsWith(`#${scope}-`))
    ?? documents.find(({id}) => id === requested)
    ?? documents[0];
  return {documentData: selected ?? tab, documents, selectedDocument: selected?.id};
}

export function resolveDocumentView(repositories, search, hash, views = documentViews) {
  const params = new URLSearchParams(search);
  const fragmentView = [...views].sort((a, b) => b.value.length - a.value.length).find(({value}) =>
    value !== 'overview' && hash.startsWith(`#${value}-`))?.value;
  const view = fragmentView ?? (views.some(({value}) => value === params.get('view'))
    ? params.get('view') : 'overview');
  const repository = repositories.find((name) =>
    fragmentView && hash.startsWith(`#${fragmentView}-${name.replaceAll('/', '-')}-`))
    ?? (repositories.includes(params.get('repo')) ? params.get('repo') : repositories[0]);
  return {view, repository};
}
